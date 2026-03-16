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
import { LineChart, ArrowLeft, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

interface WertRow {
  jahr: number;
  wert: number;
  steigerung: number;
  steigerungProzent: number;
}

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
    maximumFractionDigits: 1,
  }) + " %";
}

export default function WertentwicklungsRechner() {
  const [aktuellerWert, setAktuellerWert] = useState(300000);
  const [jaehrlicheSteigerung, setJaehrlicheSteigerung] = useState(2.0);
  const [zeitraum, setZeitraum] = useState(20);

  const result = useMemo(() => {
    const schedule: WertRow[] = [];
    let wert = aktuellerWert;

    for (let jahr = 1; jahr <= zeitraum; jahr++) {
      const neuerWert = wert * (1 + jaehrlicheSteigerung / 100);
      const steigerung = neuerWert - wert;
      wert = neuerWert;

      schedule.push({
        jahr,
        wert,
        steigerung,
        steigerungProzent: jaehrlicheSteigerung,
      });
    }

    const endwert = schedule.length > 0 ? schedule[schedule.length - 1].wert : aktuellerWert;
    const gesamtSteigerung = endwert - aktuellerWert;
    const gesamtSteigerungProzent =
      aktuellerWert > 0 ? ((endwert / aktuellerWert) - 1) * 100 : 0;

    return {
      schedule,
      endwert,
      gesamtSteigerung,
      gesamtSteigerungProzent,
    };
  }, [aktuellerWert, jaehrlicheSteigerung, zeitraum]);

  return (
    <MainLayout
      title="Wertentwicklungs-Rechner"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Rechner", href: "/calculators" },
        { label: "Wertentwicklungs-Rechner" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Wertentwicklungs-Rechner"
          subtitle="Simulieren Sie die Wertentwicklung Ihrer Immobilie uber einen frei wahlbaren Zeitraum."
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
                <LineChart className="h-5 w-5 text-primary" />
                Eingaben
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aktuellerWert">Aktueller Wert</Label>
                <Input
                  id="aktuellerWert"
                  type="number"
                  value={aktuellerWert}
                  onChange={(e) => setAktuellerWert(Number(e.target.value))}
                  min={0}
                  step={10000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="steigerung">Jahrliche Wertsteigerung (%)</Label>
                <Input
                  id="steigerung"
                  type="number"
                  value={jaehrlicheSteigerung}
                  onChange={(e) =>
                    setJaehrlicheSteigerung(Number(e.target.value))
                  }
                  min={-10}
                  max={20}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  Langfristiger Durchschnitt in Deutschland: ca. 2-3% pro Jahr
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zeitraum">Betrachtungszeitraum (Jahre)</Label>
                <Input
                  id="zeitraum"
                  type="number"
                  value={zeitraum}
                  onChange={(e) => setZeitraum(Number(e.target.value))}
                  min={1}
                  max={50}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-1">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Aktueller Wert</p>
                  <p className="text-2xl font-bold">
                    {formatEuro(aktuellerWert)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Prognostizierter Wert nach {zeitraum} Jahren
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {formatEuro(result.endwert)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Wertzuwachs absolut
                  </span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    + {formatEuro(result.gesamtSteigerung)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Wertzuwachs relativ
                  </span>
                  <span className="font-semibold text-emerald-600">
                    + {formatPercent(result.gesamtSteigerungProzent)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Durchschnittlicher Zuwachs / Jahr
                  </span>
                  <span className="font-semibold">
                    {zeitraum > 0
                      ? formatEuro(result.gesamtSteigerung / zeitraum)
                      : formatEuro(0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wertentwicklung pro Jahr</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Jahr</TableHead>
                    <TableHead className="text-right">Immobilienwert</TableHead>
                    <TableHead className="text-right">Wertzuwachs</TableHead>
                    <TableHead className="text-right">
                      Gesamtzuwachs seit Start
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-medium">0</TableCell>
                    <TableCell className="text-right">
                      {formatEuro(aktuellerWert)}
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">-</TableCell>
                  </TableRow>
                  {result.schedule.map((row) => (
                    <TableRow key={row.jahr}>
                      <TableCell className="font-medium">{row.jahr}</TableCell>
                      <TableCell className="text-right">
                        {formatEuro(row.wert)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600">
                        + {formatEuro(row.steigerung)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600">
                        + {formatEuro(row.wert - aktuellerWert)}
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
