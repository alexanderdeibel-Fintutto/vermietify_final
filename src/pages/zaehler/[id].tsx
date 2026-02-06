import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, StatCard, LoadingState, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickReadingDialog } from "@/components/zaehler/QuickReadingDialog";
import { MeterFormDialog } from "@/components/zaehler/MeterFormDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useMeters, MeterType, MeterReading } from "@/hooks/useMeters";
import { format, differenceInDays, differenceInMonths, subMonths, startOfMonth, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import {
  Gauge,
  Zap,
  Flame,
  Droplet,
  Thermometer,
  Calendar,
  Building2,
  Home,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Download,
  Pencil,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const METER_TYPE_CONFIG: Record<MeterType, { icon: React.ElementType; label: string; unit: string; color: string }> = {
  electricity: { icon: Zap, label: "Strom", unit: "kWh", color: "text-yellow-500" },
  gas: { icon: Flame, label: "Gas", unit: "m³", color: "text-orange-500" },
  water: { icon: Droplet, label: "Wasser", unit: "m³", color: "text-blue-500" },
  heating: { icon: Thermometer, label: "Heizung", unit: "kWh", color: "text-red-500" },
};

interface MeterWithDetails {
  id: string;
  unit_id: string;
  meter_number: string;
  meter_type: MeterType;
  installation_date: string | null;
  calibration_valid_until: string | null;
  notes: string | null;
  reading_interval_months: number;
  created_at: string;
  updated_at: string;
  unit: {
    id: string;
    unit_number: string;
    building_id: string;
    building: {
      id: string;
      name: string;
      address: string;
      city: string;
    };
  };
}

export default function MeterDetail() {
  const { id } = useParams<{ id: string }>();
  const { useMeterReadings, deleteMeter, isDeleting } = useMeters();

  const [readingDialogOpen, setReadingDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chartType, setChartType] = useState<"absolute" | "daily">("absolute");

  // Fetch meter details
  const { data: meter, isLoading: meterLoading, refetch: refetchMeter } = useQuery({
    queryKey: ["meter", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("meters")
        .select(`
          *,
          unit:units(
            id,
            unit_number,
            building_id,
            building:buildings(id, name, address, city)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as MeterWithDetails;
    },
    enabled: !!id,
  });

  // Fetch readings
  const { data: readings = [], isLoading: readingsLoading } = useMeterReadings(id);

  const typeConfig = meter ? METER_TYPE_CONFIG[meter.meter_type] : null;
  const TypeIcon = typeConfig?.icon || Gauge;

  // Calculate consumption data
  const consumptionData = useMemo(() => {
    if (!readings || readings.length < 2) return [];

    const sortedReadings = [...readings].sort(
      (a, b) => new Date(a.reading_date).getTime() - new Date(b.reading_date).getTime()
    );

    const result: Array<{
      date: string;
      month: string;
      consumption: number;
      dailyConsumption: number;
      reading: number;
    }> = [];

    for (let i = 1; i < sortedReadings.length; i++) {
      const prev = sortedReadings[i - 1];
      const curr = sortedReadings[i];
      const consumption = curr.reading_value - prev.reading_value;
      const days = differenceInDays(new Date(curr.reading_date), new Date(prev.reading_date));
      const dailyConsumption = days > 0 ? consumption / days : 0;

      result.push({
        date: curr.reading_date,
        month: format(new Date(curr.reading_date), "MMM yyyy", { locale: de }),
        consumption: Math.max(0, consumption),
        dailyConsumption: Math.max(0, dailyConsumption),
        reading: curr.reading_value,
      });
    }

    return result.slice(-24); // Last 24 data points
  }, [readings]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!consumptionData.length) {
      return {
        lastMonth: 0,
        lastYear: 0,
        avgPerMonth: 0,
        yearOverYear: 0,
        projectedYear: 0,
      };
    }

    const lastMonth = consumptionData[consumptionData.length - 1]?.consumption || 0;
    const lastYear = consumptionData.slice(-12).reduce((sum, d) => sum + d.consumption, 0);
    const avgPerMonth = consumptionData.length > 0 
      ? consumptionData.reduce((sum, d) => sum + d.consumption, 0) / consumptionData.length 
      : 0;

    // Year over year comparison
    const thisYearData = consumptionData.slice(-12);
    const prevYearData = consumptionData.slice(-24, -12);
    const thisYearTotal = thisYearData.reduce((sum, d) => sum + d.consumption, 0);
    const prevYearTotal = prevYearData.reduce((sum, d) => sum + d.consumption, 0);
    const yearOverYear = prevYearTotal > 0 
      ? ((thisYearTotal - prevYearTotal) / prevYearTotal) * 100 
      : 0;

    // Projected annual consumption
    const projectedYear = avgPerMonth * 12;

    return {
      lastMonth,
      lastYear,
      avgPerMonth,
      yearOverYear,
      projectedYear,
    };
  }, [consumptionData]);

  // Reading history with consumption
  const readingHistory = useMemo(() => {
    if (!readings || readings.length === 0) return [];

    const sorted = [...readings].sort(
      (a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime()
    );

    return sorted.map((reading, index) => {
      const nextReading = sorted[index + 1];
      const consumption = nextReading 
        ? reading.reading_value - nextReading.reading_value 
        : null;
      return { ...reading, consumption };
    });
  }, [readings]);

  // Check calibration warning
  const calibrationWarning = useMemo(() => {
    if (!meter?.calibration_valid_until) return null;
    const validUntil = new Date(meter.calibration_valid_until);
    const monthsUntil = differenceInMonths(validUntil, new Date());
    if (monthsUntil < 0) return { type: "expired", text: "Eichung abgelaufen" };
    if (monthsUntil <= 6) return { type: "warning", text: `Eichung läuft in ${monthsUntil} Monaten ab` };
    return null;
  }, [meter]);

  // Consumption anomaly detection
  const consumptionWarning = useMemo(() => {
    if (consumptionData.length < 3) return null;
    const lastConsumption = consumptionData[consumptionData.length - 1]?.consumption || 0;
    const avgConsumption = stats.avgPerMonth;
    if (avgConsumption === 0) return null;

    const deviation = ((lastConsumption - avgConsumption) / avgConsumption) * 100;
    if (deviation > 50) {
      return { type: "high", text: `${Math.round(deviation)}% über Durchschnitt`, deviation };
    }
    if (deviation < -50) {
      return { type: "low", text: `${Math.round(Math.abs(deviation))}% unter Durchschnitt`, deviation };
    }
    return null;
  }, [consumptionData, stats.avgPerMonth]);

  const handleReadingSuccess = () => {
    setReadingDialogOpen(false);
    refetchMeter();
  };

  const handleMeterEditSuccess = () => {
    setEditDialogOpen(false);
    refetchMeter();
  };

  const handleExport = () => {
    if (!readings || !meter) return;
    const csvContent = [
      ["Datum", "Zählerstand", "Verbrauch", "Notizen"].join(";"),
      ...readingHistory.map((r) =>
        [
          format(new Date(r.reading_date), "dd.MM.yyyy"),
          r.reading_value.toLocaleString("de-DE"),
          r.consumption?.toLocaleString("de-DE") || "",
          r.notes || "",
        ].join(";")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zaehler-${meter.meter_number}-ablesungen.csv`;
    link.click();
  };

  if (meterLoading) {
    return (
      <MainLayout title="Zählerdetails" breadcrumbs={[{ label: "Zähler", href: "/zaehler" }, { label: "Laden..." }]}>
        <LoadingState rows={6} />
      </MainLayout>
    );
  }

  if (!meter) {
    return (
      <MainLayout title="Zählerdetails" breadcrumbs={[{ label: "Zähler", href: "/zaehler" }, { label: "Nicht gefunden" }]}>
        <EmptyState
          icon={Gauge}
          title="Zähler nicht gefunden"
          description="Der angeforderte Zähler existiert nicht oder wurde gelöscht."
        />
      </MainLayout>
    );
  }

  const latestReading = readings[0];

  return (
    <MainLayout
      title={meter.meter_number}
      breadcrumbs={[
        { label: "Zähler", href: "/zaehler" },
        { label: meter.meter_number },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title={meter.meter_number}
          subtitle={
            <div className="flex items-center gap-3">
              <TypeIcon className={`h-8 w-8 ${typeConfig?.color}`} />
              <div>
                <Link to={`/einheiten/${meter.unit.id}`} className="hover:underline">
                  {meter.unit.unit_number}
                </Link>
                {" • "}
                <Link to={`/gebaeude/${meter.unit.building.id}`} className="hover:underline">
                  {meter.unit.building.name}
                </Link>
              </div>
            </div>
          }
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
              <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
              <Button onClick={() => setReadingDialogOpen(true)}>
                <Gauge className="h-4 w-4 mr-2" />
                Ablesen
              </Button>
            </div>
          }
        />

        {/* Warnings */}
        {(calibrationWarning || consumptionWarning) && (
          <div className="flex flex-wrap gap-3">
            {calibrationWarning && (
              <Badge 
                variant={calibrationWarning.type === "expired" ? "destructive" : "secondary"}
                className="flex items-center gap-1 px-3 py-1"
              >
                <AlertTriangle className="h-3 w-3" />
                {calibrationWarning.text}
              </Badge>
            )}
            {consumptionWarning && (
              <Badge 
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                <AlertTriangle className="h-3 w-3" />
                Verbrauch: {consumptionWarning.text}
              </Badge>
            )}
          </div>
        )}

        {/* Section 1: Meter Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Zählerinformationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Zählernummer</p>
                <p className="font-mono font-medium">{meter.meter_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Typ</p>
                <div className="flex items-center gap-2">
                  <TypeIcon className={`h-4 w-4 ${typeConfig?.color}`} />
                  <span className="font-medium">{typeConfig?.label}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Einheit</p>
                <Link to={`/einheiten/${meter.unit.id}`} className="font-medium hover:underline flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  {meter.unit.unit_number}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gebäude</p>
                <Link to={`/gebaeude/${meter.unit.building.id}`} className="font-medium hover:underline flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {meter.unit.building.name}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Einbaudatum</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {meter.installation_date
                    ? format(new Date(meter.installation_date), "dd.MM.yyyy", { locale: de })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eichgültigkeit bis</p>
                <p className={`font-medium ${calibrationWarning ? "text-destructive" : ""}`}>
                  {meter.calibration_valid_until
                    ? format(new Date(meter.calibration_valid_until), "dd.MM.yyyy", { locale: de })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktueller Stand</p>
                <p className="font-mono font-medium text-lg">
                  {latestReading
                    ? `${latestReading.reading_value.toLocaleString("de-DE")} ${typeConfig?.unit}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Letzte Ablesung</p>
                <p className="font-medium">
                  {latestReading
                    ? format(new Date(latestReading.reading_date), "dd.MM.yyyy", { locale: de })
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Verbrauch letzter Monat"
            value={`${stats.lastMonth.toLocaleString("de-DE", { maximumFractionDigits: 1 })} ${typeConfig?.unit}`}
            icon={Activity}
          />
          <StatCard
            title="Verbrauch letztes Jahr"
            value={`${stats.lastYear.toLocaleString("de-DE", { maximumFractionDigits: 0 })} ${typeConfig?.unit}`}
            icon={BarChart3}
          />
          <StatCard
            title="Durchschnitt pro Monat"
            value={`${stats.avgPerMonth.toLocaleString("de-DE", { maximumFractionDigits: 1 })} ${typeConfig?.unit}`}
            icon={TrendingUp}
          />
        </div>

        {/* Section 3: Consumption Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Verbrauchsverlauf</CardTitle>
              <CardDescription>Letzte 24 Ablesungen</CardDescription>
            </div>
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as "absolute" | "daily")}>
              <TabsList>
                <TabsTrigger value="absolute">Absolut</TabsTrigger>
                <TabsTrigger value="daily">Pro Tag</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {consumptionData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={consumptionData}>
                    <defs>
                      <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value.toLocaleString("de-DE")}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [
                        `${value.toLocaleString("de-DE", { maximumFractionDigits: 2 })} ${typeConfig?.unit}`,
                        chartType === "absolute" ? "Verbrauch" : "Pro Tag",
                      ]}
                      labelFormatter={(label) => label}
                    />
                    <Area
                      type="monotone"
                      dataKey={chartType === "absolute" ? "consumption" : "dailyConsumption"}
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorConsumption)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nicht genügend Ablesungen für ein Diagramm
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Reading History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ablesehistorie</CardTitle>
            <CardDescription>Alle erfassten Zählerstände</CardDescription>
          </CardHeader>
          <CardContent>
            {readingsLoading ? (
              <LoadingState rows={5} />
            ) : readingHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Noch keine Ablesungen vorhanden
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Zählerstand</TableHead>
                    <TableHead className="text-right">Verbrauch</TableHead>
                    <TableHead>Notizen</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readingHistory.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>
                        {format(new Date(reading.reading_date), "dd.MM.yyyy", { locale: de })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {reading.reading_value.toLocaleString("de-DE")} {typeConfig?.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {reading.consumption !== null ? (
                          <span className={reading.consumption < 0 ? "text-destructive" : ""}>
                            {reading.consumption >= 0 ? "+" : ""}
                            {reading.consumption.toLocaleString("de-DE")} {typeConfig?.unit}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {reading.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Consumption Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verbrauchsanalyse</CardTitle>
            <CardDescription>Vergleiche und Prognosen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Vergleich zum Vorjahr</p>
                <div className="flex items-center gap-2">
                  {stats.yearOverYear !== 0 ? (
                    <>
                      {stats.yearOverYear > 0 ? (
                        <ArrowUpRight className="h-5 w-5 text-destructive" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-primary" />
                      )}
                      <span className={`text-2xl font-bold ${stats.yearOverYear > 0 ? "text-destructive" : "text-primary"}`}>
                        {stats.yearOverYear > 0 ? "+" : ""}
                        {stats.yearOverYear.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">—</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.yearOverYear > 0 ? "Mehr Verbrauch als im Vorjahr" : stats.yearOverYear < 0 ? "Weniger Verbrauch als im Vorjahr" : "Keine Vorjahresdaten"}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Hochrechnung Jahresverbrauch</p>
                <p className="text-2xl font-bold">
                  {stats.projectedYear > 0 
                    ? `${stats.projectedYear.toLocaleString("de-DE", { maximumFractionDigits: 0 })} ${typeConfig?.unit}`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Basierend auf Durchschnittsverbrauch
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Verbrauchsstatus</p>
                {consumptionWarning ? (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${consumptionWarning.type === "high" ? "text-destructive" : "text-amber-500"}`} />
                    <span className={`text-lg font-semibold ${consumptionWarning.type === "high" ? "text-destructive" : "text-amber-500"}`}>
                      {consumptionWarning.type === "high" ? "Überdurchschnittlich" : "Unterdurchschnittlich"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold text-primary">Normal</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Letzter Verbrauch im Vergleich zum Durchschnitt
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <QuickReadingDialog
        open={readingDialogOpen}
        onOpenChange={setReadingDialogOpen}
        meter={meter ? { ...meter, status: "current", last_reading_value: latestReading?.reading_value ?? null, last_reading_date: latestReading?.reading_date ?? null } : null}
        onSuccess={handleReadingSuccess}
      />

      <MeterFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        meter={meter}
        onSuccess={handleMeterEditSuccess}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Zähler löschen"
        description="Möchten Sie diesen Zähler wirklich löschen? Alle Ablesungen werden ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        onConfirm={() => {
          if (id) {
            deleteMeter(id);
          }
        }}
        destructive
      />
    </MainLayout>
  );
}
