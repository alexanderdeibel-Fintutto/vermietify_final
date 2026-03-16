import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, EmptyState, LoadingState } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Briefcase,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { usePortfolio, Portfolio, Investment } from "@/hooks/usePortfolio";
import { formatCurrency } from "@/lib/utils";

const INVESTMENT_TYPE_LABELS: Record<Investment["type"], string> = {
  stock: "Aktie",
  etf: "ETF",
  bond: "Anleihe",
  crypto: "Krypto",
  real_estate: "Immobilie",
  precious_metal: "Edelmetall",
  other: "Sonstige",
};

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(120, 60%, 45%)",
  "hsl(45, 90%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(15, 80%, 55%)",
  "hsl(var(--muted-foreground))",
];

export default function PortfolioDashboard() {
  const { data: portfolios, isLoading, createPortfolio } = usePortfolio();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioDescription, setNewPortfolioDescription] = useState("");

  const handleCreatePortfolio = () => {
    createPortfolio.mutate(
      {
        name: newPortfolioName,
        description: newPortfolioDescription || null,
        total_value_cents: 0,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setNewPortfolioName("");
          setNewPortfolioDescription("");
        },
      }
    );
  };

  // Aggregate all investments across portfolios
  const allInvestments: Investment[] =
    portfolios?.flatMap((p) => p.investments || []) || [];

  const totalPortfolioValue = allInvestments.reduce(
    (sum, inv) => sum + (inv.current_price_cents || inv.purchase_price_cents) * inv.quantity,
    0
  );

  const totalPurchaseValue = allInvestments.reduce(
    (sum, inv) => sum + inv.purchase_price_cents * inv.quantity,
    0
  );

  const totalGainLoss = totalPortfolioValue - totalPurchaseValue;
  const totalGainLossPercent =
    totalPurchaseValue > 0
      ? ((totalGainLoss / totalPurchaseValue) * 100).toFixed(1)
      : "0.0";

  // Allocation data for pie chart
  const allocationByType = allInvestments.reduce<Record<string, number>>(
    (acc, inv) => {
      const type = inv.type;
      const value = (inv.current_price_cents || inv.purchase_price_cents) * inv.quantity;
      acc[type] = (acc[type] || 0) + value;
      return acc;
    },
    {}
  );

  const pieData = Object.entries(allocationByType).map(([type, value]) => ({
    name: INVESTMENT_TYPE_LABELS[type as Investment["type"]] || type,
    value: value / 100,
  }));

  if (isLoading) {
    return (
      <MainLayout title="Portfolio">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Portfolio"
      breadcrumbs={[
        { label: "Finanzen", href: "/finanzen" },
        { label: "Portfolio" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Investment-Portfolio"
          actions={
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Neues Portfolio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neues Portfolio erstellen</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie ein neues Investment-Portfolio.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="portfolioName">Name *</Label>
                    <Input
                      id="portfolioName"
                      placeholder="z.B. Hauptportfolio"
                      value={newPortfolioName}
                      onChange={(e) => setNewPortfolioName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolioDesc">Beschreibung</Label>
                    <Textarea
                      id="portfolioDesc"
                      placeholder="Optionale Beschreibung..."
                      value={newPortfolioDescription}
                      onChange={(e) => setNewPortfolioDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleCreatePortfolio}
                    disabled={!newPortfolioName || createPortfolio.isPending}
                  >
                    Portfolio erstellen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfoliowert</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalPortfolioValue / 100)}
              </div>
              <p className="text-xs text-muted-foreground">
                {allInvestments.length} Investment{allInvestments.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kaufwert</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalPurchaseValue / 100)}
              </div>
              <p className="text-xs text-muted-foreground">
                Gesamte Anschaffungskosten
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gewinn / Verlust</CardTitle>
              {totalGainLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  totalGainLoss >= 0 ? "text-green-500" : "text-destructive"
                }`}
              >
                {totalGainLoss >= 0 ? "+" : ""}
                {formatCurrency(totalGainLoss / 100)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {totalGainLoss >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                )}
                {totalGainLossPercent}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Allocation Pie Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Allokation
              </CardTitle>
              <CardDescription>Verteilung nach Anlageklasse</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Noch keine Investments vorhanden
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Investments Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Investments</CardTitle>
              <CardDescription>Alle Investments im Überblick</CardDescription>
            </CardHeader>
            <CardContent>
              {allInvestments.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="Keine Investments"
                  description="Fügen Sie Investments zu Ihren Portfolios hinzu."
                />
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-3">Typ</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 text-right">Menge</th>
                        <th className="px-4 py-3 text-right">Kaufpreis</th>
                        <th className="px-4 py-3 text-right">Aktuell</th>
                        <th className="px-4 py-3 text-right">Gewinn/Verlust</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allInvestments.map((inv) => {
                        const currentValue =
                          (inv.current_price_cents || inv.purchase_price_cents) *
                          inv.quantity;
                        const purchaseValue =
                          inv.purchase_price_cents * inv.quantity;
                        const gainLoss = currentValue - purchaseValue;
                        const gainLossPercent =
                          purchaseValue > 0
                            ? ((gainLoss / purchaseValue) * 100).toFixed(1)
                            : "0.0";

                        return (
                          <tr
                            key={inv.id}
                            className="border-b last:border-0 hover:bg-muted/50"
                          >
                            <td className="px-4 py-3">
                              <Badge variant="outline">
                                {INVESTMENT_TYPE_LABELS[inv.type]}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{inv.name}</p>
                                {inv.symbol && (
                                  <p className="text-xs text-muted-foreground">
                                    {inv.symbol}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {inv.quantity}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {formatCurrency(purchaseValue / 100)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatCurrency(currentValue / 100)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`font-medium ${
                                  gainLoss >= 0
                                    ? "text-green-500"
                                    : "text-destructive"
                                }`}
                              >
                                {gainLoss >= 0 ? "+" : ""}
                                {formatCurrency(gainLoss / 100)}
                              </span>
                              <span
                                className={`block text-xs ${
                                  gainLoss >= 0
                                    ? "text-green-500"
                                    : "text-destructive"
                                }`}
                              >
                                ({gainLossPercent}%)
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Portfolios List */}
        {portfolios && portfolios.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Portfolios</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {portfolios.map((portfolio) => {
                const investments = portfolio.investments || [];
                const value = investments.reduce(
                  (sum, inv) =>
                    sum +
                    (inv.current_price_cents || inv.purchase_price_cents) *
                      inv.quantity,
                  0
                );
                return (
                  <Card key={portfolio.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                      {portfolio.description && (
                        <CardDescription>{portfolio.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">
                            {formatCurrency(value / 100)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {investments.length} Investment
                            {investments.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Briefcase className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
