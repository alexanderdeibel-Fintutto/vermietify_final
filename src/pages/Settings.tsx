import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Building2, User, Bell, Shield, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { profileSchema, organizationSchema } from "@/lib/validationSchemas";
import { sanitizeErrorMessage } from "@/lib/errorHandler";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

interface Organization {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
}

export default function Settings() {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Organization form state
  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [orgPostalCode, setOrgPostalCode] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgEmail, setOrgEmail] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      
      if (profile.organization_id) {
        fetchOrganization();
      }
    }
  }, [profile]);

  const fetchOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .single();

      if (error) throw error;
      
      setOrganization(data);
      setOrgName(data.name);
      setOrgAddress(data.address || "");
      setOrgCity(data.city || "");
      setOrgPostalCode(data.postal_code || "");
      setOrgPhone(data.phone || "");
      setOrgEmail(data.email || "");
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    // Validate input data
    const validationResult = profileSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validierungsfehler",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const validatedData = validationResult.data;
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Erfolg",
        description: "Ihr Profil wurde aktualisiert.",
      });
    } catch (error: unknown) {
      toast({
        title: "Fehler",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOrganization = async () => {
    // Validate input data
    const validationResult = organizationSchema.safeParse({
      name: orgName,
      address: orgAddress,
      city: orgCity,
      postal_code: orgPostalCode,
      phone: orgPhone,
      email: orgEmail,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validierungsfehler",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const validatedData = validationResult.data;
      const { error } = await supabase
        .from('organizations')
        .update({
          name: validatedData.name,
          address: validatedData.address || null,
          city: validatedData.city || null,
          postal_code: validatedData.postal_code || null,
          phone: validatedData.phone || null,
          email: validatedData.email || null,
        })
        .eq('id', organization?.id);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Die Organisation wurde aktualisiert.",
      });
    } catch (error: unknown) {
      toast({
        title: "Fehler",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout title="Einstellungen">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihr Konto und Ihre Organisation
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="organization">
              <Building2 className="mr-2 h-4 w-4" />
              Organisation
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Benachrichtigungen
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Sicherheit
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Persönliche Informationen</CardTitle>
                <CardDescription>
                  Aktualisieren Sie Ihre persönlichen Daten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Vorname</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Die E-Mail-Adresse kann nicht geändert werden
                  </p>
                </div>
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Speichern
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Organisationsdaten</CardTitle>
                <CardDescription>
                  Verwalten Sie Ihre Firmendaten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Firmenname</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgAddress">Adresse</Label>
                  <AddressAutocomplete
                    id="orgAddress"
                    value={orgAddress}
                    onChange={setOrgAddress}
                    onPlaceSelect={(details) => {
                      setOrgAddress(details.address);
                      setOrgCity(details.city);
                      setOrgPostalCode(details.postalCode);
                    }}
                    placeholder="Straße und Hausnummer eingeben..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Beginnen Sie zu tippen, um Adressvorschläge zu erhalten
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgPostalCode">PLZ</Label>
                    <Input
                      id="orgPostalCode"
                      value={orgPostalCode}
                      onChange={(e) => setOrgPostalCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgCity">Stadt</Label>
                    <Input
                      id="orgCity"
                      value={orgCity}
                      onChange={(e) => setOrgCity(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgPhone">Telefon</Label>
                    <Input
                      id="orgPhone"
                      type="tel"
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail">E-Mail</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveOrganization} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Speichern
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Benachrichtigungseinstellungen</CardTitle>
                <CardDescription>
                  Konfigurieren Sie, wie Sie benachrichtigt werden möchten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-Mail-Benachrichtigungen</Label>
                    <p className="text-sm text-muted-foreground">
                      Erhalten Sie wichtige Updates per E-Mail
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Zahlungserinnerungen</Label>
                    <p className="text-sm text-muted-foreground">
                      Benachrichtigung bei überfälligen Zahlungen
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Vertragsablauf-Warnungen</Label>
                    <p className="text-sm text-muted-foreground">
                      Erinnerung vor Ablauf von Mietverträgen
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Sicherheitseinstellungen</CardTitle>
                <CardDescription>
                  Verwalten Sie Ihre Kontozugriff und Sicherheit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Passwort ändern</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Aktualisieren Sie Ihr Passwort regelmäßig für mehr Sicherheit
                    </p>
                    <Button variant="outline">Passwort ändern</Button>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Aktive Sitzungen</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Verwalten Sie Ihre aktiven Anmeldungen
                    </p>
                    <Button variant="outline">Sitzungen verwalten</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
