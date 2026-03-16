import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import fintuttoLogo from '@/assets/fintutto-animated.svg';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/passwort-zuruecksetzen`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'radial-gradient(ellipse at 50% 100%, #e8b830 0%, #d09030 20%, #a06040 35%, #6a3080 55%, #2d1850 75%, #0f0f1a 100%)' }}>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <img src={fintuttoLogo} alt="Fintutto Logo" className="h-16 w-16 rounded-xl mx-auto mb-2" />
          <h1 className="text-4xl font-bold gradient-text mb-2">Fintutto</h1>
        </div>

        <Card className="glass border-white/20 bg-black/30 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Passwort vergessen</CardTitle>
            <CardDescription>
              {sent
                ? 'Prüfen Sie Ihr E-Mail-Postfach'
                : 'Geben Sie Ihre E-Mail-Adresse ein, um Ihr Passwort zurückzusetzen'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Falls ein Konto mit <strong>{email}</strong> existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück zur Anmeldung
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@firma.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-secondary/50"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Link zum Zurücksetzen senden
                </Button>

                <Link to="/login" className="block">
                  <Button variant="ghost" className="w-full text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück zur Anmeldung
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
