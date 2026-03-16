import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface TaxDeadline {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  deadline_date: string;
  country: string;
  form_type: string | null;
  status: "upcoming" | "due_soon" | "overdue" | "completed";
  reminder_sent: boolean;
  created_at: string;
}

const DEFAULT_DEADLINES_DE = [
  { title: "Einkommensteuererklärung (ohne Berater)", deadline_month: 7, deadline_day: 31, form_type: "est" },
  { title: "Einkommensteuererklärung (mit Berater)", deadline_month: 2, deadline_day: 28, form_type: "est", next_year: true },
  { title: "Grundsteuererklärung", deadline_month: 1, deadline_day: 31, form_type: "grundsteuer" },
  { title: "USt-Voranmeldung Q1", deadline_month: 4, deadline_day: 10, form_type: "ust" },
  { title: "USt-Voranmeldung Q2", deadline_month: 7, deadline_day: 10, form_type: "ust" },
  { title: "USt-Voranmeldung Q3", deadline_month: 10, deadline_day: 10, form_type: "ust" },
  { title: "USt-Voranmeldung Q4", deadline_month: 1, deadline_day: 10, form_type: "ust", next_year: true },
  { title: "Betriebskostenabrechnung", deadline_month: 12, deadline_day: 31, form_type: "bk" },
];

export { DEFAULT_DEADLINES_DE };

export function useTaxDeadlines(year?: number) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const deadlinesQuery = useQuery({
    queryKey: ["tax-deadlines", orgId, year],
    queryFn: async () => {
      let query = supabase
        .from("tax_deadlines")
        .select("*")
        .eq("organization_id", orgId!)
        .order("deadline_date");

      if (year) {
        query = query.gte("deadline_date", `${year}-01-01`).lte("deadline_date", `${year}-12-31`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TaxDeadline[];
    },
    enabled: !!orgId,
  });

  const createDeadline = useMutation({
    mutationFn: async (input: Partial<TaxDeadline>) => {
      const { data, error } = await supabase
        .from("tax_deadlines")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-deadlines"] });
      toast({ title: "Frist erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const updateDeadline = useMutation({
    mutationFn: async ({ id, ...input }: Partial<TaxDeadline> & { id: string }) => {
      const { data, error } = await supabase
        .from("tax_deadlines")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-deadlines"] });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...deadlinesQuery, createDeadline, updateDeadline };
}
