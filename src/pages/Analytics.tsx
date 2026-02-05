 import { useState } from "react";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader } from "@/components/shared/PageHeader";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { useAuth } from "@/hooks/useAuth";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { LoadingState } from "@/components/shared";
 import {
   LineChart,
   Line,
   BarChart,
   Bar,
   PieChart,
   Pie,
   Cell,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   Legend,
 } from "recharts";
 import {
   TrendingUp,
   Home,
   CreditCard,
   Building2,
   Download,
   FileText,
   Users,
   Euro,
 } from "lucide-react";
 import { format, subMonths } from "date-fns";
 import { de } from "date-fns/locale";
 
 const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))", "#10b981", "#f59e0b"];
 
 // Mock data generators
 const generateIncomeData = () => {
   return Array.from({ length: 12 }, (_, i) => {
     const date = subMonths(new Date(), 11 - i);
     return {
       month: format(date, "MMM", { locale: de }),
       einnahmen: Math.floor(Math.random() * 5000) + 10000,
       vorjahr: Math.floor(Math.random() * 4500) + 9000,
     };
   });
 };
 
 const generatePaymentData = () => [
   { name: "Pünktlich", value: 75, color: "#10b981" },
   { name: "Verspätet", value: 20, color: "#f59e0b" },
   { name: "Ausgefallen", value: 5, color: "#ef4444" },
 ];
 
 const generateCostBreakdown = () => [
   { name: "Instandhaltung", value: 35 },
   { name: "Verwaltung", value: 25 },
   { name: "Versicherung", value: 20 },
   { name: "Zinsen", value: 15 },
   { name: "Sonstiges", value: 5 },
 ];
 
 export default function Analytics() {
   const { profile } = useAuth();
   const [period, setPeriod] = useState("12m");
 
   const { data: buildings = [] } = useQuery({
     queryKey: ["analytics-buildings", profile?.organization_id],
     queryFn: async () => {
       if (!profile?.organization_id) return [];
       const { data } = await supabase
         .from("buildings")
         .select("id, name")
         .eq("organization_id", profile.organization_id);
       return data || [];
     },
     enabled: !!profile?.organization_id,
   });
 
   const { data: units = [] } = useQuery({
     queryKey: ["analytics-units", profile?.organization_id],
     queryFn: async () => {
       if (!profile?.organization_id) return [];
       const { data } = await supabase
         .from("units")
         .select("id, status, building_id");
       return data || [];
     },
     enabled: !!profile?.organization_id,
   });
 
   const incomeData = generateIncomeData();
   const paymentData = generatePaymentData();
   const costData = generateCostBreakdown();
 
   // Calculate vacancy rate
   const vacancyRate = units.length > 0
     ? Math.round((units.filter((u: any) => u.status === "vacant").length / units.length) * 100)
     : 0;
 
   // Building performance data
   const buildingPerformance = buildings.map((b: any) => ({
     name: b.name.substring(0, 15),
     rendite: Math.floor(Math.random() * 5) + 3,
   }));
 
   const handleExport = (type: "pdf" | "excel") => {
     // TODO: Implement export
     console.log(`Exporting ${type}`);
   };
 
   return (
     <MainLayout title="Analytics">
       <div className="space-y-6">
         <PageHeader
           title="Advanced Analytics"
           subtitle="Detaillierte Auswertungen Ihrer Immobilien"
           actions={
             <div className="flex items-center gap-2">
               <Select value={period} onValueChange={setPeriod}>
                 <SelectTrigger className="w-32">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="3m">3 Monate</SelectItem>
                   <SelectItem value="6m">6 Monate</SelectItem>
                   <SelectItem value="12m">12 Monate</SelectItem>
                   <SelectItem value="24m">24 Monate</SelectItem>
                 </SelectContent>
               </Select>
               <Button variant="outline" onClick={() => handleExport("pdf")}>
                 <FileText className="h-4 w-4 mr-2" />
                 PDF
               </Button>
               <Button variant="outline" onClick={() => handleExport("excel")}>
                 <Download className="h-4 w-4 mr-2" />
                 Excel
               </Button>
             </div>
           }
         />
 
         {/* Row 1: Income & Vacancy */}
         <div className="grid gap-6 md:grid-cols-2">
           {/* Widget 1: Income Development */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <TrendingUp className="h-5 w-5" />
                 Einnahmen-Entwicklung
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={incomeData}>
                     <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                     <XAxis dataKey="month" className="text-xs" />
                     <YAxis className="text-xs" />
                     <Tooltip
                       formatter={(value: number) => `${value.toLocaleString("de-DE")} €`}
                     />
                     <Legend />
                     <Line
                       type="monotone"
                       dataKey="einnahmen"
                       name="Dieses Jahr"
                       stroke="hsl(var(--primary))"
                       strokeWidth={2}
                     />
                     <Line
                       type="monotone"
                       dataKey="vorjahr"
                       name="Vorjahr"
                       stroke="hsl(var(--muted-foreground))"
                       strokeDasharray="5 5"
                     />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
             </CardContent>
           </Card>
 
           {/* Widget 2: Vacancy Rate */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Home className="h-5 w-5" />
                 Leerstandsquote
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex items-center justify-center h-64">
                 <div className="text-center">
                   <div className="relative inline-flex">
                     <svg className="w-40 h-40">
                       <circle
                         cx="80"
                         cy="80"
                         r="70"
                         fill="none"
                         stroke="hsl(var(--muted))"
                         strokeWidth="12"
                       />
                       <circle
                         cx="80"
                         cy="80"
                         r="70"
                         fill="none"
                         stroke={vacancyRate > 10 ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                         strokeWidth="12"
                         strokeDasharray={`${vacancyRate * 4.4} 440`}
                         strokeLinecap="round"
                         transform="rotate(-90 80 80)"
                       />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-4xl font-bold">{vacancyRate}%</span>
                     </div>
                   </div>
                   <p className="text-sm text-muted-foreground mt-2">
                     {units.filter((u: any) => u.status === "vacant").length} von {units.length} Einheiten leer
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Row 2: Payment & Building Performance */}
         <div className="grid gap-6 md:grid-cols-2">
           {/* Widget 3: Payment Behavior */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <CreditCard className="h-5 w-5" />
                 Zahlungsmoral
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={paymentData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={90}
                       paddingAngle={5}
                       dataKey="value"
                       label={({ name, value }) => `${name}: ${value}%`}
                     >
                       {paymentData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip formatter={(value: number) => `${value}%`} />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             </CardContent>
           </Card>
 
           {/* Widget 4: Building Performance */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Building2 className="h-5 w-5" />
                 Rendite pro Objekt
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="h-64">
                 {buildingPerformance.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={buildingPerformance} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                       <XAxis type="number" unit="%" className="text-xs" />
                       <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                       <Tooltip formatter={(value: number) => `${value}%`} />
                       <Bar dataKey="rendite" fill="hsl(var(--primary))" radius={4} />
                     </BarChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="h-full flex items-center justify-center text-muted-foreground">
                     Keine Gebäude vorhanden
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Row 3: Costs & Top Tenants */}
         <div className="grid gap-6 md:grid-cols-2">
           {/* Widget 5: Cost Breakdown */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Euro className="h-5 w-5" />
                 Kosten-Breakdown
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={costData}
                       cx="50%"
                       cy="50%"
                       outerRadius={90}
                       dataKey="value"
                       label={({ name, value }) => `${name}: ${value}%`}
                     >
                       {costData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip formatter={(value: number) => `${value}%`} />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             </CardContent>
           </Card>
 
           {/* Widget 6: Top Tenants */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Users className="h-5 w-5" />
                 Top-Mieter
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 <div>
                   <h4 className="text-sm font-medium text-muted-foreground mb-2">
                     Längste Mietdauer
                   </h4>
                   <div className="space-y-2">
                     {[
                       { name: "Familie Müller", years: 8 },
                       { name: "Max Schmidt", years: 5 },
                       { name: "Anna Weber", years: 4 },
                     ].map((tenant, i) => (
                       <div
                         key={i}
                         className="flex items-center justify-between p-2 bg-muted/50 rounded"
                       >
                         <span className="text-sm">{tenant.name}</span>
                         <span className="text-sm font-medium">{tenant.years} Jahre</span>
                       </div>
                     ))}
                   </div>
                 </div>
                 <div>
                   <h4 className="text-sm font-medium text-muted-foreground mb-2">
                     Pünktlichste Zahler
                   </h4>
                   <div className="space-y-2">
                     {[
                       { name: "Peter Fischer", rate: 100 },
                       { name: "Maria Bauer", rate: 98 },
                       { name: "Thomas Klein", rate: 96 },
                     ].map((tenant, i) => (
                       <div
                         key={i}
                         className="flex items-center justify-between p-2 bg-muted/50 rounded"
                       >
                         <span className="text-sm">{tenant.name}</span>
                         <span className="text-sm font-medium text-green-600">
                           {tenant.rate}%
                         </span>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
       </div>
     </MainLayout>
   );
 }