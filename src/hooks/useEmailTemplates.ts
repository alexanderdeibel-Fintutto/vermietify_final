import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const EMAIL_CATEGORIES = {
  contract: "Mietvertrag",
  payment: "Zahlung",
  operating_costs: "Betriebskosten",
  maintenance: "Wartung",
  general: "Allgemein",
} as const;

export type EmailCategory = keyof typeof EMAIL_CATEGORIES;

export const PLACEHOLDERS = [
  { key: "{{mieter.anrede}}", label: "Anrede (Herr/Frau)", group: "Mieter" },
  { key: "{{mieter.name}}", label: "Vor- und Nachname", group: "Mieter" },
  { key: "{{mieter.vorname}}", label: "Vorname", group: "Mieter" },
  { key: "{{einheit.name}}", label: "Wohnungsbezeichnung", group: "Einheit" },
  { key: "{{einheit.adresse}}", label: "Vollständige Adresse", group: "Einheit" },
  { key: "{{gebaeude.name}}", label: "Gebäudename", group: "Gebäude" },
  { key: "{{vertrag.miete}}", label: "Aktuelle Miete", group: "Vertrag" },
  { key: "{{vertrag.beginn}}", label: "Mietbeginn", group: "Vertrag" },
  { key: "{{zahlung.betrag}}", label: "Zahlungsbetrag", group: "Zahlung" },
  { key: "{{zahlung.faellig}}", label: "Fälligkeitsdatum", group: "Zahlung" },
  { key: "{{abrechnung.zeitraum}}", label: "Abrechnungszeitraum", group: "Abrechnung" },
  { key: "{{abrechnung.ergebnis}}", label: "Guthaben/Nachzahlung", group: "Abrechnung" },
  { key: "{{vermieter.name}}", label: "Vermieter-Name", group: "Vermieter" },
  { key: "{{vermieter.firma}}", label: "Firma", group: "Vermieter" },
  { key: "{{datum.heute}}", label: "Aktuelles Datum", group: "Datum" },
];

export interface EmailTemplate {
  id: string;
  organization_id: string | null;
  name: string;
  category: EmailCategory;
  subject: string;
  body_html: string;
  default_attachments: { name: string; url: string }[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  organization_id: string;
  template_id: string | null;
  recipient_email: string;
  recipient_tenant_id: string | null;
  subject: string;
  body_html: string;
  attachments: { name: string; url: string }[];
  status: "queued" | "sent" | "delivered" | "opened" | "failed";
  sent_at: string | null;
  opened_at: string | null;
  scheduled_for: string | null;
  error_message: string | null;
  created_at: string;
  tenant?: { id: string; first_name: string; last_name: string; email: string } | null;
  template?: { id: string; name: string } | null;
}

export interface CreateTemplateInput {
  name: string;
  category: EmailCategory;
  subject: string;
  body_html: string;
  default_attachments?: { name: string; url: string }[];
}

export interface SendEmailInput {
  templateId?: string;
  recipientIds: string[];
  subject: string;
  body_html: string;
  attachments?: { name: string; url: string }[];
  scheduledFor?: string;
}

export function useEmailTemplates() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = profile?.organization_id;

  // Fetch all templates (system + org)
  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: ["email-templates", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .or(`organization_id.eq.${organizationId},is_system.eq.true`)
        .order("is_system", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as EmailTemplate[];
    },
    enabled: !!organizationId,
  });

  // Fetch email logs
  const {
    data: emailLogs = [],
    isLoading: logsLoading,
  } = useQuery({
    queryKey: ["email-logs", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("email_log")
        .select(`
          *,
          tenant:tenants(id, first_name, last_name, email),
          template:email_templates(id, name)
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as EmailLog[];
    },
    enabled: !!organizationId,
  });

  // Create template
  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      if (!organizationId) throw new Error("Keine Organisation");
      const { data, error } = await supabase
        .from("email_templates")
        .insert({
          organization_id: organizationId,
          name: input.name,
          category: input.category,
          subject: input.subject,
          body_html: input.body_html,
          default_attachments: input.default_attachments || [],
          is_system: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Vorlage erstellt" });
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Update template
  const updateTemplate = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateTemplateInput> }) => {
      const { data, error } = await supabase
        .from("email_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Vorlage aktualisiert" });
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Vorlage gelöscht" });
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Duplicate template
  const duplicateTemplate = useMutation({
    mutationFn: async (id: string) => {
      const template = templates.find((t) => t.id === id);
      if (!template) throw new Error("Vorlage nicht gefunden");
      if (!organizationId) throw new Error("Keine Organisation");

      const { data, error } = await supabase
        .from("email_templates")
        .insert({
          organization_id: organizationId,
          name: `${template.name} (Kopie)`,
          category: template.category,
          subject: template.subject,
          body_html: template.body_html,
          default_attachments: template.default_attachments,
          is_system: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Vorlage dupliziert" });
    },
    onError: (error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Send email via edge function
  const sendEmail = useMutation({
    mutationFn: async (input: SendEmailInput) => {
      if (!organizationId) throw new Error("Keine Organisation");

      const response = await supabase.functions.invoke("send-tenant-email", {
        body: {
          organizationId,
          templateId: input.templateId,
          recipientIds: input.recipientIds,
          subject: input.subject,
          bodyHtml: input.body_html,
          attachments: input.attachments,
          scheduledFor: input.scheduledFor,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || "Fehler beim Senden");

      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
      const count = variables.recipientIds.length;
      toast({ 
        title: variables.scheduledFor ? "E-Mails geplant" : "E-Mails gesendet",
        description: `${count} E-Mail${count > 1 ? "s" : ""} ${variables.scheduledFor ? "geplant" : "gesendet"}`,
      });
    },
    onError: (error) => {
      toast({ title: "Fehler beim Senden", description: error.message, variant: "destructive" });
    },
  });

  // Replace placeholders in text
  const replacePlaceholders = (
    text: string,
    data: {
      tenant?: { first_name?: string; last_name?: string; salutation?: string };
      unit?: { unit_number?: string; address?: string };
      building?: { name?: string; address?: string };
      lease?: { rent_amount?: number; start_date?: string };
      payment?: { amount?: number; due_date?: string };
      billing?: { period?: string; result?: string };
      landlord?: { name?: string; company?: string };
    }
  ): string => {
    let result = text;

    // Mieter
    if (data.tenant) {
      result = result.replace(/\{\{mieter\.anrede\}\}/g, data.tenant.salutation || "");
      result = result.replace(/\{\{mieter\.name\}\}/g, `${data.tenant.first_name || ""} ${data.tenant.last_name || ""}`.trim());
      result = result.replace(/\{\{mieter\.vorname\}\}/g, data.tenant.first_name || "");
    }

    // Einheit
    if (data.unit) {
      result = result.replace(/\{\{einheit\.name\}\}/g, data.unit.unit_number || "");
      result = result.replace(/\{\{einheit\.adresse\}\}/g, data.unit.address || "");
    }

    // Gebäude
    if (data.building) {
      result = result.replace(/\{\{gebaeude\.name\}\}/g, data.building.name || "");
    }

    // Vertrag
    if (data.lease) {
      result = result.replace(/\{\{vertrag\.miete\}\}/g, 
        data.lease.rent_amount 
          ? (data.lease.rent_amount / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })
          : ""
      );
      result = result.replace(/\{\{vertrag\.beginn\}\}/g, 
        data.lease.start_date 
          ? new Date(data.lease.start_date).toLocaleDateString("de-DE")
          : ""
      );
    }

    // Zahlung
    if (data.payment) {
      result = result.replace(/\{\{zahlung\.betrag\}\}/g, 
        data.payment.amount 
          ? (data.payment.amount / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })
          : ""
      );
      result = result.replace(/\{\{zahlung\.faellig\}\}/g, 
        data.payment.due_date 
          ? new Date(data.payment.due_date).toLocaleDateString("de-DE")
          : ""
      );
    }

    // Abrechnung
    if (data.billing) {
      result = result.replace(/\{\{abrechnung\.zeitraum\}\}/g, data.billing.period || "");
      result = result.replace(/\{\{abrechnung\.ergebnis\}\}/g, data.billing.result || "");
    }

    // Vermieter
    if (data.landlord) {
      result = result.replace(/\{\{vermieter\.name\}\}/g, data.landlord.name || "");
      result = result.replace(/\{\{vermieter\.firma\}\}/g, data.landlord.company || "");
    }

    // Datum
    result = result.replace(/\{\{datum\.heute\}\}/g, new Date().toLocaleDateString("de-DE"));

    return result;
  };

  // Get templates by type
  const systemTemplates = templates.filter((t) => t.is_system);
  const userTemplates = templates.filter((t) => !t.is_system);

  // Stats
  const stats = {
    totalTemplates: templates.length,
    userTemplates: userTemplates.length,
    systemTemplates: systemTemplates.length,
    totalSent: emailLogs.filter((l) => l.status === "sent" || l.status === "delivered" || l.status === "opened").length,
    queued: emailLogs.filter((l) => l.status === "queued").length,
    failed: emailLogs.filter((l) => l.status === "failed").length,
  };

  return {
    templates,
    systemTemplates,
    userTemplates,
    templatesLoading,
    templatesError,
    emailLogs,
    logsLoading,
    stats,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    sendEmail,
    replacePlaceholders,
  };
}
