import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Building2,
  Home,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  SkipForward,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

const STEPS = [
  { id: "profile", label: "Profil", icon: User },
  { id: "building", label: "Gebäude", icon: Building2 },
  { id: "unit", label: "Einheit", icon: Home },
  { id: "tenant", label: "Mieter", icon: Users },
  { id: "complete", label: "Fertig", icon: CheckCircle2 },
];

// Step 1: Profile
function StepProfile({ onNext, isLoading }: StepProps) {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: firstName, last_name: lastName })
        .eq("user_id", user?.id);

      if (error) throw error;

      // Update onboarding progress
      await supabase
        .from("onboarding_progress")
        .upsert({
          user_id: user?.id,
          profile_completed: true,
        });

      await refreshProfile();
      onNext();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Profil vervollständigen</h2>
        <p className="text-muted-foreground">
          Wie möchten Sie angesprochen werden?
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Vorname</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Max"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nachname</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Mustermann"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            value={user?.email || ""}
            disabled
            className="bg-muted"
          />
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? "Speichern..." : "Weiter"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 2: Building
function StepBuilding({ onNext, onBack, onSkip }: StepProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [buildingType, setBuildingType] = useState("apartment");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !address.trim() || !city.trim() || !postalCode.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("buildings").insert({
        organization_id: profile?.organization_id!,
        name,
        address,
        city,
        postal_code: postalCode,
        building_type: buildingType as "apartment" | "house" | "commercial" | "mixed",
      });

      if (error) throw error;

      // Update onboarding progress
      await supabase
        .from("onboarding_progress")
        .upsert({
          user_id: profile?.id!,
          first_building_created: true,
        });

      onNext();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Erstes Gebäude anlegen</h2>
        <p className="text-muted-foreground">
          Fügen Sie Ihre erste Immobilie hinzu
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="name">Objektbezeichnung *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Musterstraße 1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Gebäudetyp</Label>
          <Select value={buildingType} onValueChange={setBuildingType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">Mehrfamilienhaus</SelectItem>
              <SelectItem value="house">Einfamilienhaus</SelectItem>
              <SelectItem value="commercial">Gewerbe</SelectItem>
              <SelectItem value="mixed">Gemischt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Straße und Hausnummer *</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Musterstraße 1"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postalCode">PLZ *</Label>
            <Input
              id="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="12345"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="city">Stadt *</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Berlin"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          <SkipForward className="mr-2 h-4 w-4" />
          Überspringen
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Speichern..." : "Weiter"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Unit
function StepUnit({ onNext, onBack, onSkip }: StepProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [name, setName] = useState("");
  const [floor, setFloor] = useState("");
  const [area, setArea] = useState("50");
  const [rooms, setRooms] = useState("2");
  const [rentAmount, setRentAmount] = useState("500");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBuildings = async () => {
      if (!profile?.organization_id) return;
      const { data } = await supabase
        .from("buildings")
        .select("id, name")
        .eq("organization_id", profile.organization_id);
      if (data && data.length > 0) {
        setBuildings(data);
        setSelectedBuilding(data[0].id);
      }
    };
    fetchBuildings();
  }, [profile?.organization_id]);

  const handleSave = async () => {
    if (!selectedBuilding || !name.trim() || !area || !rooms || !rentAmount) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("units").insert({
        building_id: selectedBuilding,
        unit_number: name,
        floor: floor ? parseInt(floor) : null,
        area: parseFloat(area),
        rooms: parseFloat(rooms),
        rent_amount: parseFloat(rentAmount),
      });

      if (error) throw error;

      await supabase
        .from("onboarding_progress")
        .upsert({
          user_id: profile?.id!,
          first_unit_created: true,
        });

      onNext();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (buildings.length === 0) {
    return (
      <div className="space-y-6 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Home className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Kein Gebäude vorhanden</h2>
        <p className="text-muted-foreground">
          Bitte legen Sie zuerst ein Gebäude an, bevor Sie eine Einheit erstellen.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            Überspringen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Home className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Erste Einheit anlegen</h2>
        <p className="text-muted-foreground">
          Erstellen Sie eine Wohn- oder Gewerbeeinheit
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <div className="space-y-2">
          <Label>Gebäude</Label>
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {buildings.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitName">Bezeichnung *</Label>
          <Input
            id="unitName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Wohnung 1 oder EG links"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="floor">Etage</Label>
            <Input
              id="floor"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="EG"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area">Fläche (m²)</Label>
            <Input
              id="area"
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="75"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rooms">Zimmer *</Label>
            <Input
              id="rooms"
              type="number"
              step="0.5"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              placeholder="3"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rent">Kaltmiete (€) *</Label>
          <Input
            id="rent"
            type="number"
            value={rentAmount}
            onChange={(e) => setRentAmount(e.target.value)}
            placeholder="500"
          />
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          <SkipForward className="mr-2 h-4 w-4" />
          Überspringen
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Speichern..." : "Weiter"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 4: Tenant (Optional)
function StepTenant({ onNext, onBack, onSkip }: StepProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie mindestens Vor- und Nachname ein.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("tenants").insert({
        organization_id: profile?.organization_id,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
      });

      if (error) throw error;

      await supabase
        .from("onboarding_progress")
        .upsert({
          user_id: profile?.id,
          first_tenant_created: true,
        });

      onNext();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Ersten Mieter anlegen</h2>
        <p className="text-muted-foreground">
          Optional: Fügen Sie Ihren ersten Mieter hinzu
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenantFirstName">Vorname *</Label>
            <Input
              id="tenantFirstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Max"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantLastName">Nachname *</Label>
            <Input
              id="tenantLastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Mustermann"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenantEmail">E-Mail</Label>
          <Input
            id="tenantEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="max@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenantPhone">Telefon</Label>
          <Input
            id="tenantPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+49 123 456789"
          />
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          <SkipForward className="mr-2 h-4 w-4" />
          Überspringen
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Speichern..." : "Weiter"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 5: Complete
function StepComplete() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFinish = async () => {
    // Mark onboarding as completed
    await supabase
      .from("onboarding_progress")
      .upsert({
        user_id: user?.id,
        completed_at: new Date().toISOString(),
      });

    // Also update profile
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user?.id);

    navigate("/dashboard");
  };

  const quickLinks = [
    { label: "Dashboard", href: "/dashboard", icon: Sparkles },
    { label: "Immobilien verwalten", href: "/immobilien", icon: Building2 },
    { label: "Mieter hinzufügen", href: "/mieter", icon: Users },
    { label: "Neuen Vertrag erstellen", href: "/vertraege/neu", icon: Home },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
          <Rocket className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold">Alles bereit!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Herzlichen Glückwunsch! Sie haben die Einrichtung abgeschlossen und können 
          jetzt mit Vermietify Ihre Immobilien verwalten.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-lg mx-auto">
        {quickLinks.map((link) => (
          <Card
            key={link.href}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(link.href)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <link.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">{link.label}</span>
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={handleFinish}>
          <Sparkles className="mr-2 h-4 w-4" />
          Zum Dashboard
        </Button>
      </div>
    </div>
  );
}

// Main Wizard Component
export default function OnboardingWizardPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already completed onboarding
  useEffect(() => {
    if (!isLoading && profile?.onboarding_completed) {
      navigate("/dashboard");
    }
  }, [isLoading, profile, navigate]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    handleNext();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Vermietify</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            Überspringen
          </Button>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b bg-background">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Schritt {currentStep + 1} von {STEPS.length}
            </span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Steps Navigation */}
      <div className="border-b bg-background">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 container px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            {currentStep === 0 && (
              <StepProfile onNext={handleNext} />
            )}
            {currentStep === 1 && (
              <StepBuilding onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />
            )}
            {currentStep === 2 && (
              <StepUnit onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />
            )}
            {currentStep === 3 && (
              <StepTenant onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />
            )}
            {currentStep === 4 && (
              <StepComplete />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
