 import { useEffect, useMemo } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
 import { useBillingWizard } from "./BillingWizardContext";
 import { formatCurrency, cn } from "@/lib/utils";
 import { Calculator, ChevronDown, TrendingUp, TrendingDown, Euro, Home, User } from "lucide-react";
 
 const DISTRIBUTION_KEY_LABELS: Record<string, string> = {
   area: "Nach m²",
   persons: "Nach Personen",
   units: "Nach Einheiten",
   consumption: "Nach Verbrauch",
 };
 
 export function StepCalculation() {
   const { wizardData, calculateResults, totalCosts } = useBillingWizard();
 
   // Calculate results when component mounts or data changes
   useEffect(() => {
     calculateResults();
   }, [wizardData.unitDistributions, wizardData.costItems, wizardData.vacancyCostsToLandlord]);
 
   const summaryData = useMemo(() => {
     const results = wizardData.calculationResults;
     const totalCredits = results
       .filter((r) => r.result > 0)
       .reduce((sum, r) => sum + r.result, 0);
     const totalPaymentsDue = results
       .filter((r) => r.result < 0)
       .reduce((sum, r) => sum + Math.abs(r.result), 0);
     const creditsCount = results.filter((r) => r.result > 0).length;
     const paymentsCount = results.filter((r) => r.result < 0).length;
 
     return { totalCredits, totalPaymentsDue, creditsCount, paymentsCount };
   }, [wizardData.calculationResults]);
 
   return (
     <div className="space-y-6">
       {/* Summary Cards */}
       <div className="grid gap-4 md:grid-cols-3">
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="rounded-lg bg-primary/10 p-2">
                 <Euro className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Gesamtkosten</p>
                 <p className="text-2xl font-bold">{formatCurrency(totalCosts / 100)}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card className="bg-primary/5 border-primary/20">
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="rounded-lg bg-primary/10 p-2">
                 <TrendingUp className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <p className="text-sm text-primary">Guthaben ({summaryData.creditsCount})</p>
                 <p className="text-2xl font-bold text-primary">
                   {formatCurrency(summaryData.totalCredits / 100)}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card className="bg-destructive/5 border-destructive/20">
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="rounded-lg bg-destructive/10 p-2">
                 <TrendingDown className="h-5 w-5 text-destructive" />
               </div>
               <div>
                 <p className="text-sm text-destructive">Nachzahlungen ({summaryData.paymentsCount})</p>
                 <p className="text-2xl font-bold text-destructive">
                   {formatCurrency(summaryData.totalPaymentsDue / 100)}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Results Table */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Calculator className="h-5 w-5" />
             Ergebnisse pro Mieter
           </CardTitle>
           <CardDescription>
             Klicken Sie auf eine Zeile, um die Kostenaufschlüsselung zu sehen
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="space-y-2">
             {/* Header */}
             <div
               className="grid gap-4 items-center px-4 py-3 bg-muted rounded-lg font-medium text-sm"
               style={{ gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr" }}
             >
               <span>Einheit</span>
               <span>Mieter</span>
               <span className="text-right">Kosten-Anteil</span>
               <span className="text-right">Vorauszahlungen</span>
               <span className="text-right">Ergebnis</span>
             </div>
 
             {/* Result Rows */}
             {wizardData.calculationResults.map((result) => (
               <Collapsible key={result.unitId}>
                 <CollapsibleTrigger asChild>
                   <div
                     className={cn(
                       "grid gap-4 items-center px-4 py-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                       result.result > 0 && "border-l-4 border-l-primary",
                       result.result < 0 && "border-l-4 border-l-destructive"
                     )}
                     style={{ gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr" }}
                   >
                     {/* Unit */}
                     <div className="flex items-center gap-2">
                       <Home className="h-4 w-4 text-muted-foreground" />
                       <span className="font-medium">{result.unitNumber}</span>
                       <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto transition-transform group-data-[state=open]:rotate-180" />
                     </div>
 
                     {/* Tenant */}
                     <div className="flex items-center gap-2">
                       {result.tenantName ? (
                         <>
                           <User className="h-4 w-4 text-muted-foreground" />
                           <span>{result.tenantName}</span>
                         </>
                       ) : (
                         <Badge variant="secondary">Leerstand</Badge>
                       )}
                     </div>
 
                     {/* Cost Share */}
                     <div className="text-right font-medium">
                       {formatCurrency(result.costShare / 100)}
                     </div>
 
                     {/* Prepayments */}
                     <div className="text-right text-muted-foreground">
                       {formatCurrency(result.prepayments / 100)}
                     </div>
 
                     {/* Result */}
                     <div
                       className={cn(
                         "text-right font-bold",
                         result.result > 0 && "text-primary",
                         result.result < 0 && "text-destructive"
                       )}
                     >
                       {result.result > 0 ? "+" : ""}
                       {formatCurrency(result.result / 100)}
                       <span className="text-xs font-normal ml-1">
                         {result.result > 0 ? "(Guthaben)" : result.result < 0 ? "(Nachzahlung)" : ""}
                       </span>
                     </div>
                   </div>
                 </CollapsibleTrigger>
 
                 {/* Expandable Detail */}
                 <CollapsibleContent>
                   <div className="ml-4 mr-4 mb-2 p-4 bg-muted/30 rounded-lg border-l-2 border-muted">
                     <h4 className="font-medium text-sm mb-3">Kostenaufschlüsselung</h4>
                     {result.costBreakdown.length > 0 ? (
                       <div className="space-y-2">
                         {result.costBreakdown.map((cost) => (
                           <div
                             key={cost.costItemId}
                             className="grid gap-2 items-center text-sm"
                             style={{ gridTemplateColumns: "1fr auto auto" }}
                           >
                             <div>
                               <span className="font-medium">{cost.costItemName}</span>
                               <Badge variant="outline" className="ml-2 text-xs">
                                 {DISTRIBUTION_KEY_LABELS[cost.distributionKey]}
                               </Badge>
                             </div>
                             <div className="text-muted-foreground text-xs font-mono">
                               {cost.formula}
                             </div>
                             <div className="font-medium text-right">
                               {formatCurrency(cost.share / 100)}
                             </div>
                           </div>
                         ))}
                         <Separator className="my-2" />
                         <div className="flex justify-between font-semibold">
                           <span>Summe Kostenanteil</span>
                           <span>{formatCurrency(result.costShare / 100)}</span>
                         </div>
                         <div className="flex justify-between text-muted-foreground">
                           <span>Abzüglich Vorauszahlungen</span>
                           <span>- {formatCurrency(result.prepayments / 100)}</span>
                         </div>
                         <Separator className="my-2" />
                         <div
                           className={cn(
                             "flex justify-between font-bold",
                             result.result > 0 && "text-primary",
                             result.result < 0 && "text-destructive"
                           )}
                         >
                           <span>Ergebnis</span>
                           <span>
                             {result.result > 0 ? "+" : ""}
                             {formatCurrency(result.result / 100)}
                           </span>
                         </div>
                       </div>
                     ) : (
                       <p className="text-sm text-muted-foreground">
                         Keine Kosten zugeordnet (Leerstand, Kosten auf Vermieter)
                       </p>
                     )}
                   </div>
                 </CollapsibleContent>
               </Collapsible>
             ))}
 
             {/* Summary Row */}
             <Separator className="my-4" />
             <div
               className="grid gap-4 items-center px-4 py-3 bg-primary/5 rounded-lg font-semibold"
               style={{ gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr" }}
             >
               <span>Summe</span>
               <span></span>
               <span className="text-right">
                 {formatCurrency(
                   wizardData.calculationResults.reduce((sum, r) => sum + r.costShare, 0) / 100
                 )}
               </span>
               <span className="text-right">
                 {formatCurrency(
                   wizardData.calculationResults.reduce((sum, r) => sum + r.prepayments, 0) / 100
                 )}
               </span>
               <span className="text-right">
                 <span className="text-primary mr-2">
                   +{formatCurrency(summaryData.totalCredits / 100)}
                 </span>
                 <span className="text-destructive">
                   -{formatCurrency(summaryData.totalPaymentsDue / 100)}
                 </span>
               </span>
             </div>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }