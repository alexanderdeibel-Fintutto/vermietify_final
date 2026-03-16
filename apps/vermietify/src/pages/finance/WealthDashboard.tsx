import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  Building2,
  Briefcase,
  Banknote,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

// Placeholder data for the net worth trend
const NET_WORTH_TREND = [
  { month: "Jul", value: 480000 },
  { month: "Aug", value: 492000 },
  { month: "Sep", value: 505000 },
  { month: "Okt", value: 498000 },
  { month: "Nov", value: 515000 },
  { month: "Dez", value: 530000 },
  { month: "Jan", value: 542000 },
  { month: "Feb", value: 555000 },
  { month: "Mär", value: 548000 },
  { month: "Apr", value: 562000 },
  { month: "Mai", value: 578000 },
  { month: "Jun", value: 595000 },
];

// Placeholder asset breakdown
const ASSET_BREAKDOWN = {
  realEstate: 420000_00, // in cents
  investments: 125000_00,
  cash: 85000_00,
  liabilities: 35000_00,
};

const netWorth =
  ASSET_BREAKDOWN.realEstate +
  ASSET_BREAKDOWN.investments +
  ASSET_BREAKDOWN.cash -
  ASSET_BREAKDOWN.liabilities;

export default function WealthDashboard() {
  return (
    <MainLayout
      title="Vermögen"
      breadcrumbs={[
        { label: "Finanzen", href: "/finanzen" },
        { label: "Vermögen" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vermögensübersicht</h1>
            <p className="text-muted-foreground">
              Ihr gesamtes Vermögen auf einen Blick
            </p>
          </div>
          <Badge variant="outline" className="text-sm self-start">
            Stand: {new Date().toLocaleDateString("de-DE")}
          </Badge>
        </div>

        {/* Net Worth KPI */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Nettovermögen</CardTitle>
            <Landmark className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(netWorth / 100)}</div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">+3,2%</span>
              <span>im Vergleich zum Vormonat</span>
            </p>
          </CardContent>
        </Card>

        {/* Asset Breakdown Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Immobilien</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(ASSET_BREAKDOWN.realEstate / 100)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {((ASSET_BREAKDOWN.realEstate / (netWorth + ASSET_BREAKDOWN.liabilities)) * 100).toFixed(0)}% des Vermögens
                </p>
                <p className="text-xs text-green-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3" />
                  +2,1%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investments</CardTitle>
              <Briefcase className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(ASSET_BREAKDOWN.investments / 100)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {((ASSET_BREAKDOWN.investments / (netWorth + ASSET_BREAKDOWN.liabilities)) * 100).toFixed(0)}% des Vermögens
                </p>
                <p className="text-xs text-green-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3" />
                  +5,4%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bargeld / Konten</CardTitle>
              <Banknote className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(ASSET_BREAKDOWN.cash / 100)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {((ASSET_BREAKDOWN.cash / (netWorth + ASSET_BREAKDOWN.liabilities)) * 100).toFixed(0)}% des Vermögens
                </p>
                <p className="text-xs text-green-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3" />
                  +1,8%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verbindlichkeiten</CardTitle>
              <CreditCard className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                -{formatCurrency(ASSET_BREAKDOWN.liabilities / 100)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  Offene Verbindlichkeiten
                </p>
                <p className="text-xs text-green-500 flex items-center">
                  <ArrowDownRight className="h-3 w-3" />
                  -4,2%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Net Worth Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Vermögensentwicklung
            </CardTitle>
            <CardDescription>
              Entwicklung Ihres Nettovermögens der letzten 12 Monate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={NET_WORTH_TREND}>
                <defs>
                  <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  formatter={(value: number) => [formatCurrency(value), "Nettovermögen"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#wealthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Immobilienbestand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Ihre Immobilien werden aus den Gebäudedaten automatisch berechnet.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Liquiditätsreserve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bargeld & Bankkonten</span>
                  <span className="font-medium">
                    {formatCurrency(ASSET_BREAKDOWN.cash / 100)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Empfohlene Reserve</span>
                  <span className="font-medium text-muted-foreground">
                    {formatCurrency(30000)}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Status</span>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      Ausreichend
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
