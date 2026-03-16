import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Building2, User, Euro, Calendar, CheckSquare, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { OfferWizardData } from "../OfferWizard";

interface Props {
  data: OfferWizardData;
  updateData: (updates: Partial<OfferWizardData>) => void;
}

export function OfferStepSummary({ data, updateData }: Props) {
  const totalCents = data.rentAmountCents + data.utilityAdvanceCents + data.heatingAdvanceCents;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Zusammenfassung</h2>
        <p className="text-muted-foreground">Prüfen Sie die Angaben und bestätigen Sie das Angebot.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Unit */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Mietfläche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{data.selectedUnit?.unit_number}</p>
            <p className="text-sm text-muted-foreground">
              {data.selectedBuilding?.name} – {data.selectedBuilding?.address}, {data.selectedBuilding?.city}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {data.selectedUnit?.rooms || "–"} Zi. · {data.selectedUnit?.area || "–"} m²
            </p>
          </CardContent>
        </Card>

        {/* Tenant */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" /> Interessent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{data.firstName} {data.lastName}</p>
            {data.email && <p className="text-sm text-muted-foreground">{data.email}</p>}
            {data.phone && <p className="text-sm text-muted-foreground">{data.phone}</p>}
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">Interessent</Badge>
              {data.isSocialBenefits && <Badge variant="secondary">Bürgergeld</Badge>}
              {data.schufaStatus && (
                <Badge variant={data.schufaStatus === "positiv" ? "default" : "outline"}>
                  SCHUFA: {data.schufaStatus}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Euro className="h-4 w-4" /> Preiskalkulation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between"><span>Kaltmiete</span><span>{formatCurrency(data.rentAmountCents / 100)}</span></div>
            <div className="flex justify-between"><span>Nebenkosten</span><span>{formatCurrency(data.utilityAdvanceCents / 100)}</span></div>
            <div className="flex justify-between"><span>Heizkosten</span><span>{formatCurrency(data.heatingAdvanceCents / 100)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Warmmiete</span><span>{formatCurrency(totalCents / 100)}</span>
            </div>
            {data.depositAmountCents > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Kaution</span><span>{formatCurrency(data.depositAmountCents / 100)}</span>
              </div>
            )}
          </div>
          {data.isKduEligible && data.kduMaxTotalCents > 0 && (
            <div className="mt-3 p-2 rounded bg-muted/50">
              <p className="text-sm">
                KdU-Höchstbetrag: {formatCurrency(data.kduMaxTotalCents / 100)} · 
                {totalCents <= data.kduMaxTotalCents
                  ? <span className="text-green-600 font-medium ml-1">✓ Konform</span>
                  : <span className="text-destructive font-medium ml-1">✗ Überschritten</span>}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates & Auto-actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Termine & Aktionen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Gewünschter Mietbeginn</span>
            <span className="font-medium">
              {data.proposedStartDate ? format(new Date(data.proposedStartDate), "dd.MM.yyyy", { locale: de }) : "–"}
            </span>
          </div>
          {data.validUntil && (
            <div className="flex justify-between">
              <span>Angebot gültig bis</span>
              <span>{format(new Date(data.validUntil), "dd.MM.yyyy", { locale: de })}</span>
            </div>
          )}
          <Separator />
          <p className="text-sm font-medium">Wird automatisch erstellt:</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckSquare className="h-3.5 w-3.5" /> Aufgabe: SCHUFA prüfen</li>
            <li className="flex items-center gap-2"><CheckSquare className="h-3.5 w-3.5" /> Aufgabe: Unterlagen anfordern</li>
            <li className="flex items-center gap-2"><CheckSquare className="h-3.5 w-3.5" /> Aufgabe: Mietschuldenfreiheit prüfen</li>
            <li className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> Besichtigungstermin (in 3 Tagen)</li>
          </ul>
        </CardContent>
      </Card>

      {data.specialAgreements && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Besondere Vereinbarungen</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{data.specialAgreements}</p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation */}
      <div className="flex items-center space-x-2 p-4 rounded-lg border">
        <Checkbox
          id="confirm"
          checked={data.confirmed}
          onCheckedChange={(checked) => updateData({ confirmed: checked === true })}
        />
        <label htmlFor="confirm" className="text-sm font-medium cursor-pointer">
          Ich bestätige, dass die Angaben korrekt sind und das Mietangebot erstellt werden soll.
        </label>
      </div>
    </div>
  );
}
