-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
  'payment_received', 'payment_overdue', 'payment_reminder',
  'contract_ending', 'contract_created', 'contract_terminated',
  'tenant_created', 'tenant_document',
  'task_assigned', 'task_due', 'task_completed',
  'meter_reading_due', 'meter_reading_submitted',
  'document_uploaded', 'document_signed',
  'message_received', 'inquiry_received',
  'billing_created', 'billing_sent',
  'workflow_completed', 'workflow_failed',
  'system_alert', 'system_info'
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  icon VARCHAR(50),
  link VARCHAR(500),
  related_type VARCHAR(50),
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view notifications from their organization"
ON public.notifications FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update notifications from their organization"
ON public.notifications FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert notifications for their organization"
ON public.notifications FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete notifications from their organization"
ON public.notifications FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX idx_notifications_organization ON public.notifications(organization_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;