import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Portfolio {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  total_value_cents: number;
  created_at: string;
  investments?: Investment[];
}

export interface Investment {
  id: string;
  portfolio_id: string;
  organization_id: string;
  type: "stock" | "etf" | "bond" | "crypto" | "real_estate" | "precious_metal" | "other";
  name: string;
  symbol: string | null;
  quantity: number;
  purchase_price_cents: number;
  current_price_cents: number | null;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
}

export function usePortfolio() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const portfoliosQuery = useQuery({
    queryKey: ["portfolios", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*, investments(*)")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Portfolio[];
    },
    enabled: !!orgId,
  });

  const createPortfolio = useMutation({
    mutationFn: async (input: Partial<Portfolio>) => {
      const { data, error } = await supabase
        .from("portfolios")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast({ title: "Portfolio erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const addInvestment = useMutation({
    mutationFn: async (input: Partial<Investment>) => {
      const { data, error } = await supabase
        .from("investments")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast({ title: "Investment hinzugefügt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...portfoliosQuery, createPortfolio, addInvestment };
}
