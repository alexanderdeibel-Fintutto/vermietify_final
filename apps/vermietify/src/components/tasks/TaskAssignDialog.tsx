 import { useState } from "react";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 import { Loader2, User } from "lucide-react";
 
 interface TaskAssignDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   currentAssignee: string | null;
   onSubmit: (userId: string | null) => Promise<void>;
 }
 
 export function TaskAssignDialog({
   open,
   onOpenChange,
   currentAssignee,
   onSubmit,
 }: TaskAssignDialogProps) {
   const [selectedUser, setSelectedUser] = useState<string>(currentAssignee || "none");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const { profile } = useAuth();
 
   // Fetch users in organization (simplified - in real app would fetch from org members)
   const { data: users = [] } = useQuery({
     queryKey: ["org-users", profile?.organization_id],
     queryFn: async () => {
       if (!profile?.organization_id) return [];
       
       const { data, error } = await supabase
         .from("profiles")
         .select("user_id, first_name, last_name")
         .eq("organization_id", profile.organization_id);
 
       if (error) throw error;
       return data || [];
     },
     enabled: !!profile?.organization_id,
   });
 
   const handleSubmit = async () => {
     setIsSubmitting(true);
     try {
       await onSubmit(selectedUser === "none" ? null : selectedUser);
       onOpenChange(false);
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const getInitials = (firstName?: string | null, lastName?: string | null) => {
     if (firstName && lastName) {
       return `${firstName[0]}${lastName[0]}`.toUpperCase();
     }
     return "?";
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent>
         <DialogHeader>
           <DialogTitle>Aufgabe zuweisen</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label>Zuweisen an</Label>
             <Select value={selectedUser} onValueChange={setSelectedUser}>
               <SelectTrigger>
                 <SelectValue placeholder="Person auswählen" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="none">
                   <div className="flex items-center gap-2">
                     <User className="h-4 w-4 text-muted-foreground" />
                     <span>Nicht zugewiesen</span>
                   </div>
                 </SelectItem>
                 {users.map((user) => (
                   <SelectItem key={user.user_id} value={user.user_id}>
                     <div className="flex items-center gap-2">
                       <Avatar className="h-5 w-5">
                         <AvatarFallback className="text-[10px]">
                           {getInitials(user.first_name, user.last_name)}
                         </AvatarFallback>
                       </Avatar>
                       <span>
                         {user.first_name} {user.last_name}
                       </span>
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Abbrechen
           </Button>
           <Button onClick={handleSubmit} disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
             Zuweisen
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }