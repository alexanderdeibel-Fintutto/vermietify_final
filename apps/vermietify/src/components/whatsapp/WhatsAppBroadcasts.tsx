 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Checkbox } from "@/components/ui/checkbox";
 import { DataTable } from "@/components/shared/DataTable";
 import { Plus, Send, Users, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
 import { useWhatsApp, WhatsAppBroadcast } from "@/hooks/useWhatsApp";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
 import { ColumnDef } from "@tanstack/react-table";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
   draft: { label: "Entwurf", variant: "secondary" },
   scheduled: { label: "Geplant", variant: "outline" },
   sending: { label: "Wird gesendet", variant: "default" },
   completed: { label: "Abgeschlossen", variant: "default" },
   cancelled: { label: "Abgebrochen", variant: "destructive" },
 };
 
 export function WhatsAppBroadcasts() {
   const { broadcasts, templates, createBroadcast } = useWhatsApp();
  const { profile } = useAuth();
  
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-list', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('buildings')
        .select('id, name')
        .eq('organization_id', profile.organization_id);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });
  
   const [dialogOpen, setDialogOpen] = useState(false);
   const [newBroadcast, setNewBroadcast] = useState({
     name: "",
     template_id: "",
     recipient_type: "all",
     building_id: "",
     scheduled_at: "",
   });
 
   const approvedTemplates = templates.filter(t => t.status === 'approved');
 
   const handleCreate = async () => {
     await createBroadcast.mutateAsync({
       name: newBroadcast.name,
       template_id: newBroadcast.template_id || null,
       recipient_filter: {
         type: newBroadcast.recipient_type,
         building_id: newBroadcast.building_id || null,
       },
       scheduled_at: newBroadcast.scheduled_at || null,
       status: newBroadcast.scheduled_at ? 'scheduled' : 'draft',
     });
     setDialogOpen(false);
     setNewBroadcast({ name: "", template_id: "", recipient_type: "all", building_id: "", scheduled_at: "" });
   };
 
   const columns: ColumnDef<WhatsAppBroadcast>[] = [
     {
       accessorKey: "name",
       header: "Name",
       cell: ({ row }) => (
         <div className="font-medium">{row.original.name}</div>
       ),
     },
     {
       accessorKey: "recipient_count",
       header: "Empfänger",
       cell: ({ row }) => (
         <div className="flex items-center gap-2">
           <Users className="h-4 w-4 text-muted-foreground" />
           <span>{row.original.recipient_count}</span>
         </div>
       ),
     },
     {
       accessorKey: "status",
       header: "Status",
       cell: ({ row }) => {
         const config = statusConfig[row.original.status] || statusConfig.draft;
         return <Badge variant={config.variant}>{config.label}</Badge>;
       },
     },
     {
       accessorKey: "sent_count",
       header: "Gesendet",
       cell: ({ row }) => {
         const b = row.original;
         if (b.status === 'draft' || b.status === 'scheduled') return "-";
         return (
           <div className="text-sm">
             <span className="text-primary">{b.sent_count}</span>
             <span className="text-muted-foreground"> / {b.recipient_count}</span>
           </div>
         );
       },
     },
     {
       accessorKey: "delivered_count",
       header: "Zugestellt",
       cell: ({ row }) => {
         const b = row.original;
         if (b.status === 'draft' || b.status === 'scheduled') return "-";
         return (
           <div className="flex items-center gap-1">
             <CheckCircle className="h-3 w-3 text-primary" />
             <span>{b.delivered_count}</span>
           </div>
         );
       },
     },
     {
       accessorKey: "read_count",
       header: "Gelesen",
       cell: ({ row }) => {
         const b = row.original;
         if (b.status === 'draft' || b.status === 'scheduled') return "-";
         return b.read_count;
       },
     },
     {
       accessorKey: "scheduled_at",
       header: "Geplant",
       cell: ({ row }) => {
         if (!row.original.scheduled_at) return "-";
         return (
           <div className="flex items-center gap-1 text-sm">
             <Calendar className="h-3 w-3" />
             {format(new Date(row.original.scheduled_at), "dd.MM.yyyy HH:mm", { locale: de })}
           </div>
         );
       },
     },
     {
       accessorKey: "created_at",
       header: "Erstellt",
       cell: ({ row }) => format(new Date(row.original.created_at), "dd.MM.yyyy", { locale: de }),
     },
   ];
 
   return (
     <div className="space-y-4">
       <div className="flex justify-between items-center">
         <div>
           <h3 className="text-lg font-semibold">Broadcasts</h3>
           <p className="text-sm text-muted-foreground">Nachrichten an mehrere Empfänger senden</p>
         </div>
         <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
           <DialogTrigger asChild>
             <Button>
               <Plus className="h-4 w-4 mr-2" />
               Neuer Broadcast
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Neuer Broadcast</DialogTitle>
             </DialogHeader>
             <div className="space-y-4">
               <div>
                 <Label>Name</Label>
                 <Input
                   value={newBroadcast.name}
                   onChange={(e) => setNewBroadcast(prev => ({ ...prev, name: e.target.value }))}
                   placeholder="z.B. Zählerablesung Reminder"
                 />
               </div>
 
               <div>
                 <Label>Vorlage (nur genehmigte)</Label>
                 <Select
                   value={newBroadcast.template_id}
                   onValueChange={(v) => setNewBroadcast(prev => ({ ...prev, template_id: v }))}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Vorlage wählen..." />
                   </SelectTrigger>
                   <SelectContent>
                     {approvedTemplates.map(t => (
                       <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {approvedTemplates.length === 0 && (
                   <p className="text-sm text-muted-foreground mt-1">
                     Keine genehmigten Vorlagen vorhanden
                   </p>
                 )}
               </div>
 
               <div>
                 <Label>Empfänger</Label>
                 <Select
                   value={newBroadcast.recipient_type}
                   onValueChange={(v) => setNewBroadcast(prev => ({ ...prev, recipient_type: v }))}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Alle Mieter</SelectItem>
                     <SelectItem value="building">Nach Gebäude</SelectItem>
                     <SelectItem value="manual">Manuell auswählen</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
 
               {newBroadcast.recipient_type === 'building' && (
                 <div>
                   <Label>Gebäude</Label>
                   <Select
                     value={newBroadcast.building_id}
                     onValueChange={(v) => setNewBroadcast(prev => ({ ...prev, building_id: v }))}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Gebäude wählen..." />
                     </SelectTrigger>
                     <SelectContent>
                       {buildings.map(b => (
                         <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               )}
 
               <div>
                 <Label>Versanddatum (optional)</Label>
                 <Input
                   type="datetime-local"
                   value={newBroadcast.scheduled_at}
                   onChange={(e) => setNewBroadcast(prev => ({ ...prev, scheduled_at: e.target.value }))}
                 />
                 <p className="text-xs text-muted-foreground mt-1">
                   Leer lassen für sofortigen Versand
                 </p>
               </div>
 
               <div className="flex justify-end gap-2">
                 <Button variant="outline" onClick={() => setDialogOpen(false)}>
                   Abbrechen
                 </Button>
                 <Button 
                   onClick={handleCreate}
                   disabled={!newBroadcast.name || !newBroadcast.template_id}
                 >
                   <Send className="h-4 w-4 mr-2" />
                   Erstellen
                 </Button>
               </div>
             </div>
           </DialogContent>
         </Dialog>
       </div>
 
       <DataTable
         columns={columns}
         data={broadcasts}
         searchable
         searchPlaceholder="Broadcasts durchsuchen..."
         pagination
         pageSize={10}
       />
     </div>
   );
 }