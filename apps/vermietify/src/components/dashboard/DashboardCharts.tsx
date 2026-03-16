import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface DashboardChartsProps {
  vacancyRate: number;
  totalUnits: number;
  totalBuildings: number;
  totalTenants: number;
  isLoading: boolean;
}

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

export function DashboardCharts({
  vacancyRate,
  totalUnits,
  totalBuildings,
  totalTenants,
  isLoading,
}: DashboardChartsProps) {
  const occupiedUnits = Math.round(totalUnits * (1 - vacancyRate / 100));
  const vacantUnits = totalUnits - occupiedUnits;

  const occupancyData = [
    { name: "Vermietet", value: occupiedUnits },
    { name: "Leerstehend", value: vacantUnits },
  ];

  const portfolioData = [
    { name: "Gebäude", value: totalBuildings },
    { name: "Einheiten", value: totalUnits },
    { name: "Mieter", value: totalTenants },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Occupancy Pie */}
      <Card className="backdrop-blur-md bg-white/10 border-white/15 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Belegungsquote</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : totalUnits === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Keine Einheiten vorhanden</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {occupancyData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm">Vermietet: {occupiedUnits}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-muted" />
                  <span className="text-sm">Leer: {vacantUnits}</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {(100 - vacancyRate).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Overview Bar Chart */}
      <Card className="backdrop-blur-md bg-white/10 border-white/15 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Portfolio-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
