import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CalculatorApp {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_name: string;
  app_url: string;
  category: string;
  is_internal: boolean;
  is_active: boolean;
  sort_order: number;
  credit_cost: number;
  context_pages: string[];
}

export function useCalculatorApps() {
  return useQuery({
    queryKey: ["calculator-apps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculator_apps")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      return (data ?? []) as unknown as CalculatorApp[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useCalculatorAppsByCategory(category: string) {
  const { data, ...rest } = useCalculatorApps();
  return {
    data: data?.filter((a) => a.category === category),
    ...rest,
  };
}

export function useCalculatorAppsForPage(pathname: string) {
  const { data, ...rest } = useCalculatorApps();
  return {
    data: data?.filter((a) =>
      a.context_pages?.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      )
    ),
    ...rest,
  };
}
