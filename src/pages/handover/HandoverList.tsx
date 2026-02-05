 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { format, isThisWeek, isThisMonth, parseISO } from "date-fns";
 import { de } from "date-fns/locale";
 import { ColumnDef } from "@tanstack/react-table";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader } from "@/components/shared/PageHeader";
 import { StatCard } from "@/components/shared/StatCard";
 import { DataTable } from "@/components/shared/DataTable";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
 import {
   ClipboardCheck,
   Plus,
   Calendar,
   AlertTriangle,
   CheckCircle,
   Eye,
   FileText,
   Trash2,
   Home,
   LogIn,
   LogOut,
 } from "lucide-react";
 import { useHandover, HandoverProtocol, HandoverStatus } from "@/hooks/useHandover";
 
 const statusConfig: Record<HandoverStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
   planned: { label: "Geplant", variant: "secondary" },
   in_progress: { label: "In Durchführung", variant: "default" },
   completed: { label: "Abgeschlossen", variant: "outline" },
   signed: { label: "Unterschrieben", variant: "default" },
 };
 
 export default function HandoverList() {
   const navigate = useNavigate();
   const { protocols, isLoading, deleteProtocol } = useHandover();
   const [deleteId, setDeleteId] = useState<string | null>(null);
 
   const upcomingThisWeek = protocols.filter(
     (p) => p.status === "planned" && isThisWeek(parseISO(p.scheduled_at))
   ).length;
 
   const completedThisMonth = protocols.filter(
     (p) =>
       (p.status === "completed" || p.status === "signed") &&
       p.completed_at &&
       isThisMonth(parseISO(p.completed_at))
   ).length;
 
   const withDefects = 0;
 
   const plannedProtocols = protocols.filter((p) => p.status === "planned");
   const completedProtocols = protocols.filter(
     (p) => p.status === "completed" || p.status === "signed"
   );
 
   const columns: ColumnDef<HandoverProtocol>[] = [
     {
       header: "Datum",
       accessorKey: "scheduled_at",
       cell: ({ row }) =>
         format(parseISO(row.original.scheduled_at), "dd.MM.yyyy HH:mm", { locale: de }),
     },
     {
       header: "Typ",
       accessorKey: "type",
       cell: ({ row }) => (
         <div className="flex items-center gap-2">
           {row.original.type === "move_in" ? (
             <>
               <LogIn className="h-4 w-4 text-primary" />
               <span>Einzug</span>
             </>
           ) : (
             <>
               <LogOut className="h-4 w-4 text-muted-foreground" />
               <span>Auszug</span>
             </>
           )}
         </div>
       ),
     },
     {
       header: "Einheit",
       accessorKey: "unit",
       cell: ({ row }) => (
         <div className="flex items-center gap-2">
           <Home className="h-4 w-4 text-muted-foreground" />
           <div>
             <div className="font-medium">{row.original.unit?.unit_number}</div>
             <div className="text-xs text-muted-foreground">
               {row.original.unit?.building?.name}
             </div>
           </div>
         </div>
       ),
     },
     {
       header: "Mieter",
       accessorKey: "tenant",
       cell: ({ row }) =>
         row.original.tenant
           ? `${row.original.tenant.first_name} ${row.original.tenant.last_name}`
           : "—",
     },
     {
       header: "Status",
       accessorKey: "status",
       cell: ({ row }) => {
         const config = statusConfig[row.original.status];
         return <Badge variant={config.variant}>{config.label}</Badge>;
       },
     },
     {
       header: "Mängel",
       id: "defects",
       cell: () => (
         <Badge variant="outline" className="text-muted-foreground">
           0
         </Badge>
       ),
     },
     {
       header: "Aktionen",
       id: "actions",
       cell: ({ row }) => (
         <div className="flex gap-1">
           <Button
             variant="ghost"
             size="icon"
             onClick={() => navigate(`/uebergaben/${row.original.id}`)}
           >
             <Eye className="h-4 w-4" />
           </Button>
           {(row.original.status === "completed" || row.original.status === "signed") && (
             <Button
               variant="ghost"
               size="icon"
               onClick={() => navigate(`/uebergaben/${row.original.id}/pdf`)}
             >
               <FileText className="h-4 w-4" />
             </Button>
           )}
           <Button
             variant="ghost"
             size="icon"
             onClick={() => setDeleteId(row.original.id)}
           >
             <Trash2 className="h-4 w-4 text-destructive" />
           </Button>
         </div>
       ),
     },
   ];
 
   return (
     <MainLayout title="Übergabeprotokolle">
       <div className="space-y-6">
         <PageHeader
           title="Übergabeprotokolle"
           subtitle="Digitale Wohnungsübergaben dokumentieren"
           actions={
             <Button onClick={() => navigate("/uebergaben/neu")}>
               <Plus className="h-4 w-4 mr-2" />
               Neue Übergabe
             </Button>
           }
         />
 
         <div className="grid gap-4 md:grid-cols-3">
           <StatCard
             title="Anstehend diese Woche"
             value={upcomingThisWeek}
             icon={Calendar}
           />
           <StatCard
             title="Durchgeführt diesen Monat"
             value={completedThisMonth}
             icon={CheckCircle}
           />
           <StatCard
             title="Mit offenen Mängeln"
             value={withDefects}
             icon={AlertTriangle}
           />
         </div>
 
         <Tabs defaultValue="planned">
           <TabsList>
             <TabsTrigger value="planned">
               Geplant ({plannedProtocols.length})
             </TabsTrigger>
             <TabsTrigger value="completed">
               Durchgeführt ({completedProtocols.length})
             </TabsTrigger>
             <TabsTrigger value="all">Alle ({protocols.length})</TabsTrigger>
           </TabsList>
 
           <TabsContent value="planned" className="mt-4">
             {isLoading ? (
               <div className="flex items-center justify-center h-32">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
               </div>
             ) : (
               <DataTable columns={columns} data={plannedProtocols} />
             )}
           </TabsContent>
 
           <TabsContent value="completed" className="mt-4">
             {isLoading ? (
               <div className="flex items-center justify-center h-32">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
               </div>
             ) : (
               <DataTable columns={columns} data={completedProtocols} />
             )}
           </TabsContent>
 
           <TabsContent value="all" className="mt-4">
             {isLoading ? (
               <div className="flex items-center justify-center h-32">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
               </div>
             ) : (
               <DataTable columns={columns} data={protocols} />
             )}
           </TabsContent>
         </Tabs>
       </div>
 
       <ConfirmDialog
         open={!!deleteId}
         onOpenChange={(open) => !open && setDeleteId(null)}
         title="Übergabe löschen"
         description="Möchten Sie dieses Übergabeprotokoll wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
         onConfirm={() => {
           if (deleteId) {
             deleteProtocol.mutate(deleteId);
             setDeleteId(null);
           }
         }}
         confirmLabel="Löschen"
         destructive
       />
     </MainLayout>
   );
 }