import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

// CO2 emission factors by energy source (kg CO2 per kWh)
export const CO2_EMISSION_FACTORS: Record<string, number> = {
  gas: 0.201,
  oil: 0.266,
  fernwaerme: 0.183,
  waermepumpe: 0.0,
  pellets: 0.023,
  other: 0.200,
};

// CO2KostAufG stages: kg CO2/m²/year -> landlord share %
export const CO2_STAGES = [
  { maxKg: 12, stage: 1, landlordPercent: 0 },
  { maxKg: 17, stage: 2, landlordPercent: 10 },
  { maxKg: 22, stage: 3, landlordPercent: 20 },
  { maxKg: 27, stage: 4, landlordPercent: 30 },
  { maxKg: 32, stage: 5, landlordPercent: 40 },
  { maxKg: 37, stage: 6, landlordPercent: 50 },
  { maxKg: 42, stage: 7, landlordPercent: 60 },
  { maxKg: 47, stage: 8, landlordPercent: 70 },
  { maxKg: 52, stage: 9, landlordPercent: 80 },
  { maxKg: Infinity, stage: 10, landlordPercent: 95 },
];

export function getStageInfo(co2PerSqm: number) {
  for (const stage of CO2_STAGES) {
    if (co2PerSqm < stage.maxKg) {
      return stage;
    }
  }
  return CO2_STAGES[CO2_STAGES.length - 1];
}

export function getStageColor(stage: number): string {
  if (stage <= 2) return "bg-green-500";
  if (stage <= 4) return "bg-lime-500";
  if (stage <= 6) return "bg-yellow-500";
  if (stage <= 8) return "bg-orange-500";
  return "bg-red-500";
}

export interface EnergyCertificate {
  id: string;
  building_id: string;
  organization_id: string;
  certificate_type: "bedarfsausweis" | "verbrauchsausweis";
  valid_until: string | null;
  energy_demand_kwh_sqm: number | null;
  primary_energy_demand: number | null;
  energy_source: string;
  co2_emission_factor: number | null;
  pdf_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CO2Calculation {
  id: string;
  building_id: string;
  organization_id: string;
  energy_certificate_id: string | null;
  period_start: string;
  period_end: string;
  heated_area_sqm: number;
  energy_consumption_kwh: number;
  energy_source: string;
  co2_emission_factor: number;
  co2_emissions_kg: number;
  co2_per_sqm_year: number;
  stage: number;
  landlord_share_percent: number;
  tenant_share_percent: number;
  total_co2_cost_cents: number;
  landlord_cost_cents: number;
  tenant_cost_cents: number;
  calculation_details: Record<string, unknown>;
  status: "draft" | "final" | "applied";
  applied_to_billing_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  buildings?: {
    id: string;
    name: string;
    address: string;
    total_area: number | null;
  };
}

export interface CreateCO2CalculationInput {
  building_id: string;
  energy_certificate_id?: string;
  period_start: string;
  period_end: string;
  heated_area_sqm: number;
  energy_consumption_kwh: number;
  energy_source: string;
  total_co2_cost_cents: number;
}

export interface CreateEnergyCertificateInput {
  building_id: string;
  certificate_type: "bedarfsausweis" | "verbrauchsausweis";
  valid_until?: string;
  energy_demand_kwh_sqm?: number;
  primary_energy_demand?: number;
  energy_source: string;
  co2_emission_factor?: number;
  pdf_path?: string;
  notes?: string;
}

export function useCO2() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = profile?.organization_id;

  // Fetch all energy certificates
  const {
    data: certificates = [],
    isLoading: certificatesLoading,
    error: certificatesError,
  } = useQuery({
    queryKey: ["energy-certificates", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("energy_certificates")
        .select("*, buildings(id, name, address)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (EnergyCertificate & { buildings: { id: string; name: string; address: string } })[];
    },
    enabled: !!organizationId,
  });

  // Fetch all CO2 calculations
  const {
    data: calculations = [],
    isLoading: calculationsLoading,
    error: calculationsError,
  } = useQuery({
    queryKey: ["co2-calculations", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("co2_calculations")
        .select("*, buildings(id, name, address, total_area)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CO2Calculation[];
    },
    enabled: !!organizationId,
  });

  // Fetch buildings with their latest CO2 data
  const {
    data: buildingsWithCO2 = [],
    isLoading: buildingsLoading,
  } = useQuery({
    queryKey: ["buildings-co2", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      // Get all buildings
      const { data: buildings, error: buildingsError } = await supabase
        .from("buildings")
        .select("id, name, address, total_area")
        .eq("organization_id", organizationId);
      if (buildingsError) throw buildingsError;

      // Get latest calculation for each building
      const { data: latestCalcs, error: calcsError } = await supabase
        .from("co2_calculations")
        .select("*")
        .eq("organization_id", organizationId)
        .order("period_end", { ascending: false });
      if (calcsError) throw calcsError;

      // Get certificates for each building
      const { data: certs, error: certsError } = await supabase
        .from("energy_certificates")
        .select("*")
        .eq("organization_id", organizationId);
      if (certsError) throw certsError;

      // Map buildings with their latest CO2 data
      return buildings.map((building) => {
        const latestCalc = latestCalcs.find((c) => c.building_id === building.id);
        const certificate = certs.find((c) => c.building_id === building.id);
        return {
          ...building,
          latestCalculation: latestCalc || null,
          certificate: certificate || null,
        };
      });
    },
    enabled: !!organizationId,
  });

  // Create energy certificate
  const createCertificate = useMutation({
    mutationFn: async (input: CreateEnergyCertificateInput) => {
      if (!organizationId) throw new Error("Keine Organisation");
      const { data, error } = await supabase
        .from("energy_certificates")
        .insert({
          ...input,
          organization_id: organizationId,
          co2_emission_factor: input.co2_emission_factor || CO2_EMISSION_FACTORS[input.energy_source] || 0.2,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["energy-certificates"] });
      queryClient.invalidateQueries({ queryKey: ["buildings-co2"] });
      toast({ title: "Energieausweis gespeichert" });
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Create CO2 calculation
  const createCalculation = useMutation({
    mutationFn: async (input: CreateCO2CalculationInput) => {
      if (!organizationId) throw new Error("Keine Organisation");

      const emissionFactor = CO2_EMISSION_FACTORS[input.energy_source] || 0.2;
      const co2Emissions = input.energy_consumption_kwh * emissionFactor;
      const co2PerSqmYear = co2Emissions / input.heated_area_sqm;
      const stageInfo = getStageInfo(co2PerSqmYear);

      const landlordCost = Math.round(input.total_co2_cost_cents * (stageInfo.landlordPercent / 100));
      const tenantCost = input.total_co2_cost_cents - landlordCost;

      const { data, error } = await supabase
        .from("co2_calculations")
        .insert({
          building_id: input.building_id,
          organization_id: organizationId,
          energy_certificate_id: input.energy_certificate_id || null,
          period_start: input.period_start,
          period_end: input.period_end,
          heated_area_sqm: input.heated_area_sqm,
          energy_consumption_kwh: input.energy_consumption_kwh,
          energy_source: input.energy_source,
          co2_emission_factor: emissionFactor,
          co2_emissions_kg: co2Emissions,
          co2_per_sqm_year: co2PerSqmYear,
          stage: stageInfo.stage,
          landlord_share_percent: stageInfo.landlordPercent,
          tenant_share_percent: 100 - stageInfo.landlordPercent,
          total_co2_cost_cents: input.total_co2_cost_cents,
          landlord_cost_cents: landlordCost,
          tenant_cost_cents: tenantCost,
          calculation_details: {
            emission_factor_used: emissionFactor,
            stage_thresholds: CO2_STAGES,
          },
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["co2-calculations"] });
      queryClient.invalidateQueries({ queryKey: ["buildings-co2"] });
      toast({ title: "CO2-Berechnung gespeichert" });
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Update calculation status
  const updateCalculationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "final" | "applied" }) => {
      const { data, error } = await supabase
        .from("co2_calculations")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["co2-calculations"] });
      queryClient.invalidateQueries({ queryKey: ["buildings-co2"] });
      toast({ title: "Status aktualisiert" });
    },
  });

  // Delete calculation
  const deleteCalculation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("co2_calculations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["co2-calculations"] });
      queryClient.invalidateQueries({ queryKey: ["buildings-co2"] });
      toast({ title: "Berechnung gelöscht" });
    },
  });

  // Delete certificate
  const deleteCertificate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("energy_certificates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["energy-certificates"] });
      queryClient.invalidateQueries({ queryKey: ["buildings-co2"] });
      toast({ title: "Energieausweis gelöscht" });
    },
  });

  // Stats
  const stats = {
    buildingsWithData: buildingsWithCO2.filter((b) => b.latestCalculation).length,
    totalBuildings: buildingsWithCO2.length,
    averageEfficiency:
      buildingsWithCO2.filter((b) => b.latestCalculation).length > 0
        ? buildingsWithCO2
            .filter((b) => b.latestCalculation)
            .reduce((sum, b) => sum + (b.latestCalculation?.co2_per_sqm_year || 0), 0) /
          buildingsWithCO2.filter((b) => b.latestCalculation).length
        : 0,
    averageLandlordShare:
      buildingsWithCO2.filter((b) => b.latestCalculation).length > 0
        ? buildingsWithCO2
            .filter((b) => b.latestCalculation)
            .reduce((sum, b) => sum + (b.latestCalculation?.landlord_share_percent || 0), 0) /
          buildingsWithCO2.filter((b) => b.latestCalculation).length
        : 0,
  };

  return {
    certificates,
    certificatesLoading,
    certificatesError,
    calculations,
    calculationsLoading,
    calculationsError,
    buildingsWithCO2,
    buildingsLoading,
    stats,
    createCertificate,
    createCalculation,
    updateCalculationStatus,
    deleteCalculation,
    deleteCertificate,
  };
}
