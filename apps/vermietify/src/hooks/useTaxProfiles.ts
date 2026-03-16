import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface TaxProfile {
  id: string;
  organization_id: string;
  tax_year: number;
  country: "DE" | "AT" | "CH";
  tax_number: string | null;
  tax_office_id: string | null;
  tax_office_name: string | null;
  filing_status: "not_started" | "in_progress" | "ready" | "filed" | "accepted" | "rejected";
  total_income_cents: number;
  total_deductions_cents: number;
  taxable_income_cents: number;
  estimated_tax_cents: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useTaxProfiles(year?: number) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const profilesQuery = useQuery({
    queryKey: ["tax-profiles", orgId, year],
    queryFn: async () => {
      let query = supabase
        .from("tax_profiles")
        .select("*")
        .eq("organization_id", orgId!)
        .order("tax_year", { ascending: false });

      if (year) query = query.eq("tax_year", year);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TaxProfile[];
    },
    enabled: !!orgId,
  });

  const createProfile = useMutation({
    mutationFn: async (input: Partial<TaxProfile>) => {
      const { data, error } = await supabase
        .from("tax_profiles")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-profiles", orgId] });
      toast({ title: "Steuerprofil erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, ...input }: Partial<TaxProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from("tax_profiles")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-profiles", orgId] });
      toast({ title: "Steuerprofil aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...profilesQuery, createProfile, updateProfile };
}
