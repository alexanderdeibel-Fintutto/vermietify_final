 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 const TAX_SYSTEM_PROMPT = `Du bist ein KI-Assistent für Immobilienverwaltung in Deutschland. Du hilfst bei:
 - Fragen zu Mieteinnahmen und Ausgaben
 - Steuerthemen rund um Vermietung und Verpachtung (Anlage V)
 - AfA-Berechnungen (Absetzung für Abnutzung)
 - Werbungskosten bei Vermietung
 - Allgemeine Fragen zur Immobilienverwaltung
 
 WICHTIGER HINWEIS: Du bist KEIN Steuerberater. Deine Antworten sind allgemeine Informationen und ersetzen NICHT die Beratung durch einen qualifizierten Steuerberater. Bei konkreten steuerlichen Entscheidungen sollte immer ein Steuerberater konsultiert werden.
 
 Antworte auf Deutsch, kurz und präzise. Wenn du Daten aus dem Kontext hast, nutze sie für konkrete Antworten.`;
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { messages, context, userData } = await req.json();
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     // Build context-aware system prompt
     let systemPrompt = TAX_SYSTEM_PROMPT;
     
     if (userData) {
       systemPrompt += `\n\nKontext-Daten des Nutzers:`;
       if (userData.buildings) {
         systemPrompt += `\n- ${userData.buildings.length} Immobilie(n)`;
       }
       if (userData.totalIncome !== undefined) {
         systemPrompt += `\n- Gesamteinnahmen: ${(userData.totalIncome / 100).toFixed(2)} €`;
       }
       if (userData.totalExpenses !== undefined) {
         systemPrompt += `\n- Gesamtausgaben: ${(userData.totalExpenses / 100).toFixed(2)} €`;
       }
       if (userData.currentPage) {
         systemPrompt += `\n- Aktuelle Seite: ${userData.currentPage}`;
       }
     }
 
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
         messages: [
           { role: "system", content: systemPrompt },
           ...messages,
         ],
         stream: true,
       }),
     });
 
     if (!response.ok) {
       if (response.status === 429) {
         return new Response(JSON.stringify({ error: "Rate limit überschritten. Bitte versuchen Sie es später erneut." }), {
           status: 429,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       if (response.status === 402) {
         return new Response(JSON.stringify({ error: "Keine AI-Credits mehr verfügbar." }), {
           status: 402,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       const errorText = await response.text();
       console.error("AI gateway error:", response.status, errorText);
       return new Response(JSON.stringify({ error: "KI-Dienst nicht verfügbar" }), {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     return new Response(response.body, {
       headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
     });
   } catch (e) {
     console.error("ai-chat error:", e);
     return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });