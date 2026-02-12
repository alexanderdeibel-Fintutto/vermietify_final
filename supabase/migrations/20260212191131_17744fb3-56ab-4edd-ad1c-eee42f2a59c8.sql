
-- Explicitly set SECURITY INVOKER on the view to satisfy linter
ALTER VIEW public.tenants_safe SET (security_invoker = on);
