import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EcosystemApp {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon_emoji: string;
  color_from: string;
  color_to: string;
  app_url: string;
  register_url: string;
  target_audience: string;
  features: string[];
  price_monthly_cents: number;
  price_yearly_cents: number;
  free_for_target: string | null;
  is_active: boolean;
  sort_order: number;
}

export function useEcosystemApps(excludeSlugs: string[] = ["vermieter-freude"]) {
  return useQuery({
    queryKey: ["ecosystem-apps", excludeSlugs],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ecosystem_apps")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;

      const apps = (data ?? []) as unknown as EcosystemApp[];
      return apps.filter((a) => !excludeSlugs.includes(a.slug));
    },
    staleTime: 1000 * 60 * 30, // 30 min cache
  });
}
