 import { useState } from "react";
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Checkbox } from "@/components/ui/checkbox";
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import { 
   FileText, 
   Users, 
   MousePointer2,
   Settings2,
   ArrowLeft, 
   ArrowRight,
   Upload,
   Plus,
   Trash2,
   User,
   Building2,
   Eye
 } from "lucide-react";
 import { useSignatures, Signer, SignatureOrder } from "@/hooks/useSignatures";
 import { useTenants } from "@/hooks/useTenants";
 import { cn } from "@/lib/utils";
 
 interface SignatureRequestDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 const steps = [
   { id: 1, title: "Dokument", icon: FileText },
   { id: 2, title: "Unterzeichner", icon: Users },
   { id: 3, title: "Signaturfelder", icon: MousePointer2 },
   { id: 4, title: "Optionen", icon: Settings2 },
 ];
 
 const documentTypes = [
   { value: "mietvertrag", label: "Mietvertrag" },
   { value: "nachtrag", label: "Nachtrag zum Mietvertrag" },
   { value: "kuendigung", label: "Kündigung" },
   { value: "uebergabeprotokoll", label: "Übergabeprotokoll" },
   { value: "other", label: "Sonstiges" },
 ];
 
 const roleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
   tenant: { label: "Mieter", icon: <User className="h-4 w-4" /> },
   landlord: { label: "Vermieter", icon: <Building2 className="h-4 w-4" /> },
   witness: { label: "Zeuge", icon: <Eye className="h-4 w-4" /> },
 };
 
 export function SignatureRequestDialog({ open, onOpenChange }: SignatureRequestDialogProps) {
   const { createOrder, sendRequest } = useSignatures();
   const { useTenantsList } = useTenants();
   const { data: tenants = [] } = useTenantsList();
   
   const [currentStep, setCurrentStep] = useState(1);
   const [documentName, setDocumentName] = useState("");
   const [documentType, setDocumentType] = useState("mietvertrag");
   const [documentSource, setDocumentSource] = useState<"upload" | "existing">("upload");
   const [signers, setSigners] = useState<Signer[]>([
     { name: "", email: "", role: "tenant", order: 1, status: "pending" },
     { name: "", email: "", role: "landlord", order: 2, status: "pending" },
   ]);
   const [signingOrder, setSigningOrder] = useState<"parallel" | "sequential">("parallel");
   const [expiryDays, setExpiryDays] = useState(14);
   const [reminderEnabled, setReminderEnabled] = useState(true);
   const [reminderDays, setReminderDays] = useState([3, 7, 10]);
   const [message, setMessage] = useState("");
   const [saveToDocuments, setSaveToDocuments] = useState(true);
 
   const addSigner = () => {
     setSigners([...signers, {
       name: "",
       email: "",
       role: "witness",
       order: signers.length + 1,
       status: "pending",
     }]);
   };
 
   const removeSigner = (index: number) => {
     if (signers.length <= 1) return;
     const newSigners = signers.filter((_, i) => i !== index);
     // Reorder
     setSigners(newSigners.map((s, i) => ({ ...s, order: i + 1 })));
   };
 
   const updateSigner = (index: number, updates: Partial<Signer>) => {
     const newSigners = [...signers];
     newSigners[index] = { ...newSigners[index], ...updates };
     setSigners(newSigners);
   };
 
   const selectTenantForSigner = (index: number, tenantId: string) => {
     const tenant = tenants.find(t => t.id === tenantId);
     if (tenant) {
       updateSigner(index, {
         name: `${tenant.first_name} ${tenant.last_name}`,
         email: tenant.email || "",
       });
     }
   };
 
   const handleNext = () => {
     if (currentStep < 4) setCurrentStep(currentStep + 1);
   };
 
   const handleBack = () => {
     if (currentStep > 1) setCurrentStep(currentStep - 1);
   };
 
   const canProceed = () => {
     switch (currentStep) {
       case 1: return documentName.trim().length > 0;
       case 2: return signers.every(s => s.name && s.email);
       case 3: return true; // Signature fields are optional for MVP
       case 4: return true;
       default: return false;
     }
   };
 
   const handleSaveDraft = async () => {
     await createOrder.mutateAsync({
       document_name: documentName,
       document_type: documentType,
       signers: signingOrder === "sequential" ? signers : signers.map(s => ({ ...s, order: 1 })),
       message: message || null,
       expires_at: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString(),
       reminder_days: reminderEnabled ? reminderDays : [],
       status: "draft",
     } as Partial<SignatureOrder>);
     resetAndClose();
   };
 
   const handleSend = async () => {
     const result = await createOrder.mutateAsync({
       document_name: documentName,
       document_type: documentType,
       signers: signingOrder === "sequential" ? signers : signers.map(s => ({ ...s, order: 1 })),
       message: message || null,
       expires_at: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString(),
       reminder_days: reminderEnabled ? reminderDays : [],
       status: "draft",
     } as Partial<SignatureOrder>);
     
     if (result?.id) {
       await sendRequest.mutateAsync(result.id);
     }
     resetAndClose();
   };
 
   const resetAndClose = () => {
     setCurrentStep(1);
     setDocumentName("");
     setDocumentType("mietvertrag");
     setSigners([
       { name: "", email: "", role: "tenant", order: 1, status: "pending" },
       { name: "", email: "", role: "landlord", order: 2, status: "pending" },
     ]);
     setMessage("");
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <FileText className="h-5 w-5" />
             Signatur anfordern
           </DialogTitle>
         </DialogHeader>
 
         {/* Stepper */}
         <div className="flex justify-between mb-6">
           {steps.map((step, idx) => (
             <div key={step.id} className="flex items-center">
               <div className={cn(
                 "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                 currentStep >= step.id 
                   ? "bg-primary border-primary text-primary-foreground" 
                   : "border-muted-foreground/30 text-muted-foreground"
               )}>
                 <step.icon className="h-5 w-5" />
               </div>
               {idx < steps.length - 1 && (
                 <div className={cn(
                   "w-16 h-0.5 mx-2",
                   currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                 )} />
               )}
             </div>
           ))}
         </div>
 
         {/* Step Content */}
         <div className="min-h-[350px]">
           {/* Step 1: Document */}
           {currentStep === 1 && (
             <div className="space-y-4">
               <RadioGroup value={documentSource} onValueChange={(v) => setDocumentSource(v as "upload" | "existing")}>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="upload" id="upload" />
                   <Label htmlFor="upload">PDF hochladen</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="existing" id="existing" />
                   <Label htmlFor="existing">Aus Dokumenten wählen</Label>
                 </div>
               </RadioGroup>
 
               {documentSource === "upload" && (
                 <div className="border-2 border-dashed rounded-lg p-8 text-center">
                   <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                   <p className="text-muted-foreground mb-2">PDF-Datei hier ablegen oder</p>
                   <Button variant="outline">Datei auswählen</Button>
                 </div>
               )}
 
               <div>
                 <Label>Dokumentname</Label>
                 <Input
                   value={documentName}
                   onChange={(e) => setDocumentName(e.target.value)}
                   placeholder="z.B. Mietvertrag Müller"
                 />
               </div>
 
               <div>
                 <Label>Dokumenttyp</Label>
                 <Select value={documentType} onValueChange={setDocumentType}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {documentTypes.map(type => (
                       <SelectItem key={type.value} value={type.value}>
                         {type.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
           )}
 
           {/* Step 2: Signers */}
           {currentStep === 2 && (
             <div className="space-y-4">
               <div>
                 <Label className="text-base">Unterschriftsreihenfolge</Label>
                 <RadioGroup 
                   value={signingOrder} 
                   onValueChange={(v) => setSigningOrder(v as "parallel" | "sequential")}
                   className="mt-2"
                 >
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="parallel" id="parallel" />
                     <Label htmlFor="parallel">Parallel (alle gleichzeitig)</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="sequential" id="sequential" />
                     <Label htmlFor="sequential">Sequenziell (nacheinander)</Label>
                   </div>
                 </RadioGroup>
               </div>
 
               <Separator />
 
               <div className="space-y-4">
                 {signers.map((signer, index) => (
                   <Card key={index}>
                     <CardHeader className="py-3">
                       <div className="flex items-center justify-between">
                         <CardTitle className="text-sm flex items-center gap-2">
                           {signingOrder === "sequential" && (
                             <Badge variant="outline">{signer.order}</Badge>
                           )}
                           {roleLabels[signer.role]?.icon}
                           Unterzeichner {index + 1}
                         </CardTitle>
                         {signers.length > 1 && (
                           <Button 
                             variant="ghost" 
                             size="icon"
                             onClick={() => removeSigner(index)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         )}
                       </div>
                     </CardHeader>
                     <CardContent className="space-y-3 pt-0">
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <Label>Rolle</Label>
                           <Select 
                             value={signer.role} 
                             onValueChange={(v) => updateSigner(index, { role: v as Signer["role"] })}
                           >
                             <SelectTrigger>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="tenant">Mieter</SelectItem>
                               <SelectItem value="landlord">Vermieter</SelectItem>
                               <SelectItem value="witness">Zeuge</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         <div>
                           <Label>Aus Mietern wählen</Label>
                           <Select onValueChange={(v) => selectTenantForSigner(index, v)}>
                             <SelectTrigger>
                               <SelectValue placeholder="Optional..." />
                             </SelectTrigger>
                             <SelectContent>
                               {tenants.map(tenant => (
                                 <SelectItem key={tenant.id} value={tenant.id}>
                                   {tenant.first_name} {tenant.last_name}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                       </div>
                       <div>
                         <Label>Name</Label>
                         <Input
                           value={signer.name}
                           onChange={(e) => updateSigner(index, { name: e.target.value })}
                           placeholder="Vollständiger Name"
                         />
                       </div>
                       <div>
                         <Label>E-Mail</Label>
                         <Input
                           type="email"
                           value={signer.email}
                           onChange={(e) => updateSigner(index, { email: e.target.value })}
                           placeholder="email@beispiel.de"
                         />
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
 
               <Button variant="outline" onClick={addSigner} className="w-full">
                 <Plus className="h-4 w-4 mr-2" />
                 Unterzeichner hinzufügen
               </Button>
             </div>
           )}
 
           {/* Step 3: Signature Fields (Simplified) */}
           {currentStep === 3 && (
             <div className="space-y-4">
               <Card>
                 <CardContent className="py-8 text-center">
                   <MousePointer2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                   <h3 className="font-semibold mb-2">Signaturfelder platzieren</h3>
                   <p className="text-sm text-muted-foreground mb-4">
                     Die Platzierung von Signaturfeldern wird in der vollständigen Integration unterstützt.
                     Für den MVP werden Standard-Positionen verwendet.
                   </p>
                   <div className="flex flex-wrap gap-2 justify-center">
                     {signers.map((signer, index) => (
                       <Badge 
                         key={index} 
                         style={{ 
                           backgroundColor: `hsl(${(index * 60) % 360}, 70%, 90%)`,
                           color: `hsl(${(index * 60) % 360}, 70%, 30%)`,
                         }}
                       >
                         {signer.name || `Unterzeichner ${index + 1}`}
                       </Badge>
                     ))}
                   </div>
                 </CardContent>
               </Card>
 
               <div className="bg-muted/50 rounded-lg p-4">
                 <h4 className="font-medium mb-2">Standard-Signaturfelder:</h4>
                 <ul className="text-sm text-muted-foreground space-y-1">
                   <li>• Unterschriftsfeld für jeden Unterzeichner</li>
                   <li>• Datumsfeld (automatisch ausgefüllt)</li>
                   <li>• Ort-Feld (optional)</li>
                 </ul>
               </div>
             </div>
           )}
 
           {/* Step 4: Options */}
           {currentStep === 4 && (
             <div className="space-y-4">
               <div>
                 <Label>Ablaufdatum</Label>
                 <Select value={String(expiryDays)} onValueChange={(v) => setExpiryDays(Number(v))}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="7">7 Tage</SelectItem>
                     <SelectItem value="14">14 Tage (Standard)</SelectItem>
                     <SelectItem value="30">30 Tage</SelectItem>
                     <SelectItem value="60">60 Tage</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
 
               <Card>
                 <CardContent className="pt-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="font-medium">Automatische Erinnerungen</p>
                       <p className="text-sm text-muted-foreground">
                         Nach 3, 7 und 10 Tagen erinnern
                       </p>
                     </div>
                     <Checkbox
                       checked={reminderEnabled}
                       onCheckedChange={(checked) => setReminderEnabled(!!checked)}
                     />
                   </div>
                 </CardContent>
               </Card>
 
               <div>
                 <Label>Nachricht an Unterzeichner (optional)</Label>
                 <Textarea
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   placeholder="Bitte unterschreiben Sie den beigefügten Mietvertrag..."
                   rows={3}
                 />
               </div>
 
               <Card>
                 <CardContent className="pt-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="font-medium">Nach Abschluss speichern</p>
                       <p className="text-sm text-muted-foreground">
                         Signiertes Dokument in Dokumentenverwaltung speichern
                       </p>
                     </div>
                     <Checkbox
                       checked={saveToDocuments}
                       onCheckedChange={(checked) => setSaveToDocuments(!!checked)}
                     />
                   </div>
                 </CardContent>
               </Card>
 
               <Separator />
 
               <Card>
                 <CardHeader>
                   <CardTitle className="text-sm">Zusammenfassung</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-2 text-sm">
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Dokument:</span>
                     <span>{documentName}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Unterzeichner:</span>
                     <span>{signers.length}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Gültig bis:</span>
                     <span>{new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}</span>
                   </div>
                 </CardContent>
               </Card>
             </div>
           )}
         </div>
 
         {/* Navigation */}
         <div className="flex justify-between mt-6">
           <Button 
             variant="outline" 
             onClick={handleBack}
             disabled={currentStep === 1}
           >
             <ArrowLeft className="h-4 w-4 mr-2" />
             Zurück
           </Button>
 
           <div className="flex gap-2">
             {currentStep === 4 && (
               <Button variant="outline" onClick={handleSaveDraft}>
                 Als Entwurf speichern
               </Button>
             )}
             {currentStep < 4 ? (
               <Button onClick={handleNext} disabled={!canProceed()}>
                 Weiter
                 <ArrowRight className="h-4 w-4 ml-2" />
               </Button>
             ) : (
               <Button 
                 onClick={handleSend} 
                 disabled={sendRequest.isPending}
               >
                 {sendRequest.isPending ? "Wird gesendet..." : "Jetzt senden"}
               </Button>
             )}
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }