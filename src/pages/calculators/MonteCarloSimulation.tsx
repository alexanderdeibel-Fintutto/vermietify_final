import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, BarChart3, Play, TrendingUp, Shield, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatPercent(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " %";
}

interface SimulationResult {
  medianRendite: number;
  p10: number;
  p90: number;
  positiveRate: number;
  histogram: { label: string; count: number }[];
  riskLevel: "Konservativ" | "Moderat" | "Aggressiv";
}

function runSimulation(
  kaufpreis: number,
  mieteinnahmen: number,
  wertMin: number,
  wertMax: number,
  zinssatz: number,
  haltedauer: number,
  numSimulations: number
): SimulationResult {
  const results: number[] = [];

  for (let i = 0; i < numSimulations; i++) {
    const wertsteigerung = wertMin + Math.random() * (wertMax - wertMin);
    const endwert = kaufpreis * Math.pow(1 + wertsteigerung / 100, haltedauer);
    const gesamtMiete = mieteinnahmen * haltedauer;
    const zinskosten = kaufpreis * (zinssatz / 100) * haltedauer;
    const gewinn = endwert - kaufpreis + gesamtMiete - zinskosten;
    const rendite = (gewinn / kaufpreis) * 100;
    results.push(rendite);
  }

  results.sort((a, b) => a - b);

  const median = results[Math.floor(results.length / 2)];
  const p10 = results[Math.floor(results.length * 0.1)];
  const p90 = results[Math.floor(results.length * 0.9)];
  const positiveCount = results.filter((r) => r > 0).length;
  const positiveRate = (positiveCount / results.length) * 100;

  // Build histogram
  const min = Math.floor(results[0] / 10) * 10;
  const max = Math.ceil(results[results.length - 1] / 10) * 10;
  const bucketSize = Math.max(5, Math.ceil((max - min) / 15));
  const histogram: { label: string; count: number }[] = [];

  for (let b = min; b < max; b += bucketSize) {
    const count = results.filter((r) => r >= b && r < b + bucketSize).length;
    histogram.push({ label: `${b}%`, count });
  }

  const spread = wertMax - wertMin;
  const riskLevel: "Konservativ" | "Moderat" | "Aggressiv" =
    spread <= 3 ? "Konservativ" : spread <= 6 ? "Moderat" : "Aggressiv";

  return { medianRendite: median, p10, p90, positiveRate, histogram, riskLevel };
}

export default function MonteCarloSimulation() {
  const [kaufpreis, setKaufpreis] = useState(300000);
  const [mieteinnahmen, setMieteinnahmen] = useState(12000);
  const [wertMin, setWertMin] = useState(1);
  const [wertMax, setWertMax] = useState(5);
  const [zinssatz, setZinssatz] = useState(3.5);
  const [haltedauer, setHaltedauer] = useState(10);
  const [numSimulations, setNumSimulations] = useState(5000);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSimulation = () => {
    const res = runSimulation(
      kaufpreis,
      mieteinnahmen,
      wertMin,
      wertMax,
      zinssatz,
      haltedauer,
      numSimulations
    );
    setResult(res);
  };

  const maxHistCount = result ? Math.max(...result.histogram.map((h) => h.count)) : 1;

  const riskColor = useMemo(() => {
    if (!result) return "";
    switch (result.riskLevel) {
      case "Konservativ": return "bg-emerald-100 text-emerald-800";
      case "Moderat": return "bg-yellow-100 text-yellow-800";
      case "Aggressiv": return "bg-red-100 text-red-800";
    }
  }, [result]);

  return (
    <MainLayout
      title="Monte-Carlo-Simulation"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Rechner", href: "/calculators" },
        { label: "Monte-Carlo-Simulation" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Monte-Carlo-Simulation"
          subtitle="Simulieren Sie tausende Szenarien, um die Wahrscheinlichkeitsverteilung Ihrer Immobilienrendite zu analysieren."
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
                <BarChart3 className="h-5 w-5 text-primary" />
                Parameter
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
                <Label htmlFor="mieteinnahmen">Jahrliche Mieteinnahmen</Label>
                <Input
                  id="mieteinnahmen"
                  type="number"
                  value={mieteinnahmen}
                  onChange={(e) => setMieteinnahmen(Number(e.target.value))}
                  min={0}
                  step={500}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wertMin">Wertsteigerung Min (%)</Label>
                  <Input
                    id="wertMin"
                    type="number"
                    value={wertMin}
                    onChange={(e) => setWertMin(Number(e.target.value))}
                    step={0.5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wertMax">Wertsteigerung Max (%)</Label>
                  <Input
                    id="wertMax"
                    type="number"
                    value={wertMax}
                    onChange={(e) => setWertMax(Number(e.target.value))}
                    step={0.5}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zinssatz">Zinssatz (%)</Label>
                <Input
                  id="zinssatz"
                  type="number"
                  value={zinssatz}
                  onChange={(e) => setZinssatz(Number(e.target.value))}
                  min={0}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="haltedauer">Haltedauer (Jahre)</Label>
                <Input
                  id="haltedauer"
                  type="number"
                  value={haltedauer}
                  onChange={(e) => setHaltedauer(Number(e.target.value))}
                  min={1}
                  max={30}
                />
              </div>
              <div className="space-y-2">
                <Label>Anzahl Simulationen: {numSimulations.toLocaleString("de-DE")}</Label>
                <Slider
                  value={[numSimulations]}
                  onValueChange={([val]) => setNumSimulations(val)}
                  min={1000}
                  max={10000}
                  step={500}
                />
              </div>
              <Button onClick={handleSimulation} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Simulation starten
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {result ? (
              <>
                <Card className="border-primary/20">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Median-Rendite</p>
                    <p className="text-4xl font-bold text-primary mt-1">
                      {formatPercent(result.medianRendite)}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">10. Perzentil (pessimistisch)</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">
                        {formatPercent(result.p10)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">90. Perzentil (optimistisch)</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {formatPercent(result.p90)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Wahrscheinlichkeit fur positive Rendite
                      </p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatPercent(result.positiveRate)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        Risikobewertung
                      </p>
                      <Badge className={riskColor}>{result.riskLevel}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Histogram */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Verteilung der Renditen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-48">
                      {result.histogram.map((bucket, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-primary/70 rounded-t hover:bg-primary transition-colors"
                            style={{
                              height: `${(bucket.count / maxHistCount) * 100}%`,
                              minHeight: bucket.count > 0 ? "4px" : "0px",
                            }}
                            title={`${bucket.label}: ${bucket.count} Simulationen`}
                          />
                          <span className="text-[10px] text-muted-foreground -rotate-45 origin-top-left whitespace-nowrap">
                            {bucket.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="flex items-center justify-center h-64">
                <CardContent className="text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Klicken Sie auf "Simulation starten", um die Analyse durchzufuhren.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
