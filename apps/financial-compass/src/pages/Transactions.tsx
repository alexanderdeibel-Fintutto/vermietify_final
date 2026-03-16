import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Receipt, Wallet, X, CreditCard } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { BulkActionsBar } from '@/components/transactions/BulkActionsBar';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  description: string | null;
  amount: number;
  type: string;
  date: string;
  category: string | null;
  bank_account_id: string | null;
}

interface BankAccountInfo {
  id: string;
  name: string;
  iban: string | null;
}

type FilterType = 'all' | 'income' | 'expense';

const categories = [
  'Einnahmen',
  'Gehälter',
  'Miete',
  'Büromaterial',
  'Marketing',
  'Reisekosten',
  'Versicherungen',
  'Telekommunikation',
  'Sonstiges',
];

export default function Transactions() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const bankAccountFilter = searchParams.get('konto');
  const [bankAccountInfo, setBankAccountInfo] = useState<BankAccountInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (currentCompany) {
      fetchTransactions();
    }
  }, [currentCompany, bankAccountFilter]);

  const fetchTransactions = async () => {
    if (!currentCompany) return;

    setLoading(true);
    
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('company_id', currentCompany.id)
      .order('date', { ascending: false })
      .limit(10000);

    if (bankAccountFilter) {
      query = query.eq('bank_account_id', bankAccountFilter);
      
      // Fetch bank account info for header
      const { data: accountData } = await supabase
        .from('bank_accounts')
        .select('id, name, iban')
        .eq('id', bankAccountFilter)
        .single();
      
      setBankAccountInfo(accountData);
    } else {
      setBankAccountInfo(null);
    }

    const { data } = await query;

    if (data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    return {
      total: transactions.length,
      income: totalIncome,
      expense: totalExpense,
      balance,
    };
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const handleCreateTransaction = async () => {
    if (!currentCompany) return;

    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen gültigen Betrag ein.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('transactions').insert({
      company_id: currentCompany.id,
      type: newTransaction.type,
      amount: amount,
      description: newTransaction.description || null,
      category: newTransaction.category || null,
      date: newTransaction.date,
    });

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Buchung konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Erfolg',
        description: 'Buchung wurde erstellt.',
      });
      setDialogOpen(false);
      setNewTransaction({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchTransactions();
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || t.type === filter;
    return matchesSearch && matchesFilter;
  });

  const pagination = usePagination(filteredTransactions);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === pagination.paginatedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagination.paginatedItems.map((t) => t.id)));
    }
  }, [pagination.paginatedItems, selectedIds.size]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectedTransactions = useMemo(
    () => filteredTransactions.filter((t) => selectedIds.has(t.id)),
    [filteredTransactions, selectedIds]
  );

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Bitte wählen Sie eine Firma aus.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Bank account filter banner */}
      {bankAccountInfo && (
        <div className="flex items-center gap-3 glass rounded-xl p-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{bankAccountInfo.name}</p>
            {bankAccountInfo.iban && (
              <p className="text-sm text-muted-foreground font-mono truncate">
                {bankAccountInfo.iban.replace(/(.{4})/g, '$1 ').trim()}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              searchParams.delete('konto');
              setSearchParams(searchParams);
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Filter aufheben
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
            {bankAccountInfo ? `Buchungen – ${bankAccountInfo.name}` : 'Buchungen'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {bankAccountInfo 
              ? `${transactions.length} Buchungen für dieses Konto`
              : 'Verwalten Sie Ihre Transaktionen'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neue Buchung
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Neue Buchung erstellen</DialogTitle>
              <DialogDescription>
                Fügen Sie eine neue Einnahme oder Ausgabe hinzu.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Income/Expense Toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                  className={`flex-1 gap-2 ${newTransaction.type === 'income' ? 'bg-success hover:bg-success/90' : ''}`}
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  Einnahme
                </Button>
                <Button
                  type="button"
                  variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                  className={`flex-1 gap-2 ${newTransaction.type === 'expense' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Ausgabe
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Betrag (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  placeholder="Beschreibung der Buchung..."
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select
                  value={newTransaction.category}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateTransaction}>Buchung erstellen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards - 2 columns on mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Buchungen</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shrink-0 ml-2">
                <Receipt className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Einnahmen</p>
                <p className="text-lg sm:text-2xl font-bold text-success truncate">{formatCurrency(stats.income)}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-success/10 shrink-0 ml-2">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Ausgaben</p>
                <p className="text-lg sm:text-2xl font-bold text-destructive truncate">{formatCurrency(stats.expense)}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-destructive/10 shrink-0 ml-2">
                <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Saldo</p>
                <p className={`text-lg sm:text-2xl font-bold truncate ${stats.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(stats.balance)}
                </p>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl shrink-0 ml-2 ${stats.balance >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <Wallet className={`h-4 w-4 sm:h-6 sm:w-6 ${stats.balance >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
            className="shrink-0"
          >
            Alle
          </Button>
          <Button
            variant={filter === 'income' ? 'default' : 'outline'}
            onClick={() => setFilter('income')}
            size="sm"
            className={`shrink-0 ${filter === 'income' ? 'bg-success hover:bg-success/90' : ''}`}
          >
            <ArrowDownLeft className="mr-1 h-4 w-4" />
            <span className="hidden xs:inline">Einnahmen</span>
            <span className="xs:hidden">Ein.</span>
          </Button>
          <Button
            variant={filter === 'expense' ? 'default' : 'outline'}
            onClick={() => setFilter('expense')}
            size="sm"
            className={`shrink-0 ${filter === 'expense' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
          >
            <ArrowUpRight className="mr-1 h-4 w-4" />
            <span className="hidden xs:inline">Ausgaben</span>
            <span className="xs:hidden">Aus.</span>
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        selectedTransactions={selectedTransactions}
        onClearSelection={clearSelection}
        onRefresh={fetchTransactions}
      />

      {/* Transactions List */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Laden...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Keine Buchungen gefunden
          </div>
        ) : (
          <>
            {/* Select all header */}
            <div className="flex items-center gap-3 px-3 sm:px-4 py-2 border-b border-border bg-secondary/20">
              <Checkbox
                checked={pagination.paginatedItems.length > 0 && selectedIds.size === pagination.paginatedItems.length}
                onCheckedChange={toggleSelectAll}
                className="shrink-0"
              />
              <span className="text-xs text-muted-foreground">
                {selectedIds.size > 0 ? `${selectedIds.size} ausgewählt` : 'Alle auswählen'}
              </span>
            </div>
            <div className="divide-y divide-border">
              {pagination.paginatedItems.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-secondary/30 transition-colors cursor-pointer active:bg-secondary/40 ${
                    selectedIds.has(transaction.id) ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => toggleSelect(transaction.id)}
                >
                  <Checkbox
                    checked={selectedIds.has(transaction.id)}
                    onCheckedChange={() => toggleSelect(transaction.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  />
                  <div
                    className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                      transaction.type === 'income'
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {transaction.type === 'income' ? (
                      <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium truncate">
                      {transaction.description || 'Ohne Beschreibung'}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {transaction.category || 'Sonstiges'} • {formatDate(transaction.date)}
                    </p>
                  </div>
                  <span
                    className={`text-sm sm:text-base font-semibold shrink-0 ${
                      transaction.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          onNextPage={pagination.nextPage}
          onPrevPage={pagination.prevPage}
          onGoToPage={pagination.goToPage}
        />
      </div>
    </div>
  );
}
