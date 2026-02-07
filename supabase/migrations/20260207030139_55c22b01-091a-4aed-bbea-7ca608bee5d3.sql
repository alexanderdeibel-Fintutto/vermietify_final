
-- Block anonymous access to sensitive tables
-- These tables already have RLS enabled but lack explicit anon denial policies

CREATE POLICY "Deny anonymous access to tenants"
ON public.tenants FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to leases"
ON public.leases FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to transactions"
ON public.transactions FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to documents"
ON public.documents FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to messages"
ON public.messages FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to organizations"
ON public.organizations FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to user_subscriptions"
ON public.user_subscriptions FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles FOR ALL TO anon USING (false);
