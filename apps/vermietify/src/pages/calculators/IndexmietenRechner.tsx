import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Calculator, Info, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function formatPercent(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " %";
}

const vpiData = [
  { jahr: 2020, monat: "Januar", vpi: 105.2 },
  { jahr: 2020, monat: "Juli", vpi: 106.1 },
  { jahr: 2021, monat: "Januar", vpi: 107.0 },
  { jahr: 2021, monat: "Juli", vpi: 109.8 },
  { jahr: 2022, monat: "Januar", vpi: 111.5 },
  { jahr: 2022, monat: "Juli", vpi: 117.4 },
  { jahr: 2023, monat: "Januar", vpi: 118.2 },
  { jahr: 2023, monat: "Juli", vpi: 119.4 },
  { jahr: 2024, monat: "Januar", vpi: 120.3 },
  { jahr: 2024, monat: "Juli", vpi: 121.1 },
  { jahr: 2025, monat: "Januar", vpi: 122.0 },
  { jahr: 2025, monat: "Juli", vpi: 122.8 },
  { jahr: 2026, monat: "Januar", vpi: 123.5 },
];

export default function IndexmietenRechner() {
  const [basisMiete, setBasisMiete] = useState(800);
  const [basisVPI, setBasisVPI] = useState(105.2);
  const [aktuellerVPI, setAktuellerVPI] = useState(123.5);

  const result = useMemo(() => {
    const neueMiete = basisVPI > 0 ? basisMiete * (aktuellerVPI / basisVPI) : basisMiete;
    const anpassungsbetrag = neueMiete - basisMiete;
    const aenderungProzent = basisMiete > 0 ? (anpassungsbetrag / basisMiete) * 100 : 0;
    return { neueMiete, anpassungsbetrag, aenderungProzent };
  }, [basisMiete, basisVPI, aktuellerVPI]);

  return (
    <MainLayout
      title="Indexmieten-Rechner"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Rechner", href: "/calculators" },
        { label: "Indexmieten-Rechner" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Indexmieten-Rechner"
          subtitle="Berechnen Sie die Mietanpassung auf Basis des Verbraucherpreisindex (VPI) gemaess Paragraph 557b BGB."
          actions={
            <Button variant="outline" asChild>
              <Link to="/calculators">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Alle Rechner
              </Link>
            </Button>
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Inputs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-primary" />
                Eingaben
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="basisMiete">Basis-Kaltmiete (EUR / Monat)</Label>
                <Input
                  id="basisMiete"
                  type="number"
                  value={basisMiete}
                  onChange={(e) => setBasisMiete(Number(e.target.value))}
                  min={0}
                  step={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basisVPI">Basis-VPI (bei Mietbeginn)</Label>
                <Input
                  id="basisVPI"
                  type="number"
                  value={basisVPI}
                  onChange={(e) => setBasisVPI(Number(e.target.value))}
                  min={0}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  Verbraucherpreisindex zum Zeitpunkt des Mietvertragsbeginns
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aktuellerVPI">Aktueller VPI</Label>
                <Input
                  id="aktuellerVPI"
                  type="number"
                  value={aktuellerVPI}
                  onChange={(e) => setAktuellerVPI(Number(e.target.value))}
                  min={0}
                  step={0.1}
                />
              </div>

              <Card className="bg-muted/50 border-dashed">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-1">Berechnungsformel:</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    Neue Miete = Basis-Miete x (Aktueller VPI / Basis-VPI)
                  </p>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    = {formatEuro(basisMiete)} x ({aktuellerVPI} / {basisVPI})
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Neue Miete</p>
                <p className="text-4xl font-bold text-primary mt-1">
                  {formatEuro(result.neueMiete)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">pro Monat</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Anpassungsbetrag</p>
                  <p className={`text-2xl font-bold mt-1 ${result.anpassungsbetrag >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {result.anpassungsbetrag >= 0 ? "+" : ""}{formatEuro(result.anpassungsbetrag)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Veranderung</p>
                  <p className={`text-2xl font-bold mt-1 ${result.aenderungProzent >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {result.aenderungProzent >= 0 ? "+" : ""}{formatPercent(result.aenderungProzent)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Hinweis zu Paragraph 557b BGB</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Bei einem Indexmietvertrag kann die Miete entsprechend der Veranderung
                      des Verbraucherpreisindex angepasst werden. Die Anpassung muss
                      schriftlich gegenuber dem Mieter geltend gemacht werden und wird
                      fruhestens im ubernachsten Monat wirksam.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* VPI History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Historische VPI-Daten (Basisjahr 2020 = 100)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jahr</TableHead>
                  <TableHead>Monat</TableHead>
                  <TableHead>VPI</TableHead>
                  <TableHead>Veranderung zum Vorjahr</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vpiData.map((row, idx) => {
                  const prevYear = vpiData.find(
                    (r) => r.jahr === row.jahr - 1 && r.monat === row.monat
                  );
                  const change = prevYear
                    ? ((row.vpi - prevYear.vpi) / prevYear.vpi) * 100
                    : null;

                  return (
                    <TableRow key={idx}>
                      <TableCell>{row.jahr}</TableCell>
                      <TableCell>{row.monat}</TableCell>
                      <TableCell className="font-medium">{row.vpi.toFixed(1)}</TableCell>
                      <TableCell>
                        {change !== null ? (
                          <Badge
                            className={
                              change >= 0
                                ? "bg-orange-100 text-orange-800"
                                : "bg-emerald-100 text-emerald-800"
                            }
                          >
                            {change >= 0 ? "+" : ""}
                            {formatPercent(change)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-4">
              * Platzhalterdaten. Aktuelle VPI-Werte finden Sie beim Statistischen Bundesamt (Destatis).
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
