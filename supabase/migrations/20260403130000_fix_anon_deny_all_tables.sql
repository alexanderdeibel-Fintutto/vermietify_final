-- ============================================================
-- Fix: Deny anonymous access to all sensitive tables
-- ============================================================
-- Supabase Lint: "No RLS" / unprotected anon access
--
-- These tables have RLS enabled and authenticated-only policies,
-- but lack an explicit "TO anon USING (false)" policy.
-- Without it, the anon role falls through to "no matching policy"
-- which in Supabase means implicit deny — but Supabase Lint still
-- flags it as a potential misconfiguration.
--
-- Adding explicit anon deny policies:
--   1. Makes intent crystal clear
--   2. Satisfies Supabase Lint checks
--   3. Provides defense-in-depth against future policy changes
--
-- Tables intentionally NOT included here (they have public read):
--   - public.vpi_index       (VPI index publicly readable by design)
--   - public.ecosystem_apps  (app directory publicly readable)
--   - public.faq_articles    (FAQ publicly readable)
--   - public.listings        (rental listings publicly viewable)
--   - public.buildings       (building info for tenant portal)
--   - public.units           (unit info for tenant portal)
--   - public.profiles        (profile info for tenant portal)
--   - public.tasks           (task info for tenant portal)
--   - public.utility_costs   (utility info for tenant portal)
-- ============================================================

-- AI / Conversations
CREATE POLICY "Deny anonymous access to ai_conversations"
ON public.ai_conversations FOR ALL TO anon USING (false);

-- Audit
CREATE POLICY "Deny anonymous access to audit_logs"
ON public.audit_logs FOR ALL TO anon USING (false);

-- Banking / FinAPI
CREATE POLICY "Deny anonymous access to bank_accounts"
ON public.bank_accounts FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to bank_transactions"
ON public.bank_transactions FOR ALL TO anon USING (false);

-- Calendar
CREATE POLICY "Deny anonymous access to calendar_events"
ON public.calendar_events FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to calendar_ical_tokens"
ON public.calendar_ical_tokens FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to calendar_reminders"
ON public.calendar_reminders FOR ALL TO anon USING (false);

-- CO2
CREATE POLICY "Deny anonymous access to co2_calculations"
ON public.co2_calculations FOR ALL TO anon USING (false);

-- Consent / GDPR
CREATE POLICY "Deny anonymous access to consent_records"
ON public.consent_records FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to gdpr_requests"
ON public.gdpr_requests FOR ALL TO anon USING (false);

-- Cost types
CREATE POLICY "Deny anonymous access to cost_types"
ON public.cost_types FOR ALL TO anon USING (false);

-- Documents (OCR / requests)
CREATE POLICY "Deny anonymous access to document_ocr_results"
ON public.document_ocr_results FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to document_requests"
ON public.document_requests FOR ALL TO anon USING (false);

-- Ecosystem referrals
CREATE POLICY "Deny anonymous access to ecosystem_referrals"
ON public.ecosystem_referrals FOR ALL TO anon USING (false);

-- ELSTER / Tax
CREATE POLICY "Deny anonymous access to elster_certificates"
ON public.elster_certificates FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to elster_notices"
ON public.elster_notices FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to elster_settings"
ON public.elster_settings FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to elster_submissions"
ON public.elster_submissions FOR ALL TO anon USING (false);

-- Email
CREATE POLICY "Deny anonymous access to email_log"
ON public.email_log FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to email_templates"
ON public.email_templates FOR ALL TO anon USING (false);

-- Energy certificates
CREATE POLICY "Deny anonymous access to energy_certificates"
ON public.energy_certificates FOR ALL TO anon USING (false);

-- E-Signature
CREATE POLICY "Deny anonymous access to esignature_events"
ON public.esignature_events FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to esignature_orders"
ON public.esignature_orders FOR ALL TO anon USING (false);

-- FinAPI connections
CREATE POLICY "Deny anonymous access to finapi_connections"
ON public.finapi_connections FOR ALL TO anon USING (false);

-- Handover protocols
CREATE POLICY "Deny anonymous access to handover_defects"
ON public.handover_defects FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to handover_keys"
ON public.handover_keys FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to handover_protocols"
ON public.handover_protocols FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to handover_rooms"
ON public.handover_rooms FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to handover_signatures"
ON public.handover_signatures FOR ALL TO anon USING (false);

-- Hausmeister sync
CREATE POLICY "Deny anonymous access to hausmeister_sync_map"
ON public.hausmeister_sync_map FOR ALL TO anon USING (false);

-- Inbound email
CREATE POLICY "Deny anonymous access to inbound_emails"
ON public.inbound_emails FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to inbound_email_addresses"
ON public.inbound_email_addresses FOR ALL TO anon USING (false);

-- KdU rates
CREATE POLICY "Deny anonymous access to kdu_rates"
ON public.kdu_rates FOR ALL TO anon USING (false);

-- Lease rent settings
CREATE POLICY "Deny anonymous access to lease_rent_settings"
ON public.lease_rent_settings FOR ALL TO anon USING (false);

-- Letter / postal
CREATE POLICY "Deny anonymous access to letter_automation_rules"
ON public.letter_automation_rules FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to letter_orders"
ON public.letter_orders FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to letter_settings"
ON public.letter_settings FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to letter_templates"
ON public.letter_templates FOR ALL TO anon USING (false);

-- Listings / inquiries
CREATE POLICY "Deny anonymous access to listing_inquiries"
ON public.listing_inquiries FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to listing_portals"
ON public.listing_portals FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to listing_settings"
ON public.listing_settings FOR ALL TO anon USING (false);

-- Meters / readings
CREATE POLICY "Deny anonymous access to meter_readings"
ON public.meter_readings FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to meters"
ON public.meters FOR ALL TO anon USING (false);

-- Notifications
CREATE POLICY "Deny anonymous access to notification_preferences"
ON public.notification_preferences FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to notification_settings"
ON public.notification_settings FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to notifications"
ON public.notifications FOR ALL TO anon USING (false);

-- Onboarding
CREATE POLICY "Deny anonymous access to onboarding_progress"
ON public.onboarding_progress FOR ALL TO anon USING (false);

-- Operating costs
CREATE POLICY "Deny anonymous access to operating_cost_items"
ON public.operating_cost_items FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to operating_cost_statements"
ON public.operating_cost_statements FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to operating_cost_tenant_results"
ON public.operating_cost_tenant_results FOR ALL TO anon USING (false);

-- Org memberships
CREATE POLICY "Deny anonymous access to org_memberships"
ON public.org_memberships FOR ALL TO anon USING (false);

-- Portal connections
CREATE POLICY "Deny anonymous access to portal_connections"
ON public.portal_connections FOR ALL TO anon USING (false);

-- Push subscriptions
CREATE POLICY "Deny anonymous access to push_subscriptions"
ON public.push_subscriptions FOR ALL TO anon USING (false);

-- Rent adjustments
CREATE POLICY "Deny anonymous access to rent_adjustments"
ON public.rent_adjustments FOR ALL TO anon USING (false);

-- Rental offers
CREATE POLICY "Deny anonymous access to rental_offers"
ON public.rental_offers FOR ALL TO anon USING (false);

-- Tasks (activities, attachments, comments)
CREATE POLICY "Deny anonymous access to task_activities"
ON public.task_activities FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to task_attachments"
ON public.task_attachments FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to task_comments"
ON public.task_comments FOR ALL TO anon USING (false);

-- Tax documents
CREATE POLICY "Deny anonymous access to tax_documents"
ON public.tax_documents FOR ALL TO anon USING (false);

-- Tenant unit access
CREATE POLICY "Deny anonymous access to tenant_unit_access"
ON public.tenant_unit_access FOR ALL TO anon USING (false);

-- Transaction rules
CREATE POLICY "Deny anonymous access to transaction_rules"
ON public.transaction_rules FOR ALL TO anon USING (false);

-- WhatsApp
CREATE POLICY "Deny anonymous access to whatsapp_broadcasts"
ON public.whatsapp_broadcasts FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to whatsapp_contacts"
ON public.whatsapp_contacts FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to whatsapp_messages"
ON public.whatsapp_messages FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to whatsapp_settings"
ON public.whatsapp_settings FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to whatsapp_templates"
ON public.whatsapp_templates FOR ALL TO anon USING (false);

-- Listings (auth-only, no public portal access)
CREATE POLICY "Deny anonymous access to listings"
ON public.listings FOR ALL TO anon USING (false);

-- Core tables: upgrade from FOR SELECT to FOR ALL anon deny
-- (existing policies only block SELECT; INSERT/UPDATE/DELETE also need explicit denial)
CREATE POLICY "Deny anonymous write access to buildings"
ON public.buildings FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Deny anonymous write access to profiles"
ON public.profiles FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Deny anonymous write access to tasks"
ON public.tasks FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Deny anonymous write access to units"
ON public.units FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Deny anonymous write access to utility_costs"
ON public.utility_costs FOR INSERT TO anon WITH CHECK (false);

-- Workflows
CREATE POLICY "Deny anonymous access to workflow_executions"
ON public.workflow_executions FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access to workflows"
ON public.workflows FOR ALL TO anon USING (false);
