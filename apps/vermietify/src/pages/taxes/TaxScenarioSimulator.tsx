import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTaxScenarios, TaxScenario } from "@/hooks/useTaxScenarios";
import { LoadingState, EmptyState } from "@/components/shared";
import {
  BarChart3,
  Plus,
  Trash2,
  Calculator,
  Euro,
  TrendingDown,
  ArrowLeftRight,
  Save,
  RefreshCw,
} from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

interface ScenarioInput {
  income: string;
  deductions: string;
  afa: string;
  additionalDeductions: string;
  taxRate: string;
}

const emptyInput: ScenarioInput = {
  income: "",
  deductions: "",
  afa: "",
  additionalDeductions: "",
  taxRate: "30",
};

export default function TaxScenarioSimulator() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [scenarioA, setScenarioA] = useState<ScenarioInput>({ ...emptyInput });
  const [scenarioB, setScenarioB] = useState<ScenarioInput>({ ...emptyInput });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savingScenario, setSavingScenario] = useState<"A" | "B">("A");
  const [scenarioName, setScenarioName] = useState("");

  const { data: savedScenarios = [], isLoading, calculateScenario, createScenario, deleteScenario } = useTaxScenarios(selectedYear);

  const computeResult = (input: ScenarioInput) => {
    const incomeCents = Math.round((parseFloat(input.income) || 0) * 100);
    const deductionsCents = Math.round((parseFloat(input.deductions) || 0) * 100);
    const afaCents = Math.round((parseFloat(input.afa) || 0) * 100);
    const additionalCents = Math.round((parseFloat(input.additionalDeductions) || 0) * 100);
    const rate = (parseFloat(input.taxRate) || 30) / 100;

    return calculateScenario({
      income_cents: incomeCents,
      deductions_cents: deductionsCents,
      afa_cents: afaCents,
      additional_deductions_cents: additionalCents,
      tax_rate: rate,
    });
  };

  const resultA = computeResult(scenarioA);
  const resultB = computeResult(scenarioB);

  const savings = (resultA.estimated_tax_cents || 0) - (resultB.estimated_tax_cents || 0);

  const handleSave = (side: "A" | "B") => {
    setSavingScenario(side);
    setScenarioName("");
    setShowSaveDialog(true);
  };

  const handleConfirmSave = () => {
    const input = savingScenario === "A" ? scenarioA : scenarioB;
    createScenario.mutate({
      name: scenarioName || `Szenario ${savingScenario}`,
      scenario_data: {
        income_cents: Math.round((parseFloat(input.income) || 0) * 100),
        deductions_cents: Math.round((parseFloat(input.deductions) || 0) * 100),
        afa_cents: Math.round((parseFloat(input.afa) || 0) * 100),
        additional_deductions_cents: Math.round((parseFloat(input.additionalDeductions) || 0) * 100),
        tax_rate: (parseFloat(input.taxRate) || 30) / 100,
      },
    });
    setShowSaveDialog(false);
  };

  const loadScenario = (scenario: TaxScenario, side: "A" | "B") => {
    const data = scenario.scenario_data;
    const loaded: ScenarioInput = {
      income: ((data.income_cents || 0) / 100).toString(),
      deductions: ((data.deductions_cents || 0) / 100).toString(),
      afa: ((data.afa_cents || 0) / 100).toString(),
      additionalDeductions: ((data.additional_deductions_cents || 0) / 100).toString(),
      taxRate: ((data.tax_rate || 0.3) * 100).toString(),
    };
    if (side === "A") setScenarioA(loaded);
    else setScenarioB(loaded);
  };

  const renderInputColumn = (
    label: string,
    input: ScenarioInput,
    setInput: (val: ScenarioInput) => void,
    result: TaxScenario["result_data"],
    side: "A" | "B"
  ) => (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {label}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setInput({ ...emptyInput })} title="Zurucksetzen">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleSave(side)} title="Speichern">
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Mieteinnahmen (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={input.income}
            onChange={(e) => setInput({ ...input, income: e.target.value })}
            placeholder="0,00"
          />
        </div>
        <div className="space-y-2">
          <Label>Werbungskosten (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={input.deductions}
            onChange={(e) => setInput({ ...input, deductions: e.target.value })}
            placeholder="0,00"
          />
        </div>
        <div className="space-y-2">
          <Label>AfA-Abschreibung (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={input.afa}
            onChange={(e) => setInput({ ...input, afa: e.target.value })}
            placeholder="0,00"
          />
        </div>
        <div className="space-y-2">
          <Label>Zusatzliche Absetzungen (€)</Label>
          <Input
            type="number"
            step="0.01"
            value={input.additionalDeductions}
            onChange={(e) => setInput({ ...input, additionalDeductions: e.target.value })}
            placeholder="0,00"
          />
        </div>
        <div className="space-y-2">
          <Label>Steuersatz (%)</Label>
          <Input
            type="number"
            step="0.1"
            value={input.taxRate}
            onChange={(e) => setInput({ ...input, taxRate: e.target.value })}
            placeholder="30"
          />
        </div>

        <Separator />

        {/* Results */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm">Zu versteuerndes Einkommen</span>
            <span className="font-bold">
              {((result.taxable_income_cents || 0) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
            </span>
          </div>
          <div className="flex justify-between items-center p-3 border-2 border-primary rounded-lg">
            <span className="text-sm font-medium">Geschatzte Steuer</span>
            <span className="font-bold text-primary text-lg">
              {((result.estimated_tax_cents || 0) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm">Effektiver Steuersatz</span>
            <span className="font-medium">
              {((result.effective_rate || 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout title="Steuer-Szenarien">
      <div className="space-y-6">
        <PageHeader
          title="Steuer-Szenario-Simulator"
          subtitle="Vergleichen Sie verschiedene Steuerszenarien nebeneinander"
          breadcrumbs={[
            { label: "Steuern", href: "/steuern" },
            { label: "Szenarien" },
          ]}
          actions={
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => setSelectedYear(Number(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        {/* Side-by-side Comparison */}
        <div className="grid gap-6 md:grid-cols-2">
          {renderInputColumn("Szenario A", scenarioA, setScenarioA, resultA, "A")}
          {renderInputColumn("Szenario B", scenarioB, setScenarioB, resultB, "B")}
        </div>

        {/* Comparison Result */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Vergleich
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Steuer Szenario A</p>
                <p className="text-2xl font-bold">
                  {((resultA.estimated_tax_cents || 0) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Steuer Szenario B</p>
                <p className="text-2xl font-bold">
                  {((resultB.estimated_tax_cents || 0) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </p>
              </div>
              <div className={`text-center p-4 rounded-lg border-2 ${savings > 0 ? "border-green-500" : savings < 0 ? "border-red-500" : "border-muted"}`}>
                <p className="text-sm text-muted-foreground mb-1">Differenz (A - B)</p>
                <p className={`text-2xl font-bold ${savings > 0 ? "text-green-600" : savings < 0 ? "text-red-600" : ""}`}>
                  {savings > 0 ? "+" : ""}{(savings / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>Gespeicherte Szenarien</CardTitle>
            <CardDescription>
              Klicken Sie auf ein Szenario um es in A oder B zu laden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState rows={3} />
            ) : (savedScenarios as TaxScenario[]).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Noch keine Szenarien gespeichert
              </p>
            ) : (
              <div className="space-y-3">
                {(savedScenarios as TaxScenario[]).map((scenario) => (
                  <div
                    key={scenario.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{scenario.name}</p>
                      {scenario.description && (
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Steuer: {((scenario.result_data?.estimated_tax_cents || 0) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadScenario(scenario, "A")}
                      >
                        Laden A
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadScenario(scenario, "B")}
                      >
                        Laden B
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteScenario.mutate(scenario.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Szenario speichern</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder={`Szenario ${savingScenario}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleConfirmSave}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
