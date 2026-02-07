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

    // Use service role for processing reminders
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    // Get all pending reminders that are due
    const { data: dueReminders, error: remindersError } = await supabase
      .from('calendar_reminders')
      .select(`
        *,
        event:calendar_events(
          id,
          title,
          description,
          category,
          start_at,
          location
        )
      `)
      .eq('sent', false)
      .lte('remind_at', now.toISOString())
      .order('remind_at', { ascending: true })
      .limit(100);

    if (remindersError) {
      throw remindersError;
    }

    console.log(`Processing ${dueReminders?.length || 0} due reminders`);

    const processed: string[] = [];
    const errors: string[] = [];

    for (const reminder of dueReminders || []) {
      try {
        // Process based on channel
        switch (reminder.channel) {
          case 'app':
            console.log(`App notification for event: ${reminder.event?.title}`);
            break;
          case 'email':
            console.log(`Email reminder for event: ${reminder.event?.title}`);
            break;
          case 'push':
            console.log(`Push notification for event: ${reminder.event?.title}`);
            break;
        }

        // Mark as sent
        await supabase
          .from('calendar_reminders')
          .update({ 
            sent: true,
            sent_at: now.toISOString()
          })
          .eq('id', reminder.id);

        processed.push(reminder.id);

      } catch (err) {
        console.error(`Error processing reminder ${reminder.id}:`, err);
        errors.push(reminder.id);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: processed.length,
      errors: errors.length,
      timestamp: now.toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error processing reminders:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
