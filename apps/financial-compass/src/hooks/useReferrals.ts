import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  reward_applied: boolean;
  created_at: string;
  converted_at: string | null;
}

interface ReferralStats {
  total_sent: number;
  total_converted: number;
  total_rewards: number;
  savings_eur: number;
}

export function useReferrals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    total_sent: 0,
    total_converted: 0,
    total_rewards: 0,
    savings_eur: 0,
  });
  const [loading, setLoading] = useState(true);

  const generateCode = useCallback(() => {
    // Generate a short unique code from user id
    if (!user) return '';
    const base = user.id.replace(/-/g, '').substring(0, 8).toUpperCase();
    return `FIN-${base}`;
  }, [user]);

  const ensureReferralCode = useCallback(async () => {
    if (!user) return;

    // Check if profile already has a referral code
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    if (profile?.referral_code) {
      setReferralCode(profile.referral_code);
    } else {
      const code = generateCode();
      await supabase
        .from('profiles')
        .update({ referral_code: code })
        .eq('id', user.id);
      setReferralCode(code);
    }
  }, [user, generateCode]);

  const fetchReferrals = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const refs = (data || []) as Referral[];
      setReferrals(refs);

      const converted = refs.filter((r) => r.status === 'converted').length;
      const rewards = refs.filter((r) => r.reward_applied).length;

      setStats({
        total_sent: refs.length,
        total_converted: converted,
        total_rewards: rewards,
        savings_eur: rewards * 9.99, // Basic plan price per free month
      });
    } catch (err) {
      console.error('Error fetching referrals:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    ensureReferralCode();
    fetchReferrals();
  }, [ensureReferralCode, fetchReferrals]);

  const createReferral = async (email: string) => {
    if (!user || !referralCode) return;

    try {
      const { error } = await supabase.from('referrals').insert({
        referrer_user_id: user.id,
        referred_email: email.toLowerCase(),
        referral_code: `${referralCode}-${Date.now().toString(36)}`,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Einladung erstellt',
        description: `Referral-Link für ${email} wurde generiert.`,
      });

      await fetchReferrals();
    } catch (err) {
      console.error('Error creating referral:', err);
      toast({
        title: 'Fehler',
        description: 'Referral konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    }
  };

  const copyReferralLink = () => {
    if (!referralCode) return;
    const link = `https://fintutto-firma.lovable.app/registrieren?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link kopiert!',
      description: 'Der Referral-Link wurde in die Zwischenablage kopiert.',
    });
  };

  return {
    referralCode,
    referrals,
    stats,
    loading,
    createReferral,
    copyReferralLink,
    fetchReferrals,
  };
}
