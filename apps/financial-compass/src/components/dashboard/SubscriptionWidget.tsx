import { useSubscription, PLAN_CONFIG } from '@/hooks/useSubscription';
import { useReferrals } from '@/hooks/useReferrals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Gift, Euro, Users, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function SubscriptionWidget() {
  const { subscription, loading: subLoading } = useSubscription();
  const { stats, loading: refLoading } = useReferrals();
  const navigate = useNavigate();

  const planConfig = PLAN_CONFIG[subscription.plan];
  const isPaid = subscription.plan !== 'free';

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  if (subLoading && refLoading) {
    return (
      <Card className="glass">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            Ihr Plan
          </span>
          <Badge
            className={cn(
              'text-xs',
              isPaid
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {planConfig.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Info */}
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">
            {planConfig.price === 0 ? 'Kostenlos' : formatCurrency(planConfig.price)}
          </span>
          {planConfig.price > 0 && (
            <span className="text-xs text-muted-foreground">/Monat</span>
          )}
        </div>

        {subscription.subscription_end && (
          <p className="text-xs text-muted-foreground">
            {subscription.is_trial ? 'Testphase bis' : 'Nächste Abrechnung'}:{' '}
            {new Date(subscription.subscription_end).toLocaleDateString('de-DE')}
          </p>
        )}

        {/* Referral Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          <div className="text-center">
            <Users className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
            <p className="text-lg font-bold">{stats.total_converted}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Referrals</p>
          </div>
          <div className="text-center">
            <Gift className="h-3.5 w-3.5 text-primary mx-auto mb-0.5" />
            <p className="text-lg font-bold">{stats.total_rewards}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Gratis-Monate</p>
          </div>
          <div className="text-center">
            <Euro className="h-3.5 w-3.5 text-success mx-auto mb-0.5" />
            <p className="text-lg font-bold text-success">{formatCurrency(stats.savings_eur)}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Gespart</p>
          </div>
        </div>

        {/* CTA */}
        <Button
          variant={isPaid ? 'outline' : 'default'}
          size="sm"
          className="w-full"
          onClick={() => navigate('/einstellungen?tab=billing')}
        >
          {isPaid ? 'Abo verwalten' : 'Upgrade'}
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
