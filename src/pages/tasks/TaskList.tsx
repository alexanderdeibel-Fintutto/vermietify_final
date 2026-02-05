 import { useState, useMemo } from "react";
 import { useNavigate } from "react-router-dom";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { EmptyState, LoadingState } from "@/components/shared";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { TaskStatusBadge, TaskPriorityBadge, TaskCategoryBadge } from "@/components/tasks";
 import { useTasks } from "@/hooks/useTasks";
 import { useBuildings } from "@/hooks/useBuildings";
 import { Plus, Search, CheckSquare, Building2 } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import type { TaskStatus, TaskCategory, TaskPriority, TaskSource } from "@/types/database";

export default function TaskList() {
   const navigate = useNavigate();
   const { useTasksList } = useTasks();
   const { useBuildingsList } = useBuildings();
   const { data: tasks = [], isLoading } = useTasksList();
   const { data: buildingsResponse } = useBuildingsList();
   const buildings = Array.isArray(buildingsResponse) ? buildingsResponse : (buildingsResponse?.buildings || []);
 
   const [activeTab, setActiveTab] = useState<string>("all");
   const [searchQuery, setSearchQuery] = useState("");
   const [filterBuilding, setFilterBuilding] = useState<string>("all");
   const [filterPriority, setFilterPriority] = useState<string>("all");
   const [filterCategory, setFilterCategory] = useState<string>("all");
   const [filterSource, setFilterSource] = useState<string>("all");
 
   const filteredTasks = useMemo(() => {
     return tasks.filter((task: any) => {
       // Tab filter
       if (activeTab === "open" && task.status !== "open") return false;
       if (activeTab === "in_progress" && task.status !== "in_progress") return false;
       if (activeTab === "completed" && task.status !== "completed") return false;
 
       // Search filter
       if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
         return false;
       }
 
       // Building filter
       if (filterBuilding !== "all" && task.building_id !== filterBuilding) return false;
 
       // Priority filter
       if (filterPriority !== "all" && task.priority !== filterPriority) return false;
 
       // Category filter
       if (filterCategory !== "all" && task.category !== filterCategory) return false;
 
       // Source filter
       if (filterSource !== "all" && task.source !== filterSource) return false;
 
       return true;
     });
   }, [tasks, activeTab, searchQuery, filterBuilding, filterPriority, filterCategory, filterSource]);
 
   const sourceLabels: Record<TaskSource, string> = {
     tenant: "Mieter",
     landlord: "Vermieter",
     caretaker: "Hausmeister",
   };
 
  return (
    <MainLayout 
      title="Aufgaben" 
      breadcrumbs={[{ label: "Aufgaben" }]}
       actions={
         <Button onClick={() => navigate("/aufgaben/neu")}>
           <Plus className="h-4 w-4 mr-2" />
           Neue Aufgabe
         </Button>
       }
    >
       <div className="space-y-4">
         {/* Filter Bar */}
         <div className="flex flex-wrap gap-3">
           <div className="relative flex-1 min-w-[200px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Aufgaben suchen..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9"
             />
           </div>
           <Select value={filterBuilding} onValueChange={setFilterBuilding}>
             <SelectTrigger className="w-[180px]">
               <SelectValue placeholder="Gebäude" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Alle Gebäude</SelectItem>
               {buildings.map((b: any) => (
                 <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
               ))}
             </SelectContent>
           </Select>
           <Select value={filterPriority} onValueChange={setFilterPriority}>
             <SelectTrigger className="w-[150px]">
               <SelectValue placeholder="Priorität" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Alle Prioritäten</SelectItem>
               <SelectItem value="low">Niedrig</SelectItem>
               <SelectItem value="normal">Normal</SelectItem>
               <SelectItem value="high">Hoch</SelectItem>
               <SelectItem value="urgent">Dringend</SelectItem>
             </SelectContent>
           </Select>
           <Select value={filterCategory} onValueChange={setFilterCategory}>
             <SelectTrigger className="w-[160px]">
               <SelectValue placeholder="Kategorie" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Alle Kategorien</SelectItem>
               <SelectItem value="water_damage">Wasserschaden</SelectItem>
               <SelectItem value="heating">Heizung</SelectItem>
               <SelectItem value="electrical">Elektro</SelectItem>
               <SelectItem value="other">Sonstiges</SelectItem>
             </SelectContent>
           </Select>
           <Select value={filterSource} onValueChange={setFilterSource}>
             <SelectTrigger className="w-[160px]">
               <SelectValue placeholder="Ersteller" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Alle Ersteller</SelectItem>
               <SelectItem value="tenant">Mieter</SelectItem>
               <SelectItem value="landlord">Vermieter</SelectItem>
               <SelectItem value="caretaker">Hausmeister</SelectItem>
             </SelectContent>
           </Select>
         </div>
 
         {/* Tabs */}
         <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList>
             <TabsTrigger value="all">Alle</TabsTrigger>
             <TabsTrigger value="open">Offen</TabsTrigger>
             <TabsTrigger value="in_progress">In Bearbeitung</TabsTrigger>
             <TabsTrigger value="completed">Erledigt</TabsTrigger>
           </TabsList>
 
           <TabsContent value={activeTab} className="mt-4">
             {isLoading ? (
               <LoadingState />
             ) : filteredTasks.length === 0 ? (
               <EmptyState
                 icon={CheckSquare}
                 title="Keine Aufgaben gefunden"
                 description={
                   activeTab === "all" 
                     ? "Erstellen Sie Ihre erste Aufgabe."
                     : "Keine Aufgaben mit den gewählten Filtern."
                 }
                 action={
                   activeTab === "all" ? (
                     <Button onClick={() => navigate("/aufgaben/neu")}>
                       <Plus className="h-4 w-4 mr-2" />
                       Neue Aufgabe
                     </Button>
                   ) : undefined
                 }
               />
             ) : (
               <div className="rounded-md border">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Titel</TableHead>
                       <TableHead>Gebäude/Einheit</TableHead>
                       <TableHead>Kategorie</TableHead>
                       <TableHead>Priorität</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Ersteller</TableHead>
                       <TableHead>Datum</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredTasks.map((task: any) => (
                       <TableRow
                         key={task.id}
                         className="cursor-pointer hover:bg-muted/50"
                         onClick={() => navigate(`/aufgaben/${task.id}`)}
                       >
                         <TableCell className="font-medium">{task.title}</TableCell>
                         <TableCell>
                           <div className="flex items-center gap-1 text-sm">
                             {task.buildings?.name && (
                               <span className="flex items-center gap-1">
                                 <Building2 className="h-3 w-3" />
                                 {task.buildings.name}
                               </span>
                             )}
                             {task.units?.unit_number && (
                               <span className="text-muted-foreground">
                                 / {task.units.unit_number}
                               </span>
                             )}
                           </div>
                         </TableCell>
                         <TableCell>
                           <TaskCategoryBadge category={task.category || "other"} />
                         </TableCell>
                         <TableCell>
                           <TaskPriorityBadge priority={task.priority || "normal"} />
                         </TableCell>
                         <TableCell>
                           <TaskStatusBadge status={task.status || "open"} />
                         </TableCell>
                         <TableCell className="text-sm text-muted-foreground">
                           {sourceLabels[task.source as TaskSource] || "Vermieter"}
                         </TableCell>
                         <TableCell className="text-sm text-muted-foreground">
                           {format(new Date(task.created_at), "dd.MM.yyyy", { locale: de })}
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             )}
           </TabsContent>
         </Tabs>
       </div>
    </MainLayout>
  );
}
