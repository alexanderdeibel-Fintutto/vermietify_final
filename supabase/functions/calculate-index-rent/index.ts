import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculationRequest {
  leaseId: string;
  baseRentCents: number;
  baseIndexValue: number;
  currentIndexValue?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { leaseId, baseRentCents, baseIndexValue, currentIndexValue }: CalculationRequest = await req.json();

    if (!leaseId || !baseRentCents || !baseIndexValue) {
      throw new Error('Missing required parameters: leaseId, baseRentCents, baseIndexValue');
    }

    // Get current VPI if not provided
    let vpiValue = currentIndexValue;
    if (!vpiValue) {
      const { data: latestVpi, error: vpiError } = await supabase
        .from('vpi_index')
        .select('value')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(1)
        .single();

      if (vpiError) throw vpiError;
      vpiValue = latestVpi.value;
    }

    // Calculate index change
    const indexChange = ((vpiValue - baseIndexValue) / baseIndexValue) * 100;
    
    // Calculate new rent
    const rentMultiplier = vpiValue / baseIndexValue;
    const newRentCents = Math.round(baseRentCents * rentMultiplier);
    const differenceCents = newRentCents - baseRentCents;

    // Get lease details for context
    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select(`
        *,
        tenants(first_name, last_name),
        units(unit_number, buildings(name))
      `)
      .eq('id', leaseId)
      .single();

    if (leaseError) throw leaseError;

    // Get rent settings
    const { data: settings } = await supabase
      .from('lease_rent_settings')
      .select('*')
      .eq('lease_id', leaseId)
      .single();

    // Check if adjustment meets minimum threshold
    const minChangePercent = settings?.index_min_change_percent || 0;
    const meetsThreshold = indexChange >= minChangePercent;

    return new Response(
      JSON.stringify({
        success: true,
        calculation: {
          leaseId,
          tenant: lease.tenants ? `${lease.tenants.first_name} ${lease.tenants.last_name}` : 'Unknown',
          unit: lease.units ? `${lease.units.buildings?.name} - ${lease.units.unit_number}` : 'Unknown',
          baseRentCents,
          baseRentEuro: (baseRentCents / 100).toFixed(2),
          baseIndexValue,
          currentIndexValue: vpiValue,
          indexChangePercent: parseFloat(indexChange.toFixed(2)),
          newRentCents,
          newRentEuro: (newRentCents / 100).toFixed(2),
          differenceCents,
          differenceEuro: (differenceCents / 100).toFixed(2),
          meetsThreshold,
          minChangePercent,
          announcementMonths: settings?.index_announcement_months || 3
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error calculating index rent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
