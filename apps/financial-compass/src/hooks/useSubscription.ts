import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionInfo {
  subscribed: boolean;
  plan: 'free' | 'basic' | 'pro';
  product_id?: string;
  subscription_end?: string;
  is_trial?: boolean;
}

export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    productId: null,
    features: [
      '1 Firma',
      '50 Buchungen/Monat',
      '10 Belege/Monat',
      'Basis-Berichte',
    ],
  },
  basic: {
    name: 'Basic',
    price: 9.99,
    yearlyPrice: 95.90,
    priceId: 'price_1Szr9X52lqSgjCzeFZ88yFlw',
    yearlyPriceId: 'price_1T0nb052lqSgjCzeR8a7rmP1',
    productId: 'prod_TxmipPdak8JwmT',
    features: [
      'Unbegrenzte Firmen',
      'Unbegrenzte Buchungen',
      'Unbegrenzte Belege',
      'Bankanbindung',
      'DATEV-Export',
      'Erweiterte Berichte',
    ],
  },
  pro: {
    name: 'Pro',
    price: 19.99,
    yearlyPrice: 191.90,
    priceId: 'price_1Szr9Z52lqSgjCzeY83WUERb',
    yearlyPriceId: 'price_1T0nb152lqSgjCze1ae7RGdJ',
    productId: 'prod_Txmjs0RZOVqFzS',
    features: [
      'Alles aus Basic',
      'KI-Beleganalyse',
      'SEPA-Zahlungen',
      'E-Mail-Postfach',
      'Steuerberater-Portal',
      'Automatisierung',
      'Prioritäts-Support',
    ],
  },
} as const;

export const REFERRAL_COUPON_ID = 'evjRLCRd';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    subscribed: false,
    plan: 'free',
  });
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({ subscribed: false, plan: 'free' });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data as SubscriptionInfo);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setSubscription({ subscribed: false, plan: 'free' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    // Refresh every 60 seconds
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const startCheckout = async (priceId: string, couponId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, couponId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      throw err;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening portal:', err);
      throw err;
    }
  };

  return {
    subscription,
    loading,
    checkSubscription,
    startCheckout,
    openCustomerPortal,
  };
}
