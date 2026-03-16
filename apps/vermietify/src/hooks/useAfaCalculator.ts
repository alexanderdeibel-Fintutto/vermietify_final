import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface AfaAsset {
  id: string;
  organization_id: string;
  building_id: string | null;
  name: string;
  purchase_date: string;
  purchase_price_cents: number;
  building_share_percent: number;
  year_built: number | null;
  afa_rate: number | null;
  afa_type: "linear" | "degressive" | "sonder";
  remaining_years: number | null;
  notes: string | null;
  created_at: string;
  buildings?: { name: string };
}

export interface AfaCalculation {
  year: number;
  afa_amount_cents: number;
  cumulative_cents: number;
  remaining_value_cents: number;
}

export function calculateAfaSchedule(asset: AfaAsset): AfaCalculation[] {
  const buildingValue = Math.round(asset.purchase_price_cents * (asset.building_share_percent / 100));
  const yearBuilt = asset.year_built || 1990;
  const rate = asset.afa_rate || (yearBuilt < 1925 ? 2.5 : yearBuilt >= 2023 ? 3.0 : 2.0);
  const totalYears = Math.ceil(100 / rate);
  const annualAfa = Math.round(buildingValue * (rate / 100));
  const purchaseYear = new Date(asset.purchase_date).getFullYear();

  const schedule: AfaCalculation[] = [];
  let cumulative = 0;

  for (let i = 0; i < totalYears && cumulative < buildingValue; i++) {
    const amount = Math.min(annualAfa, buildingValue - cumulative);
    cumulative += amount;
    schedule.push({
      year: purchaseYear + i,
      afa_amount_cents: amount,
      cumulative_cents: cumulative,
      remaining_value_cents: buildingValue - cumulative,
    });
  }
  return schedule;
}

export function useAfaCalculator() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const assetsQuery = useQuery({
    queryKey: ["afa-assets", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("afa_assets")
        .select("*, buildings(name)")
        .eq("organization_id", orgId!)
        .order("purchase_date", { ascending: false });
      if (error) throw error;
      return (data || []) as AfaAsset[];
    },
    enabled: !!orgId,
  });

  const createAsset = useMutation({
    mutationFn: async (input: Partial<AfaAsset>) => {
      const { data, error } = await supabase
        .from("afa_assets")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["afa-assets"] });
      toast({ title: "AfA-Objekt erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("afa_assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["afa-assets"] });
      toast({ title: "AfA-Objekt gelöscht" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...assetsQuery, createAsset, deleteAsset, calculateAfaSchedule };
}
