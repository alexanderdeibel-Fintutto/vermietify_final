import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface TaxDeclaration {
  id: string;
  organization_id: string;
  tax_profile_id: string | null;
  tax_year: number;
  form_type: "anlage_v" | "anlage_kap" | "anlage_so" | "anlage_vg" | "est" | "ust" | "gew";
  status: "draft" | "in_progress" | "review" | "ready" | "submitted" | "accepted" | "rejected" | "amended";
  building_id: string | null;
  data_json: Record<string, unknown>;
  submitted_at: string | null;
  response_data: Record<string, unknown> | null;
  created_at: string;
  buildings?: { name: string };
}

const FORM_TYPE_LABELS: Record<string, string> = {
  anlage_v: "Anlage V (Vermietung)",
  anlage_kap: "Anlage KAP (Kapitalerträge)",
  anlage_so: "Anlage SO (Sonstige Einkünfte)",
  anlage_vg: "Anlage VG (Veräußerungsgewinne)",
  est: "Einkommensteuererklärung",
  ust: "Umsatzsteuererklärung",
  gew: "Gewerbesteuererklärung",
};

export { FORM_TYPE_LABELS };

export function useTaxDeclarations(year?: number) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const declarationsQuery = useQuery({
    queryKey: ["tax-declarations", orgId, year],
    queryFn: async () => {
      let query = supabase
        .from("tax_declarations")
        .select("*, buildings(name)")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });

      if (year) query = query.eq("tax_year", year);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TaxDeclaration[];
    },
    enabled: !!orgId,
  });

  const createDeclaration = useMutation({
    mutationFn: async (input: Partial<TaxDeclaration>) => {
      const { data, error } = await supabase
        .from("tax_declarations")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-declarations"] });
      toast({ title: "Steuererklärung erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const updateDeclaration = useMutation({
    mutationFn: async ({ id, ...input }: Partial<TaxDeclaration> & { id: string }) => {
      const { data, error } = await supabase
        .from("tax_declarations")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-declarations"] });
      toast({ title: "Steuererklärung aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const deleteDeclaration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tax_declarations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-declarations"] });
      toast({ title: "Steuererklärung gelöscht" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...declarationsQuery, createDeclaration, updateDeclaration, deleteDeclaration };
}
