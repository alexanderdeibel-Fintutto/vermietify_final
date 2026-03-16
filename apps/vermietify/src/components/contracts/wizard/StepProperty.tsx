 import { useEffect } from "react";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { useBuildings } from "@/hooks/useBuildings";
 import { useUnits } from "@/hooks/useUnits";
 import { Building2, Home, Ruler, DoorOpen, Euro } from "lucide-react";
 import type { WizardData } from "../ContractWizard";
 import { formatCurrency } from "@/lib/utils";
 
interface StepPropertyProps {
    data: WizardData;
    updateData: (updates: Partial<WizardData>) => void;
    showValidation?: boolean;
  }
 
 export function StepProperty({ data, updateData, showValidation }: StepPropertyProps) {
   const { useBuildingsList } = useBuildings();
   const { useUnitsList } = useUnits();
   
   const { data: buildingsData } = useBuildingsList();
   const { data: units } = useUnitsList(data.buildingId || undefined);
   
   const buildings = buildingsData?.buildings || [];
   const availableUnits = units?.filter((u: any) => u.status === "vacant") || [];
 
   // Update selected unit details when unit changes
   useEffect(() => {
     if (data.unitId && units) {
       const unit = units.find((u: any) => u.id === data.unitId);
       if (unit) {
         updateData({
           selectedUnit: unit,
           rentAmount: unit.rent_amount / 100,
           utilityAdvance: (unit.utility_advance || 0) / 100,
           depositAmount: (unit.rent_amount * 3) / 100,
         });
       }
     }
   }, [data.unitId, units]);
 
   // Update selected building when building changes
   useEffect(() => {
     if (data.buildingId && buildings.length > 0) {
       const building = buildings.find((b: any) => b.id === data.buildingId);
       updateData({ selectedBuilding: building, unitId: "", selectedUnit: null });
     }
   }, [data.buildingId, buildings]);
 
   return (
     <div className="space-y-6">
       <div>
         <h2 className="text-xl font-semibold mb-2">Mietobjekt auswählen</h2>
         <p className="text-muted-foreground">
           Wählen Sie das Gebäude und die Einheit für den neuen Mietvertrag.
         </p>
       </div>
 
       <div className="grid gap-6 md:grid-cols-2">
         {/* Building Selection */}
         <div className="space-y-2">
            <Label htmlFor="building">Gebäude *</Label>
            {showValidation && !data.buildingId && (
              <p className="text-xs text-destructive">Bitte Gebäude auswählen</p>
            )}
           <Select
             value={data.buildingId}
             onValueChange={(value) => updateData({ buildingId: value })}
           >
              <SelectTrigger id="building" className={showValidation && !data.buildingId ? "border-destructive" : ""}>
                <SelectValue placeholder="Gebäude auswählen" />
              </SelectTrigger>
             <SelectContent>
               {buildings.map((building: any) => (
                 <SelectItem key={building.id} value={building.id}>
                   <div className="flex items-center gap-2">
                     <Building2 className="h-4 w-4" />
                     {building.name}
                   </div>
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
 
         {/* Unit Selection */}
         <div className="space-y-2">
            <Label htmlFor="unit">Einheit *</Label>
            {showValidation && !data.unitId && (
              <p className="text-xs text-destructive">Bitte Einheit auswählen</p>
            )}
           <Select
             value={data.unitId}
             onValueChange={(value) => updateData({ unitId: value })}
             disabled={!data.buildingId}
           >
              <SelectTrigger id="unit" className={showValidation && !data.unitId ? "border-destructive" : ""}>
                <SelectValue placeholder={data.buildingId ? "Einheit auswählen" : "Erst Gebäude wählen"} />
              </SelectTrigger>
             <SelectContent>
               {availableUnits.length === 0 ? (
                 <div className="p-2 text-sm text-muted-foreground text-center">
                   Keine verfügbaren Einheiten
                 </div>
               ) : (
                 availableUnits.map((unit: any) => (
                   <SelectItem key={unit.id} value={unit.id}>
                     <div className="flex items-center gap-2">
                       <Home className="h-4 w-4" />
                       {unit.unit_number}
                       <span className="text-muted-foreground">
                         ({unit.area} m², {unit.rooms} Zi.)
                       </span>
                     </div>
                   </SelectItem>
                 ))
               )}
             </SelectContent>
           </Select>
         </div>
       </div>
 
       {/* Unit Details Preview */}
       {data.selectedUnit && (
        <Card className="border-primary/50 bg-accent">
           <CardContent className="pt-6">
             <div className="flex items-start justify-between mb-4">
               <div>
                 <h3 className="font-semibold text-lg">{data.selectedUnit.unit_number}</h3>
                 <p className="text-muted-foreground">
                   {data.selectedBuilding?.name} • {data.selectedBuilding?.address}
                 </p>
               </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                 Verfügbar
               </Badge>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="flex items-center gap-2">
                 <Ruler className="h-4 w-4 text-muted-foreground" />
                 <div>
                   <p className="text-sm text-muted-foreground">Fläche</p>
                   <p className="font-medium">{data.selectedUnit.area} m²</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-2">
                 <DoorOpen className="h-4 w-4 text-muted-foreground" />
                 <div>
                   <p className="text-sm text-muted-foreground">Zimmer</p>
                   <p className="font-medium">{data.selectedUnit.rooms}</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-2">
                 <Euro className="h-4 w-4 text-muted-foreground" />
                 <div>
                   <p className="text-sm text-muted-foreground">Kaltmiete</p>
                   <p className="font-medium">{formatCurrency(data.selectedUnit.rent_amount / 100)}</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-2">
                 <Euro className="h-4 w-4 text-muted-foreground" />
                 <div>
                   <p className="text-sm text-muted-foreground">Nebenkosten</p>
                   <p className="font-medium">{formatCurrency((data.selectedUnit.utility_advance || 0) / 100)}</p>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
       )}
     </div>
   );
 }