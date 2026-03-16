import { FileText, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  contact_name?: string;
}

interface DueInvoicesListProps {
  invoices: Invoice[];
}

export function DueInvoicesList({ invoices }: DueInvoicesListProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Fällige Rechnungen</CardTitle>
          <a href="/rechnungen" className="text-sm text-primary hover:underline">
            Alle anzeigen
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">Keine fälligen Rechnungen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => {
              const daysUntilDue = getDaysUntilDue(invoice.due_date);
              const isOverdue = daysUntilDue < 0;

              return (
                <div
                  key={invoice.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                    {isOverdue ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{invoice.invoice_number}</p>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          Überfällig
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {invoice.contact_name || 'Unbekannter Kunde'}
                      {' • '}
                      {isOverdue
                        ? `${Math.abs(daysUntilDue)} Tage überfällig`
                        : daysUntilDue === 0
                        ? 'Heute fällig'
                        : `In ${daysUntilDue} Tagen`}
                    </p>
                  </div>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(invoice.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
