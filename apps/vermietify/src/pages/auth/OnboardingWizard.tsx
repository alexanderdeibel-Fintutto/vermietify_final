import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Building2, User, Briefcase, Home, Loader2, ChevronRight, ChevronLeft, Check, SkipForward, Sparkles } from "lucide-react";
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
  const [skipBuilding, setSkipBuilding] = useState(false);
  
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

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

  // Steps: 1=Welcome/Profile, 2=Account Type, 3=Org (business only), 4=Building (optional)
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

  const handleSkipBuilding = async () => {
    setSkipBuilding(true);
    await handleComplete(true);
  };

  const handleComplete = async (skippingBuilding = false) => {
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: Update profile with names
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

      // Create first building (unless skipped)
      if (!skippingBuilding && buildingData.name.trim() && isAddressValidated) {
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
      }

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
        return true;
      case 3:
        if (accountType === "business") {
          return orgData.name.trim();
        }
        // For private: building step - always allow (can skip)
        return true;
      case 4:
        // Business: building step - always allow (can skip)
        return true;
      default:
        return false;
    }
  };

  const isOnBuildingStep = () => {
    return (accountType === "private" && step === 3) || (accountType === "business" && step === 4);
  };

  const canCompleteBuilding = () => {
    return buildingData.name.trim() && isAddressValidated;
  };

  const renderWelcomeStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Willkommen bei Vermietify
        </div>
        <p className="text-muted-foreground">
          In wenigen Schritten richten wir gemeinsam Ihr Konto ein.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Wie heißen Sie?</h3>
          <p className="text-sm text-muted-foreground">Ihr Name wird für Dokumente und Kommunikation verwendet</p>
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
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nachname *</Label>
          <Input
            id="lastName"
            placeholder="Mustermann"
            value={profileData.lastName}
            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const renderAccountTypeStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Wie vermieten Sie?</h3>
          <p className="text-sm text-muted-foreground">Dies hilft uns, die richtige Einrichtung vorzunehmen</p>
        </div>
      </div>

      <RadioGroup
        value={accountType}
        onValueChange={(value) => setAccountType(value as AccountType)}
        className="grid gap-4"
      >
        <label 
          htmlFor="private" 
          className={`flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-all ${accountType === "private" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted/50 hover:border-muted-foreground/30"}`}
        >
          <RadioGroupItem value="private" id="private" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Privatvermieter</p>
                <p className="text-sm text-muted-foreground">
                  Ich verwalte eigene Immobilien privat
                </p>
              </div>
            </div>
          </div>
        </label>
        
        <label 
          htmlFor="business" 
          className={`flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-all ${accountType === "business" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted/50 hover:border-muted-foreground/30"}`}
        >
          <RadioGroupItem value="business" id="business" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Gewerblich</p>
                <p className="text-sm text-muted-foreground">
                  Hausverwaltung, GmbH oder Gewerbe
                </p>
              </div>
            </div>
          </div>
        </label>
      </RadioGroup>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Sie können dies später in den Einstellungen ändern
      </p>
    </div>
  );

  const renderOrganizationStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Ihre Firma</h3>
          <p className="text-sm text-muted-foreground">Diese Daten erscheinen auf Dokumenten</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="orgName">Firmenname *</Label>
        <Input
          id="orgName"
          placeholder="z.B. Mustermann Immobilien GmbH"
          value={orgData.name}
          onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="orgAddress">Adresse <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input
          id="orgAddress"
          placeholder="Musterstraße 123"
          value={orgData.address}
          onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
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

  const renderBuildingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Erstes Objekt anlegen</h3>
          <p className="text-sm text-muted-foreground">Optional – Sie können dies auch später tun</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="buildingName">Objektbezeichnung</Label>
        <Input
          id="buildingName"
          placeholder="z.B. Musterhaus Berlin"
          value={buildingData.name}
          onChange={(e) => setBuildingData({ ...buildingData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="buildingAddress">Adresse</Label>
        <AddressAutocomplete
          id="buildingAddress"
          placeholder="Adresse eingeben..."
          value={buildingData.address}
          onChange={(value) => {
            setBuildingData({ ...buildingData, address: value });
            setIsAddressValidated(false);
          }}
          onPlaceSelect={handlePlaceSelect}
        />
        {!isAddressValidated && buildingData.address.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Wählen Sie eine Adresse aus den Vorschlägen
          </p>
        )}
      </div>

      {isAddressValidated && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buildingPostalCode">PLZ</Label>
              <Input
                id="buildingPostalCode"
                value={buildingData.postalCode}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buildingCity">Stadt</Label>
              <Input
                id="buildingCity"
                value={buildingData.city}
                disabled
                className="bg-muted"
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
              {[
                { value: "apartment", label: "Mehrfamilienhaus" },
                { value: "house", label: "Einfamilienhaus" },
                { value: "commercial", label: "Gewerbe" },
                { value: "mixed", label: "Gemischt" },
              ].map((type) => (
                <label
                  key={type.value}
                  htmlFor={type.value}
                  className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors ${buildingData.buildingType === type.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                >
                  <RadioGroupItem value={type.value} id={type.value} />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
        </>
      )}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderWelcomeStep();
      case 2:
        return renderAccountTypeStep();
      case 3:
        return accountType === "business" ? renderOrganizationStep() : renderBuildingStep();
      case 4:
        return renderBuildingStep();
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Persönliche Daten";
      case 2:
        return "Kontotyp wählen";
      case 3:
        return accountType === "business" ? "Firmendaten" : "Erstes Objekt";
      case 4:
        return "Erstes Objekt";
      default:
        return "";
    }
  };

  const isLastStep = step === totalSteps;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-lg">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Vermietify</h1>
              <p className="text-sm text-muted-foreground">Ersteinrichtung</p>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-muted/50">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-lg">
                {getStepTitle()}
              </CardTitle>
              <span className="text-sm text-muted-foreground font-medium">
                {step}/{totalSteps}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </CardHeader>

          <CardContent className="pb-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {renderStep()}
          </CardContent>

          <CardFooter className="flex justify-between pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1 || isLoading}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Zurück
            </Button>

            <div className="flex gap-2">
              {isOnBuildingStep() && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkipBuilding}
                  disabled={isLoading}
                  className="gap-1"
                >
                  <SkipForward className="h-4 w-4" />
                  Überspringen
                </Button>
              )}

              {isLastStep ? (
                <Button
                  onClick={() => handleComplete(false)}
                  disabled={!canCompleteBuilding() && !skipBuilding || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Fertig
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="gap-1"
                >
                  Weiter
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Sie können alle Einstellungen später anpassen
        </p>
      </div>
    </div>
  );
}