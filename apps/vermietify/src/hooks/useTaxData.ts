 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 
 export function useTaxData(year: number) {
   const { profile } = useAuth();
 
   // Get total rental income for the year
   const useRentalIncome = () => {
     return useQuery({
       queryKey: ["rental-income", profile?.organization_id, year],
       queryFn: async () => {
         if (!profile?.organization_id) return 0;
 
         const startDate = `${year}-01-01`;
         const endDate = `${year}-12-31`;
 
         const { data, error } = await supabase
           .from("transactions")
           .select("amount")
           .eq("organization_id", profile.organization_id)
           .eq("is_income", true)
           .gte("transaction_date", startDate)
           .lte("transaction_date", endDate);
 
         if (error) throw error;
         return data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Get total expenses for the year
   const useExpenses = () => {
     return useQuery({
       queryKey: ["expenses", profile?.organization_id, year],
       queryFn: async () => {
         if (!profile?.organization_id) return 0;
 
         const startDate = `${year}-01-01`;
         const endDate = `${year}-12-31`;
 
         const { data, error } = await supabase
           .from("transactions")
           .select("amount")
           .eq("organization_id", profile.organization_id)
           .eq("is_income", false)
           .gte("transaction_date", startDate)
           .lte("transaction_date", endDate);
 
         if (error) throw error;
         return data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Get buildings for AfA calculation
   const useBuildings = () => {
     return useQuery({
       queryKey: ["buildings-afa", profile?.organization_id],
       queryFn: async () => {
         if (!profile?.organization_id) return [];
 
         const { data, error } = await supabase
           .from("buildings")
           .select("*")
           .eq("organization_id", profile.organization_id);
 
         if (error) throw error;
         return data || [];
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   // Get tax documents
   const useTaxDocuments = () => {
     return useQuery({
       queryKey: ["tax-documents", profile?.organization_id, year],
       queryFn: async () => {
         if (!profile?.organization_id) return [];
 
         const { data, error } = await supabase
           .from("tax_documents")
           .select("*, buildings(name)")
           .eq("organization_id", profile.organization_id)
           .eq("year", year)
           .order("document_date", { ascending: false });
 
         if (error) throw error;
         return data || [];
       },
       enabled: !!profile?.organization_id,
     });
   };
 
   return {
     useRentalIncome,
     useExpenses,
     useBuildings,
     useTaxDocuments,
   };
 }
 
 // AfA calculation helper
 export function calculateAfA(purchasePrice: number, yearBuilt: number, purchaseYear: number): number {
   // German AfA rules:
   // - Buildings built before 1925: 2.5% per year (40 years)
   // - Buildings built 1925 or later: 2% per year (50 years)
   // - Buildings from 2023+: 3% per year (new rules)
   
   const rate = yearBuilt < 1925 ? 0.025 : yearBuilt >= 2023 ? 0.03 : 0.02;
   const buildingValue = purchasePrice * 0.85; // Assuming 85% building, 15% land
   return Math.round(buildingValue * rate);
 }