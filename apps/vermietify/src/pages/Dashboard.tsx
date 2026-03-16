import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Wrench, AlertCircle, TrendingUp, Calendar, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardActivityFeed } from "@/components/dashboard/DashboardActivityFeed";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { EcosystemPromoCards } from "@/components/ecosystem/EcosystemPromoCards";
import { PortalToolPromo } from "@/components/portal/PortalToolPromo";

interface DashboardStats {
  totalRent: number;
  vacancyRate: number;
  openRepairs: number;
  pendingPayments: number;
  totalBuildings: number;
  totalUnits: number;
  totalTenants: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  is_completed: boolean;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchDashboardData();
    }
  }, [profile?.organization_id]);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const currentMonthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
      const currentMonthEnd = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
      // 12 months ago start
      const twelveMonthsAgo = format(subMonths(new Date(now.getFullYear(), now.getMonth(), 1), 11), 'yyyy-MM-dd');

      // Fetch all data in parallel
      const [
        { count: buildingsCount },
        { data: units },
        { count: tenantsCount },
        { data: tasksData },
        { data: leasesData },
        { data: bankTxThisMonth },
        { data: bankTxHistory },
      ] = await Promise.all([
        supabase.from('buildings').select('*', { count: 'exact', head: true }),
        supabase.from('units').select('id, rent_amount, status'),
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase
          .from('tasks')
          .select('*')
          .eq('is_completed', false)
          .order('due_date', { ascending: true })
          .limit(5),
        supabase
          .from('leases')
          .select('rent_amount, utility_advance, start_date, is_active')
          .eq('is_active', true),
        // Bank transactions this month (income)
        supabase
          .from('bank_transactions')
          .select('amount_cents, booking_date, account:bank_accounts!inner(connection:finapi_connections!inner(organization_id))')
          .gte('booking_date', currentMonthStart)
          .lte('booking_date', currentMonthEnd),
        // Bank transactions last 12 months for chart
        supabase
          .from('bank_transactions')
          .select('amount_cents, booking_date, account:bank_accounts!inner(connection:finapi_connections!inner(organization_id))')
          .gte('booking_date', twelveMonthsAgo),
      ]);

      // Calculate expected rent from active leases (in cents → EUR)
      const totalExpectedRentCents = leasesData?.reduce(
        (sum, lease) => sum + (lease.rent_amount || 0) + (lease.utility_advance || 0), 0
      ) || 0;
      const totalExpectedRent = totalExpectedRentCents / 100;

      // Actual income this month from bank transactions
      const actualIncomeThisMonth = (bankTxThisMonth || [])
        .filter(tx => tx.amount_cents > 0)
        .reduce((sum, tx) => sum + tx.amount_cents, 0) / 100;

      // Pending = expected - received (minimum 0)
      const pendingPayments = Math.max(0, totalExpectedRent - actualIncomeThisMonth);

      // Calculate vacancy
      const totalUnits = units?.length || 0;
      const vacantUnits = units?.filter(u => u.status === 'vacant').length || 0;
      const vacancyRate = totalUnits > 0 ? (vacantUnits / totalUnits) * 100 : 0;

      // Open repairs = actual open task count
      const openRepairs = tasksData?.length || 0;

      // Build revenue history from actual bank transactions
      const monthlyRevenue: MonthlyRevenue[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const mStart = format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd');
        const mEnd = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd');
        
        // Sum actual income from bank transactions in this month
        const monthIncome = (bankTxHistory || [])
          .filter(tx => tx.amount_cents > 0 && tx.booking_date >= mStart && tx.booking_date <= mEnd)
          .reduce((sum, tx) => sum + tx.amount_cents, 0) / 100;

        monthlyRevenue.push({
          month: format(date, 'MMM', { locale: de }),
          revenue: monthIncome,
        });
      }

      setStats({
        totalRent: actualIncomeThisMonth,
        vacancyRate: Math.round(vacancyRate * 10) / 10,
        openRepairs,
        pendingPayments,
        totalBuildings: buildingsCount || 0,
        totalUnits,
        totalTenants: tenantsCount || 0,
      });

      setRevenueData(monthlyRevenue);
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const kpiCards = [
    {
      title: "Einnahmen diesen Monat",
      value: formatCurrency(stats?.totalRent || 0),
      description: `tatsächliche Zahlungseingänge`,
      icon: TrendingUp,
      trend: stats?.totalRent ? "Aus Bankdaten" : "Keine Eingänge",
      trendUp: (stats?.totalRent || 0) > 0,
    },
    {
      title: "Leerstandsquote",
      value: `${stats?.vacancyRate || 0}%`,
      description: `${Math.round((stats?.vacancyRate || 0) * (stats?.totalUnits || 0) / 100)} von ${stats?.totalUnits || 0} leer`,
      icon: Building2,
      trend: stats?.vacancyRate ? (stats.vacancyRate > 5 ? "Zu hoch" : "Optimal") : "Keine Einheiten",
      trendUp: (stats?.vacancyRate || 0) <= 5,
    },
    {
      title: "Offene Aufgaben",
      value: stats?.openRepairs || 0,
      description: "Zu bearbeitende Aufgaben",
      icon: Wrench,
      trend: stats?.openRepairs ? `${stats.openRepairs} offen` : "Keine offenen",
      trendUp: (stats?.openRepairs || 0) === 0,
    },
    {
      title: "Ausstehende Zahlungen",
      value: formatCurrency(stats?.pendingPayments || 0),
      description: "Erwartete Miete − Eingänge",
      icon: AlertCircle,
      trend: (stats?.pendingPayments || 0) > 0 ? "Offen" : "Alles bezahlt",
      trendUp: (stats?.pendingPayments || 0) === 0,
    },
  ];

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-white/60">
            Willkommen zurück! Hier ist die Übersicht Ihrer Immobilien.
          </p>
        </div>

        {/* Onboarding Checklist */}
        <OnboardingChecklist />

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card, index) => (
            <Card key={index} className="backdrop-blur-md bg-white/10 border-white/15 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-white/50" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-white/50 mt-1">
                      {card.description}
                    </p>
                    <Badge 
                      variant={card.trendUp ? "default" : "destructive"} 
                      className="mt-2"
                    >
                      {card.trend}
                    </Badge>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Tasks Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 backdrop-blur-md bg-white/10 border-white/15 text-white">
            <CardHeader>
              <CardTitle>Mieteinnahmen</CardTitle>
              <CardDescription>
                Entwicklung der letzten 12 Monate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Einnahmen']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Open Tasks */}
          <Card className="backdrop-blur-md bg-white/10 border-white/15 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Offene Aufgaben
              </CardTitle>
              <CardDescription>
                Anstehende Aufgaben und Erinnerungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckSquare className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Keine offenen Aufgaben
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.due_date), 'dd.MM.yyyy', { locale: de })}
                          </p>
                        )}
                      </div>
                      <Badge variant={
                        task.priority === 'high' ? 'destructive' : 
                        task.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {task.priority === 'high' ? 'Hoch' : 
                         task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Charts */}
        <DashboardCharts
          vacancyRate={stats?.vacancyRate || 0}
          totalUnits={stats?.totalUnits || 0}
          totalBuildings={stats?.totalBuildings || 0}
          totalTenants={stats?.totalTenants || 0}
          isLoading={isLoading}
        />

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="backdrop-blur-md bg-white/10 border-white/15 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalBuildings || 0}</p>
                  <p className="text-sm text-muted-foreground">Gebäude</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-md bg-white/10 border-white/15 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <Building2 className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalUnits || 0}</p>
                  <p className="text-sm text-muted-foreground">Wohneinheiten</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-md bg-white/10 border-white/15 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalTenants || 0}</p>
                  <p className="text-sm text-muted-foreground">Mieter</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <DashboardQuickActions />

        {/* Portal Tools Promo */}
        <PortalToolPromo maxTools={4} />

        {/* Activity Feed */}
        <DashboardActivityFeed />

        {/* Fintutto Ecosystem Cross-Sell */}
        <EcosystemPromoCards />
      </div>
    </MainLayout>
  );
}
