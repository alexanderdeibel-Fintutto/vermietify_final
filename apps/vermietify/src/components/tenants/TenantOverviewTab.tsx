 import { Link } from "react-router-dom";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { StatCard, EmptyState } from "@/components/shared";
 import {
   Building2,
   MapPin,
   Calendar,
   Euro,
   Home,
   AlertCircle,
   TrendingUp,
 } from "lucide-react";
 import { format, differenceInMonths } from "date-fns";
 import { de } from "date-fns/locale";
 import { formatCurrency } from "@/lib/utils";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 interface TenantOverviewTabProps {
   tenant: any;
 }
 
 export function TenantOverviewTab({ tenant }: TenantOverviewTabProps) {
   const activeLease = tenant.activeLease;
   const unit = activeLease?.units;
   const building = unit?.buildings;
 
   const contractDuration = activeLease
     ? differenceInMonths(new Date(), new Date(activeLease.start_date))
     : 0;
 
   const { data: paymentStats } = useQuery({
     queryKey: ["tenant-payments-stats", tenant.id],
     queryFn: async () => {
       if (!activeLease?.id) return { totalPaid: 0, openAmount: 0 };
 
       const { data: transactions } = await supabase
         .from("transactions")
         .select("amount, is_income")
         .eq("lease_id", activeLease.id)
         .eq("transaction_type", "rent");
 
       const totalPaid = transactions?.reduce((sum, t) => 
         t.is_income ? sum + t.amount : sum, 0) || 0;
 
       const expectedRent = contractDuration * (activeLease.rent_amount + (activeLease.utility_advance || 0));
       const openAmount = Math.max(0, expectedRent - totalPaid);
 
       return { totalPaid, openAmount };
     },
     enabled: !!activeLease?.id,
   });
 
   return (
     <div className="space-y-6">
       {activeLease && unit ? (
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Home className="h-5 w-5" />
               Aktuelle Wohnung
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid gap-6 md:grid-cols-2">
               <div className="space-y-4">
                 <div>
                   <p className="text-sm text-muted-foreground">Gebäude</p>
                   <Link
                     to={`/gebaeude/${building?.id}`}
                     className="text-lg font-semibold hover:text-primary"
                   >
                     {building?.name}
                   </Link>
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Einheit</p>
                   <Link
                     to={`/einheiten/${unit.id}`}
                     className="text-lg font-semibold hover:text-primary"
                   >
                     {unit.unit_number}
                   </Link>
                 </div>
                 <div className="flex items-start gap-2">
                   <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                   <span>
                     {building?.address}, {building?.postal_code} {building?.city}
                   </span>
                 </div>
               </div>
 
               <div className="space-y-4">
                 <div className="flex items-center gap-2">
                   <Calendar className="h-4 w-4 text-muted-foreground" />
                   <div>
                     <p className="text-sm text-muted-foreground">Mietbeginn</p>
                     <p className="font-medium">
                       {format(new Date(activeLease.start_date), "dd.MM.yyyy", { locale: de })}
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <Euro className="h-4 w-4 text-muted-foreground" />
                   <div>
                     <p className="text-sm text-muted-foreground">Monatliche Miete</p>
                     <p className="font-medium">
                       {formatCurrency((activeLease.rent_amount + (activeLease.utility_advance || 0)) / 100)}
                     </p>
                   </div>
                 </div>
               </div>
             </div>
 
             <div className="mt-4 pt-4 border-t flex gap-2">
               <Button asChild variant="outline" size="sm">
                 <Link to={`/einheiten/${unit.id}`}>Einheit ansehen</Link>
               </Button>
             </div>
           </CardContent>
         </Card>
       ) : (
         <Card>
           <CardContent className="py-8">
             <EmptyState
               icon={Home}
               title="Keine aktive Wohnung"
               description="Dieser Mieter hat derzeit keinen aktiven Mietvertrag."
             />
           </CardContent>
         </Card>
       )}
 
       <div className="grid gap-4 md:grid-cols-3">
         <StatCard
           title="Miete gesamt gezahlt"
           value={formatCurrency((paymentStats?.totalPaid || 0) / 100)}
           icon={Euro}
         />
         <StatCard
           title="Offene Zahlungen"
           value={formatCurrency((paymentStats?.openAmount || 0) / 100)}
           icon={AlertCircle}
         />
         <StatCard
           title="Vertragslaufzeit"
           value={`${contractDuration} Monate`}
           icon={TrendingUp}
         />
       </div>
     </div>
   );
 }