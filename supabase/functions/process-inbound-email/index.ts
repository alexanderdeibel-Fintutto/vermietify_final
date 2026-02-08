import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { from, to, subject, text, html, attachments } = body;

    // Extract the prefix from the "to" address
    const toAddress = (Array.isArray(to) ? to[0] : to)?.toLowerCase();
    if (!toAddress) {
      throw new Error("Keine Empfängeradresse gefunden");
    }

    // Find the org by inbound address
    const { data: inboundAddr, error: addrError } = await supabase
      .from("inbound_email_addresses")
      .select("organization_id, allowed_senders, is_active")
      .eq("full_address", toAddress)
      .single();

    if (addrError || !inboundAddr) {
      console.error("Unknown inbound address:", toAddress);
      return new Response(
        JSON.stringify({ success: false, error: "Unbekannte E-Mail-Adresse" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!inboundAddr.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: "E-Mail-Adresse ist deaktiviert" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const senderEmail = (typeof from === "string" ? from : from?.address || from?.email || "")?.toLowerCase();

    // Check allowed senders
    if (inboundAddr.allowed_senders && inboundAddr.allowed_senders.length > 0) {
      const isAllowed = inboundAddr.allowed_senders.some(
        (s: string) => senderEmail.includes(s.toLowerCase())
      );
      if (!isAllowed) {
        // Store as rejected
        await supabase.from("inbound_emails").insert({
          organization_id: inboundAddr.organization_id,
          from_email: senderEmail,
          subject: subject || "(Kein Betreff)",
          body_text: text || "",
          status: "rejected",
          review_notes: "Absender nicht in der Liste verifizierter Adressen",
          attachments: [],
        });

        return new Response(
          JSON.stringify({ success: false, error: "Absender nicht autorisiert" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Process attachments - store PDFs in storage
    const storedAttachments = [];
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (!att.content) continue;

        const fileName = att.filename || `attachment-${Date.now()}.pdf`;
        const filePath = `${inboundAddr.organization_id}/${Date.now()}-${fileName}`;

        // Decode base64 content
        const binaryContent = Uint8Array.from(atob(att.content), (c) => c.charCodeAt(0));

        const { error: uploadError } = await supabase.storage
          .from("inbound-attachments")
          .upload(filePath, binaryContent, {
            contentType: att.contentType || "application/pdf",
          });

        if (!uploadError) {
          storedAttachments.push({
            name: fileName,
            path: filePath,
            size: binaryContent.length,
            contentType: att.contentType || "application/pdf",
          });
        } else {
          console.error("Upload error:", uploadError);
        }
      }
    }

    // Create the inbound email entry
    const { data: emailEntry, error: insertError } = await supabase
      .from("inbound_emails")
      .insert({
        organization_id: inboundAddr.organization_id,
        from_email: senderEmail,
        subject: subject || "(Kein Betreff)",
        body_text: text || "",
        status: "pending",
        attachments: storedAttachments,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // If there are PDF attachments, try AI extraction
    if (storedAttachments.length > 0) {
      try {
        await processWithAI(supabase, emailEntry.id, inboundAddr.organization_id, storedAttachments, subject, text);
      } catch (aiError) {
        console.error("AI processing failed, marking for review:", aiError);
        await supabase
          .from("inbound_emails")
          .update({
            status: "needs_review",
            review_notes: "Automatische Verarbeitung fehlgeschlagen. Bitte manuell prüfen.",
          })
          .eq("id", emailEntry.id);
      }
    } else {
      // No attachments - mark for review
      await supabase
        .from("inbound_emails")
        .update({
          status: "needs_review",
          review_notes: "Keine PDF-Anhänge gefunden. Bitte manuell prüfen.",
        })
        .eq("id", emailEntry.id);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailEntry.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing inbound email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processWithAI(
  supabase: any,
  emailId: string,
  organizationId: string,
  attachments: any[],
  subject: string | null,
  bodyText: string | null
) {
  // Get existing buildings and cost types for matching
  const [{ data: buildings }, { data: costTypes }] = await Promise.all([
    supabase.from("buildings").select("id, name, address").eq("organization_id", organizationId),
    supabase.from("cost_types").select("id, name, category").or(`organization_id.eq.${organizationId},is_system.eq.true`),
  ]);

  const prompt = `Du bist ein Assistent für Immobilienverwaltung. Analysiere die folgende eingehende E-Mail und extrahiere Rechnungsdaten für die Betriebskostenabrechnung.

E-Mail-Betreff: ${subject || "Kein Betreff"}
E-Mail-Text: ${bodyText || "Kein Text"}
Anzahl Anhänge: ${attachments.length} (${attachments.map((a: any) => a.name).join(", ")})

Verfügbare Gebäude:
${(buildings || []).map((b: any) => `- ${b.name} (${b.address}), ID: ${b.id}`).join("\n")}

Verfügbare Kostenarten:
${(costTypes || []).map((c: any) => `- ${c.name} (${c.category}), ID: ${c.id}`).join("\n")}

Extrahiere folgende Informationen als JSON:
{
  "vendor_name": "Name des Rechnungsstellers",
  "invoice_number": "Rechnungsnummer",
  "invoice_date": "YYYY-MM-DD",
  "amount_cents": 12345,
  "matched_building_id": "UUID oder null",
  "matched_cost_type_id": "UUID oder null",
  "confidence": "high" | "medium" | "low",
  "notes": "Erklärung zur Zuordnung"
}

Wenn du die Daten nicht sicher zuordnen kannst, setze confidence auf "low" und erkläre warum.
Betrag IMMER in Cent (z.B. 150,00 EUR = 15000).`;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const aiResponse = await fetch("https://ai.lovable.dev/api/v1/chat", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!aiResponse.ok) {
    throw new Error(`AI response error: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content || "";

  // Parse AI response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse AI response");
  }

  const extracted = JSON.parse(jsonMatch[0]);

  const isAutoBooked = extracted.confidence === "high" && extracted.matched_building_id && extracted.amount_cents;

  await supabase
    .from("inbound_emails")
    .update({
      status: isAutoBooked ? "processed" : "needs_review",
      processing_result: extracted,
      vendor_name: extracted.vendor_name || null,
      invoice_number: extracted.invoice_number || null,
      invoice_date: extracted.invoice_date || null,
      amount_cents: extracted.amount_cents || null,
      matched_building_id: extracted.matched_building_id || null,
      matched_cost_type_id: extracted.matched_cost_type_id || null,
      review_notes: isAutoBooked
        ? "Automatisch verarbeitet und gebucht"
        : `Confidence: ${extracted.confidence}. ${extracted.notes || "Manuelle Prüfung erforderlich."}`,
      processed_at: isAutoBooked ? new Date().toISOString() : null,
    })
    .eq("id", emailId);
}
