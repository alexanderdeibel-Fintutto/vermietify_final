import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function BankCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status');
  const [syncing, setSyncing] = useState(status === 'success');
  const [progress, setProgress] = useState(0);
  const [syncStep, setSyncStep] = useState('');

  useEffect(() => {
    if (status === 'success') {
      syncTransactions();
    }
  }, [status]);

  const syncTransactions = async () => {
    setSyncing(true);
    
    // Simulate sync steps
    const steps = [
      { label: 'Verbindung wird hergestellt...', duration: 1000 },
      { label: 'Kontoinformationen werden abgerufen...', duration: 1500 },
      { label: 'Transaktionen werden synchronisiert...', duration: 2000 },
      { label: 'Kategorisierung läuft...', duration: 1000 },
      { label: 'Abschluss...', duration: 500 },
    ];

    let currentProgress = 0;
    const progressPerStep = 100 / steps.length;

    for (const step of steps) {
      setSyncStep(step.label);
      await new Promise(r => setTimeout(r, step.duration));
      currentProgress += progressPerStep;
      setProgress(Math.min(currentProgress, 100));
    }

    setSyncing(false);
    setProgress(100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12 px-6">
          {syncing ? (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
              <h2 className="text-xl font-semibold mb-2">Transaktionen werden synchronisiert</h2>
              <p className="text-muted-foreground text-center mb-6">{syncStep}</p>
              <Progress value={progress} className="w-full h-2" />
              <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}%</p>
            </>
          ) : status === 'success' ? (
            <>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Bank erfolgreich verbunden!</h2>
              <p className="text-muted-foreground text-center mb-6">
                Ihre Bankverbindung wurde hergestellt und die Transaktionen wurden importiert.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/bankkonten')}>
                  Zu den Bankkonten
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Verbindung abgebrochen</h2>
              <p className="text-muted-foreground text-center mb-6">
                Die Bankverbindung wurde nicht hergestellt. Sie können es jederzeit erneut versuchen.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/bankverbindung')}>
                  Erneut versuchen
                </Button>
                <Button variant="ghost" onClick={() => navigate('/bankkonten')}>
                  Zurück
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
