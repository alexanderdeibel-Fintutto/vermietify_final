import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sun,
  Zap,
  TrendingUp,
  Leaf,
  Euro,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const pvAnlagen = [
  {
    id: "1",
    name: "PV-Anlage Dach Süd",
    gebaeude: "Musterstraße 10",
    leistung: 12.5,
    status: "online" as const,
    tagesertrag: 42.3,
    monatsertrag: 980,
  },
  {
    id: "2",
    name: "PV-Anlage Carport",
    gebaeude: "Hauptweg 5",
    leistung: 8.0,
    status: "online" as const,
    tagesertrag: 28.1,
    monatsertrag: 640,
  },
  {
    id: "3",
    name: "PV-Anlage Flachdach",
    gebaeude: "Parkallee 22",
    leistung: 20.0,
    status: "offline" as const,
    tagesertrag: 0,
    monatsertrag: 1250,
  },
];

const dailyProduction = [
  { day: "Mo", value: 38 },
  { day: "Di", value: 45 },
  { day: "Mi", value: 52 },
  { day: "Do", value: 30 },
  { day: "Fr", value: 48 },
  { day: "Sa", value: 55 },
  { day: "So", value: 42 },
];

export default function SolarDashboard() {
  const [selectedAnlage, setSelectedAnlage] = useState("alle");

  const aktuelleErzeugung = 7.8;
  const tagesertrag = 70.4;
  const monatsertrag = 2870;
  const jahresertrag = 28450;
  const eigenverbrauchsquote = 68;
  const einspeisung = 342.5;
  const co2Einsparung = 14.2;
  const maxProduction = Math.max(...dailyProduction.map((d) => d.value));

  return (
    <MainLayout
      title="Solar-Dashboard"
      breadcrumbs={[
        { label: "Energie", href: "/energy" },
        { label: "Solar-Dashboard" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Solar / PV-Monitoring"
          subtitle="Übersicht über alle Photovoltaik-Anlagen und deren Erzeugung."
        />

        {/* Anlagen-Filter */}
        <div className="flex items-center gap-4">
          <Select value={selectedAnlage} onValueChange={setSelectedAnlage}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Anlage auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Anlagen</SelectItem>
              {pvAnlagen.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gauge + Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Aktuelle Erzeugung Gauge */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktuelle Erzeugung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="relative h-32 w-32">
                  <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      className="text-muted"
                      strokeWidth="12"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      className="text-yellow-500"
                      strokeWidth="12"
                      strokeDasharray={`${(aktuelleErzeugung / 40) * 314} 314`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{aktuelleErzeugung}</span>
                    <span className="text-xs text-muted-foreground">kW</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">von 40 kWp installiert</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tagesertrag</p>
                  <p className="text-2xl font-bold">{tagesertrag} kWh</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Sun className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monatsertrag</p>
                  <p className="text-2xl font-bold">{monatsertrag.toLocaleString("de-DE")} kWh</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Jahresertrag</p>
                  <p className="text-2xl font-bold">{jahresertrag.toLocaleString("de-DE")} kWh</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Eigenverbrauchsquote</p>
                  <p className="text-2xl font-bold">{eigenverbrauchsquote}%</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${eigenverbrauchsquote}%` }}
                    />
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Einspeisevergütung</p>
                  <p className="text-2xl font-bold">{einspeisung.toLocaleString("de-DE")} €</p>
                  <p className="text-xs text-muted-foreground mt-1">laufendes Jahr</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Euro className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CO₂-Einsparung</p>
                  <p className="text-2xl font-bold">{co2Einsparung} t</p>
                  <p className="text-xs text-muted-foreground mt-1">laufendes Jahr</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Production Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tagesproduktion (letzte 7 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-48">
              {dailyProduction.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {d.value} kWh
                  </span>
                  <div
                    className="w-full bg-yellow-400 rounded-t-md transition-all"
                    style={{ height: `${(d.value / maxProduction) * 160}px` }}
                  />
                  <span className="text-xs text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PV-Anlagen List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              PV-Anlagen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pvAnlagen.map((anlage) => (
                <div
                  key={anlage.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Sun className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">{anlage.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {anlage.gebaeude} · {anlage.leistung} kWp
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="font-medium">{anlage.tagesertrag} kWh heute</p>
                      <p className="text-muted-foreground">
                        {anlage.monatsertrag.toLocaleString("de-DE")} kWh/Monat
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        anlage.status === "online"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {anlage.status === "online" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {anlage.status === "online" ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
