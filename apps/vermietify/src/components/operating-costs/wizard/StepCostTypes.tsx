 import { useState, useMemo } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Button } from "@/components/ui/button";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
 import { useBillingWizard, CostItem } from "./BillingWizardContext";
import { MeterReadingsDialog } from "./MeterReadingsDialog";
 import { formatCurrency, cn } from "@/lib/utils";
import { Euro, Plus, Trash2, Calculator, Gauge, AlertTriangle, CheckCircle2 } from "lucide-react";
 
 const DISTRIBUTION_KEY_OPTIONS = [
   { value: "area", label: "Nach m² (Fläche)" },
   { value: "persons", label: "Nach Personen" },
   { value: "units", label: "Nach Einheiten" },
   { value: "consumption", label: "Nach Verbrauch" },
 ] as const;
 
 export function StepCostTypes() {
  const { wizardData, updateCostItem, addCustomCostItem, removeCostItem, totalCosts } = useBillingWizard();
   const [newCostName, setNewCostName] = useState("");
   const [dialogOpen, setDialogOpen] = useState(false);
  const [meterDialogOpen, setMeterDialogOpen] = useState(false);
  const [meterDialogType, setMeterDialogType] = useState<"heating" | "water">("heating");
  const [meterDialogCostId, setMeterDialogCostId] = useState("");
 
   const handleAddCustomCost = () => {
     if (newCostName.trim()) {
       addCustomCostItem(newCostName.trim());
       setNewCostName("");
       setDialogOpen(false);
     }
   };
 
   const handleAmountChange = (id: string, value: string) => {
     // Parse as cents (multiply by 100)
     const numValue = parseFloat(value.replace(",", "."));
     const cents = isNaN(numValue) ? 0 : Math.round(numValue * 100);
     updateCostItem(id, { amount: cents });
   };
 
   const activeCosts = wizardData.costItems.filter((item) => item.isActive);
 
  // Check if any active cost items need consumption data
  const consumptionCostItems = useMemo(() => {
    return wizardData.costItems.filter(
      (item) =>
        item.isActive &&
        item.distributionKey === "consumption" &&
        (item.id === "heating" || item.id === "hot_water" || item.name.toLowerCase().includes("heiz") || item.name.toLowerCase().includes("wasser"))
    );
  }, [wizardData.costItems]);

  const hasConsumptionData = wizardData.meterConsumptionData.length > 0;
  const completeConsumptionData = wizardData.meterConsumptionData.filter(
    (m) => m.status === "complete" || m.status === "estimated"
  ).length;

  const openMeterDialog = (costItem: CostItem) => {
    const isHeating = costItem.id === "heating" || costItem.name.toLowerCase().includes("heiz");
    setMeterDialogType(isHeating ? "heating" : "water");
    setMeterDialogCostId(costItem.id);
    setMeterDialogOpen(true);
  };

   return (
     <div className="space-y-6">
      {/* Consumption Banner */}
      {consumptionCostItems.length > 0 && (
        <Alert className={cn(
          "border-2",
          hasConsumptionData ? "border-primary/50 bg-primary/5" : "border-amber-500/50 bg-amber-500/5"
        )}>
          <Gauge className={cn("h-4 w-4", hasConsumptionData ? "text-primary" : "text-amber-500")} />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {hasConsumptionData ? "Verbrauchsdaten geladen" : "Verbrauchsabrechnung aktiviert"}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasConsumptionData
                  ? `${completeConsumptionData} von ${wizardData.meterConsumptionData.length} Zähler mit vollständigen Daten`
                  : "Für die Verbrauchsabrechnung werden Zählerstände benötigt"}
              </p>
            </div>
            <div className="flex gap-2">
              {consumptionCostItems.map((item) => (
                <Button
                  key={item.id}
                  variant={hasConsumptionData ? "outline" : "default"}
                  size="sm"
                  onClick={() => openMeterDialog(item)}
                >
                  {hasConsumptionData ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Zählerstände bearbeiten
                    </>
                  ) : (
                    <>
                      <Gauge className="h-4 w-4 mr-2" />
                      Zählerstände laden
                    </>
                  )}
                </Button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Euro className="h-5 w-5" />
             Kostenarten & Beträge
           </CardTitle>
           <CardDescription>
             Aktivieren Sie die relevanten Kostenarten und geben Sie die Jahresbeträge ein
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           {wizardData.costItems.map((item) => (
             <div
               key={item.id}
               className={cn(
                 "grid gap-4 items-center p-3 rounded-lg border transition-colors",
                 item.isActive ? "bg-card border-border" : "bg-muted/50 border-transparent"
               )}
               style={{
                 gridTemplateColumns: "auto 1fr 150px 180px auto",
               }}
             >
               {/* Checkbox */}
               <Checkbox
                 id={`cost-${item.id}`}
                 checked={item.isActive}
                 onCheckedChange={(checked) =>
                   updateCostItem(item.id, { isActive: checked as boolean })
                 }
               />
 
               {/* Name */}
               <Label
                 htmlFor={`cost-${item.id}`}
                 className={cn(
                   "cursor-pointer font-medium",
                   !item.isActive && "text-muted-foreground"
                 )}
               >
                 {item.name}
                 {item.isCustom && (
                   <span className="ml-2 text-xs text-muted-foreground">(Benutzerdefiniert)</span>
                 )}
               </Label>
 
               {/* Amount Input */}
               <div className="relative">
                 <Input
                   type="text"
                   inputMode="decimal"
                   placeholder="0,00"
                   value={item.amount ? (item.amount / 100).toFixed(2).replace(".", ",") : ""}
                   onChange={(e) => handleAmountChange(item.id, e.target.value)}
                   disabled={!item.isActive}
                   className="pr-8"
                 />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                   €
                 </span>
               </div>
 
               {/* Distribution Key */}
               <Select
                 value={item.distributionKey}
                 onValueChange={(value) =>
                   updateCostItem(item.id, { distributionKey: value as CostItem["distributionKey"] })
                 }
                 disabled={!item.isActive}
               >
                 <SelectTrigger className="w-full">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {DISTRIBUTION_KEY_OPTIONS.map((option) => (
                     <SelectItem key={option.value} value={option.value}>
                       {option.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>

                {/* Consumption indicator */}
                {item.isActive && item.distributionKey === "consumption" && (
                  <Badge
                    variant={hasConsumptionData ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => openMeterDialog(item)}
                  >
                    <Gauge className="h-3 w-3 mr-1" />
                    {hasConsumptionData ? "Daten" : "Laden"}
                  </Badge>
                )}
 
               {/* Delete (only for custom) */}
               {item.isCustom ? (
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => removeCostItem(item.id)}
                   className="text-destructive hover:text-destructive"
                 >
                   <Trash2 className="h-4 w-4" />
                 </Button>
               ) : (
                 <div className="w-10" />
               )}
             </div>
           ))}
 
           <Separator />
 
           {/* Add Custom Cost */}
           <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
             <DialogTrigger asChild>
               <Button variant="outline" className="w-full">
                 <Plus className="h-4 w-4 mr-2" />
                 Kostenart hinzufügen
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Neue Kostenart hinzufügen</DialogTitle>
               </DialogHeader>
               <div className="space-y-4 py-4">
                 <div className="space-y-2">
                   <Label htmlFor="costName">Name der Kostenart</Label>
                   <Input
                     id="costName"
                     placeholder="z.B. Winterdienst"
                     value={newCostName}
                     onChange={(e) => setNewCostName(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && handleAddCustomCost()}
                   />
                 </div>
               </div>
               <DialogFooter>
                 <DialogClose asChild>
                   <Button variant="outline">Abbrechen</Button>
                 </DialogClose>
                 <Button onClick={handleAddCustomCost} disabled={!newCostName.trim()}>
                   Hinzufügen
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
         </CardContent>
       </Card>
 
       {/* Summary Card */}
       <Card className="bg-primary/5 border-primary/20">
         <CardContent className="pt-6">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="rounded-lg bg-primary/10 p-2">
                 <Calculator className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">
                   Summe aller aktiven Kosten ({activeCosts.length} Kostenarten)
                 </p>
                 <p className="text-2xl font-bold text-primary">
                   {formatCurrency(totalCosts / 100)}
                 </p>
               </div>
             </div>
           </div>
         </CardContent>
       </Card>

      {/* Meter Readings Dialog */}
      <MeterReadingsDialog
        open={meterDialogOpen}
        onOpenChange={setMeterDialogOpen}
        meterType={meterDialogType}
        costItemId={meterDialogCostId}
      />
     </div>
   );
 }