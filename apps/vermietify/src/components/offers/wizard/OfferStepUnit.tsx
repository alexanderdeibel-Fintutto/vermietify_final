import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBuildings } from "@/hooks/useBuildings";
import { useUnits } from "@/hooks/useUnits";
import { Building2, Home, Ruler, DoorOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OfferWizardData } from "../OfferWizard";

interface Props {
  data: OfferWizardData;
  updateData: (updates: Partial<OfferWizardData>) => void;
}

export function OfferStepUnit({ data, updateData }: Props) {
  const { useBuildingsList } = useBuildings();
  const { data: buildingsData } = useBuildingsList();
  const { useUnitsList } = useUnits();
  const { data: units } = useUnitsList(data.buildingId || undefined);

  const buildings = buildingsData?.buildings || [];

  // Filter only vacant units
  const vacantUnits = units?.filter((u: any) => !u.is_occupied) || [];

  const handleBuildingChange = (id: string) => {
    const building = buildings.find((b: any) => b.id === id);
    updateData({ buildingId: id, unitId: "", selectedBuilding: building, selectedUnit: null });
  };

  const handleUnitChange = (id: string) => {
    const unit = (units || []).find((u: any) => u.id === id);
    updateData({ unitId: id, selectedUnit: unit });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Mietfläche auswählen</h2>
        <p className="text-muted-foreground">Wählen Sie eine freie Einheit für das Mietangebot.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Gebäude *</Label>
          <Select value={data.buildingId} onValueChange={handleBuildingChange}>
            <SelectTrigger>
              <SelectValue placeholder="Gebäude wählen" />
            </SelectTrigger>
            <SelectContent>
              {buildings.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {b.name} – {b.address}, {b.city}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Freie Einheit *</Label>
          <Select value={data.unitId} onValueChange={handleUnitChange} disabled={!data.buildingId}>
            <SelectTrigger>
              <SelectValue placeholder={data.buildingId ? "Einheit wählen" : "Erst Gebäude wählen"} />
            </SelectTrigger>
            <SelectContent>
              {vacantUnits.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">Keine freien Einheiten</div>
              ) : (
                vacantUnits.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      {u.unit_number} – {u.rooms || "?"} Zi., {u.area || "?"} m²
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {data.selectedUnit && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Einheit-Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{data.selectedUnit.unit_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{data.selectedUnit.area || "–"} m²</span>
              </div>
              <div className="flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{data.selectedUnit.rooms || "–"} Zimmer</span>
              </div>
            </div>
            {data.selectedUnit.floor != null && (
              <p className="text-sm text-muted-foreground mt-2">Etage: {data.selectedUnit.floor}</p>
            )}
            <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
              Frei
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
