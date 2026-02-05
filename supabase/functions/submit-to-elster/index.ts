 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 // Note: Real ELSTER integration requires ERiC library and certificate handling
 // This is a simulation that would be replaced with actual ERiC API calls
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { submissionId, certificatePin } = await req.json();
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     // Get submission
     const { data: submission, error: subError } = await supabase
       .from("elster_submissions")
       .select("*, elster_certificates(*)")
       .eq("id", submissionId)
       .single();
 
     if (subError || !submission) {
       throw new Error("Übertragung nicht gefunden");
     }
 
     if (!submission.xml_content) {
       throw new Error("XML-Daten fehlen. Bitte generieren Sie die Daten erneut.");
     }
 
     // Validate certificate
     if (!submission.elster_certificates) {
       throw new Error("Kein gültiges Zertifikat zugewiesen");
     }
 
     const cert = submission.elster_certificates;
     const validUntil = new Date(cert.valid_until);
     if (validUntil < new Date()) {
       throw new Error("Das ELSTER-Zertifikat ist abgelaufen");
     }
 
     // Check settings for test mode
     const { data: settings } = await supabase
       .from("elster_settings")
       .select("test_mode")
       .eq("organization_id", submission.organization_id)
       .single();
 
     const isTestMode = settings?.test_mode ?? true;
 
     // Update status to validating
     await supabase
       .from("elster_submissions")
       .update({ status: "validating" })
       .eq("id", submissionId);
 
     // Simulate ELSTER submission
     // In production, this would:
     // 1. Decrypt the certificate using the PIN
     // 2. Sign the XML with the certificate
     // 3. Submit via ERiC library to ELSTER servers
     // 4. Parse the response
 
     await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
 
     // Generate transfer ticket (simulation)
     const transferTicket = `${isTestMode ? "TEST" : "PROD"}-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
 
     // Simulate response
     const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
 <TransferResponse>
   <TransferTicket>${transferTicket}</TransferTicket>
   <Status>OK</Status>
   <Timestamp>${new Date().toISOString()}</Timestamp>
 </TransferResponse>`;
 
     // Update submission with success
     const { error: updateError } = await supabase
       .from("elster_submissions")
       .update({
         status: "submitted",
         transfer_ticket: transferTicket,
         submitted_at: new Date().toISOString(),
         response_xml: responseXml,
       })
       .eq("id", submissionId);
 
     if (updateError) {
       throw new Error("Fehler beim Speichern des Übertragungsstatus");
     }
 
     // After short delay, simulate acceptance (in production, this would be async via webhook)
     setTimeout(async () => {
       await supabase
         .from("elster_submissions")
         .update({ status: "accepted" })
         .eq("id", submissionId);
     }, 5000);
 
     return new Response(
       JSON.stringify({
         success: true,
         transferTicket,
         testMode: isTestMode,
         message: isTestMode 
           ? "Erfolgreich an ELSTER-Testserver übertragen"
           : "Erfolgreich an ELSTER übertragen",
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (e) {
     console.error("submit-to-elster error:", e);
 
     // Try to update submission status to rejected
     try {
       const { submissionId } = await req.clone().json();
       if (submissionId) {
         const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
         const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
         const supabase = createClient(supabaseUrl, supabaseServiceKey);
         
         await supabase
           .from("elster_submissions")
           .update({
             status: "rejected",
             error_message: e instanceof Error ? e.message : "Übertragung fehlgeschlagen",
           })
           .eq("id", submissionId);
       }
     } catch {
       // Ignore cleanup errors
     }
 
     return new Response(
       JSON.stringify({
         success: false,
         error: e instanceof Error ? e.message : "Übertragung fehlgeschlagen",
       }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });