import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface PlaceDetails {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
  placeId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const { placeId, sessionToken } = await req.json();

    if (!placeId || typeof placeId !== "string") {
      return new Response(
        JSON.stringify({ error: "placeId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Google Places Details API
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
    url.searchParams.set("fields", "address_components,formatted_address,place_id");
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

    if (data.status !== "OK" || !data.result) {
      return new Response(
        JSON.stringify({ error: "Place not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse address components
    const components: AddressComponent[] = data.result.address_components || [];
    
    const getComponent = (types: string[]): string => {
      const component = components.find((c) => 
        types.some((type) => c.types.includes(type))
      );
      return component?.long_name || "";
    };

    const streetNumber = getComponent(["street_number"]);
    const route = getComponent(["route"]);
    const city = getComponent(["locality", "sublocality", "administrative_area_level_3"]);
    const postalCode = getComponent(["postal_code"]);
    const country = getComponent(["country"]);

    // Construct street address (German format: Street Number)
    const address = streetNumber ? `${route} ${streetNumber}` : route;

    const placeDetails: PlaceDetails = {
      address: address.trim(),
      city,
      postalCode,
      country,
      formattedAddress: data.result.formatted_address || "",
      placeId: data.result.place_id || placeId,
    };

    return new Response(
      JSON.stringify(placeDetails),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in get-place-details:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
