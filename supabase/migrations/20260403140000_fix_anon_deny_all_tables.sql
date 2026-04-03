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
DROP POLICY IF EXISTS "Deny anonymous access to ai_conversations" ON public.ai_conversations;
CREATE POLICY "Deny anonymous access to ai_conversations"
ON public.ai_conversations FOR ALL TO anon USING (false);

-- Audit
DROP POLICY IF EXISTS "Deny anonymous access to audit_logs" ON public.audit_logs;
CREATE POLICY "Deny anonymous access to audit_logs"
ON public.audit_logs FOR ALL TO anon USING (false);

-- Banking / FinAPI
DROP POLICY IF EXISTS "Deny anonymous access to bank_accounts" ON public.bank_accounts;
CREATE POLICY "Deny anonymous access to bank_accounts"
ON public.bank_accounts FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to bank_transactions" ON public.bank_transactions;
CREATE POLICY "Deny anonymous access to bank_transactions"
ON public.bank_transactions FOR ALL TO anon USING (false);

-- Calendar
DROP POLICY IF EXISTS "Deny anonymous access to calendar_events" ON public.calendar_events;
CREATE POLICY "Deny anonymous access to calendar_events"
ON public.calendar_events FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to calendar_ical_tokens" ON public.calendar_ical_tokens;
CREATE POLICY "Deny anonymous access to calendar_ical_tokens"
ON public.calendar_ical_tokens FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to calendar_reminders" ON public.calendar_reminders;
CREATE POLICY "Deny anonymous access to calendar_reminders"
ON public.calendar_reminders FOR ALL TO anon USING (false);

-- CO2
DROP POLICY IF EXISTS "Deny anonymous access to co2_calculations" ON public.co2_calculations;
CREATE POLICY "Deny anonymous access to co2_calculations"
ON public.co2_calculations FOR ALL TO anon USING (false);

-- Consent / GDPR
DROP POLICY IF EXISTS "Deny anonymous access to consent_records" ON public.consent_records;
CREATE POLICY "Deny anonymous access to consent_records"
ON public.consent_records FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to gdpr_requests" ON public.gdpr_requests;
CREATE POLICY "Deny anonymous access to gdpr_requests"
ON public.gdpr_requests FOR ALL TO anon USING (false);

-- Cost types
DROP POLICY IF EXISTS "Deny anonymous access to cost_types" ON public.cost_types;
CREATE POLICY "Deny anonymous access to cost_types"
ON public.cost_types FOR ALL TO anon USING (false);

-- Documents (OCR / requests)
DROP POLICY IF EXISTS "Deny anonymous access to document_ocr_results" ON public.document_ocr_results;
CREATE POLICY "Deny anonymous access to document_ocr_results"
ON public.document_ocr_results FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to document_requests" ON public.document_requests;
CREATE POLICY "Deny anonymous access to document_requests"
ON public.document_requests FOR ALL TO anon USING (false);

-- Ecosystem referrals
DROP POLICY IF EXISTS "Deny anonymous access to ecosystem_referrals" ON public.ecosystem_referrals;
CREATE POLICY "Deny anonymous access to ecosystem_referrals"
ON public.ecosystem_referrals FOR ALL TO anon USING (false);

-- ELSTER / Tax
DROP POLICY IF EXISTS "Deny anonymous access to elster_certificates" ON public.elster_certificates;
CREATE POLICY "Deny anonymous access to elster_certificates"
ON public.elster_certificates FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to elster_notices" ON public.elster_notices;
CREATE POLICY "Deny anonymous access to elster_notices"
ON public.elster_notices FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to elster_settings" ON public.elster_settings;
CREATE POLICY "Deny anonymous access to elster_settings"
ON public.elster_settings FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to elster_submissions" ON public.elster_submissions;
CREATE POLICY "Deny anonymous access to elster_submissions"
ON public.elster_submissions FOR ALL TO anon USING (false);

-- Email
DROP POLICY IF EXISTS "Deny anonymous access to email_log" ON public.email_log;
CREATE POLICY "Deny anonymous access to email_log"
ON public.email_log FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to email_templates" ON public.email_templates;
CREATE POLICY "Deny anonymous access to email_templates"
ON public.email_templates FOR ALL TO anon USING (false);

-- Energy certificates
DROP POLICY IF EXISTS "Deny anonymous access to energy_certificates" ON public.energy_certificates;
CREATE POLICY "Deny anonymous access to energy_certificates"
ON public.energy_certificates FOR ALL TO anon USING (false);

-- E-Signature
DROP POLICY IF EXISTS "Deny anonymous access to esignature_events" ON public.esignature_events;
CREATE POLICY "Deny anonymous access to esignature_events"
ON public.esignature_events FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to esignature_orders" ON public.esignature_orders;
CREATE POLICY "Deny anonymous access to esignature_orders"
ON public.esignature_orders FOR ALL TO anon USING (false);

-- FinAPI connections
DROP POLICY IF EXISTS "Deny anonymous access to finapi_connections" ON public.finapi_connections;
CREATE POLICY "Deny anonymous access to finapi_connections"
ON public.finapi_connections FOR ALL TO anon USING (false);

-- Handover protocols
DROP POLICY IF EXISTS "Deny anonymous access to handover_defects" ON public.handover_defects;
CREATE POLICY "Deny anonymous access to handover_defects"
ON public.handover_defects FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to handover_keys" ON public.handover_keys;
CREATE POLICY "Deny anonymous access to handover_keys"
ON public.handover_keys FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to handover_protocols" ON public.handover_protocols;
CREATE POLICY "Deny anonymous access to handover_protocols"
ON public.handover_protocols FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to handover_rooms" ON public.handover_rooms;
CREATE POLICY "Deny anonymous access to handover_rooms"
ON public.handover_rooms FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to handover_signatures" ON public.handover_signatures;
CREATE POLICY "Deny anonymous access to handover_signatures"
ON public.handover_signatures FOR ALL TO anon USING (false);

-- Hausmeister sync
DROP POLICY IF EXISTS "Deny anonymous access to hausmeister_sync_map" ON public.hausmeister_sync_map;
CREATE POLICY "Deny anonymous access to hausmeister_sync_map"
ON public.hausmeister_sync_map FOR ALL TO anon USING (false);

-- Inbound email
DROP POLICY IF EXISTS "Deny anonymous access to inbound_emails" ON public.inbound_emails;
CREATE POLICY "Deny anonymous access to inbound_emails"
ON public.inbound_emails FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to inbound_email_addresses" ON public.inbound_email_addresses;
CREATE POLICY "Deny anonymous access to inbound_email_addresses"
ON public.inbound_email_addresses FOR ALL TO anon USING (false);

-- KdU rates
DROP POLICY IF EXISTS "Deny anonymous access to kdu_rates" ON public.kdu_rates;
CREATE POLICY "Deny anonymous access to kdu_rates"
ON public.kdu_rates FOR ALL TO anon USING (false);

-- Lease rent settings
DROP POLICY IF EXISTS "Deny anonymous access to lease_rent_settings" ON public.lease_rent_settings;
CREATE POLICY "Deny anonymous access to lease_rent_settings"
ON public.lease_rent_settings FOR ALL TO anon USING (false);

-- Letter / postal
DROP POLICY IF EXISTS "Deny anonymous access to letter_automation_rules" ON public.letter_automation_rules;
CREATE POLICY "Deny anonymous access to letter_automation_rules"
ON public.letter_automation_rules FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to letter_orders" ON public.letter_orders;
CREATE POLICY "Deny anonymous access to letter_orders"
ON public.letter_orders FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to letter_settings" ON public.letter_settings;
CREATE POLICY "Deny anonymous access to letter_settings"
ON public.letter_settings FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to letter_templates" ON public.letter_templates;
CREATE POLICY "Deny anonymous access to letter_templates"
ON public.letter_templates FOR ALL TO anon USING (false);

-- Listings / inquiries
DROP POLICY IF EXISTS "Deny anonymous access to listing_inquiries" ON public.listing_inquiries;
CREATE POLICY "Deny anonymous access to listing_inquiries"
ON public.listing_inquiries FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to listing_portals" ON public.listing_portals;
CREATE POLICY "Deny anonymous access to listing_portals"
ON public.listing_portals FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to listing_settings" ON public.listing_settings;
CREATE POLICY "Deny anonymous access to listing_settings"
ON public.listing_settings FOR ALL TO anon USING (false);

-- Meters / readings
DROP POLICY IF EXISTS "Deny anonymous access to meter_readings" ON public.meter_readings;
CREATE POLICY "Deny anonymous access to meter_readings"
ON public.meter_readings FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to meters" ON public.meters;
CREATE POLICY "Deny anonymous access to meters"
ON public.meters FOR ALL TO anon USING (false);

-- Notifications
DROP POLICY IF EXISTS "Deny anonymous access to notification_preferences" ON public.notification_preferences;
CREATE POLICY "Deny anonymous access to notification_preferences"
ON public.notification_preferences FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to notification_settings" ON public.notification_settings;
CREATE POLICY "Deny anonymous access to notification_settings"
ON public.notification_settings FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to notifications" ON public.notifications;
CREATE POLICY "Deny anonymous access to notifications"
ON public.notifications FOR ALL TO anon USING (false);

-- Onboarding
DROP POLICY IF EXISTS "Deny anonymous access to onboarding_progress" ON public.onboarding_progress;
CREATE POLICY "Deny anonymous access to onboarding_progress"
ON public.onboarding_progress FOR ALL TO anon USING (false);

-- Operating costs
DROP POLICY IF EXISTS "Deny anonymous access to operating_cost_items" ON public.operating_cost_items;
CREATE POLICY "Deny anonymous access to operating_cost_items"
ON public.operating_cost_items FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to operating_cost_statements" ON public.operating_cost_statements;
CREATE POLICY "Deny anonymous access to operating_cost_statements"
ON public.operating_cost_statements FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to operating_cost_tenant_results" ON public.operating_cost_tenant_results;
CREATE POLICY "Deny anonymous access to operating_cost_tenant_results"
ON public.operating_cost_tenant_results FOR ALL TO anon USING (false);

-- Org memberships
DROP POLICY IF EXISTS "Deny anonymous access to org_memberships" ON public.org_memberships;
CREATE POLICY "Deny anonymous access to org_memberships"
ON public.org_memberships FOR ALL TO anon USING (false);

-- Portal connections
DROP POLICY IF EXISTS "Deny anonymous access to portal_connections" ON public.portal_connections;
CREATE POLICY "Deny anonymous access to portal_connections"
ON public.portal_connections FOR ALL TO anon USING (false);

-- Push subscriptions
DROP POLICY IF EXISTS "Deny anonymous access to push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Deny anonymous access to push_subscriptions"
ON public.push_subscriptions FOR ALL TO anon USING (false);

-- Rent adjustments
DROP POLICY IF EXISTS "Deny anonymous access to rent_adjustments" ON public.rent_adjustments;
CREATE POLICY "Deny anonymous access to rent_adjustments"
ON public.rent_adjustments FOR ALL TO anon USING (false);

-- Rental offers
DROP POLICY IF EXISTS "Deny anonymous access to rental_offers" ON public.rental_offers;
CREATE POLICY "Deny anonymous access to rental_offers"
ON public.rental_offers FOR ALL TO anon USING (false);

-- Tasks (activities, attachments, comments)
DROP POLICY IF EXISTS "Deny anonymous access to task_activities" ON public.task_activities;
CREATE POLICY "Deny anonymous access to task_activities"
ON public.task_activities FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to task_attachments" ON public.task_attachments;
CREATE POLICY "Deny anonymous access to task_attachments"
ON public.task_attachments FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to task_comments" ON public.task_comments;
CREATE POLICY "Deny anonymous access to task_comments"
ON public.task_comments FOR ALL TO anon USING (false);

-- Tax documents
DROP POLICY IF EXISTS "Deny anonymous access to tax_documents" ON public.tax_documents;
CREATE POLICY "Deny anonymous access to tax_documents"
ON public.tax_documents FOR ALL TO anon USING (false);

-- Tenant unit access
DROP POLICY IF EXISTS "Deny anonymous access to tenant_unit_access" ON public.tenant_unit_access;
CREATE POLICY "Deny anonymous access to tenant_unit_access"
ON public.tenant_unit_access FOR ALL TO anon USING (false);

-- Transaction rules
DROP POLICY IF EXISTS "Deny anonymous access to transaction_rules" ON public.transaction_rules;
CREATE POLICY "Deny anonymous access to transaction_rules"
ON public.transaction_rules FOR ALL TO anon USING (false);

-- WhatsApp
DROP POLICY IF EXISTS "Deny anonymous access to whatsapp_broadcasts" ON public.whatsapp_broadcasts;
CREATE POLICY "Deny anonymous access to whatsapp_broadcasts"
ON public.whatsapp_broadcasts FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to whatsapp_contacts" ON public.whatsapp_contacts;
CREATE POLICY "Deny anonymous access to whatsapp_contacts"
ON public.whatsapp_contacts FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Deny anonymous access to whatsapp_messages"
ON public.whatsapp_messages FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to whatsapp_settings" ON public.whatsapp_settings;
CREATE POLICY "Deny anonymous access to whatsapp_settings"
ON public.whatsapp_settings FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to whatsapp_templates" ON public.whatsapp_templates;
CREATE POLICY "Deny anonymous access to whatsapp_templates"
ON public.whatsapp_templates FOR ALL TO anon USING (false);

-- Listings (auth-only, no public portal access)
DROP POLICY IF EXISTS "Deny anonymous access to listings" ON public.listings;
CREATE POLICY "Deny anonymous access to listings"
ON public.listings FOR ALL TO anon USING (false);

-- Core tables: upgrade from FOR SELECT to FOR ALL anon deny
-- (existing policies only block SELECT; INSERT/UPDATE/DELETE also need explicit denial)
DROP POLICY IF EXISTS "Deny anonymous write access to buildings" ON public.buildings;
CREATE POLICY "Deny anonymous write access to buildings"
ON public.buildings FOR INSERT TO anon WITH CHECK (false);

DROP POLICY IF EXISTS "Deny anonymous write access to profiles" ON public.profiles;
CREATE POLICY "Deny anonymous write access to profiles"
ON public.profiles FOR INSERT TO anon WITH CHECK (false);

DROP POLICY IF EXISTS "Deny anonymous write access to tasks" ON public.tasks;
CREATE POLICY "Deny anonymous write access to tasks"
ON public.tasks FOR INSERT TO anon WITH CHECK (false);

DROP POLICY IF EXISTS "Deny anonymous write access to units" ON public.units;
CREATE POLICY "Deny anonymous write access to units"
ON public.units FOR INSERT TO anon WITH CHECK (false);

DROP POLICY IF EXISTS "Deny anonymous write access to utility_costs" ON public.utility_costs;
CREATE POLICY "Deny anonymous write access to utility_costs"
ON public.utility_costs FOR INSERT TO anon WITH CHECK (false);

-- Workflows
DROP POLICY IF EXISTS "Deny anonymous access to workflow_executions" ON public.workflow_executions;
CREATE POLICY "Deny anonymous access to workflow_executions"
ON public.workflow_executions FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anonymous access to workflows" ON public.workflows;
CREATE POLICY "Deny anonymous access to workflows"
ON public.workflows FOR ALL TO anon USING (false);
