-- Create enum types for workflows
CREATE TYPE workflow_trigger_type AS ENUM (
  'time_daily', 'time_weekly', 'time_monthly', 'time_yearly',
  'event_tenant_created', 'event_contract_created', 'event_contract_terminated',
  'event_payment_overdue', 'event_payment_received', 'event_meter_reading_due',
  'event_document_uploaded', 'event_task_created', 'event_contract_ending',
  'event_building_created', 'event_unit_created'
);

CREATE TYPE workflow_action_type AS ENUM (
  'send_email', 'create_notification', 'create_task', 'send_letter',
  'send_whatsapp', 'update_field', 'call_webhook', 'wait'
);

CREATE TYPE workflow_execution_status AS ENUM ('running', 'completed', 'failed');

-- Create workflows table
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type workflow_trigger_type NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  conditions JSONB DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_template BOOLEAN NOT NULL DEFAULT false,
  template_category VARCHAR(100),
  last_executed_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow_executions table
CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  trigger_data JSONB DEFAULT '{}',
  status workflow_execution_status NOT NULL DEFAULT 'running',
  steps JSONB DEFAULT '[]',
  current_step INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- RLS policies for workflows
CREATE POLICY "Users can view workflows from their organization"
ON public.workflows FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR is_template = true
);

CREATE POLICY "Users can create workflows for their organization"
ON public.workflows FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR is_template = true
);

CREATE POLICY "Users can update workflows from their organization"
ON public.workflows FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete workflows from their organization"
ON public.workflows FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

-- RLS policies for workflow_executions
CREATE POLICY "Users can view executions from their organization"
ON public.workflow_executions FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create executions for their organization"
ON public.workflow_executions FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update executions from their organization"
ON public.workflow_executions FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX idx_workflows_organization ON public.workflows(organization_id);
CREATE INDEX idx_workflows_trigger_type ON public.workflows(trigger_type);
CREATE INDEX idx_workflows_is_active ON public.workflows(is_active);
CREATE INDEX idx_workflows_is_template ON public.workflows(is_template);
CREATE INDEX idx_workflow_executions_workflow ON public.workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_organization ON public.workflow_executions(organization_id);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX idx_workflow_executions_triggered_at ON public.workflow_executions(triggered_at);

-- Create triggers for updating timestamps
CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON public.workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default workflow templates (with NULL organization_id for system templates)
INSERT INTO public.workflows (organization_id, name, description, trigger_type, trigger_config, conditions, actions, is_active, is_template, template_category)
VALUES 
  (NULL, 'Zahlungserinnerung nach 7 Tagen', 'Sendet automatisch eine Erinnerung wenn eine Zahlung 7 Tage überfällig ist', 'event_payment_overdue', '{"days_overdue": 7}', '[]', '[{"type": "send_email", "config": {"template": "payment_reminder_1", "recipient": "tenant"}}]', false, true, 'payment'),
  (NULL, 'Willkommens-E-Mail bei neuem Mieter', 'Sendet eine Willkommens-E-Mail an neue Mieter', 'event_tenant_created', '{}', '[]', '[{"type": "send_email", "config": {"template": "welcome_tenant", "recipient": "tenant"}}]', false, true, 'tenant'),
  (NULL, 'BK-Abrechnung Erinnerung', 'Jährliche Erinnerung zur Erstellung der Betriebskostenabrechnung', 'time_yearly', '{"month": 1, "day": 15}', '[]', '[{"type": "create_task", "config": {"title": "Betriebskostenabrechnung erstellen", "description": "Die jährliche BK-Abrechnung ist fällig"}}]', false, true, 'billing'),
  (NULL, 'Vertragsverlängerung prüfen', 'Benachrichtigung 3 Monate vor Vertragsende', 'event_contract_ending', '{"days_before": 90}', '[]', '[{"type": "create_notification", "config": {"title": "Vertrag endet bald", "message": "Der Mietvertrag endet in 3 Monaten"}}, {"type": "create_task", "config": {"title": "Vertragsverlängerung prüfen"}}]', false, true, 'contract'),
  (NULL, 'Zählerablesung Reminder', 'Erinnerung an Mieter zur Zählerablesung', 'event_meter_reading_due', '{}', '[]', '[{"type": "send_email", "config": {"template": "meter_reading_reminder", "recipient": "tenant"}}, {"type": "send_whatsapp", "config": {"template": "meter_reading"}}]', false, true, 'meter');