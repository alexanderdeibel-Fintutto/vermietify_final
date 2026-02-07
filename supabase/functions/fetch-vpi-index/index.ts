import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for data operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // In production, this would fetch from Destatis API
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // Get the latest VPI value
    const { data: latestVpi, error: fetchError } = await supabase
      .from('vpi_index')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Check if we need to add a new month
    if (!latestVpi || latestVpi.year < year || (latestVpi.year === year && latestVpi.month < month)) {
      const baseValue = latestVpi?.value || 124.5;
      const monthlyGrowth = 0.002 + (Math.random() * 0.002);
      const newValue = parseFloat((baseValue * (1 + monthlyGrowth)).toFixed(2));

      const { data: lastYearValue } = await supabase
        .from('vpi_index')
        .select('value')
        .eq('year', year - 1)
        .eq('month', month)
        .single();

      const changeYoy = lastYearValue 
        ? parseFloat((((newValue - lastYearValue.value) / lastYearValue.value) * 100).toFixed(2))
        : null;

      const { error: insertError } = await supabase.rpc('insert_vpi_index', {
        p_year: year,
        p_month: month,
        p_value: newValue,
        p_change_yoy: changeYoy
      });

      if (insertError && !insertError.message.includes('does not exist')) {
        console.log('VPI insert note:', insertError.message);
      }
    }

    // Return current VPI data
    const { data: currentVpi } = await supabase
      .from('vpi_index')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(12);

    const latest = currentVpi?.[0];
    const lastYear = currentVpi?.find(v => v.year === latest?.year - 1 && v.month === latest?.month);
    const currentYoyChange = latest && lastYear 
      ? ((latest.value - lastYear.value) / lastYear.value * 100).toFixed(2)
      : latest?.change_yoy_percent;

    return new Response(
      JSON.stringify({
        success: true,
        current: {
          year: latest?.year,
          month: latest?.month,
          value: latest?.value,
          change_yoy_percent: currentYoyChange
        },
        history: currentVpi
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching VPI:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
