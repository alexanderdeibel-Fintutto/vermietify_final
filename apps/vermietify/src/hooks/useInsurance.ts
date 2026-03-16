import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface InsurancePolicy {
  id: string;
  organization_id: string;
  building_id: string | null;
  policy_number: string;
  provider: string;
  type: "building" | "liability" | "fire" | "water" | "glass" | "rent_loss" | "legal" | "other";
  premium_cents: number;
  premium_interval: "monthly" | "quarterly" | "semi_annual" | "yearly";
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  deductible_cents: number;
  notes: string | null;
  created_at: string;
  buildings?: { name: string };
}

export interface InsuranceClaim {
  id: string;
  policy_id: string;
  organization_id: string;
  claim_number: string | null;
  status: "reported" | "in_review" | "approved" | "rejected" | "settled";
  incident_date: string;
  description: string;
  claimed_amount_cents: number | null;
  settled_amount_cents: number | null;
  created_at: string;
}

export const INSURANCE_TYPE_LABELS: Record<string, string> = {
  building: "Gebäudeversicherung",
  liability: "Haftpflichtversicherung",
  fire: "Feuerversicherung",
  water: "Leitungswasserversicherung",
  glass: "Glasversicherung",
  rent_loss: "Mietausfallversicherung",
  legal: "Rechtsschutzversicherung",
  other: "Sonstige",
};

export function useInsurance() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const policiesQuery = useQuery({
    queryKey: ["insurance-policies", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_policies")
        .select("*, buildings(name)")
        .eq("organization_id", orgId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data || []) as InsurancePolicy[];
    },
    enabled: !!orgId,
  });

  const createPolicy = useMutation({
    mutationFn: async (input: Partial<InsurancePolicy>) => {
      const { data, error } = await supabase
        .from("insurance_policies")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-policies"] });
      toast({ title: "Versicherung erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const createClaim = useMutation({
    mutationFn: async (input: Partial<InsuranceClaim>) => {
      const { data, error } = await supabase
        .from("insurance_claims")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-policies"] });
      toast({ title: "Schadensfall gemeldet" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...policiesQuery, createPolicy, createClaim };
}
