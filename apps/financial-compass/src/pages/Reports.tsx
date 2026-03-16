import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, TrendingUp, PieChart, Building2, FileText, FileSpreadsheet,
  Download, Printer, ArrowUp, ArrowDown, LineChart, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  ComparisonChart,
  ProfitTrendChart,
  CashFlowForecastChart,
  ExpenseBreakdownChart,
} from '@/components/reports/AdvancedReportCharts';

type ReportType = 'bwa' | 'guv' | 'bilanz' | 'ustva' | 'journal' | 'susa';
type ViewMode = 'standard' | 'charts' | 'forecast';

interface ReportOption {
  id: ReportType;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface ReportData {
  income: number;
  expenses: number;
  profit: number;
  expensesByCategory: Record<string, number>;
  prevMonthIncome: number;
  prevMonthExpenses: number;
  prevMonthProfit: number;
}

const reportOptions: ReportOption[] = [
  { id: 'bwa', label: 'BWA', icon: BarChart3, color: 'text-blue-500', bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30' },
  { id: 'guv', label: 'GuV', icon: TrendingUp, color: 'text-green-500', bgColor: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30' },
  { id: 'bilanz', label: 'Bilanz', icon: PieChart, color: 'text-purple-500', bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30' },
  { id: 'ustva', label: 'UStVA', icon: Building2, color: 'text-orange-500', bgColor: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30' },
  { id: 'journal', label: 'Journal', icon: FileText, color: 'text-gray-400', bgColor: 'bg-gray-500/10 hover:bg-gray-500/20 border-gray-500/30' },
  { id: 'susa', label: 'Summen & Salden', icon: FileSpreadsheet, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30' },
];

const periods = [
  { value: 'current-month', label: 'Aktueller Monat' },
  { value: 'prev-month', label: 'Vormonat' },
  { value: 'q1', label: 'Q1' },
  { value: 'q2', label: 'Q2' },
  { value: 'q3', label: 'Q3' },
  { value: 'q4', label: 'Q4' },
  { value: 'year', label: 'Ganzes Jahr' },
];

export default function Reports() {
  const { currentCompany } = useCompany();
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [selectedReport, setSelectedReport] = useState<ReportType>('bwa');
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    income: 0,
    expenses: 0,
    profit: 0,
    expensesByCategory: {},
    prevMonthIncome: 0,
    prevMonthExpenses: 0,
    prevMonthProfit: 0,
  });

  useEffect(() => {
    if (currentCompany) {
      fetchReportData();
    }
  }, [currentCompany, selectedPeriod]);

  const getDateRange = (period: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    switch (period) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'prev-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'q1':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 2, 31);
        break;
      case 'q2':
        startDate = new Date(now.getFullYear(), 3, 1);
        endDate = new Date(now.getFullYear(), 5, 30);
        break;
      case 'q3':
        startDate = new Date(now.getFullYear(), 6, 1);
        endDate = new Date(now.getFullYear(), 8, 30);
        break;
      case 'q4':
        startDate = new Date(now.getFullYear(), 9, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  };

  const fetchReportData = async () => {
    if (!currentCompany) return;

    setLoading(true);
    
    const { startDate, endDate } = getDateRange(selectedPeriod);
    
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', currentCompany.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    const prevMonthStart = new Date(startDate);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevMonthEnd = new Date(startDate);
    prevMonthEnd.setDate(0);

    const { data: prevTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', currentCompany.id)
      .gte('date', prevMonthStart.toISOString().split('T')[0])
      .lte('date', prevMonthEnd.toISOString().split('T')[0]);

    const income = transactions?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const expenses = transactions?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const prevMonthIncome = prevTransactions?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const prevMonthExpenses = prevTransactions?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const expensesByCategory = transactions?.filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category || 'Sonstiges';
        acc[category] = (acc[category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>) || {};

    setReportData({
      income,
      expenses,
      profit: income - expenses,
      expensesByCategory,
      prevMonthIncome,
      prevMonthExpenses,
      prevMonthProfit: prevMonthIncome - prevMonthExpenses,
    });
    
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    if (!isFinite(value)) return '-';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const profitChange = calculateChange(reportData.profit, reportData.prevMonthProfit);
    const rows = [
      ['Position', 'Aktuell', 'Vormonat', 'Abweichung'],
      ['Umsatzerlöse', reportData.income, reportData.prevMonthIncome, calculateChange(reportData.income, reportData.prevMonthIncome).toFixed(1) + '%'],
      ...Object.entries(reportData.expensesByCategory).map(([cat, val]) => [cat, val, '', '']),
      ['Summe Aufwand', reportData.expenses, reportData.prevMonthExpenses, calculateChange(reportData.expenses, reportData.prevMonthExpenses).toFixed(1) + '%'],
      ['Betriebsergebnis', reportData.profit, reportData.prevMonthProfit, profitChange.toFixed(1) + '%'],
    ];
    
    const csv = rows.map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bwa-${selectedPeriod}.csv`;
    link.click();
  };

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Bitte wählen Sie eine Firma aus.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Berichte</h1>
          <p className="text-muted-foreground">Auswertungen und Analysen Ihrer Buchhaltung</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px] bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            PDF Export
          </Button>

          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Drucken
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
        <TabsList className="glass">
          <TabsTrigger value="standard" className="gap-2">
            <FileText className="h-4 w-4" />
            Standardberichte
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-2">
            <LineChart className="h-4 w-4" />
            Grafiken & Vergleiche
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-2">
            <Wallet className="h-4 w-4" />
            Cashflow-Prognose
          </TabsTrigger>
        </TabsList>

        {/* Standard Reports Tab */}
        <TabsContent value="standard" className="space-y-6 mt-6">
          {/* Report Type Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {reportOptions.map((report) => {
              const Icon = report.icon;
              const isSelected = selectedReport === report.id;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                    isSelected
                      ? `${report.bgColor} border-2`
                      : "glass hover:bg-secondary/50 border-border/50"
                  )}
                >
                  <Icon className={cn("h-6 w-6", report.color)} />
                  <span className={cn("text-sm font-medium", isSelected && report.color)}>
                    {report.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Report Content */}
          {loading ? (
            <div className="glass rounded-xl p-12 text-center text-muted-foreground">
              Lade Berichtsdaten...
            </div>
          ) : (
            <>
              {selectedReport === 'bwa' && (
                <BWAReport data={reportData} formatCurrency={formatCurrency} formatPercent={formatPercent} calculateChange={calculateChange} />
              )}
              {selectedReport === 'guv' && (
                <GuVReport data={reportData} formatCurrency={formatCurrency} />
              )}
              {selectedReport === 'bilanz' && (
                <BilanzReport data={reportData} formatCurrency={formatCurrency} />
              )}
              {(selectedReport === 'ustva' || selectedReport === 'journal' || selectedReport === 'susa') && (
                <div className="glass rounded-xl p-12 text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    {reportOptions.find(r => r.id === selectedReport)?.label}
                  </p>
                  <p className="text-muted-foreground">
                    Dieser Bericht wird in einer zukünftigen Version verfügbar sein.
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Charts & Comparison Tab */}
        <TabsContent value="charts" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ComparisonChart />
            <ProfitTrendChart />
          </div>
          <ExpenseBreakdownChart />
        </TabsContent>

        {/* Cashflow Forecast Tab */}
        <TabsContent value="forecast" className="space-y-6 mt-6">
          <CashFlowForecastChart />
          <div className="grid gap-6 lg:grid-cols-2">
            <ComparisonChart />
            <ExpenseBreakdownChart />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// BWA Report Component
function BWAReport({ 
  data, 
  formatCurrency, 
  formatPercent, 
  calculateChange 
}: { 
  data: ReportData; 
  formatCurrency: (n: number) => string;
  formatPercent: (n: number) => string;
  calculateChange: (c: number, p: number) => number;
}) {
  const profitChange = calculateChange(data.profit, data.prevMonthProfit);
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Gesamterlöse</p>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(data.income)}</p>
          <div className="flex items-center gap-1 mt-1 text-sm">
            {data.income >= data.prevMonthIncome ? (
              <ArrowUp className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-500" />
            )}
            <span className={data.income >= data.prevMonthIncome ? 'text-green-500' : 'text-red-500'}>
              {formatPercent(calculateChange(data.income, data.prevMonthIncome))}
            </span>
          </div>
        </div>
        
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Gesamtaufwand</p>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(data.expenses)}</p>
          <div className="flex items-center gap-1 mt-1 text-sm">
            {data.expenses <= data.prevMonthExpenses ? (
              <ArrowDown className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowUp className="h-3 w-3 text-red-500" />
            )}
            <span className={data.expenses <= data.prevMonthExpenses ? 'text-green-500' : 'text-red-500'}>
              {formatPercent(calculateChange(data.expenses, data.prevMonthExpenses))}
            </span>
          </div>
        </div>
        
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Betriebsergebnis</p>
          <p className={cn("text-2xl font-bold", data.profit >= 0 ? 'text-green-500' : 'text-red-500')}>
            {formatCurrency(data.profit)}
          </p>
        </div>
        
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">vs. Vormonat</p>
          <div className="flex items-center gap-2">
            {profitChange >= 0 ? (
              <ArrowUp className="h-6 w-6 text-green-500" />
            ) : (
              <ArrowDown className="h-6 w-6 text-red-500" />
            )}
            <p className={cn("text-2xl font-bold", profitChange >= 0 ? 'text-green-500' : 'text-red-500')}>
              {formatPercent(profitChange)}
            </p>
          </div>
        </div>
      </div>

      {/* BWA Table */}
      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="w-[40%]">Position</TableHead>
              <TableHead className="text-right">Aktuell</TableHead>
              <TableHead className="text-right">Vormonat</TableHead>
              <TableHead className="text-right">Plan</TableHead>
              <TableHead className="text-right">Abweichung</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Betriebserlöse Section */}
            <TableRow className="bg-green-500/10 border-green-500/30">
              <TableCell colSpan={5} className="font-bold text-green-500">
                Betriebserlöse
              </TableCell>
            </TableRow>
            <TableRow className="border-border/30">
              <TableCell className="pl-6">Umsatzerlöse</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(data.income)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatCurrency(data.prevMonthIncome)}</TableCell>
              <TableCell className="text-right text-muted-foreground">-</TableCell>
              <TableCell className={cn("text-right", calculateChange(data.income, data.prevMonthIncome) >= 0 ? 'text-green-500' : 'text-red-500')}>
                {formatPercent(calculateChange(data.income, data.prevMonthIncome))}
              </TableCell>
            </TableRow>
            <TableRow className="border-border/30 bg-secondary/30">
              <TableCell className="font-semibold">Summe Erlöse</TableCell>
              <TableCell className="text-right font-bold text-green-500">{formatCurrency(data.income)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(data.prevMonthIncome)}</TableCell>
              <TableCell className="text-right">-</TableCell>
              <TableCell className={cn("text-right font-medium", calculateChange(data.income, data.prevMonthIncome) >= 0 ? 'text-green-500' : 'text-red-500')}>
                {formatPercent(calculateChange(data.income, data.prevMonthIncome))}
              </TableCell>
            </TableRow>

            {/* Betriebsaufwand Section */}
            <TableRow className="bg-red-500/10 border-red-500/30">
              <TableCell colSpan={5} className="font-bold text-red-500">
                Betriebsaufwand
              </TableCell>
            </TableRow>
            {['Materialaufwand', 'Personalaufwand', 'Miete', 'Versicherungen', 'Telefon/Internet', 'Bürobedarf', 'Beratungskosten', 'IT-Kosten', 'Sonstiges'].map((category) => (
              <TableRow key={category} className="border-border/30">
                <TableCell className="pl-6">{category}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(data.expensesByCategory[category] || 0)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-border/30 bg-secondary/30">
              <TableCell className="font-semibold">Summe Aufwand</TableCell>
              <TableCell className="text-right font-bold text-red-500">{formatCurrency(data.expenses)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(data.prevMonthExpenses)}</TableCell>
              <TableCell className="text-right">-</TableCell>
              <TableCell className={cn("text-right font-medium", calculateChange(data.expenses, data.prevMonthExpenses) <= 0 ? 'text-green-500' : 'text-red-500')}>
                {formatPercent(calculateChange(data.expenses, data.prevMonthExpenses))}
              </TableCell>
            </TableRow>

            {/* Betriebsergebnis */}
            <TableRow className={cn("border-t-2", data.profit >= 0 ? 'bg-green-500/5 border-green-500/50' : 'bg-red-500/5 border-red-500/50')}>
              <TableCell className="font-bold text-lg">Betriebsergebnis</TableCell>
              <TableCell className={cn("text-right font-bold text-lg", data.profit >= 0 ? 'text-green-500' : 'text-red-500')}>
                {formatCurrency(data.profit)}
              </TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(data.prevMonthProfit)}</TableCell>
              <TableCell className="text-right">-</TableCell>
              <TableCell className={cn("text-right font-bold", calculateChange(data.profit, data.prevMonthProfit) >= 0 ? 'text-green-500' : 'text-red-500')}>
                {formatPercent(calculateChange(data.profit, data.prevMonthProfit))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// GuV Report Component
function GuVReport({ 
  data, 
  formatCurrency 
}: { 
  data: ReportData; 
  formatCurrency: (n: number) => string;
}) {
  const materialCosts = data.expensesByCategory['Materialaufwand'] || 0;
  const rohertrag = data.income - materialCosts;
  const personalCosts = data.expensesByCategory['Personalaufwand'] || 0;
  const otherExpenses = data.expenses - materialCosts - personalCosts;
  const betriebsergebnis = rohertrag - personalCosts - otherExpenses;
  const finanzergebnis = 0;
  const steuern = betriebsergebnis > 0 ? betriebsergebnis * 0.15 : 0;
  const jahresueberschuss = betriebsergebnis + finanzergebnis - steuern;

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-secondary/30">
          <h2 className="text-lg font-bold">Gewinn- und Verlustrechnung</h2>
          <p className="text-sm text-muted-foreground">nach § 275 HGB (Gesamtkostenverfahren)</p>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="w-[60%]">Position</TableHead>
              <TableHead className="text-right">Betrag</TableHead>
              <TableHead className="text-right">Vorjahr</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-border/30">
              <TableCell>1. Umsatzerlöse</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(data.income)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatCurrency(data.prevMonthIncome)}</TableCell>
            </TableRow>
            <TableRow className="border-border/30">
              <TableCell>2. Materialaufwand</TableCell>
              <TableCell className="text-right font-medium text-red-500">-{formatCurrency(materialCosts)}</TableCell>
              <TableCell className="text-right text-muted-foreground">-</TableCell>
            </TableRow>
            <TableRow className="border-border/30 bg-secondary/30">
              <TableCell className="font-semibold">= Rohertrag</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(rohertrag)}</TableCell>
              <TableCell className="text-right">-</TableCell>
            </TableRow>
            <TableRow className="border-border/30">
              <TableCell>3. Personalaufwand</TableCell>
              <TableCell className="text-right font-medium text-red-500">-{formatCurrency(personalCosts)}</TableCell>
              <TableCell className="text-right text-muted-foreground">-</TableCell>
            </TableRow>
            <TableRow className="border-border/30">
              <TableCell>4. Sonstige betriebliche Aufwendungen</TableCell>
              <TableCell className="text-right font-medium text-red-500">-{formatCurrency(otherExpenses)}</TableCell>
              <TableCell className="text-right text-muted-foreground">-</TableCell>
            </TableRow>
            <TableRow className="border-border/30 bg-secondary/30">
              <TableCell className="font-semibold">= Betriebsergebnis (EBIT)</TableCell>
              <TableCell className={cn("text-right font-bold", betriebsergebnis >= 0 ? 'text-green-500' : 'text-red-500')}>
                {formatCurrency(betriebsergebnis)}
              </TableCell>
              <TableCell className="text-right">-</TableCell>
            </TableRow>
            <TableRow className="border-border/30">
              <TableCell>5. Finanzergebnis</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(finanzergebnis)}</TableCell>
              <TableCell className="text-right text-muted-foreground">-</TableCell>
            </TableRow>
            <TableRow className="border-border/30">
              <TableCell>6. Steuern vom Einkommen</TableCell>
              <TableCell className="text-right font-medium text-red-500">-{formatCurrency(steuern)}</TableCell>
              <TableCell className="text-right text-muted-foreground">-</TableCell>
            </TableRow>
            <TableRow className={cn("border-t-2", jahresueberschuss >= 0 ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50')}>
              <TableCell className="font-bold text-lg">= Jahresüberschuss/-fehlbetrag</TableCell>
              <TableCell className={cn("text-right font-bold text-lg", jahresueberschuss >= 0 ? 'text-green-500' : 'text-red-500')}>
                {formatCurrency(jahresueberschuss)}
              </TableCell>
              <TableCell className="text-right">-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Bilanz Report Component
function BilanzReport({ 
  data, 
  formatCurrency 
}: { 
  data: ReportData; 
  formatCurrency: (n: number) => string;
}) {
  const aktiva = {
    anlagevermoegen: 50000,
    umlaufvermoegen: data.income - data.expenses + 10000,
  };
  const passiva = {
    eigenkapital: 25000 + (data.profit > 0 ? data.profit : 0),
    verbindlichkeiten: aktiva.anlagevermoegen + aktiva.umlaufvermoegen - 25000 - (data.profit > 0 ? data.profit : 0),
  };
  
  const bilanzsumme = aktiva.anlagevermoegen + aktiva.umlaufvermoegen;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Aktiva */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/50 bg-blue-500/10">
            <h2 className="text-lg font-bold text-blue-500">Aktiva</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow className="bg-secondary/30 border-border/30">
                <TableCell className="font-semibold">A. Anlagevermögen</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(aktiva.anlagevermoegen)}</TableCell>
              </TableRow>
              <TableRow className="border-border/30">
                <TableCell className="pl-6">I. Sachanlagen</TableCell>
                <TableCell className="text-right">{formatCurrency(aktiva.anlagevermoegen * 0.8)}</TableCell>
              </TableRow>
              <TableRow className="border-border/30">
                <TableCell className="pl-6">II. Finanzanlagen</TableCell>
                <TableCell className="text-right">{formatCurrency(aktiva.anlagevermoegen * 0.2)}</TableCell>
              </TableRow>
              <TableRow className="bg-secondary/30 border-border/30">
                <TableCell className="font-semibold">B. Umlaufvermögen</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(aktiva.umlaufvermoegen)}</TableCell>
              </TableRow>
              <TableRow className="border-border/30">
                <TableCell className="pl-6">I. Forderungen</TableCell>
                <TableCell className="text-right">{formatCurrency(aktiva.umlaufvermoegen * 0.4)}</TableCell>
              </TableRow>
              <TableRow className="border-border/30">
                <TableCell className="pl-6">II. Kassenbestand, Bankguthaben</TableCell>
                <TableCell className="text-right">{formatCurrency(aktiva.umlaufvermoegen * 0.6)}</TableCell>
              </TableRow>
              <TableRow className="border-t-2 border-primary/50 bg-primary/5">
                <TableCell className="font-bold">Bilanzsumme</TableCell>
                <TableCell className="text-right font-bold text-primary">{formatCurrency(bilanzsumme)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Passiva */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/50 bg-purple-500/10">
            <h2 className="text-lg font-bold text-purple-500">Passiva</h2>
          </div>
          <Table>
            <TableBody>
              <TableRow className="bg-secondary/30 border-border/30">
                <TableCell className="font-semibold">A. Eigenkapital</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(passiva.eigenkapital)}</TableCell>
              </TableRow>
              <TableRow className="border-border/30">
                <TableCell className="pl-6">I. Gezeichnetes Kapital</TableCell>
                <TableCell className="text-right">{formatCurrency(25000)}</TableCell>
              </TableRow>
              <TableRow className="border-border/30">
                <TableCell className="pl-6">II. Jahresüberschuss</TableCell>
                <TableCell className={cn("text-right", data.profit >= 0 ? 'text-green-500' : 'text-red-500')}>
                  {formatCurrency(data.profit > 0 ? data.profit : 0)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-secondary/30 border-border/30">
                <TableCell className="font-semibold">B. Verbindlichkeiten</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(passiva.verbindlichkeiten)}</TableCell>
              </TableRow>
              <TableRow className="border-border/30">
                <TableCell className="pl-6">I. Verbindlichkeiten ggü. Kreditinstituten</TableCell>
                <TableCell className="text-right">{formatCurrency(passiva.verbindlichkeiten * 0.7)}</TableCell>
              </TableRow>
              <TableRow className="border-border/30">
                <TableCell className="pl-6">II. Sonstige Verbindlichkeiten</TableCell>
                <TableCell className="text-right">{formatCurrency(passiva.verbindlichkeiten * 0.3)}</TableCell>
              </TableRow>
              <TableRow className="border-t-2 border-primary/50 bg-primary/5">
                <TableCell className="font-bold">Bilanzsumme</TableCell>
                <TableCell className="text-right font-bold text-primary">{formatCurrency(bilanzsumme)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
