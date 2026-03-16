 import { useParams, useNavigate } from "react-router-dom";
 import { format, parseISO } from "date-fns";
 import { de } from "date-fns/locale";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader } from "@/components/shared/PageHeader";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import {
   ArrowLeft,
   Download,
   Mail,
   Send,
   Check,
   AlertTriangle,
   Home,
   User,
   Calendar,
   Key,
   Gauge,
 } from "lucide-react";
 import { useHandoverProtocol } from "@/hooks/useHandover";
 import { toast } from "@/hooks/use-toast";
 
 export default function HandoverPDF() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { protocol, rooms, defects, signatures, keys, isLoading } =
     useHandoverProtocol(id);
 
   const handleDownload = () => {
     // In a real implementation, this would generate a PDF
     toast({ title: "PDF wird generiert...", description: "Diese Funktion wird noch implementiert." });
   };
 
   const handleEmail = () => {
     toast({ title: "E-Mail wird vorbereitet...", description: "Diese Funktion wird noch implementiert." });
   };
 
   const handlePost = () => {
     toast({ title: "Postversand wird vorbereitet...", description: "Weiterleitung zu LetterXpress..." });
   };
 
   if (isLoading || !protocol) {
     return (
       <MainLayout title="Übergabeprotokoll">
         <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
         </div>
       </MainLayout>
     );
   }
 
   const totalDefects = defects.length;
   const tenantResponsibleDefects = defects.filter((d) => d.is_tenant_responsible).length;
 
   return (
     <MainLayout title="Übergabeprotokoll PDF">
       <div className="max-w-3xl mx-auto space-y-6">
         <PageHeader
           title="Übergabeprotokoll"
           subtitle={`${protocol.type === "move_in" ? "Einzug" : "Auszug"} - ${
             protocol.unit?.unit_number
           }`}
           actions={
             <div className="flex gap-2">
               <Button variant="outline" onClick={() => navigate("/uebergaben")}>
                 <ArrowLeft className="h-4 w-4 mr-2" />
                 Zurück
               </Button>
               <Button variant="outline" onClick={handleDownload}>
                 <Download className="h-4 w-4 mr-2" />
                 PDF
               </Button>
               <Button variant="outline" onClick={handleEmail}>
                 <Mail className="h-4 w-4 mr-2" />
                 E-Mail
               </Button>
               <Button variant="outline" onClick={handlePost}>
                 <Send className="h-4 w-4 mr-2" />
                 Post
               </Button>
             </div>
           }
         />
 
         {/* PDF Preview */}
         <Card className="print:shadow-none">
           <CardContent className="p-8 space-y-6">
             {/* Header */}
             <div className="text-center space-y-2 border-b pb-6">
               <h1 className="text-2xl font-bold">
                 Wohnungsübergabeprotokoll
               </h1>
               <Badge variant={protocol.type === "move_in" ? "default" : "secondary"}>
                 {protocol.type === "move_in" ? "Einzug" : "Auszug"}
               </Badge>
             </div>
 
             {/* Meta Info */}
             <div className="grid grid-cols-2 gap-6">
               <div className="space-y-3">
                 <div className="flex items-center gap-2 text-muted-foreground">
                   <Home className="h-4 w-4" />
                   <span className="text-sm">Objekt</span>
                 </div>
                 <div>
                   <div className="font-medium">
                     {protocol.unit?.building?.name}
                   </div>
                   <div className="text-sm text-muted-foreground">
                     {protocol.unit?.building?.address}
                   </div>
                   <div className="text-sm">
                     Einheit: {protocol.unit?.unit_number}
                   </div>
                 </div>
               </div>
 
               <div className="space-y-3">
                 <div className="flex items-center gap-2 text-muted-foreground">
                   <User className="h-4 w-4" />
                   <span className="text-sm">Mieter</span>
                 </div>
                 <div>
                   {protocol.tenant ? (
                     <>
                       <div className="font-medium">
                         {protocol.tenant.first_name} {protocol.tenant.last_name}
                       </div>
                       {protocol.tenant.email && (
                         <div className="text-sm text-muted-foreground">
                           {protocol.tenant.email}
                         </div>
                       )}
                     </>
                   ) : (
                     <span className="text-muted-foreground">—</span>
                   )}
                 </div>
               </div>
 
               <div className="space-y-3">
                 <div className="flex items-center gap-2 text-muted-foreground">
                   <Calendar className="h-4 w-4" />
                   <span className="text-sm">Übergabe</span>
                 </div>
                 <div>
                   <div className="font-medium">
                     {format(parseISO(protocol.scheduled_at), "dd. MMMM yyyy", {
                       locale: de,
                     })}
                   </div>
                   <div className="text-sm text-muted-foreground">
                     {format(parseISO(protocol.scheduled_at), "HH:mm", {
                       locale: de,
                     })}{" "}
                     Uhr
                   </div>
                 </div>
               </div>
 
               <div className="space-y-3">
                 <div className="text-sm text-muted-foreground">Status</div>
                 <Badge
                   variant={
                     protocol.status === "signed"
                       ? "default"
                       : protocol.status === "completed"
                       ? "secondary"
                       : "outline"
                   }
                 >
                   {protocol.status === "signed"
                     ? "Unterschrieben"
                     : protocol.status === "completed"
                     ? "Abgeschlossen"
                     : protocol.status === "in_progress"
                     ? "In Bearbeitung"
                     : "Geplant"}
                 </Badge>
               </div>
             </div>
 
             <Separator />
 
             {/* Rooms */}
             <div className="space-y-4">
               <h2 className="font-semibold text-lg">Räume</h2>
               {rooms.length === 0 ? (
                 <p className="text-muted-foreground">Keine Räume dokumentiert.</p>
               ) : (
                 rooms.map((room) => (
                   <Card key={room.id}>
                     <CardHeader className="pb-2">
                       <div className="flex items-center justify-between">
                         <CardTitle className="text-base">{room.room_name}</CardTitle>
                         <Badge
                           variant={
                             room.overall_status === "ok" ? "default" : "destructive"
                           }
                         >
                           {room.overall_status === "ok" ? "In Ordnung" : "Mängel"}
                         </Badge>
                       </div>
                     </CardHeader>
                     <CardContent>
                       <div className="grid grid-cols-2 gap-2 text-sm">
                         {(room.items as any[]).map((item: any) => (
                           <div
                             key={item.id}
                             className="flex items-center gap-2"
                           >
                             {item.status === "ok" ? (
                               <Check className="h-4 w-4 text-green-600" />
                             ) : item.status === "defect" ? (
                               <AlertTriangle className="h-4 w-4 text-destructive" />
                             ) : (
                               <div className="h-4 w-4" />
                             )}
                             <span>{item.name}</span>
                           </div>
                         ))}
                       </div>
                       {room.notes && (
                         <div className="mt-2 text-sm text-muted-foreground">
                           <strong>Notizen:</strong> {room.notes}
                         </div>
                       )}
                       {room.photos && room.photos.length > 0 && (
                         <div className="mt-2 flex gap-2">
                           {room.photos.map((photo: string, i: number) => (
                             <img
                               key={i}
                               src={photo}
                               alt={`${room.room_name} Foto ${i + 1}`}
                               className="w-16 h-16 object-cover rounded border"
                             />
                           ))}
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 ))
               )}
             </div>
 
             <Separator />
 
             {/* Defects Summary */}
             {totalDefects > 0 && (
               <>
                 <div className="space-y-4">
                   <h2 className="font-semibold text-lg flex items-center gap-2">
                     <AlertTriangle className="h-5 w-5 text-destructive" />
                     Mängelliste ({totalDefects})
                   </h2>
                   <div className="space-y-2">
                     {defects.map((defect) => (
                       <div
                         key={defect.id}
                         className="p-3 border rounded-lg flex justify-between"
                       >
                         <div>
                           <div className="font-medium">{defect.description}</div>
                           <div className="text-sm text-muted-foreground">
                             Schweregrad:{" "}
                             {defect.severity === "light"
                               ? "Leicht"
                               : defect.severity === "medium"
                               ? "Mittel"
                               : "Schwer"}
                           </div>
                         </div>
                         {defect.is_tenant_responsible && (
                           <Badge variant="destructive">Mieter</Badge>
                         )}
                       </div>
                     ))}
                   </div>
                   {tenantResponsibleDefects > 0 && (
                     <div className="text-sm text-muted-foreground">
                       {tenantResponsibleDefects} Mangel/Mängel sind dem Mieter
                       zuzurechnen.
                     </div>
                   )}
                 </div>
                 <Separator />
               </>
             )}
 
             {/* Keys */}
             <div className="space-y-4">
               <h2 className="font-semibold text-lg flex items-center gap-2">
                 <Key className="h-5 w-5" />
                 Schlüsselübergabe
               </h2>
               {keys.length === 0 ? (
                 <p className="text-muted-foreground">
                   Keine Schlüssel dokumentiert.
                 </p>
               ) : (
                 <div className="grid grid-cols-2 gap-2">
                   {keys.map((key) => (
                     <div
                       key={key.id}
                       className="flex items-center justify-between p-2 border rounded"
                     >
                       <span>{key.key_label || key.key_type}</span>
                       <div className="flex items-center gap-2">
                         <span className="text-sm text-muted-foreground">
                           {key.quantity}x
                         </span>
                         {key.handed_over ? (
                           <Check className="h-4 w-4 text-green-600" />
                         ) : (
                           <span className="text-xs text-muted-foreground">
                             Nicht übergeben
                           </span>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
 
             <Separator />
 
             {/* Signatures */}
             <div className="space-y-4">
               <h2 className="font-semibold text-lg">Unterschriften</h2>
               <div className="grid grid-cols-2 gap-6">
                 {signatures.map((sig) => (
                   <div key={sig.id} className="space-y-2">
                     <div className="text-sm text-muted-foreground">
                       {sig.signer_type === "landlord"
                         ? "Vermieter"
                         : sig.signer_type === "tenant"
                         ? "Mieter"
                         : "Zeuge"}
                     </div>
                     <div className="border rounded p-2 bg-white h-20 flex items-center justify-center">
                       <img
                         src={sig.signature_path}
                         alt={`Unterschrift ${sig.signer_name}`}
                         className="max-h-full"
                       />
                     </div>
                     <div className="text-sm">
                       <div className="font-medium">{sig.signer_name}</div>
                       <div className="text-muted-foreground">
                         {format(parseISO(sig.signed_at), "dd.MM.yyyy HH:mm", {
                           locale: de,
                         })}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
 
             {/* Footer */}
             <div className="text-center text-xs text-muted-foreground pt-6 border-t">
               <p>
                 Erstellt am{" "}
                 {format(parseISO(protocol.created_at), "dd.MM.yyyy HH:mm", {
                   locale: de,
                 })}{" "}
                 | Protokoll-ID: {protocol.id.slice(0, 8)}
               </p>
             </div>
           </CardContent>
         </Card>
       </div>
     </MainLayout>
   );
 }