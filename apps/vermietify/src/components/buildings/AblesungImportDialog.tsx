import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Flame,
  Droplet,
  Thermometer,
  Gauge,
  Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { MeterType } from "@/hooks/useMeters";

const METER_ICONS: Record<string, React.ElementType> = {
  electricity: Zap, strom: Zap,
  gas: Flame,
  water: Droplet, wasser: Droplet,
  heating: Thermometer, heizung: Thermometer,
};

const METER_LABELS: Record<string, string> = {
  electricity: "Strom", strom: "Strom",
  gas: "Gas",
  water: "Wasser", wasser: "Wasser",
  heating: "Heizung", heizung: "Heizung",
};

interface AblesungMeter {
  id: string;
  meter_number: string;
  meter_type: string;
  installation_date: string | null;
  unit_name: string | null;
  building_name: string | null;
  latest_reading?: {
    reading_value: number;
    reading_date: string;
  } | null;
  _selected?: boolean;
  _targetUnitId?: string;
}

interface AblesungBuilding {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  meters: AblesungMeter[];
}

interface AblesungImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  units: Array<{ id: string; unit_number: string }>;
  onSuccess?: () => void;
}

export function AblesungImportDialog({
  open,
  onOpenChange,
  buildingId,
  units,
  onSuccess,
}: AblesungImportDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"loading" | "select" | "importing" | "done">("loading");
  const [buildings, setBuildings] = useState<AblesungBuilding[]>([]);
  const [meters, setMeters] = useState<AblesungMeter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; failed: number } | null>(null);

  const handleOpen = async (isOpen: boolean) => {
    if (isOpen) {
      setStep("loading");
      setError(null);
      setMeters([]);
      setBuildings([]);
      setImportResult(null);
      
      try {
        const { data, error: fnError } = await supabase.functions.invoke("fetch-ablesung-data", {
          body: { buildingId },
        });

        if (fnError) throw fnError;
        if (!data?.success) throw new Error(data?.error || "Keine Daten gefunden");

        setBuildings(data.buildings || []);
        
        // Flatten all meters from all buildings
        const allMeters: AblesungMeter[] = (data.buildings || []).flatMap(
          (b: AblesungBuilding) =>
            b.meters.map((m) => ({
              ...m,
              building_name: b.name,
              _selected: true,
              _targetUnitId: units.length === 1 ? units[0].id : "",
            }))
        );
        
        setMeters(allMeters);
        setStep("select");
      } catch (err: any) {
        console.error("Ablesung fetch error:", err);
        setError(
          err.message?.includes("not found") || err.message?.includes("Kein Account")
            ? "Kein Ablesung-App-Account mit dieser E-Mail-Adresse gefunden."
            : err.message || "Fehler beim Laden der Daten"
        );
        setStep("select");
      }
    }
    onOpenChange(isOpen);
  };

  const toggleMeter = (index: number) => {
    setMeters((prev) =>
      prev.map((m, i) => (i === index ? { ...m, _selected: !m._selected } : m))
    );
  };

  const setTargetUnit = (index: number, unitId: string) => {
    setMeters((prev) =>
      prev.map((m, i) => (i === index ? { ...m, _targetUnitId: unitId } : m))
    );
  };

  const selectedMeters = meters.filter((m) => m._selected && m._targetUnitId);

  const handleImport = async () => {
    if (selectedMeters.length === 0) return;

    setIsImporting(true);
    let created = 0;
    let skipped = 0;
    let failed = 0;

    const mapMeterType = (t: string): MeterType => {
      const map: Record<string, MeterType> = { strom: "electricity", wasser: "water", heizung: "heating" };
      return (map[t] || t) as MeterType;
    };

    for (const meter of selectedMeters) {
      const mappedType = mapMeterType(meter.meter_type);
      try {
        // Check if meter already exists
        const { data: existing } = await supabase
          .from("meters")
          .select("id")
          .eq("unit_id", meter._targetUnitId!)
          .eq("meter_number", meter.meter_number)
          .eq("meter_type", mappedType);

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        // Create meter
        const { data: newMeter, error: meterError } = await supabase
          .from("meters")
          .insert({
            unit_id: meter._targetUnitId!,
            meter_number: meter.meter_number,
            meter_type: mappedType,
            installation_date: meter.installation_date,
            notes: `Importiert aus Ablesung-App (Gebäude: ${meter.building_name})`,
          })
          .select()
          .single();

        if (meterError) throw meterError;

        // Create initial reading if available
        if (meter.latest_reading && newMeter) {
          await supabase.from("meter_readings").insert({
            meter_id: newMeter.id,
            reading_value: meter.latest_reading.reading_value,
            reading_date: meter.latest_reading.reading_date,
            recorded_by: user?.id,
            notes: "Importiert aus Ablesung-App",
          });
        }

        created++;
      } catch (err) {
        console.error("Import error:", err);
        failed++;
      }
    }

    setImportResult({ created, skipped, failed });
    setStep("done");
    setIsImporting(false);

    if (created > 0) {
      toast.success(`${created} Zähler importiert`);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Aus Ablesung-App importieren
          </DialogTitle>
          <DialogDescription>
            Importieren Sie Zähler aus Ihrem Ablesung-App-Account in dieses Gebäude.
          </DialogDescription>
        </DialogHeader>

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              Suche nach Ihrem Ablesung-App-Account...
            </p>
          </div>
        )}

        {step === "select" && error && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Stellen Sie sicher, dass Sie in der Ablesung-App mit derselben E-Mail-Adresse registriert sind.
            </p>
          </div>
        )}

        {step === "select" && !error && meters.length === 0 && (
          <Alert>
            <AlertDescription>
              Keine Zähler in Ihrem Ablesung-App-Account gefunden.
            </AlertDescription>
          </Alert>
        )}

        {step === "select" && !error && meters.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {meters.length} Zähler aus {buildings.length} Gebäude(n) gefunden.
              Wählen Sie die Zähler aus und ordnen Sie sie den Einheiten zu.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Zählernr.</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Gebäude (Ablesung)</TableHead>
                  <TableHead>Letzter Stand</TableHead>
                  <TableHead>Ziel-Einheit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meters.map((meter, index) => {
                  const Icon = METER_ICONS[meter.meter_type] || Gauge;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={meter._selected}
                          onCheckedChange={() => toggleMeter(index)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{meter.meter_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {METER_LABELS[meter.meter_type] || meter.meter_type}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {meter.building_name || "–"}
                      </TableCell>
                      <TableCell>
                        {meter.latest_reading
                          ? meter.latest_reading.reading_value.toLocaleString("de-DE")
                          : "–"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={meter._targetUnitId || ""}
                          onValueChange={(v) => setTargetUnit(index, v)}
                          disabled={!meter._selected}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Einheit wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.unit_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {step === "done" && importResult && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Import abgeschlossen</p>
              <div className="flex justify-center gap-4">
                {importResult.created > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {importResult.created} erstellt
                  </Badge>
                )}
                {importResult.skipped > 0 && (
                  <Badge variant="outline">
                    {importResult.skipped} übersprungen (bereits vorhanden)
                  </Badge>
                )}
                {importResult.failed > 0 && (
                  <Badge variant="destructive">
                    {importResult.failed} fehlgeschlagen
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "select" && !error && meters.length > 0 && (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedMeters.length === 0 || isImporting}
              >
                {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {selectedMeters.length} Zähler importieren
              </Button>
            </div>
          )}
          {(step === "done" || error) && (
            <Button onClick={() => onOpenChange(false)}>Schließen</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
