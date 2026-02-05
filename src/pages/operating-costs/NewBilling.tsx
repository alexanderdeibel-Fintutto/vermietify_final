import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BillingWizardProvider, useBillingWizard } from "@/components/operating-costs/wizard/BillingWizardContext";
import { StepBuildingPeriod } from "@/components/operating-costs/wizard/StepBuildingPeriod";
import { StepCostTypes } from "@/components/operating-costs/wizard/StepCostTypes";
import { StepUnitsDistribution } from "@/components/operating-costs/wizard/StepUnitsDistribution";
import { StepCalculation } from "@/components/operating-costs/wizard/StepCalculation";
import { StepSummary } from "@/components/operating-costs/wizard/StepSummary";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
   Building,
   Euro,
   Users,
   Calculator,
   CheckCircle,
   ChevronLeft,
   ChevronRight,
   X,
 } from "lucide-react";

const STEPS = [
   { id: 1, title: "Gebäude & Zeitraum", icon: Building },
   { id: 2, title: "Kostenarten", icon: Euro },
   { id: 3, title: "Einheiten", icon: Users },
   { id: 4, title: "Berechnung", icon: Calculator },
   { id: 5, title: "Zusammenfassung", icon: CheckCircle },
 ];

function WizardContent() {
   const navigate = useNavigate();
   const { currentStep, setCurrentStep, isStepValid, resetWizard } = useBillingWizard();

   const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

   const handleNext = () => {
     if (currentStep < STEPS.length && isStepValid(currentStep)) {
       setCurrentStep(currentStep + 1);
     }
   };

   const handleBack = () => {
     if (currentStep > 1) {
       setCurrentStep(currentStep - 1);
     }
   };

   const handleCancel = () => {
     resetWizard();
     navigate("/betriebskosten");
   };

   const renderStepContent = () => {
     switch (currentStep) {
       case 1:
         return <StepBuildingPeriod />;
       case 2:
         return <StepCostTypes />;
       case 3:
         return <StepUnitsDistribution />;
       case 4:
         return <StepCalculation />;
       case 5:
        return <StepSummary />;
       default:
         return null;
     }
   };

   return (
     <MainLayout
       title="Neue Betriebskostenabrechnung"
       breadcrumbs={[
         { label: "Betriebskosten", href: "/betriebskosten" },
         { label: "Neue Abrechnung" },
       ]}
     >
       <div className="space-y-6">
         {/* Progress Indicator */}
         <div className="bg-card border rounded-lg p-6">
           <div className="mb-4">
             <Progress value={progress} className="h-2" />
           </div>
           <div className="flex justify-between">
             {STEPS.map((step) => {
               const StepIcon = step.icon;
               const isActive = step.id === currentStep;
               const isCompleted = step.id < currentStep;
               const isClickable = step.id < currentStep || (step.id === currentStep + 1 && isStepValid(currentStep));

               return (
                 <button
                   key={step.id}
                   onClick={() => isClickable && setCurrentStep(step.id)}
                   disabled={!isClickable && step.id !== currentStep}
                   className={cn(
                     "flex flex-col items-center gap-2 transition-colors",
                     isActive && "text-primary",
                     isCompleted && "text-primary",
                     !isActive && !isCompleted && "text-muted-foreground",
                     isClickable && "cursor-pointer hover:text-primary",
                     !isClickable && step.id !== currentStep && "cursor-not-allowed"
                   )}
                 >
                   <div
                     className={cn(
                       "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                       isActive && "border-primary bg-primary text-primary-foreground",
                       isCompleted && "border-primary bg-primary text-primary-foreground",
                       !isActive && !isCompleted && "border-muted-foreground/30"
                     )}
                   >
                     {isCompleted ? (
                       <CheckCircle className="h-5 w-5" />
                     ) : (
                       <StepIcon className="h-5 w-5" />
                     )}
                   </div>
                   <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                 </button>
               );
             })}
           </div>
         </div>

         {/* Step Content */}
         <div className="min-h-[400px]">{renderStepContent()}</div>

         {/* Navigation Buttons */}
         <div className="flex items-center justify-between pt-4 border-t">
           <Button variant="ghost" onClick={handleCancel}>
             <X className="h-4 w-4 mr-2" />
             Abbrechen
           </Button>

           <div className="flex items-center gap-2">
             <Button
               variant="outline"
               onClick={handleBack}
               disabled={currentStep === 1}
             >
               <ChevronLeft className="h-4 w-4 mr-2" />
               Zurück
             </Button>

             {currentStep < STEPS.length ? (
               <Button onClick={handleNext} disabled={!isStepValid(currentStep)}>
                 Weiter
                 <ChevronRight className="h-4 w-4 ml-2" />
               </Button>
             ) : (
               <Button disabled>
                 Abrechnung erstellen
                 <CheckCircle className="h-4 w-4 ml-2" />
               </Button>
             )}
           </div>
         </div>
       </div>
     </MainLayout>
   );
 }
export default function NewBilling() {
  return (
    <BillingWizardProvider>
       <WizardContent />
     </BillingWizardProvider>
  );
}
