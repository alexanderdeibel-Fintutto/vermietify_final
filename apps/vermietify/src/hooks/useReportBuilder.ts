import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ReportDefinition {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  report_type: "financial" | "occupancy" | "maintenance" | "tax" | "custom";
  config: {
    widgets?: ReportWidget[];
    filters?: Record<string, unknown>;
    date_range?: { from: string; to: string };
  };
  is_template: boolean;
  created_at: string;
}

export interface ReportWidget {
  id: string;
  type: "chart" | "table" | "kpi" | "text";
  title: string;
  data_source: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

export interface SavedReport {
  id: string;
  report_id: string | null;
  organization_id: string;
  name: string;
  generated_data: Record<string, unknown>;
  file_path: string | null;
  created_at: string;
}

export function useReportBuilder() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const reportsQuery = useQuery({
    queryKey: ["report-definitions", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_definitions")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ReportDefinition[];
    },
    enabled: !!orgId,
  });

  const savedReportsQuery = useQuery({
    queryKey: ["saved-reports", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_reports")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SavedReport[];
    },
    enabled: !!orgId,
  });

  const createReport = useMutation({
    mutationFn: async (input: Partial<ReportDefinition>) => {
      const { data, error } = await supabase
        .from("report_definitions")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-definitions"] });
      toast({ title: "Bericht erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const saveReport = useMutation({
    mutationFn: async (input: Partial<SavedReport>) => {
      const { data, error } = await supabase
        .from("saved_reports")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-reports"] });
      toast({ title: "Bericht gespeichert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return {
    reports: reportsQuery,
    savedReports: savedReportsQuery,
    createReport,
    saveReport,
  };
}
