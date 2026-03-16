import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Letzte Buchungen</h3>
        <a href="/buchungen" className="text-sm text-primary hover:underline">
          Alle anzeigen
        </a>
      </div>
      
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Noch keine Buchungen vorhanden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className={`p-2 rounded-lg ${
                transaction.type === 'income' 
                  ? 'bg-success/10 text-success' 
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {transaction.type === 'income' ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.category || 'Sonstiges'} • {formatDate(transaction.date)}
                </p>
              </div>
              <span className={`font-semibold ${
                transaction.type === 'income' ? 'text-success' : 'text-destructive'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
