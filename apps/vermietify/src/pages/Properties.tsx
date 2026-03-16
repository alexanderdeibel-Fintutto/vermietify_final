import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, MapPin, Home, Search, Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { buildingSchema, BuildingFormData } from "@/lib/validationSchemas";
import { sanitizeErrorMessage } from "@/lib/errorHandler";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { BulkImportDialog } from "@/components/import/BulkImportDialog";
interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  building_type: string;
  year_built: number | null;
  total_area: number | null;
  units: Unit[];
}

interface Unit {
  id: string;
  unit_number: string;
  area: number;
  rooms: number;
  rent_amount: number;
  status: string;
}

export default function Properties() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressValidated, setIsAddressValidated] = useState(false);

  // Form state
  const [newBuilding, setNewBuilding] = useState({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    building_type: "apartment",
    year_built: "",
    total_area: "",
  });

  // Handle Google Maps place selection
  const handlePlaceSelect = (details: { address: string; city: string; postalCode: string }) => {
    setNewBuilding((prev) => ({
      ...prev,
      address: details.address,
      city: details.city,
      postal_code: details.postalCode,
    }));
    setIsAddressValidated(true);
  };

  useEffect(() => {
    if (profile?.organization_id) {
      fetchBuildings();
    }
  }, [profile?.organization_id]);

  const fetchBuildings = async () => {
    try {
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .order('name');

      if (buildingsError) throw buildingsError;

      // Fetch units for each building
      const buildingsWithUnits = await Promise.all(
        (buildingsData || []).map(async (building) => {
          const { data: units } = await supabase
            .from('units')
            .select('*')
            .eq('building_id', building.id);
          return { ...building, units: units || [] };
        })
      );

      setBuildings(buildingsWithUnits);
    } catch (error) {
      console.error('Error fetching buildings:', error);
      toast({
        title: "Fehler",
        description: "Gebäude konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Check if user has an organization
    if (!profile?.organization_id) {
      toast({
        title: "Fehler",
        description: "Bitte richten Sie zuerst Ihre Organisation ein.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Validate input data
    const validationResult = buildingSchema.safeParse(newBuilding);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validierungsfehler",
        description: firstError.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const validatedData = validationResult.data;
      const { error } = await supabase
        .from('buildings')
        .insert({
          organization_id: profile.organization_id,
          name: validatedData.name,
          address: validatedData.address,
          city: validatedData.city,
          postal_code: validatedData.postal_code,
          building_type: validatedData.building_type as any,
          year_built: validatedData.year_built ? parseInt(validatedData.year_built) : null,
          total_area: validatedData.total_area ? parseFloat(validatedData.total_area) : null,
        });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Das Gebäude wurde erfolgreich angelegt.",
      });

      setIsDialogOpen(false);
      setNewBuilding({
        name: "",
        address: "",
        city: "",
        postal_code: "",
        building_type: "apartment",
        year_built: "",
        total_area: "",
      });
      setIsAddressValidated(false);
      fetchBuildings();
    } catch (error: unknown) {
      toast({
        title: "Fehler",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBuildings = buildings.filter(
    (building) =>
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBuildingTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      apartment: "Mehrfamilienhaus",
      house: "Einfamilienhaus",
      commercial: "Gewerbe",
      mixed: "Gemischt",
    };
    return types[type] || type;
  };

  const getUnitStatusColor = (status: string) => {
    switch (status) {
      case "rented":
        return "default";
      case "vacant":
        return "secondary";
      case "renovating":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getUnitStatusLabel = (status: string) => {
    switch (status) {
      case "rented":
        return "Vermietet";
      case "vacant":
        return "Leer";
      case "renovating":
        return "Renovierung";
      default:
        return status;
    }
  };

  return (
    <MainLayout title="Immobilien">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Immobilien</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Gebäude und Wohneinheiten
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              PDF/CSV Import
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Gebäude hinzufügen
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleCreateBuilding}>
                <DialogHeader>
                  <DialogTitle>Neues Gebäude anlegen</DialogTitle>
                  <DialogDescription>
                    Fügen Sie ein neues Gebäude zu Ihrem Portfolio hinzu
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="z.B. Wohnhaus Musterstraße"
                      value={newBuilding.name}
                      onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse *</Label>
                    <AddressAutocomplete
                      id="address"
                      placeholder="Adresse eingeben und aus Vorschlägen wählen..."
                      value={newBuilding.address}
                      onChange={(value) => {
                        setNewBuilding({ ...newBuilding, address: value });
                        setIsAddressValidated(false);
                      }}
                      onPlaceSelect={handlePlaceSelect}
                    />
                    {!isAddressValidated && newBuilding.address.length > 0 && (
                      <p className="text-xs text-destructive">
                        Bitte wählen Sie eine Adresse aus den Vorschlägen aus
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">PLZ *</Label>
                      <Input
                        id="postal_code"
                        placeholder="12345"
                        value={newBuilding.postal_code}
                        onChange={(e) => setNewBuilding({ ...newBuilding, postal_code: e.target.value })}
                        disabled={isAddressValidated}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Stadt *</Label>
                      <Input
                        id="city"
                        placeholder="Berlin"
                        value={newBuilding.city}
                        onChange={(e) => setNewBuilding({ ...newBuilding, city: e.target.value })}
                        disabled={isAddressValidated}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="building_type">Gebäudetyp</Label>
                    <Select
                      value={newBuilding.building_type}
                      onValueChange={(value) => setNewBuilding({ ...newBuilding, building_type: value })}
                    >
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year_built">Baujahr</Label>
                      <Input
                        id="year_built"
                        type="number"
                        placeholder="1990"
                        value={newBuilding.year_built}
                        onChange={(e) => setNewBuilding({ ...newBuilding, year_built: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_area">Gesamtfläche (m²)</Label>
                      <Input
                        id="total_area"
                        type="number"
                        step="0.01"
                        placeholder="500"
                        value={newBuilding.total_area}
                        onChange={(e) => setNewBuilding({ ...newBuilding, total_area: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !isAddressValidated}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Anlegen
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Gebäude suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Buildings Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBuildings.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "Keine Gebäude gefunden" : "Noch keine Gebäude"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Versuchen Sie einen anderen Suchbegriff"
                  : "Fügen Sie Ihr erstes Gebäude hinzu, um zu beginnen"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Gebäude hinzufügen
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBuildings.map((building) => {
              const rentedUnits = building.units.filter((u) => u.status === "rented").length;
              const totalUnits = building.units.length;
              const totalRent = building.units
                .filter((u) => u.status === "rented")
                .reduce((sum, u) => sum + u.rent_amount, 0);

              return (
                <Card key={building.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          {building.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {building.address}, {building.postal_code} {building.city}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {getBuildingTypeLabel(building.building_type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Einheiten</span>
                        <span className="font-medium">
                          {rentedUnits} / {totalUnits} vermietet
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Mieteinnahmen</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat("de-DE", {
                            style: "currency",
                            currency: "EUR",
                          }).format(totalRent)}
                          /Monat
                        </span>
                      </div>
                      {building.year_built && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Baujahr</span>
                          <span className="font-medium">{building.year_built}</span>
                        </div>
                      )}

                      {/* Units Preview */}
                      {building.units.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Wohneinheiten
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {building.units.slice(0, 6).map((unit) => (
                              <Badge
                                key={unit.id}
                                variant={getUnitStatusColor(unit.status)}
                                className="text-xs"
                              >
                                <Home className="h-3 w-3 mr-1" />
                                {unit.unit_number}
                              </Badge>
                            ))}
                            {building.units.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{building.units.length - 6}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <Button variant="outline" className="w-full mt-2" onClick={() => navigate(`/gebaeude/${building.id}`)}>
                        Details anzeigen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BulkImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        type="buildings"
        organizationId={profile?.organization_id}
        onSuccess={() => fetchBuildings()}
      />
    </MainLayout>
  );
}
