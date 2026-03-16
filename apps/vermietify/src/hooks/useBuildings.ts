import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { 
  Building, 
  BuildingWithUnits, 
  BuildingFormData,
  Unit 
} from "@/types/database";
import type { Database } from "@/integrations/supabase/types";

type BuildingRow = Database["public"]["Tables"]["buildings"]["Row"];
type UnitRow = Database["public"]["Tables"]["units"]["Row"];

const BUILDINGS_KEY = "buildings";

export function useBuildings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // Fetch all buildings with pagination
  const useBuildingsList = (page: number = 1, pageSize: number = 10) => {
    return useQuery({
      queryKey: [BUILDINGS_KEY, "list", page, pageSize],
      queryFn: async () => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
          .from("buildings")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        return {
          buildings: data as BuildingRow[],
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        };
      },
      enabled: !!profile?.organization_id,
    });
  };

  // Fetch single building with units
  const useBuilding = (id: string | undefined) => {
    return useQuery({
      queryKey: [BUILDINGS_KEY, "detail", id],
      queryFn: async () => {
        if (!id) throw new Error("Building ID required");

        const { data: building, error: buildingError } = await supabase
          .from("buildings")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (buildingError) throw buildingError;
        if (!building) throw new Error("Building not found");

        const { data: units, error: unitsError } = await supabase
          .from("units")
          .select("*")
          .eq("building_id", id)
          .order("unit_number", { ascending: true });

        if (unitsError) throw unitsError;

        return {
          ...building,
          units: (units || []) as UnitRow[],
        };
      },
      enabled: !!id,
    });
  };

  // Create building mutation
  const createBuilding = useMutation({
    mutationFn: async (data: BuildingFormData) => {
      if (!profile?.organization_id) {
        throw new Error("No organization found");
      }

      const { data: building, error } = await supabase
        .from("buildings")
        .insert({
          organization_id: profile.organization_id,
          name: data.name,
          address: data.street,
          postal_code: data.zip,
          city: data.city,
          building_type: data.building_type || 'apartment',
          total_area: data.total_area,
          year_built: data.year_built,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return building;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUILDINGS_KEY] });
      toast({
        title: "Gebäude erstellt",
        description: "Das Gebäude wurde erfolgreich angelegt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Das Gebäude konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Update building mutation
  const updateBuilding = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BuildingFormData> }) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.street !== undefined) updateData.address = data.street;
      if (data.zip !== undefined) updateData.postal_code = data.zip;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.building_type !== undefined) updateData.building_type = data.building_type;
      if (data.total_area !== undefined) updateData.total_area = data.total_area;
      if (data.year_built !== undefined) updateData.year_built = data.year_built;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const { data: building, error } = await supabase
        .from("buildings")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return building;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [BUILDINGS_KEY, "detail", id] });
      const previousBuilding = queryClient.getQueryData([BUILDINGS_KEY, "detail", id]);
      return { previousBuilding };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUILDINGS_KEY] });
      toast({
        title: "Gebäude aktualisiert",
        description: "Die Änderungen wurden gespeichert.",
      });
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousBuilding) {
        queryClient.setQueryData([BUILDINGS_KEY, "detail", id], context.previousBuilding);
      }
      toast({
        title: "Fehler",
        description: error.message || "Die Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Delete building mutation
  const deleteBuilding = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("buildings")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUILDINGS_KEY] });
      toast({
        title: "Gebäude gelöscht",
        description: "Das Gebäude wurde erfolgreich gelöscht.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Das Gebäude konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  return {
    useBuildingsList,
    useBuilding,
    createBuilding,
    updateBuilding,
    deleteBuilding,
  };
}
