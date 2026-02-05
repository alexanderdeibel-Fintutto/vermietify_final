import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });

    const { organizationId } = await req.json();

    if (!organizationId) {
      throw new Error('Missing organizationId');
    }

    // Get current VPI
    const { data: latestVpi, error: vpiError } = await supabase
      .from('vpi_index')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1)
      .single();

    if (vpiError) throw vpiError;

    // Get all active leases with index rent settings
    const { data: leases, error: leasesError } = await supabase
      .from('leases')
      .select(`
        *,
        tenants(id, first_name, last_name, email),
        units(id, unit_number, building_id, buildings(id, name, address)),
        lease_rent_settings(*)
      `)
      .eq('is_active', true);

    if (leasesError) throw leasesError;

    // Filter to only index rent contracts
    const indexLeases = leases?.filter(l => 
      l.lease_rent_settings?.rent_type === 'index'
    ) || [];

    // Get last adjustment for each lease
    const leaseIds = indexLeases.map(l => l.id);
    const { data: lastAdjustments } = await supabase
      .from('rent_adjustments')
      .select('*')
      .in('lease_id', leaseIds)
      .eq('status', 'active')
      .order('effective_date', { ascending: false });

    // Group adjustments by lease
    const adjustmentsByLease = (lastAdjustments || []).reduce((acc, adj) => {
      if (!acc[adj.lease_id]) {
        acc[adj.lease_id] = adj;
      }
      return acc;
    }, {} as Record<string, any>);

    // Calculate eligible adjustments
    const eligibleAdjustments = [];
    const today = new Date();

    for (const lease of indexLeases) {
      const settings = lease.lease_rent_settings;
      if (!settings?.index_base_value) continue;

      const lastAdjustment = adjustmentsByLease[lease.id];
      const baseIndex = lastAdjustment?.index_new || settings.index_base_value;
      const baseRent = lastAdjustment?.new_rent_cents || lease.rent_amount * 100;
      
      // Check if 12 months have passed since last adjustment
      const lastAdjDate = lastAdjustment?.effective_date 
        ? new Date(lastAdjustment.effective_date)
        : settings.index_base_date 
          ? new Date(settings.index_base_date)
          : new Date(lease.start_date);
      
      const monthsSinceLastAdj = (today.getFullYear() - lastAdjDate.getFullYear()) * 12 
        + (today.getMonth() - lastAdjDate.getMonth());

      // Index adjustment typically allowed after 12 months
      if (monthsSinceLastAdj < 12) continue;

      // Calculate new rent
      const indexChange = ((latestVpi.value - baseIndex) / baseIndex) * 100;
      const minChange = settings.index_min_change_percent || 0;
      
      if (indexChange < minChange) continue;

      const newRentCents = Math.round(baseRent * (latestVpi.value / baseIndex));
      const differenceCents = newRentCents - baseRent;

      // Determine status
      let status: 'due' | 'recently_adjusted' | 'not_eligible' = 'due';
      if (monthsSinceLastAdj < 15) {
        status = 'recently_adjusted';
      }

      eligibleAdjustments.push({
        leaseId: lease.id,
        tenant: lease.tenants ? `${lease.tenants.first_name} ${lease.tenants.last_name}` : 'Unknown',
        tenantEmail: lease.tenants?.email,
        unit: lease.units ? `${lease.units.buildings?.name} - ${lease.units.unit_number}` : 'Unknown',
        unitId: lease.units?.id,
        buildingId: lease.units?.building_id,
        currentRentCents: baseRent,
        currentRentEuro: (baseRent / 100).toFixed(2),
        indexAtLastAdjustment: baseIndex,
        currentIndex: latestVpi.value,
        indexChangePercent: parseFloat(indexChange.toFixed(2)),
        newRentCents,
        newRentEuro: (newRentCents / 100).toFixed(2),
        differenceCents,
        differenceEuro: (differenceCents / 100).toFixed(2),
        lastAdjustmentDate: lastAdjDate.toISOString().split('T')[0],
        monthsSinceLastAdjustment: monthsSinceLastAdj,
        status,
        announcementMonthsRequired: settings.index_announcement_months || 3
      });
    }

    // Sort by status (due first) then by difference amount
    eligibleAdjustments.sort((a, b) => {
      if (a.status === 'due' && b.status !== 'due') return -1;
      if (a.status !== 'due' && b.status === 'due') return 1;
      return b.differenceCents - a.differenceCents;
    });

    // Calculate summary stats
    const dueCount = eligibleAdjustments.filter(a => a.status === 'due').length;
    const totalPotentialIncrease = eligibleAdjustments
      .filter(a => a.status === 'due')
      .reduce((sum, a) => sum + a.differenceCents, 0);

    return new Response(
      JSON.stringify({
        success: true,
        currentVpi: {
          value: latestVpi.value,
          year: latestVpi.year,
          month: latestVpi.month,
          changeYoy: latestVpi.change_yoy_percent
        },
        summary: {
          totalIndexContracts: indexLeases.length,
          eligibleForAdjustment: eligibleAdjustments.length,
          dueNow: dueCount,
          totalPotentialIncreaseCents: totalPotentialIncrease,
          totalPotentialIncreaseEuro: (totalPotentialIncrease / 100).toFixed(2)
        },
        adjustments: eligibleAdjustments
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking index adjustments:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});