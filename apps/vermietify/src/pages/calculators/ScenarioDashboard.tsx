import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Save, Upload, Trophy, BarChart3 } from "lucide-react";
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

interface Scenario {
  name: string;
  kaufpreis: number;
  eigenkapital: number;
  zinssatz: number;
  tilgung: number;
  mieteinnahmen: number;
  nebenkosten: number;
}

const defaultScenario = (name: string): Scenario => ({
  name,
  kaufpreis: 300000,
  eigenkapital: 60000,
  zinssatz: 3.5,
  tilgung: 2.0,
  mieteinnahmen: 12000,
  nebenkosten: 2400,
});

function calcMetrics(s: Scenario) {
  const fremdkapital = s.kaufpreis - s.eigenkapital;
  const jahreszins = fremdkapital * (s.zinssatz / 100);
  const jahrestilgung = fremdkapital * (s.tilgung / 100);
  const kreditrateJahr = jahreszins + jahrestilgung;
  const cashflowJahr = s.mieteinnahmen - s.nebenkosten - kreditrateJahr;
  const cashflowMonat = cashflowJahr / 12;
  const rendite = s.kaufpreis > 0 ? ((s.mieteinnahmen - s.nebenkosten) / s.kaufpreis) * 100 : 0;
  const breakEvenYears =
    cashflowJahr > 0 ? s.eigenkapital / cashflowJahr : cashflowJahr === 0 ? Infinity : -1;

  return {
    cashflowJahr,
    cashflowMonat,
    rendite,
    breakEvenYears,
    kreditrateJahr,
    fremdkapital,
  };
}

const STORAGE_KEY = "vermietify_scenarios";

export default function ScenarioDashboard() {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    defaultScenario("Szenario A"),
    defaultScenario("Szenario B"),
    defaultScenario("Szenario C"),
  ]);
  const [activeTab, setActiveTab] = useState("0");

  const metrics = useMemo(() => scenarios.map(calcMetrics), [scenarios]);

  const bestIndex = useMemo(() => {
    let best = 0;
    metrics.forEach((m, i) => {
      if (m.cashflowJahr > metrics[best].cashflowJahr) best = i;
    });
    return best;
  }, [metrics]);

  const updateScenario = (index: number, updates: Partial<Scenario>) => {
    setScenarios((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  };

  const handleLoad = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        setScenarios(JSON.parse(data));
      } catch {
        // ignore
      }
    }
  };

  return (
    <MainLayout
      title="Szenario-Vergleich"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Rechner", href: "/calculators" },
        { label: "Szenario-Vergleich" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Szenario-Vergleich"
          subtitle="Vergleichen Sie bis zu 3 Investitionsszenarien nebeneinander."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleLoad}>
                <Upload className="mr-2 h-4 w-4" />
                Laden
              </Button>
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </Button>
              <Button variant="outline" asChild>
                <Link to="/calculators">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Alle Rechner
                </Link>
              </Button>
            </div>
          }
        />

        {/* Scenario Input Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {scenarios.map((s, i) => (
              <TabsTrigger key={i} value={String(i)}>
                {s.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {scenarios.map((scenario, idx) => (
            <TabsContent key={idx} value={String(idx)}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {scenario.name}
                    {idx === bestIndex && (
                      <Badge className="bg-emerald-100 text-emerald-800 ml-2">
                        <Trophy className="h-3 w-3 mr-1" />
                        Bestes Szenario
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={scenario.name}
                        onChange={(e) => updateScenario(idx, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Kaufpreis</Label>
                      <Input
                        type="number"
                        value={scenario.kaufpreis}
                        onChange={(e) => updateScenario(idx, { kaufpreis: Number(e.target.value) })}
                        min={0}
                        step={10000}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Eigenkapital</Label>
                      <Input
                        type="number"
                        value={scenario.eigenkapital}
                        onChange={(e) => updateScenario(idx, { eigenkapital: Number(e.target.value) })}
                        min={0}
                        step={5000}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Zinssatz (%)</Label>
                      <Input
                        type="number"
                        value={scenario.zinssatz}
                        onChange={(e) => updateScenario(idx, { zinssatz: Number(e.target.value) })}
                        min={0}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tilgung (%)</Label>
                      <Input
                        type="number"
                        value={scenario.tilgung}
                        onChange={(e) => updateScenario(idx, { tilgung: Number(e.target.value) })}
                        min={0}
                        step={0.5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jahrliche Mieteinnahmen</Label>
                      <Input
                        type="number"
                        value={scenario.mieteinnahmen}
                        onChange={(e) => updateScenario(idx, { mieteinnahmen: Number(e.target.value) })}
                        min={0}
                        step={500}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jahrliche Nebenkosten</Label>
                      <Input
                        type="number"
                        value={scenario.nebenkosten}
                        onChange={(e) => updateScenario(idx, { nebenkosten: Number(e.target.value) })}
                        min={0}
                        step={100}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vergleichsubersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kennzahl</TableHead>
                  {scenarios.map((s, i) => (
                    <TableHead key={i}>
                      {s.name}
                      {i === bestIndex && (
                        <Badge className="bg-emerald-100 text-emerald-800 ml-2 text-xs">
                          <Trophy className="h-3 w-3" />
                        </Badge>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Kaufpreis</TableCell>
                  {scenarios.map((s, i) => (
                    <TableCell key={i}>{formatEuro(s.kaufpreis)}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Fremdkapital</TableCell>
                  {metrics.map((m, i) => (
                    <TableCell key={i}>{formatEuro(m.fremdkapital)}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Cashflow / Jahr</TableCell>
                  {metrics.map((m, i) => (
                    <TableCell
                      key={i}
                      className={m.cashflowJahr >= 0 ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}
                    >
                      {formatEuro(m.cashflowJahr)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Cashflow / Monat</TableCell>
                  {metrics.map((m, i) => (
                    <TableCell
                      key={i}
                      className={m.cashflowMonat >= 0 ? "text-emerald-600" : "text-destructive"}
                    >
                      {formatEuro(m.cashflowMonat)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Rendite</TableCell>
                  {metrics.map((m, i) => (
                    <TableCell key={i}>{formatPercent(m.rendite)}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Break-Even (Jahre)</TableCell>
                  {metrics.map((m, i) => (
                    <TableCell key={i}>
                      {m.breakEvenYears > 0 && m.breakEvenYears < Infinity
                        ? m.breakEvenYears.toFixed(1)
                        : "n/a"}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
