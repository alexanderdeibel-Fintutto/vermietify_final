import { useState, useMemo } from "react";
import { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Zap,
  Flame,
  Droplets,
  Thermometer,
  CalendarIcon,
  Download,
  AlertTriangle,
  Building2,
  Filter,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { MeterType } from "@/hooks/useMeters";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, subYears, startOfYear, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";

const METER_TYPE_CONFIG: Record<MeterType, { label: string; icon: LucideIcon; unit: string; color: string }> = {
  electricity: { label: "Strom", icon: Zap, unit: "kWh", color: "hsl(var(--chart-1))" },
  gas: { label: "Gas", icon: Flame, unit: "m³", color: "hsl(var(--chart-2))" },
  water: { label: "Wasser", icon: Droplets, unit: "m³", color: "hsl(var(--chart-3))" },
  heating: { label: "Heizung", icon: Thermometer, unit: "kWh", color: "hsl(var(--chart-4))" },
};

interface ReadingWithDetails {
  id: string;
  meter_id: string;
  reading_value: number;
  reading_date: string;
  notes: string | null;
  meter_number: string;
  meter_type: MeterType;
  unit_id: string;
  unit_number: string;
  building_id: string;
  building_name: string;
  building_area: number | null;
}

export default function Auswertung() {
  // Fetch buildings and units directly
  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings-for-analysis"],
    queryFn: async () => {
      const { data, error } = await supabase.from("buildings").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units-for-analysis"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("id, unit_number, building_id").order("unit_number");
      if (error) throw error;
      return data || [];
    },
  });

  const [dateFrom, setDateFrom] = useState<Date>(startOfYear(new Date()));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [selectedTypes, setSelectedTypes] = useState<MeterType[]>(["electricity", "gas", "water", "heating"]);
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const { data: readings = [] } = useQuery({
    queryKey: ["readings-analysis", dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meter_readings")
        .select(`
          id, meter_id, reading_value, reading_date, notes,
          meter:meters(meter_number, meter_type, unit:units(id, unit_number, area, building:buildings(id, name, total_area)))
        `)
        .gte("reading_date", format(dateFrom, "yyyy-MM-dd"))
        .lte("reading_date", format(dateTo, "yyyy-MM-dd"))
        .order("reading_date", { ascending: true });

      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id, meter_id: r.meter_id, reading_value: r.reading_value, reading_date: r.reading_date, notes: r.notes,
        meter_number: r.meter?.meter_number || "", meter_type: r.meter?.meter_type as MeterType,
        unit_id: r.meter?.unit?.id || "", unit_number: r.meter?.unit?.unit_number || "",
        building_id: r.meter?.unit?.building?.id || "", building_name: r.meter?.unit?.building?.name || "",
        building_area: r.meter?.unit?.building?.total_area,
      })) as ReadingWithDetails[];
    },
    enabled: showResults,
  });

  const prevYearFrom = subYears(dateFrom, 1);
  const prevYearTo = subYears(dateTo, 1);

  const { data: prevYearReadings = [] } = useQuery({
    queryKey: ["readings-analysis-prev", prevYearFrom, prevYearTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meter_readings")
        .select(`id, meter_id, reading_value, reading_date, meter:meters(meter_type)`)
        .gte("reading_date", format(prevYearFrom, "yyyy-MM-dd"))
        .lte("reading_date", format(prevYearTo, "yyyy-MM-dd"))
        .order("reading_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: showResults,
  });

  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      if (!selectedTypes.includes(r.meter_type)) return false;
      if (selectedBuildings.length > 0 && !selectedBuildings.includes(r.building_id)) return false;
      if (selectedUnits.length > 0 && !selectedUnits.includes(r.unit_id)) return false;
      return true;
    });
  }, [readings, selectedTypes, selectedBuildings, selectedUnits]);

  const consumptionData = useMemo(() => {
    const byMeter = new Map<string, ReadingWithDetails[]>();
    filteredReadings.forEach((r) => {
      const list = byMeter.get(r.meter_id) || [];
      list.push(r);
      byMeter.set(r.meter_id, list);
    });
    const results: (ReadingWithDetails & { consumption: number })[] = [];
    byMeter.forEach((meterReadings) => {
      meterReadings.sort((a, b) => a.reading_date.localeCompare(b.reading_date));
      for (let i = 1; i < meterReadings.length; i++) {
        const consumption = meterReadings[i].reading_value - meterReadings[i - 1].reading_value;
        results.push({ ...meterReadings[i], consumption: Math.max(0, consumption) });
      }
    });
    return results;
  }, [filteredReadings]);

  const totalsPerType = useMemo(() => {
    const totals: Record<MeterType, number> = { electricity: 0, gas: 0, water: 0, heating: 0 };
    consumptionData.forEach((r) => { totals[r.meter_type] += r.consumption; });
    return totals;
  }, [consumptionData]);

  const prevYearTotals = useMemo(() => {
    const totals: Record<MeterType, number> = { electricity: 0, gas: 0, water: 0, heating: 0 };
    const byMeter = new Map<string, any[]>();
    prevYearReadings.forEach((r: any) => {
      const list = byMeter.get(r.meter_id) || [];
      list.push(r);
      byMeter.set(r.meter_id, list);
    });
    byMeter.forEach((meterReadings) => {
      meterReadings.sort((a: any, b: any) => a.reading_date.localeCompare(b.reading_date));
      for (let i = 1; i < meterReadings.length; i++) {
        const type = meterReadings[i].meter?.meter_type as MeterType;
        if (type) {
          const consumption = meterReadings[i].reading_value - meterReadings[i - 1].reading_value;
          totals[type] += Math.max(0, consumption);
        }
      }
    });
    return totals;
  }, [prevYearReadings]);

  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({ start: dateFrom, end: dateTo });
    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthReadings = consumptionData.filter((r) => {
        const date = parseISO(r.reading_date);
        return date >= monthStart && date <= monthEnd;
      });
      const result: Record<string, any> = {
        month: format(month, "MMM yy", { locale: de }),
        fullMonth: format(month, "MMMM yyyy", { locale: de }),
      };
      (["electricity", "gas", "water", "heating"] as MeterType[]).forEach((type) => {
        result[type] = monthReadings.filter((r) => r.meter_type === type).reduce((sum, r) => sum + r.consumption, 0);
      });
      return result;
    });
  }, [consumptionData, dateFrom, dateTo]);

  const buildingData = useMemo(() => {
    const byBuilding = new Map<string, { name: string; area: number; consumption: Record<MeterType, number> }>();
    consumptionData.forEach((r) => {
      if (!byBuilding.has(r.building_id)) {
        byBuilding.set(r.building_id, { name: r.building_name, area: r.building_area || 1, consumption: { electricity: 0, gas: 0, water: 0, heating: 0 } });
      }
      const building = byBuilding.get(r.building_id)!;
      building.consumption[r.meter_type] += r.consumption;
    });
    return Array.from(byBuilding.entries()).map(([id, data]) => ({
      id, name: data.name, area: data.area, ...data.consumption,
      electricityPerM2: data.area > 0 ? data.consumption.electricity / data.area : 0,
      gasPerM2: data.area > 0 ? data.consumption.gas / data.area : 0,
      waterPerM2: data.area > 0 ? data.consumption.water / data.area : 0,
      heatingPerM2: data.area > 0 ? data.consumption.heating / data.area : 0,
    }));
  }, [consumptionData]);

  const anomalies = useMemo(() => {
    const results: { unitId: string; unitNumber: string; meterNumber: string; meterId: string; type: MeterType; problem: string; severity: "warning" | "error" }[] = [];
    const byMeter = new Map<string, { readings: number[]; unitId: string; unitNumber: string; meterNumber: string; type: MeterType }>();
    consumptionData.forEach((r) => {
      if (!byMeter.has(r.meter_id)) {
        byMeter.set(r.meter_id, { readings: [], unitId: r.unit_id, unitNumber: r.unit_number, meterNumber: r.meter_number, type: r.meter_type });
      }
      byMeter.get(r.meter_id)!.readings.push(r.consumption);
    });
    byMeter.forEach((data, meterId) => {
      if (data.readings.length < 2) return;
      const avg = data.readings.reduce((a, b) => a + b, 0) / data.readings.length;
      const lastReading = data.readings[data.readings.length - 1];
      if (lastReading > avg * 1.5) {
        const percent = Math.round(((lastReading - avg) / avg) * 100);
        results.push({ unitId: data.unitId, unitNumber: data.unitNumber, meterNumber: data.meterNumber, meterId, type: data.type, problem: `Verbrauch ${percent}% höher als Durchschnitt`, severity: percent > 100 ? "error" : "warning" });
      } else if (lastReading < avg * 0.3 && lastReading > 0) {
        const percent = Math.round(((avg - lastReading) / avg) * 100);
        results.push({ unitId: data.unitId, unitNumber: data.unitNumber, meterNumber: data.meterNumber, meterId, type: data.type, problem: `Verbrauch ${percent}% niedriger als Durchschnitt`, severity: "warning" });
      }
    });
    return results;
  }, [consumptionData]);

  const filteredUnits = useMemo(() => {
    if (selectedBuildings.length === 0) return units;
    return units.filter((u) => selectedBuildings.includes(u.building_id));
  }, [units, selectedBuildings]);

  const exportCSV = () => {
    const data = consumptionData.map((r) => ({
      Datum: format(parseISO(r.reading_date), "dd.MM.yyyy"), Gebäude: r.building_name, Einheit: r.unit_number,
      Zähler: r.meter_number, Typ: METER_TYPE_CONFIG[r.meter_type].label, Stand: r.reading_value,
      Verbrauch: r.consumption, Einheit_2: METER_TYPE_CONFIG[r.meter_type].unit,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `verbrauchsauswertung_${format(dateFrom, "yyyy-MM-dd")}_${format(dateTo, "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const exportExcel = () => {
    const data = consumptionData.map((r) => ({
      Datum: format(parseISO(r.reading_date), "dd.MM.yyyy"), Gebäude: r.building_name, Einheit: r.unit_number,
      Zähler: r.meter_number, Typ: METER_TYPE_CONFIG[r.meter_type].label, Stand: r.reading_value,
      Verbrauch: r.consumption, Einheit_2: METER_TYPE_CONFIG[r.meter_type].unit,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Verbrauch");
    XLSX.writeFile(wb, `verbrauchsauswertung_${format(dateFrom, "yyyy-MM-dd")}_${format(dateTo, "yyyy-MM-dd")}.xlsx`);
  };

  const toggleType = (type: MeterType) => setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  const toggleBuilding = (id: string) => setSelectedBuildings((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  const toggleUnit = (id: string) => setSelectedUnits((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]);

  const chartConfig: ChartConfig = {
    electricity: { label: "Strom", color: "hsl(var(--chart-1))" },
    gas: { label: "Gas", color: "hsl(var(--chart-2))" },
    water: { label: "Wasser", color: "hsl(var(--chart-3))" },
    heating: { label: "Heizung", color: "hsl(var(--chart-4))" },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verbrauchsauswertung"
        subtitle="Analysieren Sie Verbräuche über alle Zähler hinweg"
        breadcrumbs={[{ label: "Zähler", href: "/zaehler" }, { label: "Auswertung" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Von</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateFrom, "dd.MM.yyyy", { locale: de })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} locale={de} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Bis</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateTo, "dd.MM.yyyy", { locale: de })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} locale={de} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Zählertyp</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedTypes.length === 4 ? "Alle Typen" : `${selectedTypes.length} ausgewählt`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-2">
                  {(Object.keys(METER_TYPE_CONFIG) as MeterType[]).map((type) => {
                    const config = METER_TYPE_CONFIG[type];
                    return (
                      <div key={type} className="flex items-center space-x-2 p-2">
                        <Checkbox checked={selectedTypes.includes(type)} onCheckedChange={() => toggleType(type)} />
                        <config.icon className="h-4 w-4" />
                        <span className="text-sm">{config.label}</span>
                      </div>
                    );
                  })}
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Gebäude</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedBuildings.length === 0 ? "Alle Gebäude" : `${selectedBuildings.length} ausgewählt`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-2 max-h-[300px] overflow-y-auto">
                  {buildings.map((building) => (
                    <div key={building.id} className="flex items-center space-x-2 p-2">
                      <Checkbox checked={selectedBuildings.includes(building.id)} onCheckedChange={() => toggleBuilding(building.id)} />
                      <span className="text-sm truncate">{building.name}</span>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {selectedBuildings.length > 0 && filteredUnits.length > 0 && (
            <div className="space-y-2">
              <Label>Einheiten</Label>
              <div className="flex flex-wrap gap-2">
                {filteredUnits.slice(0, 20).map((unit) => (
                  <Badge key={unit.id} variant={selectedUnits.includes(unit.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleUnit(unit.id)}>
                    {unit.unit_number}
                  </Badge>
                ))}
                {filteredUnits.length > 20 && <Badge variant="secondary">+{filteredUnits.length - 20} weitere</Badge>}
              </div>
            </div>
          )}
          <Button onClick={() => setShowResults(true)} className="w-full md:w-auto">
            <BarChart3 className="h-4 w-4 mr-2" />
            Auswertung erstellen
          </Button>
        </CardContent>
      </Card>

      {showResults && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(METER_TYPE_CONFIG) as MeterType[]).map((type) => {
              const config = METER_TYPE_CONFIG[type];
              const total = totalsPerType[type];
              const prevTotal = prevYearTotals[type];
              const trend = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
              return (
                <StatCard key={type} title={config.label} value={`${total.toLocaleString("de-DE", { maximumFractionDigits: 0 })} ${config.unit}`} icon={config.icon}
                  trend={prevTotal > 0 ? { value: Math.abs(Math.round(trend)), isPositive: trend < 0 } : undefined}
                  description={prevTotal > 0 ? `Vorjahr: ${prevTotal.toLocaleString("de-DE", { maximumFractionDigits: 0 })} ${config.unit}` : undefined}
                />
              );
            })}
          </div>

          <Card>
            <CardHeader><CardTitle>Monatlicher Verbrauch</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="electricity">
                <TabsList className="mb-4">
                  {(Object.keys(METER_TYPE_CONFIG) as MeterType[]).map((type) => {
                    const config = METER_TYPE_CONFIG[type];
                    return <TabsTrigger key={type} value={type} className="gap-2"><config.icon className="h-4 w-4" />{config.label}</TabsTrigger>;
                  })}
                </TabsList>
                {(Object.keys(METER_TYPE_CONFIG) as MeterType[]).map((type) => {
                  const config = METER_TYPE_CONFIG[type];
                  return (
                    <TabsContent key={type} value={type}>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <LineChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} labelFormatter={(value) => monthlyData.find((m) => m.month === value)?.fullMonth || value} />
                          <Line type="monotone" dataKey={type} stroke={config.color} strokeWidth={2} dot={{ r: 4 }} name={`${config.label} (${config.unit})`} />
                        </LineChart>
                      </ChartContainer>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>

          {buildingData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Gebäudevergleich (Verbrauch pro m²)</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={buildingData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="electricityPerM2" name="Strom/m²" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="gasPerM2" name="Gas/m²" fill="hsl(var(--chart-2))" />
                    <Bar dataKey="waterPerM2" name="Wasser/m²" fill="hsl(var(--chart-3))" />
                    <Bar dataKey="heatingPerM2" name="Heizung/m²" fill="hsl(var(--chart-4))" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Detail-Tabelle</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />CSV</Button>
                <Button variant="outline" size="sm" onClick={exportExcel}><Download className="h-4 w-4 mr-2" />Excel</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead><TableHead>Gebäude</TableHead><TableHead>Einheit</TableHead>
                      <TableHead>Zähler</TableHead><TableHead>Typ</TableHead><TableHead className="text-right">Stand</TableHead><TableHead className="text-right">Verbrauch</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumptionData.slice(0, 100).map((reading) => {
                      const config = METER_TYPE_CONFIG[reading.meter_type];
                      return (
                        <TableRow key={reading.id}>
                          <TableCell>{format(parseISO(reading.reading_date), "dd.MM.yyyy")}</TableCell>
                          <TableCell>{reading.building_name}</TableCell>
                          <TableCell><Link to={`/einheiten/${reading.unit_id}`} className="text-primary hover:underline">{reading.unit_number}</Link></TableCell>
                          <TableCell className="font-mono text-sm">{reading.meter_number}</TableCell>
                          <TableCell><Badge variant="outline" className="gap-1"><config.icon className="h-3 w-3" />{config.label}</Badge></TableCell>
                          <TableCell className="text-right font-mono">{reading.reading_value.toLocaleString("de-DE")}</TableCell>
                          <TableCell className="text-right font-mono">{reading.consumption.toLocaleString("de-DE")} {config.unit}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {consumptionData.length > 100 && <p className="text-sm text-muted-foreground mt-2 text-center">Zeige 100 von {consumptionData.length} Einträgen. Export für vollständige Daten nutzen.</p>}
            </CardContent>
          </Card>

          {anomalies.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Auffälligkeiten ({anomalies.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {anomalies.map((anomaly, index) => {
                    const config = METER_TYPE_CONFIG[anomaly.type];
                    return (
                      <div key={index} className={cn("flex items-center justify-between p-3 rounded-lg border", anomaly.severity === "error" ? "border-destructive/50 bg-destructive/5" : "border-amber-500/50 bg-amber-500/5")}>
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", anomaly.severity === "error" ? "bg-destructive/10" : "bg-amber-500/10")}>
                            <config.icon className={cn("h-4 w-4", anomaly.severity === "error" ? "text-destructive" : "text-amber-500")} />
                          </div>
                          <div>
                            <p className="font-medium">{anomaly.unitNumber} - {anomaly.meterNumber}</p>
                            <p className="text-sm text-muted-foreground">{anomaly.problem}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild><Link to={`/einheiten/${anomaly.unitId}`}><ExternalLink className="h-4 w-4" /></Link></Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}