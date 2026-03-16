 import { Badge } from "@/components/ui/badge";
 import { cn } from "@/lib/utils";
 import { Droplets, Flame, Zap, MoreHorizontal } from "lucide-react";
 import type { TaskCategory } from "@/types/database";
 
 interface TaskCategoryBadgeProps {
   category: TaskCategory;
   className?: string;
 }
 
 const categoryConfig: Record<TaskCategory, { label: string; className: string; icon: React.ReactNode }> = {
   water_damage: {
     label: "Wasserschaden",
     className: "bg-cyan-100 text-cyan-800 hover:bg-cyan-100 border-cyan-200",
     icon: <Droplets className="h-3 w-3" />,
   },
   heating: {
     label: "Heizung",
     className: "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200",
     icon: <Flame className="h-3 w-3" />,
   },
   electrical: {
     label: "Elektro",
     className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
     icon: <Zap className="h-3 w-3" />,
   },
   other: {
     label: "Sonstiges",
     className: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
     icon: <MoreHorizontal className="h-3 w-3" />,
   },
 };
 
 export function TaskCategoryBadge({ category, className }: TaskCategoryBadgeProps) {
   const config = categoryConfig[category] || categoryConfig.other;
   
   return (
     <Badge variant="outline" className={cn("gap-1", config.className, className)}>
       {config.icon}
       {config.label}
     </Badge>
   );
 }