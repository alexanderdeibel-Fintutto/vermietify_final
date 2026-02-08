import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "lucide-react";
import { useBanking } from "@/hooks/useBanking";
import { LoadingState } from "@/components/shared/LoadingState";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ManualAccountDialog } from "@/components/banking/ManualAccountDialog";
import { TransactionImportDialog } from "@/components/banking/TransactionImportDialog";
 
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
   
   // Stats calculations
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
 
   const maskIban = (iban: string) => {
     return `${iban.slice(0, 4)} **** **** ${iban.slice(-4)}`;
   };
 
   if (isLoading) return <MainLayout title="Banking"><LoadingState /></MainLayout>;
 
   return (
     <MainLayout 
       title="Banking"
       breadcrumbs={[{ label: "Banking" }]}
     >
       <div className="space-y-6">
         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight">Banking & Konten</h1>
             <p className="text-muted-foreground">Verwalten Sie Ihre Bankverbindungen und Transaktionen</p>
           </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to="/banking/transaktionen">
                  <List className="h-4 w-4 mr-2" />
                  Transaktionen
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                CSV/PDF Import
              </Button>
              <Button variant="outline" onClick={() => setShowManualDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Konto anlegen
              </Button>
              <Button asChild>
                <Link to="/banking/verbinden">
                  <Building2 className="h-4 w-4 mr-2" />
                  API verbinden
                </Link>
              </Button>
            </div>
         </div>
 
         {/* Stats */}
         <div className="grid gap-4 md:grid-cols-4">
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-primary/10 p-2">
                   <Building2 className="h-5 w-5 text-primary" />
                 </div>
               </div>
               <div className="mt-4">
                 <p className="text-3xl font-bold">{connections.length}</p>
                 <p className="text-sm text-muted-foreground mt-1">Verbundene Banken</p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-accent p-2">
                   <CreditCard className="h-5 w-5 text-accent-foreground" />
                 </div>
               </div>
               <div className="mt-4">
                 <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
                 <p className="text-sm text-muted-foreground mt-1">Gesamtsaldo</p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-secondary p-2">
                   <AlertCircle className="h-5 w-5 text-secondary-foreground" />
                 </div>
               </div>
               <div className="mt-4">
                 <Link 
                   to="/banking/transaktionen?status=unmatched" 
                   className="text-3xl font-bold hover:text-primary"
                 >
                   {unmatchedCount}
                 </Link>
                 <p className="text-sm text-muted-foreground mt-1">Offene Zuordnungen</p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-muted p-2">
                   <RefreshCw className="h-5 w-5 text-muted-foreground" />
                 </div>
               </div>
               <div className="mt-4">
                 <p className="text-3xl font-bold">{monthlyTransactions.length}</p>
                 <p className="text-sm text-muted-foreground mt-1">Transaktionen diesen Monat</p>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Quick Stats */}
         <div className="grid gap-4 md:grid-cols-3">
           <Card className="border-l-4 border-l-primary">
             <CardContent className="p-4 flex items-center gap-4">
               <ArrowUpRight className="h-8 w-8 text-primary" />
               <div>
                 <p className="text-2xl font-bold text-primary">{formatCurrency(incomeThisMonth)}</p>
                 <p className="text-sm text-muted-foreground">Einnahmen diesen Monat</p>
               </div>
             </CardContent>
           </Card>
           <Card className="border-l-4 border-l-destructive">
             <CardContent className="p-4 flex items-center gap-4">
               <ArrowDownRight className="h-8 w-8 text-destructive" />
               <div>
                 <p className="text-2xl font-bold text-destructive">{formatCurrency(expensesThisMonth)}</p>
                 <p className="text-sm text-muted-foreground">Ausgaben diesen Monat</p>
               </div>
             </CardContent>
           </Card>
           <Card className="border-l-4 border-l-accent">
             <CardContent className="p-4 flex items-center gap-4">
               <AlertCircle className="h-8 w-8 text-accent-foreground" />
               <div>
                 <Link 
                   to="/banking/transaktionen?status=unmatched"
                   className="text-2xl font-bold hover:text-primary"
                 >
                   {unmatchedCount} nicht zugeordnet
                 </Link>
                 <p className="text-sm text-muted-foreground">Klicken zum Zuordnen</p>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Connected Accounts */}
         <div>
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-semibold">Verbundene Konten</h2>
             <Button 
               variant="outline" 
               size="sm"
               onClick={() => syncTransactions.mutate({})}
               disabled={syncTransactions.isPending}
             >
               <RefreshCw className={`h-4 w-4 mr-2 ${syncTransactions.isPending ? 'animate-spin' : ''}`} />
               Alle synchronisieren
             </Button>
           </div>
 
           {accounts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Noch keine Konten eingerichtet</h3>
                  <p className="text-muted-foreground mb-4">
                    Verbinden Sie per API oder legen Sie ein Konto manuell an, um Transaktionen zu importieren
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button asChild>
                      <Link to="/banking/verbinden">
                        <Building2 className="h-4 w-4 mr-2" />
                        Per API verbinden
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={() => setShowManualDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Konto manuell anlegen
                    </Button>
                  </div>
                </CardContent>
              </Card>
           ) : (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {accounts.map((account) => {
                 const connection = connections.find(c => c.id === account.connection_id);
                 const status = statusConfig[connection?.status || 'pending'];
                 
                 return (
                   <Card key={account.id}>
                     <CardHeader className="pb-2">
                       <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                           {connection?.bank_logo_url ? (
                             <img 
                               src={connection.bank_logo_url} 
                               alt={connection.bank_name}
                               className="h-10 w-10 rounded"
                             />
                           ) : (
                             <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                               <Building2 className="h-5 w-5" />
                             </div>
                           )}
                           <div>
                             <CardTitle className="text-base">{account.account_name}</CardTitle>
                             <CardDescription>{connection?.bank_name}</CardDescription>
                           </div>
                         </div>
                         <Badge variant={status.variant} className="flex items-center gap-1">
                           {status.icon}
                           {status.label}
                         </Badge>
                       </div>
                     </CardHeader>
                     <CardContent>
                       <p className="text-sm text-muted-foreground font-mono mb-2">
                         {maskIban(account.iban)}
                       </p>
                       <p className="text-2xl font-bold">
                         {formatCurrency(account.balance_cents)}
                       </p>
                       {account.balance_date && (
                         <p className="text-xs text-muted-foreground mt-1">
                           Stand: {format(new Date(account.balance_date), "dd.MM.yyyy HH:mm", { locale: de })}
                         </p>
                       )}
                       
                       <div className="flex gap-2 mt-4">
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => syncTransactions.mutate({ accountId: account.id })}
                           disabled={syncTransactions.isPending}
                         >
                           <RefreshCw className={`h-4 w-4 ${syncTransactions.isPending ? 'animate-spin' : ''}`} />
                         </Button>
                         <Button variant="outline" size="sm" asChild>
                           <Link to={`/banking/transaktionen?account=${account.id}`}>
                             <ExternalLink className="h-4 w-4" />
                           </Link>
                         </Button>
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => setDeleteConnectionId(account.connection_id)}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 );
               })}
             </div>
           )}
         </div>
 
          {/* Confirm Delete Dialog */}
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

          {/* Manual Account Dialog */}
          <ManualAccountDialog
            open={showManualDialog}
            onOpenChange={setShowManualDialog}
          />

          {/* Transaction Import Dialog */}
          <TransactionImportDialog
            open={showImportDialog}
            onOpenChange={setShowImportDialog}
            accounts={accounts}
          />
       </div>
     </MainLayout>
   );
 }