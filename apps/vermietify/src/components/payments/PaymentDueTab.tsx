 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Badge } from "@/components/ui/badge";
 import { DataTable } from "@/components/shared/DataTable";
 import { usePayments } from "@/hooks/usePayments";
 import { formatCurrency } from "@/lib/utils";
 import { Check, Calendar } from "lucide-react";
 import { ColumnDef } from "@tanstack/react-table";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { RecordPaymentDialog } from "./RecordPaymentDialog";
 import { LoadingState } from "@/components/shared";
 
 export function PaymentDueTab() {
   const { useDuePayments, recordPayment } = usePayments();
   const { data: duePayments, isLoading } = useDuePayments();
   const [selectedIds, setSelectedIds] = useState<string[]>([]);
   const [recordDialogOpen, setRecordDialogOpen] = useState(false);
   const [selectedLease, setSelectedLease] = useState<any>(null);
 
   const handleSelect = (id: string, checked: boolean) => {
     if (checked) {
       setSelectedIds((prev) => [...prev, id]);
     } else {
       setSelectedIds((prev) => prev.filter((i) => i !== id));
     }
   };
 
   const handleSelectAll = (checked: boolean) => {
     if (checked) {
       setSelectedIds(duePayments?.map((p: any) => p.id) || []);
     } else {
       setSelectedIds([]);
     }
   };
 
   const handleMarkAsPaid = (lease: any) => {
     setSelectedLease(lease);
     setRecordDialogOpen(true);
   };
 
   const handleBulkMarkAsPaid = async () => {
     for (const id of selectedIds) {
       const lease = duePayments?.find((p: any) => p.id === id);
       if (lease) {
         await recordPayment.mutateAsync({
           leaseId: lease.id,
           amount: lease.totalDue,
           transactionDate: new Date().toISOString().split("T")[0],
           paymentMethod: "transfer",
           transactionType: "rent",
         });
       }
     }
     setSelectedIds([]);
   };
 
   const columns: ColumnDef<any>[] = [
     {
       id: "select",
       header: ({ table }) => (
         <Checkbox
           checked={selectedIds.length === duePayments?.length && duePayments?.length > 0}
           onCheckedChange={(checked) => handleSelectAll(!!checked)}
         />
       ),
       cell: ({ row }) => (
         <Checkbox
           checked={selectedIds.includes(row.original.id)}
           onCheckedChange={(checked) => handleSelect(row.original.id, !!checked)}
         />
       ),
       enableSorting: false,
     },
     {
       accessorKey: "tenant",
       header: "Mieter",
       cell: ({ row }) => (
         <div>
           <p className="font-medium">
             {row.original.tenants?.first_name} {row.original.tenants?.last_name}
           </p>
           <p className="text-sm text-muted-foreground">{row.original.tenants?.email}</p>
         </div>
       ),
     },
     {
       accessorKey: "unit",
       header: "Einheit",
       cell: ({ row }) => (
         <div>
           <p className="font-medium">{row.original.units?.unit_number}</p>
           <p className="text-sm text-muted-foreground">
             {row.original.units?.buildings?.name}
           </p>
         </div>
       ),
     },
     {
       accessorKey: "totalDue",
       header: "Betrag",
       cell: ({ row }) => (
         <span className="font-semibold">
           {formatCurrency(row.original.totalDue / 100)}
         </span>
       ),
     },
     {
       accessorKey: "dueDate",
       header: "Fällig am",
       cell: ({ row }) => (
         <div className="flex items-center gap-2">
           <Calendar className="h-4 w-4 text-muted-foreground" />
           {format(row.original.dueDate, "dd.MM.yyyy", { locale: de })}
         </div>
       ),
     },
     {
       accessorKey: "daysRemaining",
       header: "Tage übrig",
       cell: ({ row }) => (
         <Badge variant={row.original.daysRemaining <= 3 ? "destructive" : "secondary"}>
           {row.original.daysRemaining} Tage
         </Badge>
       ),
     },
     {
       id: "actions",
       header: "Aktionen",
       cell: ({ row }) => (
         <Button
           size="sm"
           variant="outline"
           onClick={() => handleMarkAsPaid(row.original)}
         >
           <Check className="h-4 w-4 mr-1" />
           Als bezahlt
         </Button>
       ),
     },
   ];
 
   if (isLoading) {
     return <LoadingState rows={5} />;
   }
 
   return (
     <div className="space-y-4">
       {selectedIds.length > 0 && (
         <Card>
           <CardContent className="py-3 flex items-center justify-between">
             <span className="text-sm">
               {selectedIds.length} Zahlung(en) ausgewählt
             </span>
             <Button onClick={handleBulkMarkAsPaid} disabled={recordPayment.isPending}>
               <Check className="h-4 w-4 mr-2" />
               Alle als bezahlt markieren
             </Button>
           </CardContent>
         </Card>
       )}
 
       <Card>
         <CardHeader>
           <CardTitle>Fällige Zahlungen diesen Monat</CardTitle>
         </CardHeader>
         <CardContent>
           {!duePayments || duePayments.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">
               Keine fälligen Zahlungen in diesem Monat
             </p>
           ) : (
             <DataTable columns={columns} data={duePayments} />
           )}
         </CardContent>
       </Card>
 
       <RecordPaymentDialog
         open={recordDialogOpen}
         onOpenChange={setRecordDialogOpen}
         preselectedLease={selectedLease}
       />
     </div>
   );
 }