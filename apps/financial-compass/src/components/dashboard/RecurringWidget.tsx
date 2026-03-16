import { RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { useNavigate } from 'react-router-dom';

const frequencyLabels: Record<string, string> = {
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  quarterly: 'Quartalsweise',
  yearly: 'Jährlich',
};

export function RecurringWidget() {
  const { recurringTransactions, loading } = useRecurringTransactions();
  const navigate = useNavigate();

  const active = recurringTransactions.filter(t => t.is_active);
  const today = new Date().toISOString().split('T')[0];

  // Sort by next_execution, show upcoming first
  const upcoming = [...active]
    .sort((a, b) => a.next_execution.localeCompare(b.next_execution))
    .slice(0, 4);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

  const isDue = (dateStr: string) => dateStr <= today;

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Wiederkehrende Buchungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer transition-all hover:border-white/20 hover:shadow-lg"
      onClick={() => navigate('/wiederkehrende-buchungen')}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            Wiederkehrend
          </CardTitle>
          {active.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {active.length} aktiv
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine wiederkehrenden Buchungen</p>
        ) : (
          upcoming.map(t => (
            <div
              key={t.id}
              className={`flex items-center justify-between text-sm py-1.5 ${
                isDue(t.next_execution) ? 'text-warning' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {t.type === 'income' ? (
                  <ArrowDownLeft className="h-3.5 w-3.5 text-success shrink-0" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5 text-destructive shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {frequencyLabels[t.frequency]} · {isDue(t.next_execution) ? 'Fällig!' : formatDate(t.next_execution)}
                  </p>
                </div>
              </div>
              <span className="font-medium shrink-0 ml-2">
                {formatCurrency(t.amount)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
