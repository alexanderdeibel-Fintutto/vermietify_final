-- Add new columns to companies table for multi-tenant enhancement
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_form text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS vat_id text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS chart_of_accounts text DEFAULT 'skr03';