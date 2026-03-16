import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Shield, Users, Gift } from 'lucide-react';
import fintuttoLogo from '@/assets/fintutto-animated.svg';

export default function Login() {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setError(null);
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await signUp(email, password, fullName, referralCode || undefined);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 100%, #e8a040 0%, #d08030 10%, #b06040 22%, #8a4060 36%, #5a2878 52%, #3d2060 70%, #1a1535 100%)' }}>
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-12 flex items-center gap-5">
            <img src={fintuttoLogo} alt="Fintutto Logo" className="h-20 w-20 rounded-2xl shrink-0" />
            <div>
              <h1 className="text-5xl font-bold text-white leading-tight">Fintutto</h1>
              <p className="text-xl text-white/80">
                Ihre professionelle Finanzbuchhaltung
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-white">Echtzeit-Übersicht</h3>
                <p className="text-sm text-white/70">
                  Alle Finanzdaten auf einen Blick
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-white">Sichere Daten</h3>
                <p className="text-sm text-white/70">
                  Enterprise-Grade Sicherheit
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-white">Multi-Mandanten</h3>
                <p className="text-sm text-white/70">
                  Mehrere Firmen verwalten
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden text-center mb-8">
            <img src={fintuttoLogo} alt="Fintutto Logo" className="h-16 w-16 rounded-xl mx-auto mb-2" />
            <h1 className="text-4xl font-bold gradient-text mb-2">Fintutto</h1>
            <p className="text-muted-foreground">Ihre Finanzbuchhaltung</p>
          </div>

          <Card className="glass border-white/20 bg-black/30 backdrop-blur-xl">
            {referralCode && (
              <div className="flex items-center gap-2 px-6 pt-4 pb-0">
                <div className="flex items-center gap-2 w-full rounded-lg bg-primary/20 border border-primary/30 px-3 py-2 text-sm text-primary">
                  <Gift className="h-4 w-4 shrink-0" />
                  <span>Sie wurden eingeladen! Registrieren Sie sich für exklusive Vorteile.</span>
                </div>
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Willkommen</CardTitle>
              <CardDescription>
                Melden Sie sich an oder erstellen Sie ein Konto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={referralCode ? 'register' : 'login'} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Anmelden</TabsTrigger>
                  <TabsTrigger value="register">Registrieren</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="password">Passwort</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                      Anmelden
                    </Button>

                    <div className="text-center">
                      <Link to="/passwort-vergessen" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        Passwort vergessen?
                      </Link>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Max Mustermann"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerEmail">E-Mail</Label>
                      <Input
                        id="registerEmail"
                        type="email"
                        placeholder="name@firma.de"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerPassword">Passwort</Label>
                      <Input
                        id="registerPassword"
                        type="password"
                        placeholder="Mindestens 6 Zeichen"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-secondary/50"
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="border-success/50 bg-success/10">
                        <AlertDescription className="text-success">{success}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Registrieren
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* OAuth Divider + Buttons */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/15" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black/30 px-2 text-muted-foreground">oder</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-white/5 border-white/15 hover:bg-white/10"
                    onClick={() => handleOAuthSignIn('google')}
                    disabled={!!oauthLoading}
                  >
                    {oauthLoading === 'google' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    )}
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-white/5 border-white/15 hover:bg-white/10"
                    onClick={() => handleOAuthSignIn('apple')}
                    disabled={!!oauthLoading}
                  >
                    {oauthLoading === 'apple' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                    )}
                    Apple
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
