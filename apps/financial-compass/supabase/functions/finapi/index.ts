import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FINAPI_BASE_URL = Deno.env.get("FINAPI_URL") || "https://sandbox.finapi.io";

interface FinAPIToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

async function getFinAPIToken(): Promise<FinAPIToken> {
  const clientId = Deno.env.get("FINAPI_CLIENT_ID");
  const clientSecret = Deno.env.get("FINAPI_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("FinAPI credentials not configured");
  }

  const response = await fetch(`${FINAPI_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`FinAPI token error: ${error}`);
  }

  return response.json();
}

async function authenticateUser(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return { userId: user.id };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user first
    const authResult = await authenticateUser(req);
    if (authResult instanceof Response) {
      return authResult; // Return unauthorized response
    }

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // Verify FinAPI credentials are configured
    const clientId = Deno.env.get("FINAPI_CLIENT_ID");
    const clientSecret = Deno.env.get("FINAPI_CLIENT_SECRET");

    // For status checks, return 200 even without credentials
    if (action === "status") {
      if (!clientId || !clientSecret) {
        return new Response(
          JSON.stringify({ configured: false, connected: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      try {
        const token = await getFinAPIToken();
        return new Response(
          JSON.stringify({ 
            configured: true, 
            connected: true,
            sandbox: FINAPI_BASE_URL.includes("sandbox")
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        return new Response(
          JSON.stringify({ configured: true, connected: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // For all other actions, credentials are required
    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          error: "FinAPI nicht konfiguriert. Bitte API-Schlüssel in den Einstellungen hinterlegen.",
          configured: false 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {

      case "webform": {
        // Create web form for bank connection
        const { callbackUrl } = await req.json();
        const token = await getFinAPIToken();

        const response = await fetch(`${FINAPI_BASE_URL}/api/v1/webForms/bankConnectionImport`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            callbacks: {
              finalised: `${callbackUrl}?status=success`,
              cancelled: `${callbackUrl}?status=cancelled`,
            },
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`WebForm error: ${error}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "connections": {
        // Get bank connections
        const token = await getFinAPIToken();

        const response = await fetch(`${FINAPI_BASE_URL}/api/v1/bankConnections`, {
          headers: { "Authorization": `Bearer ${token.access_token}` },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Connections error: ${error}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "transactions": {
        // Get transactions
        const { accountId, from, to } = await req.json();
        const token = await getFinAPIToken();

        const params = new URLSearchParams();
        if (accountId) params.append("accountIds", accountId);
        if (from) params.append("minBankBookingDate", from);
        if (to) params.append("maxBankBookingDate", to);

        const response = await fetch(
          `${FINAPI_BASE_URL}/api/v1/transactions?${params}`,
          { headers: { "Authorization": `Bearer ${token.access_token}` } }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Transactions error: ${error}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "accounts": {
        // Get bank accounts
        const token = await getFinAPIToken();

        const response = await fetch(`${FINAPI_BASE_URL}/api/v1/accounts`, {
          headers: { "Authorization": `Bearer ${token.access_token}` },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Accounts error: ${error}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("FinAPI Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
