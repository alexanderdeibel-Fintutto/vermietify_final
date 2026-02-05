 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Checkbox } from "@/components/ui/checkbox";
 import { FileText, PawPrint, Home, Wrench, Paintbrush } from "lucide-react";
 import type { WizardData } from "../ContractWizard";
 
 interface StepAgreementsProps {
   data: WizardData;
   updateData: (updates: Partial<WizardData>) => void;
 }
 
 const CLAUSES = [
   {
     id: "petsAllowed",
     label: "Haustiere erlaubt",
     description: "Der Mieter darf Haustiere in der Wohnung halten.",
     icon: PawPrint,
   },
   {
     id: "sublettingAllowed",
     label: "Untervermietung erlaubt",
     description: "Der Mieter darf die Wohnung ganz oder teilweise untervermieten.",
     icon: Home,
   },
   {
     id: "minorRepairsClause",
     label: "Kleinreparaturklausel",
     description: "Der Mieter trägt Kosten für Kleinreparaturen bis 100€ pro Einzelfall, max. 8% der Jahresmiete.",
     icon: Wrench,
   },
   {
     id: "cosmeticRepairsClause",
     label: "Schönheitsreparaturen",
     description: "Der Mieter verpflichtet sich zu regelmäßigen Schönheitsreparaturen.",
     icon: Paintbrush,
   },
 ];
 
 export function StepAgreements({ data, updateData }: StepAgreementsProps) {
   const handleClauseChange = (clauseId: string, checked: boolean) => {
     updateData({ [clauseId]: checked });
   };
 
   return (
     <div className="space-y-6">
       <div>
         <h2 className="text-xl font-semibold mb-2">Sondervereinbarungen</h2>
         <p className="text-muted-foreground">
           Legen Sie besondere Regelungen und Klauseln für den Mietvertrag fest.
         </p>
       </div>
 
       {/* Common Clauses */}
       <Card>
         <CardHeader>
           <CardTitle className="text-base">Häufige Vertragsklauseln</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid gap-4 md:grid-cols-2">
             {CLAUSES.map((clause) => {
               const Icon = clause.icon;
               const isChecked = data[clause.id as keyof WizardData] as boolean;
               
               return (
                 <div
                   key={clause.id}
                   className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                     isChecked ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                   }`}
                   onClick={() => handleClauseChange(clause.id, !isChecked)}
                 >
                   <div className="flex items-start gap-3">
                     <Checkbox
                       id={clause.id}
                       checked={isChecked}
                       onCheckedChange={(checked) => 
                         handleClauseChange(clause.id, checked as boolean)
                       }
                     />
                     <div className="flex-1">
                       <Label
                         htmlFor={clause.id}
                         className="cursor-pointer flex items-center gap-2 font-medium"
                       >
                         <Icon className="h-4 w-4" />
                         {clause.label}
                       </Label>
                       <p className="text-sm text-muted-foreground mt-1">
                         {clause.description}
                       </p>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
         </CardContent>
       </Card>
 
       {/* Custom Agreements */}
       <Card>
         <CardHeader>
           <CardTitle className="text-base flex items-center gap-2">
             <FileText className="h-5 w-5" />
             Individuelle Vereinbarungen
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-2">
             <Label htmlFor="specialAgreements">Besondere Regelungen</Label>
             <Textarea
               id="specialAgreements"
               value={data.specialAgreements}
               onChange={(e) => updateData({ specialAgreements: e.target.value })}
               placeholder="Hier können Sie individuelle Vereinbarungen festhalten, z.B.:&#10;- Nutzung des Gartens&#10;- Stellplatz-Regelungen&#10;- Renovierungsvereinbarungen&#10;- etc."
               rows={6}
             />
             <p className="text-xs text-muted-foreground">
               Diese Vereinbarungen werden dem Mietvertrag als Zusatz beigefügt.
             </p>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }