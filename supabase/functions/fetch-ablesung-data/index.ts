import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: get calling user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vermietifyClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await vermietifyClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = claimsData.claims.email as string;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Keine E-Mail-Adresse gefunden" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to the Ablesung app's Supabase
    const ablesungUrl = Deno.env.get("ABLESUNG_SUPABASE_URL");
    const ablesungKey = Deno.env.get("ABLESUNG_SERVICE_ROLE_KEY");

    if (!ablesungUrl || !ablesungKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Ablesung-App-Integration nicht konfiguriert",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ablesungClient = createClient(ablesungUrl, ablesungKey);

    // Find user in Ablesung app by email
    const { data: ablesungProfiles, error: profileError } = await ablesungClient
      .from("profiles")
      .select("id, organization_id")
      .eq("email", userEmail);

    if (profileError || !ablesungProfiles || ablesungProfiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Kein Account in der Ablesung-App mit dieser E-Mail gefunden",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orgId = ablesungProfiles[0].organization_id;
    if (!orgId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Kein Account in der Ablesung-App mit dieser E-Mail gefunden",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch buildings for this organization
    const { data: buildings, error: buildingsError } = await ablesungClient
      .from("buildings")
      .select("id, name, address, city")
      .eq("organization_id", orgId);

    if (buildingsError) throw buildingsError;

    // Fetch meters for these buildings
    const buildingIds = (buildings || []).map((b: any) => b.id);
    
    let allMeters: any[] = [];
    if (buildingIds.length > 0) {
      const { data: metersData, error: metersError } = await ablesungClient
        .from("meters")
        .select(`
          id, meter_number, meter_type, installation_date, unit_id,
          unit:units(unit_number)
        `)
        .in("building_id", buildingIds);

      if (metersError) throw metersError;
      allMeters = metersData || [];
    }

    // Also fetch meters linked via units
    const { data: ablesungUnits } = await ablesungClient
      .from("units")
      .select("id, unit_number, building_id")
      .in("building_id", buildingIds);

    const unitMap = new Map((ablesungUnits || []).map((u: any) => [u.id, u]));

    // Fetch latest readings for all meters
    const meterIds = allMeters.map((m: any) => m.id);
    let readingsMap = new Map<string, { reading_value: number; reading_date: string }>();
    
    if (meterIds.length > 0) {
      const { data: readings } = await ablesungClient
        .from("meter_readings")
        .select("meter_id, reading_value, reading_date")
        .in("meter_id", meterIds)
        .order("reading_date", { ascending: false });

      (readings || []).forEach((r: any) => {
        if (!readingsMap.has(r.meter_id)) {
          readingsMap.set(r.meter_id, {
            reading_value: r.reading_value,
            reading_date: r.reading_date,
          });
        }
      });
    }

    // Assemble response grouped by building
    const result = (buildings || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      city: b.city,
      meters: allMeters
        .filter((m: any) => {
          // Meter is in this building directly or via unit
          if (m.building_id === b.id) return true;
          const unit = unitMap.get(m.unit_id);
          return unit?.building_id === b.id;
        })
        .map((m: any) => ({
          id: m.id,
          meter_number: m.meter_number,
          meter_type: m.meter_type,
          installation_date: m.installation_date,
          unit_name: m.unit?.unit_number || unitMap.get(m.unit_id)?.unit_number || null,
          latest_reading: readingsMap.get(m.id) || null,
        })),
    }));

    return new Response(
      JSON.stringify({ success: true, buildings: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
