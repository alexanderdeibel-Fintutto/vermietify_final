import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  MoreHorizontal,
  XCircle,
  Eye,
  Layers
} from "lucide-react";
import { useBanking, BankTransaction } from "@/hooks/useBanking";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { TransactionMatchDialog } from "@/components/banking/TransactionMatchDialog";
import { BulkMatchDialog } from "@/components/banking/BulkMatchDialog";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useSearchParams } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
 
 const matchStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
   unmatched: { label: "Offen", variant: "outline" },
   auto: { label: "Auto", variant: "secondary" },
   manual: { label: "Manuell", variant: "default" },
   ignored: { label: "Ignoriert", variant: "destructive" },
 };
 
 export default function Transactions() {
   const [searchParams] = useSearchParams();
  const { accounts, useTransactions, ignoreTransaction } = useBanking();
  const queryClient = useQueryClient();
  
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-simple'],
    queryFn: async () => {
      const { data } = await supabase.from('tenants').select('id, first_name, last_name');
      return data || [];
    },
  });
 
   const [filters, setFilters] = useState({
     accountId: searchParams.get('account') || 'all-accounts',
     startDate: '',
     endDate: '',
     type: 'all' as 'income' | 'expense' | 'all',
     matchStatus: searchParams.get('status') || 'all',
     search: '',
   });
 
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
 
   const { data: transactions = [], isLoading } = useTransactions({
     accountId: filters.accountId === 'all-accounts' ? undefined : filters.accountId || undefined,
     startDate: filters.startDate || undefined,
     endDate: filters.endDate || undefined,
     type: filters.type === 'all' ? undefined : filters.type,
     matchStatus: filters.matchStatus,
   });
 
   const filteredTransactions = useMemo(() => {
     if (!filters.search) return transactions;
     const query = filters.search.toLowerCase();
     return transactions.filter(t => 
       t.purpose?.toLowerCase().includes(query) ||
       t.counterpart_name?.toLowerCase().includes(query) ||
       t.booking_text?.toLowerCase().includes(query) ||
       String(t.amount_cents / 100).includes(query)
     );
   }, [transactions, filters.search]);
 
   const formatCurrency = (cents: number) => {
     return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
   };
 
   const columns: ColumnDef<BankTransaction>[] = [
     {
       id: "select",
       header: ({ table }) => (
         <Checkbox
           checked={table.getIsAllPageRowsSelected()}
           onCheckedChange={(value) => {
             table.toggleAllPageRowsSelected(!!value);
             if (value) {
               setSelectedIds(filteredTransactions.map(t => t.id));
             } else {
               setSelectedIds([]);
             }
           }}
         />
       ),
       cell: ({ row }) => (
         <Checkbox
           checked={selectedIds.includes(row.original.id)}
           onCheckedChange={(value) => {
             if (value) {
               setSelectedIds(prev => [...prev, row.original.id]);
             } else {
               setSelectedIds(prev => prev.filter(id => id !== row.original.id));
             }
           }}
         />
       ),
     },
     {
       accessorKey: "booking_date",
       header: "Datum",
       cell: ({ row }) => format(new Date(row.original.booking_date), "dd.MM.yyyy", { locale: de }),
     },
     {
       accessorKey: "booking_text",
       header: "Buchungstext",
       cell: ({ row }) => (
         <div className="max-w-[250px]">
           <p className="font-medium truncate">{row.original.counterpart_name || '-'}</p>
           <p className="text-sm text-muted-foreground truncate">{row.original.purpose || row.original.booking_text}</p>
         </div>
       ),
     },
     {
       accessorKey: "amount_cents",
       header: "Betrag",
       cell: ({ row }) => {
         const amount = row.original.amount_cents;
         const isIncome = amount > 0;
         return (
           <div className={`flex items-center gap-1 font-medium ${isIncome ? 'text-primary' : 'text-destructive'}`}>
             {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
             {formatCurrency(Math.abs(amount))}
           </div>
         );
       },
     },
     {
       accessorKey: "counterpart_iban",
       header: "Gegenkonto",
       cell: ({ row }) => (
         <span className="text-sm font-mono text-muted-foreground">
           {row.original.counterpart_iban?.slice(0, 8)}...
         </span>
       ),
     },
     {
       accessorKey: "match_status",
       header: "Zuordnung",
       cell: ({ row }) => {
         const status = matchStatusConfig[row.original.match_status];
         const tenant = row.original.tenant;
         
         return (
           <div>
             <Badge variant={status.variant}>{status.label}</Badge>
             {tenant && (
               <p className="text-xs text-muted-foreground mt-1">
                 {tenant.first_name} {tenant.last_name}
               </p>
             )}
           </div>
         );
       },
     },
     {
       id: "actions",
       header: "Aktionen",
       cell: ({ row }) => (
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon">
               <MoreHorizontal className="h-4 w-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuItem onClick={() => setSelectedTransaction(row.original)}>
               <UserPlus className="h-4 w-4 mr-2" />
               Zuordnen
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => setSelectedTransaction(row.original)}>
               <Eye className="h-4 w-4 mr-2" />
               Details
             </DropdownMenuItem>
             {row.original.match_status === 'unmatched' && (
               <DropdownMenuItem onClick={() => ignoreTransaction.mutate(row.original.id)}>
                 <XCircle className="h-4 w-4 mr-2" />
                 Ignorieren
               </DropdownMenuItem>
             )}
           </DropdownMenuContent>
         </DropdownMenu>
       ),
     },
   ];
 
   if (isLoading) return <MainLayout title="Transaktionen"><LoadingState /></MainLayout>;
 
   return (
     <MainLayout 
       title="Transaktionen"
       breadcrumbs={[
         { label: "Banking", href: "/banking" },
         { label: "Transaktionen" }
       ]}
     >
       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">Transaktionen</h1>
           <p className="text-muted-foreground">Alle Banktransaktionen anzeigen und zuordnen</p>
         </div>
 
         {/* Filters */}
         <Card>
           <CardContent className="p-4">
             <div className="grid gap-4 md:grid-cols-6">
               <div className="relative md:col-span-2">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   placeholder="Suchen..."
                   value={filters.search}
                   onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                   className="pl-9"
                 />
               </div>
 
               <Select
                 value={filters.accountId}
                 onValueChange={(v) => setFilters(prev => ({ ...prev, accountId: v }))}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Alle Konten" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all-accounts">Alle Konten</SelectItem>
                   {accounts.map(acc => (
                     <SelectItem key={acc.id} value={acc.id}>{acc.account_name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
 
               <Select
                 value={filters.type}
                 onValueChange={(v) => setFilters(prev => ({ ...prev, type: v as typeof filters.type }))}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Alle Typen" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Alle Typen</SelectItem>
                   <SelectItem value="income">Eingang</SelectItem>
                   <SelectItem value="expense">Ausgang</SelectItem>
                 </SelectContent>
               </Select>
 
               <Select
                 value={filters.matchStatus}
                 onValueChange={(v) => setFilters(prev => ({ ...prev, matchStatus: v }))}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Alle Status" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Alle Status</SelectItem>
                   <SelectItem value="unmatched">Offen</SelectItem>
                   <SelectItem value="auto">Automatisch</SelectItem>
                   <SelectItem value="manual">Manuell</SelectItem>
                   <SelectItem value="ignored">Ignoriert</SelectItem>
                 </SelectContent>
               </Select>
 
               <Input
                 type="date"
                 value={filters.startDate}
                 onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                 placeholder="Von"
               />
             </div>
 
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <span className="text-sm font-medium">
                    {selectedIds.length} ausgewählt
                  </span>
                  <Button 
                    size="sm"
                    onClick={() => setShowBulkDialog(true)}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Bulk-Zuordnung
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedIds([])}
                  >
                    Auswahl aufheben
                  </Button>
                </div>
              )}
           </CardContent>
         </Card>
 
         {/* Transactions Table */}
         <DataTable
           columns={columns}
           data={filteredTransactions}
           pagination
           pageSize={20}
         />
 
        {/* Match Dialog */}
        {selectedTransaction && (
          <TransactionMatchDialog
            transaction={selectedTransaction}
            tenants={tenants}
            onClose={() => setSelectedTransaction(null)}
          />
        )}

        {/* Bulk Match Dialog */}
        {showBulkDialog && (
          <BulkMatchDialog
            transactions={filteredTransactions.filter(t => selectedIds.includes(t.id))}
            onClose={() => setShowBulkDialog(false)}
            onDone={() => {
              setShowBulkDialog(false);
              setSelectedIds([]);
              queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}