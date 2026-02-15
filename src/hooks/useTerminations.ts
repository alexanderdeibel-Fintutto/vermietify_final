import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Termination {
  id: string;
  organization_id: string;
  lease_id: string | null;
  tenant_id: string | null;
  unit_id: string | null;
  type: "tenant" | "landlord" | "mutual";
  reason: string | null;
  notice_date: string;
  effective_date: string;
  status: "pending" | "confirmed" | "disputed" | "completed" | "withdrawn";
  document_path: string | null;
  notes: string | null;
  created_at: string;
  units?: { name: string };
}

export function useTerminations() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const terminationsQuery = useQuery({
    queryKey: ["terminations", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terminations")
        .select("*, units(name)")
        .eq("organization_id", orgId!)
        .order("notice_date", { ascending: false });
      if (error) throw error;
      return (data || []) as Termination[];
    },
    enabled: !!orgId,
  });

  const createTermination = useMutation({
    mutationFn: async (input: Partial<Termination>) => {
      const { data, error } = await supabase
        .from("terminations")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terminations", orgId] });
      toast({ title: "Kündigung erfasst" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const updateTermination = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Termination> & { id: string }) => {
      const { data, error } = await supabase
        .from("terminations")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terminations", orgId] });
      toast({ title: "Kündigung aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...terminationsQuery, createTermination, updateTermination };
}
