import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Scale, Eye, FileDown, ArrowLeft, Info } from "lucide-react";
import { Link } from "react-router-dom";

export default function NebenkostenwiderspruchReaktion() {
  const [formData, setFormData] = useState({
    vermieterName: "",
    mieterName: "",
    objektAdresse: "",
    abrechnungszeitraum: "",
    widerspruchPunkte: "",
    nachforderung: "",
    korrigierterBetrag: "",
    stellungnahme: "",
    belegeAngeboten: false,
    fristVerlaengerung: false,
  });
  const [showPreview, setShowPreview] = useState(false);

  const update = (key: string, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <MainLayout
      title="NK-Widerspruch Reaktion"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "NK-Widerspruch Reaktion" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Reaktion auf Nebenkostenwiderspruch"
          subtitle="Erstellen Sie eine rechtssichere Antwort auf den Widerspruch eines Mieters gegen die Nebenkostenabrechnung."
          actions={
            <Button variant="outline" asChild>
              <Link to="/formulare"><ArrowLeft className="mr-2 h-4 w-4" />Alle Formulare</Link>
            </Button>
          }
        />

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Rechtlicher Hinweis</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Der Mieter hat 12 Monate nach Zugang der Abrechnung Zeit für Einwendungen</li>
                  <li>Sie sind verpflichtet, Belege zur Einsicht zur Verfügung zu stellen</li>
                  <li>Bei berechtigten Einwendungen muss die Abrechnung korrigiert werden</li>
                  <li>Prüfen Sie jeden Einwand einzeln und sachlich</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Grunddaten</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Vermieter *</Label>
                  <Input value={formData.vermieterName} onChange={(e) => update("vermieterName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Mieter *</Label>
                  <Input value={formData.mieterName} onChange={(e) => update("mieterName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Mietobjekt *</Label>
                  <Input value={formData.objektAdresse} onChange={(e) => update("objektAdresse", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Abrechnungszeitraum *</Label>
                  <Input value={formData.abrechnungszeitraum} onChange={(e) => update("abrechnungszeitraum", e.target.value)} placeholder="01.01.2025 - 31.12.2025" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Widerspruch & Stellungnahme</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Widerspruchspunkte des Mieters *</Label>
                  <Textarea value={formData.widerspruchPunkte} onChange={(e) => update("widerspruchPunkte", e.target.value)} placeholder="Die vom Mieter beanstandeten Positionen..." rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Ursprüngliche Nachforderung</Label>
                    <Input type="number" value={formData.nachforderung} onChange={(e) => update("nachforderung", e.target.value)} placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Korrigierter Betrag</Label>
                    <Input type="number" value={formData.korrigierterBetrag} onChange={(e) => update("korrigierterBetrag", e.target.value)} placeholder="0,00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ihre Stellungnahme *</Label>
                  <Textarea value={formData.stellungnahme} onChange={(e) => update("stellungnahme", e.target.value)} placeholder="Ihre Antwort auf die einzelnen Widerspruchspunkte..." rows={6} />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={formData.belegeAngeboten} onCheckedChange={(v) => update("belegeAngeboten", !!v)} />
                  <Label className="text-sm">Belegeinsicht anbieten</Label>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => setShowPreview(true)} className="flex-1">
                <Eye className="h-4 w-4 mr-2" />Vorschau
              </Button>
              <Button variant="outline"><FileDown className="h-4 w-4 mr-2" />PDF</Button>
            </div>
          </div>

          <div>
            {showPreview ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Scale className="h-5 w-5" />Vorschau
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-4 text-sm">
                    <div className="text-right">
                      <p>{formData.vermieterName || "[Vermieter]"}</p>
                      <p>{new Date().toLocaleDateString("de-DE")}</p>
                    </div>
                    <p>{formData.mieterName || "[Mieter]"}</p>
                    <p className="font-bold">Stellungnahme zu Ihrem Widerspruch gegen die Nebenkostenabrechnung {formData.abrechnungszeitraum || "[Zeitraum]"}</p>
                    <p>Sehr geehrte/r {formData.mieterName || "[Mieter]"},</p>
                    <p>vielen Dank für Ihr Schreiben bezüglich der Nebenkostenabrechnung für den Zeitraum {formData.abrechnungszeitraum || "[Zeitraum]"} für das Mietobjekt {formData.objektAdresse || "[Adresse]"}.</p>
                    <p>Zu Ihren Einwendungen nehme ich wie folgt Stellung:</p>
                    <p>{formData.stellungnahme || "[Stellungnahme]"}</p>
                    {formData.korrigierterBetrag && formData.nachforderung !== formData.korrigierterBetrag && (
                      <p>Nach erneuter Prüfung ergibt sich ein korrigierter Nachforderungsbetrag von <strong>{Number(formData.korrigierterBetrag).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</strong> (zuvor: {Number(formData.nachforderung).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}).</p>
                    )}
                    {formData.belegeAngeboten && (
                      <p>Gerne biete ich Ihnen die Möglichkeit der Belegeinsicht an. Bitte vereinbaren Sie hierzu einen Termin.</p>
                    )}
                    <p>Mit freundlichen Grüßen</p>
                    <p className="mt-8 border-t pt-2">{formData.vermieterName || "[Unterschrift]"}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Vorschau wird nach Ausfüllen angezeigt</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
