import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plan } from '@/config/plans';

interface PricingCardProps {
  plan: Plan;
  billingPeriod: 'monthly' | 'yearly';
  currentPlanId: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  onSelect: (plan: Plan) => void;
}

export function PricingCard({
  plan,
  billingPeriod,
  currentPlanId,
  isLoggedIn,
  isLoading,
  onSelect,
}: PricingCardProps) {
  const price = billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceYearly / 12;
  const isCurrentPlan = currentPlanId === plan.id;
  const isUpgrade = getPlanRank(plan.id) > getPlanRank(currentPlanId);
  const isDowngrade = getPlanRank(plan.id) < getPlanRank(currentPlanId);
  const isStarter = plan.id === 'starter';

  const getButtonText = () => {
    if (!isLoggedIn) return 'Registrieren';
    if (isCurrentPlan) return 'Aktueller Plan';
    if (isStarter) return 'Kostenlos starten';
    if (isUpgrade) return 'Upgrade';
    if (isDowngrade) return 'Downgrade';
    return 'Auswählen';
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'secondary' as const;
    if (plan.popular) return 'default' as const;
    return 'outline' as const;
  };

  return (
    <Card
      className={cn(
        'relative flex flex-col transition-all duration-200',
        plan.popular && 'border-primary shadow-lg scale-105',
        isCurrentPlan && 'border-primary bg-accent/50'
      )}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Beliebt
        </Badge>
      )}
      {isCurrentPlan && (
        <Badge variant="secondary" className="absolute -top-3 right-4 bg-accent text-accent-foreground">
          Ihr Plan
        </Badge>
      )}
      
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">
              {price === 0 ? '0' : price.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-muted-foreground">€</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {billingPeriod === 'monthly' ? 'pro Monat' : 'pro Monat, jährlich abgerechnet'}
          </p>
          {billingPeriod === 'yearly' && plan.priceMonthly > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className="line-through">{plan.priceMonthly.toFixed(2).replace('.', ',')} €</span>
              {' '}/ Monat
            </p>
          )}
        </div>
        
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button
          variant={getButtonVariant()}
          className="w-full"
          disabled={isCurrentPlan || isLoading}
          onClick={() => onSelect(plan)}
        >
          {isLoading ? 'Wird geladen...' : getButtonText()}
        </Button>
      </CardFooter>
    </Card>
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
