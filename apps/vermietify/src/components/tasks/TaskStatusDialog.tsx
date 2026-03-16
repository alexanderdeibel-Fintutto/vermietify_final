 import { useState } from "react";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Loader2 } from "lucide-react";
 import type { TaskStatus } from "@/types/database";
 
 interface TaskStatusDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   currentStatus: TaskStatus;
   onSubmit: (status: TaskStatus, comment?: string) => Promise<void>;
 }
 
 const statusOptions: { value: TaskStatus; label: string }[] = [
   { value: "open", label: "Offen" },
   { value: "in_progress", label: "In Bearbeitung" },
   { value: "completed", label: "Erledigt" },
   { value: "cancelled", label: "Abgebrochen" },
 ];
 
 export function TaskStatusDialog({
   open,
   onOpenChange,
   currentStatus,
   onSubmit,
 }: TaskStatusDialogProps) {
   const [status, setStatus] = useState<TaskStatus>(currentStatus);
   const [comment, setComment] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   const handleSubmit = async () => {
     setIsSubmitting(true);
     try {
       await onSubmit(status, comment || undefined);
       onOpenChange(false);
       setComment("");
     } finally {
       setIsSubmitting(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent>
         <DialogHeader>
           <DialogTitle>Status ändern</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label>Neuer Status</Label>
             <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {statusOptions.map((opt) => (
                   <SelectItem key={opt.value} value={opt.value}>
                     {opt.label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label>Kommentar (optional)</Label>
             <Textarea
               value={comment}
               onChange={(e) => setComment(e.target.value)}
               placeholder="Fügen Sie einen Kommentar zur Statusänderung hinzu..."
               rows={3}
             />
           </div>
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Abbrechen
           </Button>
           <Button onClick={handleSubmit} disabled={isSubmitting || status === currentStatus}>
             {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
             Status ändern
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }