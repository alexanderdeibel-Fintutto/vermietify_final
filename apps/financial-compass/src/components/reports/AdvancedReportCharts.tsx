import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowRight, Calendar, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

interface CashFlowForecast {
  month: string;
  actual?: number;
  forecast: number;
  lower: number;
  upper: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function ComparisonChart() {
  const { currentCompany } = useCompany();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [compareYear, setCompareYear] = useState<string>('previous');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompany) {
      fetchMonthlyData();
    }
  }, [currentCompany, compareYear]);

  const fetchMonthlyData = async () => {
    if (!currentCompany) return;
    setLoading(true);

    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', currentCompany.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const monthlyStats = months.map((month, index) => {
      const monthTransactions = transactions?.filter((t) => {
        const txDate = new Date(t.date);
        return txDate.getMonth() === index;
      }) || [];

      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        month,
        income,
        expenses,
        profit: income - expenses,
      };
    });

    setMonthlyData(monthlyStats);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-muted-foreground">Laden...</div>;
  }

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Jahresvergleich</CardTitle>
          <CardDescription>Einnahmen vs. Ausgaben pro Monat</CardDescription>
        </div>
        <Select value={compareYear} onValueChange={setCompareYear}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="previous">vs. Vorjahr</SelectItem>
            <SelectItem value="plan">vs. Plan</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" name="Einnahmen" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Ausgaben" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ProfitTrendChart() {
  const { currentCompany } = useCompany();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompany) {
      fetchData();
    }
  }, [currentCompany]);

  const fetchData = async () => {
    if (!currentCompany) return;
    setLoading(true);

    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', currentCompany.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    let cumulativeProfit = 0;

    const monthlyStats = months.map((month, index) => {
      const monthTransactions = transactions?.filter((t) => {
        const txDate = new Date(t.date);
        return txDate.getMonth() === index;
      }) || [];

      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const profit = income - expenses;
      cumulativeProfit += profit;

      return {
        month,
        income,
        expenses,
        profit,
        cumulative: cumulativeProfit,
      };
    });

    setMonthlyData(monthlyStats);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-muted-foreground">Laden...</div>;
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-lg">Gewinnentwicklung</CardTitle>
        <CardDescription>Kumulierter Gewinn im Jahresverlauf</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Kumuliert']}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#profitGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function CashFlowForecastChart() {
  const { currentCompany } = useCompany();
  const [forecastData, setForecastData] = useState<CashFlowForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompany) {
      generateForecast();
    }
  }, [currentCompany]);

  const generateForecast = async () => {
    if (!currentCompany) return;
    setLoading(true);

    // Fetch historical data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', currentCompany.id)
      .gte('date', sixMonthsAgo.toISOString().split('T')[0]);

    // Calculate monthly averages
    const monthlyTotals: Record<string, { income: number; expenses: number }> = {};
    transactions?.forEach((t) => {
      const month = t.date.substring(0, 7);
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = { income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        monthlyTotals[month].income += Number(t.amount);
      } else {
        monthlyTotals[month].expenses += Number(t.amount);
      }
    });

    const monthlyValues = Object.values(monthlyTotals);
    const avgIncome = monthlyValues.reduce((sum, m) => sum + m.income, 0) / (monthlyValues.length || 1);
    const avgExpenses = monthlyValues.reduce((sum, m) => sum + m.expenses, 0) / (monthlyValues.length || 1);
    const avgCashFlow = avgIncome - avgExpenses;

    // Generate forecast for next 6 months
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    const forecast: CashFlowForecast[] = [];

    // Add past 3 months with actual data
    for (let i = -3; i <= 6; i++) {
      const monthIndex = (currentMonth + i + 12) % 12;
      const monthKey = months[monthIndex];
      const isPast = i <= 0;

      const variance = avgCashFlow * 0.2; // 20% variance

      if (isPast) {
        const actualMonth = Object.keys(monthlyTotals).find((k) =>
          new Date(k).getMonth() === monthIndex
        );
        const actual = actualMonth
          ? monthlyTotals[actualMonth].income - monthlyTotals[actualMonth].expenses
          : undefined;

        forecast.push({
          month: monthKey,
          actual,
          forecast: avgCashFlow,
          lower: avgCashFlow - variance,
          upper: avgCashFlow + variance,
        });
      } else {
        // Future months - add some growth trend
        const growthFactor = 1 + (i * 0.02);
        const projectedCashFlow = avgCashFlow * growthFactor;

        forecast.push({
          month: monthKey,
          forecast: projectedCashFlow,
          lower: projectedCashFlow - variance,
          upper: projectedCashFlow + variance,
        });
      }
    }

    setForecastData(forecast);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const latestForecast = forecastData[forecastData.length - 1]?.forecast || 0;
  const trend = latestForecast > 0 ? 'positive' : 'negative';

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-muted-foreground">Laden...</div>;
  }

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Cashflow-Prognose
            </CardTitle>
            <CardDescription>Erwarteter Cashflow für die nächsten 6 Monate</CardDescription>
          </div>
          <Badge variant={trend === 'positive' ? 'default' : 'destructive'} className="gap-1">
            {trend === 'positive' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend === 'positive' ? 'Positiv' : 'Negativ'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'actual' ? 'Tatsächlich' : name === 'forecast' ? 'Prognose' : name,
              ]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="transparent"
              fill="url(#confidenceGradient)"
              name="Obergrenze"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="transparent"
              fill="transparent"
              name="Untergrenze"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2 }}
              name="Tatsächlich"
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#3b82f6', strokeWidth: 2 }}
              name="Prognose"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Forecast Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Nächster Monat</p>
            <p className={`text-lg font-bold ${forecastData[4]?.forecast >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(forecastData[4]?.forecast || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">In 3 Monaten</p>
            <p className={`text-lg font-bold ${forecastData[6]?.forecast >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(forecastData[6]?.forecast || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">In 6 Monaten</p>
            <p className={`text-lg font-bold ${forecastData[9]?.forecast >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(forecastData[9]?.forecast || 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExpenseBreakdownChart() {
  const { currentCompany } = useCompany();
  const [expenseData, setExpenseData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompany) {
      fetchExpenses();
    }
  }, [currentCompany]);

  const fetchExpenses = async () => {
    if (!currentCompany) return;
    setLoading(true);

    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', currentCompany.id)
      .eq('type', 'expense')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    const byCategory: Record<string, number> = {};
    transactions?.forEach((t) => {
      const category = t.category || 'Sonstiges';
      byCategory[category] = (byCategory[category] || 0) + Number(t.amount);
    });

    const data = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    setExpenseData(data);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalExpenses = expenseData.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-muted-foreground">Laden...</div>;
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-lg">Ausgaben nach Kategorie</CardTitle>
        <CardDescription>Verteilung der Ausgaben im aktuellen Jahr</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-8">
          <div className="w-1/2">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Betrag']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 space-y-2">
            {expenseData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({((item.value / totalExpenses) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
