import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UnitConsumption {
  id: string;
  name: string;
  etage: string;
  verbrauch: number;
  vorperiode: number;
  flaeche: number;
}

const buildings = [
  { id: "1", name: "Musterstraße 10" },
  { id: "2", name: "Hauptweg 5" },
  { id: "3", name: "Parkallee 22" },
];

const unitsData: Record<string, UnitConsumption[]> = {
  "1": [
    { id: "1a", name: "Whg. 1", etage: "EG links", verbrauch: 2800, vorperiode: 2600, flaeche: 65 },
    { id: "1b", name: "Whg. 2", etage: "EG rechts", verbrauch: 1900, vorperiode: 2100, flaeche: 72 },
    { id: "1c", name: "Whg. 3", etage: "1. OG links", verbrauch: 4200, vorperiode: 3100, flaeche: 65 },
    { id: "1d", name: "Whg. 4", etage: "1. OG rechts", verbrauch: 2400, vorperiode: 2500, flaeche: 72 },
    { id: "1e", name: "Whg. 5", etage: "2. OG links", verbrauch: 3100, vorperiode: 2900, flaeche: 65 },
    { id: "1f", name: "Whg. 6", etage: "2. OG rechts", verbrauch: 2100, vorperiode: 2200, flaeche: 72 },
    { id: "1g", name: "Whg. 7", etage: "DG links", verbrauch: 3800, vorperiode: 3500, flaeche: 55 },
    { id: "1h", name: "Whg. 8", etage: "DG rechts", verbrauch: 1500, vorperiode: 1600, flaeche: 55 },
  ],
  "2": [
    { id: "2a", name: "Whg. 1", etage: "EG", verbrauch: 3200, vorperiode: 3000, flaeche: 80 },
    { id: "2b", name: "Whg. 2", etage: "1. OG", verbrauch: 2600, vorperiode: 2800, flaeche: 80 },
    { id: "2c", name: "Whg. 3", etage: "2. OG", verbrauch: 4500, vorperiode: 3200, flaeche: 80 },
    { id: "2d", name: "Whg. 4", etage: "DG", verbrauch: 1800, vorperiode: 2000, flaeche: 60 },
  ],
  "3": [
    { id: "3a", name: "Whg. 1", etage: "EG links", verbrauch: 2200, vorperiode: 2300, flaeche: 70 },
    { id: "3b", name: "Whg. 2", etage: "EG rechts", verbrauch: 3600, vorperiode: 3400, flaeche: 70 },
    { id: "3c", name: "Whg. 3", etage: "1. OG links", verbrauch: 2900, vorperiode: 2800, flaeche: 70 },
    { id: "3d", name: "Whg. 4", etage: "1. OG rechts", verbrauch: 5100, vorperiode: 3900, flaeche: 70 },
    { id: "3e", name: "Whg. 5", etage: "DG", verbrauch: 1600, vorperiode: 1700, flaeche: 50 },
  ],
};

function getConsumptionLevel(verbrauchPerQm: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (verbrauchPerQm < 30) {
    return { label: "Niedrig", color: "text-green-800", bgColor: "bg-green-200" };
  }
  if (verbrauchPerQm < 45) {
    return { label: "Mittel", color: "text-yellow-800", bgColor: "bg-yellow-200" };
  }
  return { label: "Hoch", color: "text-red-800", bgColor: "bg-red-200" };
}

function getHeatmapColor(verbrauchPerQm: number): string {
  if (verbrauchPerQm < 25) return "bg-green-100 border-green-300";
  if (verbrauchPerQm < 30) return "bg-green-200 border-green-400";
  if (verbrauchPerQm < 35) return "bg-yellow-100 border-yellow-300";
  if (verbrauchPerQm < 45) return "bg-yellow-200 border-yellow-400";
  if (verbrauchPerQm < 55) return "bg-orange-200 border-orange-400";
  return "bg-red-200 border-red-400";
}

export default function ConsumptionHeatmap() {
  const [selectedBuilding, setSelectedBuilding] = useState("1");
  const [zeitraum, setZeitraum] = useState("monat");

  const units = unitsData[selectedBuilding] || [];
  const avgVerbrauch =
    units.reduce((sum, u) => sum + u.verbrauch / u.flaeche, 0) / units.length;

  return (
    <MainLayout
      title="Verbrauchs-Heatmap"
      breadcrumbs={[
        { label: "Energie", href: "/energy" },
        { label: "Verbrauchs-Heatmap" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Verbrauchs-Heatmap"
          subtitle="Farbcodierte Verbrauchsübersicht aller Einheiten nach Gebäude."
        />

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Gebäude</label>
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Zeitraum</label>
            <Select value={zeitraum} onValueChange={setZeitraum}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monat">Monat</SelectItem>
                <SelectItem value="quartal">Quartal</SelectItem>
                <SelectItem value="jahr">Jahr</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Legend */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">Legende (kWh/m²):</span>
              <div className="flex items-center gap-1">
                <div className="h-6 w-10 rounded bg-green-100 border border-green-300" />
                <div className="h-6 w-10 rounded bg-green-200 border border-green-400" />
                <div className="h-6 w-10 rounded bg-yellow-100 border border-yellow-300" />
                <div className="h-6 w-10 rounded bg-yellow-200 border border-yellow-400" />
                <div className="h-6 w-10 rounded bg-orange-200 border border-orange-400" />
                <div className="h-6 w-10 rounded bg-red-200 border border-red-400" />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Niedrig (&lt;30)</span>
                <span>Mittel (30-45)</span>
                <span>Hoch (&gt;45)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Heatmap Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {buildings.find((b) => b.id === selectedBuilding)?.name} - Einheiten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {units.map((unit) => {
                const perQm = unit.verbrauch / unit.flaeche;
                const level = getConsumptionLevel(perQm);
                const heatColor = getHeatmapColor(perQm);
                const diff = ((unit.verbrauch - unit.vorperiode) / unit.vorperiode) * 100;

                return (
                  <div
                    key={unit.id}
                    className={cn(
                      "rounded-lg border-2 p-4 transition-all hover:shadow-md",
                      heatColor
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{unit.name}</p>
                      <Badge variant="outline" className={cn(level.bgColor, level.color, "text-xs")}>
                        {level.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{unit.etage}</p>
                    <div className="space-y-1">
                      <p className="text-lg font-bold">{unit.verbrauch.toLocaleString("de-DE")} kWh</p>
                      <p className="text-xs text-muted-foreground">
                        {perQm.toFixed(1)} kWh/m² · {unit.flaeche} m²
                      </p>
                      <div className="flex items-center gap-1 text-xs mt-1">
                        {diff > 2 ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-red-600" />
                            <span className="text-red-600">+{diff.toFixed(1)}% vs. Vorperiode</span>
                          </>
                        ) : diff < -2 ? (
                          <>
                            <TrendingDown className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">{diff.toFixed(1)}% vs. Vorperiode</span>
                          </>
                        ) : (
                          <>
                            <Minus className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Stabil vs. Vorperiode</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Zusammenfassung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Durchschnittl. Verbrauch</p>
                <p className="text-xl font-bold">{avgVerbrauch.toFixed(1)} kWh/m²</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Höchster Verbrauch</p>
                <p className="text-xl font-bold text-red-600">
                  {Math.max(...units.map((u) => u.verbrauch / u.flaeche)).toFixed(1)} kWh/m²
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Niedrigster Verbrauch</p>
                <p className="text-xl font-bold text-green-600">
                  {Math.min(...units.map((u) => u.verbrauch / u.flaeche)).toFixed(1)} kWh/m²
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
