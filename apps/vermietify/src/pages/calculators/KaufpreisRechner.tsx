import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calculator, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const GRUNDERWERBSTEUER_SAETZE: Record<string, number> = {
  "Baden-Wuerttemberg": 5.0,
  Bayern: 3.5,
  Berlin: 6.0,
  Brandenburg: 6.5,
  Bremen: 5.0,
  Hamburg: 5.5,
  Hessen: 6.0,
  "Mecklenburg-Vorpommern": 6.0,
  Niedersachsen: 5.0,
  "Nordrhein-Westfalen": 6.5,
  "Rheinland-Pfalz": 5.0,
  Saarland: 6.5,
  Sachsen: 5.5,
  "Sachsen-Anhalt": 5.0,
  "Schleswig-Holstein": 6.5,
  Thueringen: 5.0,
};

const NOTAR_SATZ = 1.5;
const GRUNDBUCH_SATZ = 0.5;

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function formatPercent(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }) + " %";
}

export default function KaufpreisRechner() {
  const [kaufpreis, setKaufpreis] = useState(300000);
  const [bundesland, setBundesland] = useState("Bayern");
  const [maklergebuehr, setMaklergebuehr] = useState(3.57);

  const result = useMemo(() => {
    const grunderwerbsteuerSatz = GRUNDERWERBSTEUER_SAETZE[bundesland] ?? 5.0;
    const grunderwerbsteuer = kaufpreis * (grunderwerbsteuerSatz / 100);
    const notarkosten = kaufpreis * (NOTAR_SATZ / 100);
    const grundbuchkosten = kaufpreis * (GRUNDBUCH_SATZ / 100);
    const makler = kaufpreis * (maklergebuehr / 100);
    const nebenkosten = grunderwerbsteuer + notarkosten + grundbuchkosten + makler;
    const gesamtkosten = kaufpreis + nebenkosten;
    const nebenkostenProzent =
      grunderwerbsteuerSatz + NOTAR_SATZ + GRUNDBUCH_SATZ + maklergebuehr;

    return {
      grunderwerbsteuerSatz,
      grunderwerbsteuer,
      notarkosten,
      grundbuchkosten,
      makler,
      nebenkosten,
      gesamtkosten,
      nebenkostenProzent,
    };
  }, [kaufpreis, bundesland, maklergebuehr]);

  const kostenPositionen = [
    {
      label: "Kaufpreis",
      betrag: kaufpreis,
      prozent: null as number | null,
    },
    {
      label: "Grunderwerbsteuer",
      betrag: result.grunderwerbsteuer,
      prozent: result.grunderwerbsteuerSatz,
    },
    {
      label: "Notarkosten",
      betrag: result.notarkosten,
      prozent: NOTAR_SATZ,
    },
    {
      label: "Grundbuchkosten",
      betrag: result.grundbuchkosten,
      prozent: GRUNDBUCH_SATZ,
    },
    {
      label: "Maklergebühr",
      betrag: result.makler,
      prozent: maklergebuehr,
    },
  ];

  return (
    <MainLayout
      title="Kaufpreis-Rechner"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Rechner", href: "/calculators" },
        { label: "Kaufpreis-Rechner" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Kaufpreis-Rechner"
          subtitle="Ermitteln Sie die Gesamtkosten beim Immobilienkauf inklusive aller Nebenkosten."
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
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-primary" />
                Eingaben
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kaufpreis">Kaufpreis</Label>
                <Input
                  id="kaufpreis"
                  type="number"
                  value={kaufpreis}
                  onChange={(e) => setKaufpreis(Number(e.target.value))}
                  min={0}
                  step={10000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bundesland">Bundesland</Label>
                <Select value={bundesland} onValueChange={setBundesland}>
                  <SelectTrigger id="bundesland">
                    <SelectValue placeholder="Bundesland wahlen" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(GRUNDERWERBSTEUER_SAETZE).map((land) => (
                      <SelectItem key={land} value={land}>
                        {land.replace(/-/g, "-")} ({GRUNDERWERBSTEUER_SAETZE[land]} %)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="makler">Maklergebühr (%)</Label>
                <Input
                  id="makler"
                  type="number"
                  value={maklergebuehr}
                  onChange={(e) => setMaklergebuehr(Number(e.target.value))}
                  min={0}
                  max={10}
                  step={0.01}
                />
                <p className="text-xs text-muted-foreground">
                  Typisch: 3,57% (inkl. MwSt.) je Kauferseite
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gesamtkosten</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead className="text-right">Satz</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kostenPositionen.map((pos) => (
                    <TableRow key={pos.label}>
                      <TableCell>{pos.label}</TableCell>
                      <TableCell className="text-right">
                        {pos.prozent !== null ? formatPercent(pos.prozent) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatEuro(pos.betrag)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Nebenkosten gesamt ({formatPercent(result.nebenkostenProzent)})
                  </span>
                  <span className="font-semibold text-destructive">
                    {formatEuro(result.nebenkosten)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Gesamtkosten</span>
                  <span className="text-xl font-bold text-primary">
                    {formatEuro(result.gesamtkosten)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
