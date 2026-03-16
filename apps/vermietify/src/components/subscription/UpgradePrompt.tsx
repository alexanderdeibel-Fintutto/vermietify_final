import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UpgradePromptProps {
  feature?: string;
  description?: string;
  requiredPlan?: 'basic' | 'pro' | 'business';
}

export function UpgradePrompt({
  feature = 'Diese Funktion',
  description,
  requiredPlan = 'pro',
}: UpgradePromptProps) {
  const navigate = useNavigate();

  const planNames: Record<string, string> = {
    basic: 'Basic',
    pro: 'Pro',
    business: 'Business',
  };

  return (
    <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/50">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">{planNames[requiredPlan]}-Feature</CardTitle>
        <CardDescription>
          {description || `${feature} ist im ${planNames[requiredPlan]}-Plan verfügbar.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button onClick={() => navigate('/pricing')} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Jetzt upgraden
        </Button>
      </CardContent>
    </Card>
  );
}
