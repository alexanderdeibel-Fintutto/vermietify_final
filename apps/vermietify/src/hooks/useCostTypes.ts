 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 export interface CostType {
   id: string;
   organization_id: string | null;
   name: string;
   description: string | null;
   default_distribution_key: "area" | "persons" | "units" | "consumption";
   is_chargeable: boolean;
   category: "heating" | "water" | "cleaning" | "insurance" | "taxes" | "other";
   is_system: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export type CostTypeInsert = Omit<CostType, "id" | "created_at" | "updated_at" | "is_system">;
 export type CostTypeUpdate = Partial<CostTypeInsert>;
 
 export function useCostTypes() {
   const queryClient = useQueryClient();
 
   const costTypesQuery = useQuery({
     queryKey: ["cost-types"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("cost_types")
         .select("*")
         .order("is_system", { ascending: false })
         .order("name");
 
       if (error) throw error;
       return data as CostType[];
     },
   });
 
   const createMutation = useMutation({
     mutationFn: async (costType: CostTypeInsert) => {
       const { data, error } = await supabase
         .from("cost_types")
         .insert(costType)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["cost-types"] });
       toast.success("Kostenart erstellt");
     },
     onError: (error) => {
       console.error("Error creating cost type:", error);
       toast.error("Fehler beim Erstellen der Kostenart");
     },
   });
 
   const updateMutation = useMutation({
     mutationFn: async ({ id, updates }: { id: string; updates: CostTypeUpdate }) => {
       const { data, error } = await supabase
         .from("cost_types")
         .update(updates)
         .eq("id", id)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["cost-types"] });
       toast.success("Kostenart aktualisiert");
     },
     onError: (error) => {
       console.error("Error updating cost type:", error);
       toast.error("Fehler beim Aktualisieren der Kostenart");
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("cost_types").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["cost-types"] });
       toast.success("Kostenart gelöscht");
     },
     onError: (error) => {
       console.error("Error deleting cost type:", error);
       toast.error("Fehler beim Löschen der Kostenart");
     },
   });
 
   return {
     costTypes: costTypesQuery.data || [],
     isLoading: costTypesQuery.isLoading,
     error: costTypesQuery.error,
     createCostType: createMutation.mutate,
     updateCostType: updateMutation.mutate,
     deleteCostType: deleteMutation.mutate,
     isCreating: createMutation.isPending,
     isUpdating: updateMutation.isPending,
     isDeleting: deleteMutation.isPending,
   };
 }