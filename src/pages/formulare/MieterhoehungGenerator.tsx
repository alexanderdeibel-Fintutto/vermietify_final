import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Eye, FileDown, ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function MieterhoehungGenerator() {
  const [formData, setFormData] = useState({
    typ: "vergleichsmiete" as "vergleichsmiete" | "modernisierung" | "index",
    vermieterName: "", mieterName: "", objektAdresse: "", flaeche: "",
    aktuelleMiete: "", neueMiete: "",
    vergleichsmieteQuelle: "", letzteMieterhoehung: "",
    modernisierungskosten: "", modernisierungsBeschreibung: "",
    basisVPI: "", aktuellerVPI: "", basisMiete: "",
  });
  const [showPreview, setShowPreview] = useState(false);
  const update = (key: string, value: string) => setFormData((prev) => ({ ...prev, [key]: value }));

  const checks = useMemo(() => {
    const alt = Number(formData.aktuelleMiete) || 0;
    const neu = Number(formData.neueMiete) || 0;
    const steigerung = alt > 0 ? ((neu - alt) / alt) * 100 : 0;
    const kappungsgrenze = steigerung <= 20;
    const flaeche = Number(formData.flaeche) || 1;
    const steigerungProQm = (neu - alt) / flaeche;

    if (formData.typ === "modernisierung") {
      const kosten = Number(formData.modernisierungskosten) || 0;
      const maxErhoehung = kosten * 0.08 / 12;
      const kappungMod = steigerungProQm <= 3;
      return { steigerung, kappungsgrenze: kappungMod, maxErhoehung, steigerungProQm };
    }
    return { steigerung, kappungsgrenze, maxErhoehung: 0, steigerungProQm };
  }, [formData]);

  return (
    <MainLayout title="Mieterhöhung" breadcrumbs={[{ label: "Formulare", href: "/formulare" }, { label: "Mieterhöhung" }]}>
      <div className="space-y-6">
        <PageHeader title="Mieterhöhungsverlangen" subtitle="Mieterhöhung nach § 558, § 559 oder § 557b BGB erstellen." actions={<Button variant="outline" asChild><Link to="/formulare"><ArrowLeft className="mr-2 h-4 w-4" />Alle Formulare</Link></Button>} />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Art der Mieterhöhung</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={formData.typ} onValueChange={(v) => update("typ", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vergleichsmiete">Vergleichsmiete (§ 558 BGB)</SelectItem>
                    <SelectItem value="modernisierung">Modernisierungsumlage (§ 559 BGB)</SelectItem>
                    <SelectItem value="index">Indexmiete (§ 557b BGB)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Parteien & Objekt</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2"><Label>Vermieter *</Label><Input value={formData.vermieterName} onChange={(e) => update("vermieterName", e.target.value)} /></div>
                <div className="space-y-2"><Label>Mieter *</Label><Input value={formData.mieterName} onChange={(e) => update("mieterName", e.target.value)} /></div>
                <div className="space-y-2"><Label>Mietobjekt *</Label><Input value={formData.objektAdresse} onChange={(e) => update("objektAdresse", e.target.value)} /></div>
                <div className="space-y-2"><Label>Wohnfläche (m²)</Label><Input type="number" value={formData.flaeche} onChange={(e) => update("flaeche", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Mietbeträge</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Aktuelle Kaltmiete *</Label><Input type="number" value={formData.aktuelleMiete} onChange={(e) => update("aktuelleMiete", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Neue Kaltmiete *</Label><Input type="number" value={formData.neueMiete} onChange={(e) => update("neueMiete", e.target.value)} /></div>
                </div>

                {formData.typ === "vergleichsmiete" && (
                  <>
                    <div className="space-y-2"><Label>Begründung / Quelle</Label><Textarea value={formData.vergleichsmieteQuelle} onChange={(e) => update("vergleichsmieteQuelle", e.target.value)} placeholder="z.B. Mietspiegel der Stadt München 2024, Spalte 5, Zeile 3" rows={2} /></div>
                    <div className="space-y-2"><Label>Letzte Mieterhöhung</Label><Input type="date" value={formData.letzteMieterhoehung} onChange={(e) => update("letzteMieterhoehung", e.target.value)} /></div>
                  </>
                )}

                {formData.typ === "modernisierung" && (
                  <>
                    <div className="space-y-2"><Label>Modernisierungskosten (gesamt)</Label><Input type="number" value={formData.modernisierungskosten} onChange={(e) => update("modernisierungskosten", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Beschreibung der Modernisierung</Label><Textarea value={formData.modernisierungsBeschreibung} onChange={(e) => update("modernisierungsBeschreibung", e.target.value)} rows={3} /></div>
                    {Number(formData.modernisierungskosten) > 0 && (
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <p>Max. Umlage (8% p.a.): <strong>{(Number(formData.modernisierungskosten) * 0.08 / 12).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}/Monat</strong></p>
                      </div>
                    )}
                  </>
                )}

                {formData.typ === "index" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Basis-VPI</Label><Input type="number" step="0.1" value={formData.basisVPI} onChange={(e) => update("basisVPI", e.target.value)} placeholder="z.B. 115.2" /></div>
                    <div className="space-y-2"><Label>Aktueller VPI</Label><Input type="number" step="0.1" value={formData.aktuellerVPI} onChange={(e) => update("aktuellerVPI", e.target.value)} placeholder="z.B. 127.8" /></div>
                  </div>
                )}

                {/* Validation */}
                {Number(formData.aktuelleMiete) > 0 && Number(formData.neueMiete) > 0 && (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Steigerung: <strong>{checks.steigerung.toFixed(1)}%</strong></span>
                      {checks.kappungsgrenze ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Kappungsgrenze OK</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700"><AlertTriangle className="h-3 w-3 mr-1" />Kappungsgrenze überschritten!</Badge>
                      )}
                    </div>
                  </div>
                )}
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
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5" />Vorschau</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-3 text-sm">
                    <div className="text-right"><p>{formData.vermieterName || "[Vermieter]"}</p><p>{new Date().toLocaleDateString("de-DE")}</p></div>
                    <p>{formData.mieterName || "[Mieter]"}</p>
                    <p className="font-bold">Mieterhöhungsverlangen {formData.typ === "vergleichsmiete" ? "auf die ortsübliche Vergleichsmiete (§ 558 BGB)" : formData.typ === "modernisierung" ? "wegen Modernisierung (§ 559 BGB)" : "aufgrund Indexanpassung (§ 557b BGB)"}</p>
                    <p>Sehr geehrte/r {formData.mieterName || "[Mieter]"},</p>
                    <p>bezüglich des Mietverhältnisses über die Wohnung {formData.objektAdresse || "[Adresse]"} verlange ich hiermit die Zustimmung zu folgender Mieterhöhung:</p>
                    <table className="w-full text-sm border"><tbody>
                      <tr className="border-b"><td className="p-2">Bisherige Kaltmiete</td><td className="p-2 text-right font-medium">{Number(formData.aktuelleMiete || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td></tr>
                      <tr className="border-b"><td className="p-2">Neue Kaltmiete</td><td className="p-2 text-right font-medium">{Number(formData.neueMiete || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td></tr>
                      <tr><td className="p-2">Erhöhung</td><td className="p-2 text-right font-medium">{(Number(formData.neueMiete || 0) - Number(formData.aktuelleMiete || 0)).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} ({checks.steigerung.toFixed(1)}%)</td></tr>
                    </tbody></table>
                    {formData.typ === "vergleichsmiete" && formData.vergleichsmieteQuelle && (
                      <p><strong>Begründung:</strong> {formData.vergleichsmieteQuelle}</p>
                    )}
                    {formData.typ === "modernisierung" && formData.modernisierungsBeschreibung && (
                      <p><strong>Durchgeführte Modernisierung:</strong> {formData.modernisierungsBeschreibung}</p>
                    )}
                    <p>Ich bitte Sie, der Mieterhöhung bis zum Ablauf des übernächsten Monats nach Zugang dieses Schreibens zuzustimmen. Die erhöhte Miete ist ab dem dritten Kalendermonat nach Zugang dieses Erhöhungsverlangens zu zahlen.</p>
                    <p>Mit freundlichen Grüßen</p>
                    <p className="mt-8 border-t pt-2">{formData.vermieterName || "[Unterschrift]"}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]"><CardContent className="text-center text-muted-foreground"><Eye className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Vorschau wird nach Ausfüllen angezeigt</p></CardContent></Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
