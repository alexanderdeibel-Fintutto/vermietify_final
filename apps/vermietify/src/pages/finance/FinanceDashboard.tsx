import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpDown,
  Download,
  Filter,
  BarChart3,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const MOCK_CHART_DATA = [
  { month: "Jan", Einnahmen: 12500, Ausgaben: 4200 },
  { month: "Feb", Einnahmen: 12500, Ausgaben: 3800 },
  { month: "Mär", Einnahmen: 13200, Ausgaben: 5100 },
  { month: "Apr", Einnahmen: 12800, Ausgaben: 4600 },
  { month: "Mai", Einnahmen: 13500, Ausgaben: 3900 },
  { month: "Jun", Einnahmen: 14000, Ausgaben: 4400 },
];

const MOCK_TRANSACTIONS = [
  { id: "1", date: "2025-06-01", description: "Miete Wohnung 3A", type: "income" as const, amount: 1250_00, category: "Miete" },
  { id: "2", date: "2025-06-01", description: "Miete Wohnung 4B", type: "income" as const, amount: 980_00, category: "Miete" },
  { id: "3", date: "2025-06-03", description: "Reparatur Heizung", type: "expense" as const, amount: 450_00, category: "Instandhaltung" },
  { id: "4", date: "2025-06-05", description: "Hausverwaltung", type: "expense" as const, amount: 320_00, category: "Verwaltung" },
  { id: "5", date: "2025-06-10", description: "Miete Gewerbe EG", type: "income" as const, amount: 2100_00, category: "Miete" },
];

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <MainLayout
      title="Finanz-Dashboard"
      breadcrumbs={[
        { label: "Finanzen", href: "/finanzen" },
        { label: "Dashboard" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finanz-Dashboard</h1>
            <p className="text-muted-foreground">
              Gesamtübersicht Ihrer Finanzkennzahlen
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Einnahmen (Jahr)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(78500)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                +12,3% zum Vorjahr
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausgaben (Jahr)</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(26000)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowDownRight className="h-3 w-3 text-destructive" />
                +5,1% zum Vorjahr
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(52500)}</div>
              <p className="text-xs text-muted-foreground">
                Aktueller Kontostand
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cashflow (Monat)</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{formatCurrency(9600)}</div>
              <p className="text-xs text-muted-foreground">
                Netto diesen Monat
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="forecasting">Prognose</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Income vs Expenses Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Einnahmen vs. Ausgaben
                </CardTitle>
                <CardDescription>
                  Monatliche Übersicht der letzten 6 Monate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={MOCK_CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="Einnahmen" fill="hsl(120, 60%, 45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Ausgaben" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Letzte Transaktionen</CardTitle>
                <CardDescription>
                  Die neuesten Einnahmen und Ausgaben
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-3">Datum</th>
                        <th className="px-4 py-3">Beschreibung</th>
                        <th className="px-4 py-3">Kategorie</th>
                        <th className="px-4 py-3">Typ</th>
                        <th className="px-4 py-3 text-right">Betrag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_TRANSACTIONS.map((tx) => (
                        <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString("de-DE")}
                          </td>
                          <td className="px-4 py-3 font-medium">{tx.description}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{tx.category}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {tx.type === "income" ? (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                Einnahme
                              </Badge>
                            ) : (
                              <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                                Ausgabe
                              </Badge>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${tx.type === "income" ? "text-green-500" : "text-destructive"}`}>
                            {tx.type === "income" ? "+" : "-"}
                            {formatCurrency(tx.amount / 100)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecasting">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Finanzprognose
                </CardTitle>
                <CardDescription>
                  Voraussichtliche Einnahmen und Ausgaben
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Prognose wird berechnet
                  </h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Erfassen Sie mehr Transaktionen, um eine zuverlässige Finanzprognose zu erhalten.
                    Die Prognose basiert auf Ihren historischen Daten.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  Budgetübersicht
                </CardTitle>
                <CardDescription>
                  Budgets und deren Auslastung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PiggyBank className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Keine Budgets angelegt
                  </h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Erstellen Sie Budgets, um Ihre Ausgaben im Blick zu behalten.
                  </p>
                  <Button asChild>
                    <a href="/finanzen/budgets">Budget erstellen</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
