import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMeters } from "@/hooks/useMeters";
import { useAuth } from "@/hooks/useAuth";
import { format, parse, isValid } from "date-fns";
import { de } from "date-fns/locale";
import * as XLSX from "xlsx";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
}

interface ValidationResult {
  rowNumber: number;
  meterNumber: string;
  date: string;
  value: number;
  meterId?: string;
  status: "valid" | "warning" | "error";
  message?: string;
}

const EXAMPLE_CSV = `Zählernummer;Datum;Stand;Notiz
STR-001;15.01.2024;12345,67;Jahresablesung
STR-001;15.02.2024;12456,78;
GAS-001;15.01.2024;5678,90;`;

export function CSVImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: CSVImportDialogProps) {
  const { user } = useAuth();
  const { meters } = useMeters();
  
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState({
    meterNumber: "",
    date: "",
    value: "",
    notes: "",
  });
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Stats from validation
  const stats = useMemo(() => {
    const valid = validationResults.filter((r) => r.status === "valid").length;
    const warnings = validationResults.filter((r) => r.status === "warning").length;
    const errors = validationResults.filter((r) => r.status === "error").length;
    const uniqueMeters = new Set(validationResults.filter((r) => r.meterId).map((r) => r.meterId)).size;
    const dates = validationResults.filter((r) => r.status !== "error").map((r) => r.date).filter(Boolean);
    const minDate = dates.length > 0 ? dates.reduce((a, b) => (a < b ? a : b)) : null;
    const maxDate = dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null;
    
    return { valid, warnings, errors, uniqueMeters, minDate, maxDate };
  }, [validationResults]);

  const parseFile = useCallback(async (file: File) => {
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      let data: string[][] = [];

      if (extension === "xlsx" || extension === "xls") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
      } else {
        const text = await file.text();
        const separator = text.includes(";") ? ";" : ",";
        data = text.split("\n").map((line) => line.split(separator).map((cell) => cell.trim().replace(/^"|"$/g, "")));
      }

      if (data.length < 2) {
        toast.error("Datei enthält keine Daten");
        return;
      }

      const headers = data[0].map((h) => String(h || "").trim());
      setColumns(headers);

      const rows: ParsedRow[] = data.slice(1).filter((row) => row.some((cell) => cell)).map((row, index) => ({
        rowNumber: index + 2,
        data: headers.reduce((acc, header, i) => {
          acc[header] = String(row[i] || "").trim();
          return acc;
        }, {} as Record<string, string>),
      }));

      setParsedData(rows);

      // Auto-detect column mapping
      const lowerHeaders = headers.map((h) => h.toLowerCase());
      setColumnMapping({
        meterNumber: headers[lowerHeaders.findIndex((h) => h.includes("zähler") || h.includes("nummer") || h === "meter")] || "",
        date: headers[lowerHeaders.findIndex((h) => h.includes("datum") || h === "date")] || "",
        value: headers[lowerHeaders.findIndex((h) => h.includes("stand") || h.includes("wert") || h === "value")] || "",
        notes: headers[lowerHeaders.findIndex((h) => h.includes("notiz") || h.includes("note") || h.includes("bemerkung"))] || "",
      });

      setFile(file);
      setStep(2);
    } catch (error) {
      console.error("Parse error:", error);
      toast.error("Fehler beim Lesen der Datei");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndParseFile(droppedFile);
    }
  }, []);

  const validateAndParseFile = (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [".csv", ".xlsx", ".xls"];
    const extension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(extension)) {
      toast.error("Nur CSV und Excel-Dateien erlaubt");
      return;
    }

    if (file.size > maxSize) {
      toast.error("Datei ist zu groß (max. 5MB)");
      return;
    }

    parseFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndParseFile(selectedFile);
    }
  };

  const downloadExample = () => {
    const blob = new Blob([EXAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "zaehler-import-beispiel.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const validateData = useCallback(() => {
    const results: ValidationResult[] = [];

    for (const row of parsedData) {
      const meterNumber = row.data[columnMapping.meterNumber];
      const dateStr = row.data[columnMapping.date];
      const valueStr = row.data[columnMapping.value];

      // Parse date (DD.MM.YYYY format)
      let parsedDate: Date | null = null;
      if (dateStr) {
        parsedDate = parse(dateStr, "dd.MM.yyyy", new Date());
        if (!isValid(parsedDate)) {
          parsedDate = parse(dateStr, "yyyy-MM-dd", new Date());
        }
      }

      // Parse value
      const value = parseFloat(valueStr?.replace(",", ".") || "");

      // Find meter
      const meter = meters.find((m) => m.meter_number.toLowerCase() === meterNumber?.toLowerCase());

      let status: "valid" | "warning" | "error" = "valid";
      let message = "";

      if (!meterNumber) {
        status = "error";
        message = "Zählernummer fehlt";
      } else if (!dateStr || !parsedDate || !isValid(parsedDate)) {
        status = "error";
        message = "Ungültiges Datum";
      } else if (isNaN(value)) {
        status = "error";
        message = "Ungültiger Zählerstand";
      } else if (!meter) {
        status = "warning";
        message = "Zähler nicht gefunden";
      }

      results.push({
        rowNumber: row.rowNumber,
        meterNumber: meterNumber || "",
        date: parsedDate && isValid(parsedDate) ? format(parsedDate, "yyyy-MM-dd") : "",
        value,
        meterId: meter?.id,
        status,
        message,
      });
    }

    setValidationResults(results);
    setStep(3);
  }, [parsedData, columnMapping, meters]);

  const handleImport = async () => {
    const validRows = validationResults.filter((r) => r.status === "valid");
    if (validRows.length === 0) {
      toast.error("Keine gültigen Zeilen zum Importieren");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        if (overwriteExisting) {
          // Delete existing reading for same meter and date
          await supabase
            .from("meter_readings")
            .delete()
            .eq("meter_id", row.meterId!)
            .eq("reading_date", row.date);
        }

        const notes = parsedData.find((p) => p.rowNumber === row.rowNumber)?.data[columnMapping.notes] || null;

        const { error } = await supabase.from("meter_readings").insert({
          meter_id: row.meterId!,
          reading_value: row.value,
          reading_date: row.date,
          notes,
          recorded_by: user?.id,
        });

        if (error) throw error;
        success++;
      } catch (error) {
        console.error("Import error for row", row.rowNumber, error);
        failed++;
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImportResult({ success, failed });
    setIsImporting(false);

    if (success > 0) {
      toast.success(`${success} Ablesung(en) importiert`);
      onSuccess?.();
    }

    if (failed > 0) {
      toast.error(`${failed} Zeile(n) fehlgeschlagen`);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setParsedData([]);
    setColumns([]);
    setColumnMapping({ meterNumber: "", date: "", value: "", notes: "" });
    setValidationResults([]);
    setOverwriteExisting(false);
    setIsImporting(false);
    setImportProgress(0);
    setImportResult(null);
    onOpenChange(false);
  };

  const canProceed = useMemo(() => {
    if (step === 2) {
      return columnMapping.meterNumber && columnMapping.date && columnMapping.value;
    }
    if (step === 3) {
      return stats.valid > 0;
    }
    return true;
  }, [step, columnMapping, stats.valid]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            CSV Import
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Laden Sie eine CSV- oder Excel-Datei mit Zählerständen hoch."}
            {step === 2 && "Ordnen Sie die Spalten den entsprechenden Feldern zu."}
            {step === 3 && "Überprüfen Sie die Validierungsergebnisse."}
            {step === 4 && "Bestätigen Sie den Import."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={cn(
                    "w-16 h-1 mx-2",
                    step > s ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Datei hierher ziehen
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                oder
              </p>
              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  Datei auswählen
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                CSV, XLSX (max. 5MB)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="link" size="sm" onClick={downloadExample}>
                <Download className="h-4 w-4 mr-2" />
                Beispiel-CSV herunterladen
              </Button>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Erforderliche Spalten:</strong> Zählernummer, Datum (DD.MM.YYYY), Stand
                <br />
                <strong>Optionale Spalten:</strong> Notiz
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zählernummer *</Label>
                <Select
                  value={columnMapping.meterNumber}
                  onValueChange={(v) => setColumnMapping((m) => ({ ...m, meterNumber: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Spalte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Datum *</Label>
                <Select
                  value={columnMapping.date}
                  onValueChange={(v) => setColumnMapping((m) => ({ ...m, date: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Spalte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zählerstand *</Label>
                <Select
                  value={columnMapping.value}
                  onValueChange={(v) => setColumnMapping((m) => ({ ...m, value: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Spalte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notiz (optional)</Label>
                <Select
                  value={columnMapping.notes}
                  onValueChange={(v) => setColumnMapping((m) => ({ ...m, notes: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keine</SelectItem>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <p className="text-sm font-medium p-3 bg-muted">Vorschau (erste 10 Zeilen)</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col} className="whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((row) => (
                      <TableRow key={row.rowNumber}>
                        {columns.map((col) => (
                          <TableCell key={col} className="whitespace-nowrap">
                            {row.data[col] || "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Validation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Gültig</span>
                </div>
                <p className="text-2xl font-bold">{stats.valid}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Warnungen</span>
                </div>
                <p className="text-2xl font-bold">{stats.warnings}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Fehler</span>
                </div>
                <p className="text-2xl font-bold">{stats.errors}</p>
              </div>
            </div>

            {(stats.warnings > 0 || stats.errors > 0) && (
              <div className="border rounded-lg overflow-hidden">
                <p className="text-sm font-medium p-3 bg-muted">Problematische Zeilen</p>
                <div className="max-h-[200px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Zeile</TableHead>
                        <TableHead>Zählernummer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Meldung</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationResults
                        .filter((r) => r.status !== "valid")
                        .map((result) => (
                          <TableRow key={result.rowNumber}>
                            <TableCell>{result.rowNumber}</TableCell>
                            <TableCell className="font-mono">{result.meterNumber || "—"}</TableCell>
                            <TableCell>
                              <Badge
                                variant={result.status === "error" ? "destructive" : "secondary"}
                              >
                                {result.status === "error" ? "Fehler" : "Warnung"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {result.message}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Import */}
        {step === 4 && (
          <div className="space-y-4">
            {!importResult ? (
              <>
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>{stats.valid}</strong> Ablesung(en) werden importiert</p>
                      <p><strong>{stats.uniqueMeters}</strong> Zähler betroffen</p>
                      {stats.minDate && stats.maxDate && (
                        <p>
                          Zeitraum: {format(new Date(stats.minDate), "dd.MM.yyyy", { locale: de })} - {format(new Date(stats.maxDate), "dd.MM.yyyy", { locale: de })}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overwrite"
                    checked={overwriteExisting}
                    onCheckedChange={(checked) => setOverwriteExisting(checked === true)}
                  />
                  <label htmlFor="overwrite" className="text-sm cursor-pointer">
                    Bestehende Ablesungen am gleichen Tag überschreiben
                  </label>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={importProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      {importProgress}% abgeschlossen
                    </p>
                  </div>
                )}
              </>
            ) : (
              <Alert className={importResult.failed > 0 ? "border-amber-500" : "border-primary"}>
                <AlertDescription>
                  <div className="text-center py-4">
                    {importResult.failed === 0 ? (
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                    ) : (
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                    )}
                    <p className="text-lg font-medium">
                      {importResult.success} von {importResult.success + importResult.failed} erfolgreich importiert
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step > 1 && step < 4 && !isImporting && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {importResult ? "Schließen" : "Abbrechen"}
            </Button>
            {step === 2 && (
              <Button onClick={validateData} disabled={!canProceed}>
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {step === 3 && (
              <Button onClick={() => setStep(4)} disabled={!canProceed}>
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {step === 4 && !importResult && (
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Importieren
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}