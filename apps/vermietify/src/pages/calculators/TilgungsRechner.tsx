import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Landmark, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface TilgungsRow {
  jahr: number;
  restschuldAnfang: number;
  zinsAnteil: number;
  tilgungsAnteil: number;
  sondertilgung: number;
  gesamtZahlung: number;
  restschuldEnde: number;
}

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export default function TilgungsRechner() {
  const [darlehenssumme, setDarlehenssumme] = useState(240000);
  const [zinssatz, setZinssatz] = useState(3.5);
  const [tilgungssatz, setTilgungssatz] = useState(2.0);
  const [sondertilgung, setSondertilgung] = useState(0);

  const result = useMemo(() => {
    const monatszins = zinssatz / 100 / 12;
    const monatlicheRate =
      (darlehenssumme * (zinssatz + tilgungssatz)) / 100 / 12;

    const schedule: TilgungsRow[] = [];
    let restschuld = darlehenssumme;
    let gesamtZinskosten = 0;

    let restschuld10 = 0;
    let restschuld20 = 0;
    let restschuld30 = 0;

    for (let jahr = 1; restschuld > 0 && jahr <= 50; jahr++) {
      const restschuldAnfang = restschuld;
      let jahresZins = 0;
      let jahresTilgung = 0;

      for (let monat = 1; monat <= 12; monat++) {
        if (restschuld <= 0) break;
        const monatsZins = restschuld * monatszins;
        const monatsTilgung = Math.min(
          monatlicheRate - monatsZins,
          restschuld
        );
        jahresZins += monatsZins;
        jahresTilgung += monatsTilgung;
        restschuld -= monatsTilgung;
      }

      // Apply annual extra payment
      const tatsaechlicheSondertilgung = Math.min(sondertilgung, restschuld);
      restschuld -= tatsaechlicheSondertilgung;

      gesamtZinskosten += jahresZins;

      schedule.push({
        jahr,
        restschuldAnfang,
        zinsAnteil: jahresZins,
        tilgungsAnteil: jahresTilgung,
        sondertilgung: tatsaechlicheSondertilgung,
        gesamtZahlung: jahresZins + jahresTilgung + tatsaechlicheSondertilgung,
        restschuldEnde: Math.max(restschuld, 0),
      });

      if (jahr === 10) restschuld10 = Math.max(restschuld, 0);
      if (jahr === 20) restschuld20 = Math.max(restschuld, 0);
      if (jahr === 30) restschuld30 = Math.max(restschuld, 0);
    }

    // If the loan finishes before year 10/20/30, set remaining to 0
    const totalYears = schedule.length;
    if (totalYears < 10) restschuld10 = 0;
    if (totalYears < 20) restschuld20 = 0;
    if (totalYears < 30) restschuld30 = 0;

    return {
      monatlicheRate,
      restschuld10,
      restschuld20,
      restschuld30,
      gesamtZinskosten,
      laufzeitJahre: totalYears,
      schedule,
    };
  }, [darlehenssumme, zinssatz, tilgungssatz, sondertilgung]);

  return (
    <MainLayout
      title="Tilgungs-Rechner"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Rechner", href: "/calculators" },
        { label: "Tilgungs-Rechner" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Tilgungs-Rechner"
          subtitle="Planen Sie Ihre Immobilienfinanzierung mit detailliertem Tilgungsplan."
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
                <Landmark className="h-5 w-5 text-primary" />
                Eingaben
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="darlehenssumme">Darlehenssumme</Label>
                <Input
                  id="darlehenssumme"
                  type="number"
                  value={darlehenssumme}
                  onChange={(e) => setDarlehenssumme(Number(e.target.value))}
                  min={0}
                  step={10000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zinssatz">Zinssatz (%)</Label>
                <Input
                  id="zinssatz"
                  type="number"
                  value={zinssatz}
                  onChange={(e) => setZinssatz(Number(e.target.value))}
                  min={0}
                  max={15}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tilgungssatz">Tilgungssatz (%)</Label>
                <Input
                  id="tilgungssatz"
                  type="number"
                  value={tilgungssatz}
                  onChange={(e) => setTilgungssatz(Number(e.target.value))}
                  min={0}
                  max={15}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sondertilgung">Sondertilgung / Jahr</Label>
                <Input
                  id="sondertilgung"
                  type="number"
                  value={sondertilgung}
                  onChange={(e) => setSondertilgung(Number(e.target.value))}
                  min={0}
                  step={1000}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ergebnis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monatliche Rate</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatEuro(result.monatlicheRate)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Laufzeit</p>
                  <p className="text-2xl font-bold">
                    {result.laufzeitJahre} Jahre
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Restschuld nach 10 Jahren
                  </span>
                  <span className="font-semibold">
                    {formatEuro(result.restschuld10)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Restschuld nach 20 Jahren
                  </span>
                  <span className="font-semibold">
                    {formatEuro(result.restschuld20)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Restschuld nach 30 Jahren
                  </span>
                  <span className="font-semibold">
                    {formatEuro(result.restschuld30)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-base font-semibold">
                    Zinskosten gesamt
                  </span>
                  <span className="text-xl font-bold text-destructive">
                    {formatEuro(result.gesamtZinskosten)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tilgungsplan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Jahr</TableHead>
                    <TableHead className="text-right">Restschuld (Anfang)</TableHead>
                    <TableHead className="text-right">Zinsanteil</TableHead>
                    <TableHead className="text-right">Tilgungsanteil</TableHead>
                    {sondertilgung > 0 && (
                      <TableHead className="text-right">Sondertilgung</TableHead>
                    )}
                    <TableHead className="text-right">Restschuld (Ende)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.schedule.map((row) => (
                    <TableRow key={row.jahr}>
                      <TableCell className="font-medium">{row.jahr}</TableCell>
                      <TableCell className="text-right">
                        {formatEuro(row.restschuldAnfang)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatEuro(row.zinsAnteil)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatEuro(row.tilgungsAnteil)}
                      </TableCell>
                      {sondertilgung > 0 && (
                        <TableCell className="text-right">
                          {formatEuro(row.sondertilgung)}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        {formatEuro(row.restschuldEnde)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
