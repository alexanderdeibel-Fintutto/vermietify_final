import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getPlanById, getPlanByProductId, Plan, PLANS } from '@/config/plans';

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

interface UseSubscriptionReturn {
  subscription: SubscriptionData | null;
  plan: Plan;
  isPro: boolean;
  isEnterprise: boolean;
  isActive: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, session } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionData> => {
      if (!session?.access_token) {
        return { subscribed: false, product_id: null, subscription_end: null };
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }

      return data as SubscriptionData;
    },
    enabled: !!user && !!session,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
    retry: 2,
  });

  const subscription = data ?? null;
  
  // Determine plan based on product_id
  let currentPlan: Plan = PLANS[0]; // Default to free
  if (subscription?.subscribed && subscription.product_id) {
    const matchedPlan = getPlanByProductId(subscription.product_id);
    if (matchedPlan) {
      currentPlan = matchedPlan;
    }
  }

  const isPro = ['pro', 'enterprise'].includes(currentPlan.id);
  const isEnterprise = currentPlan.id === 'enterprise';
  const isActive = subscription?.subscribed ?? false;

  return {
    subscription,
    plan: currentPlan,
    isPro,
    isEnterprise,
    isActive,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
