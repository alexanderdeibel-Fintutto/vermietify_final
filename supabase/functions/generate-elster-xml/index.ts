 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 // German tax offices by federal state
 const TAX_OFFICES: Record<string, Array<{ id: string; name: string }>> = {
   "Bayern": [
     { id: "9101", name: "Finanzamt München I" },
     { id: "9102", name: "Finanzamt München II" },
     { id: "9103", name: "Finanzamt München III" },
     { id: "9201", name: "Finanzamt Nürnberg-Nord" },
   ],
   "Berlin": [
     { id: "1116", name: "Finanzamt Charlottenburg" },
     { id: "1117", name: "Finanzamt Friedrichshain-Kreuzberg" },
     { id: "1118", name: "Finanzamt Mitte/Tiergarten" },
   ],
   "Hamburg": [
     { id: "2214", name: "Finanzamt Hamburg-Mitte" },
     { id: "2215", name: "Finanzamt Hamburg-Nord" },
   ],
   // Add more as needed
 };
 
 function escapeXml(unsafe: string): string {
   return unsafe
     .replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&apos;");
 }
 
 function formatCurrency(cents: number): string {
   return (cents / 100).toFixed(2).replace(".", ",");
 }
 
 interface BuildingData {
   id: string;
   name: string;
   address: string;
   city: string;
   postalCode: string;
   yearBuilt: number | null;
   totalArea: number | null;
   income: number;
   expenses: number;
   afa: number;
 }
 
 function generateAnlageVXml(
   taxYear: number,
   taxNumber: string,
   taxOfficeId: string,
   buildings: BuildingData[]
 ): string {
   const totalIncome = buildings.reduce((sum, b) => sum + b.income, 0);
   const totalExpenses = buildings.reduce((sum, b) => sum + b.expenses + b.afa, 0);
   const result = totalIncome - totalExpenses;
 
   // Generate ERiC-compatible XML structure (simplified)
   let xml = `<?xml version="1.0" encoding="UTF-8"?>
 <Elster xmlns="http://www.elster.de/elsterxml/schema/v11">
   <TransferHeader version="11">
     <Verfahren>ElsterErklaerung</Verfahren>
     <DatenArt>ESt</DatenArt>
     <Vorgang>send-Auth</Vorgang>
     <Testmerker>0</Testmerker>
     <HerstellerID>74931</HerstellerID>
     <Empfaenger id="F">${escapeXml(taxOfficeId)}</Empfaenger>
   </TransferHeader>
   <DatenTeil>
     <Nutzdatenblock>
       <NutzdatenHeader version="11">
         <NutzdatenTicket>${Date.now()}</NutzdatenTicket>
         <Empfaenger id="F">${escapeXml(taxOfficeId)}</Empfaenger>
       </NutzdatenHeader>
       <Nutzdaten>
         <Erklaerung xmlns="http://finkonsens.de/elster/elsterkth/erklaerung/v5">
           <Steuernummer>${escapeXml(taxNumber.replace(/[\s/]/g, ""))}</Steuernummer>
           <Jahr>${taxYear}</Jahr>
           <AnlageV>`;
 
   // Add each building (Objekt)
   buildings.forEach((building, index) => {
     xml += `
             <Objekt nr="${index + 1}">
               <Bezeichnung>${escapeXml(building.name)}</Bezeichnung>
               <Strasse>${escapeXml(building.address)}</Strasse>
               <PLZ>${escapeXml(building.postalCode)}</PLZ>
               <Ort>${escapeXml(building.city)}</Ort>
               <Flaeche>${building.totalArea || 0}</Flaeche>
               <Baujahr>${building.yearBuilt || 0}</Baujahr>
               <Einnahmen>
                 <Mieten>${formatCurrency(building.income)}</Mieten>
               </Einnahmen>
               <Werbungskosten>
                 <AfA>${formatCurrency(building.afa)}</AfA>
                 <SonstigeKosten>${formatCurrency(building.expenses)}</SonstigeKosten>
                 <Summe>${formatCurrency(building.expenses + building.afa)}</Summe>
               </Werbungskosten>
               <Ergebnis>${formatCurrency(building.income - building.expenses - building.afa)}</Ergebnis>
             </Objekt>`;
   });
 
   xml += `
             <GesamtEinnahmen>${formatCurrency(totalIncome)}</GesamtEinnahmen>
             <GesamtWerbungskosten>${formatCurrency(totalExpenses)}</GesamtWerbungskosten>
             <EinkuenfteVuV>${formatCurrency(result)}</EinkuenfteVuV>
           </AnlageV>
         </Erklaerung>
       </Nutzdaten>
     </Nutzdatenblock>
   </DatenTeil>
 </Elster>`;
 
   return xml;
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
 
     // Get ELSTER settings
     const { data: settings, error: settingsError } = await supabase
       .from("elster_settings")
       .select("*")
       .eq("organization_id", organizationId)
       .single();
 
     if (settingsError || !settings) {
       throw new Error("ELSTER-Einstellungen nicht gefunden");
     }
 
     if (!settings.tax_number || !settings.tax_office_id) {
       throw new Error("Steuernummer oder Finanzamt nicht konfiguriert");
     }
 
     let xmlContent = "";
     let dataJson: Record<string, unknown> = {};
 
     if (formType === "anlage_v") {
       // Get buildings
       const { data: buildings, error: buildingsError } = await supabase
         .from("buildings")
         .select("*")
         .in("id", buildingIds);
 
       if (buildingsError || !buildings) {
         throw new Error("Objekte konnten nicht geladen werden");
       }
 
       // Get transactions for each building
       const startDate = `${taxYear}-01-01`;
       const endDate = `${taxYear}-12-31`;
 
       const buildingDataList: BuildingData[] = [];
 
       for (const building of buildings) {
         // Get income
         const { data: income } = await supabase
           .from("transactions")
           .select("amount")
           .eq("organization_id", organizationId)
           .eq("building_id", building.id)
           .eq("is_income", true)
           .gte("transaction_date", startDate)
           .lte("transaction_date", endDate);
 
         const totalIncome = income?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
 
         // Get expenses
         const { data: expenses } = await supabase
           .from("transactions")
           .select("amount")
           .eq("organization_id", organizationId)
           .eq("building_id", building.id)
           .eq("is_income", false)
           .gte("transaction_date", startDate)
           .lte("transaction_date", endDate);
 
         const totalExpenses = expenses?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
 
         // Calculate AfA
         let afa = 0;
         if (building.year_built && building.total_area) {
           const estimatedPrice = (building.total_area || 0) * 200000; // cents
           const buildingValue = estimatedPrice * 0.85;
           const rate = building.year_built < 1925 ? 0.025 : building.year_built >= 2023 ? 0.03 : 0.02;
           afa = Math.round(buildingValue * rate);
         }
 
         buildingDataList.push({
           id: building.id,
           name: building.name,
           address: building.address,
           city: building.city,
           postalCode: building.postal_code,
           yearBuilt: building.year_built,
           totalArea: building.total_area,
           income: totalIncome,
           expenses: totalExpenses,
           afa,
         });
       }
 
       xmlContent = generateAnlageVXml(
         taxYear,
         settings.tax_number,
         settings.tax_office_id,
         buildingDataList
       );
 
       dataJson = {
         formType,
         taxYear,
         buildings: buildingDataList,
         totals: {
           income: buildingDataList.reduce((sum, b) => sum + b.income, 0),
           expenses: buildingDataList.reduce((sum, b) => sum + b.expenses, 0),
           afa: buildingDataList.reduce((sum, b) => sum + b.afa, 0),
           result: buildingDataList.reduce((sum, b) => sum + b.income - b.expenses - b.afa, 0),
         },
       };
     } else {
       throw new Error(`Formulartyp ${formType} wird noch nicht unterstützt`);
     }
 
     return new Response(
       JSON.stringify({
         success: true,
         xmlContent,
         dataJson,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (e) {
     console.error("generate-elster-xml error:", e);
     return new Response(
       JSON.stringify({
         success: false,
         error: e instanceof Error ? e.message : "XML-Generierung fehlgeschlagen",
       }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });