import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Loader2 } from "lucide-react";
import { organizationSchema } from "@/lib/validationSchemas";
import { sanitizeErrorMessage } from "@/lib/errorHandler";

export default function OrganizationSetup() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate input data
    const validationResult = organizationSchema.safeParse({
      name,
      address,
      city,
      postal_code: postalCode,
      phone,
      email,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      setError(firstError.message);
      setIsLoading(false);
      return;
    }

    try {
      const validatedData = validationResult.data;
      
      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: validatedData.name,
          address: validatedData.address || null,
          city: validatedData.city || null,
          postal_code: validatedData.postal_code || null,
          phone: validatedData.phone || null,
          email: validatedData.email || null,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Update profile with organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: orgData.id })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // Create admin role for user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user?.id,
          role: 'admin',
        });

      if (roleError) throw roleError;

      // Refresh profile to get updated organization_id
      await refreshProfile();

      navigate('/dashboard');
    } catch (err: unknown) {
      setError(sanitizeErrorMessage(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Vermietify</h1>
              <p className="text-sm text-muted-foreground">Immobilienverwaltung</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Organisation einrichten</CardTitle>
            <CardDescription>
              Erstellen Sie Ihre Organisation, um mit der Immobilienverwaltung zu beginnen
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Firmen- / Organisationsname *</Label>
                <Input
                  id="name"
                  placeholder="z.B. Mustermann Immobilien GmbH"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  placeholder="Musterstraße 123"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">PLZ</Label>
                  <Input
                    id="postalCode"
                    placeholder="12345"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Stadt</Label>
                  <Input
                    id="city"
                    placeholder="Berlin"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+49 123 456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="kontakt@firma.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Organisation erstellen
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
