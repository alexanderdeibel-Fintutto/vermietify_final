 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Badge } from "@/components/ui/badge";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { DataTable } from "@/components/shared/DataTable";
 import { Plus, CheckCircle, Clock, XCircle, AlertTriangle, FileText, Trash2, Eye } from "lucide-react";
 import { useWhatsApp, WhatsAppTemplate } from "@/hooks/useWhatsApp";
 import { ColumnDef } from "@tanstack/react-table";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
   pending: { label: "Ausstehend", variant: "outline", icon: <Clock className="h-3 w-3" /> },
   approved: { label: "Genehmigt", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
   rejected: { label: "Abgelehnt", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
 };
 
 const categoryLabels: Record<string, string> = {
   utility: "Service",
   marketing: "Marketing",
   authentication: "Authentifizierung",
 };
 
 const templateSuggestions = [
   {
     name: "Zahlungserinnerung",
     category: "utility" as const,
     body: "Hallo {{1}}, wir möchten Sie freundlich daran erinnern, dass die Miete für {{2}} noch aussteht. Bitte überweisen Sie den Betrag von {{3}} € bis zum {{4}}. Bei Fragen stehen wir Ihnen gerne zur Verfügung.",
   },
   {
     name: "Terminbestätigung",
     category: "utility" as const,
     body: "Hallo {{1}}, Ihr Termin am {{2}} um {{3}} Uhr wurde bestätigt. Adresse: {{4}}. Bei Verhinderung bitte rechtzeitig absagen.",
   },
   {
     name: "Zählerablesung Reminder",
     category: "utility" as const,
     body: "Hallo {{1}}, bitte übermitteln Sie uns bis zum {{2}} Ihren aktuellen Zählerstand. Sie können dies bequem über unser Mieterportal erledigen.",
   },
   {
     name: "Dokumentenversand",
     category: "utility" as const,
     body: "Hallo {{1}}, im Anhang finden Sie {{2}}. Bei Fragen kontaktieren Sie uns bitte unter {{3}}.",
   },
 ];
 
 export function WhatsAppTemplates() {
   const { templates, createTemplate, deleteTemplate } = useWhatsApp();
   const [dialogOpen, setDialogOpen] = useState(false);
   const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null);
   const [newTemplate, setNewTemplate] = useState({
     name: "",
     category: "utility" as "utility" | "marketing" | "authentication",
     header_type: "none" as "none" | "text" | "image",
     header_content: "",
     body: "",
     footer: "",
   });
 
   const handleCreate = async () => {
     await createTemplate.mutateAsync({
       name: newTemplate.name,
       category: newTemplate.category,
       header_type: newTemplate.header_type === "none" ? null : newTemplate.header_type,
       header_content: newTemplate.header_content || null,
       body: newTemplate.body,
       footer: newTemplate.footer || null,
     });
     setDialogOpen(false);
     setNewTemplate({ name: "", category: "utility", header_type: "none", header_content: "", body: "", footer: "" });
   };
 
   const useSuggestion = (suggestion: typeof templateSuggestions[0]) => {
     setNewTemplate({
       ...newTemplate,
       name: suggestion.name,
       category: suggestion.category,
       body: suggestion.body,
     });
   };
 
   const columns: ColumnDef<WhatsAppTemplate>[] = [
     {
       accessorKey: "name",
       header: "Name",
       cell: ({ row }) => (
         <div>
           <div className="font-medium">{row.original.name}</div>
           {row.original.is_system && (
             <Badge variant="outline" className="text-xs mt-1">System</Badge>
           )}
         </div>
       ),
     },
     {
       accessorKey: "category",
       header: "Kategorie",
       cell: ({ row }) => (
         <Badge variant="secondary">
           {categoryLabels[row.original.category] || row.original.category}
         </Badge>
       ),
     },
     {
       accessorKey: "status",
       header: "Status",
       cell: ({ row }) => {
         const config = statusConfig[row.original.status] || statusConfig.pending;
         return (
           <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
             {config.icon}
             {config.label}
           </Badge>
         );
       },
     },
     {
       accessorKey: "body",
       header: "Vorschau",
       cell: ({ row }) => (
         <p className="text-sm text-muted-foreground truncate max-w-[300px]">
           {row.original.body}
         </p>
       ),
     },
     {
       accessorKey: "created_at",
       header: "Erstellt",
       cell: ({ row }) => format(new Date(row.original.created_at), "dd.MM.yyyy", { locale: de }),
     },
     {
       id: "actions",
       header: "Aktionen",
       cell: ({ row }) => (
         <div className="flex gap-1">
           <Button 
             variant="ghost" 
             size="icon"
             onClick={() => setPreviewTemplate(row.original)}
           >
             <Eye className="h-4 w-4" />
           </Button>
           {!row.original.is_system && (
             <Button 
               variant="ghost" 
               size="icon"
               onClick={() => deleteTemplate.mutate(row.original.id)}
             >
               <Trash2 className="h-4 w-4" />
             </Button>
           )}
         </div>
       ),
     },
   ];
 
   return (
     <div className="space-y-4">
       <div className="flex justify-between items-center">
         <div>
           <h3 className="text-lg font-semibold">WhatsApp Vorlagen</h3>
           <p className="text-sm text-muted-foreground">
             Vorlagen müssen von WhatsApp genehmigt werden
           </p>
         </div>
         <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
           <DialogTrigger asChild>
             <Button>
               <Plus className="h-4 w-4 mr-2" />
               Neue Vorlage
             </Button>
           </DialogTrigger>
           <DialogContent className="max-w-2xl">
             <DialogHeader>
               <DialogTitle>Neue Vorlage erstellen</DialogTitle>
             </DialogHeader>
             <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-4">
                 <div>
                   <Label>Name</Label>
                   <Input
                     value={newTemplate.name}
                     onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                     placeholder="z.B. zahlungserinnerung_v1"
                   />
                   <p className="text-xs text-muted-foreground mt-1">
                     Nur Kleinbuchstaben und Unterstriche
                   </p>
                 </div>
 
                 <div>
                   <Label>Kategorie</Label>
                   <Select
                     value={newTemplate.category}
                     onValueChange={(v) => setNewTemplate(prev => ({ 
                       ...prev, 
                       category: v as "utility" | "marketing" | "authentication" 
                     }))}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="utility">Service (Utility)</SelectItem>
                       <SelectItem value="marketing">Marketing</SelectItem>
                       <SelectItem value="authentication">Authentifizierung</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
 
                 <div>
                   <Label>Header (optional)</Label>
                   <Select
                     value={newTemplate.header_type}
                     onValueChange={(v) => setNewTemplate(prev => ({ 
                       ...prev, 
                       header_type: v as "none" | "text" | "image" 
                     }))}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="none">Kein Header</SelectItem>
                       <SelectItem value="text">Text</SelectItem>
                       <SelectItem value="image">Bild</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
 
                 {newTemplate.header_type === 'text' && (
                   <div>
                     <Label>Header Text</Label>
                     <Input
                       value={newTemplate.header_content}
                       onChange={(e) => setNewTemplate(prev => ({ ...prev, header_content: e.target.value }))}
                     />
                   </div>
                 )}
 
                 <div>
                   <Label>Body</Label>
                   <Textarea
                     value={newTemplate.body}
                     onChange={(e) => setNewTemplate(prev => ({ ...prev, body: e.target.value }))}
                     placeholder="Nachrichtentext mit Platzhaltern {{1}}, {{2}}..."
                     rows={5}
                   />
                   <p className="text-xs text-muted-foreground mt-1">
                     Verwenden Sie {"{{1}}"}, {"{{2}}"} etc. für Platzhalter
                   </p>
                 </div>
 
                 <div>
                   <Label>Footer (optional)</Label>
                   <Input
                     value={newTemplate.footer}
                     onChange={(e) => setNewTemplate(prev => ({ ...prev, footer: e.target.value }))}
                     placeholder="z.B. Ihr Vermieter-Team"
                   />
                 </div>
               </div>
 
               <div className="space-y-4">
                 <Label>Vorlagen-Vorschläge</Label>
                 <div className="space-y-2">
                   {templateSuggestions.map((suggestion, i) => (
                     <Card 
                       key={i} 
                       className="cursor-pointer hover:bg-muted/50"
                       onClick={() => useSuggestion(suggestion)}
                     >
                       <CardContent className="p-3">
                         <div className="flex items-center justify-between">
                           <span className="font-medium text-sm">{suggestion.name}</span>
                           <Badge variant="outline" className="text-xs">
                             {categoryLabels[suggestion.category]}
                           </Badge>
                         </div>
                         <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                           {suggestion.body}
                         </p>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
 
                 <Card className="bg-muted/50">
                   <CardContent className="p-3">
                     <div className="flex items-center gap-2 text-sm">
                       <AlertTriangle className="h-4 w-4 text-accent-foreground" />
                       <span className="font-medium">Hinweis</span>
                     </div>
                     <p className="text-xs text-muted-foreground mt-2">
                       Vorlagen müssen von WhatsApp genehmigt werden. Dies kann 1-2 Werktage dauern.
                       Marketing-Vorlagen haben eine geringere Genehmigungsrate.
                     </p>
                   </CardContent>
                 </Card>
               </div>
             </div>
 
             <div className="flex justify-end gap-2 mt-4">
               <Button variant="outline" onClick={() => setDialogOpen(false)}>
                 Abbrechen
               </Button>
               <Button 
                 onClick={handleCreate}
                 disabled={!newTemplate.name || !newTemplate.body}
               >
                 Vorlage einreichen
               </Button>
             </div>
           </DialogContent>
         </Dialog>
       </div>
 
       <DataTable
         columns={columns}
         data={templates}
         searchable
         searchPlaceholder="Vorlagen durchsuchen..."
         pagination
         pageSize={10}
       />
 
       {/* Preview Dialog */}
       <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Vorlagen-Vorschau</DialogTitle>
           </DialogHeader>
           {previewTemplate && (
             <Card>
               <CardHeader className="pb-2">
                 <div className="flex items-center justify-between">
                   <CardTitle className="text-sm">{previewTemplate.name}</CardTitle>
                   <Badge variant={statusConfig[previewTemplate.status]?.variant}>
                     {statusConfig[previewTemplate.status]?.label}
                   </Badge>
                 </div>
               </CardHeader>
               <CardContent>
                 {previewTemplate.header_content && (
                   <p className="font-semibold mb-2">{previewTemplate.header_content}</p>
                 )}
                 <p className="whitespace-pre-wrap">{previewTemplate.body}</p>
                 {previewTemplate.footer && (
                   <p className="text-sm text-muted-foreground mt-2">{previewTemplate.footer}</p>
                 )}
                 {previewTemplate.rejection_reason && (
                   <div className="mt-4 p-2 bg-destructive/10 rounded text-sm text-destructive">
                     <strong>Ablehnungsgrund:</strong> {previewTemplate.rejection_reason}
                   </div>
                 )}
               </CardContent>
             </Card>
           )}
         </DialogContent>
       </Dialog>
     </div>
   );
 }