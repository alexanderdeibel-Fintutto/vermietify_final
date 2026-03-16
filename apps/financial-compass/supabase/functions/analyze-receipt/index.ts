import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { image, mediaType } = await req.json();

    if (!image) {
      throw new Error("No image provided");
    }

    // Use Lovable AI Gateway with Gemini for image analysis
    const response = await fetch(LOVABLE_AI_GATEWAY, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mediaType || "image/jpeg"};base64,${image}`,
                },
              },
              {
                type: "text",
                text: `Analysiere diesen deutschen Beleg/Rechnung und extrahiere alle relevanten Informationen.

Antworte NUR mit einem validen JSON-Objekt (keine Markdown-Formatierung):
{
  "vendor": "Name des Lieferanten/Händlers",
  "date": "YYYY-MM-DD",
  "grossAmount": 123.45,
  "netAmount": 103.74,
  "vatRate": 19,
  "vatAmount": 19.71,
  "category": "Kategorie (Bürobedarf, Reisekosten, Bewirtung, IT, Telekommunikation, Sonstiges)",
  "suggestedAccount": "SKR03 Konto z.B. 4930 - Bürobedarf",
  "confidence": 0.95,
  "lineItems": [{"description": "Artikelbeschreibung", "amount": 12.34}]
}

Wichtige Hinweise:
- Beträge als Zahlen ohne Währungssymbole
- Datum im Format YYYY-MM-DD
- MwSt-Satz: 19 für Normalsatz, 7 für ermäßigten Satz
- Confidence zwischen 0 und 1 basierend auf Lesbarkeit
- Falls etwas nicht erkennbar ist, nutze sinnvolle Schätzungen`,
              },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway Error:", response.status, errorText);
      throw new Error(`AI Gateway error [${response.status}]: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find raw JSON
      const rawJsonMatch = content.match(/\{[\s\S]*\}/);
      if (rawJsonMatch) {
        jsonStr = rawJsonMatch[0];
      }
    }

    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Analyze Receipt Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    
    // Return fallback demo data on error
    return new Response(
      JSON.stringify({
        error: message,
        fallback: true,
        vendor: "Unbekannt",
        date: new Date().toISOString().split("T")[0],
        grossAmount: 0,
        netAmount: 0,
        vatRate: 19,
        vatAmount: 0,
        category: "Sonstiges",
        suggestedAccount: "4900 - Sonstige Aufwendungen",
        confidence: 0,
        lineItems: [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
