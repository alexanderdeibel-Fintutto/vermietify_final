-- Add image_url column to meter_readings for photo storage
ALTER TABLE public.meter_readings 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for meter reading photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('meter-photos', 'meter-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for meter photos
CREATE POLICY "Anyone can view meter photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'meter-photos');

CREATE POLICY "Authenticated users can upload meter photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'meter-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their meter photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'meter-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their meter photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'meter-photos' AND auth.role() = 'authenticated');