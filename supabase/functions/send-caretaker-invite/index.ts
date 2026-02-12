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
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Nicht authentifiziert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { building_id, emails } = await req.json();
    if (!building_id || !emails?.length) {
      return new Response(JSON.stringify({ error: "building_id und emails erforderlich" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Get org info
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();
    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "Keine Organisation gefunden" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: org } = await admin
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .single();

    const { data: building } = await admin
      .from("buildings")
      .select("name, address, city")
      .eq("id", building_id)
      .single();

    const orgName = org?.name ?? "Ihr Verwalter";
    const buildingLabel = building ? `${building.name} (${building.address}, ${building.city})` : "";

    const results: any[] = [];

    for (const entry of emails) {
      const email = entry.email?.trim();
      if (!email) continue;

      // Upsert caretaker
      const { data: caretaker, error: upsertErr } = await admin
        .from("building_caretakers")
        .upsert(
          {
            building_id,
            organization_id: profile.organization_id,
            email,
            first_name: entry.first_name || null,
            last_name: entry.last_name || null,
            phone: entry.phone || null,
            status: "invited",
            invited_at: new Date().toISOString(),
          },
          { onConflict: "building_id,email" }
        )
        .select("id")
        .single();

      if (upsertErr) {
        results.push({ email, error: upsertErr.message });
        continue;
      }

      // Build dynamic invite link with query params
      const inviteParams = new URLSearchParams({
        invite: caretaker?.id ?? "",
        building: building?.name ?? "",
        org: orgName,
      });
      const inviteUrl = `https://hausmeister.pro?${inviteParams.toString()}`;

      // Check if user already exists in HausmeisterPro (same DB)
      let userExistsInHP = false;
      try {
        const { data: allUsers } = await admin.auth.admin.listUsers();
        const existingUser = allUsers?.users?.find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (existingUser) {
          userExistsInHP = true;
          // Auto-link building in HausmeisterPro if company/building mapping exists
          const { data: companyMap } = await admin
            .from("hausmeister_sync_map")
            .select("remote_id")
            .eq("organization_id", profile.organization_id)
            .eq("entity_type", "company")
            .maybeSingle();

          if (companyMap?.remote_id) {
            // Check if caretaker profile exists and link building
            const { data: caretakerProfile } = await admin
              .from("profiles")
              .select("id, user_id")
              .eq("user_id", existingUser.id)
              .maybeSingle();

            if (caretakerProfile) {
              // Try to associate user with the company in HausmeisterPro
              await admin.from("company_members").upsert(
                {
                  company_id: companyMap.remote_id,
                  user_id: existingUser.id,
                  role: "caretaker",
                },
                { onConflict: "company_id,user_id" }
              ).select();
            }
          }
        }
      } catch (_) {
        // Non-critical: if check fails, invitation still works
      }

      // Build invitation email HTML
      const recipientName = [entry.first_name, entry.last_name].filter(Boolean).join(" ") || "Sehr geehrte/r Hausmeister/in";
      const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <h2 style="color:#2563eb;">Einladung zur Hausmeister Pro App</h2>
  <p>Hallo ${recipientName},</p>
  <p><strong>${orgName}</strong> hat Sie eingeladen, die App <strong>Hausmeister Pro</strong> für das Gebäude <strong>${buildingLabel}</strong> zu nutzen.</p>
  <p>Probieren Sie die App kostenlos aus! Sie bleibt für Sie <strong>dauerhaft kostenlos</strong>, solange Sie nur dieses eine Gebäude verwalten.</p>
  <p>Mit Hausmeister Pro wird die Kommunikation zwischen Verwalter, Hausmeister und Mieter <strong>entkompliziert, vereinfacht und beschleunigt</strong>.</p>
  <div style="margin:24px 0;text-align:center;">
    <a href="${inviteUrl}" style="background:#2563eb;color:white;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:bold;">Jetzt kostenlos starten</a>
  </div>
  ${userExistsInHP ? '<p style="color:#16a34a;font-size:13px;">✓ Ihr Account wurde bereits erkannt – das Gebäude wird automatisch zugewiesen.</p>' : ""}
  <p style="color:#666;font-size:13px;">Diese Einladung wurde von ${orgName} über Vermietify gesendet.</p>
</body>
</html>`;

      // Log email
      await admin.from("email_log").insert({
        organization_id: profile.organization_id,
        recipient_email: email,
        subject: `Einladung: Hausmeister Pro für ${building?.name ?? "Ihr Gebäude"}`,
        body_html: htmlBody,
        status: "sent",
        sent_at: new Date().toISOString(),
      });

      results.push({
        email,
        status: "invited",
        caretaker_id: caretaker?.id,
        user_exists: userExistsInHP,
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
