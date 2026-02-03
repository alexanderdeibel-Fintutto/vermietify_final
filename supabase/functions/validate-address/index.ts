import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const { input, sessionToken } = await req.json();

    if (!input || typeof input !== "string") {
      return new Response(
        JSON.stringify({ error: "Input is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Google Places Autocomplete API
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", input);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
    url.searchParams.set("types", "address");
    url.searchParams.set("components", "country:de|country:at|country:ch"); // DACH region
    url.searchParams.set("language", "de");
    if (sessionToken) {
      url.searchParams.set("sessiontoken", sessionToken);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok || data.status === "REQUEST_DENIED") {
      console.error("Google Places API error:", data);
      throw new Error(`Google Places API error: ${data.error_message || data.status}`);
    }

    return new Response(
      JSON.stringify({ predictions: data.predictions || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in validate-address:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
