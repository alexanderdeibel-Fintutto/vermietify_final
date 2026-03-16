import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const OFFERS_KEY = "rental_offers";
const KDU_KEY = "kdu_rates";

export interface RentalOfferInsert {
  organization_id: string;
  unit_id: string;
  tenant_id: string;
  rent_amount_cents: number;
  utility_advance_cents: number;
  heating_advance_cents: number;
  total_amount_cents: number;
  deposit_amount_cents: number;
  kdu_rate_id?: string;
  is_kdu_eligible?: boolean;
  kdu_max_total_cents?: number;
  proposed_start_date: string;
  proposed_end_date?: string;
  valid_until?: string;
  status?: string;
  special_agreements?: string;
  notes?: string;
  created_by?: string;
}

export interface KduRateInsert {
  organization_id: string;
  building_id: string;
  region_name?: string;
  municipality?: string;
  postal_code?: string;
  household_size: number;
  max_area_sqm?: number;
  max_rent_cents: number;
  max_utilities_cents: number;
  max_heating_cents: number;
  max_total_cents: number;
  valid_from?: string;
  valid_until?: string;
  source?: string;
  notes?: string;
}

export function useRentalOffers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const useOffersList = () =>
    useQuery({
      queryKey: [OFFERS_KEY, "list"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("rental_offers")
          .select(`
            *,
            tenants(id, first_name, last_name, email, phone, status),
            units(id, unit_number, area, rooms, floor, buildings(id, name, address, city, postal_code))
          `)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data;
      },
    });

  const useOffer = (id: string | undefined) =>
    useQuery({
      queryKey: [OFFERS_KEY, "detail", id],
      queryFn: async () => {
        if (!id) throw new Error("ID required");
        const { data, error } = await supabase
          .from("rental_offers")
          .select(`
            *,
            tenants(*, leases(id, is_active, start_date, rent_amount, units(id, unit_number, buildings(id, name)))),
            units(id, unit_number, area, rooms, floor, buildings(id, name, address, city, postal_code))
          `)
          .eq("id", id)
          .single();
        if (error) throw error;
        return data;
      },
      enabled: !!id,
    });

  const createOffer = useMutation({
    mutationFn: async (data: RentalOfferInsert) => {
      const { data: offer, error } = await supabase
        .from("rental_offers")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return offer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OFFERS_KEY] });
      toast({ title: "Angebot erstellt", description: "Das Mietangebot wurde erfolgreich angelegt." });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const updateOfferStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("rental_offers")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OFFERS_KEY] });
      toast({ title: "Status aktualisiert" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const convertToContract = useMutation({
    mutationFn: async ({ offerId, leaseId }: { offerId: string; leaseId: string }) => {
      const { data, error } = await supabase
        .from("rental_offers")
        .update({ status: "accepted", converted_lease_id: leaseId, converted_at: new Date().toISOString() })
        .eq("id", offerId)
        .select()
        .single();
      if (error) throw error;

      const { data: offer } = await supabase
        .from("rental_offers")
        .select("tenant_id")
        .eq("id", offerId)
        .single();
      if (offer) {
        await supabase.from("tenants").update({ status: "active" }).eq("id", offer.tenant_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OFFERS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast({ title: "Vertrag erstellt", description: "Das Angebot wurde in einen Mietvertrag umgewandelt." });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // KdU Rates - per building
  const useKduRates = (buildingId?: string) =>
    useQuery({
      queryKey: [KDU_KEY, "list", buildingId],
      queryFn: async () => {
        let query = supabase
          .from("kdu_rates")
          .select("*")
          .order("household_size", { ascending: true });
        
        if (buildingId) {
          query = query.eq("building_id", buildingId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
      },
    });

  const useKduRatesByBuilding = () =>
    useQuery({
      queryKey: [KDU_KEY, "all-with-buildings"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("kdu_rates")
          .select("*, buildings(id, name, address, city)")
          .order("building_id", { ascending: true })
          .order("household_size", { ascending: true });
        if (error) throw error;
        return data;
      },
    });

  const createKduRate = useMutation({
    mutationFn: async (data: KduRateInsert) => {
      const { data: rate, error } = await supabase
        .from("kdu_rates")
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return rate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KDU_KEY] });
      toast({ title: "KdU-Satz gespeichert" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const createKduRatesBatch = useMutation({
    mutationFn: async (rates: KduRateInsert[]) => {
      const { data, error } = await supabase
        .from("kdu_rates")
        .insert(rates as any[])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KDU_KEY] });
      toast({ title: "KdU-Sätze gespeichert" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const updateKduRate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<KduRateInsert> }) => {
      const { data: rate, error } = await supabase
        .from("kdu_rates")
        .update(data as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return rate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KDU_KEY] });
      toast({ title: "KdU-Satz aktualisiert" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const deleteKduRate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kdu_rates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KDU_KEY] });
      toast({ title: "KdU-Satz gelöscht" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const deleteKduRatesForBuilding = useMutation({
    mutationFn: async (buildingId: string) => {
      const { error } = await supabase.from("kdu_rates").delete().eq("building_id", buildingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KDU_KEY] });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  return {
    useOffersList,
    useOffer,
    createOffer,
    updateOfferStatus,
    convertToContract,
    useKduRates,
    useKduRatesByBuilding,
    createKduRate,
    createKduRatesBatch,
    updateKduRate,
    deleteKduRate,
    deleteKduRatesForBuilding,
  };
}
