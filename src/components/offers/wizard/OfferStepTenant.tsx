import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, Calendar, User, Banknote, Shield, Home } from "lucide-react";
import type { OfferWizardData } from "../OfferWizard";

interface Props {
  data: OfferWizardData;
  updateData: (updates: Partial<OfferWizardData>) => void;
}

export function OfferStepTenant({ data, updateData }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Interessent anlegen</h2>
        <p className="text-muted-foreground">
          Der Interessent wird automatisch als potenzieller Mieter erfasst.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Persönliche Daten</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Vorname *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="firstName" value={data.firstName} onChange={(e) => updateData({ firstName: e.target.value })} placeholder="Max" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nachname *</Label>
              <Input id="lastName" value={data.lastName} onChange={(e) => updateData({ lastName: e.target.value })} placeholder="Mustermann" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={data.email} onChange={(e) => updateData({ email: e.target.value })} placeholder="max@beispiel.de" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="phone" type="tel" value={data.phone} onChange={(e) => updateData({ phone: e.target.value })} placeholder="+49 123 456789" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Geburtsdatum</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="birthDate" type="date" value={data.birthDate} onChange={(e) => updateData({ birthDate: e.target.value })} className="pl-9" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Sozialstatus & Bonität</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Banknote className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Bürgergeld / ALG2-Empfänger</p>
                <p className="text-xs text-muted-foreground">KdU-Berechnung wird aktiviert</p>
              </div>
            </div>
            <Switch checked={data.isSocialBenefits} onCheckedChange={(v) => updateData({ isSocialBenefits: v, isKduEligible: v })} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Haushaltsgröße</Label>
              <Select value={String(data.householdSize)} onValueChange={(v) => updateData({ householdSize: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "Person" : "Personen"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monatliches Einkommen (€)</Label>
              <Input type="number" value={data.incomeCents ? (data.incomeCents / 100).toFixed(2) : ""} onChange={(e) => updateData({ incomeCents: Math.round(parseFloat(e.target.value || "0") * 100) })} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Vorheriger Vermieter</Label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={data.previousLandlord} onChange={(e) => updateData({ previousLandlord: e.target.value })} placeholder="Name des Vermieters" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>SCHUFA-Status</Label>
              <Select value={data.schufaStatus} onValueChange={(v) => updateData({ schufaStatus: v })}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <SelectValue placeholder="Status wählen" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nicht_geprüft">Nicht geprüft</SelectItem>
                  <SelectItem value="positiv">Positiv</SelectItem>
                  <SelectItem value="negativ">Negativ</SelectItem>
                  <SelectItem value="ausstehend">Ausstehend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
