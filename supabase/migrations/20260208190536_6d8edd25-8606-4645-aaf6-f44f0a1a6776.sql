
-- Fix: restrict insert to service role only (via RPC or edge function with service key)
DROP POLICY "Service role can insert inbound emails" ON public.inbound_emails;

-- Allow org members to insert (for manual additions) 
CREATE POLICY "Org members can insert inbound emails"
  ON public.inbound_emails FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));
