 import { useState, useMemo } from "react";
 import { useNavigate } from "react-router-dom";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import { Calendar } from "@/components/ui/calendar";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { useBillingWizard } from "./BillingWizardContext";
 import { useBuildings } from "@/hooks/useBuildings";
 import { useAuth } from "@/hooks/useAuth";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { formatCurrency, cn } from "@/lib/utils";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import {
   Building,
   CalendarIcon,
   Euro,
   Users,
   TrendingUp,
   TrendingDown,
   FileText,
   Mail,
   Save,
   CheckCircle,
   Loader2,
 } from "lucide-react";
 
 export function StepSummary() {
   const navigate = useNavigate();
   const { profile } = useAuth();
   const {
     wizardData,
     updateWizardData,
     totalCosts,
     resetWizard,
   } = useBillingWizard();
 
   const { useBuilding } = useBuildings();
   const { data: building } = useBuilding(wizardData.buildingId || undefined);
 
   const [isSaving, setIsSaving] = useState(false);
   const [isCreating, setIsCreating] = useState(false);
 
   // Calculate summary stats
   const summaryStats = useMemo(() => {
     const results = wizardData.calculationResults;
     const tenantsWithPayment = results.filter((r) => r.result < 0 && r.tenantName);
     const tenantsWithCredit = results.filter((r) => r.result > 0 && r.tenantName);
     const totalPaymentsDue = tenantsWithPayment.reduce((sum, r) => sum + Math.abs(r.result), 0);
     const totalCredits = tenantsWithCredit.reduce((sum, r) => sum + r.result, 0);
     const activeUnits = results.filter((r) => !wizardData.unitDistributions.find((u) => u.unitId === r.unitId)?.isVacant);
     const tenantCount = activeUnits.filter((r) => r.tenantName).length;
 
     return {
       tenantsWithPayment: tenantsWithPayment.length,
       tenantsWithCredit: tenantsWithCredit.length,
       totalPaymentsDue,
       totalCredits,
       unitCount: wizardData.unitDistributions.length,
       tenantCount,
     };
   }, [wizardData.calculationResults, wizardData.unitDistributions]);
 
   // Active cost types
   const activeCostTypes = useMemo(() => {
     return wizardData.costItems
       .filter((c) => c.isActive && c.amount > 0)
       .map((c) => ({ name: c.name, amount: c.amount }));
   }, [wizardData.costItems]);
 
   // Check if any tenant has email
   const hasTenantsWithEmail = useMemo(() => {
     // For now, assume some tenants have email - in production, check actual tenant data
     return summaryStats.tenantCount > 0;
   }, [summaryStats.tenantCount]);
 
   const saveStatement = async (status: "draft" | "calculated") => {
     if (!profile?.organization_id) {
       toast.error("Keine Organisation gefunden");
       return null;
     }
 
     // Create main statement
     const { data: statement, error: statementError } = await supabase
       .from("operating_cost_statements")
       .insert({
         organization_id: profile.organization_id,
         building_id: wizardData.buildingId,
         period_start: wizardData.periodStart?.toISOString().split("T")[0],
         period_end: wizardData.periodEnd?.toISOString().split("T")[0],
         total_costs: totalCosts,
         status,
         payment_deadline: wizardData.paymentDeadline?.toISOString().split("T")[0],
         vacancy_costs_to_landlord: wizardData.vacancyCostsToLandlord,
         options_generate_pdf: wizardData.optionsGeneratePdf,
         options_individual_statements: wizardData.optionsIndividualStatements,
         options_send_email: wizardData.optionsSendEmail,
       })
       .select()
       .single();
 
     if (statementError) {
       console.error("Error creating statement:", statementError);
       throw statementError;
     }
 
     // Create cost items
     const costItemsToInsert = wizardData.costItems
       .filter((c) => c.isActive && c.amount > 0)
       .map((c) => ({
         statement_id: statement.id,
         cost_type: c.id,
         cost_name: c.name,
         amount: c.amount,
         distribution_key: c.distributionKey,
         is_custom: c.isCustom || false,
       }));
 
     if (costItemsToInsert.length > 0) {
       const { error: itemsError } = await supabase
         .from("operating_cost_items")
         .insert(costItemsToInsert);
 
       if (itemsError) {
         console.error("Error creating cost items:", itemsError);
         throw itemsError;
       }
     }
 
     // Create tenant results
     const tenantResultsToInsert = wizardData.calculationResults.map((r) => {
       const unitData = wizardData.unitDistributions.find((u) => u.unitId === r.unitId);
       return {
         statement_id: statement.id,
         unit_id: r.unitId,
         tenant_id: unitData?.tenantId || null,
         unit_number: r.unitNumber,
         tenant_name: r.tenantName,
         area: unitData?.area || 0,
         persons: unitData?.persons || 0,
         heating_share: unitData?.heatingShare || 0,
         prepayments: r.prepayments,
         cost_share: r.costShare,
         result: r.result,
         cost_breakdown: r.costBreakdown,
         is_vacant: unitData?.isVacant || false,
       };
     });
 
     if (tenantResultsToInsert.length > 0) {
       const { error: resultsError } = await supabase
         .from("operating_cost_tenant_results")
         .insert(tenantResultsToInsert);
 
       if (resultsError) {
         console.error("Error creating tenant results:", resultsError);
         throw resultsError;
       }
     }
 
     return statement;
   };
 
   const handleSaveAsDraft = async () => {
     setIsSaving(true);
     try {
       const statement = await saveStatement("draft");
       if (statement) {
         toast.success("Abrechnung als Entwurf gespeichert");
         resetWizard();
         navigate(`/betriebskosten/${statement.id}`);
       }
     } catch (error) {
       toast.error("Fehler beim Speichern des Entwurfs");
     } finally {
       setIsSaving(false);
     }
   };
 
   const handleCreateStatement = async () => {
     setIsCreating(true);
     try {
       const statement = await saveStatement("calculated");
       if (statement) {
         // TODO: If optionsGeneratePdf is true, trigger PDF generation edge function
         // TODO: If optionsSendEmail is true, trigger email sending
         
         toast.success("Betriebskostenabrechnung erfolgreich erstellt");
         resetWizard();
         navigate(`/betriebskosten/${statement.id}`);
       }
     } catch (error) {
       toast.error("Fehler beim Erstellen der Abrechnung");
     } finally {
       setIsCreating(false);
     }
   };
 
   const formatDateRange = () => {
     if (!wizardData.periodStart || !wizardData.periodEnd) return "–";
     return `${format(wizardData.periodStart, "dd.MM.yyyy", { locale: de })} – ${format(wizardData.periodEnd, "dd.MM.yyyy", { locale: de })}`;
   };
 
   return (
     <div className="space-y-6">
       {/* Summary Cards Grid */}
       <div className="grid gap-6 md:grid-cols-3">
         {/* Card 1: Abrechnungsdetails */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-lg flex items-center gap-2">
               <Building className="h-5 w-5" />
               Abrechnungsdetails
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             <div>
               <p className="text-sm text-muted-foreground">Gebäude</p>
               <p className="font-medium">{building?.name || "–"}</p>
               <p className="text-sm text-muted-foreground">{building?.address}, {building?.postal_code} {building?.city}</p>
             </div>
             <Separator />
             <div>
               <p className="text-sm text-muted-foreground">Abrechnungszeitraum</p>
               <p className="font-medium">{formatDateRange()}</p>
             </div>
             <Separator />
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <p className="text-sm text-muted-foreground">Einheiten</p>
                 <p className="text-xl font-bold">{summaryStats.unitCount}</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Mieter</p>
                 <p className="text-xl font-bold">{summaryStats.tenantCount}</p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Card 2: Kostenübersicht */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-lg flex items-center gap-2">
               <Euro className="h-5 w-5" />
               Kostenübersicht
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             <div>
               <p className="text-sm text-muted-foreground">Gesamtkosten</p>
               <p className="text-2xl font-bold">{formatCurrency(totalCosts / 100)}</p>
             </div>
             <Separator />
             <div>
               <p className="text-sm text-muted-foreground mb-2">Kostenarten ({activeCostTypes.length})</p>
               <div className="space-y-1 max-h-32 overflow-y-auto">
                 {activeCostTypes.map((cost) => (
                   <div key={cost.name} className="flex justify-between text-sm">
                     <span>{cost.name}</span>
                     <span className="font-medium">{formatCurrency(cost.amount / 100)}</span>
                   </div>
                 ))}
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Card 3: Ergebnisse */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-lg flex items-center gap-2">
               <Users className="h-5 w-5" />
               Ergebnisse
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             <div className="grid grid-cols-2 gap-4">
               <div className="p-3 rounded-lg bg-destructive/10">
                 <div className="flex items-center gap-2 text-destructive">
                   <TrendingDown className="h-4 w-4" />
                   <span className="text-sm">Nachzahlungen</span>
                 </div>
                 <p className="text-lg font-bold text-destructive">{summaryStats.tenantsWithPayment}</p>
                 <p className="text-sm text-destructive/80">{formatCurrency(summaryStats.totalPaymentsDue / 100)}</p>
               </div>
               <div className="p-3 rounded-lg bg-primary/10">
                 <div className="flex items-center gap-2 text-primary">
                   <TrendingUp className="h-4 w-4" />
                   <span className="text-sm">Guthaben</span>
                 </div>
                 <p className="text-lg font-bold text-primary">{summaryStats.tenantsWithCredit}</p>
                 <p className="text-sm text-primary/80">{formatCurrency(summaryStats.totalCredits / 100)}</p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Options Card */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">Optionen</CardTitle>
           <CardDescription>Wählen Sie die gewünschten Ausgabeoptionen</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="flex items-center space-x-3">
             <Checkbox
               id="generatePdf"
               checked={wizardData.optionsGeneratePdf}
               onCheckedChange={(checked) =>
                 updateWizardData({ optionsGeneratePdf: checked as boolean })
               }
             />
             <Label htmlFor="generatePdf" className="cursor-pointer flex items-center gap-2">
               <FileText className="h-4 w-4 text-muted-foreground" />
               Abrechnungen als PDF generieren
             </Label>
           </div>
 
           <div className="flex items-center space-x-3">
             <Checkbox
               id="individualStatements"
               checked={wizardData.optionsIndividualStatements}
               onCheckedChange={(checked) =>
                 updateWizardData({ optionsIndividualStatements: checked as boolean })
               }
             />
             <Label htmlFor="individualStatements" className="cursor-pointer flex items-center gap-2">
               <Users className="h-4 w-4 text-muted-foreground" />
               Einzelabrechnungen pro Mieter erstellen
             </Label>
           </div>
 
           <div className="flex items-center space-x-3">
             <Checkbox
               id="sendEmail"
               checked={wizardData.optionsSendEmail}
               onCheckedChange={(checked) =>
                 updateWizardData({ optionsSendEmail: checked as boolean })
               }
               disabled={!hasTenantsWithEmail}
             />
             <Label
               htmlFor="sendEmail"
               className={cn(
                 "cursor-pointer flex items-center gap-2",
                 !hasTenantsWithEmail && "opacity-50"
               )}
             >
               <Mail className="h-4 w-4 text-muted-foreground" />
               Abrechnungen per E-Mail versenden
               {!hasTenantsWithEmail && (
                 <Badge variant="outline" className="text-xs">Keine E-Mail-Adressen</Badge>
               )}
             </Label>
           </div>
         </CardContent>
       </Card>
 
       {/* Payment Deadline Card */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">Frist für Nachzahlung</CardTitle>
           <CardDescription>Bis wann müssen Nachzahlungen geleistet werden?</CardDescription>
         </CardHeader>
         <CardContent>
           <Popover>
             <PopoverTrigger asChild>
               <Button
                 variant="outline"
                 className={cn(
                   "w-[280px] justify-start text-left font-normal",
                   !wizardData.paymentDeadline && "text-muted-foreground"
                 )}
               >
                 <CalendarIcon className="mr-2 h-4 w-4" />
                 {wizardData.paymentDeadline ? (
                   format(wizardData.paymentDeadline, "dd. MMMM yyyy", { locale: de })
                 ) : (
                   <span>Datum auswählen</span>
                 )}
               </Button>
             </PopoverTrigger>
             <PopoverContent className="w-auto p-0" align="start">
               <Calendar
                 mode="single"
                 selected={wizardData.paymentDeadline || undefined}
                 onSelect={(date) => updateWizardData({ paymentDeadline: date || null })}
                 locale={de}
                 disabled={(date) => date < new Date()}
                 initialFocus
               />
             </PopoverContent>
           </Popover>
         </CardContent>
       </Card>
 
       {/* Action Buttons */}
       <div className="flex justify-end gap-3 pt-4">
         <Button
           variant="outline"
           onClick={handleSaveAsDraft}
           disabled={isSaving || isCreating}
         >
           {isSaving ? (
             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
           ) : (
             <Save className="h-4 w-4 mr-2" />
           )}
           Als Entwurf speichern
         </Button>
         <Button
           onClick={handleCreateStatement}
           disabled={isSaving || isCreating}
         >
           {isCreating ? (
             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
           ) : (
             <CheckCircle className="h-4 w-4 mr-2" />
           )}
           Abrechnung erstellen
         </Button>
       </div>
     </div>
   );
 }