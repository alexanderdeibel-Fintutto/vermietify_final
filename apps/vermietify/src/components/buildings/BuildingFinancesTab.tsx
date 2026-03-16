import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { Euro, TrendingUp, Wrench, Shield, FileText, ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type BuildingRow = Database["public"]["Tables"]["buildings"]["Row"];
type UnitRow = Database["public"]["Tables"]["units"]["Row"];

interface BuildingWithUnits extends BuildingRow {
  units: UnitRow[];
}

interface BuildingFinancesTabProps {
  building: BuildingWithUnits;
}

// Mock data for chart - replace with real data later
const generateMockChartData = (monthlyRent: number) => {
  const months = [
    "Feb", "Mär", "Apr", "Mai", "Jun", "Jul",
    "Aug", "Sep", "Okt", "Nov", "Dez", "Jan"
  ];
  
  return months.map((month, index) => ({
    month,
    einnahmen: Math.round(monthlyRent * (0.85 + Math.random() * 0.15)),
    geplant: monthlyRent,
  }));
};

export function BuildingFinancesTab({ building }: BuildingFinancesTabProps) {
  const units = building.units || [];
  const monthlyRent = units.reduce((sum, u) => sum + (u.rent_amount || 0), 0) / 100;
  const yearlyRent = monthlyRent * 12;

  const chartData = generateMockChartData(monthlyRent);

  // Mock cost categories - replace with real data later
  const costCategories = [
    {
      id: 1,
      name: "Instandhaltung",
      icon: Wrench,
      amount: 2450,
      budget: 5000,
      status: "ok",
    },
    {
      id: 2,
      name: "Versicherung",
      icon: Shield,
      amount: 1200,
      budget: 1200,
      status: "ok",
    },
    {
      id: 3,
      name: "Verwaltung",
      icon: FileText,
      amount: 800,
      budget: 1000,
      status: "ok",
    },
  ];

  const totalCosts = costCategories.reduce((sum, cat) => sum + cat.amount, 0);
  const netIncome = yearlyRent - totalCosts;

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jahreseinnahmen (geplant)
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {yearlyRent.toLocaleString("de-DE")} €
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyRent.toLocaleString("de-DE")} € / Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jahreskosten
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCosts.toLocaleString("de-DE")} €
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(totalCosts / 12).toLocaleString("de-DE", { maximumFractionDigits: 0 })} € / Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nettoeinkommen
            </CardTitle>
            <Euro className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-primary" : "text-destructive"}`}>
              {netIncome.toLocaleString("de-DE")} €
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rendite: {((netIncome / yearlyRent) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rent Income Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mieteinnahmen (letzte 12 Monate)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value.toLocaleString("de-DE")} €`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString("de-DE")} €`, ""]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="einnahmen"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="Einnahmen"
                />
                <Line
                  type="monotone"
                  dataKey="geplant"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                  name="Geplant"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cost Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kostenübersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costCategories.map((category) => {
                const Icon = category.icon;
                const percentage = (category.amount / category.budget) * 100;
                
                return (
                  <div key={category.id} className="flex items-center gap-4">
                    <div className="rounded-lg bg-muted p-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-sm">
                          {category.amount.toLocaleString("de-DE")} € / {category.budget.toLocaleString("de-DE")} €
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percentage > 90 ? "bg-destructive" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/betriebskosten">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Betriebskostenabrechnung
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={`/betriebskosten/neu?building=${building.id}`}>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Neue Abrechnung erstellen
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/zahlungen">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Zahlungsübersicht
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
