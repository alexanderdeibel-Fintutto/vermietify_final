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
 import { Separator } from "@/components/ui/separator";
 import { Badge } from "@/components/ui/badge";
 import { 
   User, 
   FileText, 
   Settings2, 
   CheckCircle, 
   ArrowLeft, 
   ArrowRight,
   Upload,
   Mail
 } from "lucide-react";
 import { useLetters, LetterOrder, LetterTemplate } from "@/hooks/useLetters";
 import { cn } from "@/lib/utils";
 
 interface Tenant {
   id: string;
   first_name: string;
   last_name: string;
   address?: string | null;
   postal_code?: string | null;
   city?: string | null;
 }
 
 interface LetterComposerDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   tenants?: Tenant[];
 }
 
 const steps = [
   { id: 1, title: "Empfänger", icon: User },
   { id: 2, title: "Inhalt", icon: FileText },
   { id: 3, title: "Versandoptionen", icon: Settings2 },
   { id: 4, title: "Zusammenfassung", icon: CheckCircle },
 ];
 
 export function LetterComposerDialog({ open, onOpenChange, tenants = [] }: LetterComposerDialogProps) {
   const { templates, createOrder, sendLetter, calculateCost } = useLetters();
   const [currentStep, setCurrentStep] = useState(1);
   const [recipientType, setRecipientType] = useState<"tenant" | "manual">("tenant");
   const [selectedTenantId, setSelectedTenantId] = useState<string>("");
   const [manualAddress, setManualAddress] = useState({
     name: "",
     street: "",
     postal_code: "",
     city: "",
     country: "Deutschland",
   });
   const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
   const [subject, setSubject] = useState("");
   const [content, setContent] = useState("");
   const [contentType, setContentType] = useState<"template" | "upload">("template");
   const [options, setOptions] = useState<LetterOrder["options"]>({
     color: false,
     duplex: false,
     registered: "none",
     priority: "standard",
   });
   const [scheduleType, setScheduleType] = useState<"now" | "scheduled">("now");
   const [confirmed, setConfirmed] = useState(false);
 
   const selectedTenant = tenants.find(t => t.id === selectedTenantId);
   const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
 
   const recipientAddress = recipientType === "tenant" && selectedTenant
     ? {
         name: `${selectedTenant.first_name} ${selectedTenant.last_name}`,
         street: selectedTenant.address || "",
         postal_code: selectedTenant.postal_code || "",
         city: selectedTenant.city || "",
         country: "Deutschland",
       }
     : manualAddress;
 
   const isAddressComplete = 
     recipientAddress.name && 
     recipientAddress.street && 
     recipientAddress.postal_code && 
     recipientAddress.city;
 
   const estimatedCost = calculateCost(options, 1);
 
   const handleTemplateSelect = (templateId: string) => {
     setSelectedTemplateId(templateId);
     const template = templates.find(t => t.id === templateId);
     if (template) {
       setSubject(template.subject || "");
       setContent(template.content);
     }
   };
 
   const handleNext = () => {
     if (currentStep < 4) {
       setCurrentStep(currentStep + 1);
     }
   };
 
   const handleBack = () => {
     if (currentStep > 1) {
       setCurrentStep(currentStep - 1);
     }
   };
 
   const handleSaveDraft = async () => {
     await createOrder.mutateAsync({
       recipient_type: recipientType,
       recipient_id: recipientType === "tenant" ? selectedTenantId : null,
       recipient_address: recipientAddress,
       template_id: selectedTemplateId || null,
       subject,
       options,
       status: "draft",
       pages: 1,
     } as Partial<LetterOrder>);
     resetAndClose();
   };
 
   const handleSend = async () => {
     const result = await createOrder.mutateAsync({
       recipient_type: recipientType,
       recipient_id: recipientType === "tenant" ? selectedTenantId : null,
       recipient_address: recipientAddress,
       template_id: selectedTemplateId || null,
       subject,
       options,
       status: "draft",
       pages: 1,
     } as Partial<LetterOrder>);
     
     if (result?.id) {
       await sendLetter.mutateAsync(result.id);
     }
     resetAndClose();
   };
 
   const resetAndClose = () => {
     setCurrentStep(1);
     setRecipientType("tenant");
     setSelectedTenantId("");
     setManualAddress({ name: "", street: "", postal_code: "", city: "", country: "Deutschland" });
     setSelectedTemplateId("");
     setSubject("");
     setContent("");
     setOptions({ color: false, duplex: false, registered: "none", priority: "standard" });
     setConfirmed(false);
     onOpenChange(false);
   };
 
   const canProceed = () => {
     switch (currentStep) {
       case 1: return isAddressComplete;
       case 2: return subject.trim().length > 0;
       case 3: return true;
       case 4: return confirmed;
       default: return false;
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Mail className="h-5 w-5" />
             Neuer Brief
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
         <div className="min-h-[300px]">
           {/* Step 1: Recipient */}
           {currentStep === 1 && (
             <div className="space-y-4">
               <RadioGroup value={recipientType} onValueChange={(v) => setRecipientType(v as "tenant" | "manual")}>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="tenant" id="tenant" />
                   <Label htmlFor="tenant">Mieter auswählen</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="manual" id="manual" />
                   <Label htmlFor="manual">Manuell eingeben</Label>
                 </div>
               </RadioGroup>
 
               {recipientType === "tenant" && (
                 <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                   <SelectTrigger>
                     <SelectValue placeholder="Mieter wählen..." />
                   </SelectTrigger>
                   <SelectContent>
                     {tenants.map(tenant => (
                       <SelectItem key={tenant.id} value={tenant.id}>
                         {tenant.first_name} {tenant.last_name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               )}
 
               {(recipientType === "manual" || selectedTenant) && (
                 <Card>
                   <CardHeader>
                     <CardTitle className="text-sm">Empfängeradresse</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-3">
                     <div>
                       <Label>Name</Label>
                       <Input 
                         value={recipientAddress.name}
                         onChange={(e) => recipientType === "manual" && setManualAddress({...manualAddress, name: e.target.value})}
                         disabled={recipientType === "tenant"}
                       />
                     </div>
                     <div>
                       <Label>Straße</Label>
                       <Input 
                         value={recipientAddress.street}
                         onChange={(e) => recipientType === "manual" && setManualAddress({...manualAddress, street: e.target.value})}
                         disabled={recipientType === "tenant"}
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <Label>PLZ</Label>
                         <Input 
                           value={recipientAddress.postal_code}
                           onChange={(e) => recipientType === "manual" && setManualAddress({...manualAddress, postal_code: e.target.value})}
                           disabled={recipientType === "tenant"}
                         />
                       </div>
                       <div>
                         <Label>Ort</Label>
                         <Input 
                           value={recipientAddress.city}
                           onChange={(e) => recipientType === "manual" && setManualAddress({...manualAddress, city: e.target.value})}
                           disabled={recipientType === "tenant"}
                         />
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               )}
 
               {!isAddressComplete && recipientType === "manual" && (
                 <p className="text-sm text-destructive">Bitte alle Adressfelder ausfüllen</p>
               )}
             </div>
           )}
 
           {/* Step 2: Content */}
           {currentStep === 2 && (
             <div className="space-y-4">
               <RadioGroup value={contentType} onValueChange={(v) => setContentType(v as "template" | "upload")}>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="template" id="template" />
                   <Label htmlFor="template">Aus Vorlage erstellen</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="upload" id="upload" />
                   <Label htmlFor="upload">PDF hochladen</Label>
                 </div>
               </RadioGroup>
 
               {contentType === "template" && (
                 <>
                   <div>
                     <Label>Vorlage</Label>
                     <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                       <SelectTrigger>
                         <SelectValue placeholder="Vorlage wählen..." />
                       </SelectTrigger>
                       <SelectContent>
                         {templates.map(template => (
                           <SelectItem key={template.id} value={template.id}>
                             {template.name}
                             {template.is_system && <Badge variant="secondary" className="ml-2">System</Badge>}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
 
                   <div>
                     <Label>Betreff</Label>
                     <Input 
                       value={subject}
                       onChange={(e) => setSubject(e.target.value)}
                       placeholder="Betreff des Briefes"
                     />
                   </div>
 
                   <div>
                     <Label>Inhalt</Label>
                     <Textarea 
                       value={content}
                       onChange={(e) => setContent(e.target.value)}
                       rows={10}
                       placeholder="Briefinhalt..."
                     />
                     {selectedTemplate?.placeholders && (selectedTemplate.placeholders as string[]).length > 0 && (
                       <div className="mt-2">
                         <p className="text-sm text-muted-foreground mb-1">Verfügbare Platzhalter:</p>
                         <div className="flex flex-wrap gap-1">
                           {(selectedTemplate.placeholders as string[]).map(p => (
                             <Badge key={p} variant="outline" className="text-xs">
                               {`{{${p}}}`}
                             </Badge>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 </>
               )}
 
               {contentType === "upload" && (
                 <div className="border-2 border-dashed rounded-lg p-8 text-center">
                   <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                   <p className="text-muted-foreground mb-2">PDF-Datei hier ablegen oder</p>
                   <Button variant="outline">Datei auswählen</Button>
                   <div className="mt-4">
                     <Label>Betreff</Label>
                     <Input 
                       value={subject}
                       onChange={(e) => setSubject(e.target.value)}
                       placeholder="Betreff für die Zuordnung"
                       className="mt-1"
                     />
                   </div>
                 </div>
               )}
             </div>
           )}
 
           {/* Step 3: Options */}
           {currentStep === 3 && (
             <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <Card>
                   <CardContent className="pt-4">
                     <div className="flex items-center space-x-2">
                       <Checkbox 
                         id="color"
                         checked={options.color}
                         onCheckedChange={(checked) => setOptions({...options, color: !!checked})}
                       />
                       <Label htmlFor="color">Farbdruck (+0,20 €)</Label>
                     </div>
                   </CardContent>
                 </Card>
                 <Card>
                   <CardContent className="pt-4">
                     <div className="flex items-center space-x-2">
                       <Checkbox 
                         id="duplex"
                         checked={options.duplex}
                         onCheckedChange={(checked) => setOptions({...options, duplex: !!checked})}
                       />
                       <Label htmlFor="duplex">Doppelseitig (+0,10 €)</Label>
                     </div>
                   </CardContent>
                 </Card>
               </div>
 
               <div>
                 <Label className="text-base">Einschreiben</Label>
                 <RadioGroup 
                   value={options.registered} 
                   onValueChange={(v) => setOptions({...options, registered: v as "none" | "einwurf" | "rueckschein"})}
                   className="mt-2"
                 >
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="none" id="none" />
                     <Label htmlFor="none">Kein Einschreiben</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="einwurf" id="einwurf" />
                     <Label htmlFor="einwurf">Einwurf-Einschreiben (+2,50 €)</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="rueckschein" id="rueckschein" />
                     <Label htmlFor="rueckschein">Einschreiben mit Rückschein (+4,50 €)</Label>
                   </div>
                 </RadioGroup>
               </div>
 
               <div>
                 <Label className="text-base">Priorität</Label>
                 <RadioGroup 
                   value={options.priority || "standard"} 
                   onValueChange={(v) => setOptions({...options, priority: v as "standard" | "express"})}
                   className="mt-2"
                 >
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="standard" id="standard" />
                     <Label htmlFor="standard">Standard</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="express" id="express" />
                     <Label htmlFor="express">Express (+1,50 €)</Label>
                   </div>
                 </RadioGroup>
               </div>
 
               <div>
                 <Label className="text-base">Versandzeitpunkt</Label>
                 <RadioGroup 
                   value={scheduleType} 
                   onValueChange={(v) => setScheduleType(v as "now" | "scheduled")}
                   className="mt-2"
                 >
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="now" id="now" />
                     <Label htmlFor="now">Sofort versenden</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <RadioGroupItem value="scheduled" id="scheduled" />
                     <Label htmlFor="scheduled">Geplant (coming soon)</Label>
                   </div>
                 </RadioGroup>
               </div>
             </div>
           )}
 
           {/* Step 4: Summary */}
           {currentStep === 4 && (
             <div className="space-y-4">
               <Card>
                 <CardHeader>
                   <CardTitle className="text-sm">Empfänger</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p>{recipientAddress.name}</p>
                   <p className="text-muted-foreground">{recipientAddress.street}</p>
                   <p className="text-muted-foreground">{recipientAddress.postal_code} {recipientAddress.city}</p>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardHeader>
                   <CardTitle className="text-sm">Brief</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="font-medium">{subject}</p>
                   <p className="text-sm text-muted-foreground mt-1">
                     {selectedTemplate ? `Vorlage: ${selectedTemplate.name}` : "Eigener Inhalt"}
                   </p>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardHeader>
                   <CardTitle className="text-sm">Kostenaufstellung</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-2">
                   <div className="flex justify-between">
                     <span>Druck & Porto</span>
                     <span>0,90 €</span>
                   </div>
                   {options.color && (
                     <div className="flex justify-between text-muted-foreground">
                       <span>Farbdruck</span>
                       <span>0,20 €</span>
                     </div>
                   )}
                   {options.duplex && (
                     <div className="flex justify-between text-muted-foreground">
                       <span>Doppelseitig</span>
                       <span>0,10 €</span>
                     </div>
                   )}
                   {options.registered === "einwurf" && (
                     <div className="flex justify-between text-muted-foreground">
                       <span>Einwurf-Einschreiben</span>
                       <span>2,50 €</span>
                     </div>
                   )}
                   {options.registered === "rueckschein" && (
                     <div className="flex justify-between text-muted-foreground">
                       <span>Einschreiben Rückschein</span>
                       <span>4,50 €</span>
                     </div>
                   )}
                   {options.priority === "express" && (
                     <div className="flex justify-between text-muted-foreground">
                       <span>Express</span>
                       <span>1,50 €</span>
                     </div>
                   )}
                   <Separator />
                   <div className="flex justify-between font-bold">
                     <span>Gesamt</span>
                     <span>{(estimatedCost / 100).toFixed(2)} €</span>
                   </div>
                 </CardContent>
               </Card>
 
               <div className="flex items-center space-x-2">
                 <Checkbox 
                   id="confirm"
                   checked={confirmed}
                   onCheckedChange={(checked) => setConfirmed(!!checked)}
                 />
                 <Label htmlFor="confirm">Ich bestätige den Versand dieses Briefes</Label>
               </div>
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
                 disabled={!confirmed || sendLetter.isPending}
               >
                 {sendLetter.isPending ? "Wird gesendet..." : "Jetzt versenden"}
               </Button>
             )}
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }