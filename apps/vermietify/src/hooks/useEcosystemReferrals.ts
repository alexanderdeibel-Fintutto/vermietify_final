import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface EcosystemReferral {
  id: string;
  app_slug: string;
  app_name: string;
  invited_email: string;
  invited_name: string | null;
  status: string;
  created_at: string;
}

export function useEcosystemReferrals() {
  const { profile } = useAuth();

  const query = useQuery({
    queryKey: ["ecosystem-referrals", profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ecosystem_referrals")
        .select("id, app_slug, app_name, invited_email, invited_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as EcosystemReferral[];
    },
    enabled: !!profile?.organization_id,
  });

  return query;
}

export function useTrackReferral() {
  const { profile, user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      app_slug: string;
      app_name: string;
      invited_email: string;
      invited_name?: string;
      invited_tenant_id?: string;
      channel?: string;
    }) => {
      if (!profile?.organization_id || !user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("ecosystem_referrals").insert({
        organization_id: profile.organization_id,
        referrer_user_id: user.id,
        app_slug: params.app_slug,
        app_name: params.app_name,
        invited_email: params.invited_email,
        invited_name: params.invited_name ?? null,
        invited_tenant_id: params.invited_tenant_id ?? null,
        channel: params.channel ?? "email",
        status: "sent",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ecosystem-referrals"] });
    },
  });
}
