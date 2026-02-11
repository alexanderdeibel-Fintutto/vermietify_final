 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import type { TenantFormData } from "@/types/database";
 import type { Database } from "@/integrations/supabase/types";
 
 type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];
 type TenantInsert = Database["public"]["Tables"]["tenants"]["Insert"];
 type TenantUpdate = Database["public"]["Tables"]["tenants"]["Update"];
 
 const TENANTS_KEY = "tenants";
 
 export function useTenants() {
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   // Fetch all tenants
   const useTenantsList = () => {
     return useQuery({
       queryKey: [TENANTS_KEY, "list"],
       queryFn: async () => {
         const { data, error } = await supabase
           .from("tenants")
           .select(`
             *,
             leases(
               id,
               is_active,
               start_date,
               rent_amount,
               units(
                 id,
                 unit_number,
                 buildings(id, name, address, city)
               )
             )
           `)
           .order("last_name", { ascending: true });
 
         if (error) throw error;
         return data;
       },
     });
   };
 
   // Fetch single tenant with full details
   const useTenant = (id: string | undefined) => {
     return useQuery({
       queryKey: [TENANTS_KEY, "detail", id],
       queryFn: async () => {
         if (!id) throw new Error("Tenant ID required");
 
         const { data: tenant, error: tenantError } = await supabase
           .from("tenants")
           .select("*")
           .eq("id", id)
           .maybeSingle();
 
         if (tenantError) throw tenantError;
         if (!tenant) throw new Error("Mieter nicht gefunden");
 
         const { data: activeLease } = await supabase
           .from("leases")
           .select(`
             *,
             units(
               id,
               unit_number,
               area,
               rooms,
               floor,
               buildings(id, name, address, city, postal_code)
             )
           `)
           .eq("tenant_id", id)
           .eq("is_active", true)
           .maybeSingle();
 
         const { data: allLeases } = await supabase
           .from("leases")
           .select(`
             *,
             units(
               id,
               unit_number,
               buildings(id, name)
             )
           `)
           .eq("tenant_id", id)
           .order("start_date", { ascending: false });
 
         const { data: documents } = await supabase
           .from("documents")
           .select("*")
           .eq("tenant_id", id)
           .order("created_at", { ascending: false });
 
         const { data: messages } = await supabase
           .from("messages")
           .select("*")
           .eq("tenant_id", id)
           .order("created_at", { ascending: false });
 
         let status: "active" | "terminated" | "former" = "former";
         if (activeLease) {
           status = activeLease.end_date ? "terminated" : "active";
         }
 
         return {
           ...tenant,
           status,
           activeLease,
           allLeases: allLeases || [],
           documents: documents || [],
           messages: messages || [],
         };
       },
       enabled: !!id,
     });
   };
 
   const createTenant = useMutation({
     mutationFn: async (data: TenantFormData & { organization_id: string }) => {
        const insertData: TenantInsert = {
          organization_id: data.organization_id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          postal_code: data.postal_code || null,
          birth_date: data.birth_date || null,
          household_size: data.household_size || null,
          previous_landlord: data.previous_landlord || null,
          notes: data.notes || null,
        };
 
       const { data: tenant, error } = await supabase
         .from("tenants")
         .insert(insertData)
         .select()
         .single();
 
       if (error) throw error;
       return tenant;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: [TENANTS_KEY] });
       toast({
         title: "Mieter erstellt",
         description: "Der Mieter wurde erfolgreich angelegt.",
       });
     },
     onError: (error: Error) => {
       toast({
         title: "Fehler",
         description: error.message || "Der Mieter konnte nicht erstellt werden.",
         variant: "destructive",
       });
     },
   });
 
   const updateTenant = useMutation({
     mutationFn: async ({ id, data }: { id: string; data: Partial<TenantFormData> }) => {
       const updateData: TenantUpdate = {};
       
       if (data.first_name !== undefined) updateData.first_name = data.first_name;
       if (data.last_name !== undefined) updateData.last_name = data.last_name;
       if (data.email !== undefined) updateData.email = data.email || null;
       if (data.phone !== undefined) updateData.phone = data.phone || null;
       if (data.address !== undefined) updateData.address = data.address || null;
       if (data.city !== undefined) updateData.city = data.city || null;
       if (data.postal_code !== undefined) updateData.postal_code = data.postal_code || null;
       if (data.notes !== undefined) updateData.notes = data.notes || null;
 
       const { data: tenant, error } = await supabase
         .from("tenants")
         .update(updateData)
         .eq("id", id)
         .select()
         .single();
 
       if (error) throw error;
       return tenant;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: [TENANTS_KEY] });
       toast({
         title: "Mieter aktualisiert",
         description: "Die Änderungen wurden gespeichert.",
       });
     },
     onError: (error: Error) => {
       toast({
         title: "Fehler",
         description: error.message || "Die Änderungen konnten nicht gespeichert werden.",
         variant: "destructive",
       });
     },
   });
 
   const deleteTenant = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("tenants")
         .delete()
         .eq("id", id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: [TENANTS_KEY] });
       toast({
         title: "Mieter gelöscht",
         description: "Der Mieter wurde erfolgreich gelöscht.",
       });
     },
     onError: (error: Error) => {
       toast({
         title: "Fehler",
         description: error.message || "Der Mieter konnte nicht gelöscht werden.",
         variant: "destructive",
       });
     },
   });
 
   return {
     useTenantsList,
     useTenant,
     createTenant,
     updateTenant,
     deleteTenant,
   };
 }