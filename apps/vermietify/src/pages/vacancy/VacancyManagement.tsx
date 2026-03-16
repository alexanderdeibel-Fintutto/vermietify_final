import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  AlertCircle,
  Clock,
  Euro,
  Percent,
  Megaphone,
  Paintbrush,
  ExternalLink,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

type RenovationStatus = "nicht_noetig" | "geplant" | "in_arbeit" | "abgeschlossen";
type MarketingStatus = "inseriert" | "nicht_inseriert";

interface VacantUnit {
  id: string;
  einheit: string;
  gebaeude: string;
  flaeche: number;
  seitDatum: string;
  letzteMonatsmiete: number;
  renovierung: RenovationStatus;
  marketing: MarketingStatus;
  geplanteBesichtigungen: number;
}

const RENOVATION_CONFIG: Record<RenovationStatus, { label: string; color: string }> = {
  nicht_noetig: { label: "Nicht notig", color: "bg-emerald-100 text-emerald-800" },
  geplant: { label: "Geplant", color: "bg-blue-100 text-blue-800" },
  in_arbeit: { label: "In Arbeit", color: "bg-yellow-100 text-yellow-800" },
  abgeschlossen: { label: "Abgeschlossen", color: "bg-emerald-100 text-emerald-800" },
};

const MARKETING_CONFIG: Record<MarketingStatus, { label: string; color: string }> = {
  inseriert: { label: "Inseriert", color: "bg-emerald-100 text-emerald-800" },
  nicht_inseriert: { label: "Nicht inseriert", color: "bg-orange-100 text-orange-800" },
};

const placeholderUnits: VacantUnit[] = [
  { id: "1", einheit: "Wohnung 2B", gebaeude: "Hauptstr. 12", flaeche: 68, seitDatum: "2026-01-15", letzteMonatsmiete: 750, renovierung: "in_arbeit", marketing: "nicht_inseriert", geplanteBesichtigungen: 0 },
  { id: "2", einheit: "Wohnung 4A", gebaeude: "Hauptstr. 12", flaeche: 85, seitDatum: "2026-02-01", letzteMonatsmiete: 950, renovierung: "nicht_noetig", marketing: "inseriert", geplanteBesichtigungen: 3 },
  { id: "3", einheit: "Wohnung 1C", gebaeude: "Gartenweg 5", flaeche: 55, seitDatum: "2025-11-01", letzteMonatsmiete: 620, renovierung: "abgeschlossen", marketing: "inseriert", geplanteBesichtigungen: 5 },
  { id: "4", einheit: "Gewerbe EG", gebaeude: "Bergstr. 8", flaeche: 120, seitDatum: "2025-08-15", letzteMonatsmiete: 1800, renovierung: "geplant", marketing: "nicht_inseriert", geplanteBesichtigungen: 0 },
];

const totalUnits = 24; // placeholder total units in portfolio

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default function VacancyManagement() {
  const [units] = useState<VacantUnit[]>(placeholderUnits);
  const [filterGebaeude, setFilterGebaeude] = useState<string>("alle");

  const gebaeude = [...new Set(units.map((u) => u.gebaeude))];

  const filteredUnits = units.filter(
    (u) => filterGebaeude === "alle" || u.gebaeude === filterGebaeude
  );

  const stats = useMemo(() => {
    const leerstehend = units.length;
    const quote = totalUnits > 0 ? (leerstehend / totalUnits) * 100 : 0;
    const avgDauer = units.length > 0
      ? units.reduce((s, u) => s + daysSince(u.seitDatum), 0) / units.length
      : 0;
    const mietausfall = units.reduce((s, u) => s + u.letzteMonatsmiete, 0);
    return { leerstehend, quote, avgDauer, mietausfall };
  }, [units]);

  return (
    <MainLayout
      title="Leerstandsmanagement"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Leerstand" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Leerstandsmanagement"
          subtitle="Uberwachen und verwalten Sie leerstehende Einheiten und den Wiedervermietungsprozess."
        />

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100">
                <Home className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leerstehende Einheiten</p>
                <p className="text-2xl font-bold">{stats.leerstehend} / {totalUnits}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100">
                <Percent className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leerstandsquote</p>
                <p className="text-2xl font-bold">{stats.quote.toFixed(1)} %</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Durchschn. Leerdauer</p>
                <p className="text-2xl font-bold">{Math.round(stats.avgDauer)} Tage</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100">
                <Euro className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mietausfallkosten / Monat</p>
                <p className="text-2xl font-bold">{formatEuro(stats.mietausfall)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Gebaude</label>
                <Select value={filterGebaeude} onValueChange={setFilterGebaeude}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Gebaude</SelectItem>
                    {gebaeude.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vacant Units Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-primary" />
              Leerstehende Einheiten ({filteredUnits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Einheit</TableHead>
                  <TableHead>Gebaude</TableHead>
                  <TableHead>Flache</TableHead>
                  <TableHead>Leer seit</TableHead>
                  <TableHead>Leerdauer</TableHead>
                  <TableHead>Letzte Miete</TableHead>
                  <TableHead>Renovierung</TableHead>
                  <TableHead>Marketing</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map((unit) => {
                  const days = daysSince(unit.seitDatum);
                  const renoCfg = RENOVATION_CONFIG[unit.renovierung];
                  const marketCfg = MARKETING_CONFIG[unit.marketing];

                  return (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.einheit}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {unit.gebaeude}
                        </div>
                      </TableCell>
                      <TableCell>{unit.flaeche} m2</TableCell>
                      <TableCell>{unit.seitDatum}</TableCell>
                      <TableCell>
                        <Badge className={days > 90 ? "bg-red-100 text-red-800" : days > 30 ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}>
                          {days} Tage
                        </Badge>
                      </TableCell>
                      <TableCell>{formatEuro(unit.letzteMonatsmiete)}</TableCell>
                      <TableCell>
                        <Badge className={renoCfg.color}>
                          <Paintbrush className="h-3 w-3 mr-1" />
                          {renoCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={marketCfg.color}>
                          <Megaphone className="h-3 w-3 mr-1" />
                          {marketCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/listings">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Inserat
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wiedervermietungs-Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUnits.map((unit) => {
                const days = daysSince(unit.seitDatum);
                const estDays =
                  unit.renovierung === "in_arbeit" || unit.renovierung === "geplant" ? 60 :
                  unit.marketing === "nicht_inseriert" ? 45 : 30;
                const progress = Math.min(100, (days / (days + estDays)) * 100);

                return (
                  <div key={unit.id} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{unit.einheit} - {unit.gebaeude}</span>
                      <span className="text-sm text-muted-foreground">
                        Geschatzt noch {estDays} Tage bis Wiedervermietung
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Leer seit {days} Tagen</span>
                      <span>{unit.geplanteBesichtigungen} Besichtigungen geplant</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
