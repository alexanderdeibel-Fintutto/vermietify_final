import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ComplianceCheck {
  id: string;
  organization_id: string;
  check_type: string;
  category: "dsgvo" | "tax" | "building" | "contract" | "energy" | "fire_safety" | "accessibility";
  status: "pending" | "passed" | "warning" | "failed" | "not_applicable";
  description: string;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  building_id: string | null;
  created_at: string;
  buildings?: { name: string };
}

export interface ComplianceRule {
  id: string;
  country: string;
  category: string;
  rule_name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  is_active: boolean;
}

export function useCompliance() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const checksQuery = useQuery({
    queryKey: ["compliance-checks", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_checks")
        .select("*, buildings(name)")
        .eq("organization_id", orgId!)
        .order("due_date");
      if (error) throw error;
      return (data || []) as ComplianceCheck[];
    },
    enabled: !!orgId,
  });

  const rulesQuery = useQuery({
    queryKey: ["compliance-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_rules")
        .select("*")
        .eq("is_active", true)
        .order("severity");
      if (error) throw error;
      return (data || []) as ComplianceRule[];
    },
  });

  const createCheck = useMutation({
    mutationFn: async (input: Partial<ComplianceCheck>) => {
      const { data, error } = await supabase
        .from("compliance_checks")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-checks"] });
      toast({ title: "Prüfung erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const updateCheck = useMutation({
    mutationFn: async ({ id, ...input }: Partial<ComplianceCheck> & { id: string }) => {
      const { data, error } = await supabase
        .from("compliance_checks")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-checks"] });
      toast({ title: "Prüfung aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const complianceScore = (checks: ComplianceCheck[]) => {
    if (checks.length === 0) return 100;
    const applicable = checks.filter((c) => c.status !== "not_applicable");
    if (applicable.length === 0) return 100;
    const passed = applicable.filter((c) => c.status === "passed").length;
    return Math.round((passed / applicable.length) * 100);
  };

  return { checks: checksQuery, rules: rulesQuery, createCheck, updateCheck, complianceScore };
}
