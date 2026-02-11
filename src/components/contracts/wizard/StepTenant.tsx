import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenants } from "@/hooks/useTenants";
import {
  User,
  UserPlus,
  Search,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  Home,
  Users,
} from "lucide-react";
import type { WizardData } from "../ContractWizard";

interface StepTenantProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

export function StepTenant({ data, updateData }: StepTenantProps) {
  const { useTenantsList } = useTenants();
  const { data: tenants } = useTenantsList();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter tenants by search but do NOT exclude those with active leases
  const filteredTenants = tenants?.filter((t: any) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${t.first_name} ${t.last_name}`.toLowerCase();
      return fullName.includes(query) || t.email?.toLowerCase().includes(query);
    }
    return true;
  }) || [];

  const handleTenantSelect = (tenantId: string) => {
    const tenant = tenants?.find((t: any) => t.id === tenantId);
    updateData({ tenantId, selectedTenant: tenant });
  };

  const handleNewTenantChange = (field: keyof WizardData["newTenant"], value: string) => {
    updateData({
      newTenant: { ...data.newTenant, [field]: value },
    });
  };

  // Get active lease info for selected tenant
  const activeLease = data.selectedTenant?.leases?.find((l: any) => l.is_active);
  const hasActiveLease = !!activeLease;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Mieter auswählen</h2>
        <p className="text-muted-foreground">
          Wählen Sie einen bestehenden Mieter oder legen Sie einen neuen an.
        </p>
      </div>

      <RadioGroup
        value={data.tenantMode}
        onValueChange={(value: "existing" | "new") =>
          updateData({ tenantMode: value, tenantId: "", selectedTenant: null })
        }
        className="grid gap-4 md:grid-cols-2"
      >
        <Card
          className={`cursor-pointer transition-colors ${
            data.tenantMode === "existing" ? "border-primary" : ""
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing" className="cursor-pointer flex items-center gap-2">
                <User className="h-5 w-5" />
                Bestehenden Mieter wählen
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2 ml-6">
              Auch für Vertragswechsel / Umzug innerhalb des Bestands
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${
            data.tenantMode === "new" ? "border-primary" : ""
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="cursor-pointer flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Neuen Mieter anlegen
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2 ml-6">
              Neuer Mieter mit allen Kontaktdaten und bisheriger Adresse
            </p>
          </CardContent>
        </Card>
      </RadioGroup>

      {data.tenantMode === "existing" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mieter suchen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nach Name oder E-Mail suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={data.tenantId} onValueChange={handleTenantSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Mieter auswählen" />
              </SelectTrigger>
              <SelectContent>
                {filteredTenants.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Keine Mieter gefunden
                  </div>
                ) : (
                  filteredTenants.map((tenant: any) => {
                    const hasLease = tenant.leases?.some((l: any) => l.is_active);
                    return (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {tenant.first_name} {tenant.last_name}
                          {tenant.email && (
                            <span className="text-muted-foreground">({tenant.email})</span>
                          )}
                          {hasLease && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              aktiver Vertrag
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>

            {/* Selected tenant details card */}
            {data.selectedTenant && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-4">
                  {/* Name & contact */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-lg font-semibold text-primary">
                        {data.selectedTenant.first_name[0]}
                        {data.selectedTenant.last_name[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">
                        {data.selectedTenant.first_name} {data.selectedTenant.last_name}
                      </p>
                      {data.selectedTenant.email && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" /> {data.selectedTenant.email}
                        </p>
                      )}
                      {data.selectedTenant.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" /> {data.selectedTenant.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Current address */}
                  {(data.selectedTenant.address || data.selectedTenant.city) && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Aktuelle Adresse
                      </p>
                      <p className="text-sm">
                        {data.selectedTenant.address}
                        {data.selectedTenant.postal_code || data.selectedTenant.city
                          ? `, ${data.selectedTenant.postal_code || ""} ${data.selectedTenant.city || ""}`
                          : ""}
                      </p>
                    </div>
                  )}

                  {/* Active lease / current unit */}
                  {hasActiveLease && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Aktuelle Mieteinheit
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {activeLease.units?.unit_number}
                        </span>
                        <span className="text-muted-foreground">
                          in {activeLease.units?.buildings?.name}
                        </span>
                      </div>
                      {activeLease.units?.buildings?.address && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          {activeLease.units.buildings.address}
                          {activeLease.units.buildings.city
                            ? `, ${activeLease.units.buildings.city}`
                            : ""}
                        </p>
                      )}
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Bestehender Vertrag wird nicht automatisch beendet
                      </Badge>
                    </div>
                  )}

                  {/* Additional info */}
                  <div className="border-t pt-3 grid grid-cols-2 gap-3">
                    {data.selectedTenant.birth_date && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Geburtsdatum
                        </p>
                        <p className="text-sm">
                          {new Date(data.selectedTenant.birth_date).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                    )}
                    {data.selectedTenant.household_size && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> Haushaltsgröße
                        </p>
                        <p className="text-sm">
                          {data.selectedTenant.household_size}{" "}
                          {data.selectedTenant.household_size === 1 ? "Person" : "Personen"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Neuen Mieter anlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  value={data.newTenant.firstName}
                  onChange={(e) => handleNewTenantChange("firstName", e.target.value)}
                  placeholder="Max"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  value={data.newTenant.lastName}
                  onChange={(e) => handleNewTenantChange("lastName", e.target.value)}
                  placeholder="Mustermann"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={data.newTenant.email}
                    onChange={(e) => handleNewTenantChange("email", e.target.value)}
                    placeholder="max@beispiel.de"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={data.newTenant.phone}
                    onChange={(e) => handleNewTenantChange("phone", e.target.value)}
                    placeholder="+49 123 456789"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Geburtsdatum</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="birthDate"
                    type="date"
                    value={data.newTenant.birthDate}
                    onChange={(e) => handleNewTenantChange("birthDate", e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="householdSize">Haushaltsgröße</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="householdSize"
                    type="number"
                    min={1}
                    value={data.newTenant.householdSize || ""}
                    onChange={(e) => handleNewTenantChange("householdSize", e.target.value)}
                    placeholder="z.B. 2"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Previous address section */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Bisherige Adresse
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Straße und Hausnummer</Label>
                  <Input
                    id="address"
                    value={data.newTenant.address || ""}
                    onChange={(e) => handleNewTenantChange("address", e.target.value)}
                    placeholder="Musterstraße 1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">PLZ</Label>
                  <Input
                    id="postalCode"
                    value={data.newTenant.postalCode || ""}
                    onChange={(e) => handleNewTenantChange("postalCode", e.target.value)}
                    placeholder="10115"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ort</Label>
                  <Input
                    id="city"
                    value={data.newTenant.city || ""}
                    onChange={(e) => handleNewTenantChange("city", e.target.value)}
                    placeholder="Berlin"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="previousLandlord">Vorheriger Vermieter</Label>
                  <Input
                    id="previousLandlord"
                    value={data.newTenant.previousLandlord || ""}
                    onChange={(e) => handleNewTenantChange("previousLandlord", e.target.value)}
                    placeholder="Name des bisherigen Vermieters"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
