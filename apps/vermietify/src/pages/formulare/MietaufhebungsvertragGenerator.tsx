import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Handshake, Eye, FileDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function MietaufhebungsvertragGenerator() {
  const [formData, setFormData] = useState({
    vermieterName: "", mieterName: "", objektAdresse: "",
    beendigungsDatum: "", rueckgabeDatum: "",
    abfindung: "", abfindungBetrag: "",
    kautionsRegelung: "rueckzahlung",
    schoenheitsreparaturen: false,
    sonstigeVereinbarungen: "",
  });
  const [showPreview, setShowPreview] = useState(false);
  const update = (key: string, value: string | boolean) => setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <MainLayout title="Mietaufhebungsvertrag" breadcrumbs={[{ label: "Formulare", href: "/formulare" }, { label: "Mietaufhebungsvertrag" }]}>
      <div className="space-y-6">
        <PageHeader title="Mietaufhebungsvertrag" subtitle="Einvernehmliche Auflösung des Mietverhältnisses." actions={<Button variant="outline" asChild><Link to="/formulare"><ArrowLeft className="mr-2 h-4 w-4" />Alle Formulare</Link></Button>} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Parteien</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2"><Label>Vermieter *</Label><Input value={formData.vermieterName} onChange={(e) => update("vermieterName", e.target.value)} /></div>
                <div className="space-y-2"><Label>Mieter *</Label><Input value={formData.mieterName} onChange={(e) => update("mieterName", e.target.value)} /></div>
                <div className="space-y-2"><Label>Mietobjekt *</Label><Input value={formData.objektAdresse} onChange={(e) => update("objektAdresse", e.target.value)} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Aufhebungsdetails</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Beendigungsdatum *</Label><Input type="date" value={formData.beendigungsDatum} onChange={(e) => update("beendigungsDatum", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Wohnungsrückgabe *</Label><Input type="date" value={formData.rueckgabeDatum} onChange={(e) => update("rueckgabeDatum", e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Abfindung (optional)</Label><Input type="number" value={formData.abfindungBetrag} onChange={(e) => update("abfindungBetrag", e.target.value)} placeholder="0,00 EUR" /></div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={formData.schoenheitsreparaturen} onCheckedChange={(v) => update("schoenheitsreparaturen", !!v)} />
                  <Label className="text-sm">Mieter von Schönheitsreparaturen befreit</Label>
                </div>
                <div className="space-y-2"><Label>Sonstige Vereinbarungen</Label><Textarea value={formData.sonstigeVereinbarungen} onChange={(e) => update("sonstigeVereinbarungen", e.target.value)} rows={3} /></div>
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
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Handshake className="h-5 w-5" />Vorschau</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-3 text-sm">
                    <p className="text-center font-bold text-lg">Mietaufhebungsvertrag</p>
                    <p>Zwischen <strong>{formData.vermieterName || "[Vermieter]"}</strong> (Vermieter) und <strong>{formData.mieterName || "[Mieter]"}</strong> (Mieter) wird folgende Vereinbarung getroffen:</p>
                    <p><strong>§ 1 Aufhebung</strong></p>
                    <p>Die Parteien heben das Mietverhältnis über die Wohnung {formData.objektAdresse || "[Adresse]"} einvernehmlich zum {formData.beendigungsDatum ? new Date(formData.beendigungsDatum).toLocaleDateString("de-DE") : "[Datum]"} auf.</p>
                    <p><strong>§ 2 Wohnungsrückgabe</strong></p>
                    <p>Die Wohnung wird am {formData.rueckgabeDatum ? new Date(formData.rueckgabeDatum).toLocaleDateString("de-DE") : "[Datum]"} in vertragsgemäßem Zustand zurückgegeben.</p>
                    {Number(formData.abfindungBetrag) > 0 && (<><p><strong>§ 3 Abfindung</strong></p><p>Der Vermieter zahlt dem Mieter eine Abfindung in Höhe von {Number(formData.abfindungBetrag).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}.</p></>)}
                    {formData.schoenheitsreparaturen && <p>Der Mieter wird von der Pflicht zur Durchführung von Schönheitsreparaturen befreit.</p>}
                    <p><strong>§ {Number(formData.abfindungBetrag) > 0 ? "4" : "3"} Kaution</strong></p>
                    <p>Die Mietkaution wird nach Abrechnung und Ablauf der gesetzlichen Frist zurückgezahlt.</p>
                    {formData.sonstigeVereinbarungen && (<><p><strong>Sonstige Vereinbarungen</strong></p><p>{formData.sonstigeVereinbarungen}</p></>)}
                    <p><strong>Ausgleichsklausel:</strong> Mit Erfüllung dieses Vertrages sind alle gegenseitigen Ansprüche aus dem Mietverhältnis abgegolten, soweit in dieser Vereinbarung nicht anders geregelt.</p>
                    <div className="mt-12 grid grid-cols-2 gap-8">
                      <div className="border-t pt-2 text-center text-xs text-muted-foreground">Vermieter</div>
                      <div className="border-t pt-2 text-center text-xs text-muted-foreground">Mieter</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[300px]">
                <CardContent className="text-center text-muted-foreground"><Eye className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Vorschau wird nach Ausfüllen angezeigt</p></CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
