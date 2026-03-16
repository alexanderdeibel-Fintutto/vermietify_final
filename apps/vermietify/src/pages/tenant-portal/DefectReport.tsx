 import { useState, useRef } from "react";
 import { useNavigate } from "react-router-dom";
 import { TenantLayout } from "@/components/tenant-portal/TenantLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
 import { useTenantPortal } from "@/hooks/useTenantPortal";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import {
   Droplets,
   Flame,
   Zap,
   DoorOpen,
   MoreHorizontal,
   Camera,
   Upload,
   X,
   ArrowLeft,
   ArrowRight,
   Check,
   Loader2,
   AlertTriangle,
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 const categories = [
   { id: "water_damage", label: "Wasser", icon: Droplets, color: "text-cyan-500 bg-cyan-50" },
   { id: "heating", label: "Heizung", icon: Flame, color: "text-orange-500 bg-orange-50" },
   { id: "electrical", label: "Elektro", icon: Zap, color: "text-yellow-500 bg-yellow-50" },
   { id: "doors_windows", label: "Fenster/Türen", icon: DoorOpen, color: "text-purple-500 bg-purple-50" },
   { id: "other", label: "Sonstiges", icon: MoreHorizontal, color: "text-gray-500 bg-gray-50" },
 ];
 
 const priorities = [
   { id: "low", label: "Kann warten", description: "Kein dringender Handlungsbedarf" },
   { id: "high", label: "Dringend", description: "Sollte bald behoben werden" },
   { id: "urgent", label: "Notfall", description: "Sofortige Hilfe erforderlich" },
 ];
 
 export default function DefectReport() {
   const navigate = useNavigate();
   const { toast } = useToast();
   const { user } = useAuth();
   const { useTenantAccess } = useTenantPortal();
   const { data: access } = useTenantAccess();
 
   const [step, setStep] = useState(1);
   const [category, setCategory] = useState<string>("");
   const [title, setTitle] = useState("");
   const [description, setDescription] = useState("");
   const [priority, setPriority] = useState<string>("low");
   const [files, setFiles] = useState<File[]>([]);
   const [previews, setPreviews] = useState<string[]>([]);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [ticketNumber, setTicketNumber] = useState<string>("");
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   const handleFileSelect = (selectedFiles: FileList | null) => {
     if (!selectedFiles) return;
     const newFiles = Array.from(selectedFiles);
     setFiles((prev) => [...prev, ...newFiles]);
     newFiles.forEach((file) => {
       setPreviews((prev) => [...prev, URL.createObjectURL(file)]);
     });
   };
 
   const removeFile = (index: number) => {
     setFiles((prev) => prev.filter((_, i) => i !== index));
     URL.revokeObjectURL(previews[index]);
     setPreviews((prev) => prev.filter((_, i) => i !== index));
   };
 
   const handleSubmit = async () => {
     if (!user || !access) return;
 
     setIsSubmitting(true);
 
     try {
       const unit = access.unit as any;
       
       // Create task
       const { data: task, error: taskError } = await supabase
         .from("tasks")
         .insert({
           organization_id: unit.building.organization_id,
           building_id: unit.building_id,
           unit_id: unit.id,
           title,
           description,
           category: category === "doors_windows" ? "other" : category,
           priority,
           status: "open",
           source: "tenant",
           created_by: user.id,
         } as any)
         .select()
         .single();
 
       if (taskError) throw taskError;
 
       // Upload files
       for (const file of files) {
         const fileExt = file.name.split(".").pop();
         const fileName = `${user.id}/${task.id}/${Date.now()}.${fileExt}`;
 
         const { error: uploadError } = await supabase.storage
           .from("task-attachments")
           .upload(fileName, file);
 
         if (!uploadError) {
           await supabase.from("task_attachments").insert({
             task_id: task.id,
             file_path: fileName,
             file_type: "image",
             uploaded_by: user.id,
           });
         }
       }
 
       // Log activity
       await supabase.from("task_activities").insert({
         task_id: task.id,
         user_id: user.id,
         action: "created",
         new_value: "Meldung vom Mieter erstellt",
       });
 
       setTicketNumber(task.id.slice(0, 8).toUpperCase());
       setStep(4);
     } catch (error: any) {
       toast({
         title: "Fehler",
         description: error.message || "Meldung konnte nicht erstellt werden.",
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const canProceed = () => {
     if (step === 1) return !!category;
     if (step === 2) return !!title.trim();
     return true;
   };
 
   return (
     <TenantLayout>
       <div className="max-w-2xl mx-auto space-y-6">
         {/* Header */}
         <div>
           <h1 className="text-2xl font-bold">Mangel melden</h1>
           <p className="text-muted-foreground">
             Teilen Sie uns Ihr Problem mit, wir kümmern uns darum.
           </p>
         </div>
 
         {/* Progress Steps */}
         {step < 4 && (
           <div className="flex items-center gap-2">
             {[1, 2, 3].map((s) => (
               <div key={s} className="flex items-center gap-2">
                 <div
                   className={cn(
                     "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                     s === step
                       ? "bg-primary text-primary-foreground"
                       : s < step
                       ? "bg-green-500 text-white"
                       : "bg-muted text-muted-foreground"
                   )}
                 >
                   {s < step ? <Check className="h-4 w-4" /> : s}
                 </div>
                 {s < 3 && (
                   <div
                     className={cn(
                       "h-1 w-16",
                       s < step ? "bg-green-500" : "bg-muted"
                     )}
                   />
                 )}
               </div>
             ))}
           </div>
         )}
 
         {/* Step 1: Category */}
         {step === 1 && (
           <Card>
             <CardHeader>
               <CardTitle>1. Kategorie wählen</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                 {categories.map((cat) => (
                   <button
                     key={cat.id}
                     type="button"
                     onClick={() => setCategory(cat.id)}
                     className={cn(
                       "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                       category === cat.id
                         ? "border-primary bg-primary/5"
                         : "border-border hover:border-primary/50"
                     )}
                   >
                     <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", cat.color)}>
                       <cat.icon className="h-6 w-6" />
                     </div>
                     <span className="text-sm font-medium">{cat.label}</span>
                   </button>
                 ))}
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Step 2: Details */}
         {step === 2 && (
           <Card>
             <CardHeader>
               <CardTitle>2. Details angeben</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="title">Titel *</Label>
                 <Input
                   id="title"
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   placeholder="z.B. Heizung funktioniert nicht"
                 />
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="description">Beschreibung</Label>
                 <Textarea
                   id="description"
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="Beschreiben Sie das Problem genauer..."
                   rows={4}
                 />
               </div>
 
               <div className="space-y-2">
                 <Label>Dringlichkeit</Label>
                 <RadioGroup value={priority} onValueChange={setPriority}>
                   {priorities.map((p) => (
                     <div key={p.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                       <RadioGroupItem value={p.id} id={p.id} className="mt-0.5" />
                       <div>
                         <Label htmlFor={p.id} className="cursor-pointer font-medium">
                           {p.label}
                         </Label>
                         <p className="text-sm text-muted-foreground">{p.description}</p>
                       </div>
                     </div>
                   ))}
                 </RadioGroup>
               </div>
 
               <div className="space-y-2">
                 <Label>Fotos</Label>
                 <div className="flex gap-2">
                   <Button type="button" variant="outline" className="relative">
                     <input
                       type="file"
                       accept="image/*"
                       capture="environment"
                       multiple
                       className="absolute inset-0 opacity-0 cursor-pointer"
                       onChange={(e) => handleFileSelect(e.target.files)}
                     />
                     <Camera className="h-4 w-4 mr-2" />
                     Kamera
                   </Button>
                   <Button type="button" variant="outline" className="relative">
                     <input
                       ref={fileInputRef}
                       type="file"
                       accept="image/*"
                       multiple
                       className="absolute inset-0 opacity-0 cursor-pointer"
                       onChange={(e) => handleFileSelect(e.target.files)}
                     />
                     <Upload className="h-4 w-4 mr-2" />
                     Datei
                   </Button>
                 </div>
 
                 {previews.length > 0 && (
                   <div className="grid grid-cols-4 gap-2 mt-2">
                     {previews.map((url, i) => (
                       <div key={i} className="relative aspect-square">
                         <img
                           src={url}
                           alt={`Preview ${i + 1}`}
                           className="w-full h-full object-cover rounded-lg"
                         />
                         <Button
                           type="button"
                           variant="destructive"
                           size="icon"
                           className="absolute top-1 right-1 h-6 w-6"
                           onClick={() => removeFile(i)}
                         >
                           <X className="h-3 w-3" />
                         </Button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Step 3: Summary */}
         {step === 3 && (
           <Card>
             <CardHeader>
               <CardTitle>3. Zusammenfassung</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-3">
                 <div className="flex justify-between py-2 border-b">
                   <span className="text-muted-foreground">Kategorie</span>
                   <span className="font-medium">
                     {categories.find((c) => c.id === category)?.label}
                   </span>
                 </div>
                 <div className="flex justify-between py-2 border-b">
                   <span className="text-muted-foreground">Titel</span>
                   <span className="font-medium">{title}</span>
                 </div>
                 <div className="flex justify-between py-2 border-b">
                   <span className="text-muted-foreground">Dringlichkeit</span>
                   <span className="font-medium">
                     {priorities.find((p) => p.id === priority)?.label}
                   </span>
                 </div>
                 <div className="flex justify-between py-2 border-b">
                   <span className="text-muted-foreground">Fotos</span>
                   <span className="font-medium">{files.length} Datei(en)</span>
                 </div>
                 {description && (
                   <div className="py-2">
                     <span className="text-muted-foreground">Beschreibung:</span>
                     <p className="mt-1">{description}</p>
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Step 4: Confirmation */}
         {step === 4 && (
           <Card className="text-center">
             <CardContent className="py-12 space-y-4">
               <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                 <Check className="h-8 w-8 text-green-600" />
               </div>
               <h2 className="text-xl font-bold">Meldung erfolgreich erstellt!</h2>
               <p className="text-muted-foreground">
                 Ihre Meldung wurde an Ihren Vermieter weitergeleitet.
               </p>
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                 <AlertTriangle className="h-4 w-4" />
                 <span className="font-mono font-medium">Ticket: #{ticketNumber}</span>
               </div>
               <div className="pt-4">
                 <Button onClick={() => navigate("/mieter-portal")}>
                   Zurück zum Dashboard
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Navigation */}
         {step < 4 && (
           <div className="flex justify-between">
             <Button
               variant="outline"
               onClick={() => setStep((s) => Math.max(1, s - 1))}
               disabled={step === 1}
             >
               <ArrowLeft className="h-4 w-4 mr-2" />
               Zurück
             </Button>
             {step < 3 ? (
               <Button
                 onClick={() => setStep((s) => s + 1)}
                 disabled={!canProceed()}
               >
                 Weiter
                 <ArrowRight className="h-4 w-4 ml-2" />
               </Button>
             ) : (
               <Button onClick={handleSubmit} disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                 Absenden
               </Button>
             )}
           </div>
         )}
       </div>
     </TenantLayout>
   );
 }