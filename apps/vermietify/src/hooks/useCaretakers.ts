import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Caretaker {
  id: string;
  building_id: string;
  organization_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  status: "invited" | "active" | "inactive";
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCaretakers(buildingId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["caretakers", buildingId];

  const caretakersQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!buildingId) return [];
      const { data, error } = await supabase
        .from("building_caretakers" as any)
        .select("*")
        .eq("building_id", buildingId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Caretaker[];
    },
    enabled: !!buildingId,
  });

  const sendInvites = useMutation({
    mutationFn: async (payload: {
      building_id: string;
      emails: { email: string; first_name?: string; last_name?: string; phone?: string }[];
    }) => {
      const { data, error } = await supabase.functions.invoke("send-caretaker-invite", {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Einladungen wurden gesendet");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast.error("Fehler beim Senden: " + err.message);
    },
  });

  const removeCaretaker = useMutation({
    mutationFn: async (caretakerId: string) => {
      const { error } = await supabase
        .from("building_caretakers" as any)
        .delete()
        .eq("id", caretakerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Hausmeister entfernt");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast.error("Fehler: " + err.message);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("building_caretakers" as any)
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status aktualisiert");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast.error("Fehler: " + err.message);
    },
  });

  return { caretakersQuery, sendInvites, removeCaretaker, updateStatus };
}
