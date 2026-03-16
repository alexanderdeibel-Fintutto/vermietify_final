 import { useEffect, useMemo } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Badge } from "@/components/ui/badge";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import { Separator } from "@/components/ui/separator";
 import { useBillingWizard, UnitDistributionData } from "./BillingWizardContext";
 import { useBuildings } from "@/hooks/useBuildings";
 import { LoadingState } from "@/components/shared";
 import { formatCurrency, cn } from "@/lib/utils";
 import { Home, Users, Ruler, AlertCircle, User, Building } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { useQuery } from "@tanstack/react-query";
 
 export function StepUnitsDistribution() {
   const {
     wizardData,
     updateWizardData,
     updateUnitDistribution,
     initializeUnitDistributions,
     distributionTotals,
     isStepValid,
   } = useBillingWizard();
 
   const { useBuilding } = useBuildings();
   const { data: building, isLoading: buildingLoading } = useBuilding(wizardData.buildingId || undefined);
 
   // Fetch leases with tenants for the building's units
   const { data: leasesData, isLoading: leasesLoading } = useQuery({
     queryKey: ["leases-for-billing", wizardData.buildingId],
     queryFn: async () => {
       if (!building?.units) return [];
       
       const unitIds = building.units.map((u) => u.id);
       const { data, error } = await supabase
         .from("leases")
         .select(`
           id,
           unit_id,
           tenant_id,
           utility_advance,
           is_active,
           tenants(id, first_name, last_name)
         `)
         .in("unit_id", unitIds)
         .eq("is_active", true);
 
       if (error) throw error;
       return data || [];
     },
     enabled: !!building?.units && building.units.length > 0,
   });
 
   // Initialize unit distributions when building data loads
   useEffect(() => {
     if (building?.units && leasesData !== undefined && wizardData.unitDistributions.length === 0) {
       const distributions: UnitDistributionData[] = building.units.map((unit) => {
         const lease = leasesData?.find((l: any) => l.unit_id === unit.id);
         const tenant = lease?.tenants as any;
         
         // Calculate prepayments (utility_advance * 12 months for a full year)
         const monthlyAdvance = lease?.utility_advance || unit.utility_advance || 0;
         const yearlyPrepayments = Math.round(monthlyAdvance * 12 * 100); // Convert to cents
 
         return {
           unitId: unit.id,
           unitNumber: unit.unit_number,
           tenantName: tenant ? `${tenant.first_name} ${tenant.last_name}` : null,
           tenantId: lease?.tenant_id || null,
           area: Number(unit.area) || 0,
           persons: 1, // Default to 1 person
           heatingShare: 0,
           prepayments: yearlyPrepayments,
           isVacant: !lease,
         };
       });
 
       initializeUnitDistributions(distributions);
     }
   }, [building, leasesData, wizardData.unitDistributions.length, initializeUnitDistributions]);
 
   // Check which distribution keys are active
   const activeKeys = useMemo(() => {
     const keys = new Set<string>();
     wizardData.costItems
       .filter((c) => c.isActive)
       .forEach((c) => keys.add(c.distributionKey));
     return keys;
   }, [wizardData.costItems]);
 
   const validationErrors = useMemo(() => {
     const errors: string[] = [];
     const activeUnits = wizardData.vacancyCostsToLandlord
       ? wizardData.unitDistributions.filter((u) => !u.isVacant)
       : wizardData.unitDistributions;
 
     if (activeKeys.has("area") && activeUnits.some((u) => u.area <= 0)) {
       errors.push('Alle Einheiten benötigen eine Fläche (m²), da Kosten "Nach m²" verteilt werden.');
     }
     if (activeKeys.has("persons") && activeUnits.some((u) => u.persons <= 0)) {
       errors.push('Alle Einheiten benötigen eine Personenanzahl, da Kosten "Nach Personen" verteilt werden.');
     }
     if (activeKeys.has("consumption") && activeUnits.every((u) => u.heatingShare === 0)) {
       errors.push('Mindestens eine Einheit benötigt einen Heizungsanteil, da Kosten "Nach Verbrauch" verteilt werden.');
     }
     return errors;
   }, [wizardData, activeKeys]);
 
   if (buildingLoading || leasesLoading) {
     return <LoadingState rows={5} />;
   }
 
   return (
     <div className="space-y-6">
       {/* Summary Cards */}
       <div className="grid gap-4 md:grid-cols-3">
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="rounded-lg bg-primary/10 p-2">
                 <Ruler className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Gesamt m²</p>
                 <p className="text-2xl font-bold">{distributionTotals.totalArea.toFixed(2)}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="rounded-lg bg-primary/10 p-2">
                 <Users className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Gesamt Personen</p>
                 <p className="text-2xl font-bold">{distributionTotals.totalPersons}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="rounded-lg bg-primary/10 p-2">
                 <Home className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Gesamt Einheiten</p>
                 <p className="text-2xl font-bold">{distributionTotals.totalUnits}</p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Vacancy Option */}
       <Card>
         <CardContent className="pt-6">
           <div className="flex items-center space-x-3">
             <Checkbox
               id="vacancyCosts"
               checked={wizardData.vacancyCostsToLandlord}
               onCheckedChange={(checked) =>
                 updateWizardData({ vacancyCostsToLandlord: checked as boolean })
               }
             />
             <Label htmlFor="vacancyCosts" className="cursor-pointer">
               Leerstandskosten auf Vermieter
               <span className="text-sm text-muted-foreground ml-2">
                 (Leerstehende Einheiten werden nicht auf Mieter umgelegt)
               </span>
             </Label>
           </div>
         </CardContent>
       </Card>
 
       {/* Units Table */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Building className="h-5 w-5" />
             Einheiten & Verteilerdaten
           </CardTitle>
           <CardDescription>
             Überprüfen und bearbeiten Sie die Daten für jede Einheit
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             {/* Header */}
             <div
               className="grid gap-4 items-center px-3 py-2 bg-muted rounded-lg font-medium text-sm"
               style={{
                 gridTemplateColumns: activeKeys.has("consumption")
                   ? "1.5fr 1.5fr 100px 100px 100px 120px"
                   : "1.5fr 1.5fr 100px 100px 120px",
               }}
             >
               <span>Einheit</span>
               <span>Mieter</span>
               <span>m²</span>
               <span>Personen</span>
               {activeKeys.has("consumption") && <span>Heizung %</span>}
               <span>Vorauszahlungen</span>
             </div>
 
             {/* Rows */}
             {wizardData.unitDistributions.map((unit) => (
               <div
                 key={unit.unitId}
                 className={cn(
                   "grid gap-4 items-center px-3 py-3 rounded-lg border transition-colors",
                   unit.isVacant && wizardData.vacancyCostsToLandlord
                     ? "bg-muted/50 border-dashed"
                     : "bg-card"
                 )}
                 style={{
                   gridTemplateColumns: activeKeys.has("consumption")
                     ? "1.5fr 1.5fr 100px 100px 100px 120px"
                     : "1.5fr 1.5fr 100px 100px 120px",
                 }}
               >
                 {/* Unit Number */}
                 <div className="flex items-center gap-2">
                   <Home className="h-4 w-4 text-muted-foreground" />
                   <span className="font-medium">{unit.unitNumber}</span>
                 </div>
 
                 {/* Tenant */}
                 <div className="flex items-center gap-2">
                   {unit.isVacant ? (
                     <Badge variant="secondary" className="text-muted-foreground">
                       Leerstand
                     </Badge>
                   ) : (
                     <>
                       <User className="h-4 w-4 text-muted-foreground" />
                       <span>{unit.tenantName}</span>
                     </>
                   )}
                 </div>
 
                 {/* Area */}
                 <Input
                   type="number"
                   step="0.01"
                   min="0"
                   value={unit.area || ""}
                   onChange={(e) =>
                     updateUnitDistribution(unit.unitId, {
                       area: parseFloat(e.target.value) || 0,
                     })
                   }
                   className="h-9"
                   disabled={unit.isVacant && wizardData.vacancyCostsToLandlord}
                 />
 
                 {/* Persons */}
                 <Input
                   type="number"
                   min="0"
                   value={unit.persons || ""}
                   onChange={(e) =>
                     updateUnitDistribution(unit.unitId, {
                       persons: parseInt(e.target.value) || 0,
                     })
                   }
                   className="h-9"
                   disabled={unit.isVacant && wizardData.vacancyCostsToLandlord}
                 />
 
                 {/* Heating Share (if consumption-based costs exist) */}
                 {activeKeys.has("consumption") && (
                   <div className="relative">
                     <Input
                       type="number"
                       step="0.1"
                       min="0"
                       max="100"
                       value={unit.heatingShare || ""}
                       onChange={(e) =>
                         updateUnitDistribution(unit.unitId, {
                           heatingShare: parseFloat(e.target.value) || 0,
                         })
                       }
                       className="h-9 pr-7"
                       disabled={unit.isVacant && wizardData.vacancyCostsToLandlord}
                     />
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                       %
                     </span>
                   </div>
                 )}
 
                 {/* Prepayments */}
                 <div className="text-right font-medium text-muted-foreground">
                   {formatCurrency(unit.prepayments / 100)}
                 </div>
               </div>
             ))}
           </div>
 
           <Separator className="my-4" />
 
           {/* Totals */}
           <div
             className="grid gap-4 items-center px-3 py-2 bg-primary/5 rounded-lg font-semibold"
             style={{
               gridTemplateColumns: activeKeys.has("consumption")
                 ? "1.5fr 1.5fr 100px 100px 100px 120px"
                 : "1.5fr 1.5fr 100px 100px 120px",
             }}
           >
             <span>Summe</span>
             <span></span>
             <span>{distributionTotals.totalArea.toFixed(2)}</span>
             <span>{distributionTotals.totalPersons}</span>
             {activeKeys.has("consumption") && (
               <span>
                 {wizardData.unitDistributions.reduce((sum, u) => sum + u.heatingShare, 0).toFixed(1)}%
               </span>
             )}
             <span className="text-right">
               {formatCurrency(
                 wizardData.unitDistributions.reduce((sum, u) => sum + u.prepayments, 0) / 100
               )}
             </span>
           </div>
         </CardContent>
       </Card>
 
       {/* Validation Errors */}
       {validationErrors.length > 0 && !isStepValid(3) && (
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