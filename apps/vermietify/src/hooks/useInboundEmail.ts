import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface InboundEmailAddress {
  id: string;
  organization_id: string;
  email_prefix: string;
  full_address: string;
  is_active: boolean;
  allowed_senders: string[];
  created_at: string;
}

export interface InboundEmail {
  id: string;
  organization_id: string;
  from_email: string;
  subject: string | null;
  body_text: string | null;
  received_at: string;
  status: string;
  processing_result: any;
  matched_building_id: string | null;
  matched_cost_type_id: string | null;
  amount_cents: number | null;
  invoice_date: string | null;
  invoice_number: string | null;
  vendor_name: string | null;
  attachments: any[];
  review_notes: string | null;
  processed_at: string | null;
  created_at: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 30);
}

export function useInboundEmail() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const { data: emailAddress, isLoading: isLoadingAddress } = useQuery({
    queryKey: ["inbound-email-address", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inbound_email_addresses")
        .select("*")
        .eq("organization_id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data as InboundEmailAddress | null;
    },
    enabled: !!orgId,
  });

  const generateAddress = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Keine Organisation");

      // Get org name for prefix
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .single();

      const prefix = slugify(org?.name || "inbox");
      const domain = "inbox.vermietify.app";
      const fullAddress = `${prefix}@${domain}`;

      const { data, error } = await supabase
        .from("inbound_email_addresses")
        .insert({
          organization_id: orgId,
          email_prefix: prefix,
          full_address: fullAddress,
          is_active: true,
          allowed_senders: [],
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique constraint - add random suffix
          const suffix = Math.random().toString(36).substring(2, 6);
          const altPrefix = `${prefix}-${suffix}`;
          const altAddress = `${altPrefix}@${domain}`;

          const { data: retryData, error: retryError } = await supabase
            .from("inbound_email_addresses")
            .insert({
              organization_id: orgId,
              email_prefix: altPrefix,
              full_address: altAddress,
              is_active: true,
              allowed_senders: [],
            })
            .select()
            .single();

          if (retryError) throw retryError;
          return retryData;
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-email-address"] });
      toast({ title: "E-Mail-Adresse erstellt", description: "Ihre persönliche Empfangsadresse wurde generiert." });
    },
    onError: (e: any) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const updateAllowedSenders = useMutation({
    mutationFn: async (senders: string[]) => {
      if (!emailAddress?.id) throw new Error("Keine Adresse vorhanden");
      const { error } = await supabase
        .from("inbound_email_addresses")
        .update({ allowed_senders: senders })
        .eq("id", emailAddress.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-email-address"] });
      toast({ title: "Gespeichert", description: "Verifizierte Absender aktualisiert." });
    },
    onError: (e: any) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!emailAddress?.id) throw new Error("Keine Adresse");
      const { error } = await supabase
        .from("inbound_email_addresses")
        .update({ is_active: isActive })
        .eq("id", emailAddress.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-email-address"] });
    },
  });

  // Inbound emails queue
  const { data: emails, isLoading: isLoadingEmails } = useQuery({
    queryKey: ["inbound-emails", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inbound_emails")
        .select("*")
        .eq("organization_id", orgId!)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data as InboundEmail[];
    },
    enabled: !!orgId,
  });

  const updateEmailStatus = useMutation({
    mutationFn: async ({
      emailId,
      status,
      updates,
    }: {
      emailId: string;
      status: string;
      updates?: Partial<InboundEmail>;
    }) => {
      const { error } = await supabase
        .from("inbound_emails")
        .update({
          status,
          ...updates,
          processed_at: status === "processed" ? new Date().toISOString() : undefined,
        })
        .eq("id", emailId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-emails"] });
      toast({ title: "Aktualisiert" });
    },
    onError: (e: any) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  return {
    emailAddress,
    isLoadingAddress,
    generateAddress,
    updateAllowedSenders,
    toggleActive,
    emails: emails || [],
    isLoadingEmails,
    updateEmailStatus,
  };
}
