import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Building,
  Flame,
  Calculator,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useBuildings } from "@/hooks/useBuildings";
import {
  useCO2,
  CO2_EMISSION_FACTORS,
  getStageInfo,
  getStageColor,
  CO2_STAGES,
} from "@/hooks/useCO2";

interface CO2CalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedBuildingId?: string;
}

const ENERGY_SOURCE_LABELS: Record<string, string> = {
  gas: "Erdgas",
  oil: "Heizöl",
  fernwaerme: "Fernwärme",
  waermepumpe: "Wärmepumpe",
  pellets: "Holzpellets",
  other: "Sonstige",
};

export function CO2Calculator({
  open,
  onOpenChange,
  preselectedBuildingId,
}: CO2CalculatorProps) {
  const [step, setStep] = useState(1);
  const { useBuildingsList } = useBuildings();
  const { data: buildingsData } = useBuildingsList(1, 100);
  const buildings = buildingsData?.buildings || [];
  const { createCalculation, certificates } = useCO2();

  // Form state
  const [buildingId, setBuildingId] = useState(preselectedBuildingId || "");
  const [periodStart, setPeriodStart] = useState(
    new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split("T")[0]
  );
  const [periodEnd, setPeriodEnd] = useState(
    new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split("T")[0]
  );
  const [heatedArea, setHeatedArea] = useState("");
  const [energySource, setEnergySource] = useState("gas");
  const [energyConsumption, setEnergyConsumption] = useState("");
  const [totalCO2Cost, setTotalCO2Cost] = useState("");

  const selectedBuilding = buildings.find((b) => b.id === buildingId);
  const buildingCertificate = certificates.find((c) => c.building_id === buildingId);

  // Calculated values
  const emissionFactor = CO2_EMISSION_FACTORS[energySource] || 0.2;
  const co2Emissions = parseFloat(energyConsumption || "0") * emissionFactor;
  const co2PerSqm = parseFloat(heatedArea || "0") > 0 ? co2Emissions / parseFloat(heatedArea) : 0;
  const stageInfo = getStageInfo(co2PerSqm);
  const totalCO2CostCents = Math.round(parseFloat(totalCO2Cost || "0") * 100);
  const landlordCost = (totalCO2CostCents * stageInfo.landlordPercent) / 100;
  const tenantCost = totalCO2CostCents - landlordCost;

  const handleSubmit = async () => {
    await createCalculation.mutateAsync({
      building_id: buildingId,
      energy_certificate_id: buildingCertificate?.id,
      period_start: periodStart,
      period_end: periodEnd,
      heated_area_sqm: parseFloat(heatedArea),
      energy_consumption_kwh: parseFloat(energyConsumption),
      energy_source: energySource,
      total_co2_cost_cents: totalCO2CostCents,
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setBuildingId(preselectedBuildingId || "");
    setHeatedArea("");
    setEnergyConsumption("");
    setTotalCO2Cost("");
  };

  const canProceedStep1 = buildingId && heatedArea && energySource;
  const canProceedStep2 = energyConsumption && totalCO2Cost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-primary">🌱</span>
            CO2-Kostenaufteilung berechnen
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Schritt {step} von 4</span>
            <span>
              {step === 1 && "Gebäudedaten"}
              {step === 2 && "Verbrauchsdaten"}
              {step === 3 && "Berechnung"}
              {step === 4 && "Ergebnis"}
            </span>
          </div>
          <Progress value={step * 25} className="h-2" />
        </div>

        {/* Step 1: Building Data */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Gebäude auswählen</Label>
              <Select value={buildingId} onValueChange={setBuildingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Gebäude wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {building.name} - {building.address}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBuilding && (
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4" />
                  <span className="font-medium">{selectedBuilding.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedBuilding.address}</p>
                {buildingCertificate && (
                  <Badge variant="outline" className="mt-2">
                    Energieausweis vorhanden
                  </Badge>
                )}
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Abrechnungszeitraum von</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>bis</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beheizbare Fläche (m²)</Label>
              <Input
                type="number"
                placeholder="z.B. 500"
                value={heatedArea}
                onChange={(e) => setHeatedArea(e.target.value)}
              />
              {selectedBuilding?.total_area && (
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => setHeatedArea(selectedBuilding.total_area?.toString() || "")}
                >
                  Gesamtfläche übernehmen ({selectedBuilding.total_area} m²)
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Energieträger</Label>
              <Select value={energySource} onValueChange={setEnergySource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ENERGY_SOURCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                CO2-Faktor: {CO2_EMISSION_FACTORS[energySource]} kg/kWh
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Consumption Data */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="p-4 bg-muted/50">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Gebäude:</span>{" "}
                  {selectedBuilding?.name}
                </div>
                <div>
                  <span className="text-muted-foreground">Fläche:</span> {heatedArea} m²
                </div>
                <div>
                  <span className="text-muted-foreground">Energieträger:</span>{" "}
                  {ENERGY_SOURCE_LABELS[energySource]}
                </div>
                <div>
                  <span className="text-muted-foreground">Zeitraum:</span> {periodStart} bis{" "}
                  {periodEnd}
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Label>Energieverbrauch (kWh)</Label>
              <Input
                type="number"
                placeholder="z.B. 50000"
                value={energyConsumption}
                onChange={(e) => setEnergyConsumption(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Gesamtverbrauch für Heizung im Abrechnungszeitraum
              </p>
            </div>

            <div className="space-y-2">
              <Label>CO2-Kosten gesamt (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="z.B. 1500.00"
                value={totalCO2Cost}
                onChange={(e) => setTotalCO2Cost(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                CO2-Abgabe laut Brennstoffrechnung oder Heizkostenabrechnung
              </p>
            </div>

            {energyConsumption && (
              <Card className="p-4 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Calculator className="h-4 w-4" />
                  <span className="font-medium">Vorläufige Berechnung</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>CO2-Ausstoß:</div>
                  <div className="font-medium">{co2Emissions.toFixed(0)} kg</div>
                  <div>Pro m²/Jahr:</div>
                  <div className="font-medium">{co2PerSqm.toFixed(1)} kg/m²/a</div>
                </div>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Calculation */}
        {step === 3 && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Berechnung nach CO2KostAufG
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Energieverbrauch</span>
                  <span>{parseFloat(energyConsumption).toLocaleString("de-DE")} kWh</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">× CO2-Emissionsfaktor</span>
                  <span>{emissionFactor} kg/kWh</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">= CO2-Ausstoß</span>
                  <span className="font-medium">{co2Emissions.toFixed(0)} kg</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">÷ Beheizbare Fläche</span>
                  <span>{heatedArea} m²</span>
                </div>
                <div className="flex justify-between py-2 border-b bg-muted/30 -mx-4 px-4">
                  <span className="font-medium">= CO2-Ausstoß pro m²/Jahr</span>
                  <span className="font-bold text-lg">{co2PerSqm.toFixed(1)} kg/m²/a</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-4">Stufeneinordnung nach CO2KostAufG</h3>
              <div className="space-y-2">
                {CO2_STAGES.map((stage) => (
                  <div
                    key={stage.stage}
                    className={`flex items-center justify-between p-2 rounded ${
                      stageInfo.stage === stage.stage ? "bg-primary/10 ring-1 ring-primary" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStageColor(stage.stage)} text-primary-foreground`}>
                        Stufe {stage.stage}
                      </Badge>
                      <span className="text-sm">
                        {stage.maxKg === Infinity
                          ? `> 52 kg/m²/a`
                          : stage.stage === 1
                          ? `< ${stage.maxKg} kg/m²/a`
                          : `${CO2_STAGES[stage.stage - 2].maxKg} - ${stage.maxKg} kg/m²/a`}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Vermieter:</span>{" "}
                      <span className="font-medium">{stage.landlordPercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
              <Button onClick={() => setStep(4)}>
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 4 && (
          <div className="space-y-4">
            <Card className="p-6 text-center border-primary/20 bg-primary/5">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Ergebnis der CO2-Kostenaufteilung</h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge className={`${getStageColor(stageInfo.stage)} text-primary-foreground text-lg px-4 py-1`}>
                  Stufe {stageInfo.stage}
                </Badge>
                <span className="text-lg">{co2PerSqm.toFixed(1)} kg CO2/m²/a</span>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-4">Kostenaufteilung</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span>CO2-Kosten gesamt</span>
                  <span className="font-bold">
                    {(totalCO2CostCents / 100).toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-destructive/10 border-destructive/20">
                    <div className="text-center">
                      <div className="text-sm text-destructive mb-1">Vermieter-Anteil</div>
                      <div className="text-2xl font-bold text-destructive">
                        {stageInfo.landlordPercent}%
                      </div>
                      <div className="text-lg font-medium mt-2">
                        {(landlordCost / 100).toLocaleString("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-primary/10 border-primary/20">
                    <div className="text-center">
                      <div className="text-sm text-primary mb-1">Mieter-Anteil</div>
                      <div className="text-2xl font-bold text-primary">
                        {100 - stageInfo.landlordPercent}%
                      </div>
                      <div className="text-lg font-medium mt-2">
                        {(tenantCost / 100).toLocaleString("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createCalculation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {createCalculation.isPending ? "Speichern..." : "Berechnung speichern"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
