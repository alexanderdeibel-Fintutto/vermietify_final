
-- Remove incorrect unique constraint on referral_code (multiple referrals can share the same code)
ALTER TABLE public.referrals DROP CONSTRAINT referrals_referral_code_key;
