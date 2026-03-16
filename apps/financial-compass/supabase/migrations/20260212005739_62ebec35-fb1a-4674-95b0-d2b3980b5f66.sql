
-- Fix: Restrict email-attachments SELECT to company members only
DROP POLICY IF EXISTS "Users can view email attachments from their company" ON storage.objects;

CREATE POLICY "Users can view email attachments from their company"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'email-attachments' 
    AND (
      (string_to_array(name, '/'))[1]::uuid IN (
        SELECT company_id FROM public.company_members 
        WHERE user_id = auth.uid()
      )
    )
  );
