 import { Badge } from "@/components/ui/badge";
 import { cn } from "@/lib/utils";
 import { AlertTriangle, ArrowDown, ArrowUp, Flame } from "lucide-react";
 import type { TaskPriority } from "@/types/database";
 
 interface TaskPriorityBadgeProps {
   priority: TaskPriority;
   className?: string;
 }
 
 const priorityConfig: Record<TaskPriority, { label: string; className: string; icon: React.ReactNode }> = {
   low: {
     label: "Niedrig",
     className: "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200",
     icon: <ArrowDown className="h-3 w-3" />,
   },
   normal: {
     label: "Normal",
     className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
     icon: null,
   },
   high: {
     label: "Hoch",
     className: "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200",
     icon: <ArrowUp className="h-3 w-3" />,
   },
   urgent: {
     label: "Dringend",
     className: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
     icon: <Flame className="h-3 w-3" />,
   },
 };
 
 export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
   const config = priorityConfig[priority] || priorityConfig.normal;
   
   return (
     <Badge variant="outline" className={cn("gap-1", config.className, className)}>
       {config.icon}
       {config.label}
     </Badge>
   );
 }