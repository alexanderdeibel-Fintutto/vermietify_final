import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Gauge,
  Plus,
  FileSpreadsheet,
  Download,
  Zap,
  Flame,
  Droplet,
  Thermometer,
} from "lucide-react";
import { format, differenceInMonths, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { MeterFormDialog } from "@/components/zaehler/MeterFormDialog";
import { CSVImportDialog } from "@/components/zaehler/CSVImportDialog";
import { AblesungImportDialog } from "@/components/buildings/AblesungImportDialog";
import type { MeterType } from "@/hooks/useMeters";

const METER_ICONS: Record<MeterType, React.ElementType> = {
  electricity: Zap,
  gas: Flame,
  water: Droplet,
  heating: Thermometer,
};

const METER_LABELS: Record<MeterType, string> = {
  electricity: "Strom",
  gas: "Gas",
  water: "Wasser",
  heating: "Heizung",
};

function getStatusBadge(lastReadingDate: string | null, intervalMonths: number) {
  if (!lastReadingDate) {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Ablesung fällig</Badge>;
  }
  const months = differenceInMonths(new Date(), parseISO(lastReadingDate));
  if (months >= intervalMonths + 1) {
    return <Badge variant="destructive">Überfällig</Badge>;
  }
  if (months >= intervalMonths) {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Ablesung fällig</Badge>;
  }
  return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aktuell</Badge>;
}

interface BuildingMetersTabProps {
  buildingId: string;
  units: Array<{ id: string; unit_number: string }>;
}

export function BuildingMetersTab({ buildingId, units }: BuildingMetersTabProps) {
  const [meterDialogOpen, setMeterDialogOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [ablesungImportOpen, setAblesungImportOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>();

  const unitIds = units.map((u) => u.id);

  const { data: meters = [], isLoading, refetch } = useQuery({
    queryKey: ["building-meters", buildingId],
    queryFn: async () => {
      if (unitIds.length === 0) return [];

      const { data: metersData, error } = await supabase
        .from("meters")
        .select("*")
        .in("unit_id", unitIds)
        .order("meter_number");

      if (error) throw error;

      // Fetch latest readings
      const meterIds = metersData.map((m) => m.id);
      if (meterIds.length === 0) return [];

      const { data: readings } = await supabase
        .from("meter_readings")
        .select("*")
        .in("meter_id", meterIds)
        .order("reading_date", { ascending: false });

      const readingsByMeter = new Map<string, { reading_value: number; reading_date: string }>();
      readings?.forEach((r) => {
        if (!readingsByMeter.has(r.meter_id)) {
          readingsByMeter.set(r.meter_id, { reading_value: r.reading_value, reading_date: r.reading_date });
        }
      });

      return metersData.map((m) => {
        const latest = readingsByMeter.get(m.id);
        return {
          ...m,
          unit_number: units.find((u) => u.id === m.unit_id)?.unit_number || "–",
          latest_reading: latest || null,
        };
      });
    },
    enabled: unitIds.length > 0,
  });

  // Group meters by unit
  const metersByUnit = new Map<string, typeof meters>();
  meters.forEach((m) => {
    const list = metersByUnit.get(m.unit_id) || [];
    list.push(m);
    metersByUnit.set(m.unit_id, list);
  });

  const handleAddMeter = (unitId?: string) => {
    setSelectedUnitId(unitId);
    setMeterDialogOpen(true);
  };

  const stats = {
    total: meters.length,
    electricity: meters.filter((m) => m.meter_type === "electricity").length,
    gas: meters.filter((m) => m.meter_type === "gas").length,
    water: meters.filter((m) => m.meter_type === "water").length,
    heating: meters.filter((m) => m.meter_type === "heating").length,
  };

  if (unitIds.length === 0) {
    return (
      <EmptyState
        icon={Gauge}
        title="Keine Einheiten vorhanden"
        description="Erstellen Sie zuerst Einheiten, um Zähler hinzuzufügen."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Gesamt</div>
          </CardContent>
        </Card>
        {(["electricity", "gas", "water", "heating"] as MeterType[]).map((type) => {
          const Icon = METER_ICONS[type];
          return (
            <Card key={type}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{stats[type]}</div>
                  <div className="text-sm text-muted-foreground">{METER_LABELS[type]}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleAddMeter()}>
          <Plus className="h-4 w-4 mr-2" />
          Zähler hinzufügen
        </Button>
        <Button variant="outline" onClick={() => setCsvImportOpen(true)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          CSV/Excel Import
        </Button>
        <Button variant="outline" onClick={() => setAblesungImportOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          Aus Ablesung-App importieren
        </Button>
      </div>

      {/* Meters Table */}
      {meters.length === 0 && !isLoading ? (
        <EmptyState
          icon={Gauge}
          title="Keine Zähler vorhanden"
          description="Fügen Sie Zähler hinzu oder importieren Sie sie aus einer CSV-Datei oder der Ablesung-App."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alle Zähler ({meters.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zählernr.</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Einheit</TableHead>
                  <TableHead>Letzter Stand</TableHead>
                  <TableHead>Letzte Ablesung</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meters.map((meter) => {
                  const Icon = METER_ICONS[meter.meter_type as MeterType] || Gauge;
                  return (
                    <TableRow key={meter.id}>
                      <TableCell className="font-medium">{meter.meter_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {METER_LABELS[meter.meter_type as MeterType] || meter.meter_type}
                        </div>
                      </TableCell>
                      <TableCell>{meter.unit_number}</TableCell>
                      <TableCell>
                        {meter.latest_reading
                          ? meter.latest_reading.reading_value.toLocaleString("de-DE", { maximumFractionDigits: 2 })
                          : "–"}
                      </TableCell>
                      <TableCell>
                        {meter.latest_reading
                          ? format(parseISO(meter.latest_reading.reading_date), "dd.MM.yyyy", { locale: de })
                          : "–"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(
                          meter.latest_reading?.reading_date || null,
                          meter.reading_interval_months
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <MeterFormDialog
        open={meterDialogOpen}
        onOpenChange={setMeterDialogOpen}
        unitId={selectedUnitId}
        onSuccess={() => refetch()}
      />

      <CSVImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        onSuccess={() => refetch()}
      />

      <AblesungImportDialog
        open={ablesungImportOpen}
        onOpenChange={setAblesungImportOpen}
        buildingId={buildingId}
        units={units}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
