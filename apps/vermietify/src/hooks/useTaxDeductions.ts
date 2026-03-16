import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type DeductionCategory = "afa" | "maintenance" | "insurance" | "interest" | "property_tax" | "management" | "travel" | "office" | "legal" | "advertising" | "other";

export interface TaxDeduction {
  id: string;
  organization_id: string;
  tax_year: number;
  building_id: string | null;
  category: DeductionCategory;
  description: string;
  amount_cents: number;
  document_id: string | null;
  is_recurring: boolean;
  created_at: string;
  buildings?: { name: string };
}

export const DEDUCTION_CATEGORIES: Record<DeductionCategory, string> = {
  afa: "Abschreibung (AfA)",
  maintenance: "Instandhaltung & Reparaturen",
  insurance: "Versicherungen",
  interest: "Schuldzinsen",
  property_tax: "Grundsteuer",
  management: "Verwaltungskosten",
  travel: "Fahrtkosten",
  office: "Arbeitszimmer",
  legal: "Rechts- & Beratungskosten",
  advertising: "Vermietungsinserate",
  other: "Sonstiges",
};

export function useTaxDeductions(year: number) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const deductionsQuery = useQuery({
    queryKey: ["tax-deductions", orgId, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tax_deductions")
        .select("*, buildings(name)")
        .eq("organization_id", orgId!)
        .eq("tax_year", year)
        .order("category");
      if (error) throw error;
      return (data || []) as TaxDeduction[];
    },
    enabled: !!orgId,
  });

  const totalByCategory = (deductions: TaxDeduction[]) => {
    return deductions.reduce<Record<string, number>>((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + d.amount_cents;
      return acc;
    }, {});
  };

  const createDeduction = useMutation({
    mutationFn: async (input: Partial<TaxDeduction>) => {
      const { data, error } = await supabase
        .from("tax_deductions")
        .insert({ ...input, organization_id: orgId!, tax_year: year })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-deductions"] });
      toast({ title: "Absetzung erfasst" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const deleteDeduction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tax_deductions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-deductions"] });
      toast({ title: "Absetzung gelöscht" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...deductionsQuery, totalByCategory, createDeduction, deleteDeduction };
}
