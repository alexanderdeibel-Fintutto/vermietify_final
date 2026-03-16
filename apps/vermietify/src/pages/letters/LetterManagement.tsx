 import { useState } from "react";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { DataTable } from "@/components/shared/DataTable";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Badge } from "@/components/ui/badge";
 import { Card, CardContent } from "@/components/ui/card";
 import { 
   Mail, 
   Settings, 
   Plus, 
   Eye, 
   RefreshCw, 
   XCircle,
   Send,
   Clock,
   CheckCircle,
   Euro,
   TrendingUp
 } from "lucide-react";
 import { useLetters, LetterOrder } from "@/hooks/useLetters";
 import { useTenants } from "@/hooks/useTenants";
 import { LetterComposerDialog } from "@/components/letters/LetterComposerDialog";
 import { ColumnDef } from "@tanstack/react-table";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { useNavigate } from "react-router-dom";
 import { LoadingState } from "@/components/shared/LoadingState";
 
 const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
   draft: { label: "Entwurf", variant: "secondary" },
   submitted: { label: "Übermittelt", variant: "default" },
   printing: { label: "In Druck", variant: "outline" },
   sent: { label: "Versendet", variant: "default" },
   delivered: { label: "Zugestellt", variant: "default" },
   error: { label: "Fehler", variant: "destructive" },
   cancelled: { label: "Storniert", variant: "secondary" },
 };
 
 export default function LetterManagement() {
   const navigate = useNavigate();
   const { orders, stats, isLoading: lettersLoading, sendLetter, deleteOrder } = useLetters();
   const { useTenantsList } = useTenants();
   const { data: tenants = [] } = useTenantsList();
   const [composerOpen, setComposerOpen] = useState(false);
   const [activeTab, setActiveTab] = useState("all");
 
   const filteredOrders = orders.filter(order => {
     if (activeTab === "all") return true;
     if (activeTab === "drafts") return order.status === "draft";
     if (activeTab === "processing") return ["submitted", "printing"].includes(order.status);
     if (activeTab === "sent") return ["sent", "delivered"].includes(order.status);
     return true;
   });
 
   const columns: ColumnDef<LetterOrder>[] = [
     {
       accessorKey: "subject",
       header: "Betreff",
       cell: ({ row }) => (
         <div className="font-medium">{row.original.subject}</div>
       ),
     },
     {
       accessorKey: "recipient_address",
       header: "Empfänger",
       cell: ({ row }) => {
         const addr = row.original.recipient_address;
         return (
           <div className="text-sm">
             <div>{addr?.name}</div>
             <div className="text-muted-foreground">{addr?.city}</div>
           </div>
         );
       },
     },
     {
       accessorKey: "pages",
       header: "Seiten",
       cell: ({ row }) => row.original.pages || 1,
     },
     {
       accessorKey: "status",
       header: "Status",
       cell: ({ row }) => {
         const config = statusConfig[row.original.status] || statusConfig.draft;
         return (
           <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
             {row.original.status === "delivered" && <CheckCircle className="h-3 w-3" />}
             {config.label}
           </Badge>
         );
       },
     },
     {
       accessorKey: "created_at",
       header: "Erstellt",
       cell: ({ row }) => format(new Date(row.original.created_at), "dd.MM.yyyy", { locale: de }),
     },
     {
       accessorKey: "cost_cents",
       header: "Kosten",
       cell: ({ row }) => {
         const cost = row.original.cost_cents || 0;
         return cost > 0 ? `${(cost / 100).toFixed(2)} €` : "-";
       },
     },
     {
       id: "actions",
       header: "Aktionen",
       cell: ({ row }) => {
         const order = row.original;
         return (
           <div className="flex gap-2">
             <Button variant="ghost" size="icon" title="Vorschau">
               <Eye className="h-4 w-4" />
             </Button>
             {order.status === "draft" && (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 title="Senden"
                 onClick={() => sendLetter.mutate(order.id)}
               >
                 <Send className="h-4 w-4" />
               </Button>
             )}
             {["draft", "submitted"].includes(order.status) && (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 title="Stornieren"
                 onClick={() => deleteOrder.mutate(order.id)}
               >
                 <XCircle className="h-4 w-4" />
               </Button>
             )}
           </div>
         );
       },
     },
   ];
 
   if (lettersLoading) return <MainLayout title="Briefversand"><LoadingState /></MainLayout>;
 
   return (
     <MainLayout 
       title="Briefversand"
       breadcrumbs={[{ label: "Briefversand" }]}
       actions={
           <div className="flex gap-2">
             <Button variant="outline" onClick={() => navigate("/briefe/einstellungen")}>
               <Settings className="h-4 w-4 mr-2" />
               Einstellungen
             </Button>
             <Button onClick={() => setComposerOpen(true)}>
               <Plus className="h-4 w-4 mr-2" />
               Neuer Brief
             </Button>
           </div>
       }
     >
       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">Briefversand</h1>
           <p className="text-muted-foreground">Digitaler Briefversand mit LetterXpress</p>
         </div>
 
         <div className="grid gap-4 md:grid-cols-4">
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-primary/10 p-2">
                   <Mail className="h-5 w-5 text-primary" />
                 </div>
               </div>
               <div className="mt-4">
                 <p className="text-3xl font-bold">{stats.thisMonth}</p>
                 <p className="text-sm text-muted-foreground mt-1">Briefe diesen Monat</p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-primary/10 p-2">
                   <Euro className="h-5 w-5 text-primary" />
                 </div>
               </div>
               <div className="mt-4">
                 <p className="text-3xl font-bold">{(stats.totalCost / 100).toFixed(2)} €</p>
                 <p className="text-sm text-muted-foreground mt-1">Kosten gesamt</p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-primary/10 p-2">
                   <Clock className="h-5 w-5 text-primary" />
                 </div>
               </div>
               <div className="mt-4">
                 <p className="text-3xl font-bold">{stats.inDelivery}</p>
                 <p className="text-sm text-muted-foreground mt-1">In Zustellung</p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-primary/10 p-2">
                   <CheckCircle className="h-5 w-5 text-primary" />
                 </div>
               </div>
               <div className="mt-4">
                 <p className="text-3xl font-bold">{stats.delivered}</p>
                 <p className="text-sm text-muted-foreground mt-1">Zugestellt</p>
               </div>
             </CardContent>
           </Card>
         </div>
 
         <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList>
             <TabsTrigger value="all">Alle</TabsTrigger>
             <TabsTrigger value="drafts">Entwürfe</TabsTrigger>
             <TabsTrigger value="processing">In Bearbeitung</TabsTrigger>
             <TabsTrigger value="sent">Versendet</TabsTrigger>
           </TabsList>
 
           <TabsContent value={activeTab} className="mt-4">
             <DataTable
               columns={columns}
               data={filteredOrders}
               searchable
               searchPlaceholder="Briefe durchsuchen..."
               pagination
               pageSize={10}
             />
           </TabsContent>
         </Tabs>
       </div>
 
       <LetterComposerDialog 
         open={composerOpen} 
         onOpenChange={setComposerOpen} 
         tenants={tenants}
       />
     </MainLayout>
   );
 }