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
import { Building2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface AfaRow {
  jahr: number;
  afaBetrag: number;
  kumuliert: number;
  restwert: number;
}

function useAfaCalculator(
  kaufpreis: number,
  baujahr: number,
  gebaeudeanteil: number,
  afaSatz: number
) {
  return useMemo(() => {
    return calculateAfaSchedule(kaufpreis, baujahr, gebaeudeanteil, afaSatz);
  }, [kaufpreis, baujahr, gebaeudeanteil, afaSatz]);
}

function calculateAfaSchedule(
  kaufpreis: number,
  baujahr: number,
  gebaeudeanteil: number,
  afaSatz: number
): AfaRow[] {
  const gebaeudeWert = kaufpreis * (gebaeudeanteil / 100);
  const jahresAfa = gebaeudeWert * (afaSatz / 100);
  const gesamtJahre = Math.ceil(100 / afaSatz);
  const schedule: AfaRow[] = [];
  let kumuliert = 0;

  for (let i = 1; i <= gesamtJahre; i++) {
    const betrag = Math.min(jahresAfa, gebaeudeWert - kumuliert);
    if (betrag <= 0) break;
    kumuliert += betrag;
    schedule.push({
      jahr: i,
      afaBetrag: betrag,
      kumuliert,
      restwert: gebaeudeWert - kumuliert,
    });
  }

  return schedule;
}

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export default function AfACalculator() {
  const [kaufpreis, setKaufpreis] = useState(300000);
  const [baujahr, setBaujahr] = useState(2000);
  const [gebaeudeanteil, setGebaeudeanteil] = useState(80);
  const [afaSatz, setAfaSatz] = useState(2);

  const schedule = useAfaCalculator(kaufpreis, baujahr, gebaeudeanteil, afaSatz);

  const gebaeudeWert = useMemo(
    () => kaufpreis * (gebaeudeanteil / 100),
    [kaufpreis, gebaeudeanteil]
  );

  const jahresAfa = useMemo(
    () => gebaeudeWert * (afaSatz / 100),
    [gebaeudeWert, afaSatz]
  );

  return (
    <MainLayout
      title="AfA-Rechner"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Rechner", href: "/calculators" },
        { label: "AfA-Rechner" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="AfA-Rechner"
          subtitle="Berechnen Sie die Abschreibung (Absetzung fur Abnutzung) Ihrer Immobilie."
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
                <Building2 className="h-5 w-5 text-primary" />
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
                <Label htmlFor="baujahr">Baujahr</Label>
                <Input
                  id="baujahr"
                  type="number"
                  value={baujahr}
                  onChange={(e) => setBaujahr(Number(e.target.value))}
                  min={1800}
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gebaeudeanteil">Gebaudeanteil (%)</Label>
                <Input
                  id="gebaeudeanteil"
                  type="number"
                  value={gebaeudeanteil}
                  onChange={(e) => setGebaeudeanteil(Number(e.target.value))}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="afaSatz">AfA-Satz (%)</Label>
                <Input
                  id="afaSatz"
                  type="number"
                  value={afaSatz}
                  onChange={(e) => setAfaSatz(Number(e.target.value))}
                  min={0}
                  max={10}
                  step={0.5}
                />
                <p className="text-xs text-muted-foreground">
                  2% fur Gebaude ab 1925, 2,5% fur Gebaude vor 1925, 3% fur Neubau ab 2023
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gebaudewert</p>
                  <p className="text-xl font-bold">{formatEuro(gebaeudeWert)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Jahrliche AfA</p>
                  <p className="text-xl font-bold text-primary">
                    {formatEuro(jahresAfa)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monatliche AfA</p>
                  <p className="text-xl font-bold">{formatEuro(jahresAfa / 12)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">AfA-Dauer</p>
                  <p className="text-xl font-bold">
                    {afaSatz > 0 ? `${Math.ceil(100 / afaSatz)} Jahre` : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AfA-Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Jahr</TableHead>
                    <TableHead className="text-right">AfA-Betrag</TableHead>
                    <TableHead className="text-right">Kumuliert</TableHead>
                    <TableHead className="text-right">Restwert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((row) => (
                    <TableRow key={row.jahr}>
                      <TableCell className="font-medium">{row.jahr}</TableCell>
                      <TableCell className="text-right">
                        {formatEuro(row.afaBetrag)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatEuro(row.kumuliert)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatEuro(row.restwert)}
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
