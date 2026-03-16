import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OnboardingProgress {
  profile_completed: boolean;
  first_building_created: boolean;
  first_unit_created: boolean;
  first_tenant_created: boolean;
  first_contract_created: boolean;
}

async function checkHasRows(table: "buildings" | "tenants", orgId: string): Promise<boolean> {
  const { data } = await supabase
    .from(table)
    .select("id")
    .eq("organization_id", orgId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export function useOnboardingProgress() {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const orgId = profile?.organization_id;

  const { data: progress, isLoading } = useQuery({
    queryKey: ["onboarding-progress-live", userId, orgId],
    queryFn: async (): Promise<OnboardingProgress> => {
      const profileCompleted = !!(
        profile?.first_name?.trim() && profile?.last_name?.trim()
      );

      if (!orgId) {
        return {
          profile_completed: profileCompleted,
          first_building_created: false,
          first_unit_created: false,
          first_tenant_created: false,
          first_contract_created: false,
        };
      }

      // Check buildings, tenants (have org_id), units and leases separately
      const [hasBuildings, hasTenants, unitsRes, leasesRes] = await Promise.all([
        checkHasRows("buildings", orgId),
        checkHasRows("tenants", orgId),
        supabase.from("units").select("id").limit(1),
        supabase.from("leases").select("id").limit(1),
      ]);

      return {
        profile_completed: profileCompleted,
        first_building_created: hasBuildings,
        first_unit_created: (unitsRes.data?.length ?? 0) > 0,
        first_tenant_created: hasTenants,
        first_contract_created: (leasesRes.data?.length ?? 0) > 0,
      };
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const completedSteps = progress
    ? [
        progress.profile_completed,
        progress.first_building_created,
        progress.first_unit_created,
        progress.first_tenant_created,
        progress.first_contract_created,
      ].filter(Boolean).length
    : 0;

  const totalSteps = 5;
  const progressPercent = (completedSteps / totalSteps) * 100;
  const isComplete = completedSteps === totalSteps;

  return {
    progress,
    isLoading,
    completedSteps,
    totalSteps,
    progressPercent,
    isComplete,
  };
}
