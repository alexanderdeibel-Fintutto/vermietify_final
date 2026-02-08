import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  FileText,
  Loader2,
  Sparkles,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────
interface ExtractedUnit {
  unit_number: string;
  floor?: number | null;
  area?: number | null;
  rooms?: number | null;
  rent_amount?: number | null;
  utility_advance?: number | null;
  status?: string;
  notes?: string | null;
  _selected?: boolean;
}

interface ExtractedBuilding {
  name: string;
  address: string;
  postal_code: string;
  city: string;
  building_type?: string;
  year_built?: number | null;
  total_area?: number | null;
  notes?: string | null;
  _selected?: boolean;
}

type ImportType = "units" | "buildings";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ImportType;
  /** Required for unit imports */
  buildingId?: string;
  organizationId?: string;
  onSuccess?: () => void;
}

type Step = "upload" | "preview" | "importing" | "done";

// ─── Helpers ─────────────────────────────────────────
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

const formatCurrency = (cents: number) =>
  `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`;

const floorLabel = (floor: number | null | undefined) => {
  if (floor === null || floor === undefined) return "-";
  if (floor === 0) return "EG";
  if (floor < 0) return `${floor}. UG`;
  return `${floor}. OG`;
};

// ─── Component ───────────────────────────────────────
export function BulkImportDialog({
  open,
  onOpenChange,
  type,
  buildingId,
  organizationId,
  onSuccess,
}: BulkImportDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedUnits, setExtractedUnits] = useState<ExtractedUnit[]>([]);
  const [extractedBuildings, setExtractedBuildings] = useState<ExtractedBuilding[]>([]);
  const [importCount, setImportCount] = useState({ success: 0, failed: 0 });

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setIsExtracting(false);
    setExtractedUnits([]);
    setExtractedBuildings([]);
    setImportCount({ success: 0, failed: 0 });
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  // ─── File handling ───
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validTypes = [
      "application/pdf",
      "text/csv",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!validTypes.includes(selected.type) && !["pdf", "csv", "txt", "xlsx"].includes(ext || "")) {
      toast({
        title: "Ungültiges Dateiformat",
        description: "Bitte laden Sie eine PDF-, CSV- oder Textdatei hoch.",
        variant: "destructive",
      });
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Die Datei darf maximal 10 MB groß sein.",
        variant: "destructive",
      });
      return;
    }

    setFile(selected);
  };

  // ─── AI Extraction ───
  const handleExtract = async () => {
    if (!file) return;
    setIsExtracting(true);

    try {
      let textContent: string;

      if (file.type === "application/pdf") {
        // For PDFs, read as base64 and send to extraction
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        const base64 = btoa(binary);
        // Send the base64 content — the edge function will handle it as text
        // For MVP we send the raw text representation
        // In production you'd use a proper PDF parser
        textContent = `[PDF-Datei: ${file.name}]\nBase64-Inhalt (die KI wird versuchen, den Text zu extrahieren):\n${base64.substring(0, 50000)}`;
      } else {
        textContent = await readFileAsText(file);
      }

      const { data, error } = await supabase.functions.invoke(
        "extract-import-data",
        {
          body: { type, content: textContent },
        }
      );

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Extraktion fehlgeschlagen. Bitte prüfen Sie, ob die Datei relevante Immobiliendaten enthält.");

      if (type === "units") {
        const units = (data.data as ExtractedUnit[]).map((u) => ({
          ...u,
          _selected: true,
        }));
        setExtractedUnits(units);
      } else {
        const buildings = (data.data as ExtractedBuilding[]).map((b) => ({
          ...b,
          _selected: true,
        }));
        setExtractedBuildings(buildings);
      }

      setStep("preview");
    } catch (err: any) {
      console.error("Extraction error:", err);
      toast({
        title: "Extraktion fehlgeschlagen",
        description: err.message || "Die Daten konnten nicht extrahiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // ─── Toggle selection ───
  const toggleUnit = (index: number) => {
    setExtractedUnits((prev) =>
      prev.map((u, i) => (i === index ? { ...u, _selected: !u._selected } : u))
    );
  };

  const toggleBuilding = (index: number) => {
    setExtractedBuildings((prev) =>
      prev.map((b, i) => (i === index ? { ...b, _selected: !b._selected } : b))
    );
  };

  const toggleAll = () => {
    if (type === "units") {
      const allSelected = extractedUnits.every((u) => u._selected);
      setExtractedUnits((prev) => prev.map((u) => ({ ...u, _selected: !allSelected })));
    } else {
      const allSelected = extractedBuildings.every((b) => b._selected);
      setExtractedBuildings((prev) => prev.map((b) => ({ ...b, _selected: !allSelected })));
    }
  };

  // ─── Import ───
  const handleImport = async () => {
    setStep("importing");
    let success = 0;
    let failed = 0;

    try {
      if (type === "units") {
        const selected = extractedUnits.filter((u) => u._selected);
        for (const unit of selected) {
          const { error } = await supabase.from("units").insert({
            building_id: buildingId!,
            unit_number: unit.unit_number || "Unbekannt",
            floor: unit.floor ?? null,
            area: unit.area ?? 0,
            rooms: unit.rooms ?? 1,
            rent_amount: unit.rent_amount ?? 0,
            utility_advance: unit.utility_advance ?? 0,
            status: (unit.status as any) || "vacant",
            notes: unit.notes ?? null,
          });
          if (error) {
            console.error("Insert unit error:", error);
            failed++;
          } else {
            success++;
          }
        }
      } else {
        const selected = extractedBuildings.filter((b) => b._selected);
        for (const building of selected) {
          const { error } = await supabase.from("buildings").insert({
            organization_id: organizationId!,
            name: building.name || "Unbenannt",
            address: building.address || "",
            postal_code: building.postal_code || "",
            city: building.city || "",
            building_type: (building.building_type as any) || "apartment",
            year_built: building.year_built ?? null,
            total_area: building.total_area ?? null,
            notes: building.notes ?? null,
          });
          if (error) {
            console.error("Insert building error:", error);
            failed++;
          } else {
            success++;
          }
        }
      }

      setImportCount({ success, failed });
      setStep("done");

      if (success > 0) {
        onSuccess?.();
      }
    } catch (err) {
      console.error("Import error:", err);
      toast({
        title: "Import-Fehler",
        description: "Beim Import ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
      setStep("preview");
    }
  };

  const selectedCount =
    type === "units"
      ? extractedUnits.filter((u) => u._selected).length
      : extractedBuildings.filter((b) => b._selected).length;

  const totalCount =
    type === "units" ? extractedUnits.length : extractedBuildings.length;

  const title =
    type === "units" ? "Einheiten importieren" : "Gebäude importieren";
  const description =
    type === "units"
      ? "Laden Sie ein PDF oder CSV mit einer Wohnungsliste hoch. Die KI extrahiert automatisch die Daten."
      : "Laden Sie ein PDF oder CSV mit einer Gebäudeliste hoch. Die KI extrahiert automatisch die Daten.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* ─── Step: Upload ─── */}
        {step === "upload" && (
          <div className="space-y-4 py-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() =>
                document.getElementById("bulk-import-file")?.click()
              }
            >
              <Input
                id="bulk-import-file"
                type="file"
                accept=".pdf,.csv,.txt,.xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Badge variant="secondary">Bereit zur Analyse</Badge>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">
                    Datei hierher ziehen oder klicken
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF, CSV oder Textdatei (max. 10 MB)
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleExtract}
                disabled={!file || isExtracting}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    KI analysiert...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Mit KI analysieren
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ─── Step: Preview ─── */}
        {step === "preview" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalCount} {type === "units" ? "Einheiten" : "Gebäude"}{" "}
                erkannt · {selectedCount} ausgewählt
              </p>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedCount === totalCount
                  ? "Alle abwählen"
                  : "Alle auswählen"}
              </Button>
            </div>

            <div className="border rounded-lg overflow-auto max-h-[50vh]">
              {type === "units" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Nr.</TableHead>
                      <TableHead>Etage</TableHead>
                      <TableHead>m²</TableHead>
                      <TableHead>Zimmer</TableHead>
                      <TableHead>Kaltmiete</TableHead>
                      <TableHead>NK</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedUnits.map((unit, i) => (
                      <TableRow
                        key={i}
                        className={!unit._selected ? "opacity-50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={unit._selected}
                            onCheckedChange={() => toggleUnit(i)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {unit.unit_number}
                        </TableCell>
                        <TableCell>{floorLabel(unit.floor)}</TableCell>
                        <TableCell>
                          {unit.area ? `${unit.area} m²` : "-"}
                        </TableCell>
                        <TableCell>{unit.rooms ?? "-"}</TableCell>
                        <TableCell>
                          {unit.rent_amount
                            ? formatCurrency(unit.rent_amount)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {unit.utility_advance
                            ? formatCurrency(unit.utility_advance)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              unit.status === "rented"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {unit.status === "rented" ? "Vermietet" : "Frei"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>PLZ</TableHead>
                      <TableHead>Stadt</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Baujahr</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedBuildings.map((building, i) => (
                      <TableRow
                        key={i}
                        className={!building._selected ? "opacity-50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={building._selected}
                            onCheckedChange={() => toggleBuilding(i)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {building.name}
                        </TableCell>
                        <TableCell>{building.address}</TableCell>
                        <TableCell>{building.postal_code}</TableCell>
                        <TableCell>{building.city}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {building.building_type === "apartment"
                              ? "MFH"
                              : building.building_type === "house"
                              ? "EFH"
                              : building.building_type === "commercial"
                              ? "Gewerbe"
                              : building.building_type === "mixed"
                              ? "Gemischt"
                              : building.building_type || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>{building.year_built ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Zurück
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0}>
                <Check className="h-4 w-4 mr-2" />
                {selectedCount} {type === "units" ? "Einheiten" : "Gebäude"}{" "}
                importieren
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ─── Step: Importing ─── */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium">Import läuft...</p>
            <p className="text-sm text-muted-foreground">
              Bitte warten Sie, bis alle Datensätze importiert wurden.
            </p>
          </div>
        )}

        {/* ─── Step: Done ─── */}
        {step === "done" && (
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center gap-4 text-center">
              {importCount.failed === 0 ? (
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-6 w-6 text-primary" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              )}

              <div>
                <p className="text-lg font-semibold">Import abgeschlossen</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importCount.success} erfolgreich importiert
                  {importCount.failed > 0 && (
                    <>, {importCount.failed} fehlgeschlagen</>
                  )}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>
                Schließen
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
