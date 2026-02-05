 import { useMemo } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Label } from "@/components/ui/label";
 import { Button } from "@/components/ui/button";
 import { Calendar } from "@/components/ui/calendar";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import { Badge } from "@/components/ui/badge";
 import { useBillingWizard } from "./BillingWizardContext";
 import { useBuildings } from "@/hooks/useBuildings";
 import { cn, formatCurrency } from "@/lib/utils";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { CalendarIcon, Building, Home, MapPin, AlertCircle } from "lucide-react";
 
 export function StepBuildingPeriod() {
   const { wizardData, updateWizardData, isStepValid } = useBillingWizard();
   const { useBuildingsList, useBuilding } = useBuildings();
   const { data: buildingsData, isLoading: buildingsLoading } = useBuildingsList(1, 100);
   const { data: selectedBuilding } = useBuilding(wizardData.buildingId || undefined);
 
   const validationErrors = useMemo(() => {
     const errors: string[] = [];
     if (!wizardData.buildingId) {
       errors.push("Bitte wählen Sie ein Gebäude aus.");
     }
     if (!wizardData.periodStart || !wizardData.periodEnd) {
       errors.push("Bitte geben Sie den Abrechnungszeitraum an.");
     } else {
       if (wizardData.periodStart >= wizardData.periodEnd) {
         errors.push("Das Startdatum muss vor dem Enddatum liegen.");
       }
       const diffMs = wizardData.periodEnd.getTime() - wizardData.periodStart.getTime();
       const diffDays = diffMs / (1000 * 60 * 60 * 24);
       if (diffDays > 366) {
         errors.push("Der Abrechnungszeitraum darf maximal 1 Jahr betragen.");
       }
     }
     return errors;
   }, [wizardData]);
 
   return (
     <div className="space-y-6">
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Building className="h-5 w-5" />
             Gebäude auswählen
           </CardTitle>
           <CardDescription>
             Wählen Sie das Gebäude für die Betriebskostenabrechnung
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="building">Gebäude *</Label>
             <Select
               value={wizardData.buildingId}
               onValueChange={(value) => updateWizardData({ buildingId: value })}
             >
               <SelectTrigger id="building" className="w-full">
                 <SelectValue placeholder="Gebäude auswählen..." />
               </SelectTrigger>
               <SelectContent>
                 {buildingsLoading ? (
                   <SelectItem value="loading" disabled>
                     Lädt...
                   </SelectItem>
                 ) : buildingsData?.buildings?.length === 0 ? (
                   <SelectItem value="none" disabled>
                     Keine Gebäude vorhanden
                   </SelectItem>
                 ) : (
                   buildingsData?.buildings?.map((building) => (
                     <SelectItem key={building.id} value={building.id}>
                       {building.name} – {building.address}, {building.city}
                     </SelectItem>
                   ))
                 )}
               </SelectContent>
             </Select>
           </div>
 
           {/* Selected Building Info */}
           {selectedBuilding && (
             <div className="p-4 bg-muted rounded-lg space-y-3">
               <h4 className="font-medium flex items-center gap-2">
                 <Building className="h-4 w-4" />
                 {selectedBuilding.name}
               </h4>
               <div className="grid gap-2 text-sm">
                 <div className="flex items-center gap-2 text-muted-foreground">
                   <MapPin className="h-4 w-4" />
                   {selectedBuilding.address}, {selectedBuilding.postal_code} {selectedBuilding.city}
                 </div>
                 <div className="flex items-center gap-2">
                   <Home className="h-4 w-4 text-muted-foreground" />
                   <span className="text-muted-foreground">Einheiten:</span>
                   <Badge variant="secondary">{selectedBuilding.units?.length || 0}</Badge>
                 </div>
                 {selectedBuilding.total_area && (
                   <div className="flex items-center gap-2">
                     <span className="text-muted-foreground ml-6">Gesamtfläche:</span>
                     <span>{selectedBuilding.total_area} m²</span>
                   </div>
                 )}
               </div>
             </div>
           )}
         </CardContent>
       </Card>
 
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <CalendarIcon className="h-5 w-5" />
             Abrechnungszeitraum
           </CardTitle>
           <CardDescription>
             Definieren Sie den Zeitraum für die Abrechnung (max. 1 Jahr)
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="grid gap-4 md:grid-cols-2">
             <div className="space-y-2">
               <Label>Von *</Label>
               <Popover>
                 <PopoverTrigger asChild>
                   <Button
                     variant="outline"
                     className={cn(
                       "w-full justify-start text-left font-normal",
                       !wizardData.periodStart && "text-muted-foreground"
                     )}
                   >
                     <CalendarIcon className="mr-2 h-4 w-4" />
                     {wizardData.periodStart ? (
                       format(wizardData.periodStart, "dd.MM.yyyy", { locale: de })
                     ) : (
                       <span>Startdatum wählen</span>
                     )}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0" align="start">
                   <Calendar
                     mode="single"
                     selected={wizardData.periodStart || undefined}
                     onSelect={(date) => updateWizardData({ periodStart: date || null })}
                     initialFocus
                     className="pointer-events-auto"
                     locale={de}
                   />
                 </PopoverContent>
               </Popover>
             </div>
 
             <div className="space-y-2">
               <Label>Bis *</Label>
               <Popover>
                 <PopoverTrigger asChild>
                   <Button
                     variant="outline"
                     className={cn(
                       "w-full justify-start text-left font-normal",
                       !wizardData.periodEnd && "text-muted-foreground"
                     )}
                   >
                     <CalendarIcon className="mr-2 h-4 w-4" />
                     {wizardData.periodEnd ? (
                       format(wizardData.periodEnd, "dd.MM.yyyy", { locale: de })
                     ) : (
                       <span>Enddatum wählen</span>
                     )}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0" align="start">
                   <Calendar
                     mode="single"
                     selected={wizardData.periodEnd || undefined}
                     onSelect={(date) => updateWizardData({ periodEnd: date || null })}
                     initialFocus
                     className="pointer-events-auto"
                     locale={de}
                   />
                 </PopoverContent>
               </Popover>
             </div>
           </div>
 
           {wizardData.periodStart && wizardData.periodEnd && (
             <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
               <span className="text-muted-foreground">Abrechnungszeitraum: </span>
               <span className="font-medium">
                 {format(wizardData.periodStart, "dd.MM.yyyy", { locale: de })} –{" "}
                 {format(wizardData.periodEnd, "dd.MM.yyyy", { locale: de })}
               </span>
               <span className="text-muted-foreground ml-2">
                 ({Math.ceil((wizardData.periodEnd.getTime() - wizardData.periodStart.getTime()) / (1000 * 60 * 60 * 24))} Tage)
               </span>
             </div>
           )}
         </CardContent>
       </Card>
 
       {validationErrors.length > 0 && !isStepValid(1) && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertDescription>
             <ul className="list-disc list-inside space-y-1">
               {validationErrors.map((error, index) => (
                 <li key={index}>{error}</li>
               ))}
             </ul>
           </AlertDescription>
         </Alert>
       )}
     </div>
   );
 }