ALTER TYPE public.workflow_trigger_type ADD VALUE IF NOT EXISTS 'event_offer_created';
ALTER TYPE public.workflow_trigger_type ADD VALUE IF NOT EXISTS 'event_offer_accepted';
ALTER TYPE public.workflow_trigger_type ADD VALUE IF NOT EXISTS 'event_offer_rejected';