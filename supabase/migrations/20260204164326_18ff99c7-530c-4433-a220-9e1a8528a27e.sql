-- Add INSERT policy for organizations table
-- Allows authenticated users to create organizations where they are the owner
CREATE POLICY "Users can create their own organization"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (owner_user_id = auth.uid());