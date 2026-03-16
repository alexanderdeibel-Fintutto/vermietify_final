-- Lock down company_members INSERT to prevent any direct insertion
-- Membership is only created via SECURITY DEFINER triggers (handle_new_company, handle_new_user)
DROP POLICY IF EXISTS "Only company creation trigger can add members" ON public.company_members;

CREATE POLICY "Prevent direct member insertion"
ON public.company_members
FOR INSERT
WITH CHECK (false);