import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Budget {
  id: string;
  organization_id: string;
  building_id: string | null;
  name: string;
  year: number;
  total_budget_cents: number;
  spent_cents: number;
  created_at: string;
  buildings?: { name: string };
  budget_items?: BudgetItem[];
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  category: string;
  description: string | null;
  planned_cents: number;
  actual_cents: number;
}

export function useBudgets(year?: number) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const budgetsQuery = useQuery({
    queryKey: ["budgets", orgId, year],
    queryFn: async () => {
      let query = supabase
        .from("budgets")
        .select("*, buildings(name), budget_items(*)")
        .eq("organization_id", orgId!)
        .order("year", { ascending: false });

      if (year) query = query.eq("year", year);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Budget[];
    },
    enabled: !!orgId,
  });

  const createBudget = useMutation({
    mutationFn: async (input: Partial<Budget> & { items?: Partial<BudgetItem>[] }) => {
      const { items, ...budgetData } = input;
      const { data, error } = await supabase
        .from("budgets")
        .insert({ ...budgetData, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;

      if (items && items.length > 0) {
        const { error: itemsErr } = await supabase
          .from("budget_items")
          .insert(items.map((i) => ({ ...i, budget_id: data.id })));
        if (itemsErr) throw itemsErr;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "Budget erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...budgetsQuery, createBudget };
}
