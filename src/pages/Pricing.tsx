import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { PLANS, Plan } from '@/config/plans';
import { BillingToggle } from '@/components/subscription/BillingToggle';
import { PricingCard } from '@/components/subscription/PricingCard';

export default function Pricing() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { plan: currentPlan, isLoading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    // Not logged in -> redirect to register
    if (!user) {
      navigate('/register');
      return;
    }

    // Starter plan -> no action needed
    if (plan.id === 'starter') {
      toast({
        title: 'Starter Plan',
        description: 'Sie nutzen bereits den Starter Plan.',
      });
      return;
    }

    // Current plan -> no action
    if (plan.id === currentPlan.id) {
      return;
    }

    // Downgrade -> open customer portal
    if (getPlanRank(plan.id) < getPlanRank(currentPlan.id)) {
      await openCustomerPortal();
      return;
    }

    // Upgrade -> create checkout session
    await createCheckoutSession(plan);
  };

  const createCheckoutSession = async (plan: Plan) => {
    if (!session?.access_token) {
      toast({
        title: 'Fehler',
        description: 'Bitte melden Sie sich an.',
        variant: 'destructive',
      });
      return;
    }

    setCheckoutLoading(plan.id);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: plan.priceId,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/pricing`,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Fehler',
        description: 'Checkout konnte nicht gestartet werden.',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      toast({
        title: 'Fehler',
        description: 'Bitte melden Sie sich an.',
        variant: 'destructive',
      });
      return;
    }

    setCheckoutLoading('portal');

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {
          returnUrl: `${window.location.origin}/pricing`,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: 'Fehler',
        description: 'Kundenportal konnte nicht geöffnet werden.',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Vermietify</span>
          </div>
          {!user && (
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-medium hover:underline"
              >
                Anmelden
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Registrieren
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Wählen Sie Ihren Plan</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Finden Sie den perfekten Plan für Ihre Immobilienverwaltung. 
            Alle Pläne können jederzeit geändert werden.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              currentPlanId={currentPlan.id}
              isLoggedIn={!!user}
              isLoading={checkoutLoading === plan.id || subscriptionLoading}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Häufige Fragen</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Kann ich meinen Plan jederzeit ändern?</h3>
              <p className="text-muted-foreground">
                Ja, Sie können jederzeit upgraden oder downgraden. Bei einem Upgrade wird der neue Preis 
                anteilig berechnet. Bei einem Downgrade wird das Guthaben auf die nächste Rechnung angerechnet.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Wie funktioniert die Abrechnung?</h3>
              <p className="text-muted-foreground">
                Die Abrechnung erfolgt monatlich oder jährlich im Voraus. Bei jährlicher Zahlung 
                sparen Sie 20% gegenüber der monatlichen Zahlung.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Kann ich kündigen?</h3>
              <p className="text-muted-foreground">
                Ja, Sie können jederzeit über das Kundenportal kündigen. Ihr Zugang bleibt bis zum 
                Ende der bezahlten Periode aktiv.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getPlanRank(planId: string): number {
  const ranks: Record<string, number> = {
    starter: 0,
    basic: 1,
    pro: 2,
    enterprise: 3,
  };
  return ranks[planId] ?? 0;
}
