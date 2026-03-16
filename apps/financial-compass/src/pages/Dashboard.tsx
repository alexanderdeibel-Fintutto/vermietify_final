import { useEffect, useState, useCallback } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { KPICard } from '@/components/dashboard/KPICard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { RevenueExpenseChart } from '@/components/dashboard/RevenueExpenseChart';
import { ExpenseByCategoryChart } from '@/components/dashboard/ExpenseByCategoryChart';
import { DueInvoicesList } from '@/components/dashboard/DueInvoicesList';
import { PendingReceiptsList } from '@/components/dashboard/PendingReceiptsList';
import { BankAccountsWidget } from '@/components/dashboard/BankAccountsWidget';
import { TaskFeed } from '@/components/dashboard/TaskFeed';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { SepaWidget } from '@/components/dashboard/SepaWidget';
import { RecurringWidget } from '@/components/dashboard/RecurringWidget';
import { AssetsWidget } from '@/components/dashboard/AssetsWidget';
import { SubscriptionWidget } from '@/components/dashboard/SubscriptionWidget';
import { LeaderboardWidget } from '@/components/dashboard/LeaderboardWidget';
import { PeriodSelector, PeriodKey, DateRange, getDateRange } from '@/components/dashboard/PeriodSelector';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  bankBalance: number;
  income: number;
  expenses: number;
  profit: number;
  previousIncome: number;
  previousExpenses: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category?: string;
}

interface MonthlyData {
  month: string;
  einnahmen: number;
  ausgaben: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface DueInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  contact_name?: string;
}

interface PendingReceipt {
  id: string;
  file_name: string;
  file_url?: string | null;
  created_at: string;
}

export default function Dashboard() {
  const { currentCompany, companies, businessCompanies, refetchCompanies } = useCompany();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    bankBalance: 0,
    income: 0,
    expenses: 0,
    profit: 0,
    previousIncome: 0,
    previousExpenses: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [dueInvoices, setDueInvoices] = useState<DueInvoice[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<PendingReceipt[]>([]);
  const [sparklineData, setSparklineData] = useState<{
    balance: number[];
    income: number[];
    expenses: number[];
    profit: number[];
  }>({ balance: [], income: [], expenses: [], profit: [] });
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('month');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('month'));

  const handlePeriodChange = useCallback((period: PeriodKey, range: DateRange) => {
    setSelectedPeriod(period);
    setDateRange(range);
  }, []);

  useEffect(() => {
    if (currentCompany) {
      fetchDashboardData();
    }
  }, [currentCompany, dateRange]);

  const fetchDashboardData = async () => {
    if (!currentCompany) return;
    setIsLoading(true);

    try {
      // Use selected date range
      const periodStart = dateRange.from.toISOString().split('T')[0];
      const periodEnd = dateRange.to.toISOString().split('T')[0];
      
      // Calculate previous period (same duration, shifted back)
      const duration = dateRange.to.getTime() - dateRange.from.getTime();
      const prevEnd = new Date(dateRange.from.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - duration);
      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = prevEnd.toISOString().split('T')[0];

      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(now.getDate() + 7);

      // Parallel data fetching
      const [
        bankAccountsResult,
        currentMonthTxResult,
        previousMonthTxResult,
        yearlyTxResult,
        recentTxResult,
        dueInvoicesResult,
        pendingReceiptsResult,
      ] = await Promise.all([
        // Bank accounts
        supabase
          .from('bank_accounts')
          .select('balance')
          .eq('company_id', currentCompany.id),
        
        // Period transactions
        supabase
          .from('transactions')
          .select('*')
          .eq('company_id', currentCompany.id)
          .gte('date', periodStart)
          .lte('date', periodEnd),
        
        // Previous period transactions
        supabase
          .from('transactions')
          .select('*')
          .eq('company_id', currentCompany.id)
          .gte('date', prevStartStr)
          .lte('date', prevEndStr),
        
        // Yearly transactions (for charts)
        supabase
          .from('transactions')
          .select('*')
          .eq('company_id', currentCompany.id)
          .gte('date', startOfYear.toISOString().split('T')[0])
          .order('date', { ascending: true }),
        
        // Recent transactions
        supabase
          .from('transactions')
          .select('*')
          .eq('company_id', currentCompany.id)
          .order('date', { ascending: false })
          .limit(5),
        
        // Due invoices (next 7 days + overdue)
        supabase
          .from('invoices')
          .select('id, invoice_number, amount, due_date, contacts(name)')
          .eq('company_id', currentCompany.id)
          .eq('status', 'sent')
          .lte('due_date', sevenDaysFromNow.toISOString().split('T')[0])
          .order('due_date', { ascending: true })
          .limit(5),
        
        // Pending receipts (without transaction_id)
        supabase
          .from('receipts')
          .select('id, file_name, file_url, created_at')
          .eq('company_id', currentCompany.id)
          .is('transaction_id', null)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Process bank balance
      const bankBalance = bankAccountsResult.data?.reduce(
        (sum, acc) => sum + Number(acc.balance), 0
      ) || 0;

      // Process current month stats
      const currentMonthTx = currentMonthTxResult.data || [];
      const income = currentMonthTx
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = currentMonthTx
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Process previous month stats
      const previousMonthTx = previousMonthTxResult.data || [];
      const previousIncome = previousMonthTx
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const previousExpenses = previousMonthTx
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      setStats({
        bankBalance,
        income,
        expenses,
        profit: income - expenses,
        previousIncome,
        previousExpenses,
      });

      // Process yearly transactions for monthly chart
      const yearlyTx = yearlyTxResult.data || [];
      const monthlyMap = new Map<string, { einnahmen: number; ausgaben: number }>();
      
      // Initialize all months
      const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
      for (let i = 0; i < 12; i++) {
        const monthKey = monthNames[i];
        monthlyMap.set(monthKey, { einnahmen: 0, ausgaben: 0 });
      }

      // Fill with actual data
      yearlyTx.forEach((tx) => {
        const date = new Date(tx.date);
        const monthKey = monthNames[date.getMonth()];
        const current = monthlyMap.get(monthKey)!;
        if (tx.type === 'income') {
          current.einnahmen += Number(tx.amount);
        } else {
          current.ausgaben += Number(tx.amount);
        }
      });

      const monthlyChartData: MonthlyData[] = monthNames.map((month) => ({
        month,
        ...monthlyMap.get(month)!,
      }));
      setMonthlyData(monthlyChartData);

      // Generate sparkline data (last 6 months)
      const last6Months = monthlyChartData.slice(Math.max(0, now.getMonth() - 5), now.getMonth() + 1);
      setSparklineData({
        balance: last6Months.map((m) => m.einnahmen - m.ausgaben),
        income: last6Months.map((m) => m.einnahmen),
        expenses: last6Months.map((m) => m.ausgaben),
        profit: last6Months.map((m) => m.einnahmen - m.ausgaben),
      });

      // Process expense categories
      const categoryMap = new Map<string, number>();
      yearlyTx
        .filter((tx) => tx.type === 'expense')
        .forEach((tx) => {
          const category = tx.category || 'Sonstiges';
          categoryMap.set(category, (categoryMap.get(category) || 0) + Number(tx.amount));
        });

      const categoryChartData: CategoryData[] = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value, color: '' }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setCategoryData(categoryChartData);

      // Process recent transactions
      if (recentTxResult.data) {
        setTransactions(
          recentTxResult.data.map((t) => ({
            id: t.id,
            description: t.description || 'Ohne Beschreibung',
            amount: Number(t.amount),
            type: t.type as 'income' | 'expense',
            date: t.date,
            category: t.category || undefined,
          }))
        );
      }

      // Process due invoices
      if (dueInvoicesResult.data) {
        setDueInvoices(
          dueInvoicesResult.data.map((inv) => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            amount: Number(inv.amount),
            due_date: inv.due_date || '',
            contact_name: (inv.contacts as { name: string } | null)?.name,
          }))
        );
      }

      // Process pending receipts
      if (pendingReceiptsResult.data) {
        setPendingReceipts(
          pendingReceiptsResult.data.map((r) => ({
            id: r.id,
            file_name: r.file_name,
            file_url: r.file_url,
            created_at: r.created_at || '',
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCompany = async () => {
    if (!newCompanyName.trim() || !user) return;

    setCreatingCompany(true);
    try {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({ name: newCompanyName.trim() })
        .select()
        .single();

      if (companyError) throw companyError;

      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: company.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      await refetchCompanies();
      setNewCompanyName('');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setCreatingCompany(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const calculateChange = (current: number, previous: number): { value: string; type: 'positive' | 'negative' | 'neutral' } => {
    if (previous === 0) return { value: '', type: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    const prefix = change >= 0 ? '+' : '';
    return {
      value: `${prefix}${change.toFixed(0)}%`,
      type: change >= 0 ? 'positive' : 'negative',
    };
  };

  // Show company creation prompt only if no business companies exist
  if (companies.length === 0 || (companies.length > 0 && businessCompanies.length === 0 && !currentCompany?.is_personal)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-6 rounded-full bg-primary/10 mb-6">
          <Building2 className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Willkommen bei Fintutto!</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Erstellen Sie Ihre erste Firma, um mit der geschäftlichen Buchhaltung zu beginnen.
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Firma erstellen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Firma erstellen</DialogTitle>
              <DialogDescription>
                Geben Sie den Namen Ihrer Firma ein, um zu beginnen.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Firmenname</Label>
                <Input
                  id="companyName"
                  placeholder="z.B. Musterfirma GmbH"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                />
              </div>
              <Button
                onClick={createCompany}
                disabled={!newCompanyName.trim() || creatingCompany}
                className="w-full"
              >
                {creatingCompany ? 'Wird erstellt...' : 'Firma erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const incomeChange = calculateChange(stats.income, stats.previousIncome);
  const expensesChange = calculateChange(stats.expenses, stats.previousExpenses);
  const profitChange = calculateChange(stats.profit, stats.previousIncome - stats.previousExpenses);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1 sm:mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {currentCompany?.is_personal ? 'Privatbereich' : 'Dashboard'}
            </h1>
            <Badge
              variant={currentCompany?.is_personal ? 'secondary' : 'default'}
              className={cn(
                'text-xs px-3 py-1',
                currentCompany?.is_personal
                  ? 'bg-muted text-muted-foreground border-border'
                  : 'bg-primary/15 text-primary border-primary/30 border'
              )}
            >
              {currentCompany?.is_personal ? '👤 Privat' : '🏢 Firma'}
            </Badge>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            {currentCompany?.is_personal
              ? 'Ihre persönliche Finanzübersicht'
              : `Übersicht für ${currentCompany?.name || 'Ihre Firma'}`}
          </p>
        </div>
        {/* Compact Quick Actions in header */}
        <div className="hidden sm:block">
          <QuickActions variant="compact" />
        </div>
      </div>

      {/* Period Selector */}
      <PeriodSelector selectedPeriod={selectedPeriod} onPeriodChange={handlePeriodChange} />

      {/* KPI Cards - 2 columns on mobile, 4 on large screens */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-4">
        <KPICard
          title="Bankguthaben"
          value={formatCurrency(stats.bankBalance)}
          icon={Wallet}
          sparklineData={sparklineData.balance}
        />
        <KPICard
          title="Einnahmen"
          value={formatCurrency(stats.income)}
          change={incomeChange.value}
          changeType={incomeChange.type}
          icon={TrendingUp}
          sparklineData={sparklineData.income}
        />
        <KPICard
          title="Ausgaben"
          value={formatCurrency(stats.expenses)}
          change={expensesChange.value}
          changeType={stats.expenses <= stats.previousExpenses ? 'positive' : 'negative'}
          icon={TrendingDown}
          sparklineData={sparklineData.expenses}
        />
        <KPICard
          title="Gewinn"
          value={formatCurrency(stats.profit)}
          change={profitChange.value}
          changeType={stats.profit >= 0 ? profitChange.type : 'negative'}
          icon={PiggyBank}
          sparklineData={sparklineData.profit}
        />
      </div>

      {/* Charts Row - stack on mobile */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <RevenueExpenseChart data={monthlyData} />
        <ExpenseByCategoryChart data={categoryData} />
      </div>

      {/* Widgets Row 1 - Bankkonten, Vermögen, Kalender, Aufgaben */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        <BankAccountsWidget />
        <AssetsWidget />
        <CalendarWidget />
        <SubscriptionWidget />
        <LeaderboardWidget />
      </div>

      {/* Task Feed */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-1">
        <TaskFeed />
      </div>

      {/* Widgets Row 2 - SEPA, Wiederkehrende Buchungen */}
      {!currentCompany?.is_personal && (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <SepaWidget />
          <RecurringWidget />
        </div>
      )}

      {/* Lists Row - stack on mobile */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <RecentTransactions transactions={transactions} />
        <DueInvoicesList invoices={dueInvoices} />
        <PendingReceiptsList receipts={pendingReceipts} />
      </div>
    </div>
  );
}
