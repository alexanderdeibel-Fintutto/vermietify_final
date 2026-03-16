import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTaxDeductions, DEDUCTION_CATEGORIES, TaxDeduction, DeductionCategory } from "@/hooks/useTaxDeductions";
import { LoadingState, EmptyState } from "@/components/shared";
import {
  TrendingDown,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Receipt,
  Euro,
  Building2,
  RotateCw,
} from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const CATEGORY_ICONS: Record<string, string> = {
  afa: "bg-violet-100 text-violet-800",
  maintenance: "bg-orange-100 text-orange-800",
  insurance: "bg-blue-100 text-blue-800",
  interest: "bg-purple-100 text-purple-800",
  property_tax: "bg-amber-100 text-amber-800",
  management: "bg-green-100 text-green-800",
  travel: "bg-cyan-100 text-cyan-800",
  office: "bg-indigo-100 text-indigo-800",
  legal: "bg-red-100 text-red-800",
  advertising: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
};

export default function TaxDeductions() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDeduction, setNewDeduction] = useState({
    category: "" as string,
    description: "",
    amount: "",
    building_id: "",
    is_recurring: false,
  });

  const { data: deductions = [], isLoading, totalByCategory, createDeduction, deleteDeduction } = useTaxDeductions(selectedYear);

  const categoryTotals = totalByCategory(deductions as TaxDeduction[]);
  const grandTotal = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

  const groupedDeductions = (deductions as TaxDeduction[]).reduce<Record<string, TaxDeduction[]>>((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {});

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleCreate = () => {
    if (!newDeduction.category || !newDeduction.description || !newDeduction.amount) return;
    createDeduction.mutate({
      category: newDeduction.category as DeductionCategory,
      description: newDeduction.description,
      amount_cents: Math.round(parseFloat(newDeduction.amount) * 100),
      building_id: newDeduction.building_id || null,
      is_recurring: newDeduction.is_recurring,
    });
    setShowAddDialog(false);
    setNewDeduction({ category: "", description: "", amount: "", building_id: "", is_recurring: false });
  };

  const handleDelete = (id: string) => {
    deleteDeduction.mutate(id);
  };

  return (
    <MainLayout title="Absetzungen">
      <div className="space-y-6">
        <PageHeader
          title="Steuerliche Absetzungen"
          subtitle={`Werbungskosten und Absetzungen fur ${selectedYear}`}
          breadcrumbs={[
            { label: "Steuern", href: "/steuern" },
            { label: "Absetzungen" },
          ]}
          actions={
            <div className="flex items-center gap-2">
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
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Absetzung hinzufugen
              </Button>
            </div>
          }
        />

        {/* Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Gesamte Absetzungen {selectedYear}
                </p>
                <p className="text-3xl font-bold text-destructive">
                  -{(grandTotal / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <TrendingDown className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        {isLoading ? (
          <LoadingState />
        ) : Object.keys(groupedDeductions).length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Keine Absetzungen"
            description={`Erfassen Sie Werbungskosten fur ${selectedYear}`}
            action={
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Erste Absetzung erfassen
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {Object.entries(DEDUCTION_CATEGORIES).map(([category, label]) => {
              const items = groupedDeductions[category] || [];
              const total = categoryTotals[category] || 0;
              if (items.length === 0) return null;

              const isExpanded = expandedCategories.includes(category);

              return (
                <Card key={category}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Badge variant="outline" className={CATEGORY_ICONS[category]}>
                              {label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {items.length} {items.length === 1 ? "Eintrag" : "Eintrage"}
                            </span>
                          </div>
                          <span className="font-bold text-destructive">
                            -{(total / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                          </span>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Euro className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{item.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {item.buildings?.name && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {item.buildings.name}
                                      </span>
                                    )}
                                    {item.is_recurring && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <RotateCw className="h-3 w-3" />
                                        Wiederkehrend
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm">
                                  {(item.amount_cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Deduction Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Absetzung hinzufugen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kategorie *</Label>
              <Select
                value={newDeduction.category}
                onValueChange={(v) => setNewDeduction((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wahlen" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEDUCTION_CATEGORIES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Beschreibung *</Label>
              <Input
                value={newDeduction.description}
                onChange={(e) => setNewDeduction((p) => ({ ...p, description: e.target.value }))}
                placeholder="z.B. Gebaeudeversicherung"
              />
            </div>
            <div className="space-y-2">
              <Label>Betrag (€) *</Label>
              <Input
                type="number"
                step="0.01"
                value={newDeduction.amount}
                onChange={(e) => setNewDeduction((p) => ({ ...p, amount: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_recurring"
                checked={newDeduction.is_recurring}
                onChange={(e) => setNewDeduction((p) => ({ ...p, is_recurring: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="is_recurring">Wiederkehrend</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newDeduction.category || !newDeduction.description || !newDeduction.amount}
            >
              Hinzufugen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
