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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Building2, User, Briefcase, Home, Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { sanitizeErrorMessage } from "@/lib/errorHandler";

type AccountType = "private" | "business";

interface ProfileData {
  firstName: string;
  lastName: string;
}

interface OrganizationData {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
}

interface BuildingData {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  buildingType: "apartment" | "house" | "commercial" | "mixed";
}

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>("private");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddressValidated, setIsAddressValidated] = useState(false);
  
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Form data
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
  });

  const [orgData, setOrgData] = useState<OrganizationData>({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    email: "",
  });

  const [buildingData, setBuildingData] = useState<BuildingData>({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    buildingType: "apartment",
  });

  const totalSteps = accountType === "business" ? 4 : 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    setError(null);
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePlaceSelect = (details: { address: string; city: string; postalCode: string }) => {
    setBuildingData((prev) => ({
      ...prev,
      address: details.address,
      city: details.city,
      postalCode: details.postalCode,
    }));
    setIsAddressValidated(true);
  };

  const handleComplete = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
        })
        .eq("user_id", user?.id);

      if (profileError) throw profileError;

      let organizationId: string;

      if (accountType === "private") {
        // Create personal organization via RPC
        const { data: orgId, error: orgError } = await supabase
          .rpc("create_personal_organization", {
            _user_id: user?.id,
            _first_name: profileData.firstName,
            _last_name: profileData.lastName,
          });

        if (orgError) throw orgError;
        organizationId = orgId;
      } else {
        // Create business organization
        const { data: newOrg, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name: orgData.name,
            address: orgData.address || null,
            city: orgData.city || null,
            postal_code: orgData.postalCode || null,
            phone: orgData.phone || null,
            email: orgData.email || null,
            is_personal: false,
            owner_user_id: user?.id,
          } as any)
          .select()
          .single();

        if (orgError) throw orgError;
        organizationId = newOrg.id;

        // Update profile with organization_id
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ organization_id: organizationId })
          .eq("user_id", user?.id);

        if (updateError) throw updateError;

        // Create admin role
        await supabase
          .from("user_roles")
          .insert({ user_id: user?.id, role: "admin" } as any);
      }

      // Create first building
      const { error: buildingError } = await supabase
        .from("buildings")
        .insert({
          organization_id: organizationId,
          name: buildingData.name,
          address: buildingData.address,
          city: buildingData.city,
          postal_code: buildingData.postalCode,
          building_type: buildingData.buildingType,
        });

      if (buildingError) throw buildingError;

      // Mark onboarding as completed
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true } as any)
        .eq("user_id", user?.id);

      await refreshProfile();
      navigate("/dashboard");
    } catch (err) {
      setError(sanitizeErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return profileData.firstName.trim() && profileData.lastName.trim();
      case 2:
        return true; // Account type selection is always valid
      case 3:
        if (accountType === "business") {
          return orgData.name.trim();
        }
        // For private: this is the building step
        return buildingData.name.trim() && isAddressValidated;
      case 4:
        // Business: building step
        return buildingData.name.trim() && isAddressValidated;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Ihr Profil</h3>
                <p className="text-sm text-muted-foreground">Vervollständigen Sie Ihre persönlichen Daten</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  placeholder="Max"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  placeholder="Mustermann"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Kontotyp</h3>
                <p className="text-sm text-muted-foreground">Wie möchten Sie Vermietify nutzen?</p>
              </div>
            </div>

            <RadioGroup
              value={accountType}
              onValueChange={(value) => setAccountType(value as AccountType)}
              className="grid gap-4"
            >
              <div className={`flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-colors ${accountType === "private" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Home className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Privatvermieter</p>
                      <p className="text-sm text-muted-foreground">
                        Ich verwalte meine eigenen Immobilien privat
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className={`flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-colors ${accountType === "business" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                <RadioGroupItem value="business" id="business" />
                <Label htmlFor="business" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Gewerblicher Vermieter</p>
                      <p className="text-sm text-muted-foreground">
                        Ich betreibe eine Hausverwaltung oder GmbH
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 3:
        if (accountType === "business") {
          // Business: Organization step
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Ihre Organisation</h3>
                  <p className="text-sm text-muted-foreground">Geben Sie Ihre Firmendaten ein</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgName">Firmen- / Organisationsname *</Label>
                <Input
                  id="orgName"
                  placeholder="z.B. Mustermann Immobilien GmbH"
                  value={orgData.name}
                  onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgAddress">Adresse</Label>
                <Textarea
                  id="orgAddress"
                  placeholder="Musterstraße 123"
                  value={orgData.address}
                  onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgPostalCode">PLZ</Label>
                  <Input
                    id="orgPostalCode"
                    placeholder="12345"
                    value={orgData.postalCode}
                    onChange={(e) => setOrgData({ ...orgData, postalCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgCity">Stadt</Label>
                  <Input
                    id="orgCity"
                    placeholder="Berlin"
                    value={orgData.city}
                    onChange={(e) => setOrgData({ ...orgData, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgPhone">Telefon</Label>
                  <Input
                    id="orgPhone"
                    type="tel"
                    placeholder="+49 123 456789"
                    value={orgData.phone}
                    onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgEmail">E-Mail</Label>
                  <Input
                    id="orgEmail"
                    type="email"
                    placeholder="kontakt@firma.de"
                    value={orgData.email}
                    onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          );
        }
        // Private: Building step (falls through to case 4 logic)
        return renderBuildingStep();

      case 4:
        // Business: Building step
        return renderBuildingStep();

      default:
        return null;
    }
  };

  const renderBuildingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Erstes Objekt anlegen</h3>
          <p className="text-sm text-muted-foreground">Fügen Sie Ihr erstes Gebäude hinzu</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="buildingName">Objektbezeichnung *</Label>
        <Input
          id="buildingName"
          placeholder="z.B. Musterhaus Berlin"
          value={buildingData.name}
          onChange={(e) => setBuildingData({ ...buildingData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="buildingAddress">Adresse *</Label>
        <AddressAutocomplete
          id="buildingAddress"
          placeholder="Adresse eingeben und aus Vorschlägen wählen..."
          value={buildingData.address}
          onChange={(value) => {
            setBuildingData({ ...buildingData, address: value });
            setIsAddressValidated(false);
          }}
          onPlaceSelect={handlePlaceSelect}
        />
        {!isAddressValidated && buildingData.address.length > 0 && (
          <p className="text-xs text-destructive">
            Bitte wählen Sie eine Adresse aus den Vorschlägen aus
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="buildingPostalCode">PLZ</Label>
          <Input
            id="buildingPostalCode"
            placeholder="12345"
            value={buildingData.postalCode}
            onChange={(e) => setBuildingData({ ...buildingData, postalCode: e.target.value })}
            disabled={isAddressValidated}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="buildingCity">Stadt</Label>
          <Input
            id="buildingCity"
            placeholder="Berlin"
            value={buildingData.city}
            onChange={(e) => setBuildingData({ ...buildingData, city: e.target.value })}
            disabled={isAddressValidated}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Objekttyp</Label>
        <RadioGroup
          value={buildingData.buildingType}
          onValueChange={(value) => setBuildingData({ ...buildingData, buildingType: value as any })}
          className="grid grid-cols-2 gap-2"
        >
          <div className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors ${buildingData.buildingType === "apartment" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
            <RadioGroupItem value="apartment" id="apartment" />
            <Label htmlFor="apartment" className="cursor-pointer text-sm">Mehrfamilienhaus</Label>
          </div>
          <div className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors ${buildingData.buildingType === "house" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
            <RadioGroupItem value="house" id="house" />
            <Label htmlFor="house" className="cursor-pointer text-sm">Einfamilienhaus</Label>
          </div>
          <div className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors ${buildingData.buildingType === "commercial" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
            <RadioGroupItem value="commercial" id="commercial" />
            <Label htmlFor="commercial" className="cursor-pointer text-sm">Gewerbe</Label>
          </div>
          <div className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors ${buildingData.buildingType === "mixed" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
            <RadioGroupItem value="mixed" id="mixed" />
            <Label htmlFor="mixed" className="cursor-pointer text-sm">Gemischt</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const isLastStep = step === totalSteps;

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
              <p className="text-sm text-muted-foreground">Ersteinrichtung</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-xl">
                Schritt {step} von {totalSteps}
              </CardTitle>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <CardDescription className="pt-2">
              {step === 1 && "Vervollständigen Sie Ihr Profil"}
              {step === 2 && "Wählen Sie Ihren Kontotyp"}
              {step === 3 && accountType === "business" && "Geben Sie Ihre Firmendaten ein"}
              {step === 3 && accountType === "private" && "Legen Sie Ihr erstes Objekt an"}
              {step === 4 && "Legen Sie Ihr erstes Objekt an"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {renderStep()}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Abschließen
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Weiter
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
