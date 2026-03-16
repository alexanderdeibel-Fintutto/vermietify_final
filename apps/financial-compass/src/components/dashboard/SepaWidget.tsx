import { ArrowUpRight, ArrowDownLeft, Send, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSepaPayments } from '@/hooks/useSepaPayments';
import { useNavigate } from 'react-router-dom';

export function SepaWidget() {
  const { payments, loading } = useSepaPayments();
  const navigate = useNavigate();

  const pendingPayments = payments.filter(p => p.status === 'draft' || p.status === 'pending');
  const transfers = pendingPayments.filter(p => p.type === 'transfer');
  const directDebits = pendingPayments.filter(p => p.type === 'direct_debit');
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  // Find next execution date
  const nextExecution = pendingPayments
    .map(p => p.execution_date)
    .sort()[0];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">SEPA-Zahlungen</CardTitle>
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
      onClick={() => navigate('/sepa-zahlungen')}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            SEPA-Zahlungen
          </CardTitle>
          {pendingPayments.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary">
              {pendingPayments.length} offen
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine offenen SEPA-Zahlungen</p>
        ) : (
          <>
            {/* Summary */}
            <div className="text-lg font-bold">{formatCurrency(totalPending)}</div>

            {/* Breakdown */}
            <div className="space-y-2">
              {transfers.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                    {transfers.length} Überweisung{transfers.length > 1 ? 'en' : ''}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(transfers.reduce((s, p) => s + p.amount, 0))}
                  </span>
                </div>
              )}
              {directDebits.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
                    {directDebits.length} Lastschrift{directDebits.length > 1 ? 'en' : ''}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(directDebits.reduce((s, p) => s + p.amount, 0))}
                  </span>
                </div>
              )}
            </div>

            {/* Next execution */}
            {nextExecution && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-white/[0.08]">
                <Clock className="h-3 w-3" />
                Nächste Ausführung: {formatDate(nextExecution)}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
