 import { useState } from "react";
 import { useParams, useNavigate, Link } from "react-router-dom";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { LoadingState, EmptyState } from "@/components/shared";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
 import {
   TaskStatusBadge,
   TaskPriorityBadge,
   TaskCategoryBadge,
   TaskComments,
   TaskAttachments,
   TaskStatusDialog,
   TaskAssignDialog,
   TaskActivityTimeline,
 } from "@/components/tasks";
 import { useTasks } from "@/hooks/useTasks";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import {
   Building2,
   Home,
   Calendar,
   User,
   MoreVertical,
   Edit,
   Trash2,
   UserPlus,
   CheckSquare,
 } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import type { TaskStatus, TaskSource, TaskPriority } from "@/types/database";

export default function TaskDetail() {
  const { id } = useParams();
   const navigate = useNavigate();
   const { toast } = useToast();
   const { user } = useAuth();
   const { useTask, updateTask, deleteTask } = useTasks();
   const { data: task, isLoading, error } = useTask(id);
   
   const [showStatusDialog, setShowStatusDialog] = useState(false);
   const [showAssignDialog, setShowAssignDialog] = useState(false);
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
 
   const sourceLabels: Record<TaskSource, string> = {
     tenant: "Mieter",
     landlord: "Vermieter",
     caretaker: "Hausmeister",
   };
 
   const handleStatusChange = async (newStatus: TaskStatus, comment?: string) => {
     if (!id) return;
     
     try {
       await updateTask.mutateAsync({ id, data: { status: newStatus } });
       
       // Log activity
       await supabase.from("task_activities").insert({
         task_id: id,
         user_id: user?.id,
         action: "status_changed",
         old_value: task?.status,
         new_value: newStatus,
       });
 
       // Add comment if provided
       if (comment && user) {
         await supabase.from("task_comments").insert({
           task_id: id,
           user_id: user.id,
           content: `Status geändert: ${comment}`,
         });
       }
     } catch (err) {
       console.error(err);
     }
   };
 
   const handleAssign = async (userId: string | null) => {
     if (!id) return;
     
     try {
       await updateTask.mutateAsync({ id, data: { assigned_to: userId || undefined } });
       
       await supabase.from("task_activities").insert({
         task_id: id,
         user_id: user?.id,
         action: "assigned",
         new_value: userId ? "Zugewiesen" : "Zuweisung entfernt",
       });
     } catch (err) {
       console.error(err);
     }
   };
 
   const handleDelete = async () => {
     if (!id) return;
     
     try {
       await deleteTask.mutateAsync(id);
       toast({ title: "Aufgabe gelöscht" });
       navigate("/aufgaben");
     } catch (err) {
       console.error(err);
     }
   };
 
   if (isLoading) {
     return (
       <MainLayout title="Aufgabe wird geladen..." breadcrumbs={[{ label: "Aufgaben", href: "/aufgaben" }, { label: "Details" }]}>
         <LoadingState />
       </MainLayout>
     );
   }
 
   if (error || !task) {
     return (
       <MainLayout title="Aufgabe nicht gefunden" breadcrumbs={[{ label: "Aufgaben", href: "/aufgaben" }, { label: "Details" }]}>
         <EmptyState
           icon={CheckSquare}
           title="Aufgabe nicht gefunden"
           description="Die angeforderte Aufgabe existiert nicht oder wurde gelöscht."
           action={
             <Button onClick={() => navigate("/aufgaben")}>
               Zurück zu Aufgaben
             </Button>
           }
         />
       </MainLayout>
     );
   }
  
  return (
    <MainLayout 
       title={task.title}
      breadcrumbs={[
        { label: "Aufgaben", href: "/aufgaben" },
         { label: task.title }
      ]}
       actions={
         <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => setShowStatusDialog(true)}>
             Status ändern
           </Button>
           <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
             <UserPlus className="h-4 w-4 mr-2" />
             Zuweisen
           </Button>
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="icon">
                 <MoreVertical className="h-4 w-4" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               <DropdownMenuItem onClick={() => navigate(`/aufgaben/neu?edit=${id}`)}>
                 <Edit className="h-4 w-4 mr-2" />
                 Bearbeiten
               </DropdownMenuItem>
               <DropdownMenuItem 
                 className="text-destructive"
                 onClick={() => setShowDeleteDialog(true)}
               >
                 <Trash2 className="h-4 w-4 mr-2" />
                 Löschen
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
         </div>
       }
    >
       <div className="space-y-6">
         {/* Status Badges */}
         <div className="flex items-center gap-2">
           <TaskStatusBadge status={task.status || "open"} />
           <TaskPriorityBadge priority={(task.priority as TaskPriority) || "normal"} />
           <TaskCategoryBadge category={task.category || "other"} />
         </div>
 
         {/* Info Cards */}
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
           {/* Building/Unit Card */}
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Standort</CardTitle>
             </CardHeader>
             <CardContent>
               {task.building ? (
                 <div className="space-y-1">
                   <Link 
                     to={`/gebaeude/${task.building.id}`}
                     className="flex items-center gap-2 text-sm font-medium hover:underline"
                   >
                     <Building2 className="h-4 w-4" />
                     {task.building.name}
                   </Link>
                   {task.unit && (
                     <Link 
                       to={`/einheiten/${task.unit.id}`}
                       className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
                     >
                       <Home className="h-4 w-4" />
                       {task.unit.unit_number}
                     </Link>
                   )}
                 </div>
               ) : (
                 <span className="text-sm text-muted-foreground">Nicht zugeordnet</span>
               )}
             </CardContent>
           </Card>
 
           {/* Creator Card */}
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Ersteller</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex items-center gap-2">
                 <User className="h-4 w-4 text-muted-foreground" />
                 <span className="text-sm font-medium">
                   {sourceLabels[task.source as TaskSource] || "Vermieter"}
                 </span>
               </div>
             </CardContent>
           </Card>
 
           {/* Created Date Card */}
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Erstellt am</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex items-center gap-2">
                 <Calendar className="h-4 w-4 text-muted-foreground" />
                 <span className="text-sm font-medium">
                   {format(new Date(task.created_at), "dd. MMMM yyyy", { locale: de })}
                 </span>
               </div>
             </CardContent>
           </Card>
 
           {/* Assigned To Card */}
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Zugewiesen an</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex items-center gap-2">
                 <UserPlus className="h-4 w-4 text-muted-foreground" />
                 <span className="text-sm font-medium">
                   {task.assigned_to ? "Zugewiesen" : "Nicht zugewiesen"}
                 </span>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Description */}
         {task.description && (
           <Card>
             <CardHeader>
               <CardTitle>Beschreibung</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="prose prose-sm max-w-none">
                 <p className="whitespace-pre-wrap">{task.description}</p>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Tabs for Attachments, Comments, Activity */}
         <Card>
           <CardContent className="pt-6">
             <Tabs defaultValue="attachments">
               <TabsList className="grid w-full grid-cols-3">
                 <TabsTrigger value="attachments">Anhänge</TabsTrigger>
                 <TabsTrigger value="comments">Kommentare</TabsTrigger>
                 <TabsTrigger value="activity">Aktivität</TabsTrigger>
               </TabsList>
 
               <TabsContent value="attachments" className="mt-4">
                 <TaskAttachments taskId={id!} />
               </TabsContent>
 
               <TabsContent value="comments" className="mt-4">
                 <TaskComments taskId={id!} />
               </TabsContent>
 
               <TabsContent value="activity" className="mt-4">
                 <TaskActivityTimeline taskId={id!} />
               </TabsContent>
             </Tabs>
           </CardContent>
         </Card>
       </div>
 
       {/* Dialogs */}
       <TaskStatusDialog
         open={showStatusDialog}
         onOpenChange={setShowStatusDialog}
         currentStatus={task.status || "open"}
         onSubmit={handleStatusChange}
       />
 
       <TaskAssignDialog
         open={showAssignDialog}
         onOpenChange={setShowAssignDialog}
         currentAssignee={task.assigned_to || null}
         onSubmit={handleAssign}
       />
 
       <ConfirmDialog
         open={showDeleteDialog}
         onOpenChange={setShowDeleteDialog}
         title="Aufgabe löschen"
         description="Sind Sie sicher, dass Sie diese Aufgabe löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
         confirmLabel="Löschen"
         destructive
         onConfirm={handleDelete}
       />
    </MainLayout>
  );
}
