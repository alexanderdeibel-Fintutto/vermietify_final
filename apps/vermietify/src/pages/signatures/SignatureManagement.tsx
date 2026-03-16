 import { useState } from "react";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { DataTable } from "@/components/shared/DataTable";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Badge } from "@/components/ui/badge";
 import { Card, CardContent } from "@/components/ui/card";
 import { 
   PenTool, 
   Plus, 
   Clock, 
   CheckCircle, 
   AlertCircle,
   Eye,
   Bell,
   XCircle,
   Download,
   Send
 } from "lucide-react";
 import { useSignatures, SignatureOrder } from "@/hooks/useSignatures";
 import { SignatureRequestDialog } from "@/components/signatures/SignatureRequestDialog";
 import { ColumnDef } from "@tanstack/react-table";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { LoadingState } from "@/components/shared/LoadingState";
 
 const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon?: React.ReactNode }> = {
   draft: { label: "Entwurf", variant: "secondary" },
   sent: { label: "Gesendet", variant: "default", icon: <Send className="h-3 w-3" /> },
   viewed: { label: "Angesehen", variant: "outline", icon: <Eye className="h-3 w-3" /> },
   signed: { label: "Unterschrieben", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
   declined: { label: "Abgelehnt", variant: "destructive" },
   expired: { label: "Abgelaufen", variant: "secondary", icon: <AlertCircle className="h-3 w-3" /> },
   cancelled: { label: "Storniert", variant: "secondary" },
 };
 
 const documentTypes: Record<string, string> = {
   mietvertrag: "Mietvertrag",
   nachtrag: "Nachtrag",
   kuendigung: "Kündigung",
   uebergabeprotokoll: "Übergabeprotokoll",
   other: "Sonstiges",
 };
 
 export default function SignatureManagement() {
   const { orders, stats, isLoading, sendReminder, cancelOrder, sendRequest } = useSignatures();
   const [dialogOpen, setDialogOpen] = useState(false);
   const [activeTab, setActiveTab] = useState("all");
 
   const filteredOrders = orders.filter(order => {
     if (activeTab === "all") return true;
     if (activeTab === "pending") return ["draft", "sent", "viewed"].includes(order.status);
     if (activeTab === "signed") return order.status === "signed";
     if (activeTab === "expired") return ["expired", "declined", "cancelled"].includes(order.status);
     return true;
   });
 
   const columns: ColumnDef<SignatureOrder>[] = [
     {
       accessorKey: "document_name",
       header: "Dokument",
       cell: ({ row }) => (
         <div>
           <div className="font-medium">{row.original.document_name}</div>
           <div className="text-sm text-muted-foreground">
             {documentTypes[row.original.document_type] || row.original.document_type}
           </div>
         </div>
       ),
     },
     {
       accessorKey: "signers",
       header: "Empfänger",
       cell: ({ row }) => {
         const signers = row.original.signers || [];
         return (
           <div className="text-sm">
             {signers.slice(0, 2).map((s, i) => (
               <div key={i} className="flex items-center gap-2">
                 <span>{s.name}</span>
                  {s.status === 'signed' && <CheckCircle className="h-3 w-3 text-primary" />}
               </div>
             ))}
             {signers.length > 2 && (
               <span className="text-muted-foreground">+{signers.length - 2} weitere</span>
             )}
           </div>
         );
       },
     },
     {
       accessorKey: "status",
       header: "Status",
       cell: ({ row }) => {
         const config = statusConfig[row.original.status] || statusConfig.draft;
         return (
           <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
             {config.icon}
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
       accessorKey: "completed_at",
       header: "Unterschrieben",
       cell: ({ row }) => {
         if (!row.original.completed_at) return "-";
         return format(new Date(row.original.completed_at), "dd.MM.yyyy", { locale: de });
       },
     },
     {
       id: "actions",
       header: "Aktionen",
       cell: ({ row }) => {
         const order = row.original;
         return (
           <div className="flex gap-1">
             {order.status === "draft" && (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 title="Senden"
                 onClick={() => sendRequest.mutate(order.id)}
               >
                 <Send className="h-4 w-4" />
               </Button>
             )}
             {["sent", "viewed"].includes(order.status) && (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 title="Erinnern"
                 onClick={() => sendReminder.mutate(order.id)}
               >
                 <Bell className="h-4 w-4" />
               </Button>
             )}
             {["draft", "sent", "viewed"].includes(order.status) && (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 title="Stornieren"
                 onClick={() => cancelOrder.mutate(order.id)}
               >
                 <XCircle className="h-4 w-4" />
               </Button>
             )}
             {order.status === "signed" && order.signed_document_path && (
               <Button variant="ghost" size="icon" title="Herunterladen">
                 <Download className="h-4 w-4" />
               </Button>
             )}
           </div>
         );
       },
     },
   ];
 
   if (isLoading) return <MainLayout title="Unterschriften"><LoadingState /></MainLayout>;
 
   return (
     <MainLayout 
       title="Digitale Unterschriften"
       breadcrumbs={[{ label: "Unterschriften" }]}
       actions={
         <Button onClick={() => setDialogOpen(true)}>
           <Plus className="h-4 w-4 mr-2" />
           Signatur anfordern
         </Button>
       }
     >
       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">Digitale Unterschriften</h1>
           <p className="text-muted-foreground">E-Signatur für Mietverträge und Dokumente</p>
         </div>
 
         <div className="grid gap-4 md:grid-cols-3">
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-accent p-2">
                   <Clock className="h-5 w-5 text-accent-foreground" />
                 </div>
               </div>
               <div className="mt-4">
                 <p className="text-3xl font-bold">{stats.pending}</p>
                 <p className="text-sm text-muted-foreground mt-1">Ausstehend</p>
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
                 <p className="text-3xl font-bold">{stats.signedThisMonth}</p>
                 <p className="text-sm text-muted-foreground mt-1">Unterschrieben (Monat)</p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-destructive/10 p-2">
                   <AlertCircle className="h-5 w-5 text-destructive" />
                 </div>
               </div>
               <div className="mt-4">
                 <p className="text-3xl font-bold">{stats.expired}</p>
                 <p className="text-sm text-muted-foreground mt-1">Abgelaufen</p>
               </div>
             </CardContent>
           </Card>
         </div>
 
         <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList>
             <TabsTrigger value="all">Alle</TabsTrigger>
             <TabsTrigger value="pending">Ausstehend</TabsTrigger>
             <TabsTrigger value="signed">Unterschrieben</TabsTrigger>
             <TabsTrigger value="expired">Abgelaufen</TabsTrigger>
           </TabsList>
 
           <TabsContent value={activeTab} className="mt-4">
             <DataTable
               columns={columns}
               data={filteredOrders}
               searchable
               searchPlaceholder="Dokumente durchsuchen..."
               pagination
               pageSize={10}
             />
           </TabsContent>
         </Tabs>
       </div>
 
       <SignatureRequestDialog 
         open={dialogOpen} 
         onOpenChange={setDialogOpen} 
       />
     </MainLayout>
   );
 }