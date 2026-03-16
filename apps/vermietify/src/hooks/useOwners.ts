import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Owner {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_number: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
  notes: string | null;
  created_at: string;
  owner_buildings?: { building_id: string; share_percent: number; buildings?: { name: string } }[];
}

export function useOwners() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const ownersQuery = useQuery({
    queryKey: ["owners", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owners")
        .select("*, owner_buildings(building_id, share_percent, buildings(name))")
        .eq("organization_id", orgId!)
        .order("last_name");
      if (error) throw error;
      return (data || []) as Owner[];
    },
    enabled: !!orgId,
  });

  const createOwner = useMutation({
    mutationFn: async (input: Partial<Owner>) => {
      const { data, error } = await supabase
        .from("owners")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      toast({ title: "Eigentümer erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const updateOwner = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Owner> & { id: string }) => {
      const { data, error } = await supabase
        .from("owners")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      toast({ title: "Eigentümer aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...ownersQuery, createOwner, updateOwner };
}
