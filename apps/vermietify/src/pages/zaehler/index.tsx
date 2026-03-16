 import { useState, useMemo } from "react";
 import { useNavigate } from "react-router-dom";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader, StatCard, LoadingState, EmptyState } from "@/components/shared";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
 } from "@/components/ui/collapsible";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
import { QuickReadingDialog } from "@/components/zaehler/QuickReadingDialog";
import { MeterFormDialog } from "@/components/zaehler/MeterFormDialog";
 import { useMeters, MeterWithStatus, MeterType, MeterStatus } from "@/hooks/useMeters";
 import { useBuildings } from "@/hooks/useBuildings";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import {
   Plus,
   Upload,
   Gauge,
   Activity,
   AlertCircle,
   TrendingUp,
   ChevronDown,
   Building2,
   MapPin,
   MoreHorizontal,
   Eye,
   Pencil,
   Zap,
   Flame,
   Droplet,
   Thermometer,
 } from "lucide-react";
 
 const METER_TYPE_CONFIG: Record<MeterType, { icon: React.ElementType; label: string; color: string }> = {
   electricity: { icon: Zap, label: "Strom", color: "text-yellow-500" },
   gas: { icon: Flame, label: "Gas", color: "text-orange-500" },
   water: { icon: Droplet, label: "Wasser", color: "text-blue-500" },
   heating: { icon: Thermometer, label: "Heizung", color: "text-red-500" },
 };
 
 const STATUS_CONFIG: Record<MeterStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
   current: { label: "Aktuell", variant: "default" },
   reading_due: { label: "Ablesung fällig", variant: "secondary" },
   overdue: { label: "Überfällig", variant: "destructive" },
 };
 
 export default function MeterList() {
   const navigate = useNavigate();
   const { meters, isLoading, stats, addReading, createMeter, isAddingReading, isCreating } = useMeters();
  const { useBuildingsList } = useBuildings();
  const { data: buildingsData } = useBuildingsList(1, 100);
  const buildings = buildingsData?.buildings ?? [];
 
   // Filters
   const [typeFilter, setTypeFilter] = useState<string>("all");
   const [buildingFilter, setBuildingFilter] = useState<string>("all");
   const [statusFilter, setStatusFilter] = useState<string>("all");
 
   // Dialogs
   const [readingDialogOpen, setReadingDialogOpen] = useState(false);
   const [selectedMeterForReading, setSelectedMeterForReading] = useState<MeterWithStatus | null>(null);
   const [meterFormOpen, setMeterFormOpen] = useState(false);
   const [editingMeter, setEditingMeter] = useState<MeterWithStatus | null>(null);
 
   // Expanded buildings
   const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
 
   // Filter meters
   const filteredMeters = useMemo(() => {
     return meters.filter((m) => {
       if (typeFilter !== "all" && m.meter_type !== typeFilter) return false;
       if (buildingFilter !== "all" && m.unit?.building_id !== buildingFilter) return false;
       if (statusFilter !== "all" && m.status !== statusFilter) return false;
       return true;
     });
   }, [meters, typeFilter, buildingFilter, statusFilter]);
 
   // Group by building
   const metersByBuilding = useMemo(() => {
     const grouped = new Map<string, { building: typeof buildings[0]; meters: MeterWithStatus[] }>();
     
     filteredMeters.forEach((meter) => {
       const buildingId = meter.unit?.building_id;
       if (!buildingId) return;
       
       if (!grouped.has(buildingId)) {
         const building = buildings.find((b) => b.id === buildingId);
         if (building) {
           grouped.set(buildingId, { building, meters: [] });
         }
       }
       grouped.get(buildingId)?.meters.push(meter);
     });
     
     return Array.from(grouped.values());
   }, [filteredMeters, buildings]);
 
   // Expand all by default
   useMemo(() => {
     if (metersByBuilding.length > 0 && expandedBuildings.size === 0) {
       setExpandedBuildings(new Set(metersByBuilding.map((g) => g.building.id)));
     }
   }, [metersByBuilding]);
 
   const toggleBuilding = (buildingId: string) => {
     setExpandedBuildings((prev) => {
       const next = new Set(prev);
       if (next.has(buildingId)) {
         next.delete(buildingId);
       } else {
         next.add(buildingId);
       }
       return next;
     });
   };
 
   const handleReadMeter = (meter: MeterWithStatus) => {
     setSelectedMeterForReading(meter);
     setReadingDialogOpen(true);
   };
 
   const handleAddMeter = () => {
     setEditingMeter(null);
     setMeterFormOpen(true);
   };
 
   const handleEditMeter = (meter: MeterWithStatus) => {
     setEditingMeter(meter);
     setMeterFormOpen(true);
   };
 
    const handleReadingSuccess = () => {
      setReadingDialogOpen(false);
      setSelectedMeterForReading(null);
    };

    const handleMeterFormSuccess = () => {
      setMeterFormOpen(false);
      setEditingMeter(null);
    };
 
   return (
     <MainLayout title="Zählerverwaltung" breadcrumbs={[{ label: "Zähler" }]}>
       <div className="space-y-6">
         <PageHeader
           title="Zählerverwaltung"
           actions={
             <div className="flex gap-2">
               <Button variant="outline">
                 <Upload className="h-4 w-4 mr-2" />
                 CSV Import
               </Button>
               <Button onClick={handleAddMeter}>
                 <Plus className="h-4 w-4 mr-2" />
                 Zähler hinzufügen
               </Button>
             </div>
           }
         />
 
         {/* Stats */}
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <StatCard
             title="Zähler gesamt"
             value={stats.totalMeters}
             icon={Gauge}
           />
           <StatCard
             title="Ablesungen diesen Monat"
             value={stats.readingsThisMonth}
             icon={Activity}
           />
           <StatCard
             title="Ausstehende Ablesungen"
             value={stats.pendingReadings}
             icon={AlertCircle}
             description={stats.pendingReadings > 0 ? "Ablesung erforderlich" : undefined}
           />
           <StatCard
             title="Durchschn. Verbrauch"
             value="—"
             icon={TrendingUp}
           />
         </div>
 
         {/* Filters */}
         <div className="flex flex-wrap gap-4 p-4 bg-card border rounded-lg">
           <div className="flex-1 min-w-[150px]">
             <Select value={typeFilter} onValueChange={setTypeFilter}>
               <SelectTrigger>
                 <SelectValue placeholder="Zählertyp" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Alle Typen</SelectItem>
                 <SelectItem value="electricity">
                   <div className="flex items-center gap-2">
                     <Zap className="h-4 w-4 text-yellow-500" />
                     Strom
                   </div>
                 </SelectItem>
                 <SelectItem value="gas">
                   <div className="flex items-center gap-2">
                     <Flame className="h-4 w-4 text-orange-500" />
                     Gas
                   </div>
                 </SelectItem>
                 <SelectItem value="water">
                   <div className="flex items-center gap-2">
                     <Droplet className="h-4 w-4 text-blue-500" />
                     Wasser
                   </div>
                 </SelectItem>
                 <SelectItem value="heating">
                   <div className="flex items-center gap-2">
                     <Thermometer className="h-4 w-4 text-red-500" />
                     Heizung
                   </div>
                 </SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="flex-1 min-w-[150px]">
             <Select value={buildingFilter} onValueChange={setBuildingFilter}>
               <SelectTrigger>
                 <SelectValue placeholder="Gebäude" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Alle Gebäude</SelectItem>
                 {buildings.map((b) => (
                   <SelectItem key={b.id} value={b.id}>
                     {b.name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           <div className="flex-1 min-w-[150px]">
             <Select value={statusFilter} onValueChange={setStatusFilter}>
               <SelectTrigger>
                 <SelectValue placeholder="Status" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Alle Status</SelectItem>
                 <SelectItem value="current">Aktuell</SelectItem>
                 <SelectItem value="reading_due">Ablesung fällig</SelectItem>
                 <SelectItem value="overdue">Überfällig</SelectItem>
               </SelectContent>
             </Select>
           </div>
         </div>
 
         {/* Content */}
         {isLoading ? (
           <LoadingState rows={8} />
         ) : metersByBuilding.length === 0 ? (
           <EmptyState
             icon={Gauge}
             title="Keine Zähler vorhanden"
             description="Fügen Sie Ihren ersten Zähler hinzu, um Verbräuche zu erfassen."
            action={{ label: "Zähler hinzufügen", onClick: handleAddMeter }}
           />
         ) : (
           <div className="space-y-4">
             {metersByBuilding.map(({ building, meters: buildingMeters }) => (
               <Collapsible
                 key={building.id}
                 open={expandedBuildings.has(building.id)}
                 onOpenChange={() => toggleBuilding(building.id)}
               >
                 <div className="border rounded-lg overflow-hidden">
                   <CollapsibleTrigger className="w-full">
                     <div className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors">
                       <div className="flex items-center gap-3">
                         <Building2 className="h-5 w-5 text-muted-foreground" />
                         <div className="text-left">
                           <h3 className="font-semibold">{building.name}</h3>
                           <p className="text-sm text-muted-foreground flex items-center gap-1">
                             <MapPin className="h-3 w-3" />
                             {building.address}, {building.city}
                           </p>
                         </div>
                       </div>
                       <div className="flex items-center gap-4">
                         <Badge variant="outline">{buildingMeters.length} Zähler</Badge>
                         <ChevronDown
                           className={`h-5 w-5 transition-transform ${
                             expandedBuildings.has(building.id) ? "rotate-180" : ""
                           }`}
                         />
                       </div>
                     </div>
                   </CollapsibleTrigger>
 
                   <CollapsibleContent>
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Zählernummer</TableHead>
                           <TableHead>Typ</TableHead>
                           <TableHead>Einheit</TableHead>
                           <TableHead className="text-right">Letzter Stand</TableHead>
                           <TableHead>Letzte Ablesung</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead className="w-[150px]">Aktionen</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {buildingMeters.map((meter) => {
                           const typeConfig = METER_TYPE_CONFIG[meter.meter_type];
                           const statusConfig = STATUS_CONFIG[meter.status];
                           const TypeIcon = typeConfig.icon;
 
                           return (
                             <TableRow
                               key={meter.id}
                               className="cursor-pointer hover:bg-muted/50"
                               onClick={() => navigate(`/zaehler/${meter.id}`)}
                             >
                               <TableCell className="font-mono font-medium">
                                 {meter.meter_number}
                               </TableCell>
                               <TableCell>
                                 <div className="flex items-center gap-2">
                                   <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
                                   {typeConfig.label}
                                 </div>
                               </TableCell>
                               <TableCell>{meter.unit?.unit_number || "—"}</TableCell>
                               <TableCell className="text-right font-mono">
                                 {meter.last_reading_value !== null
                                   ? meter.last_reading_value.toLocaleString("de-DE")
                                   : "—"}
                               </TableCell>
                               <TableCell>
                                 {meter.last_reading_date
                                   ? format(new Date(meter.last_reading_date), "dd.MM.yyyy", { locale: de })
                                   : "—"}
                               </TableCell>
                               <TableCell>
                                 <Badge
                                   variant={statusConfig.variant}
                                   className={
                                     meter.status === "current"
                                      ? "bg-primary/10 text-primary border-transparent"
                                       : meter.status === "reading_due"
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-transparent"
                                       : ""
                                   }
                                 >
                                   {statusConfig.label}
                                 </Badge>
                               </TableCell>
                               <TableCell>
                                 <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => handleReadMeter(meter)}
                                   >
                                     Ablesen
                                   </Button>
                                   <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                                       <Button variant="ghost" size="icon">
                                         <MoreHorizontal className="h-4 w-4" />
                                       </Button>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent align="end">
                                       <DropdownMenuItem onClick={() => navigate(`/zaehler/${meter.id}`)}>
                                         <Eye className="h-4 w-4 mr-2" />
                                         Details
                                       </DropdownMenuItem>
                                       <DropdownMenuItem onClick={() => handleEditMeter(meter)}>
                                         <Pencil className="h-4 w-4 mr-2" />
                                         Bearbeiten
                                       </DropdownMenuItem>
                                     </DropdownMenuContent>
                                   </DropdownMenu>
                                 </div>
                               </TableCell>
                             </TableRow>
                           );
                         })}
                       </TableBody>
                     </Table>
                   </CollapsibleContent>
                 </div>
               </Collapsible>
             ))}
           </div>
         )}
       </div>
 
        <QuickReadingDialog
          open={readingDialogOpen}
          onOpenChange={setReadingDialogOpen}
          meter={selectedMeterForReading}
          onSuccess={handleReadingSuccess}
        />

        <MeterFormDialog
          open={meterFormOpen}
          onOpenChange={setMeterFormOpen}
          meter={editingMeter}
          onSuccess={handleMeterFormSuccess}
        />
     </MainLayout>
   );
 }