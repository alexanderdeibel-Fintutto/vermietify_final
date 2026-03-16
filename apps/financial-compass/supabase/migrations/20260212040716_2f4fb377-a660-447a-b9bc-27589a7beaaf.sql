
-- Referral tracking table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referred_email TEXT NOT NULL,
  referred_user_id UUID,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_type TEXT DEFAULT 'free_month',
  reward_applied BOOLEAN DEFAULT false,
  stripe_coupon_id TEXT,
  invitation_id UUID REFERENCES public.app_invitations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  reward_applied_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer)
CREATE POLICY "Users can view own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_user_id);

-- Users can create referrals
CREATE POLICY "Users can create referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_user_id);

-- Users can update own referrals
CREATE POLICY "Users can update own referrals"
ON public.referrals
FOR UPDATE
USING (auth.uid() = referrer_user_id);

-- Add referral_code column to profiles for each user's unique referral code
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Add referred_by column to profiles to track who referred this user
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Create index for faster lookups
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referred_email ON public.referrals(referred_email);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
