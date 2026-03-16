  import { useState, useEffect, useCallback } from "react";
  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { Button } from "@/components/ui/button";
 import { Card } from "@/components/ui/card";
 import {
   Dialog,
   DialogContent,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Input } from "@/components/ui/input";
 import { Camera, Upload, X, Loader2, Image as ImageIcon, FileText } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 interface TaskAttachmentsProps {
   taskId: string;
 }
 
 interface Attachment {
   id: string;
   task_id: string;
   file_path: string;
   file_type: string;
   uploaded_by: string | null;
   created_at: string;
 }
 
 export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
   const [selectedImage, setSelectedImage] = useState<string | null>(null);
   const [isUploading, setIsUploading] = useState(false);
   const { user } = useAuth();
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   // Fetch attachments
   const { data: attachments = [], isLoading } = useQuery({
     queryKey: ["task-attachments", taskId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("task_attachments")
         .select("*")
         .eq("task_id", taskId)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       return data as Attachment[];
     },
   });
 
   // Delete attachment mutation
   const deleteAttachment = useMutation({
     mutationFn: async (attachment: Attachment) => {
       // Delete from storage
       const { error: storageError } = await supabase.storage
         .from("task-attachments")
         .remove([attachment.file_path]);
 
       if (storageError) throw storageError;
 
       // Delete from database
       const { error: dbError } = await supabase
         .from("task_attachments")
         .delete()
         .eq("id", attachment.id);
 
       if (dbError) throw dbError;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["task-attachments", taskId] });
       toast({ title: "Anhang gelöscht" });
     },
     onError: (error: Error) => {
       toast({
         title: "Fehler",
         description: error.message,
         variant: "destructive",
       });
     },
   });
 
   const handleFileUpload = async (files: FileList | null) => {
     if (!files || !user) return;
 
     setIsUploading(true);
     try {
       for (const file of Array.from(files)) {
         const fileExt = file.name.split(".").pop();
         const fileName = `${user.id}/${taskId}/${Date.now()}.${fileExt}`;
         const fileType = file.type.startsWith("image/") ? "image" : "document";
 
         // Upload to storage
         const { error: uploadError } = await supabase.storage
           .from("task-attachments")
           .upload(fileName, file);
 
         if (uploadError) throw uploadError;
 
         // Save to database
         const { error: dbError } = await supabase.from("task_attachments").insert({
           task_id: taskId,
           file_path: fileName,
           file_type: fileType,
           uploaded_by: user.id,
         });
 
         if (dbError) throw dbError;
       }
 
       queryClient.invalidateQueries({ queryKey: ["task-attachments", taskId] });
       toast({ title: "Dateien hochgeladen" });
     } catch (error: any) {
       toast({
         title: "Fehler beim Upload",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setIsUploading(false);
     }
   };
 
    // State for signed URLs
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

    const resolveSignedUrls = useCallback(async (items: Attachment[]) => {
      const urls: Record<string, string> = {};
      await Promise.all(
        items.map(async (item) => {
          const { data } = await supabase.storage
            .from("task-attachments")
            .createSignedUrl(item.file_path, 3600);
          if (data?.signedUrl) {
            urls[item.file_path] = data.signedUrl;
          }
        })
      );
      setSignedUrls((prev) => ({ ...prev, ...urls }));
    }, []);

    useEffect(() => {
      if (attachments.length > 0) {
        resolveSignedUrls(attachments);
      }
    }, [attachments, resolveSignedUrls]);

    const getFileUrl = (filePath: string) => {
      return signedUrls[filePath] || "";
    };
 
   const images = attachments.filter((a) => a.file_type === "image");
   const documents = attachments.filter((a) => a.file_type === "document");
 
   return (
     <div className="space-y-6">
       {/* Upload buttons */}
       <div className="flex gap-2">
         <Button variant="outline" className="relative" disabled={isUploading}>
           <Input
             type="file"
             accept="image/*"
             capture="environment"
             multiple
             className="absolute inset-0 opacity-0 cursor-pointer"
             onChange={(e) => handleFileUpload(e.target.files)}
           />
           {isUploading ? (
             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
           ) : (
             <Camera className="h-4 w-4 mr-2" />
           )}
           Foto aufnehmen
         </Button>
         <Button variant="outline" className="relative" disabled={isUploading}>
           <Input
             type="file"
             accept="image/*,.pdf,.doc,.docx"
             multiple
             className="absolute inset-0 opacity-0 cursor-pointer"
             onChange={(e) => handleFileUpload(e.target.files)}
           />
           {isUploading ? (
             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
           ) : (
             <Upload className="h-4 w-4 mr-2" />
           )}
           Datei hochladen
         </Button>
       </div>
 
       {/* Photo gallery */}
       {images.length > 0 && (
         <div>
           <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
             <ImageIcon className="h-4 w-4" />
             Fotos ({images.length})
           </h4>
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
             {images.map((img) => (
               <div key={img.id} className="relative group aspect-square">
                  <img
                    src={getFileUrl(img.file_path)}
                    alt="Anhang"
                    className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage(getFileUrl(img.file_path))}
                 />
                 <Button
                   variant="destructive"
                   size="icon"
                   className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                   onClick={(e) => {
                     e.stopPropagation();
                     deleteAttachment.mutate(img);
                   }}
                 >
                   <X className="h-3 w-3" />
                 </Button>
               </div>
             ))}
           </div>
         </div>
       )}
 
       {/* Documents */}
       {documents.length > 0 && (
         <div>
           <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
             <FileText className="h-4 w-4" />
             Dokumente ({documents.length})
           </h4>
           <div className="space-y-2">
             {documents.map((doc) => (
               <Card key={doc.id} className="p-3 flex items-center justify-between">
                 <a
                   href={getFileUrl(doc.file_path)}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center gap-2 text-sm hover:underline"
                 >
                   <FileText className="h-4 w-4 text-muted-foreground" />
                   {doc.file_path.split("/").pop()}
                 </a>
                 <div className="flex items-center gap-2">
                   <span className="text-xs text-muted-foreground">
                     {format(new Date(doc.created_at), "dd.MM.yyyy", { locale: de })}
                   </span>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-6 w-6"
                     onClick={() => deleteAttachment.mutate(doc)}
                   >
                     <X className="h-3 w-3" />
                   </Button>
                 </div>
               </Card>
             ))}
           </div>
         </div>
       )}
 
       {attachments.length === 0 && !isLoading && (
         <p className="text-sm text-muted-foreground text-center py-4">
           Noch keine Anhänge vorhanden.
         </p>
       )}
 
       {/* Lightbox */}
       <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
         <DialogContent className="max-w-4xl p-0">
           <DialogTitle className="sr-only">Bildvorschau</DialogTitle>
           {selectedImage && (
             <img
               src={selectedImage}
               alt="Vollbild"
               className="w-full h-auto max-h-[80vh] object-contain"
             />
           )}
         </DialogContent>
       </Dialog>
     </div>
   );
 }