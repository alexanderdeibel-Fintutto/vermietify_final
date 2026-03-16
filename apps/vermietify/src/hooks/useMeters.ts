import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { differenceInMonths, parseISO } from "date-fns";

export type MeterType = "electricity" | "gas" | "water" | "heating";
export type MeterStatus = "current" | "reading_due" | "overdue";

export interface Meter {
  id: string;
  unit_id: string;
  meter_number: string;
  meter_type: MeterType;
  installation_date: string | null;
  notes: string | null;
  reading_interval_months: number;
  created_at: string;
  updated_at: string;
  unit?: {
    id: string;
    unit_number: string;
    building_id: string;
    building?: {
      id: string;
      name: string;
      address: string;
      city: string;
    };
  };
  latest_reading?: MeterReading | null;
}

export interface MeterReading {
  id: string;
  meter_id: string;
  reading_value: number;
  reading_date: string;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface MeterWithStatus extends Meter {
  status: MeterStatus;
  last_reading_value: number | null;
  last_reading_date: string | null;
}

export interface MeterInsert {
  unit_id: string;
  meter_number: string;
  meter_type: MeterType;
  installation_date?: string | null;
  notes?: string | null;
  reading_interval_months?: number;
}

export interface MeterReadingInsert {
  meter_id: string;
  reading_value: number;
  reading_date: string;
  notes?: string | null;
}

function calculateMeterStatus(
  lastReadingDate: string | null,
  intervalMonths: number
): MeterStatus {
  if (!lastReadingDate) return "reading_due";
  
  const monthsSinceReading = differenceInMonths(new Date(), parseISO(lastReadingDate));
  
  if (monthsSinceReading >= intervalMonths + 1) return "overdue";
  if (monthsSinceReading >= intervalMonths) return "reading_due";
  return "current";
}

export function useMeters() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all meters with unit and building info
  const metersQuery = useQuery({
    queryKey: ["meters"],
    queryFn: async (): Promise<MeterWithStatus[]> => {
      const { data: meters, error } = await supabase
        .from("meters")
        .select(`
          *,
          unit:units(
            id,
            unit_number,
            building_id,
            building:buildings(id, name, address, city)
          )
        `)
        .order("meter_number");

      if (error) throw error;

      // Fetch latest reading for each meter
      const meterIds = meters.map((m) => m.id);
      const { data: readings } = await supabase
        .from("meter_readings")
        .select("*")
        .in("meter_id", meterIds)
        .order("reading_date", { ascending: false });

      // Map latest reading to each meter
      const readingsByMeter = new Map<string, MeterReading>();
      readings?.forEach((r) => {
        if (!readingsByMeter.has(r.meter_id)) {
          readingsByMeter.set(r.meter_id, r as MeterReading);
        }
      });

      return meters.map((m) => {
        const latestReading = readingsByMeter.get(m.id);
        return {
          ...m,
          meter_type: m.meter_type as MeterType,
          unit: m.unit as Meter["unit"],
          latest_reading: latestReading || null,
          last_reading_value: latestReading?.reading_value ?? null,
          last_reading_date: latestReading?.reading_date ?? null,
          status: calculateMeterStatus(
            latestReading?.reading_date ?? null,
            m.reading_interval_months
          ),
        };
      });
    },
  });

  // Fetch readings for a specific meter
  const useMeterReadings = (meterId: string | undefined) => {
    return useQuery({
      queryKey: ["meter-readings", meterId],
      queryFn: async () => {
        if (!meterId) return [];
        const { data, error } = await supabase
          .from("meter_readings")
          .select("*")
          .eq("meter_id", meterId)
          .order("reading_date", { ascending: false });

        if (error) throw error;
        return data as MeterReading[];
      },
      enabled: !!meterId,
    });
  };

  // Create meter
  const createMutation = useMutation({
    mutationFn: async (data: MeterInsert) => {
      const { data: meter, error } = await supabase
        .from("meters")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return meter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters"] });
      toast.success("Zähler erstellt");
    },
    onError: (error) => {
      console.error("Error creating meter:", error);
      toast.error("Fehler beim Erstellen des Zählers");
    },
  });

  // Add reading
  const addReadingMutation = useMutation({
    mutationFn: async (data: MeterReadingInsert) => {
      const { data: reading, error } = await supabase
        .from("meter_readings")
        .insert({
          ...data,
          recorded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return reading;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters"] });
      queryClient.invalidateQueries({ queryKey: ["meter-readings"] });
      toast.success("Zählerstand erfasst");
    },
    onError: (error) => {
      console.error("Error adding reading:", error);
      toast.error("Fehler beim Erfassen des Zählerstands");
    },
  });

  // Update meter
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MeterInsert> }) => {
      const { data, error } = await supabase
        .from("meters")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters"] });
      toast.success("Zähler aktualisiert");
    },
    onError: (error) => {
      console.error("Error updating meter:", error);
      toast.error("Fehler beim Aktualisieren des Zählers");
    },
  });

  // Delete meter
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters"] });
      toast.success("Zähler gelöscht");
    },
    onError: (error) => {
      console.error("Error deleting meter:", error);
      toast.error("Fehler beim Löschen des Zählers");
    },
  });

  // Calculate stats
  const stats = {
    totalMeters: metersQuery.data?.length ?? 0,
    readingsThisMonth: 0, // Would need additional query
    pendingReadings: metersQuery.data?.filter((m) => m.status !== "current").length ?? 0,
    avgConsumption: 0, // Would need consumption calculation
  };

  return {
    meters: metersQuery.data ?? [],
    isLoading: metersQuery.isLoading,
    error: metersQuery.error,
    stats,
    useMeterReadings,
    createMeter: createMutation.mutate,
    addReading: addReadingMutation.mutate,
    updateMeter: updateMutation.mutate,
    deleteMeter: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isAddingReading: addReadingMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
