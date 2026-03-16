import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const EMAIL_WEBHOOK_SECRET = Deno.env.get("EMAIL_WEBHOOK_SECRET");

    // Validate webhook secret to prevent unauthorized access
    if (EMAIL_WEBHOOK_SECRET) {
      const providedSecret = req.headers.get("X-Webhook-Secret");
      if (providedSecret !== EMAIL_WEBHOOK_SECRET) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { sender_email, subject, inbox_address, file_base64, file_name } = await req.json();

    if (!sender_email || !inbox_address) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sender_email, inbox_address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Find inbox by address
    const { data: inbox, error: inboxError } = await supabase
      .from("email_inboxes")
      .select("*")
      .eq("inbox_address", inbox_address)
      .eq("is_active", true)
      .single();

    if (inboxError || !inbox) {
      return new Response(
        JSON.stringify({ error: "Inbox not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Verify sender is allowed
    const allowedSenders = inbox.allowed_senders || [];
    const senderAllowed = allowedSenders.length === 0 || 
      allowedSenders.some((s: string) => s.toLowerCase() === sender_email.toLowerCase());

    if (!senderAllowed) {
      // Create receipt with error status for unauthorized sender
      await supabase.from("email_receipts").insert({
        company_id: inbox.company_id,
        inbox_id: inbox.id,
        sender_email,
        subject: subject || "(kein Betreff)",
        status: "error",
        question_text: `Absender ${sender_email} ist nicht als erlaubter Absender hinterlegt.`,
      });

      return new Response(
        JSON.stringify({ error: "Sender not authorized", sender_email }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Upload attachment if present
    let fileUrl: string | null = null;
    if (file_base64 && file_name) {
      const fileBytes = Uint8Array.from(atob(file_base64), c => c.charCodeAt(0));
      // Sanitize file name to prevent path traversal
      const sanitizedFileName = file_name
        .replace(/\.\.\//g, '')
        .replace(/\.\.\\/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${inbox.company_id}/${crypto.randomUUID()}-${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("email-attachments")
        .upload(filePath, fileBytes, {
          contentType: file_name.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("email-attachments")
          .getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      }
    }

    // 4. Create email receipt entry
    const { data: emailReceipt, error: receiptError } = await supabase
      .from("email_receipts")
      .insert({
        company_id: inbox.company_id,
        inbox_id: inbox.id,
        sender_email,
        subject: subject || "(kein Betreff)",
        status: file_base64 ? "pending" : "question",
        file_name: file_name || null,
        file_url: fileUrl,
        question_text: !file_base64 ? "E-Mail ohne PDF-Anhang empfangen. Bitte manuell prüfen." : null,
      })
      .select()
      .single();

    if (receiptError) {
      console.error("Error creating email receipt:", receiptError);
      return new Response(
        JSON.stringify({ error: "Failed to create email receipt" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. If we have a PDF, analyze it with AI
    if (file_base64 && LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `Du bist ein Buchhaltungsassistent. Analysiere den Beleg und extrahiere die relevanten Informationen. Antworte NUR mit einem JSON-Objekt ohne Markdown-Formatierung.`,
              },
              {
                role: "user",
                content: `Analysiere diesen Beleg (Dateiname: ${file_name}, Betreff: ${subject || "keiner"}). 
                
Extrahiere folgende Informationen als JSON:
{
  "vendor": "Name des Lieferanten/Händlers",
  "amount": 0.00,
  "tax_amount": 0.00,
  "date": "YYYY-MM-DD",
  "category": "Kategorie (z.B. Büromaterial, Bewirtung, Reisekosten, etc.)",
  "description": "Kurze Beschreibung",
  "confidence": 0.85
}

Falls du Informationen nicht sicher erkennen kannst, setze confidence entsprechend niedrig (unter 0.6) und beschreibe im description-Feld, was unklar ist.`,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "extract_receipt_data",
                  description: "Extract structured receipt data from the document",
                  parameters: {
                    type: "object",
                    properties: {
                      vendor: { type: "string", description: "Vendor/merchant name" },
                      amount: { type: "number", description: "Gross amount in EUR" },
                      tax_amount: { type: "number", description: "Tax/VAT amount in EUR" },
                      date: { type: "string", description: "Date in YYYY-MM-DD format" },
                      category: { type: "string", description: "Expense category" },
                      description: { type: "string", description: "Short description" },
                      confidence: { type: "number", description: "Confidence score 0-1" },
                    },
                    required: ["vendor", "amount", "date", "category", "confidence"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "extract_receipt_data" } },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall) {
            const extracted = JSON.parse(toolCall.function.arguments);
            const isLowConfidence = (extracted.confidence || 0) < 0.6;

            await supabase
              .from("email_receipts")
              .update({
                vendor: extracted.vendor,
                amount: extracted.amount,
                tax_amount: extracted.tax_amount,
                date: extracted.date,
                category: extracted.category,
                description: extracted.description,
                confidence: extracted.confidence,
                status: isLowConfidence ? "question" : "processed",
                question_text: isLowConfidence
                  ? `KI-Erkennung unsicher (${Math.round((extracted.confidence || 0) * 100)}%). Bitte prüfen: ${extracted.description || "Details unklar"}`
                  : null,
              })
              .eq("id", emailReceipt.id);
          }
        } else {
          // AI failed - mark as question
          const errorText = await aiResponse.text();
          console.error("AI analysis failed:", aiResponse.status, errorText);
          
          await supabase
            .from("email_receipts")
            .update({
              status: "question",
              question_text: "KI-Analyse fehlgeschlagen. Bitte manuell verarbeiten.",
            })
            .eq("id", emailReceipt.id);
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
        await supabase
          .from("email_receipts")
          .update({
            status: "question",
            question_text: "KI-Analyse fehlgeschlagen. Bitte manuell verarbeiten.",
          })
          .eq("id", emailReceipt.id);
      }
    } else if (file_base64 && !LOVABLE_API_KEY) {
      // No AI key - mark as question
      await supabase
        .from("email_receipts")
        .update({
          status: "question",
          question_text: "Automatische Analyse nicht verfügbar. Bitte manuell verarbeiten.",
        })
        .eq("id", emailReceipt.id);
    }

    return new Response(
      JSON.stringify({ success: true, receipt_id: emailReceipt.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-email-receipt error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
