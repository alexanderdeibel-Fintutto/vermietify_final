 import { createContext, useContext, useState, useEffect, ReactNode } from "react";
 
 export interface CostItem {
   id: string;
   name: string;
   amount: number; // in cents
   distributionKey: "area" | "persons" | "units" | "consumption";
   isActive: boolean;
   isCustom?: boolean;
 }
 
 export interface WizardData {
   // Step 1
   buildingId: string;
   periodStart: Date | null;
   periodEnd: Date | null;
   // Step 2
   costItems: CostItem[];
   // Future steps...
 }
 
 const DEFAULT_COST_TYPES: Omit<CostItem, "amount">[] = [
   { id: "heating", name: "Heizung", distributionKey: "area", isActive: true },
   { id: "hot_water", name: "Warmwasser", distributionKey: "consumption", isActive: true },
   { id: "cold_water", name: "Kaltwasser/Abwasser", distributionKey: "persons", isActive: true },
   { id: "garbage", name: "Müllabfuhr", distributionKey: "units", isActive: true },
   { id: "janitor", name: "Hausmeister", distributionKey: "area", isActive: false },
   { id: "garden", name: "Gartenpflege", distributionKey: "area", isActive: false },
   { id: "electricity", name: "Allgemeinstrom", distributionKey: "units", isActive: true },
   { id: "insurance", name: "Gebäudeversicherung", distributionKey: "area", isActive: true },
   { id: "property_tax", name: "Grundsteuer", distributionKey: "area", isActive: true },
   { id: "elevator", name: "Aufzug", distributionKey: "units", isActive: false },
   { id: "chimney", name: "Schornsteinfeger", distributionKey: "units", isActive: false },
   { id: "other", name: "Sonstige", distributionKey: "units", isActive: false },
 ];
 
 const getDefaultCostItems = (): CostItem[] => {
   return DEFAULT_COST_TYPES.map((type) => ({
     ...type,
     amount: 0,
   }));
 };
 
 const getDefaultWizardData = (): WizardData => {
   const lastYear = new Date().getFullYear() - 1;
   return {
     buildingId: "",
     periodStart: new Date(lastYear, 0, 1),
     periodEnd: new Date(lastYear, 11, 31),
     costItems: getDefaultCostItems(),
   };
 };
 
 interface BillingWizardContextType {
   currentStep: number;
   setCurrentStep: (step: number) => void;
   wizardData: WizardData;
   updateWizardData: (data: Partial<WizardData>) => void;
   updateCostItem: (id: string, updates: Partial<CostItem>) => void;
   addCustomCostItem: (name: string) => void;
   removeCostItem: (id: string) => void;
   resetWizard: () => void;
   isStepValid: (step: number) => boolean;
   totalCosts: number;
 }
 
 const BillingWizardContext = createContext<BillingWizardContextType | null>(null);
 
 const STORAGE_KEY = "bk-wizard-data";
 
 export function BillingWizardProvider({ children }: { children: ReactNode }) {
   const [currentStep, setCurrentStep] = useState(1);
   const [wizardData, setWizardData] = useState<WizardData>(() => {
     if (typeof window !== "undefined") {
       const saved = localStorage.getItem(STORAGE_KEY);
       if (saved) {
         try {
           const parsed = JSON.parse(saved);
           return {
             ...parsed,
             periodStart: parsed.periodStart ? new Date(parsed.periodStart) : null,
             periodEnd: parsed.periodEnd ? new Date(parsed.periodEnd) : null,
           };
         } catch {
           return getDefaultWizardData();
         }
       }
     }
     return getDefaultWizardData();
   });
 
   // Persist to localStorage
   useEffect(() => {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(wizardData));
   }, [wizardData]);
 
   const updateWizardData = (data: Partial<WizardData>) => {
     setWizardData((prev) => ({ ...prev, ...data }));
   };
 
   const updateCostItem = (id: string, updates: Partial<CostItem>) => {
     setWizardData((prev) => ({
       ...prev,
       costItems: prev.costItems.map((item) =>
         item.id === id ? { ...item, ...updates } : item
       ),
     }));
   };
 
   const addCustomCostItem = (name: string) => {
     const newItem: CostItem = {
       id: `custom_${Date.now()}`,
       name,
       amount: 0,
       distributionKey: "units",
       isActive: true,
       isCustom: true,
     };
     setWizardData((prev) => ({
       ...prev,
       costItems: [...prev.costItems, newItem],
     }));
   };
 
   const removeCostItem = (id: string) => {
     setWizardData((prev) => ({
       ...prev,
       costItems: prev.costItems.filter((item) => item.id !== id),
     }));
   };
 
   const resetWizard = () => {
     setWizardData(getDefaultWizardData());
     setCurrentStep(1);
     localStorage.removeItem(STORAGE_KEY);
   };
 
   const isStepValid = (step: number): boolean => {
     switch (step) {
       case 1:
         if (!wizardData.buildingId) return false;
         if (!wizardData.periodStart || !wizardData.periodEnd) return false;
         if (wizardData.periodStart >= wizardData.periodEnd) return false;
         // Max 1 year
         const diffMs = wizardData.periodEnd.getTime() - wizardData.periodStart.getTime();
         const diffDays = diffMs / (1000 * 60 * 60 * 24);
         if (diffDays > 366) return false;
         return true;
       case 2:
         const activeItems = wizardData.costItems.filter((item) => item.isActive);
         return activeItems.length > 0 && activeItems.some((item) => item.amount > 0);
       default:
         return true;
     }
   };
 
   const totalCosts = wizardData.costItems
     .filter((item) => item.isActive)
     .reduce((sum, item) => sum + item.amount, 0);
 
   return (
     <BillingWizardContext.Provider
       value={{
         currentStep,
         setCurrentStep,
         wizardData,
         updateWizardData,
         updateCostItem,
         addCustomCostItem,
         removeCostItem,
         resetWizard,
         isStepValid,
         totalCosts,
       }}
     >
       {children}
     </BillingWizardContext.Provider>
   );
 }
 
 export function useBillingWizard() {
   const context = useContext(BillingWizardContext);
   if (!context) {
     throw new Error("useBillingWizard must be used within BillingWizardProvider");
   }
   return context;
 }