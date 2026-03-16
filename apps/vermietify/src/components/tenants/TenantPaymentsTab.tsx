 import { useState, useMemo } from "react";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Table,
   TableBody,
   TableCell,
   TableFooter,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { EmptyState } from "@/components/shared";
 import { CreditCard, Filter, Plus, Calendar } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { formatCurrency } from "@/lib/utils";
 
 interface TenantPaymentsTabProps {
   tenantId: string;
   leaseId?: string;
 }
 
 type PaymentStatus = "paid" | "open" | "overdue" | "partial";
 
 const STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
   paid: { label: "Bezahlt", className: "bg-green-500 text-white" },
   open: { label: "Offen", className: "bg-yellow-500 text-white" },
   overdue: { label: "Überfällig", className: "bg-destructive text-destructive-foreground" },
   partial: { label: "Teilzahlung", className: "bg-orange-500 text-white" },
 };
 
 export function TenantPaymentsTab({ tenantId, leaseId }: TenantPaymentsTabProps) {
   const currentYear = new Date().getFullYear();
   const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
   const [selectedStatus, setSelectedStatus] = useState<string>("all");
 
   const { data: transactions, isLoading } = useQuery({
     queryKey: ["tenant-payments", tenantId, leaseId, selectedYear],
     queryFn: async () => {
       if (!leaseId) return [];
 
       const { data, error } = await supabase
         .from("transactions")
         .select("*")
         .eq("lease_id", leaseId)
         .in("transaction_type", ["rent", "utility"])
         .gte("transaction_date", `${selectedYear}-01-01`)
         .lte("transaction_date", `${selectedYear}-12-31`)
         .order("transaction_date", { ascending: false });
 
       if (error) throw error;
       return data || [];
     },
     enabled: !!leaseId,
   });
 
   const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
 
   const monthlyPayments = useMemo(() => {
     if (!transactions) return [];
 
     const months: Record<string, { expected: number; paid: number; date?: string }> = {};
     
     transactions.forEach((t) => {
       const month = t.transaction_date.substring(0, 7);
       if (!months[month]) {
         months[month] = { expected: 0, paid: 0 };
       }
       if (t.is_income) {
         months[month].paid += t.amount;
         months[month].date = t.transaction_date;
       }
     });
 
     return Object.entries(months)
       .map(([month, data]) => {
         let status: PaymentStatus = "open";
         const today = new Date();
         const monthDate = new Date(month + "-01");
         
         if (data.paid >= data.expected && data.expected > 0) {
           status = "paid";
         } else if (data.paid > 0 && data.paid < data.expected) {
           status = "partial";
         } else if (monthDate < today && data.paid === 0) {
           status = "overdue";
         }
 
         return {
           month,
           monthLabel: format(new Date(month + "-01"), "MMMM yyyy", { locale: de }),
           expected: data.expected,
           paid: data.paid,
           status,
           paymentDate: data.date,
         };
       })
       .filter((p) => selectedStatus === "all" || p.status === selectedStatus)
       .sort((a, b) => b.month.localeCompare(a.month));
   }, [transactions, selectedStatus]);
 
   const totals = useMemo(() => {
     return monthlyPayments.reduce(
       (acc, p) => ({
         expected: acc.expected + p.expected,
         paid: acc.paid + p.paid,
       }),
       { expected: 0, paid: 0 }
     );
   }, [monthlyPayments]);
 
   if (!leaseId) {
     return (
       <Card>
         <CardContent className="py-8">
           <EmptyState
             icon={CreditCard}
             title="Kein aktiver Vertrag"
             description="Zahlungen können nur für aktive Mietverträge angezeigt werden."
           />
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-4">
       <Card>
         <CardContent className="py-4">
           <div className="flex flex-wrap gap-4 items-center">
             <div className="flex items-center gap-2">
               <Filter className="h-4 w-4 text-muted-foreground" />
               <span className="text-sm font-medium">Filter:</span>
             </div>
 
             <Select value={selectedYear} onValueChange={setSelectedYear}>
               <SelectTrigger className="w-[120px]">
                 <SelectValue placeholder="Jahr" />
               </SelectTrigger>
               <SelectContent>
                 {years.map((year) => (
                   <SelectItem key={year} value={year.toString()}>
                     {year}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
 
             <Select value={selectedStatus} onValueChange={setSelectedStatus}>
               <SelectTrigger className="w-[150px]">
                 <SelectValue placeholder="Status" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Alle Status</SelectItem>
                 <SelectItem value="paid">Bezahlt</SelectItem>
                 <SelectItem value="open">Offen</SelectItem>
                 <SelectItem value="overdue">Überfällig</SelectItem>
               </SelectContent>
             </Select>
           </div>
         </CardContent>
       </Card>
 
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <CreditCard className="h-5 w-5" />
             Zahlungen {selectedYear}
           </CardTitle>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="h-12 bg-muted animate-pulse rounded" />
               ))}
             </div>
           ) : monthlyPayments.length === 0 ? (
             <EmptyState
               icon={CreditCard}
               title="Keine Zahlungen"
               description={`Für ${selectedYear} wurden keine Zahlungen gefunden.`}
             />
           ) : (
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Monat</TableHead>
                   <TableHead className="text-right">Gezahlt</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Zahlungsdatum</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {monthlyPayments.map((payment) => (
                   <TableRow key={payment.month}>
                     <TableCell className="font-medium">
                       {payment.monthLabel}
                     </TableCell>
                     <TableCell className="text-right">
                       {formatCurrency(payment.paid / 100)}
                     </TableCell>
                     <TableCell>
                       <Badge className={STATUS_CONFIG[payment.status].className}>
                         {STATUS_CONFIG[payment.status].label}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       {payment.paymentDate ? (
                         <span className="flex items-center gap-1 text-sm">
                           <Calendar className="h-3 w-3" />
                           {format(new Date(payment.paymentDate), "dd.MM.yyyy", { locale: de })}
                         </span>
                       ) : (
                         "–"
                       )}
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
               <TableFooter>
                 <TableRow>
                   <TableCell className="font-bold">Summe</TableCell>
                   <TableCell className="text-right font-bold">
                     {formatCurrency(totals.paid / 100)}
                   </TableCell>
                   <TableCell colSpan={2} />
                 </TableRow>
               </TableFooter>
             </Table>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }