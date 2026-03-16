 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { DataTable } from "@/components/shared/DataTable";
 import { usePayments } from "@/hooks/usePayments";
 import { formatCurrency, cn } from "@/lib/utils";
 import { Check, Mail, HandCoins, Calendar } from "lucide-react";
 import { ColumnDef } from "@tanstack/react-table";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { RecordPaymentDialog } from "./RecordPaymentDialog";
 import { PartialPaymentDialog } from "./PartialPaymentDialog";
 import { LoadingState } from "@/components/shared";
 import { useToast } from "@/hooks/use-toast";
 
 export function PaymentOverdueTab() {
   const { useOverduePayments } = usePayments();
   const { data: overduePayments, isLoading } = useOverduePayments();
   const { toast } = useToast();
   const [recordDialogOpen, setRecordDialogOpen] = useState(false);
   const [partialDialogOpen, setPartialDialogOpen] = useState(false);
   const [selectedLease, setSelectedLease] = useState<any>(null);
 
   const handleMarkAsPaid = (lease: any) => {
     setSelectedLease(lease);
     setRecordDialogOpen(true);
   };
 
   const handlePartialPayment = (lease: any) => {
     setSelectedLease(lease);
     setPartialDialogOpen(true);
   };
 
   const handleSendReminder = (lease: any) => {
     toast({
       title: "Mahnung wird gesendet",
       description: `Eine Zahlungserinnerung wird an ${lease.tenants?.email} gesendet.`,
     });
   };
 
   const getOverdueClass = (days: number) => {
     if (days > 14) return "bg-destructive/20 border-destructive/40";
     if (days > 7) return "bg-destructive/10 border-destructive/30";
     return "bg-destructive/5 border-destructive/20";
   };
 
   const columns: ColumnDef<any>[] = [
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
         <span className="font-semibold text-destructive">
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
       accessorKey: "daysOverdue",
       header: "Überfällig",
       cell: ({ row }) => (
         <Badge variant="destructive">
           {row.original.daysOverdue} Tage
         </Badge>
       ),
     },
     {
       id: "actions",
       header: "Aktionen",
       cell: ({ row }) => (
         <div className="flex items-center gap-1">
           <Button
             size="sm"
             variant="outline"
             onClick={() => handleMarkAsPaid(row.original)}
           >
             <Check className="h-4 w-4" />
           </Button>
           <Button
             size="sm"
             variant="outline"
             onClick={() => handleSendReminder(row.original)}
           >
             <Mail className="h-4 w-4" />
           </Button>
           <Button
             size="sm"
             variant="outline"
             onClick={() => handlePartialPayment(row.original)}
           >
             <HandCoins className="h-4 w-4" />
           </Button>
         </div>
       ),
     },
   ];
 
   if (isLoading) {
     return <LoadingState rows={5} />;
   }
 
   return (
     <div className="space-y-4">
       <Card>
         <CardHeader>
           <CardTitle className="text-destructive">Überfällige Zahlungen</CardTitle>
         </CardHeader>
         <CardContent>
           {!overduePayments || overduePayments.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">
               Keine überfälligen Zahlungen 🎉
             </p>
           ) : (
             <div className="space-y-2">
               {overduePayments.map((payment: any) => (
                 <div
                   key={payment.id}
                   className={cn(
                     "p-4 rounded-lg border transition-colors",
                     getOverdueClass(payment.daysOverdue)
                   )}
                 >
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <div>
                         <p className="font-medium">
                           {payment.tenants?.first_name} {payment.tenants?.last_name}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           {payment.units?.unit_number} • {payment.units?.buildings?.name}
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-4">
                       <div className="text-right">
                         <p className="font-semibold text-destructive">
                           {formatCurrency(payment.totalDue / 100)}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           {payment.daysOverdue} Tage überfällig
                         </p>
                       </div>
                       <div className="flex items-center gap-1">
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => handleMarkAsPaid(payment)}
                           title="Als bezahlt markieren"
                         >
                           <Check className="h-4 w-4" />
                         </Button>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => handleSendReminder(payment)}
                           title="Mahnung senden"
                         >
                           <Mail className="h-4 w-4" />
                         </Button>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => handlePartialPayment(payment)}
                           title="Teilzahlung erfassen"
                         >
                           <HandCoins className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
 
       <RecordPaymentDialog
         open={recordDialogOpen}
         onOpenChange={setRecordDialogOpen}
         preselectedLease={selectedLease}
       />
 
       <PartialPaymentDialog
         open={partialDialogOpen}
         onOpenChange={setPartialDialogOpen}
         lease={selectedLease}
       />
     </div>
   );
 }