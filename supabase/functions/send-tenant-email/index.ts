import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  organizationId: string;
  templateId?: string;
  recipientIds: string[];
  subject: string;
  bodyHtml: string;
  attachments?: { name: string; url: string }[];
  scheduledFor?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Nicht authentifiziert");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      throw new Error("Authentifizierung fehlgeschlagen");
    }

    const body: SendEmailRequest = await req.json();
    const {
      organizationId,
      templateId,
      recipientIds,
      subject,
      bodyHtml,
      attachments,
      scheduledFor,
    } = body;

    if (!recipientIds || recipientIds.length === 0) {
      throw new Error("Keine Empfänger angegeben");
    }

    // Get tenant details
    const { data: tenants, error: tenantsError } = await supabaseClient
      .from("tenants")
      .select(`
        id,
        first_name,
        last_name,
        email,
        salutation,
        leases(
          rent_amount,
          start_date,
          unit:units(
            unit_number,
            building:buildings(name, address, city)
          )
        )
      `)
      .in("id", recipientIds);

    if (tenantsError) throw tenantsError;

    // Get organization details for landlord placeholders
    const { data: org } = await supabaseClient
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();

    const results = [];

    for (const tenant of tenants || []) {
      if (!tenant.email) continue;

      // Replace placeholders
      let personalizedSubject = subject;
      let personalizedBody = bodyHtml;

      const lease = tenant.leases?.[0];
      const unit = lease?.unit;
      const building = unit?.building;

      // Mieter placeholders
      personalizedSubject = personalizedSubject
        .replace(/\{\{mieter\.anrede\}\}/g, tenant.salutation || "")
        .replace(/\{\{mieter\.name\}\}/g, `${tenant.first_name} ${tenant.last_name}`)
        .replace(/\{\{mieter\.vorname\}\}/g, tenant.first_name || "");

      personalizedBody = personalizedBody
        .replace(/\{\{mieter\.anrede\}\}/g, tenant.salutation || "")
        .replace(/\{\{mieter\.name\}\}/g, `${tenant.first_name} ${tenant.last_name}`)
        .replace(/\{\{mieter\.vorname\}\}/g, tenant.first_name || "");

      // Einheit placeholders
      if (unit) {
        personalizedSubject = personalizedSubject
          .replace(/\{\{einheit\.name\}\}/g, unit.unit_number || "");
        personalizedBody = personalizedBody
          .replace(/\{\{einheit\.name\}\}/g, unit.unit_number || "")
          .replace(/\{\{einheit\.adresse\}\}/g, building ? `${building.address}, ${building.city}` : "");
      }

      // Gebäude placeholders
      if (building) {
        personalizedSubject = personalizedSubject
          .replace(/\{\{gebaeude\.name\}\}/g, building.name || "");
        personalizedBody = personalizedBody
          .replace(/\{\{gebaeude\.name\}\}/g, building.name || "");
      }

      // Vertrag placeholders
      if (lease) {
        const rentFormatted = lease.rent_amount
          ? (lease.rent_amount / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })
          : "";
        const startFormatted = lease.start_date
          ? new Date(lease.start_date).toLocaleDateString("de-DE")
          : "";

        personalizedSubject = personalizedSubject
          .replace(/\{\{vertrag\.miete\}\}/g, rentFormatted)
          .replace(/\{\{vertrag\.beginn\}\}/g, startFormatted);
        personalizedBody = personalizedBody
          .replace(/\{\{vertrag\.miete\}\}/g, rentFormatted)
          .replace(/\{\{vertrag\.beginn\}\}/g, startFormatted);
      }

      // Vermieter placeholders
      personalizedSubject = personalizedSubject
        .replace(/\{\{vermieter\.name\}\}/g, org?.name || "")
        .replace(/\{\{vermieter\.firma\}\}/g, org?.name || "");
      personalizedBody = personalizedBody
        .replace(/\{\{vermieter\.name\}\}/g, org?.name || "")
        .replace(/\{\{vermieter\.firma\}\}/g, org?.name || "");

      // Datum placeholders
      const today = new Date().toLocaleDateString("de-DE");
      personalizedSubject = personalizedSubject.replace(/\{\{datum\.heute\}\}/g, today);
      personalizedBody = personalizedBody.replace(/\{\{datum\.heute\}\}/g, today);

      // Create email log entry
      const { data: emailLog, error: logError } = await supabaseClient
        .from("email_log")
        .insert({
          organization_id: organizationId,
          template_id: templateId || null,
          recipient_email: tenant.email,
          recipient_tenant_id: tenant.id,
          subject: personalizedSubject,
          body_html: personalizedBody,
          attachments: attachments || [],
          status: scheduledFor ? "queued" : "sent",
          scheduled_for: scheduledFor || null,
          sent_at: scheduledFor ? null : new Date().toISOString(),
        })
        .select()
        .single();

      if (logError) {
        console.error("Error creating email log:", logError);
        results.push({ tenantId: tenant.id, success: false, error: logError.message });
        continue;
      }

      // Here you would integrate with an email service like Resend, SendGrid, etc.
      // For now, we just log it and mark as sent
      console.log(`Email queued for ${tenant.email}: ${personalizedSubject}`);

      results.push({
        tenantId: tenant.id,
        email: tenant.email,
        success: true,
        logId: emailLog.id,
      });
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successCount} E-Mail(s) ${scheduledFor ? "geplant" : "gesendet"}, ${failCount} fehlgeschlagen`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-tenant-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
