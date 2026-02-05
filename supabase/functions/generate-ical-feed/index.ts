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
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response('Token required', { status: 401 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('calendar_ical_tokens')
      .select('organization_id, user_id, is_active')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData || !tokenData.is_active) {
      return new Response('Invalid or inactive token', { status: 401 });
    }

    // Update last accessed
    await supabase
      .from('calendar_ical_tokens')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('token', token);

    // Fetch events for organization
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('organization_id', tokenData.organization_id)
      .gte('start_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .lte('start_at', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('start_at', { ascending: true });

    if (eventsError) {
      throw eventsError;
    }

    // Generate iCal content
    const icalContent = generateICalendar(events || []);

    return new Response(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calendar.ics"',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error generating iCal feed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

function generateICalendar(events: any[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vermietify//Calendar//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Vermietify Kalender',
    'X-WR-TIMEZONE:Europe/Berlin',
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@vermietify.app`);
    lines.push(`DTSTAMP:${formatICalDate(new Date())}`);
    
    if (event.all_day) {
      lines.push(`DTSTART;VALUE=DATE:${formatICalDateOnly(new Date(event.start_at))}`);
      if (event.end_at) {
        lines.push(`DTEND;VALUE=DATE:${formatICalDateOnly(new Date(event.end_at))}`);
      }
    } else {
      lines.push(`DTSTART:${formatICalDate(new Date(event.start_at))}`);
      if (event.end_at) {
        lines.push(`DTEND:${formatICalDate(new Date(event.end_at))}`);
      }
    }
    
    lines.push(`SUMMARY:${escapeICalText(event.title)}`);
    
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    }
    
    if (event.location) {
      lines.push(`LOCATION:${escapeICalText(event.location)}`);
    }

    // Add category
    const categoryMap: Record<string, string> = {
      viewing: 'Besichtigung',
      handover: 'Übergabe',
      deadline: 'Frist',
      payment: 'Zahlung',
      maintenance: 'Wartung',
      other: 'Sonstige'
    };
    lines.push(`CATEGORIES:${categoryMap[event.category] || 'Sonstige'}`);

    // Add reminders/alarms
    if (event.reminder_minutes && event.reminder_minutes.length > 0) {
      for (const minutes of event.reminder_minutes) {
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:Erinnerung: ${event.title}`);
        lines.push(`TRIGGER:-PT${minutes}M`);
        lines.push('END:VALARM');
      }
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function formatICalDateOnly(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
