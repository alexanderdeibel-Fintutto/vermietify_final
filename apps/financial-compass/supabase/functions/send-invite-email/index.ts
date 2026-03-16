import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteRequest {
  recipientEmail: string;
  recipientName?: string;
  appId: string;
  appName: string;
  appUrl: string;
  signupPath: string;
  appSubtitle: string;
  features: string[];
  inviteTarget: string;
  propertyName?: string;
  propertyAddress?: string;
  companyId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    if (!SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }

    const body: InviteRequest = await req.json();
    const {
      recipientEmail,
      recipientName,
      appId,
      appName,
      appUrl,
      signupPath,
      appSubtitle,
      features,
      inviteTarget,
      propertyName,
      propertyAddress,
      companyId,
    } = body;

    if (!recipientEmail || !appName || !appUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize email to lowercase for consistent matching with signup trigger
    const normalizedEmail = recipientEmail.trim().toLowerCase();

    const signupUrl = `${appUrl}${signupPath}${signupPath.includes("?") ? "&" : "?"}email=${encodeURIComponent(normalizedEmail)}`;

    const subject = `Einladung: Nutzen Sie ${appName} für professionelles ${appSubtitle}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7);padding:32px 40px;">
          <h1 style="margin:0;color:#fff;font-size:24px;">${appName}</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${appSubtitle}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#18181b;">
            Sehr geehrte/r ${recipientName || inviteTarget},
          </p>
          <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
            Sie wurden eingeladen, <strong>${appName}</strong> zu nutzen${
              propertyName
                ? ` – im Zusammenhang mit der Immobilie „${propertyName}"${propertyAddress ? ` (${propertyAddress})` : ""}`
                : ""
            }.
          </p>
          <p style="margin:0 0 12px;font-size:14px;color:#3f3f46;font-weight:600;">
            Was ${appName} bietet:
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            ${features
              .map(
                (f) => `<tr><td style="padding:4px 0;font-size:14px;color:#3f3f46;">✅ ${f}</td></tr>`
              )
              .join("")}
          </table>
          <!-- CTA Button -->
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${signupUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:600;">
                🚀 Jetzt kostenlos starten
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:#71717a;">
            Ihre E-Mail-Adresse ist bereits vorausgefüllt – Sie können sofort loslegen.
          </p>
          <p style="margin:0;font-size:12px;color:#a1a1aa;word-break:break-all;">
            Link: <a href="${signupUrl}" style="color:#6366f1;">${signupUrl}</a>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;background:#fafafa;border-top:1px solid #e4e4e7;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
            Fintutto GmbH · <a href="https://fintutto.cloud" style="color:#6366f1;text-decoration:none;">fintutto.cloud</a><br/>
            Powered by ${appName} – ${appSubtitle}, die Freude macht.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send via SendGrid
    const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: normalizedEmail, name: recipientName || undefined }] }],
        from: { email: "info@fintutto.cloud", name: "Fintutto" },
        subject,
        content: [{ type: "text/html", value: htmlBody }],
      }),
    });

    if (!sgResponse.ok) {
      const errText = await sgResponse.text();
      console.error("SendGrid error:", sgResponse.status, errText);
      throw new Error(`SendGrid API failed [${sgResponse.status}]: ${errText}`);
    }
    // Consume response body
    await sgResponse.text();

    // Save invitation to database
    const userId = claimsData.claims.sub;
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await serviceClient.from("app_invitations").insert({
      company_id: companyId,
      sent_by: userId,
      recipient_email: normalizedEmail,
      recipient_name: recipientName || null,
      app_id: appId,
      app_name: appName,
      property_name: propertyName || null,
      property_address: propertyAddress || null,
      status: "sent",
    });

    return new Response(
      JSON.stringify({ success: true, message: "Einladung gesendet" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending invite:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
