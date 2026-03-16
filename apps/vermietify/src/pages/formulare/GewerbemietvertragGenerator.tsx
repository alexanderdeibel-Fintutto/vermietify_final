import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Eye, FileDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function GewerbemietvertragGenerator() {
  const [formData, setFormData] = useState({
    vermieterName: "",
    vermieterAdresse: "",
    mieterFirma: "",
    mieterVertretung: "",
    mieterAdresse: "",
    objektAdresse: "",
    nutzungszweck: "",
    flaeche: "",
    nettomiete: "",
    nebenkostenvorauszahlung: "",
    mwst: true,
    kaution: "",
    mietbeginn: "",
    laufzeit: "5",
    verlaengerung: "5",
    kuendigungsfrist: "6",
    indexklausel: true,
    konkurrenzschutz: false,
    konkurrenzschutzText: "",
    sondervereinbarungen: "",
  });
  const [showPreview, setShowPreview] = useState(false);

  const update = (key: string, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const netto = Number(formData.nettomiete) || 0;
  const mwst = formData.mwst ? netto * 0.19 : 0;
  const brutto = netto + mwst + (Number(formData.nebenkostenvorauszahlung) || 0);

  return (
    <MainLayout
      title="Gewerbemietvertrag"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Gewerbemietvertrag" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Gewerbemietvertrag-Generator"
          subtitle="Mietvertrag für gewerbliche Flächen erstellen."
          actions={
            <Button variant="outline" asChild>
              <Link to="/formulare"><ArrowLeft className="mr-2 h-4 w-4" />Alle Formulare</Link>
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Vermieter</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Name / Firma *</Label>
                  <Input value={formData.vermieterName} onChange={(e) => update("vermieterName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Adresse *</Label>
                  <Input value={formData.vermieterAdresse} onChange={(e) => update("vermieterAdresse", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Mieter (Gewerbe)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Firma *</Label>
                  <Input value={formData.mieterFirma} onChange={(e) => update("mieterFirma", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gesetzlicher Vertreter</Label>
                  <Input value={formData.mieterVertretung} onChange={(e) => update("mieterVertretung", e.target.value)} placeholder="Geschäftsführer/in" />
                </div>
                <div className="space-y-2">
                  <Label>Geschäftsadresse</Label>
                  <Input value={formData.mieterAdresse} onChange={(e) => update("mieterAdresse", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Mietobjekt</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Adresse *</Label>
                  <Input value={formData.objektAdresse} onChange={(e) => update("objektAdresse", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Fläche (m²) *</Label>
                    <Input type="number" value={formData.flaeche} onChange={(e) => update("flaeche", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nutzungszweck *</Label>
                    <Select value={formData.nutzungszweck} onValueChange={(v) => update("nutzungszweck", v)}>
                      <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buero">Büro</SelectItem>
                        <SelectItem value="laden">Laden / Einzelhandel</SelectItem>
                        <SelectItem value="gastronomie">Gastronomie</SelectItem>
                        <SelectItem value="praxis">Praxis</SelectItem>
                        <SelectItem value="lager">Lager / Werkstatt</SelectItem>
                        <SelectItem value="sonstig">Sonstige gewerbliche Nutzung</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Konditionen</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nettomiete / Monat *</Label>
                    <Input type="number" value={formData.nettomiete} onChange={(e) => update("nettomiete", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>NK-Vorauszahlung</Label>
                    <Input type="number" value={formData.nebenkostenvorauszahlung} onChange={(e) => update("nebenkostenvorauszahlung", e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={formData.mwst} onCheckedChange={(v) => update("mwst", !!v)} />
                  <Label className="text-sm">Umsatzsteuer-Option (§ 9 UStG) — zzgl. 19% MwSt</Label>
                </div>
                {netto > 0 && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <div className="flex justify-between"><span>Nettomiete:</span><span>{netto.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span></div>
                    {formData.mwst && <div className="flex justify-between"><span>MwSt (19%):</span><span>{mwst.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span></div>}
                    <div className="flex justify-between font-medium border-t mt-1 pt-1"><span>Gesamtmiete:</span><span>{brutto.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span></div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Kaution</Label>
                    <Input type="number" value={formData.kaution} onChange={(e) => update("kaution", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mietbeginn</Label>
                    <Input type="date" value={formData.mietbeginn} onChange={(e) => update("mietbeginn", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Laufzeit (Jahre)</Label>
                    <Input type="number" value={formData.laufzeit} onChange={(e) => update("laufzeit", e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={formData.indexklausel} onCheckedChange={(v) => update("indexklausel", !!v)} />
                  <Label className="text-sm">Indexklausel (VPI-Anpassung)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={formData.konkurrenzschutz} onCheckedChange={(v) => update("konkurrenzschutz", !!v)} />
                  <Label className="text-sm">Konkurrenzschutzklausel</Label>
                </div>
                <div className="space-y-2">
                  <Label>Sondervereinbarungen</Label>
                  <Textarea value={formData.sondervereinbarungen} onChange={(e) => update("sondervereinbarungen", e.target.value)} rows={3} />
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
                    <Building2 className="h-5 w-5" />Vertragsvorschau
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-3 text-sm">
                    <p className="text-center font-bold text-lg">Gewerbemietvertrag</p>
                    <p>Zwischen <strong>{formData.vermieterName || "[Vermieter]"}</strong> (Vermieter)</p>
                    <p>und <strong>{formData.mieterFirma || "[Firma]"}</strong>, vertreten durch {formData.mieterVertretung || "[Vertretung]"} (Mieter)</p>

                    <p><strong>§ 1 Mietgegenstand</strong></p>
                    <p>Gewerbefläche: {formData.objektAdresse || "[Adresse]"}, ca. {formData.flaeche || "[?]"} m², Nutzung als {formData.nutzungszweck || "[Zweck]"}.</p>

                    <p><strong>§ 2 Mietzeit</strong></p>
                    <p>Das Mietverhältnis beginnt am {formData.mietbeginn ? new Date(formData.mietbeginn).toLocaleDateString("de-DE") : "[Datum]"} und ist auf {formData.laufzeit} Jahre befristet.</p>

                    <p><strong>§ 3 Miete</strong></p>
                    <p>Nettomiete: {netto.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}/Monat{formData.mwst ? " zzgl. 19% USt" : ""}.</p>

                    {formData.indexklausel && (
                      <>
                        <p><strong>§ 4 Wertsicherungsklausel</strong></p>
                        <p>Die Miete wird jährlich anhand des VPI angepasst.</p>
                      </>
                    )}

                    <p><strong>§ {formData.indexklausel ? "5" : "4"} Kaution</strong></p>
                    <p>Der Mieter leistet eine Kaution in Höhe von {Number(formData.kaution || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}.</p>

                    {formData.sondervereinbarungen && (
                      <>
                        <p><strong>Sondervereinbarungen</strong></p>
                        <p>{formData.sondervereinbarungen}</p>
                      </>
                    )}

                    <div className="mt-12 grid grid-cols-2 gap-8">
                      <div className="border-t pt-2 text-center text-xs text-muted-foreground">Vermieter</div>
                      <div className="border-t pt-2 text-center text-xs text-muted-foreground">Mieter</div>
                    </div>
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
