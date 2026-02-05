 import { createContext, useContext, useState, useEffect, ReactNode } from "react";
 
 export interface CostItem {
   id: string;
   name: string;
   amount: number; // in cents
   distributionKey: "area" | "persons" | "units" | "consumption";
   isActive: boolean;
   isCustom?: boolean;
 }
 
export interface UnitDistributionData {
  unitId: string;
  unitNumber: string;
  tenantName: string | null;
  tenantId: string | null;
  area: number; // in m²
  persons: number;
  heatingShare: number; // percentage (0-100)
  prepayments: number; // in cents
  isVacant: boolean;
}

export interface CalculationResult {
  unitId: string;
  unitNumber: string;
  tenantName: string | null;
  costShare: number; // in cents
  prepayments: number; // in cents
  result: number; // in cents (positive = credit, negative = payment due)
  costBreakdown: {
    costItemId: string;
    costItemName: string;
    totalAmount: number;
    share: number;
    distributionKey: string;
    formula: string;
  }[];
}

 export interface WizardData {
   // Step 1
   buildingId: string;
   periodStart: Date | null;
   periodEnd: Date | null;
   // Step 2
   costItems: CostItem[];
  // Step 3
  unitDistributions: UnitDistributionData[];
  vacancyCostsToLandlord: boolean;
  // Step 4 - calculated
  calculationResults: CalculationResult[];
  // Step 5 - options
  optionsGeneratePdf: boolean;
  optionsIndividualStatements: boolean;
  optionsSendEmail: boolean;
  paymentDeadline: Date | null;
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
  const defaultDeadline = new Date();
  defaultDeadline.setDate(defaultDeadline.getDate() + 28); // 4 weeks from now
   return {
     buildingId: "",
     periodStart: new Date(lastYear, 0, 1),
     periodEnd: new Date(lastYear, 11, 31),
     costItems: getDefaultCostItems(),
    unitDistributions: [],
    vacancyCostsToLandlord: true,
    calculationResults: [],
    optionsGeneratePdf: true,
    optionsIndividualStatements: true,
    optionsSendEmail: false,
    paymentDeadline: defaultDeadline,
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
  updateUnitDistribution: (unitId: string, updates: Partial<UnitDistributionData>) => void;
  initializeUnitDistributions: (units: UnitDistributionData[]) => void;
  calculateResults: () => void;
   resetWizard: () => void;
   isStepValid: (step: number) => boolean;
   totalCosts: number;
  distributionTotals: { totalArea: number; totalPersons: number; totalUnits: number };
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
 
  const updateUnitDistribution = (unitId: string, updates: Partial<UnitDistributionData>) => {
    setWizardData((prev) => ({
      ...prev,
      unitDistributions: prev.unitDistributions.map((unit) =>
        unit.unitId === unitId ? { ...unit, ...updates } : unit
      ),
    }));
  };

  const initializeUnitDistributions = (units: UnitDistributionData[]) => {
    setWizardData((prev) => ({
      ...prev,
      unitDistributions: units,
    }));
  };

  const calculateResults = () => {
    const { costItems, unitDistributions, vacancyCostsToLandlord } = wizardData;
    const activeUnits = vacancyCostsToLandlord 
      ? unitDistributions.filter((u) => !u.isVacant)
      : unitDistributions;
    
    const totalArea = activeUnits.reduce((sum, u) => sum + u.area, 0);
    const totalPersons = activeUnits.reduce((sum, u) => sum + u.persons, 0);
    const totalUnits = activeUnits.length;
    const totalHeatingShare = activeUnits.reduce((sum, u) => sum + u.heatingShare, 0);

    const results: CalculationResult[] = unitDistributions.map((unit) => {
      if (unit.isVacant && vacancyCostsToLandlord) {
        return {
          unitId: unit.unitId,
          unitNumber: unit.unitNumber,
          tenantName: unit.tenantName,
          costShare: 0,
          prepayments: unit.prepayments,
          result: unit.prepayments, // Return all prepayments as credit
          costBreakdown: [],
        };
      }

      const costBreakdown = costItems
        .filter((cost) => cost.isActive && cost.amount > 0)
        .map((cost) => {
          let share = 0;
          let formula = "";

          switch (cost.distributionKey) {
            case "area":
              share = totalArea > 0 ? (unit.area / totalArea) * cost.amount : 0;
              formula = `${unit.area} m² / ${totalArea} m² × ${(cost.amount / 100).toFixed(2)} €`;
              break;
            case "persons":
              share = totalPersons > 0 ? (unit.persons / totalPersons) * cost.amount : 0;
              formula = `${unit.persons} Pers. / ${totalPersons} Pers. × ${(cost.amount / 100).toFixed(2)} €`;
              break;
            case "units":
              share = totalUnits > 0 ? cost.amount / totalUnits : 0;
              formula = `1 / ${totalUnits} Einheiten × ${(cost.amount / 100).toFixed(2)} €`;
              break;
            case "consumption":
              share = totalHeatingShare > 0 ? (unit.heatingShare / totalHeatingShare) * cost.amount : 0;
              formula = `${unit.heatingShare}% / ${totalHeatingShare}% × ${(cost.amount / 100).toFixed(2)} €`;
              break;
          }

          return {
            costItemId: cost.id,
            costItemName: cost.name,
            totalAmount: cost.amount,
            share: Math.round(share),
            distributionKey: cost.distributionKey,
            formula,
          };
        });

      const totalCostShare = costBreakdown.reduce((sum, c) => sum + c.share, 0);
      const result = unit.prepayments - totalCostShare;

      return {
        unitId: unit.unitId,
        unitNumber: unit.unitNumber,
        tenantName: unit.tenantName,
        costShare: totalCostShare,
        prepayments: unit.prepayments,
        result,
        costBreakdown,
      };
    });

    setWizardData((prev) => ({
      ...prev,
      calculationResults: results,
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
      case 3:
        // Check if units have required data based on distribution keys
        const hasAreaKey = wizardData.costItems.some((c) => c.isActive && c.distributionKey === "area");
        const hasPersonsKey = wizardData.costItems.some((c) => c.isActive && c.distributionKey === "persons");
        const activeDistUnits = wizardData.vacancyCostsToLandlord 
          ? wizardData.unitDistributions.filter((u) => !u.isVacant)
          : wizardData.unitDistributions;
        
        if (activeDistUnits.length === 0) return false;
        if (hasAreaKey && activeDistUnits.some((u) => u.area <= 0)) return false;
        if (hasPersonsKey && activeDistUnits.some((u) => u.persons <= 0)) return false;
        return true;
      case 4:
        return wizardData.calculationResults.length > 0;
       default:
         return true;
     }
   };
 
   const totalCosts = wizardData.costItems
     .filter((item) => item.isActive)
     .reduce((sum, item) => sum + item.amount, 0);
 
  const distributionTotals = {
    totalArea: wizardData.unitDistributions.reduce((sum, u) => sum + u.area, 0),
    totalPersons: wizardData.unitDistributions.reduce((sum, u) => sum + u.persons, 0),
    totalUnits: wizardData.unitDistributions.length,
  };

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
        updateUnitDistribution,
        initializeUnitDistributions,
        calculateResults,
         resetWizard,
         isStepValid,
         totalCosts,
        distributionTotals,
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