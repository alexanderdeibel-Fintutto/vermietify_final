import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { LeaseFormData } from "@/types/database";
import type { Database } from "@/integrations/supabase/types";

type LeaseRow = Database["public"]["Tables"]["leases"]["Row"];
type LeaseInsert = Database["public"]["Tables"]["leases"]["Insert"];
type LeaseUpdate = Database["public"]["Tables"]["leases"]["Update"];

const CONTRACTS_KEY = "contracts";

interface ContractFilters {
  isActive?: boolean;
  tenantId?: string;
  unitId?: string;
  buildingId?: string;
}

export function useContracts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // Fetch all contracts with optional filters
  const useContractsList = (filters?: ContractFilters) => {
    return useQuery({
      queryKey: [CONTRACTS_KEY, "list", filters],
      queryFn: async () => {
        let query = supabase
          .from("leases")
          .select(`
            *,
            tenants!inner(id, first_name, last_name, email),
            units!inner(
              id, 
              unit_number, 
              building_id,
              buildings(id, name, address)
            )
          `)
          .order("created_at", { ascending: false });

        if (filters?.isActive !== undefined) {
          query = query.eq("is_active", filters.isActive);
        }

        if (filters?.tenantId) {
          query = query.eq("tenant_id", filters.tenantId);
        }

        if (filters?.unitId) {
          query = query.eq("unit_id", filters.unitId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
      },
      enabled: !!profile?.organization_id,
    });
  };

  // Fetch single contract with full details
  const useContract = (id: string | undefined) => {
    return useQuery({
      queryKey: [CONTRACTS_KEY, "detail", id],
      queryFn: async () => {
        if (!id) throw new Error("Contract ID required");

        const { data: lease, error } = await supabase
          .from("leases")
          .select(`
            *,
            tenants(*),
            units(
              *,
              buildings(*)
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!lease) throw new Error("Contract not found");

        return {
          ...lease,
          tenant: lease.tenants,
          unit: lease.units,
          building: lease.units?.buildings,
        };
      },
      enabled: !!id,
    });
  };

  // Create contract mutation
  const createContract = useMutation({
    mutationFn: async (data: LeaseFormData) => {
      const insertData: LeaseInsert = {
        unit_id: data.unit_id,
        tenant_id: data.tenant_id,
        start_date: data.start_date,
        end_date: data.end_date || null,
        rent_amount: data.rent_amount,
        utility_advance: data.utility_advance || 0,
        deposit_amount: data.deposit_amount || 0,
        deposit_paid: data.deposit_paid || false,
        payment_day: data.payment_day || 1,
        is_active: true,
      };

      const { data: lease, error } = await supabase
        .from("leases")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Update unit status to rented
      await supabase
        .from("units")
        .update({ status: "rented" })
        .eq("id", data.unit_id);

      return lease;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({
        title: "Vertrag erstellt",
        description: "Der Mietvertrag wurde erfolgreich angelegt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Der Vertrag konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Update contract mutation
  const updateContract = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeaseFormData> }) => {
      const updateData: LeaseUpdate = {};
      
      if (data.start_date !== undefined) updateData.start_date = data.start_date;
      if (data.end_date !== undefined) updateData.end_date = data.end_date || null;
      if (data.rent_amount !== undefined) updateData.rent_amount = data.rent_amount;
      if (data.utility_advance !== undefined) updateData.utility_advance = data.utility_advance;
      if (data.deposit_amount !== undefined) updateData.deposit_amount = data.deposit_amount;
      if (data.deposit_paid !== undefined) updateData.deposit_paid = data.deposit_paid;
      if (data.payment_day !== undefined) updateData.payment_day = data.payment_day;

      const { data: lease, error } = await supabase
        .from("leases")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return lease;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: [CONTRACTS_KEY, "detail", id] });
      const previousContract = queryClient.getQueryData([CONTRACTS_KEY, "detail", id]);
      return { previousContract };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
      toast({
        title: "Vertrag aktualisiert",
        description: "Die Änderungen wurden gespeichert.",
      });
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousContract) {
        queryClient.setQueryData([CONTRACTS_KEY, "detail", id], context.previousContract);
      }
      toast({
        title: "Fehler",
        description: error.message || "Die Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Terminate contract mutation
  const terminateContract = useMutation({
    mutationFn: async ({ id, terminationDate }: { id: string; terminationDate: string }) => {
      // Get the contract to find the unit
      const { data: lease, error: fetchError } = await supabase
        .from("leases")
        .select("unit_id")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Update the lease
      const { data: updatedLease, error } = await supabase
        .from("leases")
        .update({
          is_active: false,
          end_date: terminationDate,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update unit status to vacant
      if (lease?.unit_id) {
        await supabase
          .from("units")
          .update({ status: "vacant" })
          .eq("id", lease.unit_id);
      }

      return updatedLease;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({
        title: "Vertrag gekündigt",
        description: "Der Mietvertrag wurde erfolgreich beendet.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Der Vertrag konnte nicht gekündigt werden.",
        variant: "destructive",
      });
    },
  });

  // Delete contract mutation
  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leases")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
      toast({
        title: "Vertrag gelöscht",
        description: "Der Mietvertrag wurde erfolgreich gelöscht.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Der Vertrag konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  return {
    useContractsList,
    useContract,
    createContract,
    updateContract,
    terminateContract,
    deleteContract,
  };
}
