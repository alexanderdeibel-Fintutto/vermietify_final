 import { Badge } from "@/components/ui/badge";
 import { cn } from "@/lib/utils";
 import type { TaskStatus } from "@/types/database";
 
 interface TaskStatusBadgeProps {
   status: TaskStatus;
   className?: string;
 }
 
 const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
   open: {
     label: "Offen",
     className: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
   },
   in_progress: {
     label: "In Bearbeitung",
     className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
   },
   completed: {
     label: "Erledigt",
     className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
   },
   cancelled: {
     label: "Abgebrochen",
     className: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
   },
 };
 
 export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
   const config = statusConfig[status] || statusConfig.open;
   
   return (
     <Badge variant="outline" className={cn(config.className, className)}>
       {config.label}
     </Badge>
   );
 }