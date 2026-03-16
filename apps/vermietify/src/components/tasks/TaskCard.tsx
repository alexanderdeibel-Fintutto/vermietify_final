 import { Card, CardContent, CardHeader } from "@/components/ui/card";
 import { TaskStatusBadge } from "./TaskStatusBadge";
 import { TaskPriorityBadge } from "./TaskPriorityBadge";
 import { TaskCategoryBadge } from "./TaskCategoryBadge";
 import { Building2, Home, Calendar, User } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { Link } from "react-router-dom";
 import type { TaskStatus, TaskPriority, TaskCategory } from "@/types/database";
 
 interface TaskCardProps {
   task: {
     id: string;
     title: string;
     status: TaskStatus;
     priority: TaskPriority;
     category: TaskCategory;
     created_at: string;
     buildings?: { name: string } | null;
     units?: { unit_number: string } | null;
   };
 }
 
 export function TaskCard({ task }: TaskCardProps) {
   return (
     <Link to={`/aufgaben/${task.id}`}>
       <Card className="hover:shadow-md transition-shadow cursor-pointer">
         <CardHeader className="pb-2">
           <div className="flex items-start justify-between gap-2">
             <h3 className="font-semibold text-base line-clamp-2">{task.title}</h3>
             <TaskPriorityBadge priority={task.priority} />
           </div>
         </CardHeader>
         <CardContent className="space-y-3">
           <div className="flex flex-wrap gap-2">
             <TaskStatusBadge status={task.status} />
             <TaskCategoryBadge category={task.category} />
           </div>
           
           <div className="flex items-center gap-4 text-sm text-muted-foreground">
             {task.buildings && (
               <div className="flex items-center gap-1">
                 <Building2 className="h-3.5 w-3.5" />
                 <span>{task.buildings.name}</span>
               </div>
             )}
             {task.units && (
               <div className="flex items-center gap-1">
                 <Home className="h-3.5 w-3.5" />
                 <span>{task.units.unit_number}</span>
               </div>
             )}
           </div>
           
           <div className="flex items-center gap-1 text-xs text-muted-foreground">
             <Calendar className="h-3 w-3" />
             <span>{format(new Date(task.created_at), "dd. MMM yyyy", { locale: de })}</span>
           </div>
         </CardContent>
       </Card>
     </Link>
   );
 }