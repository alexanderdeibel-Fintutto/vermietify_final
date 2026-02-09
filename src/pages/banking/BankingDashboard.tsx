import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  CreditCard, 
  RefreshCw, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Trash2,
  List,
  Upload,
  Link2,
} from "lucide-react";
import { useBanking } from "@/hooks/useBanking";
import { LoadingState } from "@/components/shared/LoadingState";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ManualAccountDialog } from "@/components/banking/ManualAccountDialog";
import { TransactionImportDialog } from "@/components/banking/TransactionImportDialog";
import { BankingStatsGrid } from "@/components/banking/BankingStatsGrid";
import { BankingAccountCard } from "@/components/banking/BankingAccountCard";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  connected: { label: "Verbunden", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  pending: { label: "Ausstehend", variant: "outline", icon: <Clock className="h-3 w-3" /> },
  error: { label: "Fehler", variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
  update_required: { label: "Update nötig", variant: "secondary", icon: <AlertCircle className="h-3 w-3" /> },
  disconnected: { label: "Getrennt", variant: "outline", icon: <AlertCircle className="h-3 w-3" /> },
};

export default function BankingDashboard() {
  const { 
    connections, 
    accounts, 
    totalBalance, 
    isLoading, 
    useTransactions,
    syncTransactions, 
    deleteConnection 
  } = useBanking();
  const [deleteConnectionId, setDeleteConnectionId] = useState<string | null>(null);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { data: transactions = [] } = useTransactions({});
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  
  const monthlyTransactions = transactions.filter(
    t => t.booking_date >= startOfMonth
  );
  
  const incomeThisMonth = monthlyTransactions
    .filter(t => t.amount_cents > 0)
    .reduce((sum, t) => sum + t.amount_cents, 0);
  
  const expensesThisMonth = monthlyTransactions
    .filter(t => t.amount_cents < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount_cents), 0);
  
  const unmatchedCount = transactions.filter(t => t.match_status === 'unmatched').length;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  };

  if (isLoading) return <MainLayout title="Banking"><LoadingState /></MainLayout>;

  return (
    <MainLayout 
      title="Banking"
      breadcrumbs={[{ label: "Banking" }]}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Bankkonten</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Verwalten Sie Ihre Bankverbindungen
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-full backdrop-blur-sm bg-card/60 border-border/50" asChild>
              <Link to="/banking/verbinden">
                <Link2 className="h-4 w-4 mr-2" />
                Bankverbindung
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-full backdrop-blur-sm bg-card/60 border-border/50" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" className="rounded-full backdrop-blur-sm bg-card/60 border-border/50" onClick={() => setShowManualDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Konto hinzufügen
            </Button>
          </div>
        </div>

        {/* Sync Status Bar */}
        <div className="rounded-2xl backdrop-blur-md bg-card/40 border border-border/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">Letzte Synchronisation</p>
              <p className="text-muted-foreground text-sm">Automatische Sync alle 6 Stunden</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="rounded-full backdrop-blur-sm bg-card/60 border-border/50"
            onClick={() => syncTransactions.mutate({})}
            disabled={syncTransactions.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncTransactions.isPending ? 'animate-spin' : ''}`} />
            Jetzt synchronisieren
          </Button>
        </div>

        {/* Stats */}
        <BankingStatsGrid 
          totalBalance={totalBalance}
          incomeThisMonth={incomeThisMonth}
          expensesThisMonth={expensesThisMonth}
          unmatchedCount={unmatchedCount}
          monthlyTransactionsCount={monthlyTransactions.length}
          connectionsCount={connections.length}
          formatCurrency={formatCurrency}
        />

        {/* Connected Accounts */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-semibold text-foreground">Verbundene Konten</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
              <Link to="/banking/transaktionen">
                <List className="h-4 w-4 mr-2" />
                Alle Transaktionen
              </Link>
            </Button>
          </div>

          {accounts.length === 0 ? (
            <div className="rounded-2xl backdrop-blur-md bg-card/40 border border-border/30 p-16 text-center">
              <Building2 className="h-14 w-14 mx-auto text-muted-foreground/50 mb-5" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Noch keine Konten eingerichtet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Verbinden Sie per API oder legen Sie ein Konto manuell an, um Transaktionen zu importieren
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button className="rounded-full" asChild>
                  <Link to="/banking/verbinden">
                    <Building2 className="h-4 w-4 mr-2" />
                    Per API verbinden
                  </Link>
                </Button>
                <Button variant="outline" className="rounded-full backdrop-blur-sm bg-card/60 border-border/50" onClick={() => setShowManualDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Konto manuell anlegen
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => {
                const connection = connections.find(c => c.id === account.connection_id);
                const status = statusConfig[connection?.status || 'pending'];
                
                return (
                  <BankingAccountCard
                    key={account.id}
                    account={account}
                    connection={connection}
                    status={status}
                    formatCurrency={formatCurrency}
                    onSync={() => syncTransactions.mutate({ accountId: account.id })}
                    onDelete={() => setDeleteConnectionId(account.connection_id)}
                    isSyncing={syncTransactions.isPending}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Dialogs */}
        <ConfirmDialog
          open={!!deleteConnectionId}
          onOpenChange={() => setDeleteConnectionId(null)}
          title="Bankverbindung trennen"
          description="Möchten Sie diese Bankverbindung wirklich trennen? Alle zugehörigen Konten und Transaktionen bleiben erhalten."
          onConfirm={() => {
            if (deleteConnectionId) {
              deleteConnection.mutate(deleteConnectionId);
              setDeleteConnectionId(null);
            }
          }}
        />

        <ManualAccountDialog
          open={showManualDialog}
          onOpenChange={setShowManualDialog}
        />

        <TransactionImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          accounts={accounts}
        />
      </div>
    </MainLayout>
  );
}
