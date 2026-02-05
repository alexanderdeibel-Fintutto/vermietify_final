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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { organization_id } = await req.json();

    if (!organization_id) {
      throw new Error('organization_id is required');
    }

    const createdEvents: any[] = [];
    const now = new Date();

    // 1. Contract end dates - create deadline 3 months before
    const { data: expiringLeases } = await supabase
      .from('leases')
      .select(`
        id,
        end_date,
        tenant:tenants!inner(
          id,
          first_name,
          last_name,
          organization_id
        ),
        unit:units!inner(
          id,
          unit_number,
          building:buildings!inner(
            name
          )
        )
      `)
      .eq('tenant.organization_id', organization_id)
      .eq('is_active', true)
      .not('end_date', 'is', null);

    for (const lease of expiringLeases || []) {
      if (!lease.end_date) continue;
      
      const endDate = new Date(lease.end_date);
      const reminderDate = new Date(endDate);
      reminderDate.setMonth(reminderDate.getMonth() - 3);

      // Only create if reminder date is in the future and no event exists
      if (reminderDate > now) {
        const { data: existing } = await supabase
          .from('calendar_events')
          .select('id')
          .eq('organization_id', organization_id)
          .eq('related_type', 'contract')
          .eq('related_id', lease.id)
          .eq('is_auto_generated', true)
          .eq('category', 'deadline')
          .single();

        if (!existing) {
          const { data: newEvent, error } = await supabase
            .from('calendar_events')
            .insert({
              organization_id,
              title: `Vertragsende: ${lease.tenant?.first_name} ${lease.tenant?.last_name}`,
              description: `Der Mietvertrag für ${lease.unit?.building?.name} ${lease.unit?.unit_number} endet am ${new Date(lease.end_date).toLocaleDateString('de-DE')}.`,
              category: 'deadline',
              start_at: reminderDate.toISOString(),
              all_day: true,
              related_type: 'contract',
              related_id: lease.id,
              is_auto_generated: true,
              reminder_minutes: [1440, 10080] // 1 day, 1 week
            })
            .select()
            .single();

          if (!error && newEvent) {
            createdEvents.push(newEvent);
          }
        }
      }
    }

    // 2. Monthly rent payment deadlines
    const { data: activeLeases } = await supabase
      .from('leases')
      .select(`
        id,
        payment_day,
        rent_amount,
        tenant:tenants!inner(
          id,
          first_name,
          last_name,
          organization_id
        ),
        unit:units!inner(
          id,
          unit_number,
          building:buildings!inner(
            name
          )
        )
      `)
      .eq('tenant.organization_id', organization_id)
      .eq('is_active', true);

    // Create payment events for next 3 months
    for (const lease of activeLeases || []) {
      const paymentDay = lease.payment_day || 1;
      
      for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const paymentDate = new Date();
        paymentDate.setMonth(paymentDate.getMonth() + monthOffset);
        paymentDate.setDate(paymentDay);
        paymentDate.setHours(0, 0, 0, 0);

        if (paymentDate > now) {
          const monthKey = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;
          
          const { data: existing } = await supabase
            .from('calendar_events')
            .select('id')
            .eq('organization_id', organization_id)
            .eq('related_type', 'contract')
            .eq('related_id', lease.id)
            .eq('is_auto_generated', true)
            .eq('category', 'payment')
            .gte('start_at', new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString())
            .lt('start_at', new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 1).toISOString())
            .single();

          if (!existing) {
            const { data: newEvent, error } = await supabase
              .from('calendar_events')
              .insert({
                organization_id,
                title: `Miete fällig: ${lease.tenant?.first_name} ${lease.tenant?.last_name}`,
                description: `Miete ${lease.rent_amount}€ für ${lease.unit?.building?.name} ${lease.unit?.unit_number}`,
                category: 'payment',
                start_at: paymentDate.toISOString(),
                all_day: true,
                related_type: 'contract',
                related_id: lease.id,
                is_auto_generated: true,
                reminder_minutes: [1440] // 1 day before
              })
              .select()
              .single();

            if (!error && newEvent) {
              createdEvents.push(newEvent);
            }
          }
        }
      }
    }

    // 3. Handover appointments
    const { data: plannedHandovers } = await supabase
      .from('handover_protocols')
      .select(`
        id,
        type,
        scheduled_at,
        unit:units!inner(
          id,
          unit_number,
          building:buildings!inner(
            name
          )
        ),
        tenant:tenants(
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organization_id)
      .eq('status', 'planned');

    for (const handover of plannedHandovers || []) {
      const { data: existing } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('related_type', 'handover')
        .eq('related_id', handover.id)
        .eq('is_auto_generated', true)
        .single();

      if (!existing) {
        const typeLabel = handover.type === 'move_in' ? 'Einzug' : 'Auszug';
        const { data: newEvent, error } = await supabase
          .from('calendar_events')
          .insert({
            organization_id,
            title: `${typeLabel}: ${handover.unit?.building?.name} ${handover.unit?.unit_number}`,
            description: handover.tenant 
              ? `${typeLabel} von ${handover.tenant.first_name} ${handover.tenant.last_name}`
              : `${typeLabel}-Übergabe`,
            category: 'handover',
            start_at: handover.scheduled_at,
            all_day: false,
            related_type: 'handover',
            related_id: handover.id,
            is_auto_generated: true,
            reminder_minutes: [60, 1440] // 1 hour, 1 day
          })
          .select()
          .single();

        if (!error && newEvent) {
          createdEvents.push(newEvent);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      created_events: createdEvents.length,
      events: createdEvents
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error syncing auto events:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
