import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { UnitFormData } from "@/types/database";
import type { Database } from "@/integrations/supabase/types";

type UnitRow = Database["public"]["Tables"]["units"]["Row"];
type UnitInsert = Database["public"]["Tables"]["units"]["Insert"];
type UnitUpdate = Database["public"]["Tables"]["units"]["Update"];

const UNITS_KEY = "units";

export function useUnits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all units, optionally filtered by building
  const useUnitsList = (buildingId?: string) => {
    return useQuery({
      queryKey: [UNITS_KEY, "list", buildingId],
      queryFn: async () => {
        let query = supabase
          .from("units")
          .select(`
            *,
            buildings!inner(name, address, city)
          `)
          .order("unit_number", { ascending: true });

        if (buildingId) {
          query = query.eq("building_id", buildingId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
      },
    });
  };

  // Fetch single unit with tenant info
  const useUnit = (id: string | undefined) => {
    return useQuery({
      queryKey: [UNITS_KEY, "detail", id],
      queryFn: async () => {
        if (!id) throw new Error("Unit ID required");

        const { data: unit, error: unitError } = await supabase
          .from("units")
          .select(`
            *,
            buildings(id, name, address, city)
          `)
          .eq("id", id)
          .maybeSingle();

        if (unitError) throw unitError;
        if (!unit) throw new Error("Unit not found");

        // Fetch current tenant through active lease
        const { data: lease } = await supabase
          .from("leases")
          .select(`
            *,
            tenants(*)
          `)
          .eq("unit_id", id)
          .eq("is_active", true)
          .maybeSingle();

        return {
          ...unit,
          tenant: lease?.tenants || null,
          building: unit.buildings,
        };
      },
      enabled: !!id,
    });
  };

  // Create unit mutation
  const createUnit = useMutation({
    mutationFn: async (data: UnitFormData) => {
      const insertData: UnitInsert = {
        building_id: data.building_id,
        unit_number: data.unit_number,
        floor: data.floor,
        area: data.area,
        rooms: data.rooms,
        rent_amount: data.rent_amount,
        utility_advance: data.utility_advance || 0,
        status: data.status,
        notes: data.notes,
      };

      const { data: unit, error } = await supabase
        .from("units")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return unit;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [UNITS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["buildings", "detail", variables.building_id] });
      toast({
        title: "Einheit erstellt",
        description: "Die Einheit wurde erfolgreich angelegt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Die Einheit konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Update unit mutation
  const updateUnit = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UnitFormData> }) => {
      const updateData: UnitUpdate = {};
      
      if (data.unit_number !== undefined) updateData.unit_number = data.unit_number;
      if (data.floor !== undefined) updateData.floor = data.floor;
      if (data.area !== undefined) updateData.area = data.area;
      if (data.rooms !== undefined) updateData.rooms = data.rooms;
      if (data.rent_amount !== undefined) updateData.rent_amount = data.rent_amount;
      if (data.utility_advance !== undefined) updateData.utility_advance = data.utility_advance;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const { data: unit, error } = await supabase
        .from("units")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return unit;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: [UNITS_KEY, "detail", id] });
      const previousUnit = queryClient.getQueryData([UNITS_KEY, "detail", id]);
      return { previousUnit };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNITS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast({
        title: "Einheit aktualisiert",
        description: "Die Änderungen wurden gespeichert.",
      });
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousUnit) {
        queryClient.setQueryData([UNITS_KEY, "detail", id], context.previousUnit);
      }
      toast({
        title: "Fehler",
        description: error.message || "Die Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Delete unit mutation
  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("units")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNITS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast({
        title: "Einheit gelöscht",
        description: "Die Einheit wurde erfolgreich gelöscht.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Die Einheit konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  return {
    useUnitsList,
    useUnit,
    createUnit,
    updateUnit,
    deleteUnit,
  };
}
