-- Create enums for task system
CREATE TYPE public.task_category AS ENUM ('water_damage', 'heating', 'electrical', 'other');
CREATE TYPE public.task_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.task_source AS ENUM ('tenant', 'landlord', 'caretaker');

-- Add new columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS category task_category DEFAULT 'other',
ADD COLUMN IF NOT EXISTS status task_status DEFAULT 'open',
ADD COLUMN IF NOT EXISTS source task_source DEFAULT 'landlord',
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

-- Create task_comments table
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create task_attachments table
CREATE TABLE public.task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'image',
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create task_activities table for timeline
CREATE TABLE public.task_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments on tasks in their org"
ON public.task_comments FOR SELECT
USING (
  task_id IN (
    SELECT id FROM public.tasks 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Users can insert comments on tasks in their org"
ON public.task_comments FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  task_id IN (
    SELECT id FROM public.tasks 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Users can delete own comments"
ON public.task_comments FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for task_attachments
CREATE POLICY "Users can view attachments on tasks in their org"
ON public.task_attachments FOR SELECT
USING (
  task_id IN (
    SELECT id FROM public.tasks 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Users can insert attachments on tasks in their org"
ON public.task_attachments FOR INSERT
WITH CHECK (
  task_id IN (
    SELECT id FROM public.tasks 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Users can delete own attachments"
ON public.task_attachments FOR DELETE
USING (uploaded_by = auth.uid());

-- RLS Policies for task_activities
CREATE POLICY "Users can view activities on tasks in their org"
ON public.task_activities FOR SELECT
USING (
  task_id IN (
    SELECT id FROM public.tasks 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Users can insert activities on tasks in their org"
ON public.task_activities FOR INSERT
WITH CHECK (
  task_id IN (
    SELECT id FROM public.tasks 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for task-attachments bucket
CREATE POLICY "Anyone can view task attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments');

CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own task attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for task_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;