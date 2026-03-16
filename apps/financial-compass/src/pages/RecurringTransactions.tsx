import { useState } from 'react';
import {
  Plus,
  Repeat,
  Play,
  Pause,
  Trash2,
  Edit,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCompany } from '@/contexts/CompanyContext';
import {
  useRecurringTransactions,
  RecurringTransaction,
} from '@/hooks/useRecurringTransactions';

const categories = [
  'Einnahmen',
  'Gehälter',
  'Miete',
  'Büromaterial',
  'Marketing',
  'Reisekosten',
  'Versicherungen',
  'Telekommunikation',
  'Abonnements',
  'Sonstiges',
];

const frequencyLabels = {
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  quarterly: 'Vierteljährlich',
  yearly: 'Jährlich',
};

const weekDays = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
];

export default function RecurringTransactions() {
  const { currentCompany } = useCompany();
  const {
    recurringTransactions,
    loading,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    executeRecurringTransaction,
    checkAndExecuteDueTransactions,
  } = useRecurringTransactions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransaction | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    frequency: 'monthly' as RecurringTransaction['frequency'],
    day_of_month: 1,
    day_of_week: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      frequency: 'monthly',
      day_of_month: 1,
      day_of_week: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_active: true,
    });
    setSelectedTransaction(null);
  };

  const handleOpenDialog = (transaction?: RecurringTransaction) => {
    if (transaction) {
      setSelectedTransaction(transaction);
      setFormData({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category,
        frequency: transaction.frequency,
        day_of_month: transaction.day_of_month ?? 1,
        day_of_week: transaction.day_of_week ?? 1,
        start_date: transaction.start_date,
        end_date: transaction.end_date ?? '',
        is_active: transaction.is_active,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const data = {
      description: formData.description,
      amount,
      type: formData.type,
      category: formData.category,
      frequency: formData.frequency,
      day_of_month: formData.frequency === 'monthly' || formData.frequency === 'yearly' || formData.frequency === 'quarterly'
        ? formData.day_of_month
        : undefined,
      day_of_week: formData.frequency === 'weekly' ? formData.day_of_week : undefined,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      is_active: formData.is_active,
    };

    if (selectedTransaction) {
      await updateRecurringTransaction(selectedTransaction.id, data);
    } else {
      await createRecurringTransaction(data);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (selectedTransaction) {
      await deleteRecurringTransaction(selectedTransaction.id);
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
    }
  };

  const handleExecute = async (transaction: RecurringTransaction) => {
    setIsExecuting(true);
    await executeRecurringTransaction(transaction);
    setIsExecuting(false);
  };

  const handleExecuteAllDue = async () => {
    setIsExecuting(true);
    const count = await checkAndExecuteDueTransactions();
    setIsExecuting(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getDueStatus = (transaction: RecurringTransaction) => {
    const today = new Date().toISOString().split('T')[0];
    if (transaction.next_execution <= today) {
      return { label: 'Fällig', variant: 'destructive' as const };
    }
    const nextDate = new Date(transaction.next_execution);
    const daysDiff = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7) {
      return { label: `In ${daysDiff} Tagen`, variant: 'secondary' as const };
    }
    return { label: formatDate(transaction.next_execution), variant: 'outline' as const };
  };

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Bitte wählen Sie eine Firma aus.
      </div>
    );
  }

  const activeTransactions = recurringTransactions.filter((t) => t.is_active);
  const inactiveTransactions = recurringTransactions.filter((t) => !t.is_active);
  const dueTransactions = activeTransactions.filter(
    (t) => t.next_execution <= new Date().toISOString().split('T')[0]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Wiederkehrende Buchungen</h1>
          <p className="text-muted-foreground">Automatisieren Sie regelmäßige Einnahmen und Ausgaben</p>
        </div>
        <div className="flex gap-2">
          {dueTransactions.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExecuteAllDue}
              disabled={isExecuting}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {dueTransactions.length} fällige ausführen
            </Button>
          )}
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Neue Vorlage
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktive Vorlagen</p>
                <p className="text-2xl font-bold">{activeTransactions.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Repeat className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Heute fällig</p>
                <p className="text-2xl font-bold text-destructive">{dueTransactions.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/10">
                <Clock className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monatlicher Durchschnitt</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    activeTransactions
                      .filter((t) => t.type === 'expense')
                      .reduce((sum, t) => {
                        const multiplier =
                          t.frequency === 'daily' ? 30 :
                          t.frequency === 'weekly' ? 4.33 :
                          t.frequency === 'monthly' ? 1 :
                          t.frequency === 'quarterly' ? 0.33 :
                          0.083;
                        return sum + t.amount * multiplier;
                      }, 0)
                  )}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Transactions */}
      {activeTransactions.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg">Aktive Vorlagen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {activeTransactions.map((transaction) => {
                const status = getDueStatus(transaction);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        transaction.type === 'income'
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{transaction.description}</p>
                        <Badge variant="secondary">{frequencyLabels[transaction.frequency]}</Badge>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category} • Nächste Ausführung: {formatDate(transaction.next_execution)}
                      </p>
                    </div>
                    <span
                      className={`font-semibold ${
                        transaction.type === 'income' ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExecute(transaction)}
                        disabled={isExecuting}
                        title="Jetzt ausführen"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(transaction)}
                        title="Bearbeiten"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setDeleteDialogOpen(true);
                        }}
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive Transactions */}
      {inactiveTransactions.length > 0 && (
        <Card className="glass opacity-60">
          <CardHeader>
            <CardTitle className="text-lg">Pausierte Vorlagen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {inactiveTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                    <Pause className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.category} • {frequencyLabels[transaction.frequency]}
                    </p>
                  </div>
                  <span className="font-semibold text-muted-foreground">
                    {formatCurrency(transaction.amount)}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(transaction)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {recurringTransactions.length === 0 && !loading && (
        <Card className="glass">
          <CardContent className="p-12 text-center">
            <Repeat className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Keine wiederkehrenden Buchungen</h3>
            <p className="text-muted-foreground mb-4">
              Erstellen Sie Vorlagen für regelmäßige Einnahmen und Ausgaben wie Miete, Gehälter oder Abonnements.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Erste Vorlage erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction ? 'Vorlage bearbeiten' : 'Neue wiederkehrende Buchung'}
            </DialogTitle>
            <DialogDescription>
              {selectedTransaction
                ? 'Bearbeiten Sie die wiederkehrende Buchung.'
                : 'Erstellen Sie eine Vorlage für eine wiederkehrende Buchung.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.type === 'income' ? 'default' : 'outline'}
                className={`flex-1 gap-2 ${formData.type === 'income' ? 'bg-success hover:bg-success/90' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'income' })}
              >
                <ArrowDownLeft className="h-4 w-4" />
                Einnahme
              </Button>
              <Button
                type="button"
                variant={formData.type === 'expense' ? 'default' : 'outline'}
                className={`flex-1 gap-2 ${formData.type === 'expense' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'expense' })}
              >
                <ArrowUpRight className="h-4 w-4" />
                Ausgabe
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="z.B. Büromiete, Spotify Abo..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Betrag</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Häufigkeit</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, frequency: value as RecurringTransaction['frequency'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="day_of_week">Wochentag</Label>
                <Select
                  value={formData.day_of_week.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, day_of_week: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekDays.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(formData.frequency === 'monthly' ||
              formData.frequency === 'quarterly' ||
              formData.frequency === 'yearly') && (
              <div className="space-y-2">
                <Label htmlFor="day_of_month">Tag des Monats</Label>
                <Select
                  value={formData.day_of_month.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, day_of_month: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}. des Monats
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Startdatum</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Enddatum (optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Aktiv</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              {selectedTransaction ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vorlage löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die wiederkehrende Buchung "{selectedTransaction?.description}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
