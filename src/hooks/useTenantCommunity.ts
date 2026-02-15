import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface CommunityPost {
  id: string;
  organization_id: string;
  building_id: string;
  author_tenant_id: string | null;
  author_name: string;
  title: string;
  content: string;
  category: "general" | "marketplace" | "events" | "help" | "announcement";
  is_pinned: boolean;
  likes_count: number;
  created_at: string;
  tenant_community_comments?: CommunityComment[];
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_tenant_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
}

export function useTenantCommunity(buildingId?: string) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const postsQuery = useQuery({
    queryKey: ["community-posts", orgId, buildingId],
    queryFn: async () => {
      let query = supabase
        .from("tenant_community_posts")
        .select("*, tenant_community_comments(*)")
        .eq("organization_id", orgId!)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (buildingId) query = query.eq("building_id", buildingId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CommunityPost[];
    },
    enabled: !!orgId,
  });

  const createPost = useMutation({
    mutationFn: async (input: Partial<CommunityPost>) => {
      const { data, error } = await supabase
        .from("tenant_community_posts")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts", orgId] });
      toast({ title: "Beitrag veröffentlicht" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const addComment = useMutation({
    mutationFn: async (input: Partial<CommunityComment>) => {
      const { data, error } = await supabase
        .from("tenant_community_comments")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts", orgId] });
      toast({ title: "Kommentar hinzugefügt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...postsQuery, createPost, addComment };
}
