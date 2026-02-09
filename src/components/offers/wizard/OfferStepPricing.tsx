import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRentalOffers } from "@/hooks/useRentalOffers";
import { formatCurrency } from "@/lib/utils";
import { Euro, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { OfferWizardData } from "../OfferWizard";

interface Props {
  data: OfferWizardData;
  updateData: (updates: Partial<OfferWizardData>) => void;
}

export function OfferStepPricing({ data, updateData }: Props) {
  const { useKduRates } = useRentalOffers();
  const { data: kduRates } = useKduRates(data.buildingId || undefined);

  // Find matching KdU rate for the selected building and household size
  const matchingRate = kduRates?.find((r: any) => r.household_size === data.householdSize);

  // Auto-set KdU values when match found
  useEffect(() => {
    if (matchingRate && data.isKduEligible) {
      updateData({
        kduRateId: matchingRate.id,
        kduMaxTotalCents: matchingRate.max_total_cents,
      });

      // Auto-calculate optimal rent if not yet set
      if (data.rentAmountCents === 0) {
        updateData({
          rentAmountCents: matchingRate.max_rent_cents,
          utilityAdvanceCents: matchingRate.max_utilities_cents,
          heatingAdvanceCents: matchingRate.max_heating_cents,
        });
      }
    }
  }, [matchingRate, data.isKduEligible, data.householdSize]);

  const totalCents = data.rentAmountCents + data.utilityAdvanceCents + data.heatingAdvanceCents;
  const isWithinKdu = data.isKduEligible && data.kduMaxTotalCents > 0 && totalCents <= data.kduMaxTotalCents;
  const isOverKdu = data.isKduEligible && data.kduMaxTotalCents > 0 && totalCents > data.kduMaxTotalCents;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Preiskalkulation</h2>
        <p className="text-muted-foreground">
          {data.isKduEligible
            ? "KdU-optimierte Berechnung – die Werte wurden anhand der hinterlegten Richtwerte vorausgefüllt."
            : "Legen Sie Miete, Nebenkosten und Kaution fest."}
        </p>
      </div>

      {data.isKduEligible && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm text-blue-800 dark:text-blue-200">KdU-Berechnung aktiv</p>
                {matchingRate ? (
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    <p>Kommune: <strong>{matchingRate.municipality}</strong> · Haushaltsgröße: <strong>{matchingRate.household_size}</strong></p>
                    <p className="mt-1">
                      Max. Kaltmiete: {formatCurrency(matchingRate.max_rent_cents / 100)} · 
                      Max. Gesamt: <strong>{formatCurrency(matchingRate.max_total_cents / 100)}</strong>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Kein KdU-Satz für {data.selectedBuilding?.city || "diese Kommune"} mit {data.householdSize} Person(en) hinterlegt. 
                    Bitte unter Einstellungen → KdU-Richtwerte ergänzen.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Mietkosten</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Kaltmiete (€) *</Label>
              <Input
                type="number" step="0.01"
                value={data.rentAmountCents ? (data.rentAmountCents / 100).toFixed(2) : ""}
                onChange={(e) => updateData({ rentAmountCents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Nebenkosten (€)</Label>
              <Input
                type="number" step="0.01"
                value={data.utilityAdvanceCents ? (data.utilityAdvanceCents / 100).toFixed(2) : ""}
                onChange={(e) => updateData({ utilityAdvanceCents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Heizkosten (€)</Label>
              <Input
                type="number" step="0.01"
                value={data.heatingAdvanceCents ? (data.heatingAdvanceCents / 100).toFixed(2) : ""}
                onChange={(e) => updateData({ heatingAdvanceCents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-muted/50 flex items-center justify-between">
            <span className="font-medium">Warmmiete gesamt</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{formatCurrency(totalCents / 100)}</span>
              {isWithinKdu && (
                <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> KdU-konform</Badge>
              )}
              {isOverKdu && (
                <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Über KdU-Grenze</Badge>
              )}
            </div>
          </div>

          {isOverKdu && (
            <Alert variant="destructive" className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Die Warmmiete überschreitet den KdU-Höchstbetrag von {formatCurrency(data.kduMaxTotalCents / 100)} um{" "}
                {formatCurrency((totalCents - data.kduMaxTotalCents) / 100)}.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Kaution & Termine</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Kaution (€)</Label>
              <Input
                type="number" step="0.01"
                value={data.depositAmountCents ? (data.depositAmountCents / 100).toFixed(2) : ""}
                onChange={(e) => updateData({ depositAmountCents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                placeholder="0,00"
              />
              {data.rentAmountCents > 0 && (
                <p className="text-xs text-muted-foreground">
                  Max. 3 Kaltmieten = {formatCurrency((data.rentAmountCents * 3) / 100)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Gewünschter Mietbeginn *</Label>
              <Input type="date" value={data.proposedStartDate} onChange={(e) => updateData({ proposedStartDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Angebot gültig bis</Label>
              <Input type="date" value={data.validUntil} onChange={(e) => updateData({ validUntil: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Besondere Vereinbarungen</CardTitle></CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={data.specialAgreements}
            onChange={(e) => updateData({ specialAgreements: e.target.value })}
            placeholder="z.B. Renovierungsvereinbarung, Stellplatz inklusive..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
