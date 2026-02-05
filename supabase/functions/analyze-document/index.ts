 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 const ANALYSIS_PROMPT = `Analysiere dieses Dokument und extrahiere folgende Informationen:
 1. Datum (falls vorhanden)
 2. Betrag/Summe (falls vorhanden, in Euro)
 3. Kategorie (Reparatur, Versicherung, Zinsen, Verwaltung, Nebenkosten, Sonstiges)
 4. Absender/Aussteller
 5. Kurze Beschreibung
 
 Antworte AUSSCHLIESSLICH im JSON-Format:
 {
   "date": "YYYY-MM-DD oder null",
   "amount": Zahl in Cent oder null,
   "category": "repair|insurance|interest|administration|utilities|other",
   "sender": "Name oder null",
   "description": "Kurze Beschreibung"
 }`;
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { documentText, imageUrl } = await req.json();
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     const messages: any[] = [
       { role: "system", content: ANALYSIS_PROMPT },
     ];
 
     if (imageUrl) {
       messages.push({
         role: "user",
         content: [
           { type: "text", text: "Analysiere dieses Dokument:" },
           { type: "image_url", image_url: { url: imageUrl } },
         ],
       });
     } else if (documentText) {
       messages.push({
         role: "user",
         content: `Analysiere diesen Dokumenttext:\n\n${documentText}`,
       });
     } else {
       throw new Error("Kein Dokument zum Analysieren");
     }
 
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-2.5-flash",
         messages,
       }),
     });
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("AI gateway error:", response.status, errorText);
       throw new Error("KI-Analyse fehlgeschlagen");
     }
 
     const data = await response.json();
     const content = data.choices?.[0]?.message?.content || "";
     
     // Try to parse JSON from response
     const jsonMatch = content.match(/\{[\s\S]*\}/);
     if (jsonMatch) {
       const parsed = JSON.parse(jsonMatch[0]);
       return new Response(JSON.stringify({ success: true, data: parsed }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     return new Response(JSON.stringify({ success: false, error: "Konnte Dokument nicht analysieren" }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (e) {
     console.error("analyze-document error:", e);
     return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });