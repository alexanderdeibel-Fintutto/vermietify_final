-- Fix: Security Definer View on public.leases
-- 
-- Supabase Lint Warning: "Security Definer View"
-- The view public.leases was defined with SECURITY DEFINER, meaning its underlying
-- query runs with the permissions of the view owner/creator rather than the
-- querying user. This bypasses RLS policies unintentionally.
--
-- Fix: Switch to SECURITY INVOKER so that RLS policies are enforced correctly
-- for the authenticated/anon roles querying the view.
--
-- Reference: Same pattern already applied to public.tenants_safe in migration
-- 20260212191131_17744fb3-56ab-4edd-ad1c-eee42f2a59c8.sql

-- Set security_invoker = on so that RLS is respected for the querying user
ALTER VIEW public.leases SET (security_invoker = on);
