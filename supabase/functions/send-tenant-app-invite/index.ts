import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIETER_APP_URL = "https://mieter-kw8d.vercel.app";

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

    const admin = createClient(supabaseUrl, serviceKey);

    const { tenant_id } = await req.json();
    if (!tenant_id) {
      return new Response(JSON.stringify({ error: "tenant_id erforderlich" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's org
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

    // Get org name
    const { data: org } = await admin
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .single();

    // Get tenant details
    const { data: tenant } = await admin
      .from("tenants")
      .select("id, first_name, last_name, email")
      .eq("id", tenant_id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!tenant) {
      return new Response(JSON.stringify({ error: "Mieter nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tenant.email) {
      return new Response(JSON.stringify({ error: "Mieter hat keine E-Mail-Adresse hinterlegt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active lease with unit + building info
    const { data: activeLease } = await admin
      .from("leases")
      .select(`
        id,
        rent_amount,
        utility_advance,
        start_date,
        units(
          id,
          unit_number,
          buildings(id, name, address, city, postal_code)
        )
      `)
      .eq("tenant_id", tenant_id)
      .eq("is_active", true)
      .maybeSingle();

    const unit = activeLease?.units as any;
    const building = unit?.buildings as any;
    const orgName = org?.name ?? "Ihre Hausverwaltung";
    const tenantName = `${tenant.first_name} ${tenant.last_name}`;
    const unitLabel = unit ? `${unit.unit_number}` : "";
    const buildingLabel = building ? `${building.name}, ${building.address}, ${building.postal_code} ${building.city}` : "";

    // Generate a magic link / signup link for the Mieter app
    // The link pre-fills the email and directs to registration
    const inviteParams = new URLSearchParams({
      invite: "tenant",
      email: tenant.email,
      name: tenantName,
      org: orgName,
      ...(building ? { building: building.name } : {}),
      ...(unit ? { unit: unit.unit_number } : {}),
    });
    const registerUrl = `${MIETER_APP_URL}/registrieren?${inviteParams.toString()}`;

    // Build beautiful invitation email
    const htmlBody = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Einladung zur Fintutto Mieter-App</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#ec4899 100%);padding:40px 40px 32px;text-align:center;">
              <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:32px;">🏠</span>
              </div>
              <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;">Fintutto Mieter</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">Ihr digitales Mieter-Portal</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="color:#1e293b;font-size:22px;font-weight:600;margin:0 0 16px;">
                Hallo ${tenant.first_name},
              </h2>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                <strong>${orgName}</strong> lädt Sie herzlich ein, die <strong>Fintutto Mieter-App</strong> zu nutzen – 
                Ihr persönliches Portal für alles rund um Ihre Wohnung.
              </p>

              ${buildingLabel ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-weight:600;">Ihre Wohnung</p>
                    <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0 0 4px;">${unitLabel ? `Einheit ${unitLabel}` : ""}</p>
                    <p style="color:#475569;font-size:14px;margin:0;">${buildingLabel}</p>
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- Features -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px;vertical-align:top;padding-top:2px;">
                          <span style="font-size:18px;">📊</span>
                        </td>
                        <td style="padding-left:8px;">
                          <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0;">Echtzeit-Übersicht</p>
                          <p style="color:#64748b;font-size:13px;margin:2px 0 0;">Alle Mietdaten und Dokumente auf einen Blick</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px;vertical-align:top;padding-top:2px;">
                          <span style="font-size:18px;">🔧</span>
                        </td>
                        <td style="padding-left:8px;">
                          <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0;">Mängelmelder</p>
                          <p style="color:#64748b;font-size:13px;margin:2px 0 0;">Schäden direkt melden und Status verfolgen</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px;vertical-align:top;padding-top:2px;">
                          <span style="font-size:18px;">💬</span>
                        </td>
                        <td style="padding-left:8px;">
                          <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0;">Direkte Kommunikation</p>
                          <p style="color:#64748b;font-size:13px;margin:2px 0 0;">Chat mit Ihrer Hausverwaltung</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px;vertical-align:top;padding-top:2px;">
                          <span style="font-size:18px;">📈</span>
                        </td>
                        <td style="padding-left:8px;">
                          <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0;">Zählerstände</p>
                          <p style="color:#64748b;font-size:13px;margin:2px 0 0;">Einfach erfassen und an Ihren Verwalter übermitteln</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${registerUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:12px;box-shadow:0 4px 14px rgba(99,102,241,0.4);">
                      Jetzt kostenlos registrieren
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 8px;text-align:center;">
                Klicken Sie auf den Button und geben Sie nur noch ein Passwort ein –<br>
                Ihre E-Mail-Adresse wird automatisch übernommen.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
                Diese Einladung wurde von <strong>${orgName}</strong> über Vermietify gesendet.<br>
                Die App ist für Mieter <strong>dauerhaft kostenlos</strong>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Log email
    await admin.from("email_log").insert({
      organization_id: profile.organization_id,
      recipient_email: tenant.email,
      recipient_tenant_id: tenant_id,
      subject: `${orgName} lädt Sie zur Fintutto Mieter-App ein`,
      body_html: htmlBody,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    // Update tenant_unit_access or create if needed (for portal access)
    if (activeLease?.id && unit?.id) {
      // Check if user already exists
      const { data: allUsers } = await admin.auth.admin.listUsers();
      const existingUser = allUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === tenant.email!.toLowerCase()
      );

      if (existingUser) {
        // Auto-grant tenant portal access
        await admin.from("tenant_unit_access").upsert(
          {
            tenant_id: tenant_id,
            tenant_user_id: existingUser.id,
            unit_id: unit.id,
            lease_id: activeLease.id,
            granted_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,unit_id" }
        ).select();
      }
    }

    return new Response(JSON.stringify({
      success: true,
      email: tenant.email,
      tenant_name: tenantName,
      register_url: registerUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
