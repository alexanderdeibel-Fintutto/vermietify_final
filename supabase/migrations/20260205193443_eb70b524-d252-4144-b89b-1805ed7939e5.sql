-- Create calendar event categories enum
CREATE TYPE calendar_category AS ENUM (
  'viewing',      -- Besichtigungen (blau)
  'handover',     -- Übergaben (grün)
  'deadline',     -- Fristen (orange)
  'payment',      -- Zahlungsfristen (rot)
  'maintenance',  -- Wartung/Handwerker (lila)
  'other'         -- Sonstige (grau)
);

-- Create related entity type enum
CREATE TYPE related_entity_type AS ENUM (
  'building',
  'unit',
  'tenant',
  'contract',
  'handover'
);

-- Create reminder channel enum
CREATE TYPE reminder_channel AS ENUM ('app', 'email', 'push');

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category calendar_category NOT NULL DEFAULT 'other',
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN NOT NULL DEFAULT false,
  location TEXT,
  related_type related_entity_type,
  related_id UUID,
  recurrence_rule JSONB,
  reminder_minutes INTEGER[] DEFAULT '{}'::INTEGER[],
  color TEXT,
  is_auto_generated BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar_reminders table
CREATE TABLE public.calendar_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  channel reminder_channel NOT NULL DEFAULT 'app',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar_ical_tokens table for iCal feed access
CREATE TABLE public.calendar_ical_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_ical_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "Users can view events in their organization"
  ON public.calendar_events FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create events in their organization"
  ON public.calendar_events FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update events in their organization"
  ON public.calendar_events FOR UPDATE
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete events in their organization"
  ON public.calendar_events FOR DELETE
  USING (organization_id = get_user_organization_id(auth.uid()));

-- RLS Policies for calendar_reminders
CREATE POLICY "Users can view their own reminders"
  ON public.calendar_reminders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create reminders for their events"
  ON public.calendar_reminders FOR INSERT
  WITH CHECK (event_id IN (
    SELECT id FROM public.calendar_events 
    WHERE organization_id = get_user_organization_id(auth.uid())
  ));

CREATE POLICY "Users can update their own reminders"
  ON public.calendar_reminders FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reminders"
  ON public.calendar_reminders FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for calendar_ical_tokens
CREATE POLICY "Users can view their own ical tokens"
  ON public.calendar_ical_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own ical tokens"
  ON public.calendar_ical_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ical tokens"
  ON public.calendar_ical_tokens FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own ical tokens"
  ON public.calendar_ical_tokens FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_calendar_events_organization ON public.calendar_events(organization_id);
CREATE INDEX idx_calendar_events_start_at ON public.calendar_events(start_at);
CREATE INDEX idx_calendar_events_category ON public.calendar_events(category);
CREATE INDEX idx_calendar_events_related ON public.calendar_events(related_type, related_id);
CREATE INDEX idx_calendar_reminders_remind_at ON public.calendar_reminders(remind_at) WHERE sent = false;
CREATE INDEX idx_calendar_ical_tokens_token ON public.calendar_ical_tokens(token);

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();