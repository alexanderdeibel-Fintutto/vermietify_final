import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, EmptyState, LoadingState } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PiggyBank,
  Plus,
  Trash2,
  Building2,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useBudgets, Budget, BudgetItem } from "@/hooks/useBudgets";
import { useBuildings } from "@/hooks/useBuildings";
import { formatCurrency } from "@/lib/utils";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function BudgetManagement() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { data: budgets, isLoading, createBudget } = useBudgets(selectedYear);
  const { useBuildingsList } = useBuildings();
  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBudgetName, setNewBudgetName] = useState("");
  const [newBudgetBuildingId, setNewBudgetBuildingId] = useState("");
  const [newBudgetTotal, setNewBudgetTotal] = useState("");
  const [newBudgetItems, setNewBudgetItems] = useState<
    { category: string; planned: string }[]
  >([{ category: "", planned: "" }]);

  const addBudgetItem = () => {
    setNewBudgetItems([...newBudgetItems, { category: "", planned: "" }]);
  };

  const removeBudgetItem = (index: number) => {
    if (newBudgetItems.length <= 1) return;
    setNewBudgetItems(newBudgetItems.filter((_, i) => i !== index));
  };

  const updateBudgetItem = (index: number, field: "category" | "planned", value: string) => {
    const updated = [...newBudgetItems];
    updated[index] = { ...updated[index], [field]: value };
    setNewBudgetItems(updated);
  };

  const resetForm = () => {
    setNewBudgetName("");
    setNewBudgetBuildingId("");
    setNewBudgetTotal("");
    setNewBudgetItems([{ category: "", planned: "" }]);
  };

  const handleCreateBudget = () => {
    const totalCents = Math.round(parseFloat(newBudgetTotal || "0") * 100);
    const items = newBudgetItems
      .filter((item) => item.category.trim() !== "")
      .map((item) => ({
        category: item.category,
        planned_cents: Math.round(parseFloat(item.planned || "0") * 100),
        actual_cents: 0,
      }));

    createBudget.mutate(
      {
        name: newBudgetName,
        year: selectedYear,
        building_id: newBudgetBuildingId || null,
        total_budget_cents: totalCents,
        spent_cents: 0,
        items,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          resetForm();
        },
      }
    );
  };

  const getSpentPercentage = (budget: Budget) => {
    if (!budget.total_budget_cents || budget.total_budget_cents === 0) return 0;
    return Math.min(
      Math.round((budget.spent_cents / budget.total_budget_cents) * 100),
      100
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-yellow-500";
    return "text-green-500";
  };

  if (isLoading) {
    return (
      <MainLayout title="Budgets">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Budgetverwaltung"
      breadcrumbs={[
        { label: "Finanzen", href: "/finanzen" },
        { label: "Budgets" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Budgetverwaltung"
          actions={
            <div className="flex gap-2 items-center">
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Neues Budget
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Neues Budget erstellen</DialogTitle>
                    <DialogDescription>
                      Legen Sie ein Budget für {selectedYear} an.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="budgetName">Budgetname *</Label>
                      <Input
                        id="budgetName"
                        placeholder="z.B. Instandhaltung Gebäude A"
                        value={newBudgetName}
                        onChange={(e) => setNewBudgetName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label>Gebäude</Label>
                        <Select
                          value={newBudgetBuildingId}
                          onValueChange={setNewBudgetBuildingId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                          <SelectContent>
                            {buildings.map((b: any) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budgetTotal">Gesamtbudget (EUR)</Label>
                        <Input
                          id="budgetTotal"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          value={newBudgetTotal}
                          onChange={(e) => setNewBudgetTotal(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Budgetposten</Label>
                      {newBudgetItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            placeholder="Kategorie"
                            value={item.category}
                            onChange={(e) =>
                              updateBudgetItem(index, "category", e.target.value)
                            }
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Betrag"
                            value={item.planned}
                            onChange={(e) =>
                              updateBudgetItem(index, "planned", e.target.value)
                            }
                            className="w-28"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBudgetItem(index)}
                            disabled={newBudgetItems.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addBudgetItem}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Posten hinzufügen
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      onClick={handleCreateBudget}
                      disabled={!newBudgetName || createBudget.isPending}
                    >
                      Budget erstellen
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        {/* Budget Summary */}
        {budgets && budgets.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budgets gesamt</CardTitle>
                <PiggyBank className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    budgets.reduce((sum, b) => sum + b.total_budget_cents, 0) / 100
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {budgets.length} Budget{budgets.length !== 1 ? "s" : ""} in {selectedYear}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ausgegeben</CardTitle>
                <TrendingUp className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(
                    budgets.reduce((sum, b) => sum + b.spent_cents, 0) / 100
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Gesamtausgaben {selectedYear}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verbleibend</CardTitle>
                <PiggyBank className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {formatCurrency(
                    budgets.reduce(
                      (sum, b) => sum + (b.total_budget_cents - b.spent_cents),
                      0
                    ) / 100
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Noch verfügbar
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Budget List */}
        {!budgets || budgets.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <EmptyState
                icon={PiggyBank}
                title="Keine Budgets gefunden"
                description={`Erstellen Sie ein Budget für ${selectedYear}, um Ihre Ausgaben im Blick zu behalten.`}
                action={
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Budget erstellen
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const percentage = getSpentPercentage(budget);
              const progressColor = getProgressColor(percentage);
              const items = budget.budget_items || [];

              return (
                <Card key={budget.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {budget.name}
                          {percentage >= 90 && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          {budget.buildings?.name && (
                            <Badge variant="outline" className="gap-1">
                              <Building2 className="h-3 w-3" />
                              {budget.buildings.name}
                            </Badge>
                          )}
                          <span>{budget.year}</span>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${progressColor}`}>
                          {percentage}%
                        </p>
                        <p className="text-xs text-muted-foreground">ausgeschöpft</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Overall progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(budget.spent_cents / 100)} ausgegeben
                        </span>
                        <span className="font-medium">
                          von {formatCurrency(budget.total_budget_cents / 100)}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>

                    {/* Budget items breakdown */}
                    {items.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Budgetposten
                        </p>
                        {items.map((item) => {
                          const itemPercentage =
                            item.planned_cents > 0
                              ? Math.min(
                                  Math.round(
                                    (item.actual_cents / item.planned_cents) * 100
                                  ),
                                  100
                                )
                              : 0;
                          return (
                            <div key={item.id} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{item.category}</span>
                                <span className="text-muted-foreground">
                                  {formatCurrency(item.actual_cents / 100)} /{" "}
                                  {formatCurrency(item.planned_cents / 100)}
                                </span>
                              </div>
                              <Progress value={itemPercentage} className="h-1.5" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
