import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UNITS_PROMPT = `Du bist ein Experte für die Analyse von Immobilien-Dokumenten.
Extrahiere aus dem folgenden Dokument eine Liste von Wohneinheiten/Wohnungen.
Für jede Einheit extrahiere folgende Felder (soweit vorhanden):
- unit_number: Wohnungsnummer oder Bezeichnung (z.B. "Whg. 1", "EG links", "3.OG rechts")
- floor: Stockwerk/Etage als Zahl (EG=0, 1.OG=1, UG=-1, etc.)
- area: Wohnfläche in m² als Zahl
- rooms: Anzahl Zimmer als Zahl
- rent_amount: Kaltmiete in Euro-Cent als Ganzzahl (z.B. 85000 für 850€). Wenn in Euro angegeben, multipliziere mit 100.
- utility_advance: Nebenkostenvorauszahlung in Euro-Cent als Ganzzahl
- status: "vacant" oder "rented" (falls ersichtlich, sonst "vacant")
- notes: Sonstige relevante Informationen

Antworte AUSSCHLIESSLICH mit einem JSON-Array. Kein erklärender Text.
Beispiel: [{"unit_number":"Whg. 1","floor":0,"area":65.5,"rooms":2,"rent_amount":65000,"utility_advance":15000,"status":"vacant","notes":null}]`;

const BUILDINGS_PROMPT = `Du bist ein Experte für die Analyse von Immobilien-Dokumenten.
Extrahiere aus dem folgenden Dokument eine Liste von Gebäuden/Immobilien.
Für jedes Gebäude extrahiere folgende Felder (soweit vorhanden):
- name: Name oder Bezeichnung des Gebäudes
- address: Straße und Hausnummer
- postal_code: Postleitzahl
- city: Stadt/Ort
- building_type: "apartment" (Mehrfamilienhaus), "house" (Einfamilienhaus), "commercial" (Gewerbe) oder "mixed" (Gemischt)
- year_built: Baujahr als Zahl
- total_area: Gesamtfläche in m² als Zahl
- notes: Sonstige relevante Informationen

Wenn kein expliziter Name vorhanden ist, generiere einen aus der Adresse (z.B. "Musterstraße 5").

Antworte AUSSCHLIESSLICH mit einem JSON-Array. Kein erklärender Text.
Beispiel: [{"name":"Musterstraße 5","address":"Musterstraße 5","postal_code":"12345","city":"Berlin","building_type":"apartment","year_built":1990,"total_area":450,"notes":null}]`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, content } = await req.json();

    if (!type || !content) {
      return new Response(
        JSON.stringify({ error: "type und content sind erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = type === "units" ? UNITS_PROMPT : BUILDINGS_PROMPT;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Analysiere dieses Dokument und extrahiere die Daten:\n\n${content}`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "KI-Kontingent erschöpft. Bitte laden Sie Guthaben auf." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("KI-Analyse fehlgeschlagen");
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Extract JSON array from response
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Could not parse AI response:", rawContent);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Die KI konnte keine strukturierten Daten aus dem Dokument extrahieren. Bitte prüfen Sie das Dokument.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-import-data error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unbekannter Fehler",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
