import { Building2, ArrowUpRight, ArrowDownRight, AlertCircle, CreditCard, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

interface BankingStatsGridProps {
  totalBalance: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  unmatchedCount: number;
  monthlyTransactionsCount: number;
  connectionsCount: number;
  formatCurrency: (cents: number) => string;
}

export function BankingStatsGrid({
  totalBalance,
  incomeThisMonth,
  expensesThisMonth,
  unmatchedCount,
  monthlyTransactionsCount,
  connectionsCount,
  formatCurrency,
}: BankingStatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Gesamtguthaben */}
      <div className="rounded-2xl backdrop-blur-md bg-card/40 border border-border/30 p-6 md:col-span-2 lg:col-span-1">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-primary/10 p-3">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gesamtguthaben</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      </div>

      {/* Einnahmen */}
      <div className="rounded-2xl backdrop-blur-md bg-card/40 border border-border/30 p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-success/10 p-3">
            <ArrowUpRight className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Einnahmen</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(incomeThisMonth)}</p>
            <p className="text-xs text-muted-foreground">diesen Monat</p>
          </div>
        </div>
      </div>

      {/* Ausgaben */}
      <div className="rounded-2xl backdrop-blur-md bg-card/40 border border-border/30 p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-destructive/10 p-3">
            <ArrowDownRight className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ausgaben</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(expensesThisMonth)}</p>
            <p className="text-xs text-muted-foreground">diesen Monat</p>
          </div>
        </div>
      </div>

      {/* Offene Zuordnungen */}
      <div className="rounded-2xl backdrop-blur-md bg-card/40 border border-border/30 p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-warning/10 p-3">
            <AlertCircle className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Offene Zuordnungen</p>
            <Link 
              to="/banking/transaktionen?status=unmatched"
              className="text-2xl font-bold text-foreground hover:text-primary transition-colors"
            >
              {unmatchedCount}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
