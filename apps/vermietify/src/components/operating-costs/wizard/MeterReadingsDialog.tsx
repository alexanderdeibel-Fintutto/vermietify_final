import { useState, useEffect, useMemo } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Zap,
  Flame,
  Droplets,
  Thermometer,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calculator,
  Edit2,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useBillingWizard, MeterConsumptionData } from "./BillingWizardContext";
import type { MeterType } from "@/hooks/useMeters";

interface MeterReadingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meterType: "heating" | "water";
  costItemId: string;
}

const METER_TYPE_CONFIG: Record<MeterType, { label: string; icon: React.ElementType; unit: string }> = {
  electricity: { label: "Strom", icon: Zap, unit: "kWh" },
  gas: { label: "Gas", icon: Flame, unit: "m³" },
  water: { label: "Wasser", icon: Droplets, unit: "m³" },
  heating: { label: "Heizung", icon: Thermometer, unit: "kWh" },
};

export function MeterReadingsDialog({
  open,
  onOpenChange,
  meterType,
  costItemId,
}: MeterReadingsDialogProps) {
  const { wizardData, setMeterConsumptionData } = useBillingWizard();
  const [localData, setLocalData] = useState<MeterConsumptionData[]>([]);
  const [editingMeterId, setEditingMeterId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ start?: number; end?: number }>({});

  const periodStart = wizardData.periodStart;
  const periodEnd = wizardData.periodEnd;
  const buildingId = wizardData.buildingId;

  // Determine which meter types to fetch based on cost item type
  const meterTypes: MeterType[] = useMemo(() => {
    if (meterType === "heating") return ["heating", "gas"];
    if (meterType === "water") return ["water"];
    return [];
  }, [meterType]);

  // Fetch meters for the building
  const { data: metersData, isLoading: isLoadingMeters } = useQuery({
    queryKey: ["meters-for-billing", buildingId, meterTypes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meters")
        .select(`
          id, meter_number, meter_type,
          unit:units!inner(id, unit_number, building_id)
        `)
        .in("meter_type", meterTypes);

      if (error) throw error;

      // Filter by building
      return (data || []).filter((m: any) => m.unit?.building_id === buildingId);
    },
    enabled: open && !!buildingId && meterTypes.length > 0,
  });

  // Fetch all readings for these meters
  const meterIds = metersData?.map((m: any) => m.id) || [];

  const { data: readingsData, isLoading: isLoadingReadings } = useQuery({
    queryKey: ["readings-for-billing", meterIds, periodStart, periodEnd],
    queryFn: async () => {
      if (meterIds.length === 0) return [];

      const { data, error } = await supabase
        .from("meter_readings")
        .select("id, meter_id, reading_value, reading_date")
        .in("meter_id", meterIds)
        .order("reading_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: open && meterIds.length > 0,
  });

  // Process meters and readings to find closest readings to period start/end
  useEffect(() => {
    if (!metersData || !readingsData || !periodStart || !periodEnd) return;

    const processed: MeterConsumptionData[] = metersData.map((meter: any) => {
      const meterReadings = readingsData.filter((r: any) => r.meter_id === meter.id);

      // Find closest reading to period start (before or on start date)
      const startReadings = meterReadings.filter(
        (r: any) => parseISO(r.reading_date) <= periodStart
      );
      const startReading = startReadings.length > 0
        ? startReadings.reduce((closest: any, r: any) =>
            Math.abs(differenceInDays(parseISO(r.reading_date), periodStart)) <
            Math.abs(differenceInDays(parseISO(closest.reading_date), periodStart))
              ? r
              : closest
          )
        : null;

      // Find closest reading to period end (on or after end date)
      const endReadings = meterReadings.filter(
        (r: any) => parseISO(r.reading_date) >= periodEnd
      );
      const endReading = endReadings.length > 0
        ? endReadings.reduce((closest: any, r: any) =>
            Math.abs(differenceInDays(parseISO(r.reading_date), periodEnd)) <
            Math.abs(differenceInDays(parseISO(closest.reading_date), periodEnd))
              ? r
              : closest
          )
        : null;

      // If no exact match, try to find readings within period
      const fallbackStart = !startReading && meterReadings.length > 0
        ? meterReadings[0]
        : null;
      const fallbackEnd = !endReading && meterReadings.length > 0
        ? meterReadings[meterReadings.length - 1]
        : null;

      const finalStart = startReading || fallbackStart;
      const finalEnd = endReading || fallbackEnd;

      const startValue = finalStart?.reading_value ?? null;
      const endValue = finalEnd?.reading_value ?? null;
      const consumption = startValue !== null && endValue !== null
        ? Math.max(0, endValue - startValue)
        : null;

      let status: MeterConsumptionData["status"] = "complete";
      if (!finalStart && !finalEnd) status = "missing_both";
      else if (!finalStart) status = "missing_start";
      else if (!finalEnd) status = "missing_end";

      return {
        meterId: meter.id,
        meterNumber: meter.meter_number,
        meterType: meter.meter_type as MeterType,
        unitId: meter.unit?.id || "",
        unitNumber: meter.unit?.unit_number || "",
        startReadingId: finalStart?.id,
        startReadingValue: startValue,
        startReadingDate: finalStart?.reading_date || null,
        endReadingId: finalEnd?.id,
        endReadingValue: endValue,
        endReadingDate: finalEnd?.reading_date || null,
        consumption,
        consumptionShare: 0,
        status,
        isEstimated: false,
      };
    });

    // Calculate consumption shares
    const totalConsumption = processed.reduce((sum, m) => sum + (m.consumption || 0), 0);
    processed.forEach((m) => {
      m.consumptionShare = totalConsumption > 0 && m.consumption !== null
        ? (m.consumption / totalConsumption) * 100
        : 0;
    });

    setLocalData(processed);
  }, [metersData, readingsData, periodStart, periodEnd]);

  const isLoading = isLoadingMeters || isLoadingReadings;

  const stats = useMemo(() => {
    const complete = localData.filter((m) => m.status === "complete" || m.status === "estimated").length;
    const missing = localData.filter((m) => m.status !== "complete" && m.status !== "estimated").length;
    const totalConsumption = localData.reduce((sum, m) => sum + (m.consumption || 0), 0);
    return { complete, missing, totalConsumption };
  }, [localData]);

  const handleManualInput = (meterId: string) => {
    setEditingMeterId(meterId);
    const meter = localData.find((m) => m.meterId === meterId);
    setEditValues({
      start: meter?.startReadingValue ?? undefined,
      end: meter?.endReadingValue ?? undefined,
    });
  };

  const saveManualInput = () => {
    if (!editingMeterId) return;

    setLocalData((prev) =>
      prev.map((m) => {
        if (m.meterId !== editingMeterId) return m;

        const startValue = editValues.start ?? m.startReadingValue;
        const endValue = editValues.end ?? m.endReadingValue;
        const consumption = startValue !== null && startValue !== undefined && endValue !== null && endValue !== undefined
          ? Math.max(0, endValue - startValue)
          : null;

        return {
          ...m,
          startReadingValue: startValue ?? null,
          endReadingValue: endValue ?? null,
          consumption,
          status: consumption !== null ? "complete" : m.status,
        };
      })
    );

    // Recalculate shares
    setTimeout(() => {
      setLocalData((prev) => {
        const totalConsumption = prev.reduce((sum, m) => sum + (m.consumption || 0), 0);
        return prev.map((m) => ({
          ...m,
          consumptionShare: totalConsumption > 0 && m.consumption !== null
            ? (m.consumption / totalConsumption) * 100
            : 0,
        }));
      });
    }, 0);

    setEditingMeterId(null);
    setEditValues({});
  };

  const useEstimate = (meterId: string) => {
    setLocalData((prev) => {
      // Calculate average consumption from complete meters
      const completeMeters = prev.filter((m) => m.consumption !== null && m.meterId !== meterId);
      if (completeMeters.length === 0) return prev;

      const avgConsumption = completeMeters.reduce((sum, m) => sum + (m.consumption || 0), 0) / completeMeters.length;

      const updated = prev.map((m) => {
        if (m.meterId !== meterId) return m;
        return {
          ...m,
          consumption: Math.round(avgConsumption),
          status: "estimated" as const,
          isEstimated: true,
        };
      });

      // Recalculate shares
      const totalConsumption = updated.reduce((sum, m) => sum + (m.consumption || 0), 0);
      return updated.map((m) => ({
        ...m,
        consumptionShare: totalConsumption > 0 && m.consumption !== null
          ? (m.consumption / totalConsumption) * 100
          : 0,
      }));
    });
  };

  const handleSave = () => {
    setMeterConsumptionData(localData);
    onOpenChange(false);
  };

  const meterTypeLabel = meterType === "heating" ? "Heizung" : "Wasser";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {meterType === "heating" ? (
              <Thermometer className="h-5 w-5" />
            ) : (
              <Droplets className="h-5 w-5" />
            )}
            Zählerstände für {meterTypeLabel}abrechnung
          </DialogTitle>
          <DialogDescription>
            Zeitraum: {periodStart && format(periodStart, "dd.MM.yyyy", { locale: de })} -{" "}
            {periodEnd && format(periodEnd, "dd.MM.yyyy", { locale: de })}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : localData.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Keine {meterTypeLabel.toLowerCase()}zähler für dieses Gebäude gefunden. Bitte legen Sie
              zuerst Zähler an.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Vollständig</span>
                </div>
                <p className="text-2xl font-bold">{stats.complete}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Fehlend</span>
                </div>
                <p className="text-2xl font-bold">{stats.missing}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Gesamtverbrauch</span>
                </div>
                <p className="text-2xl font-bold">
                  {stats.totalConsumption.toLocaleString("de-DE")}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {meterType === "water" ? "m³" : "kWh"}
                  </span>
                </p>
              </div>
            </div>

            {stats.missing > 0 && (
              <Alert className="mb-4 border-amber-500/50 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription>
                  {stats.missing} Zähler haben fehlende Ablesungen. Sie können Werte manuell eingeben
                  oder Schätzwerte verwenden.
                </AlertDescription>
              </Alert>
            )}

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Einheit</TableHead>
                    <TableHead>Zähler</TableHead>
                    <TableHead>Stand Anfang</TableHead>
                    <TableHead>Stand Ende</TableHead>
                    <TableHead className="text-right">Verbrauch</TableHead>
                    <TableHead className="text-right">Anteil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localData.map((meter) => {
                    const config = METER_TYPE_CONFIG[meter.meterType];
                    const isEditing = editingMeterId === meter.meterId;

                    return (
                      <TableRow key={meter.meterId}>
                        <TableCell className="font-medium">{meter.unitNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">{meter.meterNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.start ?? ""}
                              onChange={(e) =>
                                setEditValues((v) => ({ ...v, start: parseFloat(e.target.value) || undefined }))
                              }
                              className="w-24 h-8"
                            />
                          ) : meter.startReadingValue !== null ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono">
                                  {meter.startReadingValue.toLocaleString("de-DE")}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {meter.startReadingDate &&
                                  format(parseISO(meter.startReadingDate), "dd.MM.yyyy")}
                                {meter.startReadingDate && periodStart && (
                                  <span className="text-muted-foreground ml-1">
                                    ({Math.abs(differenceInDays(parseISO(meter.startReadingDate), periodStart))} Tage Abweichung)
                                  </span>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.end ?? ""}
                              onChange={(e) =>
                                setEditValues((v) => ({ ...v, end: parseFloat(e.target.value) || undefined }))
                              }
                              className="w-24 h-8"
                            />
                          ) : meter.endReadingValue !== null ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono">
                                  {meter.endReadingValue.toLocaleString("de-DE")}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {meter.endReadingDate &&
                                  format(parseISO(meter.endReadingDate), "dd.MM.yyyy")}
                                {meter.endReadingDate && periodEnd && (
                                  <span className="text-muted-foreground ml-1">
                                    ({Math.abs(differenceInDays(parseISO(meter.endReadingDate), periodEnd))} Tage Abweichung)
                                  </span>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {meter.consumption !== null ? (
                            <>
                              {meter.consumption.toLocaleString("de-DE")} {config.unit}
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {meter.consumptionShare > 0 ? `${meter.consumptionShare.toFixed(1)}%` : "—"}
                        </TableCell>
                        <TableCell>
                          {meter.status === "complete" && (
                            <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
                              <CheckCircle2 className="h-3 w-3" />
                              Vollständig
                            </Badge>
                          )}
                          {meter.status === "estimated" && (
                            <Badge variant="secondary" className="gap-1">
                              <Sparkles className="h-3 w-3" />
                              Geschätzt
                            </Badge>
                          )}
                          {(meter.status === "missing_start" ||
                            meter.status === "missing_end" ||
                            meter.status === "missing_both") && (
                            <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-600">
                              <AlertTriangle className="h-3 w-3" />
                              Fehlend
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {isEditing ? (
                              <Button size="sm" variant="default" onClick={saveManualInput}>
                                Speichern
                              </Button>
                            ) : (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => handleManualInput(meter.meterId)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Manuell eingeben</TooltipContent>
                                </Tooltip>
                                {meter.status !== "complete" && meter.status !== "estimated" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => useEstimate(meter.meterId)}
                                      >
                                        <Sparkles className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Schätzwert verwenden</TooltipContent>
                                  </Tooltip>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isLoading || localData.length === 0}>
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}