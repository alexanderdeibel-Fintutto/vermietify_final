 import { useState } from "react";
 import { TenantLayout } from "@/components/tenant-portal/TenantLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Badge } from "@/components/ui/badge";
 import { useTenantPortal } from "@/hooks/useTenantPortal";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { LoadingState, EmptyState } from "@/components/shared";
 import {
   FileText,
   Download,
   Upload,
   Plus,
   Clock,
   Check,
   X,
   Loader2,
 } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 const documentTypes: Record<string, string> = {
   contract: "Mietvertrag",
   protocol: "Protokoll",
   invoice: "Rechnung",
   insurance: "Versicherung",
   tax: "Steuer",
   correspondence: "Schreiben",
   other: "Sonstiges",
 };
 
 const requestTypes = [
   { id: "rent_certificate", label: "Mietbescheinigung" },
   { id: "utility_statement", label: "Nebenkostenabrechnung" },
   { id: "deposit_confirmation", label: "Kautionsbestätigung" },
   { id: "contract_copy", label: "Vertragskopie" },
   { id: "other", label: "Sonstiges" },
 ];
 
 export default function TenantDocuments() {
   const { toast } = useToast();
   const { user } = useAuth();
   const { useTenantAccess, useTenantDocuments, useTenantDocumentRequests } = useTenantPortal();
   const { data: access } = useTenantAccess();
   const { data: documents = [], isLoading: docsLoading } = useTenantDocuments();
   const { data: requests = [], isLoading: reqLoading, refetch: refetchRequests } = useTenantDocumentRequests();
 
   const [showRequestDialog, setShowRequestDialog] = useState(false);
   const [requestType, setRequestType] = useState("");
   const [requestNotes, setRequestNotes] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   const handleRequestSubmit = async () => {
     if (!user || !access || !requestType) return;
 
     setIsSubmitting(true);
 
     try {
       const { error } = await supabase.from("document_requests").insert({
         tenant_user_id: user.id,
         tenant_id: (access.tenant as any).id,
         document_type: requestType,
         notes: requestNotes || null,
       });
 
       if (error) throw error;
 
       toast({ title: "Anfrage gesendet" });
       setShowRequestDialog(false);
       setRequestType("");
       setRequestNotes("");
       refetchRequests();
     } catch (error: any) {
       toast({
         title: "Fehler",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const isLoading = docsLoading || reqLoading;
 
   if (isLoading) {
     return (
       <TenantLayout>
         <LoadingState />
       </TenantLayout>
     );
   }
 
   return (
     <TenantLayout>
       <div className="space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-bold">Dokumente</h1>
             <p className="text-muted-foreground">
               Verwalten Sie Ihre Dokumente und fordern Sie neue an.
             </p>
           </div>
           <Button onClick={() => setShowRequestDialog(true)}>
             <Plus className="h-4 w-4 mr-2" />
             Dokument anfragen
           </Button>
         </div>
 
         <Tabs defaultValue="landlord">
           <TabsList>
             <TabsTrigger value="landlord">Vom Vermieter</TabsTrigger>
             <TabsTrigger value="requests">Meine Anfragen</TabsTrigger>
           </TabsList>
 
           {/* Documents from Landlord */}
           <TabsContent value="landlord" className="mt-4">
             {documents.length === 0 ? (
               <EmptyState
                 icon={FileText}
                 title="Keine Dokumente"
                 description="Ihr Vermieter hat noch keine Dokumente für Sie bereitgestellt."
               />
             ) : (
               <div className="space-y-3">
                 {documents.map((doc: any) => (
                   <Card key={doc.id}>
                     <CardContent className="flex items-center justify-between p-4">
                       <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                           <FileText className="h-5 w-5 text-blue-500" />
                         </div>
                         <div>
                           <p className="font-medium">{doc.title}</p>
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                             <Badge variant="outline">
                               {documentTypes[doc.document_type] || doc.document_type}
                             </Badge>
                             <span>
                               {format(new Date(doc.created_at), "dd.MM.yyyy", { locale: de })}
                             </span>
                           </div>
                         </div>
                       </div>
                       <Button variant="ghost" size="icon" asChild>
                         <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                           <Download className="h-4 w-4" />
                         </a>
                       </Button>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             )}
           </TabsContent>
 
           {/* Document Requests */}
           <TabsContent value="requests" className="mt-4">
             {requests.length === 0 ? (
               <EmptyState
                 icon={FileText}
                 title="Keine Anfragen"
                 description="Sie haben noch keine Dokumentenanfragen gestellt."
                 action={
                   <Button onClick={() => setShowRequestDialog(true)}>
                     <Plus className="h-4 w-4 mr-2" />
                     Dokument anfragen
                   </Button>
                 }
               />
             ) : (
               <div className="space-y-3">
                 {requests.map((req: any) => (
                   <Card key={req.id}>
                     <CardContent className="flex items-center justify-between p-4">
                       <div className="flex items-center gap-3">
                         <div
                           className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                             req.status === "completed"
                               ? "bg-green-50"
                               : req.status === "rejected"
                               ? "bg-red-50"
                               : "bg-yellow-50"
                           }`}
                         >
                           {req.status === "completed" ? (
                             <Check className="h-5 w-5 text-green-500" />
                           ) : req.status === "rejected" ? (
                             <X className="h-5 w-5 text-red-500" />
                           ) : (
                             <Clock className="h-5 w-5 text-yellow-500" />
                           )}
                         </div>
                         <div>
                           <p className="font-medium">
                             {requestTypes.find((t) => t.id === req.document_type)?.label ||
                               req.document_type}
                           </p>
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                             <Badge
                               variant="outline"
                               className={
                                 req.status === "completed"
                                   ? "bg-green-100 text-green-800"
                                   : req.status === "rejected"
                                   ? "bg-red-100 text-red-800"
                                   : "bg-yellow-100 text-yellow-800"
                               }
                             >
                               {req.status === "completed"
                                 ? "Erledigt"
                                 : req.status === "rejected"
                                 ? "Abgelehnt"
                                 : "In Bearbeitung"}
                             </Badge>
                             <span>
                               {format(new Date(req.created_at), "dd.MM.yyyy", { locale: de })}
                             </span>
                           </div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             )}
           </TabsContent>
         </Tabs>
       </div>
 
       {/* Request Dialog */}
       <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Dokument anfragen</DialogTitle>
           </DialogHeader>
 
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>Dokumentenart *</Label>
               <Select value={requestType} onValueChange={setRequestType}>
                 <SelectTrigger>
                   <SelectValue placeholder="Bitte wählen" />
                 </SelectTrigger>
                 <SelectContent>
                   {requestTypes.map((type) => (
                     <SelectItem key={type.id} value={type.id}>
                       {type.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             <div className="space-y-2">
               <Label>Anmerkungen (optional)</Label>
               <Textarea
                 value={requestNotes}
                 onChange={(e) => setRequestNotes(e.target.value)}
                 placeholder="z.B. Zeitraum, Verwendungszweck..."
                 rows={3}
               />
             </div>
           </div>
 
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
               Abbrechen
             </Button>
             <Button onClick={handleRequestSubmit} disabled={isSubmitting || !requestType}>
               {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               Anfragen
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </TenantLayout>
   );
 }