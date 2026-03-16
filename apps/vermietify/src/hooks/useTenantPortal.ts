 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 
 export function useTenantPortal() {
   const { user } = useAuth();
 
   // Check if current user is a tenant
   const useIsTenant = () => {
     return useQuery({
       queryKey: ["tenant-role", user?.id],
       queryFn: async () => {
         if (!user) return false;
         
         const { data, error } = await supabase
           .from("user_roles")
           .select("role")
           .eq("user_id", user.id)
           .eq("role", "tenant")
           .maybeSingle();
         
         if (error) {
           console.error("Error checking tenant role:", error);
           return false;
         }
         
         return !!data;
       },
       enabled: !!user,
     });
   };
 
   // Get tenant's unit access
   const useTenantAccess = () => {
     return useQuery({
       queryKey: ["tenant-access", user?.id],
       queryFn: async () => {
         if (!user) return null;
         
         const { data, error } = await supabase
           .from("tenant_unit_access")
           .select(`
             *,
             tenant:tenants(*),
             unit:units(
               *,
               building:buildings(*)
             ),
             lease:leases(*)
           `)
           .eq("tenant_user_id", user.id)
           .maybeSingle();
         
         if (error) {
           console.error("Error fetching tenant access:", error);
           return null;
         }
         
         return data;
       },
       enabled: !!user,
     });
   };
 
   // Get tenant's meters
   const useTenantMeters = () => {
     return useQuery({
       queryKey: ["tenant-meters", user?.id],
       queryFn: async () => {
         if (!user) return [];
         
         const { data: access } = await supabase
           .from("tenant_unit_access")
           .select("unit_id")
           .eq("tenant_user_id", user.id)
           .maybeSingle();
         
         if (!access?.unit_id) return [];
         
         const { data, error } = await supabase
           .from("meters")
           .select(`
             *,
             meter_readings(*)
           `)
           .eq("unit_id", access.unit_id)
           .order("meter_type");
         
         if (error) throw error;
         return data || [];
       },
       enabled: !!user,
     });
   };
 
   // Get tenant's documents
   const useTenantDocuments = () => {
     return useQuery({
       queryKey: ["tenant-documents", user?.id],
       queryFn: async () => {
         if (!user) return [];
         
         const { data: access } = await supabase
           .from("tenant_unit_access")
           .select("tenant_id")
           .eq("tenant_user_id", user.id)
           .maybeSingle();
         
         if (!access?.tenant_id) return [];
         
         const { data, error } = await supabase
           .from("documents")
           .select("*")
           .eq("tenant_id", access.tenant_id)
           .order("created_at", { ascending: false });
         
         if (error) throw error;
         return data || [];
       },
       enabled: !!user,
     });
   };
 
   // Get tenant's tasks
   const useTenantTasks = () => {
     return useQuery({
       queryKey: ["tenant-tasks", user?.id],
       queryFn: async () => {
         if (!user) return [];
         
         const { data, error } = await supabase
           .from("tasks")
           .select(`
             *,
             buildings(name),
             units(unit_number)
           `)
           .eq("created_by", user.id)
           .order("created_at", { ascending: false });
         
         if (error) throw error;
         return data || [];
       },
       enabled: !!user,
     });
   };
 
   // Get tenant's document requests
   const useTenantDocumentRequests = () => {
     return useQuery({
       queryKey: ["tenant-document-requests", user?.id],
       queryFn: async () => {
         if (!user) return [];
         
         const { data, error } = await supabase
           .from("document_requests")
           .select("*")
           .eq("tenant_user_id", user.id)
           .order("created_at", { ascending: false });
         
         if (error) throw error;
         return data || [];
       },
       enabled: !!user,
     });
   };
 
   return {
     useIsTenant,
     useTenantAccess,
     useTenantMeters,
     useTenantDocuments,
     useTenantTasks,
     useTenantDocumentRequests,
   };
 }