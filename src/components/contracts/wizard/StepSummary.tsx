 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import {
   Building2,
   User,
   Euro,
   Calendar,
   Shield,
   FileText,
   CheckCircle,
   XCircle,
 } from "lucide-react";
 import type { WizardData } from "../ContractWizard";
 import { formatCurrency } from "@/lib/utils";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 interface StepSummaryProps {
   data: WizardData;
   updateData: (updates: Partial<WizardData>) => void;
 }
 
 export function StepSummary({ data, updateData }: StepSummaryProps) {
   const totalRent = data.rentAmount + data.utilityAdvance;
   
   const tenantName = data.tenantMode === "existing"
     ? `${data.selectedTenant?.first_name} ${data.selectedTenant?.last_name}`
     : `${data.newTenant.firstName} ${data.newTenant.lastName}`;
 
   const tenantEmail = data.tenantMode === "existing"
     ? data.selectedTenant?.email
     : data.newTenant.email;
 
   const agreements = [
     { label: "Haustiere erlaubt", enabled: data.petsAllowed },
     { label: "Untervermietung erlaubt", enabled: data.sublettingAllowed },
     { label: "Kleinreparaturklausel", enabled: data.minorRepairsClause },
     { label: "Schönheitsreparaturen", enabled: data.cosmeticRepairsClause },
   ];
 
   return (
     <div className="space-y-6">
       <div>
         <h2 className="text-xl font-semibold mb-2">Zusammenfassung</h2>
         <p className="text-muted-foreground">
           Überprüfen Sie alle Angaben vor der Vertragserstellung.
         </p>
       </div>
 
       <div className="grid gap-6 md:grid-cols-2">
         {/* Property */}
         <Card>
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <Building2 className="h-5 w-5" />
               Mietobjekt
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-2">
             <div>
               <p className="text-sm text-muted-foreground">Gebäude</p>
               <p className="font-medium">{data.selectedBuilding?.name}</p>
             </div>
             <div>
               <p className="text-sm text-muted-foreground">Einheit</p>
               <p className="font-medium">{data.selectedUnit?.unit_number}</p>
             </div>
             <div>
               <p className="text-sm text-muted-foreground">Details</p>
               <p className="font-medium">
                 {data.selectedUnit?.area} m² • {data.selectedUnit?.rooms} Zimmer
               </p>
             </div>
           </CardContent>
         </Card>
 
         {/* Tenant */}
         <Card>
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <User className="h-5 w-5" />
               Mieter
               {data.tenantMode === "new" && (
                 <Badge variant="secondary">Neu</Badge>
               )}
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-2">
             <div>
               <p className="text-sm text-muted-foreground">Name</p>
               <p className="font-medium">{tenantName}</p>
             </div>
             <div>
               <p className="text-sm text-muted-foreground">E-Mail</p>
               <p className="font-medium">{tenantEmail}</p>
             </div>
             {data.tenantMode === "new" && data.newTenant.phone && (
               <div>
                 <p className="text-sm text-muted-foreground">Telefon</p>
                 <p className="font-medium">{data.newTenant.phone}</p>
               </div>
             )}
           </CardContent>
         </Card>
 
         {/* Conditions */}
         <Card>
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <Euro className="h-5 w-5" />
               Konditionen
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             <div className="flex justify-between">
               <span className="text-muted-foreground">Kaltmiete</span>
               <span className="font-medium">{formatCurrency(data.rentAmount)}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-muted-foreground">Nebenkosten</span>
               <span className="font-medium">{formatCurrency(data.utilityAdvance)}</span>
             </div>
             <Separator />
             <div className="flex justify-between">
               <span className="font-medium">Gesamtmiete</span>
               <span className="text-lg font-bold">{formatCurrency(totalRent)}</span>
             </div>
           </CardContent>
         </Card>
 
         {/* Dates & Deposit */}
         <Card>
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <Calendar className="h-5 w-5" />
               Vertragsdaten
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-2">
             <div className="flex justify-between">
               <span className="text-muted-foreground">Mietbeginn</span>
               <span className="font-medium">
                 {data.startDate 
                   ? format(new Date(data.startDate), "dd.MM.yyyy", { locale: de })
                   : "-"}
               </span>
             </div>
             <div className="flex justify-between">
               <span className="text-muted-foreground">Mietende</span>
               <span className="font-medium">
                 {data.endDate 
                   ? format(new Date(data.endDate), "dd.MM.yyyy", { locale: de })
                   : "Unbefristet"}
               </span>
             </div>
             <div className="flex justify-between">
               <span className="text-muted-foreground">Kaution</span>
               <span className="font-medium">{formatCurrency(data.depositAmount)}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-muted-foreground">Zahlungstag</span>
               <span className="font-medium">{data.paymentDay}. des Monats</span>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Agreements */}
       <Card>
         <CardHeader>
           <CardTitle className="text-base flex items-center gap-2">
             <FileText className="h-5 w-5" />
             Vereinbarungen
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="flex flex-wrap gap-2 mb-4">
             {agreements.map((agreement) => (
               <Badge
                 key={agreement.label}
                 variant={agreement.enabled ? "default" : "secondary"}
               >
                 {agreement.enabled ? (
                   <CheckCircle className="h-3 w-3 mr-1" />
                 ) : (
                   <XCircle className="h-3 w-3 mr-1" />
                 )}
                 {agreement.label}
               </Badge>
             ))}
           </div>
           
           {data.specialAgreements && (
             <div className="p-3 bg-muted rounded-lg">
               <p className="text-sm font-medium mb-1">Sondervereinbarungen:</p>
               <p className="text-sm text-muted-foreground whitespace-pre-line">
                 {data.specialAgreements}
               </p>
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Confirmation */}
       <Card className="border-primary">
         <CardContent className="pt-6">
           <div
             className="flex items-start gap-3 cursor-pointer"
             onClick={() => updateData({ confirmed: !data.confirmed })}
           >
             <Checkbox
               id="confirmation"
               checked={data.confirmed}
               onCheckedChange={(checked) => updateData({ confirmed: checked as boolean })}
             />
             <div>
               <Label htmlFor="confirmation" className="cursor-pointer font-medium">
                 Ich bestätige die Richtigkeit aller Angaben
               </Label>
               <p className="text-sm text-muted-foreground mt-1">
                 Mit der Bestätigung wird der Mietvertrag erstellt und die Einheit als vermietet markiert.
               </p>
             </div>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }