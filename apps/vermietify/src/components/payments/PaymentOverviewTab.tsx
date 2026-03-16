 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { StatCard } from "@/components/shared";
 import { usePayments } from "@/hooks/usePayments";
 import { formatCurrency } from "@/lib/utils";
 import { Euro, Clock, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
 import { Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Skeleton } from "@/components/ui/skeleton";
 import {
   AreaChart,
   Area,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
 } from "recharts";
 
 export function PaymentOverviewTab() {
   const { usePaymentStats, useMonthlyIncome, useOverduePayments } = usePayments();
   const { data: stats, isLoading: statsLoading } = usePaymentStats();
   const { data: monthlyData, isLoading: chartLoading } = useMonthlyIncome();
   const { data: overduePayments, isLoading: overdueLoading } = useOverduePayments();
 
   const topOverdue = overduePayments?.slice(0, 5) || [];
 
   return (
     <div className="space-y-6">
       {/* Stats */}
       <div className="grid gap-4 md:grid-cols-4">
         {statsLoading ? (
           <>
             {[1, 2, 3, 4].map((i) => (
               <Card key={i}>
                 <CardContent className="p-6">
                   <Skeleton className="h-20" />
                 </CardContent>
               </Card>
             ))}
           </>
         ) : (
           <>
             <StatCard
               title="Einnahmen diesen Monat"
               value={formatCurrency((stats?.incomeThisMonth || 0) / 100)}
               icon={Euro}
             />
             <StatCard
               title="Ausstehend"
               value={formatCurrency((stats?.pending || 0) / 100)}
               icon={Clock}
             />
             <StatCard
               title="Überfällig"
               value={topOverdue.length.toString()}
               icon={AlertTriangle}
               description="Zahlungen nicht erhalten"
             />
             <StatCard
               title="Zahlungsquote"
               value={`${stats?.paymentRate || 0}%`}
               icon={TrendingUp}
               trend={
                 stats?.paymentRate
                   ? { value: stats.paymentRate, isPositive: stats.paymentRate >= 90 }
                   : undefined
               }
             />
           </>
         )}
       </div>
 
       {/* Chart */}
       <Card>
         <CardHeader>
           <CardTitle>Einnahmen (letzte 12 Monate)</CardTitle>
         </CardHeader>
         <CardContent>
           {chartLoading ? (
             <Skeleton className="h-[300px]" />
           ) : (
             <ResponsiveContainer width="100%" height={300}>
               <AreaChart data={monthlyData}>
                 <defs>
                   <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                     <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                 <XAxis dataKey="month" className="text-xs" />
                 <YAxis
                   tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                   className="text-xs"
                 />
                 <Tooltip
                   formatter={(value: number) => [formatCurrency(value), "Einnahmen"]}
                   contentStyle={{
                     backgroundColor: "hsl(var(--background))",
                     border: "1px solid hsl(var(--border))",
                     borderRadius: "8px",
                   }}
                 />
                 <Area
                   type="monotone"
                   dataKey="income"
                   stroke="hsl(var(--primary))"
                   fill="url(#incomeGradient)"
                   strokeWidth={2}
                 />
               </AreaChart>
             </ResponsiveContainer>
           )}
         </CardContent>
       </Card>
 
       {/* Top Overdue */}
       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle>Überfällige Zahlungen</CardTitle>
           <Button variant="ghost" size="sm" asChild>
             <Link to="#" className="flex items-center gap-1">
               Alle anzeigen <ArrowRight className="h-4 w-4" />
             </Link>
           </Button>
         </CardHeader>
         <CardContent>
           {overdueLoading ? (
             <div className="space-y-2">
               {[1, 2, 3].map((i) => (
                 <Skeleton key={i} className="h-16" />
               ))}
             </div>
           ) : topOverdue.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">
               Keine überfälligen Zahlungen 🎉
             </p>
           ) : (
             <div className="space-y-3">
               {topOverdue.map((payment: any) => (
                 <div
                   key={payment.id}
                   className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                 >
                   <div>
                     <p className="font-medium">
                       {payment.tenants?.first_name} {payment.tenants?.last_name}
                     </p>
                     <p className="text-sm text-muted-foreground">
                       {payment.units?.unit_number} • {payment.units?.buildings?.name}
                     </p>
                   </div>
                   <div className="text-right">
                     <p className="font-semibold text-destructive">
                       {formatCurrency(payment.totalDue / 100)}
                     </p>
                     <p className="text-sm text-muted-foreground">
                       {payment.daysOverdue} Tage überfällig
                     </p>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }