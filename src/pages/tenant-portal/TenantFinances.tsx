 import { TenantLayout } from "@/components/tenant-portal/TenantLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { useTenantPortal } from "@/hooks/useTenantPortal";
 import { LoadingState } from "@/components/shared";
 import {
   Euro,
   Home,
   Thermometer,
   Calendar,
   CheckCircle,
   AlertCircle,
   Clock,
   Shield,
 } from "lucide-react";
 import { format, addMonths } from "date-fns";
 import { de } from "date-fns/locale";
 
 export default function TenantFinances() {
   const { useTenantAccess } = useTenantPortal();
   const { data: access, isLoading } = useTenantAccess();
 
   if (isLoading) {
     return (
       <TenantLayout>
         <LoadingState />
       </TenantLayout>
     );
   }
 
   const lease = access?.lease as any;
   const unit = access?.unit as any;
 
   const rentAmount = lease?.rent_amount ? Number(lease.rent_amount) / 100 : 0;
   const utilityAdvance = lease?.utility_advance ? Number(lease.utility_advance) / 100 : 0;
   const totalMonthly = rentAmount + utilityAdvance;
   const depositAmount = lease?.deposit_amount ? Number(lease.deposit_amount) / 100 : 0;
   const paymentDay = lease?.payment_day || 1;
 
   // Generate last 12 months payment history (mock data for now)
   const today = new Date();
   const paymentHistory = Array.from({ length: 12 }, (_, i) => {
     const date = addMonths(today, -i);
     return {
       id: i,
       month: format(date, "MMMM yyyy", { locale: de }),
       amount: totalMonthly,
       status: i === 0 ? "pending" : "paid",
       paidDate: i > 0 ? format(new Date(date.getFullYear(), date.getMonth(), paymentDay + Math.floor(Math.random() * 5)), "dd.MM.yyyy") : null,
     };
   });
 
   return (
     <TenantLayout>
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl font-bold">Finanzen</h1>
           <p className="text-muted-foreground">
             Übersicht über Ihre Miete und Zahlungen.
           </p>
         </div>
 
         {/* Current Rent Card */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Euro className="h-5 w-5" />
               Aktuelle Miete
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid gap-4 md:grid-cols-4">
               <div className="space-y-1">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Home className="h-4 w-4" />
                   Kaltmiete
                 </div>
                 <p className="text-2xl font-bold">{rentAmount.toFixed(2)} €</p>
               </div>
 
               <div className="space-y-1">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Thermometer className="h-4 w-4" />
                   Nebenkosten
                 </div>
                 <p className="text-2xl font-bold">{utilityAdvance.toFixed(2)} €</p>
               </div>
 
               <div className="space-y-1">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Euro className="h-4 w-4" />
                   Gesamt
                 </div>
                 <p className="text-2xl font-bold text-primary">{totalMonthly.toFixed(2)} €</p>
               </div>
 
               <div className="space-y-1">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Calendar className="h-4 w-4" />
                   Fällig am
                 </div>
                 <p className="text-2xl font-bold">{paymentDay}. des Monats</p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Deposit Status */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Shield className="h-5 w-5" />
               Kaution
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-2xl font-bold">{depositAmount.toFixed(2)} €</p>
                 <p className="text-sm text-muted-foreground">
                   {lease?.deposit_paid ? "Vollständig gezahlt" : "Ausstehend"}
                 </p>
               </div>
               <Badge
                 variant="outline"
                 className={
                   lease?.deposit_paid
                     ? "bg-green-100 text-green-800"
                     : "bg-yellow-100 text-yellow-800"
                 }
               >
                 {lease?.deposit_paid ? (
                   <>
                     <CheckCircle className="h-3 w-3 mr-1" />
                     Gezahlt
                   </>
                 ) : (
                   <>
                     <AlertCircle className="h-3 w-3 mr-1" />
                     Ausstehend
                   </>
                 )}
               </Badge>
             </div>
           </CardContent>
         </Card>
 
         {/* Payment History */}
         <Card>
           <CardHeader>
             <CardTitle>Zahlungshistorie (letzte 12 Monate)</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-2">
               {paymentHistory.map((payment) => (
                 <div
                   key={payment.id}
                   className={`flex items-center justify-between p-3 rounded-lg border ${
                     payment.status === "pending" ? "border-yellow-200 bg-yellow-50" : ""
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <div
                       className={`h-8 w-8 rounded-full flex items-center justify-center ${
                         payment.status === "paid"
                           ? "bg-green-100"
                           : payment.status === "pending"
                           ? "bg-yellow-100"
                           : "bg-red-100"
                       }`}
                     >
                       {payment.status === "paid" ? (
                         <CheckCircle className="h-4 w-4 text-green-600" />
                       ) : payment.status === "pending" ? (
                         <Clock className="h-4 w-4 text-yellow-600" />
                       ) : (
                         <AlertCircle className="h-4 w-4 text-red-600" />
                       )}
                     </div>
                     <div>
                       <p className="font-medium capitalize">{payment.month}</p>
                       {payment.paidDate && (
                         <p className="text-xs text-muted-foreground">
                           Gezahlt am {payment.paidDate}
                         </p>
                       )}
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className="font-mono font-medium">
                       {payment.amount.toFixed(2)} €
                     </span>
                     <Badge
                       variant="outline"
                       className={
                         payment.status === "paid"
                           ? "bg-green-100 text-green-800"
                           : payment.status === "pending"
                           ? "bg-yellow-100 text-yellow-800"
                           : "bg-red-100 text-red-800"
                       }
                     >
                       {payment.status === "paid"
                         ? "Gezahlt"
                         : payment.status === "pending"
                         ? "Offen"
                         : "Überfällig"}
                     </Badge>
                   </div>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
       </div>
     </TenantLayout>
   );
 }