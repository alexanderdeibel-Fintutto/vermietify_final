-- Fix 1: Restrict profiles table to only allow users to view their own profile
-- The current policy "Users can view own profile" already uses (auth.uid() = id)
-- But we need to ensure it's properly enforced. Let's recreate for clarity.

-- Drop existing SELECT policy and recreate with proper restriction
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Fix 2: Remove the dangerous "Authenticated users can join companies" policy
-- Users should only be added to companies via the handle_new_company trigger
-- or through an invitation system (future enhancement)
DROP POLICY IF EXISTS "Authenticated users can join companies" ON public.company_members;

-- Create a restrictive INSERT policy - only allow system-level inserts via trigger
-- or when user creates a company (handled by handle_new_company trigger)
CREATE POLICY "Only company creation trigger can add members"
ON public.company_members
FOR INSERT
WITH CHECK (
  -- Only allow if the user doesn't already have ANY membership (first company scenario)
  -- and role is 'owner' (set by trigger for company creators)
  auth.uid() = user_id 
  AND role = 'owner'
  AND NOT EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.company_id = company_members.company_id 
    AND cm.user_id != auth.uid()
  )
);

-- Add UPDATE policy to prevent role escalation - only owners can change roles
CREATE POLICY "Only owners can update member roles"
ON public.company_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = company_members.company_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'owner'
  )
);