 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 export function useAdminData() {
   // System-wide statistics
   const useSystemStats = () => {
     return useQuery({
       queryKey: ["admin", "system-stats"],
       queryFn: async () => {
         const [profilesRes, orgsRes, buildingsRes, unitsRes, subsRes] = await Promise.all([
           supabase.from("profiles").select("id", { count: "exact", head: true }),
           supabase.from("organizations").select("id", { count: "exact", head: true }),
           supabase.from("buildings").select("id", { count: "exact", head: true }),
           supabase.from("units").select("id", { count: "exact", head: true }),
           supabase.from("user_subscriptions").select("id", { count: "exact", head: true }).neq("plan_id", "free"),
         ]);
 
         return {
           totalUsers: profilesRes.count || 0,
           totalOrgs: orgsRes.count || 0,
           totalBuildings: buildingsRes.count || 0,
           totalUnits: unitsRes.count || 0,
           activeSubscriptions: subsRes.count || 0,
         };
       },
     });
   };
 
   // Recent users
   const useRecentUsers = (limit = 5) => {
     return useQuery({
       queryKey: ["admin", "recent-users", limit],
       queryFn: async () => {
         const { data, error } = await supabase
           .from("profiles")
           .select("*, organizations(name)")
           .order("created_at", { ascending: false })
           .limit(limit);
 
         if (error) throw error;
         return data || [];
       },
     });
   };
 
   // Recent buildings
   const useRecentBuildings = (limit = 5) => {
     return useQuery({
       queryKey: ["admin", "recent-buildings", limit],
       queryFn: async () => {
         const { data, error } = await supabase
           .from("buildings")
           .select("*, organizations(name)")
           .order("created_at", { ascending: false })
           .limit(limit);
 
         if (error) throw error;
         return data || [];
       },
     });
   };
 
   // All users for management
   const useAllUsers = () => {
     return useQuery({
       queryKey: ["admin", "all-users"],
       queryFn: async () => {
         const { data, error } = await supabase
           .from("profiles")
           .select("*, organizations(name), user_roles(role)")
           .order("created_at", { ascending: false });
 
         if (error) throw error;
         return data || [];
       },
     });
   };
 
   // All organizations
   const useAllOrganizations = () => {
     return useQuery({
       queryKey: ["admin", "all-organizations"],
       queryFn: async () => {
         const { data, error } = await supabase
           .from("organizations")
           .select(`
             *,
             profiles(id),
             buildings(id)
           `)
           .order("created_at", { ascending: false });
 
         if (error) throw error;
         return data?.map((org) => ({
           ...org,
           userCount: org.profiles?.length || 0,
           buildingCount: org.buildings?.length || 0,
         })) || [];
       },
     });
   };
 
   return {
     useSystemStats,
     useRecentUsers,
     useRecentBuildings,
     useAllUsers,
     useAllOrganizations,
   };
 }