import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, EmptyState, LoadingState } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRentalOffers } from "@/hooks/useRentalOffers";
import { useBuildings } from "@/hooks/useBuildings";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Calculator, Building2, Copy, Save, Info } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Standard KdU household sizes with default area
const HOUSEHOLD_CONFIGS = [
  { size: 1, label: "1 Person", defaultArea: 45 },
  { size: 2, label: "2 Personen", defaultArea: 60 },
  { size: 3, label: "3 Personen", defaultArea: 75 },
  { size: 4, label: "4 Personen", defaultArea: 90 },
  { size: 5, label: "5 Personen", defaultArea: 105 },
];

interface HouseholdRate {
  household_size: number;
  max_area_sqm: number;
  max_rent_cents: number;
  max_utilities_cents: number;
  max_heating_cents: number;
}

export default function KduRatesManagement() {
  const { profile } = useAuth();
  const { useKduRates, createKduRatesBatch, deleteKduRatesForBuilding } = useRentalOffers();
  const { useBuildingsList } = useBuildings();
  const { data: buildingsData, isLoading: buildingsLoading } = useBuildingsList(1, 200);
  const buildings = buildingsData?.buildings || [];

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const { data: rates, isLoading: ratesLoading } = useKduRates(selectedBuildingId || undefined);

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [copySourceId, setCopySourceId] = useState("");
  const [deleteConfirmBuildingId, setDeleteConfirmBuildingId] = useState<string | null>(null);

  const [regionName, setRegionName] = useState("");
  const [source, setSource] = useState("");
  const [householdRates, setHouseholdRates] = useState<HouseholdRate[]>(
    HOUSEHOLD_CONFIGS.map((c) => ({
      household_size: c.size,
      max_area_sqm: c.defaultArea,
      max_rent_cents: 0,
      max_utilities_cents: 0,
      max_heating_cents: 0,
    }))
  );

  const selectedBuilding = buildings.find((b: any) => b.id === selectedBuildingId);

  // Buildings that already have KdU configured
  const { data: allRates } = useRentalOffers().useKduRatesByBuilding();
  const buildingsWithKdu = useMemo(() => {
    if (!allRates) return new Set<string>();
    return new Set(allRates.map((r: any) => r.building_id).filter(Boolean));
  }, [allRates]);

  const updateHouseholdRate = (index: number, field: keyof HouseholdRate, value: number) => {
    setHouseholdRates((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const openSetupDialog = () => {
    // Pre-fill if rates exist
    if (rates && rates.length > 0) {
      setRegionName((rates[0] as any).region_name || (rates[0] as any).municipality || "");
      setSource((rates[0] as any).source || "");
      setHouseholdRates(
        HOUSEHOLD_CONFIGS.map((c) => {
          const existing = rates.find((r: any) => r.household_size === c.size);
          return {
            household_size: c.size,
            max_area_sqm: existing ? Number((existing as any).max_area_sqm || c.defaultArea) : c.defaultArea,
            max_rent_cents: existing ? (existing as any).max_rent_cents : 0,
            max_utilities_cents: existing ? (existing as any).max_utilities_cents : 0,
            max_heating_cents: existing ? (existing as any).max_heating_cents : 0,
          };
        })
      );
    } else {
      setRegionName("");
      setSource("");
      setHouseholdRates(
        HOUSEHOLD_CONFIGS.map((c) => ({
          household_size: c.size,
          max_area_sqm: c.defaultArea,
          max_rent_cents: 0,
          max_utilities_cents: 0,
          max_heating_cents: 0,
        }))
      );
    }
    setIsSetupOpen(true);
  };

  const handleSave = async () => {
    if (!profile?.organization_id || !selectedBuildingId) return;

    // Delete existing rates for this building first
    await deleteKduRatesForBuilding.mutateAsync(selectedBuildingId);

    // Insert new rates
    const newRates = householdRates.map((hr) => ({
      organization_id: profile.organization_id!,
      building_id: selectedBuildingId,
      region_name: regionName || undefined,
      municipality: regionName || undefined,
      household_size: hr.household_size,
      max_area_sqm: hr.max_area_sqm,
      max_rent_cents: hr.max_rent_cents,
      max_utilities_cents: hr.max_utilities_cents,
      max_heating_cents: hr.max_heating_cents,
      max_total_cents: hr.max_rent_cents + hr.max_utilities_cents + hr.max_heating_cents,
      source: source || undefined,
    }));

    await createKduRatesBatch.mutateAsync(newRates);
    setIsSetupOpen(false);
  };

  const handleCopyFromBuilding = async () => {
    if (!copySourceId || !selectedBuildingId || !profile?.organization_id) return;

    // Fetch source rates
    const { data: sourceRates, error } = await (await import("@/integrations/supabase/client")).supabase
      .from("kdu_rates")
      .select("*")
      .eq("building_id", copySourceId);

    if (error || !sourceRates?.length) return;

    // Delete existing and copy
    await deleteKduRatesForBuilding.mutateAsync(selectedBuildingId);

    const copiedRates = sourceRates.map((r: any) => ({
      organization_id: profile.organization_id!,
      building_id: selectedBuildingId,
      region_name: r.region_name,
      municipality: r.municipality,
      household_size: r.household_size,
      max_area_sqm: r.max_area_sqm,
      max_rent_cents: r.max_rent_cents,
      max_utilities_cents: r.max_utilities_cents,
      max_heating_cents: r.max_heating_cents,
      max_total_cents: r.max_total_cents,
      source: r.source,
    }));

    await createKduRatesBatch.mutateAsync(copiedRates);
    setIsCopyOpen(false);
    setCopySourceId("");
  };

  const handleDeleteRates = async () => {
    if (!deleteConfirmBuildingId) return;
    await deleteKduRatesForBuilding.mutateAsync(deleteConfirmBuildingId);
    setDeleteConfirmBuildingId(null);
  };

  if (buildingsLoading) return <MainLayout title="KdU-Richtwerte"><LoadingState /></MainLayout>;

  return (
    <MainLayout title="KdU-Richtwerte" breadcrumbs={[{ label: "Einstellungen", href: "/settings" }, { label: "KdU-Richtwerte" }]}>
      <div className="space-y-6">
        <PageHeader title="KdU-Richtwerte" />

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            KdU-Richtwerte werden pro Gebäude und Haushaltsgröße hinterlegt. Jede Haushaltsgröße hat eine angemessene Wohnfläche, 
            Netto-Kaltmiete (inkl. kalter Betriebskosten) und eine Heizkostenpauschale gemäß den kommunalen Vorgaben.
          </AlertDescription>
        </Alert>

        {/* Building Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Gebäude auswählen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label>Gebäude</Label>
                <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gebäude wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        <span className="flex items-center gap-2">
                          {b.name} – {b.city}
                          {buildingsWithKdu.has(b.id) && (
                            <Badge variant="secondary" className="text-xs ml-1">KdU ✓</Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rates Display */}
        {selectedBuildingId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  KdU-Richtwerte: {selectedBuilding?.name}
                  {rates && rates.length > 0 && (rates[0] as any).region_name && (
                    <span className="text-muted-foreground font-normal ml-2">
                      ({(rates[0] as any).region_name})
                    </span>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  {buildingsWithKdu.size > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setIsCopyOpen(true)}>
                      <Copy className="h-4 w-4 mr-2" /> Von Gebäude übernehmen
                    </Button>
                  )}
                  <Button size="sm" onClick={openSetupDialog}>
                    {rates && rates.length > 0 ? (
                      <><Save className="h-4 w-4 mr-2" /> Bearbeiten</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" /> Einrichten</>
                    )}
                  </Button>
                  {rates && rates.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmBuildingId(selectedBuildingId)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Löschen
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ratesLoading ? (
                <LoadingState />
              ) : !rates?.length ? (
                <EmptyState
                  icon={Calculator}
                  title="Keine KdU-Richtwerte"
                  description="Richten Sie die KdU-Richtwerte für dieses Gebäude ein."
                  action={
                    <div className="flex gap-2">
                      <Button onClick={openSetupDialog}>
                        <Plus className="h-4 w-4 mr-2" /> Einrichten
                      </Button>
                      {buildingsWithKdu.size > 0 && (
                        <Button variant="outline" onClick={() => setIsCopyOpen(true)}>
                          <Copy className="h-4 w-4 mr-2" /> Von Gebäude übernehmen
                        </Button>
                      )}
                    </div>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4 font-medium">Haushaltsgröße</th>
                        <th className="text-right py-3 px-4 font-medium">Wohnfläche</th>
                        <th className="text-right py-3 px-4 font-medium">Netto-Kaltmiete</th>
                        <th className="text-right py-3 px-4 font-medium">Kalte NK</th>
                        <th className="text-right py-3 px-4 font-medium">Heizkosten</th>
                        <th className="text-right py-3 px-4 font-medium font-bold">Gesamt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates.map((rate: any) => {
                        const total = rate.max_rent_cents + rate.max_utilities_cents + rate.max_heating_cents;
                        return (
                          <tr key={rate.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-3 px-4">
                              <Badge variant="outline">{rate.household_size} {rate.household_size === 1 ? "Person" : "Personen"}</Badge>
                            </td>
                            <td className="text-right py-3 px-4">{rate.max_area_sqm ? `${rate.max_area_sqm} m²` : "–"}</td>
                            <td className="text-right py-3 px-4">{formatCurrency(rate.max_rent_cents / 100)}</td>
                            <td className="text-right py-3 px-4">{formatCurrency(rate.max_utilities_cents / 100)}</td>
                            <td className="text-right py-3 px-4">{formatCurrency(rate.max_heating_cents / 100)}</td>
                            <td className="text-right py-3 px-4 font-bold">{formatCurrency(total / 100)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {(rates[0] as any)?.source && (
                    <p className="text-xs text-muted-foreground mt-3 px-4">
                      Quelle: {(rates[0] as any).source}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedBuildingId && (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={Building2}
                title="Gebäude auswählen"
                description="Wählen Sie ein Gebäude aus, um dessen KdU-Richtwerte zu verwalten."
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Setup/Edit Dialog */}
      <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KdU-Richtwerte einrichten: {selectedBuilding?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Vergleichsraum / Region</Label>
                <Input
                  value={regionName}
                  onChange={(e) => setRegionName(e.target.value)}
                  placeholder="z.B. VR I – Insel Usedom"
                />
              </div>
              <div className="space-y-2">
                <Label>Quelle</Label>
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="z.B. KdU-Richtlinie LK VG, Stand Nov 2024"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-base font-semibold">Richtwerte je Haushaltsgröße</Label>
              <p className="text-xs text-muted-foreground">
                Tragen Sie die Angemessenheitsgrenzen gemäß Ihrer kommunalen KdU-Richtlinie ein.
              </p>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left py-3 px-3 font-medium w-32">Haushalt</th>
                    <th className="text-center py-3 px-3 font-medium">Fläche (m²)</th>
                    <th className="text-center py-3 px-3 font-medium">Netto-Kaltmiete (€)</th>
                    <th className="text-center py-3 px-3 font-medium">Kalte NK (€)</th>
                    <th className="text-center py-3 px-3 font-medium">Heizkosten (€)</th>
                    <th className="text-right py-3 px-3 font-medium">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {householdRates.map((hr, idx) => {
                    const total = hr.max_rent_cents + hr.max_utilities_cents + hr.max_heating_cents;
                    return (
                      <tr key={hr.household_size} className="border-b last:border-0">
                        <td className="py-2 px-3">
                          <Badge variant="outline">{HOUSEHOLD_CONFIGS[idx].label}</Badge>
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            className="w-20 mx-auto text-center"
                            value={hr.max_area_sqm || ""}
                            onChange={(e) => updateHouseholdRate(idx, "max_area_sqm", parseFloat(e.target.value || "0"))}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number" step="0.01"
                            className="w-24 mx-auto text-center"
                            value={hr.max_rent_cents ? (hr.max_rent_cents / 100).toFixed(2) : ""}
                            onChange={(e) => updateHouseholdRate(idx, "max_rent_cents", Math.round(parseFloat(e.target.value || "0") * 100))}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number" step="0.01"
                            className="w-24 mx-auto text-center"
                            value={hr.max_utilities_cents ? (hr.max_utilities_cents / 100).toFixed(2) : ""}
                            onChange={(e) => updateHouseholdRate(idx, "max_utilities_cents", Math.round(parseFloat(e.target.value || "0") * 100))}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number" step="0.01"
                            className="w-24 mx-auto text-center"
                            value={hr.max_heating_cents ? (hr.max_heating_cents / 100).toFixed(2) : ""}
                            onChange={(e) => updateHouseholdRate(idx, "max_heating_cents", Math.round(parseFloat(e.target.value || "0") * 100))}
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-bold">
                          {formatCurrency(total / 100)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSetupOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={createKduRatesBatch.isPending || deleteKduRatesForBuilding.isPending}>
              <Save className="h-4 w-4 mr-2" /> Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy From Building Dialog */}
      <Dialog open={isCopyOpen} onOpenChange={setIsCopyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>KdU von Gebäude übernehmen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Übernehmen Sie die KdU-Richtwerte eines anderen Gebäudes. Bestehende Werte werden überschrieben.
            </p>
            <div className="space-y-2">
              <Label>Quell-Gebäude</Label>
              <Select value={copySourceId} onValueChange={setCopySourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Gebäude wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {buildings
                    .filter((b: any) => b.id !== selectedBuildingId && buildingsWithKdu.has(b.id))
                    .map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} – {b.city}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCopyOpen(false)}>Abbrechen</Button>
            <Button onClick={handleCopyFromBuilding} disabled={!copySourceId || createKduRatesBatch.isPending}>
              <Copy className="h-4 w-4 mr-2" /> Übernehmen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirmBuildingId}
        onOpenChange={() => setDeleteConfirmBuildingId(null)}
        title="KdU-Richtwerte löschen?"
        description="Alle KdU-Richtwerte für dieses Gebäude werden unwiderruflich gelöscht."
        onConfirm={handleDeleteRates}
      />
    </MainLayout>
  );
}
