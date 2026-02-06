import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OnboardingProgress {
  id?: string;
  user_id: string;
  profile_completed: boolean;
  first_building_created: boolean;
  first_unit_created: boolean;
  first_tenant_created: boolean;
  first_contract_created: boolean;
  completed_at: string | null;
}

export function useOnboardingProgress() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ["onboarding-progress", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("onboarding_progress")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      // Return default progress if none exists
      if (!data) {
        return {
          user_id: userId,
          profile_completed: false,
          first_building_created: false,
          first_unit_created: false,
          first_tenant_created: false,
          first_contract_created: false,
          completed_at: null,
        } as OnboardingProgress;
      }
      
      return data as OnboardingProgress;
    },
    enabled: !!userId,
  });

  const updateProgress = useMutation({
    mutationFn: async (updates: Partial<OnboardingProgress>) => {
      if (!userId) throw new Error("User required");

      // Check if all items are complete
      const newProgress = { ...progress, ...updates };
      const allComplete = 
        newProgress.profile_completed &&
        newProgress.first_building_created &&
        newProgress.first_unit_created;

      const { data, error } = await supabase
        .from("onboarding_progress")
        .upsert({
          user_id: userId,
          ...updates,
          completed_at: allComplete ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-progress"] });
    },
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
  const isComplete = progress?.completed_at !== null;

  return {
    progress,
    isLoading,
    updateProgress,
    completedSteps,
    totalSteps,
    progressPercent,
    isComplete,
  };
}
