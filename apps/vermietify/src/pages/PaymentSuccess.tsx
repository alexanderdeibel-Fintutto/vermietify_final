import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { MainLayout } from '@/components/layout/MainLayout';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { refetch, plan } = useSubscription();
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    // Refresh subscription status after successful payment
    refetch();
    
    // Stop confetti after 3 seconds
    const timer = setTimeout(() => setConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [refetch]);

  return (
    <MainLayout title="Zahlung erfolgreich">
      <div className="flex items-center justify-center min-h-[80vh] relative">
        {/* Confetti Effect */}
        {confetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: [
                    'hsl(var(--primary))',
                    'hsl(var(--secondary))',
                    'hsl(var(--accent))',
                    'hsl(var(--muted))',
                  ][Math.floor(Math.random() * 4)],
                  width: '10px',
                  height: '10px',
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                }}
              />
            ))}
          </div>
        )}

        <Card className="max-w-md w-full text-center shadow-lg">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
              Willkommen bei {plan.name}!
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </CardTitle>
            <CardDescription className="text-base">
              Ihre Zahlung war erfolgreich
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Vielen Dank für Ihr Vertrauen! Sie haben jetzt Zugriff auf alle 
              Features des {plan.name}-Plans.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <h4 className="font-semibold mb-2">Ihr Plan beinhaltet:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {plan.features.slice(0, 4).map((feature, i) => (
                  <li key={i}>✓ {feature}</li>
                ))}
              </ul>
            </div>

            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full gap-2"
              size="lg"
            >
              Zur App
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-in-out forwards;
        }
      `}</style>
    </MainLayout>
  );
}
