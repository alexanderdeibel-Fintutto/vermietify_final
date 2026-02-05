 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { organizationId, submissionId } = await req.json();
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     // Get submissions to check for notices
     let query = supabase
       .from("elster_submissions")
       .select("*")
       .in("status", ["submitted", "accepted"]);
 
     if (organizationId) {
       query = query.eq("organization_id", organizationId);
     }
 
     if (submissionId) {
       query = query.eq("id", submissionId);
     }
 
     const { data: submissions, error: subError } = await query;
 
     if (subError) {
       throw new Error("Fehler beim Laden der Übertragungen");
     }
 
     const newNotices: Array<{
       submissionId: string;
       noticeDate: string;
       assessedTax: number;
       declaredTax: number;
       difference: number;
     }> = [];
 
     // Check each submission for notices
     // In production, this would query ELSTER servers via ERiC
     for (const submission of submissions || []) {
       // Check if notice already exists
       const { data: existingNotice } = await supabase
         .from("elster_notices")
         .select("id")
         .eq("submission_id", submission.id)
         .single();
 
       if (existingNotice) {
         continue; // Already have notice
       }
 
       // Simulate checking for notice (only for accepted submissions older than 1 minute for demo)
       const submittedAt = new Date(submission.submitted_at);
       const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
 
       if (submission.status === "accepted" && submittedAt < oneMinuteAgo) {
         // Simulate receiving a notice
         const dataJson = submission.data_json as { totals?: { result?: number } } | null;
         const declaredTax = Math.round((dataJson?.totals?.result || 0) * 0.3); // ~30% tax rate
         const assessedTax = declaredTax + Math.round((Math.random() - 0.5) * 10000); // Small variation
         const difference = assessedTax - declaredTax;
 
         // Insert notice
         const { error: insertError } = await supabase
           .from("elster_notices")
           .insert({
             submission_id: submission.id,
             notice_date: new Date().toISOString().split("T")[0],
             assessed_tax_cents: assessedTax,
             declared_tax_cents: declaredTax,
             difference_cents: difference,
             notes: difference !== 0 
               ? `Abweichung von ${(Math.abs(difference) / 100).toFixed(2)} € festgestellt`
               : "Bescheid entspricht der Erklärung",
           });
 
         if (!insertError) {
           // Update submission status
           await supabase
             .from("elster_submissions")
             .update({ status: "notice_received" })
             .eq("id", submission.id);
 
           newNotices.push({
             submissionId: submission.id,
             noticeDate: new Date().toISOString().split("T")[0],
             assessedTax,
             declaredTax,
             difference,
           });
         }
       }
     }
 
     return new Response(
       JSON.stringify({
         success: true,
         checkedCount: submissions?.length || 0,
         newNotices,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (e) {
     console.error("fetch-elster-notices error:", e);
     return new Response(
       JSON.stringify({
         success: false,
         error: e instanceof Error ? e.message : "Bescheidabruf fehlgeschlagen",
       }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });