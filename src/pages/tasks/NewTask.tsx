 import { useState, useRef } from "react";
 import { useNavigate } from "react-router-dom";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
 import { useTasks } from "@/hooks/useTasks";
 import { useBuildings } from "@/hooks/useBuildings";
 import { useUnits } from "@/hooks/useUnits";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { Camera, Upload, X, Loader2 } from "lucide-react";
 import type { TaskCategory, TaskPriority, TaskSource } from "@/types/database";

export default function NewTask() {
   const navigate = useNavigate();
   const { toast } = useToast();
   const { user, profile } = useAuth();
   const { createTask } = useTasks();
   const { useBuildingsList } = useBuildings();
   const { useUnitsList } = useUnits();
   const { data: buildingsResponse } = useBuildingsList();
   const buildings = Array.isArray(buildingsResponse) ? buildingsResponse : (buildingsResponse?.buildings || []);
 
   const [title, setTitle] = useState("");
   const [description, setDescription] = useState("");
   const [buildingId, setBuildingId] = useState<string>("");
   const [unitId, setUnitId] = useState<string>("");
   const [category, setCategory] = useState<TaskCategory>("other");
   const [priority, setPriority] = useState<TaskPriority>("normal");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
   const [previewUrls, setPreviewUrls] = useState<string[]>([]);
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   // Get units for selected building
   const { data: units = [] } = useUnitsList(buildingId || undefined);
 
   const handleFileSelect = (files: FileList | null) => {
     if (!files) return;
     
     const newFiles = Array.from(files);
     setUploadedFiles((prev) => [...prev, ...newFiles]);
     
     // Create preview URLs
     newFiles.forEach((file) => {
       const url = URL.createObjectURL(file);
       setPreviewUrls((prev) => [...prev, url]);
     });
   };
 
   const removeFile = (index: number) => {
     setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
     URL.revokeObjectURL(previewUrls[index]);
     setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!title.trim()) {
       toast({
         title: "Fehler",
         description: "Bitte geben Sie einen Titel ein.",
         variant: "destructive",
       });
       return;
     }
 
     setIsSubmitting(true);
 
     try {
       // Create task
       const task = await createTask.mutateAsync({
         title: title.trim(),
         description: description.trim() || undefined,
         building_id: buildingId || undefined,
         unit_id: unitId || undefined,
         category,
         priority,
         source: "landlord" as TaskSource,
         status: "open",
       });
 
       // Upload attachments
       if (uploadedFiles.length > 0 && user) {
         for (const file of uploadedFiles) {
           const fileExt = file.name.split(".").pop();
           const fileName = `${user.id}/${task.id}/${Date.now()}.${fileExt}`;
 
           const { error: uploadError } = await supabase.storage
             .from("task-attachments")
             .upload(fileName, file);
 
           if (!uploadError) {
             await supabase.from("task_attachments").insert({
               task_id: task.id,
               file_path: fileName,
               file_type: file.type.startsWith("image/") ? "image" : "document",
               uploaded_by: user.id,
             });
           }
         }
       }
 
       // Log activity
       await supabase.from("task_activities").insert({
         task_id: task.id,
         user_id: user?.id,
         action: "created",
         new_value: title,
       });
 
       toast({ title: "Aufgabe erstellt" });
       navigate(`/aufgaben/${task.id}`);
     } catch (error: any) {
       toast({
         title: "Fehler",
         description: error.message || "Aufgabe konnte nicht erstellt werden.",
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
  return (
    <MainLayout 
      title="Neue Aufgabe" 
      breadcrumbs={[
        { label: "Aufgaben", href: "/aufgaben" },
        { label: "Neue Aufgabe" }
      ]}
    >
       <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
         <Card>
           <CardHeader>
             <CardTitle>Aufgabendetails</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             {/* Title */}
             <div className="space-y-2">
               <Label htmlFor="title">Titel *</Label>
               <Input
                 id="title"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 placeholder="z.B. Heizung defekt in Wohnung 3"
                 required
               />
             </div>
 
             {/* Description */}
             <div className="space-y-2">
               <Label htmlFor="description">Beschreibung</Label>
               <Textarea
                 id="description"
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 placeholder="Detaillierte Beschreibung des Problems..."
                 rows={4}
               />
             </div>
 
             {/* Building */}
             <div className="space-y-2">
               <Label>Gebäude</Label>
               <Select value={buildingId} onValueChange={(v) => { setBuildingId(v); setUnitId(""); }}>
                 <SelectTrigger>
                   <SelectValue placeholder="Gebäude auswählen (optional)" />
                 </SelectTrigger>
                 <SelectContent>
                   {buildings.map((b: any) => (
                     <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             {/* Unit (only if building selected) */}
             {buildingId && units.length > 0 && (
               <div className="space-y-2">
                 <Label>Einheit</Label>
                 <Select value={unitId} onValueChange={setUnitId}>
                   <SelectTrigger>
                     <SelectValue placeholder="Einheit auswählen (optional)" />
                   </SelectTrigger>
                   <SelectContent>
                     {units.map((u: any) => (
                       <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}
 
             {/* Category */}
             <div className="space-y-2">
               <Label>Kategorie</Label>
               <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="water_damage">Wasserschaden</SelectItem>
                   <SelectItem value="heating">Heizung</SelectItem>
                   <SelectItem value="electrical">Elektro</SelectItem>
                   <SelectItem value="other">Sonstiges</SelectItem>
                 </SelectContent>
               </Select>
             </div>
 
             {/* Priority */}
             <div className="space-y-2">
               <Label>Priorität</Label>
               <RadioGroup
                 value={priority}
                 onValueChange={(v) => setPriority(v as TaskPriority)}
                 className="flex flex-wrap gap-4"
               >
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="low" id="low" />
                   <Label htmlFor="low" className="cursor-pointer">Niedrig</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="normal" id="normal" />
                   <Label htmlFor="normal" className="cursor-pointer">Normal</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="high" id="high" />
                   <Label htmlFor="high" className="cursor-pointer">Hoch</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="urgent" id="urgent" />
                   <Label htmlFor="urgent" className="cursor-pointer">Dringend</Label>
                 </div>
               </RadioGroup>
             </div>
           </CardContent>
         </Card>
 
         {/* Photos */}
         <Card>
           <CardHeader>
             <CardTitle>Fotos</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
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
                 Foto aufnehmen
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
                 Dateien auswählen
               </Button>
             </div>
 
             {previewUrls.length > 0 && (
               <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                 {previewUrls.map((url, index) => (
                   <div key={index} className="relative aspect-square">
                     <img
                       src={url}
                       alt={`Preview ${index + 1}`}
                       className="w-full h-full object-cover rounded-lg"
                     />
                     <Button
                       type="button"
                       variant="destructive"
                       size="icon"
                       className="absolute top-1 right-1 h-6 w-6"
                       onClick={() => removeFile(index)}
                     >
                       <X className="h-3 w-3" />
                     </Button>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
 
         {/* Actions */}
         <div className="flex gap-3">
           <Button
             type="button"
             variant="outline"
             onClick={() => navigate("/aufgaben")}
           >
             Abbrechen
           </Button>
           <Button type="submit" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
             Aufgabe erstellen
           </Button>
         </div>
       </form>
    </MainLayout>
  );
}
