import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface TaxScenario {
  id: string;
  organization_id: string;
  tax_year: number;
  name: string;
  description: string | null;
  scenario_data: {
    income_cents?: number;
    deductions_cents?: number;
    afa_cents?: number;
    additional_deductions_cents?: number;
    tax_rate?: number;
  };
  result_data: {
    taxable_income_cents?: number;
    estimated_tax_cents?: number;
    effective_rate?: number;
    savings_vs_base_cents?: number;
  };
  created_at: string;
}

export function useTaxScenarios(year: number) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const scenariosQuery = useQuery({
    queryKey: ["tax-scenarios", orgId, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tax_scenarios")
        .select("*")
        .eq("organization_id", orgId!)
        .eq("tax_year", year)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TaxScenario[];
    },
    enabled: !!orgId,
  });

  const calculateScenario = (input: TaxScenario["scenario_data"]): TaxScenario["result_data"] => {
    const income = input.income_cents || 0;
    const deductions = (input.deductions_cents || 0) + (input.afa_cents || 0) + (input.additional_deductions_cents || 0);
    const taxable = Math.max(0, income - deductions);
    const rate = input.tax_rate || 0.3;
    const tax = Math.round(taxable * rate);
    return {
      taxable_income_cents: taxable,
      estimated_tax_cents: tax,
      effective_rate: income > 0 ? tax / income : 0,
    };
  };

  const createScenario = useMutation({
    mutationFn: async (input: Partial<TaxScenario>) => {
      const result = calculateScenario(input.scenario_data || {});
      const { data, error } = await supabase
        .from("tax_scenarios")
        .insert({
          ...input,
          organization_id: orgId!,
          tax_year: year,
          result_data: result,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-scenarios", orgId, year] });
      toast({ title: "Szenario erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const deleteScenario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tax_scenarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-scenarios", orgId, year] });
      toast({ title: "Szenario gelöscht" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...scenariosQuery, calculateScenario, createScenario, deleteScenario };
}
