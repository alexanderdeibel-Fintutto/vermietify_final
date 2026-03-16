 import { useState, useMemo } from "react";
 import { useParams, useNavigate } from "react-router-dom";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import { Separator } from "@/components/ui/separator";
 import { DataTable } from "@/components/shared/DataTable";
 import { LoadingState, EmptyState } from "@/components/shared";
 import { useOperatingCosts, BillingStatus } from "@/hooks/useOperatingCosts";
 import { formatCurrency, cn } from "@/lib/utils";
 import {
   Pencil,
   FileText,
   Send,
   Building,
   Calendar,
   Users,
   Home,
   Euro,
   FileUp,
   Download,
   AlertCircle,
   CheckCircle,
   Clock,
 } from "lucide-react";
 import { ColumnDef } from "@tanstack/react-table";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import {
   PieChart,
   Pie,
   Cell,
   ResponsiveContainer,
   Legend,
   Tooltip,
 } from "recharts";
 
 const STATUS_CONFIG: Record<BillingStatus, { label: string; icon: any; color: string }> = {
   draft: { label: "Entwurf", icon: Clock, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
   calculated: { label: "Berechnet", icon: CheckCircle, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
   sent: { label: "Versendet", icon: Send, color: "bg-primary/10 text-primary border-primary/20" },
   completed: { label: "Abgeschlossen", icon: CheckCircle, color: "bg-green-500/10 text-green-600 border-green-500/20" },
 };
 
 const CHART_COLORS = [
   "hsl(var(--primary))",
   "hsl(var(--chart-2))",
   "hsl(var(--chart-3))",
   "hsl(var(--chart-4))",
   "hsl(var(--chart-5))",
   "#8884d8",
   "#82ca9d",
   "#ffc658",
 ];
 
 // Mock data for demonstration
 const MOCK_COST_TYPES = [
   { id: "1", type: "Heizung", amount: 450000, distributionKey: "area", perUnit: 37500 },
   { id: "2", type: "Wasser/Abwasser", amount: 180000, distributionKey: "persons", perUnit: 15000 },
   { id: "3", type: "Müllabfuhr", amount: 96000, distributionKey: "units", perUnit: 8000 },
   { id: "4", type: "Hausmeister", amount: 144000, distributionKey: "area", perUnit: 12000 },
   { id: "5", type: "Gebäudeversicherung", amount: 72000, distributionKey: "area", perUnit: 6000 },
   { id: "6", type: "Grundsteuer", amount: 48000, distributionKey: "area", perUnit: 4000 },
   { id: "7", type: "Allgemeinstrom", amount: 36000, distributionKey: "units", perUnit: 3000 },
   { id: "8", type: "Gartenpflege", amount: 24000, distributionKey: "area", perUnit: 2000 },
 ];
 
 const MOCK_TENANT_RESULTS = [
   { id: "1", tenant: "Max Müller", unit: "Wohnung 1", area: 75, prepaid: 180000, costs: 165000, result: 15000 },
   { id: "2", tenant: "Anna Schmidt", unit: "Wohnung 2", area: 60, prepaid: 144000, costs: 132000, result: 12000 },
   { id: "3", tenant: "Peter Weber", unit: "Wohnung 3", area: 85, prepaid: 180000, costs: 187000, result: -7000 },
   { id: "4", tenant: "Lisa Braun", unit: "Wohnung 4", area: 50, prepaid: 120000, costs: 110000, result: 10000 },
   { id: "5", tenant: "Thomas Klein", unit: "Wohnung 5", area: 95, prepaid: 204000, costs: 209000, result: -5000 },
 ];
 
 const DISTRIBUTION_KEY_LABELS: Record<string, string> = {
   area: "nach Fläche (m²)",
   persons: "nach Personen",
   units: "nach Einheiten",
   consumption: "nach Verbrauch",
 };
 
 export default function OperatingCostDetail() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { useBillingsList } = useOperatingCosts();
   const { data: billings, isLoading } = useBillingsList();
 
   // Find the billing by id (format: buildingId-year)
   const billing = useMemo(() => {
     if (!billings || !id) return null;
     return billings.find((b) => b.id === id);
   }, [billings, id]);
 
   const totalCosts = MOCK_COST_TYPES.reduce((sum, c) => sum + c.amount, 0);
   const totalPrepaid = MOCK_TENANT_RESULTS.reduce((sum, t) => sum + t.prepaid, 0);
   const totalCredits = MOCK_TENANT_RESULTS.filter((t) => t.result > 0).reduce((sum, t) => sum + t.result, 0);
   const totalPaymentsDue = MOCK_TENANT_RESULTS.filter((t) => t.result < 0).reduce((sum, t) => sum + Math.abs(t.result), 0);
 
   const chartData = MOCK_COST_TYPES.map((c) => ({
     name: c.type,
     value: c.amount / 100,
   }));
 
   const costColumns: ColumnDef<any>[] = [
     {
       accessorKey: "type",
       header: "Kostenart",
       cell: ({ row }) => <span className="font-medium">{row.original.type}</span>,
     },
     {
       accessorKey: "amount",
       header: "Gesamtbetrag",
       cell: ({ row }) => formatCurrency(row.original.amount / 100),
     },
     {
       accessorKey: "distributionKey",
       header: "Verteilerschlüssel",
       cell: ({ row }) => (
         <Badge variant="outline">
           {DISTRIBUTION_KEY_LABELS[row.original.distributionKey] || row.original.distributionKey}
         </Badge>
       ),
     },
     {
       accessorKey: "perUnit",
       header: "Ø pro Einheit",
       cell: ({ row }) => (
         <span className="text-muted-foreground">
           {formatCurrency(row.original.perUnit / 100)}
         </span>
       ),
     },
   ];
 
   const tenantColumns: ColumnDef<any>[] = [
     {
       accessorKey: "tenant",
       header: "Mieter",
       cell: ({ row }) => <span className="font-medium">{row.original.tenant}</span>,
     },
     {
       accessorKey: "unit",
       header: "Einheit",
       cell: ({ row }) => (
         <div>
           <span>{row.original.unit}</span>
           <span className="text-sm text-muted-foreground ml-2">({row.original.area} m²)</span>
         </div>
       ),
     },
     {
       accessorKey: "prepaid",
       header: "Vorauszahlungen",
       cell: ({ row }) => formatCurrency(row.original.prepaid / 100),
     },
     {
       accessorKey: "costs",
       header: "Anteil Kosten",
       cell: ({ row }) => formatCurrency(row.original.costs / 100),
     },
     {
       accessorKey: "result",
       header: "Ergebnis",
       cell: ({ row }) => {
         const result = row.original.result;
         const isCredit = result > 0;
         return (
           <span
             className={cn(
               "font-semibold",
              isCredit ? "text-primary" : "text-destructive"
             )}
           >
             {isCredit ? "+" : ""}
             {formatCurrency(result / 100)}
             <span className="text-xs ml-1">
               {isCredit ? "(Guthaben)" : "(Nachzahlung)"}
             </span>
           </span>
         );
       },
     },
   ];
 
   if (isLoading) {
     return (
       <MainLayout title="Betriebskostenabrechnung" breadcrumbs={[{ label: "Betriebskosten", href: "/betriebskosten" }, { label: "Details" }]}>
         <LoadingState rows={8} />
       </MainLayout>
     );
   }
 
   // For now, show mock data even if billing not found
   const status: BillingStatus = billing?.status || "draft";
   const statusConfig = STATUS_CONFIG[status];
   const StatusIcon = statusConfig.icon;
 
   const buildingName = billing?.buildings?.name || "Mustergebäude";
   const periodStart = billing?.period_start || "2024-01-01";
   const periodEnd = billing?.period_end || "2024-12-31";
 
   return (
     <MainLayout
       title="Betriebskostenabrechnung"
       breadcrumbs={[
         { label: "Betriebskosten", href: "/betriebskosten" },
         { label: buildingName },
       ]}
       actions={
         <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => navigate(`/betriebskosten/${id}/bearbeiten`)}>
             <Pencil className="h-4 w-4 mr-2" />
             Bearbeiten
           </Button>
           <Button variant="outline">
             <FileText className="h-4 w-4 mr-2" />
             PDF generieren
           </Button>
           <Button>
             <Send className="h-4 w-4 mr-2" />
             An Mieter senden
           </Button>
         </div>
       }
     >
       <div className="space-y-6">
         {/* Status Banner */}
         <Alert className={cn("border", statusConfig.color)}>
           <StatusIcon className="h-4 w-4" />
           <AlertDescription className="flex items-center justify-between">
             <span>
               Status: <strong>{statusConfig.label}</strong>
               {status === "draft" && " – Diese Abrechnung ist noch nicht abgeschlossen."}
               {status === "calculated" && " – Die Berechnung ist fertig, aber noch nicht versendet."}
               {status === "sent" && " – Die Abrechnung wurde an die Mieter versendet."}
               {status === "completed" && " – Diese Abrechnung ist abgeschlossen."}
             </span>
           </AlertDescription>
         </Alert>
 
         {/* Section 1: Übersicht */}
         <Card>
           <CardHeader>
             <CardTitle>Übersicht</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               <div className="flex items-start gap-3">
                 <div className="rounded-lg bg-primary/10 p-2">
                   <Building className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Gebäude</p>
                   <p className="font-semibold">{buildingName}</p>
                   <p className="text-sm text-muted-foreground">{billing?.buildings?.address || "Musterstraße 1"}</p>
                 </div>
               </div>
 
               <div className="flex items-start gap-3">
                 <div className="rounded-lg bg-primary/10 p-2">
                   <Calendar className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Abrechnungszeitraum</p>
                   <p className="font-semibold">
                     {format(new Date(periodStart), "dd.MM.yyyy", { locale: de })} –{" "}
                     {format(new Date(periodEnd), "dd.MM.yyyy", { locale: de })}
                   </p>
                   <p className="text-sm text-muted-foreground">
                     Erstellt am {format(new Date(billing?.created_at || new Date()), "dd.MM.yyyy", { locale: de })}
                   </p>
                 </div>
               </div>
 
               <div className="flex items-start gap-3">
                 <div className="rounded-lg bg-primary/10 p-2">
                   <Euro className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Gesamtkosten</p>
                   <p className="font-semibold text-xl">{formatCurrency(totalCosts / 100)}</p>
                 </div>
               </div>
 
               <div className="flex items-start gap-3">
                 <div className="rounded-lg bg-muted p-2">
                   <Home className="h-5 w-5 text-muted-foreground" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Einheiten</p>
                   <p className="font-semibold">{billing?.unit_count || MOCK_TENANT_RESULTS.length}</p>
                 </div>
               </div>
 
               <div className="flex items-start gap-3">
                 <div className="rounded-lg bg-muted p-2">
                   <Users className="h-5 w-5 text-muted-foreground" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Mieter</p>
                   <p className="font-semibold">{MOCK_TENANT_RESULTS.length}</p>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Section 2: Kostenübersicht */}
         <div className="grid gap-6 lg:grid-cols-3">
           <Card className="lg:col-span-2">
             <CardHeader>
               <CardTitle>Kostenübersicht</CardTitle>
             </CardHeader>
             <CardContent>
               <DataTable columns={costColumns} data={MOCK_COST_TYPES} />
               <Separator className="my-4" />
               <div className="flex justify-between items-center px-4 py-2 bg-muted rounded-lg">
                 <span className="font-semibold">Summe</span>
                 <span className="font-bold text-lg">{formatCurrency(totalCosts / 100)}</span>
               </div>
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader>
               <CardTitle>Kostenverteilung</CardTitle>
             </CardHeader>
             <CardContent>
               <ResponsiveContainer width="100%" height={280}>
                 <PieChart>
                   <Pie
                     data={chartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={50}
                     outerRadius={90}
                     paddingAngle={2}
                     dataKey="value"
                   >
                     {chartData.map((_, index) => (
                       <Cell
                         key={`cell-${index}`}
                         fill={CHART_COLORS[index % CHART_COLORS.length]}
                       />
                     ))}
                   </Pie>
                   <Tooltip
                     formatter={(value: number) => formatCurrency(value)}
                     contentStyle={{
                       backgroundColor: "hsl(var(--background))",
                       border: "1px solid hsl(var(--border))",
                       borderRadius: "8px",
                     }}
                   />
                   <Legend />
                 </PieChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
         </div>
 
         {/* Section 3: Ergebnisse pro Mieter */}
         <Card>
           <CardHeader>
             <CardTitle>Ergebnisse pro Mieter</CardTitle>
           </CardHeader>
           <CardContent>
             <DataTable columns={tenantColumns} data={MOCK_TENANT_RESULTS} />
             <Separator className="my-4" />
             <div className="grid gap-4 md:grid-cols-3">
               <div className="p-4 bg-muted rounded-lg">
                 <p className="text-sm text-muted-foreground">Gesamte Vorauszahlungen</p>
                 <p className="font-bold text-lg">{formatCurrency(totalPrepaid / 100)}</p>
               </div>
               <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                 <p className="text-sm text-primary">Gesamte Guthaben</p>
                 <p className="font-bold text-lg text-primary">{formatCurrency(totalCredits / 100)}</p>
               </div>
               <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                 <p className="text-sm text-destructive">Gesamte Nachzahlungen</p>
                 <p className="font-bold text-lg text-destructive">{formatCurrency(totalPaymentsDue / 100)}</p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Section 4: Dokumente */}
         <Card>
           <CardHeader>
             <CardTitle>Dokumente</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2">
               {/* Generated Documents */}
               <div className="space-y-3">
                 <h4 className="font-medium text-sm text-muted-foreground">Generierte Dokumente</h4>
                 <div className="space-y-2">
                   <div className="flex items-center justify-between p-3 border rounded-lg">
                     <div className="flex items-center gap-3">
                       <FileText className="h-5 w-5 text-primary" />
                       <div>
                         <p className="font-medium">Gesamtabrechnung</p>
                         <p className="text-sm text-muted-foreground">BK-Abrechnung_{billing?.billing_year || 2024}.pdf</p>
                       </div>
                     </div>
                     <Button variant="ghost" size="sm">
                       <Download className="h-4 w-4" />
                     </Button>
                   </div>
                   
                   {MOCK_TENANT_RESULTS.slice(0, 3).map((tenant) => (
                     <div key={tenant.id} className="flex items-center justify-between p-3 border rounded-lg">
                       <div className="flex items-center gap-3">
                         <FileText className="h-5 w-5 text-muted-foreground" />
                         <div>
                           <p className="font-medium">Einzelabrechnung {tenant.tenant}</p>
                           <p className="text-sm text-muted-foreground">BK_{tenant.unit.replace(" ", "_")}.pdf</p>
                         </div>
                       </div>
                       <Button variant="ghost" size="sm">
                         <Download className="h-4 w-4" />
                       </Button>
                     </div>
                   ))}
                   {MOCK_TENANT_RESULTS.length > 3 && (
                     <p className="text-sm text-muted-foreground pl-3">
                       + {MOCK_TENANT_RESULTS.length - 3} weitere Einzelabrechnungen
                     </p>
                   )}
                 </div>
               </div>
 
               {/* Uploaded Documents */}
               <div className="space-y-3">
                 <h4 className="font-medium text-sm text-muted-foreground">Belege & Nachweise</h4>
                 <div className="border-2 border-dashed rounded-lg p-6 text-center">
                   <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                   <p className="text-sm text-muted-foreground mb-2">
                     Belege hier hochladen oder ablegen
                   </p>
                   <Button variant="outline" size="sm">
                     Dateien auswählen
                   </Button>
                 </div>
                 <div className="text-sm text-muted-foreground">
                   Unterstützte Formate: PDF, JPG, PNG (max. 10MB)
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
     </MainLayout>
   );
 }