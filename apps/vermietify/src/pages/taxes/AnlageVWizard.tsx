 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader } from "@/components/shared/PageHeader";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { useBuildings } from "@/hooks/useBuildings";
 import { useTaxData, calculateAfA } from "@/hooks/useTaxData";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { LoadingState } from "@/components/shared";
 import {
   Building2,
   Euro,
   TrendingDown,
   FileText,
   Check,
   ArrowLeft,
   ArrowRight,
   Download,
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 const currentYear = new Date().getFullYear();
 
 interface WerbungskostenItem {
   id: string;
   name: string;
   amount: number;
 }
 
 export default function AnlageVWizard() {
   const navigate = useNavigate();
   const { toast } = useToast();
   const { profile } = useAuth();
   const { useBuildingsList } = useBuildings();
   const { data: buildingsData, isLoading } = useBuildingsList(1, 100);
   const buildings = buildingsData?.buildings || [];
   const { useRentalIncome, useExpenses } = useTaxData(currentYear);
   const { data: rentalIncome = 0 } = useRentalIncome();
   const { data: expenses = 0 } = useExpenses();
 
   const [step, setStep] = useState(1);
   const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
   const [werbungskosten, setWerbungskosten] = useState<WerbungskostenItem[]>([
     { id: "schuldzinsen", name: "Schuldzinsen", amount: 0 },
     { id: "erhaltung", name: "Erhaltungsaufwendungen", amount: 0 },
     { id: "nebenkosten", name: "Nicht umlagefähige Nebenkosten", amount: 0 },
     { id: "verwaltung", name: "Verwaltungskosten", amount: 0 },
     { id: "sonstige", name: "Sonstige Werbungskosten", amount: 0 },
   ]);
 
   const selectedBuildingData = buildings.filter((b) =>
     selectedBuildings.includes(b.id)
   );
 
   // Calculate AfA for selected buildings
   const totalAfA = selectedBuildingData.reduce((sum, b) => {
     if (b.year_built && b.total_area) {
       const estimatedPrice = (b.total_area || 0) * 200000;
       return sum + calculateAfA(estimatedPrice, b.year_built, currentYear);
     }
     return sum;
   }, 0);
 
   const totalWerbungskosten = werbungskosten.reduce((sum, w) => sum + w.amount, 0) + totalAfA;
   const taxableIncome = rentalIncome - totalWerbungskosten;
 
   const handleBuildingToggle = (buildingId: string) => {
     setSelectedBuildings((prev) =>
       prev.includes(buildingId)
         ? prev.filter((id) => id !== buildingId)
         : [...prev, buildingId]
     );
   };
 
   const handleWerbungskostenChange = (id: string, value: string) => {
     const amount = Math.round(parseFloat(value || "0") * 100);
     setWerbungskosten((prev) =>
       prev.map((w) => (w.id === id ? { ...w, amount } : w))
     );
   };
 
   const handleExport = () => {
     toast({
       title: "Export gestartet",
       description: "Die Anlage V wird als PDF generiert...",
     });
     // TODO: Implement actual PDF generation
   };
 
   if (isLoading) {
     return (
       <MainLayout title="Anlage V">
         <LoadingState />
       </MainLayout>
     );
   }
 
   return (
     <MainLayout title="Anlage V">
       <div className="space-y-6">
         <PageHeader
           title="Anlage V Wizard"
           subtitle={`Steuererklärung ${currentYear}`}
           breadcrumbs={[
             { label: "Steuern", href: "/taxes" },
             { label: "Anlage V" },
           ]}
         />
 
         {/* Progress Steps */}
         <div className="flex items-center justify-center gap-2">
           {[1, 2, 3, 4, 5].map((s) => (
             <div key={s} className="flex items-center gap-2">
               <div
                 className={cn(
                   "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                   s === step
                     ? "bg-primary text-primary-foreground"
                     : s < step
                     ? "bg-green-500 text-white"
                     : "bg-muted text-muted-foreground"
                 )}
               >
                 {s < step ? <Check className="h-5 w-5" /> : s}
               </div>
               {s < 5 && (
                 <div
                   className={cn("h-1 w-8 md:w-16", s < step ? "bg-green-500" : "bg-muted")}
                 />
               )}
             </div>
           ))}
         </div>
 
         {/* Step 1: Select Buildings */}
         {step === 1 && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Building2 className="h-5 w-5" />
                 1. Objekte auswählen
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <p className="text-muted-foreground">
                 Wählen Sie die Objekte für die Anlage V aus:
               </p>
               {buildings.length === 0 ? (
                 <p className="text-center py-8 text-muted-foreground">
                   Keine Immobilien vorhanden
                 </p>
               ) : (
                 <div className="space-y-2">
                   {buildings.map((building) => (
                     <div
                       key={building.id}
                       className={cn(
                         "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                         selectedBuildings.includes(building.id)
                           ? "border-primary bg-primary/5"
                           : "hover:border-primary/50"
                       )}
                       onClick={() => handleBuildingToggle(building.id)}
                     >
                       <Checkbox
                         checked={selectedBuildings.includes(building.id)}
                         onCheckedChange={() => handleBuildingToggle(building.id)}
                       />
                       <div className="flex-1">
                         <p className="font-medium">{building.name}</p>
                         <p className="text-sm text-muted-foreground">
                           {building.address}, {building.postal_code} {building.city}
                         </p>
                       </div>
                       {building.total_area && (
                         <span className="text-sm text-muted-foreground">
                           {building.total_area} m²
                         </span>
                       )}
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
         )}
 
         {/* Step 2: Income */}
         {step === 2 && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Euro className="h-5 w-5" />
                 2. Einnahmen prüfen
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <p className="text-muted-foreground">
                 Die folgenden Einnahmen wurden automatisch aus Ihren Zahlungen ermittelt:
               </p>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Kategorie</TableHead>
                     <TableHead className="text-right">Betrag</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   <TableRow>
                     <TableCell>Kaltmieten</TableCell>
                     <TableCell className="text-right font-mono">
                       {(rentalIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                     </TableCell>
                   </TableRow>
                   <TableRow>
                     <TableCell>Nebenkostenvorauszahlungen</TableCell>
                     <TableCell className="text-right font-mono">0,00 €</TableCell>
                   </TableRow>
                   <TableRow className="font-bold">
                     <TableCell>Gesamt Einnahmen</TableCell>
                     <TableCell className="text-right font-mono text-primary">
                       {(rentalIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                     </TableCell>
                   </TableRow>
                 </TableBody>
               </Table>
             </CardContent>
           </Card>
         )}
 
         {/* Step 3: Expenses */}
         {step === 3 && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <TrendingDown className="h-5 w-5" />
                 3. Werbungskosten
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="p-4 bg-muted/50 rounded-lg">
                 <div className="flex items-center justify-between">
                   <span className="font-medium">AfA (automatisch berechnet)</span>
                   <span className="font-mono font-bold">
                     {(totalAfA / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                   </span>
                 </div>
                 <p className="text-sm text-muted-foreground mt-1">
                   Basierend auf Baujahr und geschätztem Kaufpreis (2% bzw. 2,5% p.a.)
                 </p>
               </div>
 
               <div className="space-y-4">
                 {werbungskosten.map((item) => (
                   <div key={item.id} className="flex items-center gap-4">
                     <Label htmlFor={item.id} className="flex-1">
                       {item.name}
                     </Label>
                     <div className="relative w-40">
                       <Input
                         id={item.id}
                         type="number"
                         step="0.01"
                         min="0"
                         value={(item.amount / 100).toFixed(2)}
                         onChange={(e) => handleWerbungskostenChange(item.id, e.target.value)}
                         className="pr-8 text-right"
                       />
                       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                         €
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
 
               <div className="p-4 border rounded-lg">
                 <div className="flex items-center justify-between">
                   <span className="font-bold">Gesamt Werbungskosten</span>
                   <span className="font-mono font-bold text-lg">
                     {(totalWerbungskosten / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                   </span>
                 </div>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Step 4: Summary per Building */}
         {step === 4 && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Building2 className="h-5 w-5" />
                 4. Zusammenfassung pro Objekt
               </CardTitle>
             </CardHeader>
             <CardContent>
               {selectedBuildingData.length === 0 ? (
                 <p className="text-center py-8 text-muted-foreground">
                   Keine Objekte ausgewählt
                 </p>
               ) : (
                 <div className="space-y-4">
                   {selectedBuildingData.map((building) => {
                     const buildingAfA = building.year_built && building.total_area
                       ? calculateAfA((building.total_area || 0) * 200000, building.year_built, currentYear)
                       : 0;
                     const buildingIncome = rentalIncome / selectedBuildingData.length;
                     const buildingExpenses = totalWerbungskosten / selectedBuildingData.length;
                     const buildingResult = buildingIncome - buildingExpenses;
 
                     return (
                       <div key={building.id} className="p-4 border rounded-lg space-y-3">
                         <div className="flex items-center justify-between">
                           <div>
                             <p className="font-medium">{building.name}</p>
                             <p className="text-sm text-muted-foreground">
                               {building.address}
                             </p>
                           </div>
                         </div>
                         <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                           <div>
                             <p className="text-sm text-muted-foreground">Einnahmen</p>
                             <p className="font-mono font-medium text-primary">
                               +{(buildingIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                             </p>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">Werbungskosten</p>
                             <p className="font-mono font-medium text-destructive">
                               -{(buildingExpenses / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                             </p>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">Ergebnis</p>
                             <p className="font-mono font-bold">
                               {(buildingResult / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                             </p>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
             </CardContent>
           </Card>
         )}
 
         {/* Step 5: Export */}
         {step === 5 && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <FileText className="h-5 w-5" />
                 5. Vorschau & Export
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="p-6 bg-muted/50 rounded-lg space-y-4">
                 <h3 className="font-bold text-lg">Anlage V - Zusammenfassung {currentYear}</h3>
                 
                 <div className="grid gap-4 md:grid-cols-2">
                   <div className="space-y-2">
                     <p className="text-sm text-muted-foreground">Zeile 21 - Einnahmen aus V+V</p>
                     <p className="font-mono font-bold text-lg">
                       {(rentalIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                     </p>
                   </div>
                   <div className="space-y-2">
                     <p className="text-sm text-muted-foreground">Zeile 33 - AfA</p>
                     <p className="font-mono font-bold text-lg">
                       {(totalAfA / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                     </p>
                   </div>
                   <div className="space-y-2">
                     <p className="text-sm text-muted-foreground">Zeile 46 - Sonstige Werbungskosten</p>
                     <p className="font-mono font-bold text-lg">
                       {((totalWerbungskosten - totalAfA) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                     </p>
                   </div>
                   <div className="space-y-2">
                     <p className="text-sm text-muted-foreground">Einkünfte aus V+V</p>
                     <p className={cn(
                       "font-mono font-bold text-xl",
                       taxableIncome >= 0 ? "text-primary" : "text-destructive"
                     )}>
                       {(taxableIncome / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                     </p>
                   </div>
                 </div>
               </div>
 
               <div className="flex gap-3">
                 <Button onClick={handleExport} className="flex-1">
                   <Download className="h-4 w-4 mr-2" />
                   Als PDF exportieren
                 </Button>
                 <Button variant="outline" className="flex-1" disabled>
                   ELSTER-XML exportieren
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Navigation */}
         <div className="flex justify-between">
           <Button
             variant="outline"
             onClick={() => step === 1 ? navigate("/taxes") : setStep((s) => s - 1)}
           >
             <ArrowLeft className="h-4 w-4 mr-2" />
             {step === 1 ? "Abbrechen" : "Zurück"}
           </Button>
           {step < 5 && (
             <Button
               onClick={() => setStep((s) => s + 1)}
               disabled={step === 1 && selectedBuildings.length === 0}
             >
               Weiter
               <ArrowRight className="h-4 w-4 ml-2" />
             </Button>
           )}
         </div>
       </div>
     </MainLayout>
   );
 }