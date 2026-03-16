 import { Label } from "@/components/ui/label";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Calendar, Euro, Shield, Clock } from "lucide-react";
 import type { WizardData } from "../ContractWizard";
 import { formatCurrency } from "@/lib/utils";
 
  interface StepConditionsProps {
    data: WizardData;
    updateData: (updates: Partial<WizardData>) => void;
    showValidation?: boolean;
  }
 
 export function StepConditions({ data, updateData, showValidation }: StepConditionsProps) {
   const totalRent = data.rentAmount + data.utilityAdvance;
 
   return (
     <div className="space-y-6">
       <div>
         <h2 className="text-xl font-semibold mb-2">Vertragskonditionen</h2>
         <p className="text-muted-foreground">
           Legen Sie die finanziellen Bedingungen und Laufzeit des Mietvertrags fest.
         </p>
       </div>
 
       {/* Dates */}
       <Card>
         <CardHeader>
           <CardTitle className="text-base flex items-center gap-2">
             <Calendar className="h-5 w-5" />
             Vertragslaufzeit
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid gap-4 md:grid-cols-3">
             <div className="space-y-2">
                <Label htmlFor="startDate">Mietbeginn *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={data.startDate}
                  onChange={(e) => updateData({ startDate: e.target.value })}
                  className={showValidation && !data.startDate ? "border-destructive" : ""}
                />
                {showValidation && !data.startDate && (
                  <p className="text-xs text-destructive">Pflichtfeld</p>
                )}
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="endDate">
                 Mietende <span className="text-muted-foreground">(optional)</span>
               </Label>
               <Input
                 id="endDate"
                 type="date"
                 value={data.endDate}
                 onChange={(e) => updateData({ endDate: e.target.value })}
                 min={data.startDate}
               />
               <p className="text-xs text-muted-foreground">
                 Leer lassen für unbefristeten Vertrag
               </p>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="noticePeriod">Kündigungsfrist</Label>
               <Select
                 value={String(data.noticePeriod)}
                 onValueChange={(value) => updateData({ noticePeriod: Number(value) })}
               >
                 <SelectTrigger id="noticePeriod">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="1">1 Monat</SelectItem>
                   <SelectItem value="2">2 Monate</SelectItem>
                   <SelectItem value="3">3 Monate</SelectItem>
                   <SelectItem value="6">6 Monate</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Rent */}
       <Card>
         <CardHeader>
           <CardTitle className="text-base flex items-center gap-2">
             <Euro className="h-5 w-5" />
             Miete & Nebenkosten
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid gap-4 md:grid-cols-2">
             <div className="space-y-2">
               <Label htmlFor="rentAmount">Kaltmiete (€) *</Label>
               <div className="relative">
                 <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="rentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.rentAmount || ""}
                    onChange={(e) => updateData({ rentAmount: Number(e.target.value) })}
                    className={`pl-9 ${showValidation && !(data.rentAmount > 0) ? "border-destructive" : ""}`}
                  />
                </div>
                {showValidation && !(data.rentAmount > 0) && (
                  <p className="text-xs text-destructive">Pflichtfeld</p>
                )}
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="utilityAdvance">Nebenkosten-Vorauszahlung (€)</Label>
               <div className="relative">
                 <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                 <Input
                   id="utilityAdvance"
                   type="number"
                   min="0"
                   step="0.01"
                   value={data.utilityAdvance || ""}
                   onChange={(e) => updateData({ utilityAdvance: Number(e.target.value) })}
                   className="pl-9"
                 />
               </div>
             </div>
           </div>
           
           <div className="mt-4 p-4 bg-muted rounded-lg">
             <div className="flex justify-between items-center">
               <span className="font-medium">Gesamtmiete monatlich</span>
               <span className="text-xl font-bold">{formatCurrency(totalRent)}</span>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Deposit & Payment */}
       <div className="grid gap-6 md:grid-cols-2">
         <Card>
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <Shield className="h-5 w-5" />
               Kaution
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-2">
               <Label htmlFor="depositAmount">Kautionsbetrag (€)</Label>
               <div className="relative">
                 <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                 <Input
                   id="depositAmount"
                   type="number"
                   min="0"
                   step="0.01"
                   value={data.depositAmount || ""}
                   onChange={(e) => updateData({ depositAmount: Number(e.target.value) })}
                   className="pl-9"
                 />
               </div>
               <p className="text-xs text-muted-foreground">
                 Empfohlen: 3 Monatsmieten = {formatCurrency(data.rentAmount * 3)}
               </p>
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <Clock className="h-5 w-5" />
               Zahlungsmodalitäten
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-2">
               <Label htmlFor="paymentDay">Zahlungstag im Monat</Label>
               <Select
                 value={String(data.paymentDay)}
                 onValueChange={(value) => updateData({ paymentDay: Number(value) })}
               >
                 <SelectTrigger id="paymentDay">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                     <SelectItem key={day} value={String(day)}>
                       {day}. des Monats
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <p className="text-xs text-muted-foreground">
                 Die Miete ist bis zum gewählten Tag des Monats fällig.
               </p>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }