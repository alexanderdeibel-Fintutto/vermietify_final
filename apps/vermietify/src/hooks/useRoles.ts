import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Role {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  is_system_role: boolean;
  created_at: string;
  role_permissions?: { permission_id: string; permissions?: Permission }[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  organization_id: string;
  assigned_at: string;
  roles?: Role;
  profiles?: { first_name: string; last_name: string; email: string };
}

export function useRoles() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const rolesQuery = useQuery({
    queryKey: ["roles", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*, role_permissions(permission_id, permissions(*))")
        .or(`organization_id.eq.${orgId},is_system_role.eq.true`)
        .order("name");
      if (error) throw error;
      return (data || []) as Role[];
    },
    enabled: !!orgId,
  });

  const permissionsQuery = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("permissions").select("*").order("module, code");
      if (error) throw error;
      return (data || []) as Permission[];
    },
  });

  const userRolesQuery = useQuery({
    queryKey: ["user-roles", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*, roles(*), profiles(first_name, last_name)")
        .eq("organization_id", orgId!);
      if (error) throw error;
      return (data || []) as UserRole[];
    },
    enabled: !!orgId,
  });

  const createRole = useMutation({
    mutationFn: async (input: { name: string; description?: string; permissionIds: string[] }) => {
      const { data: role, error: roleErr } = await supabase
        .from("roles")
        .insert({ name: input.name, description: input.description, organization_id: orgId! })
        .select()
        .single();
      if (roleErr) throw roleErr;

      if (input.permissionIds.length > 0) {
        const { error: permErr } = await supabase
          .from("role_permissions")
          .insert(input.permissionIds.map((pid) => ({ role_id: role.id, permission_id: pid })));
        if (permErr) throw permErr;
      }
      return role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Rolle erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const assignRole = useMutation({
    mutationFn: async (input: { userId: string; roleId: string }) => {
      const { data, error } = await supabase
        .from("user_roles")
        .insert({ user_id: input.userId, role_id: input.roleId, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "Rolle zugewiesen" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { roles: rolesQuery, permissions: permissionsQuery, userRoles: userRolesQuery, createRole, assignRole };
}
