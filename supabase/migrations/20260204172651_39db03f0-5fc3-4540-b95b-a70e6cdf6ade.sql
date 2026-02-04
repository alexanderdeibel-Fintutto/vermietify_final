-- Fix warn-level security issues: Require authentication for SELECT on sensitive tables
-- This prevents anonymous users from reading data even if org-scoped policies exist

-- 1. Buildings table - block anonymous access
CREATE POLICY "Require authentication for buildings"
ON public.buildings
FOR SELECT
TO anon
USING (false);

-- 2. Units table - block anonymous access
CREATE POLICY "Require authentication for units"
ON public.units
FOR SELECT
TO anon
USING (false);

-- 3. Tasks table - block anonymous access
CREATE POLICY "Require authentication for tasks"
ON public.tasks
FOR SELECT
TO anon
USING (false);

-- 4. Utility costs table - block anonymous access
CREATE POLICY "Require authentication for utility_costs"
ON public.utility_costs
FOR SELECT
TO anon
USING (false);

-- 5. Profiles table - block anonymous access  
CREATE POLICY "Require authentication for profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);