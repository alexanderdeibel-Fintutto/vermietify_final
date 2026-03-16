import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Eye, FileDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function UntermieterlaubnisGenerator() {
  const [formData, setFormData] = useState({
    vermieterName: "", mieterName: "", objektAdresse: "",
    untermieterName: "", untermieterGeburtsdatum: "",
    teilflaeche: "", untermiete: "",
    befristet: false, befristetBis: "",
    bedingungen: "",
  });
  const [showPreview, setShowPreview] = useState(false);
  const update = (key: string, value: string | boolean) => setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <MainLayout title="Untermieterlaubnis" breadcrumbs={[{ label: "Formulare", href: "/formulare" }, { label: "Untermieterlaubnis" }]}>
      <div className="space-y-6">
        <PageHeader title="Untermieterlaubnis" subtitle="Genehmigung zur Untervermietung gemäß § 540 BGB." actions={<Button variant="outline" asChild><Link to="/formulare"><ArrowLeft className="mr-2 h-4 w-4" />Alle Formulare</Link></Button>} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Parteien</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2"><Label>Vermieter *</Label><Input value={formData.vermieterName} onChange={(e) => update("vermieterName", e.target.value)} /></div>
                <div className="space-y-2"><Label>Hauptmieter *</Label><Input value={formData.mieterName} onChange={(e) => update("mieterName", e.target.value)} /></div>
                <div className="space-y-2"><Label>Mietobjekt *</Label><Input value={formData.objektAdresse} onChange={(e) => update("objektAdresse", e.target.value)} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Untermieter</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2"><Label>Name des Untermieters *</Label><Input value={formData.untermieterName} onChange={(e) => update("untermieterName", e.target.value)} /></div>
                <div className="space-y-2"><Label>Geburtsdatum</Label><Input type="date" value={formData.untermieterGeburtsdatum} onChange={(e) => update("untermieterGeburtsdatum", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Untervermietete Fläche</Label><Input value={formData.teilflaeche} onChange={(e) => update("teilflaeche", e.target.value)} placeholder="z.B. 1 Zimmer" /></div>
                  <div className="space-y-2"><Label>Untermiete (EUR)</Label><Input type="number" value={formData.untermiete} onChange={(e) => update("untermiete", e.target.value)} /></div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={formData.befristet} onCheckedChange={(v) => update("befristet", !!v)} />
                  <Label className="text-sm">Befristete Erlaubnis</Label>
                </div>
                {formData.befristet && (
                  <div className="space-y-2"><Label>Befristet bis</Label><Input type="date" value={formData.befristetBis} onChange={(e) => update("befristetBis", e.target.value)} /></div>
                )}
                <div className="space-y-2"><Label>Besondere Bedingungen</Label><Textarea value={formData.bedingungen} onChange={(e) => update("bedingungen", e.target.value)} rows={3} /></div>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button onClick={() => setShowPreview(true)} className="flex-1"><Eye className="h-4 w-4 mr-2" />Vorschau</Button>
              <Button variant="outline"><FileDown className="h-4 w-4 mr-2" />PDF</Button>
            </div>
          </div>
          <div>
            {showPreview ? (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" />Vorschau</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-3 text-sm">
                    <p className="text-center font-bold text-lg">Untermieterlaubnis</p>
                    <p>Der Vermieter <strong>{formData.vermieterName || "[Vermieter]"}</strong> erteilt dem Hauptmieter <strong>{formData.mieterName || "[Mieter]"}</strong> hiermit die Erlaubnis zur Untervermietung der Wohnung / eines Teils der Wohnung {formData.objektAdresse || "[Adresse]"} an:</p>
                    <p className="font-medium">{formData.untermieterName || "[Untermieter]"}</p>
                    {formData.teilflaeche && <p>Untervermieteter Bereich: {formData.teilflaeche}</p>}
                    {formData.befristet && formData.befristetBis && <p>Die Erlaubnis ist befristet bis zum {new Date(formData.befristetBis).toLocaleDateString("de-DE")}.</p>}
                    {!formData.befristet && <p>Die Erlaubnis gilt unbefristet und kann vom Vermieter mit einer Frist von 3 Monaten widerrufen werden.</p>}
                    <p>Der Hauptmieter bleibt weiterhin alleiniger Vertragspartner des Vermieters und haftet für alle Verpflichtungen aus dem Hauptmietvertrag.</p>
                    {formData.bedingungen && <><p><strong>Besondere Bedingungen:</strong></p><p>{formData.bedingungen}</p></>}
                    <div className="mt-12 grid grid-cols-2 gap-8">
                      <div className="border-t pt-2 text-center text-xs text-muted-foreground">Ort, Datum, Vermieter</div>
                      <div className="border-t pt-2 text-center text-xs text-muted-foreground">Ort, Datum, Hauptmieter</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[300px]">
                <CardContent className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Vorschau wird nach Ausfüllen angezeigt</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
