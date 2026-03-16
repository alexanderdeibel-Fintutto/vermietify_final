 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { 
   CheckCircle, 
   Circle, 
   Edit, 
   UserPlus, 
   MessageSquare, 
   Paperclip,
   Clock,
   Loader2
 } from "lucide-react";
 
 interface TaskActivityTimelineProps {
   taskId: string;
 }
 
 interface Activity {
   id: string;
   task_id: string;
   user_id: string | null;
   action: string;
   old_value: string | null;
   new_value: string | null;
   created_at: string;
 }
 
 const actionIcons: Record<string, React.ReactNode> = {
   created: <Circle className="h-4 w-4" />,
   status_changed: <CheckCircle className="h-4 w-4" />,
   assigned: <UserPlus className="h-4 w-4" />,
   updated: <Edit className="h-4 w-4" />,
   comment_added: <MessageSquare className="h-4 w-4" />,
   attachment_added: <Paperclip className="h-4 w-4" />,
 };
 
 const actionLabels: Record<string, string> = {
   created: "Aufgabe erstellt",
   status_changed: "Status geändert",
   assigned: "Zugewiesen",
   updated: "Aufgabe aktualisiert",
   comment_added: "Kommentar hinzugefügt",
   attachment_added: "Anhang hinzugefügt",
 };
 
 export function TaskActivityTimeline({ taskId }: TaskActivityTimelineProps) {
   const { data: activities = [], isLoading } = useQuery({
     queryKey: ["task-activities", taskId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("task_activities")
         .select("*")
         .eq("task_id", taskId)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       return data as Activity[];
     },
   });
 
   if (isLoading) {
     return (
       <div className="flex justify-center py-8">
         <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   if (activities.length === 0) {
     return (
       <p className="text-sm text-muted-foreground text-center py-4">
         Noch keine Aktivitäten vorhanden.
       </p>
     );
   }
 
   return (
     <div className="relative">
       {/* Timeline line */}
       <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
 
       <div className="space-y-4">
         {activities.map((activity) => (
           <div key={activity.id} className="relative flex gap-4 pl-10">
             {/* Icon */}
             <div className="absolute left-2 p-1 bg-background rounded-full border">
               {actionIcons[activity.action] || <Clock className="h-4 w-4" />}
             </div>
 
             {/* Content */}
             <div className="flex-1 pb-4">
               <p className="text-sm font-medium">
                 {actionLabels[activity.action] || activity.action}
               </p>
               {activity.old_value && activity.new_value && (
                 <p className="text-xs text-muted-foreground">
                   {activity.old_value} → {activity.new_value}
                 </p>
               )}
               {activity.new_value && !activity.old_value && (
                 <p className="text-xs text-muted-foreground">{activity.new_value}</p>
               )}
               <p className="text-xs text-muted-foreground mt-1">
                 {format(new Date(activity.created_at), "dd.MM.yyyy HH:mm", {
                   locale: de,
                 })}
               </p>
             </div>
           </div>
         ))}
       </div>
     </div>
   );
 }