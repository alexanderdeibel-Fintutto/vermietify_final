 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface ValidationResult {
   isValid: boolean;
   errors: Array<{ field: string; message: string }>;
   warnings: Array<{ field: string; message: string }>;
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { formType, taxYear, buildingIds, organizationId } = await req.json();
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     const result: ValidationResult = {
       isValid: true,
       errors: [],
       warnings: [],
     };
 
     // Validate based on form type
     if (formType === "anlage_v") {
       // Check if buildings are selected
       if (!buildingIds || buildingIds.length === 0) {
         result.errors.push({
           field: "buildings",
           message: "Mindestens ein Objekt muss ausgewählt werden",
         });
         result.isValid = false;
       }
 
       // Check if ELSTER settings exist
       const { data: settings } = await supabase
         .from("elster_settings")
         .select("*")
         .eq("organization_id", organizationId)
         .single();
 
       if (!settings?.tax_number) {
         result.errors.push({
           field: "tax_number",
           message: "Steuernummer ist nicht hinterlegt",
         });
         result.isValid = false;
       }
 
       if (!settings?.tax_office_id) {
         result.errors.push({
           field: "tax_office",
           message: "Finanzamt ist nicht ausgewählt",
         });
         result.isValid = false;
       }
 
       // Check for certificate
       const { data: certificates } = await supabase
         .from("elster_certificates")
         .select("*")
         .eq("organization_id", organizationId)
         .eq("is_active", true)
         .gte("valid_until", new Date().toISOString());
 
       if (!certificates || certificates.length === 0) {
         result.errors.push({
           field: "certificate",
           message: "Kein gültiges ELSTER-Zertifikat vorhanden",
         });
         result.isValid = false;
       }
 
       // Check for transaction data per building
       if (buildingIds && buildingIds.length > 0) {
         const startDate = `${taxYear}-01-01`;
         const endDate = `${taxYear}-12-31`;
 
         const { data: transactions } = await supabase
           .from("transactions")
           .select("building_id, amount, is_income")
           .eq("organization_id", organizationId)
           .in("building_id", buildingIds)
           .gte("transaction_date", startDate)
           .lte("transaction_date", endDate);
 
         const buildingsWithData = new Set(transactions?.map(t => t.building_id) || []);
         
         for (const buildingId of buildingIds) {
           if (!buildingsWithData.has(buildingId)) {
             result.warnings.push({
               field: `building_${buildingId}`,
               message: "Keine Transaktionen für dieses Objekt im Steuerjahr gefunden",
             });
           }
         }
 
         // Check for income
         const hasIncome = transactions?.some(t => t.is_income);
         if (!hasIncome) {
           result.warnings.push({
             field: "income",
             message: "Keine Einnahmen für das Steuerjahr erfasst",
           });
         }
       }
     }
 
     return new Response(JSON.stringify(result), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (e) {
     console.error("validate-elster-data error:", e);
     return new Response(
       JSON.stringify({
         isValid: false,
         errors: [{ field: "system", message: e instanceof Error ? e.message : "Validierungsfehler" }],
         warnings: [],
       }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });