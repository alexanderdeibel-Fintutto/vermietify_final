 import { useState, useEffect } from "react";
 import { useNavigate, useSearchParams } from "react-router-dom";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader } from "@/components/shared/PageHeader";
 import { LoadingState } from "@/components/shared";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Progress } from "@/components/ui/progress";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 import { useElster, FORM_TYPE_LABELS, type ElsterFormType } from "@/hooks/useElster";
 import { useBuildings } from "@/hooks/useBuildings";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import {
   ArrowLeft,
   ArrowRight,
   FileText,
   Building2,
   Eye,
   Send,
   CheckCircle2,
   XCircle,
   AlertTriangle,
   Loader2,
   Download,
 } from "lucide-react";
 
 const currentYear = new Date().getFullYear();
 const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 - i);
 
 export default function ElsterSubmit() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const existingId = searchParams.get("id");
 
   const {
     useSubmission,
     useActiveCertificate,
     useSettings,
     createSubmission,
     generateXml,
     validateData,
     submitToElster,
   } = useElster();
  const { useBuildingsList } = useBuildings();
 
   const { data: existingSubmission, isLoading: loadingExisting } = useSubmission(existingId || undefined);
   const { data: activeCert } = useActiveCertificate();
   const { data: settings } = useSettings();
  const { data: buildingsData, isLoading: loadingBuildings } = useBuildingsList(1, 100);

  const buildings = buildingsData?.buildings || [];
 
   const [step, setStep] = useState(1);
   const [formType, setFormType] = useState<ElsterFormType>("anlage_v");
   const [taxYear, setTaxYear] = useState(currentYear - 1);
   const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
   const [submissionId, setSubmissionId] = useState<string | null>(existingId);
   const [generatedData, setGeneratedData] = useState<Record<string, unknown> | null>(null);
   const [validationResult, setValidationResult] = useState<{
     isValid: boolean;
     errors: Array<{ field: string; message: string }>;
     warnings: Array<{ field: string; message: string }>;
   } | null>(null);
   const [pin, setPin] = useState("");
   const [confirmed, setConfirmed] = useState(false);
   const [submitting, setSubmitting] = useState(false);
   const [submitResult, setSubmitResult] = useState<{
     success: boolean;
     transferTicket?: string;
     error?: string;
     testMode?: boolean;
   } | null>(null);
 
   // Load existing submission data
   useEffect(() => {
     if (existingSubmission) {
       setFormType(existingSubmission.form_type);
       setTaxYear(existingSubmission.tax_year);
       setSelectedBuildings(existingSubmission.building_ids || []);
       if (existingSubmission.data_json && Object.keys(existingSubmission.data_json).length > 0) {
         setGeneratedData(existingSubmission.data_json);
         setStep(3);
       }
     }
   }, [existingSubmission]);
 
   const isLoading = loadingExisting || loadingBuildings;
 
   const handleNext = async () => {
     if (step === 1) {
       // Create submission if not exists
       if (!submissionId) {
         const result = await createSubmission.mutateAsync({
           formType,
           taxYear,
           buildingIds: formType === "anlage_v" ? selectedBuildings : undefined,
         });
         setSubmissionId(result.id);
       }
       setStep(2);
     } else if (step === 2) {
       // Validate and generate XML
       if (submissionId) {
         const validation = await validateData.mutateAsync(submissionId);
         setValidationResult(validation);
 
         if (validation?.isValid) {
           const generated = await generateXml.mutateAsync(submissionId);
           setGeneratedData(generated.dataJson);
         }
       }
       setStep(3);
     } else if (step === 3) {
       setStep(4);
     } else if (step === 4) {
       // Submit to ELSTER
       if (submissionId && pin && confirmed) {
         setSubmitting(true);
         try {
           const result = await submitToElster.mutateAsync({
             submissionId,
             pin,
           });
           setSubmitResult({
             success: true,
             transferTicket: result.transferTicket,
             testMode: result.testMode,
           });
           setStep(5);
         } catch (error) {
           setSubmitResult({
             success: false,
             error: error instanceof Error ? error.message : "Übertragung fehlgeschlagen",
           });
           setStep(5);
         } finally {
           setSubmitting(false);
         }
       }
     }
   };
 
   const handleBack = () => {
     if (step > 1) setStep(step - 1);
   };
 
   const toggleBuilding = (buildingId: string) => {
     setSelectedBuildings((prev) =>
       prev.includes(buildingId)
         ? prev.filter((id) => id !== buildingId)
         : [...prev, buildingId]
     );
   };
 
   const canProceed = () => {
     if (step === 1) {
       if (formType === "anlage_v") {
         return selectedBuildings.length > 0;
       }
       return true;
     }
     if (step === 2) {
       return !settings?.tax_number ? false : true;
     }
     if (step === 3) {
       return generatedData !== null;
     }
     if (step === 4) {
       return pin.length > 0 && confirmed && activeCert;
     }
     return false;
   };
 
   if (isLoading) {
     return (
       <MainLayout title="ELSTER-Übertragung">
         <LoadingState />
       </MainLayout>
     );
   }
 
   const dataJson = generatedData as {
     buildings?: Array<{
       id: string;
       name: string;
       income: number;
       expenses: number;
       afa: number;
     }>;
     totals?: {
       income: number;
       expenses: number;
       afa: number;
       result: number;
     };
   } | null;
 
   return (
     <MainLayout title="ELSTER-Übertragung">
       <div className="space-y-6">
         <PageHeader
           title="ELSTER-Übertragung"
           subtitle={`Schritt ${step} von 5`}
           actions={
             <Button variant="outline" onClick={() => navigate("/steuern/elster")}>
               <ArrowLeft className="mr-2 h-4 w-4" />
               Zurück zur Übersicht
             </Button>
           }
         />
 
         {/* Progress */}
         <div className="space-y-2">
           <Progress value={(step / 5) * 100} className="h-2" />
           <div className="flex justify-between text-sm text-muted-foreground">
             <span className={step >= 1 ? "text-primary font-medium" : ""}>Formular</span>
             <span className={step >= 2 ? "text-primary font-medium" : ""}>Prüfen</span>
             <span className={step >= 3 ? "text-primary font-medium" : ""}>Vorschau</span>
             <span className={step >= 4 ? "text-primary font-medium" : ""}>Übertragen</span>
             <span className={step >= 5 ? "text-primary font-medium" : ""}>Bestätigung</span>
           </div>
         </div>
 
         {/* Step 1: Form & Year Selection */}
         {step === 1 && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <FileText className="h-5 w-5" />
                 Formular & Jahr wählen
               </CardTitle>
               <CardDescription>
                 Wählen Sie das Formular und das Steuerjahr
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label>Formular-Typ</Label>
                   <Select
                     value={formType}
                     onValueChange={(v) => setFormType(v as ElsterFormType)}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       {Object.entries(FORM_TYPE_LABELS).map(([value, label]) => (
                         <SelectItem key={value} value={value}>
                           {label}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
 
                 <div className="space-y-2">
                   <Label>Steuerjahr</Label>
                   <Select
                     value={String(taxYear)}
                     onValueChange={(v) => setTaxYear(Number(v))}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       {years.map((year) => (
                         <SelectItem key={year} value={String(year)}>
                           {year}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
 
               {formType === "anlage_v" && (
                 <div className="space-y-4">
                   <Label>Objekte auswählen</Label>
                   {buildings.length === 0 ? (
                     <Alert>
                       <AlertTriangle className="h-4 w-4" />
                       <AlertTitle>Keine Objekte</AlertTitle>
                       <AlertDescription>
                         Sie haben noch keine Immobilien angelegt.
                       </AlertDescription>
                     </Alert>
                   ) : (
                     <div className="grid gap-2">
                       {buildings.map((building) => (
                         <div
                           key={building.id}
                           className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                             selectedBuildings.includes(building.id)
                               ? "border-primary bg-primary/5"
                               : "hover:bg-muted/50"
                           }`}
                           onClick={() => toggleBuilding(building.id)}
                         >
                           <Checkbox
                             checked={selectedBuildings.includes(building.id)}
                             onCheckedChange={() => toggleBuilding(building.id)}
                           />
                           <Building2 className="h-5 w-5 text-muted-foreground" />
                           <div>
                             <p className="font-medium">{building.name}</p>
                             <p className="text-sm text-muted-foreground">
                               {building.address}, {building.postal_code} {building.city}
                             </p>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               )}
             </CardContent>
           </Card>
         )}
 
         {/* Step 2: Data Validation */}
         {step === 2 && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Eye className="h-5 w-5" />
                 Daten prüfen
               </CardTitle>
               <CardDescription>
                 Überprüfung der erforderlichen Daten
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               {validateData.isPending || generateXml.isPending ? (
                 <div className="flex items-center justify-center py-8">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                   <span className="ml-2">Daten werden geprüft...</span>
                 </div>
               ) : validationResult ? (
                 <div className="space-y-4">
                   {validationResult.errors.length > 0 && (
                     <Alert variant="destructive">
                       <XCircle className="h-4 w-4" />
                       <AlertTitle>Fehler gefunden</AlertTitle>
                       <AlertDescription>
                         <ul className="list-disc list-inside mt-2">
                           {validationResult.errors.map((err, i) => (
                             <li key={i}>{err.message}</li>
                           ))}
                         </ul>
                       </AlertDescription>
                     </Alert>
                   )}
 
                   {validationResult.warnings.length > 0 && (
                     <Alert>
                       <AlertTriangle className="h-4 w-4" />
                       <AlertTitle>Hinweise</AlertTitle>
                       <AlertDescription>
                         <ul className="list-disc list-inside mt-2">
                           {validationResult.warnings.map((warn, i) => (
                             <li key={i}>{warn.message}</li>
                           ))}
                         </ul>
                       </AlertDescription>
                     </Alert>
                   )}
 
                   {validationResult.isValid && (
                     <Alert className="border-green-500 bg-green-50">
                       <CheckCircle2 className="h-4 w-4 text-green-600" />
                       <AlertTitle className="text-green-800">Prüfung erfolgreich</AlertTitle>
                       <AlertDescription className="text-green-700">
                         Alle erforderlichen Daten sind vorhanden.
                       </AlertDescription>
                     </Alert>
                   )}
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div className="p-4 border rounded-lg space-y-2">
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Formular</span>
                       <span className="font-medium">{FORM_TYPE_LABELS[formType]}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Steuerjahr</span>
                       <span className="font-medium">{taxYear}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Steuernummer</span>
                       <span className="font-medium">{settings?.tax_number || "Nicht hinterlegt"}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Finanzamt</span>
                       <span className="font-medium">{settings?.tax_office_name || "Nicht ausgewählt"}</span>
                     </div>
                     {formType === "anlage_v" && (
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Objekte</span>
                         <span className="font-medium">{selectedBuildings.length} ausgewählt</span>
                       </div>
                     )}
                   </div>
 
                   {(!settings?.tax_number || !settings?.tax_office_id) && (
                     <Alert variant="destructive">
                       <AlertTriangle className="h-4 w-4" />
                       <AlertTitle>Fehlende Einstellungen</AlertTitle>
                       <AlertDescription>
                         Bitte hinterlegen Sie Ihre Steuernummer und Ihr Finanzamt in den ELSTER-Einstellungen.
                       </AlertDescription>
                     </Alert>
                   )}
 
                   {!activeCert && (
                     <Alert variant="destructive">
                       <AlertTriangle className="h-4 w-4" />
                       <AlertTitle>Kein Zertifikat</AlertTitle>
                       <AlertDescription>
                         Für die Übertragung wird ein gültiges ELSTER-Zertifikat benötigt.
                       </AlertDescription>
                     </Alert>
                   )}
                 </div>
               )}
             </CardContent>
           </Card>
         )}
 
         {/* Step 3: Preview */}
         {step === 3 && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Eye className="h-5 w-5" />
                 Vorschau
               </CardTitle>
               <CardDescription>
                 Zusammenfassung der zu übertragenden Daten
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               {dataJson?.buildings && (
                 <div className="space-y-4">
                   {dataJson.buildings.map((building) => (
                     <div key={building.id} className="p-4 border rounded-lg">
                       <h4 className="font-medium mb-3">{building.name}</h4>
                       <div className="grid gap-2 text-sm">
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">Mieteinnahmen</span>
                           <span className="font-medium text-green-600">
                             +{(building.income / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                           </span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">AfA</span>
                           <span className="font-medium text-red-600">
                             -{(building.afa / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                           </span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">Sonstige Kosten</span>
                           <span className="font-medium text-red-600">
                             -{(building.expenses / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                           </span>
                         </div>
                         <div className="flex justify-between pt-2 border-t">
                           <span className="font-medium">Ergebnis</span>
                           <span className="font-bold">
                             {((building.income - building.expenses - building.afa) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                           </span>
                         </div>
                       </div>
                     </div>
                   ))}
 
                   {dataJson.totals && (
                     <div className="p-4 border-2 border-primary rounded-lg">
                       <h4 className="font-medium mb-3">Gesamt Anlage V</h4>
                       <div className="grid gap-2 text-sm">
                         <div className="flex justify-between">
                           <span>Gesamteinnahmen</span>
                           <span className="font-medium text-green-600">
                             +{(dataJson.totals.income / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                           </span>
                         </div>
                         <div className="flex justify-between">
                           <span>Werbungskosten (inkl. AfA)</span>
                           <span className="font-medium text-red-600">
                             -{((dataJson.totals.expenses + dataJson.totals.afa) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                           </span>
                         </div>
                         <div className="flex justify-between pt-2 border-t">
                           <span className="font-bold">Einkünfte aus V+V</span>
                           <span className="font-bold text-lg">
                             {(dataJson.totals.result / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                           </span>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               )}
 
               <Button variant="outline" className="w-full">
                 <Download className="mr-2 h-4 w-4" />
                 PDF-Vorschau herunterladen
               </Button>
             </CardContent>
           </Card>
         )}
 
         {/* Step 4: Submit */}
         {step === 4 && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Send className="h-5 w-5" />
                 An ELSTER übertragen
               </CardTitle>
               <CardDescription>
                 Geben Sie Ihre Zertifikats-PIN ein
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               {settings?.test_mode && (
                 <Alert>
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Test-Modus aktiv</AlertTitle>
                   <AlertDescription>
                     Die Übertragung erfolgt an den ELSTER-Testserver und wird nicht an das Finanzamt gesendet.
                   </AlertDescription>
                 </Alert>
               )}
 
               <div className="space-y-2">
                 <Label>Zertifikat-PIN</Label>
                 <Input
                   type="password"
                   value={pin}
                   onChange={(e) => setPin(e.target.value)}
                   placeholder="••••••"
                   className="max-w-xs"
                 />
                 <p className="text-xs text-muted-foreground">
                   Die PIN, die Sie beim Erstellen Ihres ELSTER-Zertifikats festgelegt haben
                 </p>
               </div>
 
               <div className="flex items-start gap-2">
                 <Checkbox
                   id="confirm"
                   checked={confirmed}
                   onCheckedChange={(checked) => setConfirmed(!!checked)}
                 />
                 <Label htmlFor="confirm" className="text-sm font-normal">
                   Ich bestätige die Richtigkeit der Angaben und beauftrage die Übertragung an das Finanzamt.
                 </Label>
               </div>
 
               {!activeCert && (
                 <Alert variant="destructive">
                   <XCircle className="h-4 w-4" />
                   <AlertTitle>Kein Zertifikat</AlertTitle>
                   <AlertDescription>
                     Sie benötigen ein gültiges ELSTER-Zertifikat für die Übertragung.
                   </AlertDescription>
                 </Alert>
               )}
             </CardContent>
           </Card>
         )}
 
         {/* Step 5: Confirmation */}
         {step === 5 && (
           <Card>
             <CardContent className="py-8">
               <div className="text-center space-y-4">
                 {submitResult?.success ? (
                   <>
                     <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                       <CheckCircle2 className="h-10 w-10 text-green-600" />
                     </div>
                     <div>
                       <h3 className="text-xl font-semibold">Erfolgreich übertragen!</h3>
                       <p className="text-muted-foreground mt-1">
                         {submitResult.testMode
                           ? "Die Daten wurden an den ELSTER-Testserver übertragen."
                           : "Die Daten wurden an das Finanzamt übertragen."}
                       </p>
                     </div>
                     <div className="p-4 bg-muted rounded-lg">
                       <p className="text-sm text-muted-foreground">Transfer-Ticket</p>
                       <code className="text-lg font-mono">{submitResult.transferTicket}</code>
                     </div>
                     <div className="flex justify-center gap-2">
                       <Button variant="outline">
                         <Download className="mr-2 h-4 w-4" />
                         Protokoll herunterladen
                       </Button>
                       <Button onClick={() => navigate("/steuern/elster")}>
                         Zur Übersicht
                       </Button>
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                       <XCircle className="h-10 w-10 text-red-600" />
                     </div>
                     <div>
                       <h3 className="text-xl font-semibold">Übertragung fehlgeschlagen</h3>
                       <p className="text-destructive mt-1">{submitResult?.error}</p>
                     </div>
                     <div className="flex justify-center gap-2">
                       <Button variant="outline" onClick={() => setStep(4)}>
                         Erneut versuchen
                       </Button>
                       <Button onClick={() => navigate("/steuern/elster")}>
                         Zur Übersicht
                       </Button>
                     </div>
                   </>
                 )}
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Navigation */}
         {step < 5 && (
           <div className="flex justify-between">
             <Button
               variant="outline"
               onClick={handleBack}
               disabled={step === 1}
             >
               <ArrowLeft className="mr-2 h-4 w-4" />
               Zurück
             </Button>
             <Button
               onClick={handleNext}
               disabled={!canProceed() || submitting}
             >
               {submitting ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Wird übertragen...
                 </>
               ) : step === 4 ? (
                 <>
                   <Send className="mr-2 h-4 w-4" />
                   An ELSTER übertragen
                 </>
               ) : (
                 <>
                   Weiter
                   <ArrowRight className="ml-2 h-4 w-4" />
                 </>
               )}
             </Button>
           </div>
         )}
       </div>
     </MainLayout>
   );
 }