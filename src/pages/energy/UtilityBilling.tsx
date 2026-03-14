import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Download,
  Building2,
  Euro,
  Calendar,
  Zap,
  Flame,
  Droplets,
  Trash2,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Kostenart {
  id: string;
  name: string;
  icon: React.ElementType;
  gesamtkosten: number;
  einheit: string;
}

interface UnitBreakdown {
  id: string;
  name: string;
  etage: string;
  flaeche: number;
  personen: number;
  anteilFlaeche: number;
  anteilPersonen: number;
  anteilVerbrauch: number;
  kosten: number;
}

const kostenarten: Kostenart[] = [
  { id: "1", name: "Heizkosten", icon: Flame, gesamtkosten: 8420, einheit: "kWh" },
  { id: "2", name: "Warmwasser", icon: Droplets, gesamtkosten: 2180, einheit: "m³" },
  { id: "3", name: "Kaltwasser", icon: Droplets, gesamtkosten: 1560, einheit: "m³" },
  { id: "4", name: "Allgemeinstrom", icon: Zap, gesamtkosten: 890, einheit: "kWh" },
  { id: "5", name: "Müllabfuhr", icon: Trash2, gesamtkosten: 1240, einheit: "pauschal" },
  { id: "6", name: "Kabelanschluss", icon: Wifi, gesamtkosten: 480, einheit: "pauschal" },
];

const unitBreakdowns: UnitBreakdown[] = [
  { id: "1", name: "Whg. 1", etage: "EG links", flaeche: 65, personen: 2, anteilFlaeche: 13.0, anteilPersonen: 11.1, anteilVerbrauch: 14.5, kosten: 0 },
  { id: "2", name: "Whg. 2", etage: "EG rechts", flaeche: 72, personen: 3, anteilFlaeche: 14.4, anteilPersonen: 16.7, anteilVerbrauch: 12.2, kosten: 0 },
  { id: "3", name: "Whg. 3", etage: "1. OG links", flaeche: 65, personen: 1, anteilFlaeche: 13.0, anteilPersonen: 5.6, anteilVerbrauch: 18.8, kosten: 0 },
  { id: "4", name: "Whg. 4", etage: "1. OG rechts", flaeche: 72, personen: 4, anteilFlaeche: 14.4, anteilPersonen: 22.2, anteilVerbrauch: 15.0, kosten: 0 },
  { id: "5", name: "Whg. 5", etage: "2. OG links", flaeche: 65, personen: 2, anteilFlaeche: 13.0, anteilPersonen: 11.1, anteilVerbrauch: 16.3, kosten: 0 },
  { id: "6", name: "Whg. 6", etage: "2. OG rechts", flaeche: 72, personen: 3, anteilFlaeche: 14.4, anteilPersonen: 16.7, anteilVerbrauch: 11.5, kosten: 0 },
  { id: "7", name: "Whg. 7", etage: "DG links", flaeche: 55, personen: 2, anteilFlaeche: 11.0, anteilPersonen: 11.1, anteilVerbrauch: 8.2, kosten: 0 },
  { id: "8", name: "Whg. 8", etage: "DG rechts", flaeche: 34, personen: 1, anteilFlaeche: 6.8, anteilPersonen: 5.6, anteilVerbrauch: 3.5, kosten: 0 },
];

type Umlageschluessel = "flaeche" | "personen" | "verbrauch";

const buildings = [
  { id: "1", name: "Musterstraße 10" },
  { id: "2", name: "Hauptweg 5" },
  { id: "3", name: "Parkallee 22" },
];

export default function UtilityBilling() {
  const [selectedBuilding, setSelectedBuilding] = useState("1");
  const [umlageschluessel, setUmlageschluessel] = useState<Umlageschluessel>("flaeche");
  const [abrechnungszeitraum, setAbrechnungszeitraum] = useState("2025");

  const gesamtkosten = kostenarten.reduce((sum, k) => sum + k.gesamtkosten, 0);

  const getAnteil = (unit: UnitBreakdown): number => {
    switch (umlageschluessel) {
      case "flaeche":
        return unit.anteilFlaeche;
      case "personen":
        return unit.anteilPersonen;
      case "verbrauch":
        return unit.anteilVerbrauch;
    }
  };

  const computedUnits = unitBreakdowns.map((u) => ({
    ...u,
    kosten: (gesamtkosten * getAnteil(u)) / 100,
  }));

  return (
    <MainLayout
      title="Nebenkostenabrechnung"
      breadcrumbs={[
        { label: "Energie", href: "/energy" },
        { label: "Nebenkostenabrechnung" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Nebenkostenabrechnung"
          subtitle="Erstellen und verwalten Sie Betriebskostenabrechnungen."
          actions={
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export (PDF)
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Abrechnungszeitraum</label>
            <Select value={abrechnungszeitraum} onValueChange={setAbrechnungszeitraum}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">01.01.2025 - 31.12.2025</SelectItem>
                <SelectItem value="2024">01.01.2024 - 31.12.2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Gebäude</label>
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="w-[220px]">
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
            <label className="text-sm font-medium text-muted-foreground">Umlageschlüssel</label>
            <Select value={umlageschluessel} onValueChange={(v) => setUmlageschluessel(v as Umlageschluessel)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flaeche">Nach Fläche (m²)</SelectItem>
                <SelectItem value="personen">Nach Personen</SelectItem>
                <SelectItem value="verbrauch">Nach Verbrauch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cost Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Kostenübersicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {kostenarten.map((k) => {
                const Icon = k.icon;
                return (
                  <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-sm">{k.name}</span>
                    </div>
                    <span className="font-bold">{k.gesamtkosten.toLocaleString("de-DE")} €</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="font-semibold text-lg">Gesamtkosten</span>
              <span className="font-bold text-xl">{gesamtkosten.toLocaleString("de-DE")} €</span>
            </div>
          </CardContent>
        </Card>

        {/* Per-Unit Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Kostenverteilung pro Einheit
              <Badge variant="outline" className="ml-2">
                {umlageschluessel === "flaeche"
                  ? "nach Fläche"
                  : umlageschluessel === "personen"
                  ? "nach Personen"
                  : "nach Verbrauch"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Einheit</TableHead>
                  <TableHead>Etage</TableHead>
                  <TableHead className="text-right">Fläche</TableHead>
                  <TableHead className="text-right">Personen</TableHead>
                  <TableHead className="text-right">Anteil</TableHead>
                  <TableHead className="text-right">Kosten</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computedUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>{unit.etage}</TableCell>
                    <TableCell className="text-right">{unit.flaeche} m²</TableCell>
                    <TableCell className="text-right">{unit.personen}</TableCell>
                    <TableCell className="text-right">{getAnteil(unit).toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-bold">
                      {unit.kosten.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold border-t-2">
                  <TableCell colSpan={4}>Gesamt</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                  <TableCell className="text-right">
                    {gesamtkosten.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
