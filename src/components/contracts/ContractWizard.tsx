 import { useState, useCallback } from "react";
 import { useNavigate } from "react-router-dom";
 import { Card, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Progress } from "@/components/ui/progress";
 import { useToast } from "@/hooks/use-toast";
 import { useBuildings } from "@/hooks/useBuildings";
 import { useUnits } from "@/hooks/useUnits";
 import { useTenants } from "@/hooks/useTenants";
 import { useContracts } from "@/hooks/useContracts";
 import { useAuth } from "@/hooks/useAuth";
 import { supabase } from "@/integrations/supabase/client";
 import { StepProperty } from "./wizard/StepProperty";
 import { StepTenant } from "./wizard/StepTenant";
 import { StepConditions } from "./wizard/StepConditions";
 import { StepAgreements } from "./wizard/StepAgreements";
 import { StepSummary } from "./wizard/StepSummary";
 import { Building2, User, Euro, FileText, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
 
 const STEPS = [
   { id: 1, title: "Mietobjekt", icon: Building2 },
   { id: 2, title: "Mieter", icon: User },
   { id: 3, title: "Konditionen", icon: Euro },
   { id: 4, title: "Vereinbarungen", icon: FileText },
   { id: 5, title: "Zusammenfassung", icon: CheckCircle },
 ];
 
 export interface WizardData {
   // Step 1 - Property
   buildingId: string;
   unitId: string;
   selectedUnit: any;
   selectedBuilding: any;
   
   // Step 2 - Tenant
   tenantMode: "existing" | "new";
   tenantId: string;
   selectedTenant: any;
    newTenant: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      birthDate: string;
      householdSize: string;
      address: string;
      postalCode: string;
      city: string;
      previousLandlord: string;
    };
   
   // Step 3 - Conditions
   startDate: string;
   endDate: string;
   rentAmount: number;
   utilityAdvance: number;
   depositAmount: number;
   paymentDay: number;
   noticePeriod: number;
   
   // Step 4 - Agreements
   specialAgreements: string;
   petsAllowed: boolean;
   sublettingAllowed: boolean;
   minorRepairsClause: boolean;
   cosmeticRepairsClause: boolean;
   
   // Step 5 - Confirmation
   confirmed: boolean;
 }
 
 const initialData: WizardData = {
   buildingId: "",
   unitId: "",
   selectedUnit: null,
   selectedBuilding: null,
   tenantMode: "existing",
   tenantId: "",
   selectedTenant: null,
   newTenant: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    householdSize: "",
    address: "",
    postalCode: "",
    city: "",
    previousLandlord: "",
  },
   startDate: "",
   endDate: "",
   rentAmount: 0,
   utilityAdvance: 0,
   depositAmount: 0,
   paymentDay: 1,
   noticePeriod: 3,
   specialAgreements: "",
   petsAllowed: false,
   sublettingAllowed: false,
   minorRepairsClause: true,
   cosmeticRepairsClause: true,
   confirmed: false,
 };
 
 export function ContractWizard() {
   const navigate = useNavigate();
   const { toast } = useToast();
   const { profile } = useAuth();
   const { createContract } = useContracts();
   const { createTenant } = useTenants();
   
   const [currentStep, setCurrentStep] = useState(1);
   const [data, setData] = useState<WizardData>(initialData);
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   const updateData = useCallback((updates: Partial<WizardData>) => {
     setData((prev) => ({ ...prev, ...updates }));
   }, []);
 
   const canProceed = useCallback(() => {
     switch (currentStep) {
       case 1:
         return data.buildingId && data.unitId;
       case 2:
         if (data.tenantMode === "existing") {
           return !!data.tenantId;
         } else {
           return data.newTenant.firstName && data.newTenant.lastName && data.newTenant.email;
         }
       case 3:
         return data.startDate && data.rentAmount > 0;
       case 4:
         return true;
       case 5:
         return data.confirmed;
       default:
         return false;
     }
   }, [currentStep, data]);
 
   const handleNext = () => {
     if (currentStep < 5 && canProceed()) {
       setCurrentStep((prev) => prev + 1);
     }
   };
 
   const handleBack = () => {
     if (currentStep > 1) {
       setCurrentStep((prev) => prev - 1);
     }
   };
 
   const handleSubmit = async () => {
     if (!profile?.organization_id) {
       toast({
         title: "Fehler",
         description: "Organisation nicht gefunden.",
         variant: "destructive",
       });
       return;
     }
 
     setIsSubmitting(true);
     
     try {
       let tenantId = data.tenantId;
       
       // Create new tenant if needed
       if (data.tenantMode === "new") {
          const newTenant = await createTenant.mutateAsync({
            organization_id: profile.organization_id,
            first_name: data.newTenant.firstName,
            last_name: data.newTenant.lastName,
            email: data.newTenant.email,
            phone: data.newTenant.phone || undefined,
            birth_date: data.newTenant.birthDate || undefined,
            household_size: data.newTenant.householdSize ? parseInt(data.newTenant.householdSize) : undefined,
            address: data.newTenant.address || undefined,
            postal_code: data.newTenant.postalCode || undefined,
            city: data.newTenant.city || undefined,
            previous_landlord: data.newTenant.previousLandlord || undefined,
          });
         tenantId = newTenant.id;
       }
 
       // Build notes with special agreements
       const agreements: string[] = [];
       if (data.petsAllowed) agreements.push("Haustiere erlaubt");
       if (data.sublettingAllowed) agreements.push("Untervermietung erlaubt");
       if (data.minorRepairsClause) agreements.push("Kleinreparaturklausel");
       if (data.cosmeticRepairsClause) agreements.push("Schönheitsreparaturen");
       
       const notes = [
         data.specialAgreements,
         agreements.length > 0 ? `Klauseln: ${agreements.join(", ")}` : "",
       ].filter(Boolean).join("\n\n");
 
       // Create contract
       const contract = await createContract.mutateAsync({
         unit_id: data.unitId,
         tenant_id: tenantId,
         start_date: data.startDate,
         end_date: data.endDate || undefined,
         rent_amount: Math.round(data.rentAmount * 100), // Convert to cents
         utility_advance: Math.round(data.utilityAdvance * 100),
         deposit_amount: Math.round(data.depositAmount * 100),
         deposit_paid: false,
         payment_day: data.paymentDay,
       });
 
       // Update notes separately if needed
       if (notes) {
         await supabase
           .from("leases")
           .update({ notes })
           .eq("id", contract.id);
       }
 
       toast({
         title: "Vertrag erstellt",
         description: "Der Mietvertrag wurde erfolgreich angelegt.",
       });
       
       navigate(`/vertraege/${contract.id}`);
     } catch (error: any) {
       toast({
         title: "Fehler",
         description: error.message || "Der Vertrag konnte nicht erstellt werden.",
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const progressPercent = (currentStep / STEPS.length) * 100;
 
   return (
     <div className="space-y-6">
       {/* Progress Header */}
       <Card>
         <CardContent className="py-6">
           <div className="flex items-center justify-between mb-4">
             {STEPS.map((step, index) => {
               const Icon = step.icon;
               const isActive = step.id === currentStep;
               const isCompleted = step.id < currentStep;
               
               return (
                 <div
                   key={step.id}
                   className={`flex items-center ${index < STEPS.length - 1 ? "flex-1" : ""}`}
                 >
                   <div className="flex flex-col items-center">
                     <div
                       className={`w-10 h-10 rounded-full flex items-center justify-center ${
                         isCompleted
                           ? "bg-primary text-primary-foreground"
                           : isActive
                           ? "bg-primary text-primary-foreground"
                           : "bg-muted text-muted-foreground"
                       }`}
                     >
                       {isCompleted ? (
                         <CheckCircle className="h-5 w-5" />
                       ) : (
                         <Icon className="h-5 w-5" />
                       )}
                     </div>
                     <span
                       className={`text-xs mt-1 ${
                         isActive ? "font-medium" : "text-muted-foreground"
                       }`}
                     >
                       {step.title}
                     </span>
                   </div>
                   {index < STEPS.length - 1 && (
                     <div
                       className={`flex-1 h-0.5 mx-2 ${
                         isCompleted ? "bg-primary" : "bg-muted"
                       }`}
                     />
                   )}
                 </div>
               );
             })}
           </div>
           <Progress value={progressPercent} className="h-2" />
         </CardContent>
       </Card>
 
       {/* Step Content */}
       <Card>
         <CardContent className="py-6">
           {currentStep === 1 && (
             <StepProperty data={data} updateData={updateData} />
           )}
           {currentStep === 2 && (
             <StepTenant data={data} updateData={updateData} />
           )}
           {currentStep === 3 && (
             <StepConditions data={data} updateData={updateData} />
           )}
           {currentStep === 4 && (
             <StepAgreements data={data} updateData={updateData} />
           )}
           {currentStep === 5 && (
             <StepSummary data={data} updateData={updateData} />
           )}
         </CardContent>
       </Card>
 
       {/* Navigation */}
       <div className="flex justify-between">
         <Button
           variant="outline"
           onClick={handleBack}
           disabled={currentStep === 1}
         >
           <ChevronLeft className="h-4 w-4 mr-2" />
           Zurück
         </Button>
         
         {currentStep < 5 ? (
           <Button onClick={handleNext} disabled={!canProceed()}>
             Weiter
             <ChevronRight className="h-4 w-4 ml-2" />
           </Button>
         ) : (
           <Button
             onClick={handleSubmit}
             disabled={!canProceed() || isSubmitting}
           >
             {isSubmitting ? "Wird erstellt..." : "Vertrag erstellen"}
           </Button>
         )}
       </div>
     </div>
   );
 }