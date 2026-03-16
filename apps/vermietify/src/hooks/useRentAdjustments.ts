import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const ADJUSTMENTS_KEY = "rent-adjustments";
const VPI_KEY = "vpi-index";

export type RentAdjustmentType = "index" | "staffel" | "vergleichsmiete";
export type RentAdjustmentStatus = "pending" | "announced" | "active" | "cancelled";

export interface RentAdjustment {
  id: string;
  lease_id: string;
  organization_id: string;
  type: RentAdjustmentType;
  old_rent_cents: number;
  new_rent_cents: number;
  effective_date: string;
  index_old?: number;
  index_new?: number;
  index_change_percent?: number;
  step_number?: number;
  announcement_sent_at?: string;
  status: RentAdjustmentStatus;
  notes?: string;
  created_at: string;
}

export interface LeaseRentSettings {
  id: string;
  lease_id: string;
  rent_type: RentAdjustmentType;
  index_base_value?: number;
  index_base_date?: string;
  index_min_change_percent?: number;
  index_announcement_months?: number;
  staffel_steps?: StaffelStep[];
  last_adjustment_date?: string;
  next_adjustment_due?: string;
}

export interface StaffelStep {
  step_number: number;
  effective_date: string;
  rent_cents: number;
}

export interface VPIIndex {
  id: string;
  year: number;
  month: number;
  value: number;
  change_yoy_percent?: number;
}

export interface IndexAdjustmentCandidate {
  leaseId: string;
  tenant: string;
  tenantEmail?: string;
  unit: string;
  unitId: string;
  buildingId: string;
  currentRentCents: number;
  currentRentEuro: string;
  indexAtLastAdjustment: number;
  currentIndex: number;
  indexChangePercent: number;
  newRentCents: number;
  newRentEuro: string;
  differenceCents: number;
  differenceEuro: string;
  lastAdjustmentDate: string;
  monthsSinceLastAdjustment: number;
  status: "due" | "recently_adjusted" | "not_eligible";
  announcementMonthsRequired: number;
}

export function useRentAdjustments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // Fetch VPI index history
  const useVPIIndex = () => {
    return useQuery({
      queryKey: [VPI_KEY],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("vpi_index")
          .select("*")
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .limit(24);

        if (error) throw error;
        return data as VPIIndex[];
      },
    });
  };

  // Fetch current VPI value
  const useCurrentVPI = () => {
    return useQuery({
      queryKey: [VPI_KEY, "current"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("vpi_index")
          .select("*")
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        return data as VPIIndex;
      },
    });
  };

  // Fetch rent adjustments
  const useAdjustmentsList = (filters?: { 
    type?: RentAdjustmentType; 
    status?: RentAdjustmentStatus;
    leaseId?: string;
  }) => {
    return useQuery({
      queryKey: [ADJUSTMENTS_KEY, "list", filters],
      queryFn: async () => {
        let query = supabase
          .from("rent_adjustments")
          .select(`
            *,
            leases(
              id,
              rent_amount,
              start_date,
              tenants(id, first_name, last_name),
              units(id, unit_number, buildings(id, name))
            )
          `)
          .order("created_at", { ascending: false });

        if (filters?.type) {
          query = query.eq("type", filters.type);
        }
        if (filters?.status) {
          query = query.eq("status", filters.status);
        }
        if (filters?.leaseId) {
          query = query.eq("lease_id", filters.leaseId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      },
      enabled: !!profile?.organization_id,
    });
  };

  // Fetch lease rent settings
  const useLeaseRentSettings = (leaseId?: string) => {
    return useQuery({
      queryKey: [ADJUSTMENTS_KEY, "settings", leaseId],
      queryFn: async () => {
        if (!leaseId) return null;
        
        const { data, error } = await supabase
          .from("lease_rent_settings")
          .select("*")
          .eq("lease_id", leaseId)
          .maybeSingle();

        if (error) throw error;
        if (!data) return null;
        
        return {
          ...data,
          staffel_steps: Array.isArray(data.staffel_steps) ? data.staffel_steps as unknown as StaffelStep[] : [],
        } as LeaseRentSettings;
      },
      enabled: !!leaseId,
    });
  };

  // Fetch all leases with rent settings
  const useLeasesWithSettings = () => {
    return useQuery({
      queryKey: [ADJUSTMENTS_KEY, "leases-with-settings"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("leases")
          .select(`
            *,
            tenants(id, first_name, last_name, email),
            units(id, unit_number, buildings(id, name, address)),
            lease_rent_settings(*)
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      },
      enabled: !!profile?.organization_id,
    });
  };

  // Check eligible index adjustments via edge function
  const checkIndexAdjustments = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error("No organization");

      const { data, error } = await supabase.functions.invoke("check-index-adjustments", {
        body: { organizationId: profile.organization_id },
      });

      if (error) throw error;
      return data as {
        success: boolean;
        currentVpi: { value: number; year: number; month: number; changeYoy: number };
        summary: {
          totalIndexContracts: number;
          eligibleForAdjustment: number;
          dueNow: number;
          totalPotentialIncreaseCents: number;
          totalPotentialIncreaseEuro: string;
        };
        adjustments: IndexAdjustmentCandidate[];
      };
    },
  });

  // Create rent adjustment
  const createAdjustment = useMutation({
    mutationFn: async (data: {
      leaseId: string;
      type: RentAdjustmentType;
      oldRentCents: number;
      newRentCents: number;
      effectiveDate: string;
      indexOld?: number;
      indexNew?: number;
      indexChangePercent?: number;
      stepNumber?: number;
      notes?: string;
    }) => {
      if (!profile?.organization_id) throw new Error("No organization");

      const { data: adjustment, error } = await supabase
        .from("rent_adjustments")
        .insert({
          lease_id: data.leaseId,
          organization_id: profile.organization_id,
          type: data.type,
          old_rent_cents: data.oldRentCents,
          new_rent_cents: data.newRentCents,
          effective_date: data.effectiveDate,
          index_old: data.indexOld,
          index_new: data.indexNew,
          index_change_percent: data.indexChangePercent,
          step_number: data.stepNumber,
          notes: data.notes,
          status: "pending",
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return adjustment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADJUSTMENTS_KEY] });
      toast({
        title: "Mietanpassung erstellt",
        description: "Die Anpassung wurde erfolgreich angelegt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update adjustment status
  const updateAdjustmentStatus = useMutation({
    mutationFn: async ({ id, status, announcementSentAt }: { 
      id: string; 
      status: RentAdjustmentStatus;
      announcementSentAt?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (announcementSentAt) {
        updateData.announcement_sent_at = announcementSentAt;
      }

      const { data, error } = await supabase
        .from("rent_adjustments")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADJUSTMENTS_KEY] });
      toast({
        title: "Status aktualisiert",
        description: "Der Status wurde erfolgreich geändert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Activate adjustment (update lease rent)
  const activateAdjustment = useMutation({
    mutationFn: async (adjustmentId: string) => {
      // Get the adjustment
      const { data: adjustment, error: fetchError } = await supabase
        .from("rent_adjustments")
        .select("*")
        .eq("id", adjustmentId)
        .single();

      if (fetchError) throw fetchError;

      // Update the lease rent amount
      const { error: leaseError } = await supabase
        .from("leases")
        .update({ rent_amount: adjustment.new_rent_cents / 100 })
        .eq("id", adjustment.lease_id);

      if (leaseError) throw leaseError;

      // Update adjustment status
      const { data, error } = await supabase
        .from("rent_adjustments")
        .update({ status: "active" })
        .eq("id", adjustmentId)
        .select()
        .single();

      if (error) throw error;

      // Update rent settings last adjustment date
      await supabase
        .from("lease_rent_settings")
        .update({ last_adjustment_date: adjustment.effective_date })
        .eq("lease_id", adjustment.lease_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADJUSTMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({
        title: "Anpassung aktiviert",
        description: "Die neue Miete ist jetzt aktiv.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save lease rent settings
  const saveRentSettings = useMutation({
    mutationFn: async (data: {
      leaseId: string;
      rentType: RentAdjustmentType;
      indexBaseValue?: number;
      indexBaseDate?: string;
      indexMinChangePercent?: number;
      indexAnnouncementMonths?: number;
      staffelSteps?: StaffelStep[];
    }) => {
      const { data: existing } = await supabase
        .from("lease_rent_settings")
        .select("id")
        .eq("lease_id", data.leaseId)
        .maybeSingle();

      const settingsData = {
        lease_id: data.leaseId,
        rent_type: data.rentType,
        index_base_value: data.indexBaseValue,
        index_base_date: data.indexBaseDate,
        index_min_change_percent: data.indexMinChangePercent,
        index_announcement_months: data.indexAnnouncementMonths,
        staffel_steps: data.staffelSteps ? JSON.stringify(data.staffelSteps) : undefined,
      };

      if (existing) {
        const { data: updated, error } = await supabase
          .from("lease_rent_settings")
          .update(settingsData)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from("lease_rent_settings")
          .insert(settingsData)
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADJUSTMENTS_KEY] });
      toast({
        title: "Einstellungen gespeichert",
        description: "Die Mietanpassungs-Einstellungen wurden aktualisiert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete adjustment
  const deleteAdjustment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rent_adjustments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADJUSTMENTS_KEY] });
      toast({
        title: "Anpassung gelöscht",
        description: "Die Mietanpassung wurde entfernt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    useVPIIndex,
    useCurrentVPI,
    useAdjustmentsList,
    useLeaseRentSettings,
    useLeasesWithSettings,
    checkIndexAdjustments,
    createAdjustment,
    updateAdjustmentStatus,
    activateAdjustment,
    saveRentSettings,
    deleteAdjustment,
  };
}