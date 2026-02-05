 import { useState, useEffect, useRef } from "react";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { Send, Loader2 } from "lucide-react";
 
 interface TaskCommentsProps {
   taskId: string;
 }
 
 interface Comment {
   id: string;
   task_id: string;
   user_id: string;
   content: string;
   created_at: string;
 }
 
 export function TaskComments({ taskId }: TaskCommentsProps) {
   const [newComment, setNewComment] = useState("");
   const { user, profile } = useAuth();
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const commentsEndRef = useRef<HTMLDivElement>(null);
 
   // Fetch comments
   const { data: comments = [], isLoading } = useQuery({
     queryKey: ["task-comments", taskId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("task_comments")
         .select("*")
         .eq("task_id", taskId)
         .order("created_at", { ascending: true });
 
       if (error) throw error;
       return data as Comment[];
     },
   });
 
   // Subscribe to realtime updates
   useEffect(() => {
     const channel = supabase
       .channel(`task-comments-${taskId}`)
       .on(
         "postgres_changes",
         {
           event: "*",
           schema: "public",
           table: "task_comments",
           filter: `task_id=eq.${taskId}`,
         },
         () => {
           queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [taskId, queryClient]);
 
   // Scroll to bottom when new comments arrive
   useEffect(() => {
     commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [comments]);
 
   // Add comment mutation
   const addComment = useMutation({
     mutationFn: async (content: string) => {
       if (!user) throw new Error("Not authenticated");
 
       const { error } = await supabase.from("task_comments").insert({
         task_id: taskId,
         user_id: user.id,
         content,
       });
 
       if (error) throw error;
     },
     onSuccess: () => {
       setNewComment("");
       queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
     },
     onError: (error: Error) => {
       toast({
         title: "Fehler",
         description: error.message,
         variant: "destructive",
       });
     },
   });
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (newComment.trim()) {
       addComment.mutate(newComment.trim());
     }
   };
 
   const getInitials = () => {
     if (profile?.first_name && profile?.last_name) {
       return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
     }
     return "U";
   };
 
   if (isLoading) {
     return (
       <div className="flex justify-center py-8">
         <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   return (
     <div className="flex flex-col h-[400px]">
       {/* Comments list */}
       <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-t-lg">
         {comments.length === 0 ? (
           <p className="text-center text-muted-foreground py-8">
             Noch keine Kommentare. Schreiben Sie den ersten!
           </p>
         ) : (
           comments.map((comment) => (
             <div
               key={comment.id}
               className={`flex gap-3 ${
                 comment.user_id === user?.id ? "flex-row-reverse" : ""
               }`}
             >
               <Avatar className="h-8 w-8 flex-shrink-0">
                 <AvatarFallback className="text-xs">
                   {comment.user_id === user?.id ? getInitials() : "?"}
                 </AvatarFallback>
               </Avatar>
               <div
                 className={`max-w-[70%] rounded-lg p-3 ${
                   comment.user_id === user?.id
                     ? "bg-primary text-primary-foreground"
                     : "bg-background border"
                 }`}
               >
                 <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                 <p
                   className={`text-xs mt-1 ${
                     comment.user_id === user?.id
                       ? "text-primary-foreground/70"
                       : "text-muted-foreground"
                   }`}
                 >
                   {format(new Date(comment.created_at), "dd.MM.yyyy HH:mm", {
                     locale: de,
                   })}
                 </p>
               </div>
             </div>
           ))
         )}
         <div ref={commentsEndRef} />
       </div>
 
       {/* Input form */}
       <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t bg-background rounded-b-lg">
         <Textarea
           value={newComment}
           onChange={(e) => setNewComment(e.target.value)}
           placeholder="Schreiben Sie einen Kommentar..."
           className="min-h-[60px] resize-none"
           onKeyDown={(e) => {
             if (e.key === "Enter" && !e.shiftKey) {
               e.preventDefault();
               handleSubmit(e);
             }
           }}
         />
         <Button
           type="submit"
           size="icon"
           disabled={!newComment.trim() || addComment.isPending}
         >
           {addComment.isPending ? (
             <Loader2 className="h-4 w-4 animate-spin" />
           ) : (
             <Send className="h-4 w-4" />
           )}
         </Button>
       </form>
     </div>
   );
 }