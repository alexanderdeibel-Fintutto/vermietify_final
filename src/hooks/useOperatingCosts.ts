 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { useAuth } from "@/hooks/useAuth";
 
 const OPERATING_COSTS_KEY = "operating-costs";
 
 export type BillingStatus = "draft" | "calculated" | "sent" | "completed";
 
 export interface OperatingCostBilling {
   id: string;
   building_id: string;
   billing_year: number;
   period_start: string;
   period_end: string;
   total_costs: number;
   status: BillingStatus;
   unit_count: number;
   total_payments_due: number;
   total_credits: number;
   created_at: string;
   buildings?: {
     id: string;
     name: string;
     address: string;
   };
 }
 
 export interface OperatingCostFilters {
   year?: number;
   buildingIds?: string[];
   status?: BillingStatus | "all";
 }
 
 export function useOperatingCosts() {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const { profile } = useAuth();
 
   // Since we don't have a dedicated billing table yet, we'll aggregate from utility_costs
   const useBillingsList = (filters?: OperatingCostFilters) => {
     return useQuery({
       queryKey: [OPERATING_COSTS_KEY, "list", filters],
       queryFn: async () => {
         // Get utility costs grouped by building and year
         let query = supabase
           .from("utility_costs")
           .select(`
             id,
             billing_year,
             building_id,
             amount,
             cost_type,
             created_at,
             buildings(id, name, address)
           `)
           .order("billing_year", { ascending: false });
 
         if (filters?.year) {
           query = query.eq("billing_year", filters.year);
         }
 
         if (filters?.buildingIds && filters.buildingIds.length > 0) {
           query = query.in("building_id", filters.buildingIds);
         }
 
         const { data, error } = await query;
 
         if (error) throw error;
 
         // Group by building and year to create "billings"
         const billingMap = new Map<string, OperatingCostBilling>();
 
         data?.forEach((cost: any) => {
           const key = `${cost.building_id}-${cost.billing_year}`;
           
           if (billingMap.has(key)) {
             const existing = billingMap.get(key)!;
             existing.total_costs += Number(cost.amount);
           } else {
             billingMap.set(key, {
               id: key,
               building_id: cost.building_id,
               billing_year: cost.billing_year,
               period_start: `${cost.billing_year}-01-01`,
               period_end: `${cost.billing_year}-12-31`,
               total_costs: Number(cost.amount),
               status: "draft" as BillingStatus,
               unit_count: 0,
               total_payments_due: 0,
               total_credits: 0,
               created_at: cost.created_at,
               buildings: cost.buildings,
             });
           }
         });
 
         // Get unit counts for each building
         const buildingIds = [...new Set(data?.map((c: any) => c.building_id) || [])];
         if (buildingIds.length > 0) {
           const { data: units } = await supabase
             .from("units")
             .select("building_id")
             .in("building_id", buildingIds);
 
           const unitCounts = new Map<string, number>();
           units?.forEach((u: any) => {
             unitCounts.set(u.building_id, (unitCounts.get(u.building_id) || 0) + 1);
           });
 
           billingMap.forEach((billing) => {
             billing.unit_count = unitCounts.get(billing.building_id) || 0;
           });
         }
 
         return Array.from(billingMap.values());
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Get statistics
   const useBillingStats = () => {
     return useQuery({
       queryKey: [OPERATING_COSTS_KEY, "stats"],
       queryFn: async () => {
         const { data, error } = await supabase
           .from("utility_costs")
           .select("billing_year, building_id, amount");
 
         if (error) throw error;
 
         // Group by building and year
         const billingMap = new Map<string, { total: number }>();
         data?.forEach((cost: any) => {
           const key = `${cost.building_id}-${cost.billing_year}`;
           if (billingMap.has(key)) {
             billingMap.get(key)!.total += Number(cost.amount);
           } else {
             billingMap.set(key, { total: Number(cost.amount) });
           }
         });
 
         const totalBillings = billingMap.size;
         const totalCosts = Array.from(billingMap.values()).reduce(
           (sum, b) => sum + b.total,
           0
         );
 
         return {
           totalBillings,
           pendingBillings: Math.floor(totalBillings * 0.3), // Mock for now
           totalPaymentsDue: Math.round(totalCosts * 0.1), // Mock: 10% as payments due
           totalCredits: Math.round(totalCosts * 0.05), // Mock: 5% as credits
         };
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Delete billing (utility costs for a building/year)
   const deleteBilling = useMutation({
     mutationFn: async ({ buildingId, year }: { buildingId: string; year: number }) => {
       const { error } = await supabase
         .from("utility_costs")
         .delete()
         .eq("building_id", buildingId)
         .eq("billing_year", year);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: [OPERATING_COSTS_KEY] });
       toast({
         title: "Abrechnung gelöscht",
         description: "Die Betriebskostenabrechnung wurde gelöscht.",
       });
     },
     onError: (error: Error) => {
       toast({
         title: "Fehler",
         description: error.message || "Die Abrechnung konnte nicht gelöscht werden.",
         variant: "destructive",
       });
     },
   });
 
   return {
     useBillingsList,
     useBillingStats,
     deleteBilling,
   };
 }