import { StatCard } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle, Circle, Euro, MapPin, Calendar, Zap, Clock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { EcosystemPromoCards } from "@/components/ecosystem/EcosystemPromoCards";

type BuildingRow = Database["public"]["Tables"]["buildings"]["Row"];
type UnitRow = Database["public"]["Tables"]["units"]["Row"];

interface BuildingWithUnits extends BuildingRow {
  units: UnitRow[];
}

interface BuildingOverviewTabProps {
  building: BuildingWithUnits;
}

export function BuildingOverviewTab({ building }: BuildingOverviewTabProps) {
  const units = building.units || [];
  const totalUnits = units.length;
  const rentedUnits = units.filter((u) => u.status === "rented").length;
  const vacantUnits = units.filter((u) => u.status === "vacant").length;
  const monthlyRent = units.reduce((sum, u) => sum + (u.rent_amount || 0), 0) / 100;

  const fullAddress = `${building.address}, ${building.postal_code} ${building.city}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  // Mock activities - replace with real data later
  const recentActivities = [
    { id: 1, description: "Neue Einheit hinzugefügt", time: "vor 2 Stunden", type: "unit" },
    { id: 2, description: "Mieter eingezogen", time: "vor 3 Tagen", type: "tenant" },
    { id: 3, description: "Zählerablesung erfasst", time: "vor 1 Woche", type: "meter" },
    { id: 4, description: "Dokument hochgeladen", time: "vor 2 Wochen", type: "document" },
    { id: 5, description: "Reparatur abgeschlossen", time: "vor 3 Wochen", type: "task" },
  ];

  const getBuildingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: "Mehrfamilienhaus",
      house: "Einfamilienhaus",
      commercial: "Gewerbe",
      mixed: "Gemischt",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Einheiten gesamt"
          value={totalUnits}
          icon={Building2}
          description={`${getBuildingTypeLabel(building.building_type)}`}
        />
        <StatCard
          title="Vermietet"
          value={rentedUnits}
          icon={CheckCircle}
          trend={totalUnits > 0 ? { value: Math.round((rentedUnits / totalUnits) * 100), isPositive: true } : undefined}
          description="aktive Mietverträge"
        />
        <StatCard
          title="Leer"
          value={vacantUnits}
          icon={Circle}
          trend={totalUnits > 0 ? { value: Math.round((vacantUnits / totalUnits) * 100), isPositive: vacantUnits === 0 } : undefined}
          description="verfügbare Einheiten"
        />
        <StatCard
          title="Mieteinnahmen/Monat"
          value={`${monthlyRent.toLocaleString("de-DE")} €`}
          icon={Euro}
          description="Kaltmiete gesamt"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Building Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gebäude-Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address with Google Maps link */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Adresse</p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {fullAddress}
                </a>
              </div>
            </div>

            {/* Year built */}
            {building.year_built && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Baujahr</p>
                  <p className="text-muted-foreground">{building.year_built}</p>
                </div>
              </div>
            )}

            {/* Total area */}
            {building.total_area && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Gesamtfläche</p>
                  <p className="text-muted-foreground">{building.total_area} m²</p>
                </div>
              </div>
            )}

            {/* Building type */}
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Gebäudetyp</p>
                <Badge variant="secondary">{getBuildingTypeLabel(building.building_type)}</Badge>
              </div>
            </div>

            {/* Notes */}
            {building.notes && (
              <div className="pt-2 border-t">
                <p className="font-medium mb-1">Notizen</p>
                <p className="text-muted-foreground text-sm">{building.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Letzte Aktivitäten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fintutto Ecosystem Cross-Sell */}
      <EcosystemPromoCards />
    </div>
  );
}
