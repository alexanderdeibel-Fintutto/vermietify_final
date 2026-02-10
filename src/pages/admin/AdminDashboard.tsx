import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/hooks/useAdminData";
import { LoadingState } from "@/components/shared";
import {
  Users,
  Building2,
  Home,
  CreditCard,
  Activity,
  Server,
  Database,
  HardDrive,
  CheckCircle,
  Shield,
  UserPlus,
  Settings,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

// Mock login activity data
const loginActivity = Array.from({ length: 30 }, (_, i) => ({
  date: format(new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000), "dd.MM"),
  logins: Math.floor(Math.random() * 50) + 10,
}));

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--muted))"];

export default function AdminDashboard() {
  const { useSystemStats, useRecentUsers, useRecentBuildings } = useAdminData();
  const { data: stats, isLoading: statsLoading } = useSystemStats();
  const { data: recentUsers = [], isLoading: usersLoading } = useRecentUsers();
  const { data: recentBuildings = [], isLoading: buildingsLoading } = useRecentBuildings();

  const isLoading = statsLoading || usersLoading || buildingsLoading;

  if (isLoading) {
    return (
      <AdminLayout title="Admin Dashboard">
        <LoadingState />
      </AdminLayout>
    );
  }

  const distributionData = [
    { name: "Gebäude", value: stats?.totalBuildings || 0 },
    { name: "Einheiten", value: stats?.totalUnits || 0 },
    { name: "Abos", value: stats?.activeSubscriptions || 0 },
  ];

  const growthData = Array.from({ length: 6 }, (_, i) => ({
    month: format(new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000), "MMM", { locale: de }),
    users: Math.max(0, (stats?.totalUsers || 0) - (5 - i) * Math.floor(Math.random() * 3)),
    orgs: Math.max(0, (stats?.totalOrgs || 0) - (5 - i) * Math.floor(Math.random() * 2)),
  }));

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* System Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <StatCard title="Benutzer" value={stats?.totalUsers || 0} icon={Users} />
          <StatCard title="Organisationen" value={stats?.totalOrgs || 0} icon={Building2} />
          <StatCard title="Gebäude" value={stats?.totalBuildings || 0} icon={Building2} />
          <StatCard title="Einheiten" value={stats?.totalUnits || 0} icon={Home} />
          <StatCard title="Aktive Abos" value={stats?.activeSubscriptions || 0} icon={CreditCard} />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin-Schnellaktionen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/admin/benutzer">
                  <UserPlus className="h-6 w-6 text-blue-500" />
                  <span className="text-xs">Benutzer verwalten</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/admin/organisationen">
                  <Building2 className="h-6 w-6 text-green-500" />
                  <span className="text-xs">Organisationen</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/analytics">
                  <BarChart3 className="h-6 w-6 text-purple-500" />
                  <span className="text-xs">Analytics</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/admin/settings">
                  <Settings className="h-6 w-6 text-orange-500" />
                  <span className="text-xs">Einstellungen</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Login-Aktivität (30 Tage)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={loginActivity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line type="monotone" dataKey="logins" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Plattform-Verteilung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center gap-6">
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {distributionData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {distributionData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Wachstum (6 Monate)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="users" name="Benutzer" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orgs" name="Organisationen" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>Neueste Benutzer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-muted-foreground">{user.organizations?.name || "Keine Org"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(user.created_at), "dd.MM.yyyy", { locale: de })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Buildings */}
          <Card>
            <CardHeader>
              <CardTitle>Neueste Gebäude</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBuildings.map((building: any) => (
                  <div key={building.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{building.name}</p>
                      <p className="text-sm text-muted-foreground">{building.city} - {building.organizations?.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(building.created_at), "dd.MM.yyyy", { locale: de })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">API Status</p>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Datenbank</p>
                  <p className="text-sm text-muted-foreground">~50 MB</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <HardDrive className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Storage</p>
                  <p className="text-sm text-muted-foreground">~100 MB</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
