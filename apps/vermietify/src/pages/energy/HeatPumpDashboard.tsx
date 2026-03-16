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
  Thermometer,
  Zap,
  Clock,
  Activity,
  Snowflake,
  Flame,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const heatPumps = [
  {
    id: "1",
    name: "Wärmepumpe WP-01",
    gebaeude: "Musterstraße 10",
    typ: "Luft-Wasser",
    status: "aktiv" as const,
  },
  {
    id: "2",
    name: "Wärmepumpe WP-02",
    gebaeude: "Hauptweg 5",
    typ: "Erdwärme",
    status: "aktiv" as const,
  },
];

const wartungshinweise = [
  {
    id: "1",
    text: "Filterreinigung fällig",
    anlage: "WP-01",
    faellig: "2026-04-01",
    prioritaet: "mittel" as const,
  },
  {
    id: "2",
    text: "Jährliche Inspektion",
    anlage: "WP-02",
    faellig: "2026-05-15",
    prioritaet: "niedrig" as const,
  },
  {
    id: "3",
    text: "Kältemittel prüfen",
    anlage: "WP-01",
    faellig: "2026-03-20",
    prioritaet: "hoch" as const,
  },
];

type Betriebsmodus = "heizen" | "kuehlen" | "warmwasser";

export default function HeatPumpDashboard() {
  const [betriebsmodus, setBetriebsmodus] = useState<Betriebsmodus>("heizen");

  const cop = 4.2;
  const vorlaufTemp = 35;
  const ruecklaufTemp = 28;
  const betriebsstunden = 4820;
  const energieverbrauch = 2450;
  const waermeerzeugung = 10290;

  const modusConfig: Record<Betriebsmodus, { label: string; icon: React.ElementType; color: string }> = {
    heizen: { label: "Heizen", icon: Flame, color: "text-orange-600 bg-orange-100" },
    kuehlen: { label: "Kühlen", icon: Snowflake, color: "text-blue-600 bg-blue-100" },
    warmwasser: { label: "Warmwasser", icon: Droplets, color: "text-cyan-600 bg-cyan-100" },
  };

  const prioritaetConfig = {
    hoch: { label: "Hoch", className: "bg-red-100 text-red-800" },
    mittel: { label: "Mittel", className: "bg-yellow-100 text-yellow-800" },
    niedrig: { label: "Niedrig", className: "bg-green-100 text-green-800" },
  };

  return (
    <MainLayout
      title="Wärmepumpen"
      breadcrumbs={[
        { label: "Energie", href: "/energy" },
        { label: "Wärmepumpen" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Wärmepumpen-Monitoring"
          subtitle="Überwachung und Steuerung aller Wärmepumpen."
        />

        {/* Betriebsmodus */}
        <Card>
          <CardHeader>
            <CardTitle>Betriebsmodus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(Object.keys(modusConfig) as Betriebsmodus[]).map((modus) => {
                const config = modusConfig[modus];
                const Icon = config.icon;
                return (
                  <button
                    key={modus}
                    onClick={() => setBetriebsmodus(modus)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
                      betriebsmodus === modus
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted hover:bg-muted/80"
                    )}
                  >
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">COP</p>
                  <p className="text-3xl font-bold">{cop}</p>
                  <p className="text-xs text-muted-foreground mt-1">Coefficient of Performance</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Vorlauf / Rücklauf</p>
                  <p className="text-2xl font-bold">
                    {vorlaufTemp}°C / {ruecklaufTemp}°C
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">ΔT = {vorlaufTemp - ruecklaufTemp}°C</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Thermometer className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Betriebsstunden</p>
                  <p className="text-2xl font-bold">{betriebsstunden.toLocaleString("de-DE")} h</p>
                  <p className="text-xs text-muted-foreground mt-1">Gesamt</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stromverbrauch</p>
                  <p className="text-2xl font-bold">{energieverbrauch.toLocaleString("de-DE")} kWh</p>
                  <p className="text-xs text-muted-foreground mt-1">laufendes Jahr</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Energieverbrauch vs. Wärmeerzeugung */}
        <Card>
          <CardHeader>
            <CardTitle>Energieverbrauch vs. Wärmeerzeugung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Stromverbrauch</span>
                  <span className="font-medium">{energieverbrauch.toLocaleString("de-DE")} kWh</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4">
                  <div
                    className="bg-yellow-500 h-4 rounded-full"
                    style={{ width: `${(energieverbrauch / waermeerzeugung) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Wärmeerzeugung</span>
                  <span className="font-medium">{waermeerzeugung.toLocaleString("de-DE")} kWh</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4">
                  <div className="bg-orange-500 h-4 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Effizienzfaktor: 1 kWh Strom → {(waermeerzeugung / energieverbrauch).toFixed(1)} kWh Wärme
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Anlagen Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Wärmepumpen-Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {heatPumps.map((pump) => (
                <div key={pump.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Flame className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{pump.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pump.gebaeude} · {pump.typ}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Aktiv
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wartungshinweise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Wartungshinweise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {wartungshinweise
                .sort((a, b) => {
                  const order = { hoch: 0, mittel: 1, niedrig: 2 };
                  return order[a.prioritaet] - order[b.prioritaet];
                })
                .map((hinweis) => (
                  <div key={hinweis.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{hinweis.text}</p>
                        <p className="text-sm text-muted-foreground">
                          Anlage: {hinweis.anlage} · Fällig: {new Date(hinweis.faellig).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={prioritaetConfig[hinweis.prioritaet].className}>
                      {prioritaetConfig[hinweis.prioritaet].label}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
