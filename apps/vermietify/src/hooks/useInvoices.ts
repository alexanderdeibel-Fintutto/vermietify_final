import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  type: "incoming" | "outgoing";
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  recipient_name: string;
  recipient_address: string | null;
  issue_date: string;
  due_date: string | null;
  subtotal_cents: number;
  tax_rate: number;
  tax_cents: number;
  total_cents: number;
  paid_at: string | null;
  notes: string | null;
  building_id: string | null;
  unit_id: string | null;
  created_at: string;
  items?: InvoiceItem[];
  buildings?: { name: string };
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  tax_rate: number;
}

export function useInvoices() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const invoicesQuery = useQuery({
    queryKey: ["invoices", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, buildings(name)")
        .eq("organization_id", orgId!)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return (data || []) as Invoice[];
    },
    enabled: !!orgId,
  });

  const getInvoice = (id: string) =>
    useQuery({
      queryKey: ["invoice", id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("invoices")
          .select("*, buildings(name), invoice_items(*)")
          .eq("id", id)
          .single();
        if (error) throw error;
        return data as Invoice & { invoice_items: InvoiceItem[] };
      },
      enabled: !!id,
    });

  const createInvoice = useMutation({
    mutationFn: async (input: { invoice: Partial<Invoice>; items: Partial<InvoiceItem>[] }) => {
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .insert({ ...input.invoice, organization_id: orgId! })
        .select()
        .single();
      if (invErr) throw invErr;

      if (input.items.length > 0) {
        const { error: itemsErr } = await supabase
          .from("invoice_items")
          .insert(input.items.map((i) => ({ ...i, invoice_id: inv.id })));
        if (itemsErr) throw itemsErr;
      }
      return inv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Rechnung erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Rechnung aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  return { ...invoicesQuery, getInvoice, createInvoice, updateInvoice };
}
