import { useState } from 'react';
import { ReferralLeaderboard } from './ReferralLeaderboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSubscription, PLAN_CONFIG, REFERRAL_COUPON_ID } from '@/hooks/useSubscription';
import { useReferrals } from '@/hooks/useReferrals';
import { useCompany } from '@/contexts/CompanyContext';
import {
  Check,
  CreditCard,
  Copy,
  Gift,
  Users,
  Euro,
  ExternalLink,
  Sparkles,
  Crown,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BillingTab() {
  const { toast } = useToast();
  const { subscription, loading: subLoading, startCheckout, openCustomerPortal, checkSubscription } = useSubscription();
  const { referralCode, referrals, stats, loading: refLoading, createReferral, copyReferralLink } = useReferrals();
  const { companies } = useCompany();
  const [inviteEmail, setInviteEmail] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: 'basic' | 'pro') => {
    const priceId = PLAN_CONFIG[plan].priceId;
    if (!priceId) return;
    setCheckoutLoading(plan);
    try {
      await startCheckout(priceId);
    } catch {
      toast({ title: 'Fehler', description: 'Checkout konnte nicht gestartet werden.', variant: 'destructive' });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    await createReferral(inviteEmail.trim());
    setInviteEmail('');
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  const currentPlan = subscription.plan;

  return (
    <div className="space-y-6">
      {/* Plan Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Verfügbare Pläne</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.entries(PLAN_CONFIG) as [string, typeof PLAN_CONFIG[keyof typeof PLAN_CONFIG]][]).map(
            ([key, plan]) => {
              const isActive = currentPlan === key;
              const isPro = key === 'pro';
              return (
                <Card
                  key={key}
                  className={cn(
                    'relative overflow-hidden transition-all',
                    isActive && 'border-primary/50 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.3)]',
                    isPro && !isActive && 'border-accent/30'
                  )}
                >
                  {isPro && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Empfohlen
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-0 left-0 bg-success text-white text-xs px-3 py-1 rounded-br-lg font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Ihr Plan
                    </div>
                  )}
                  <CardHeader className="pb-3 pt-8">
                    <CardTitle className="flex items-center gap-2">
                      {isPro ? <Crown className="h-5 w-5 text-primary" /> : key === 'basic' ? <CreditCard className="h-5 w-5" /> : null}
                      {plan.name}
                    </CardTitle>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold">
                        {plan.price === 0 ? 'Kostenlos' : formatCurrency(plan.price)}
                      </span>
                      {plan.price > 0 && <span className="text-sm text-muted-foreground">/Monat</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {isActive ? (
                      subscription.subscribed ? (
                        <Button variant="outline" className="w-full" onClick={openCustomerPortal}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abo verwalten
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          Aktueller Plan
                        </Button>
                      )
                    ) : plan.price > 0 ? (
                      <Button
                        className="w-full"
                        variant={isPro ? 'default' : 'outline'}
                        onClick={() => handleCheckout(key as 'basic' | 'pro')}
                        disabled={!!checkoutLoading}
                      >
                        {checkoutLoading === key ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4 mr-2" />
                        )}
                        {currentPlan !== 'free' ? 'Wechseln' : 'Upgrade'}
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      </div>

      {/* Subscription Details */}
      {subscription.subscribed && subscription.subscription_end && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">Abo-Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nächste Abrechnung</p>
                <p className="font-medium">
                  {new Date(subscription.subscription_end).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-success/20 text-success border-0">
                  {subscription.is_trial ? 'Testphase' : 'Aktiv'}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={checkSubscription}>
                Status prüfen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Freunde werben – 1 Monat gratis
          </CardTitle>
          <CardDescription>
            Empfehlen Sie Fintutto weiter und erhalten Sie für jede erfolgreiche Empfehlung einen kostenlosen Monat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ihr Referral-Link</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={referralCode ? `https://fintutto-firma.lovable.app/registrieren?ref=${referralCode}` : 'Wird geladen...'}
                className="bg-muted/50 font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={copyReferralLink} disabled={!referralCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Invite by Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Per E-Mail einladen</label>
            <div className="flex gap-2">
              <Input
                placeholder="freund@beispiel.de"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
              <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                Einladen
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border bg-card/50 text-center">
              <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.total_sent}</p>
              <p className="text-xs text-muted-foreground">Eingeladen</p>
            </div>
            <div className="p-3 rounded-lg border bg-card/50 text-center">
              <Check className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.total_converted}</p>
              <p className="text-xs text-muted-foreground">Konvertiert</p>
            </div>
            <div className="p-3 rounded-lg border bg-card/50 text-center">
              <Gift className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.total_rewards}</p>
              <p className="text-xs text-muted-foreground">Gratis-Monate</p>
            </div>
            <div className="p-3 rounded-lg border bg-success/10 text-center">
              <Euro className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-2xl font-bold text-success">{formatCurrency(stats.savings_eur)}</p>
              <p className="text-xs text-muted-foreground">Gespart</p>
            </div>
          </div>

          {/* Referral List */}
          {referrals.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Ihre Empfehlungen</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div>
                      <p className="text-sm font-medium">{ref.referred_email}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ref.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          ref.status === 'converted' && 'bg-success/20 text-success',
                          ref.status === 'pending' && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {ref.status === 'converted' ? '✅ Konvertiert' : '⏳ Ausstehend'}
                      </Badge>
                      {ref.reward_applied && (
                        <Badge className="bg-primary/20 text-primary border-0 text-xs">
                          <Gift className="h-3 w-3 mr-1" />
                          Belohnt
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Leaderboard */}
      <ReferralLeaderboard />

      {/* Usage Stats */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Nutzungsübersicht</CardTitle>
          <CardDescription>Ihre aktuellen Limits und Verbrauch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Users, label: 'Firmen', value: companies.length, limit: currentPlan === 'free' ? '1' : '∞' },
              { icon: CreditCard, label: 'Buchungen', value: '—', limit: currentPlan === 'free' ? '50/Mo' : '∞' },
              { icon: Gift, label: 'Belege', value: '—', limit: currentPlan === 'free' ? '10/Mo' : '∞' },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-lg border bg-card/50">
                <div className="flex items-center gap-3 mb-2">
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">Limit: {item.limit}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
