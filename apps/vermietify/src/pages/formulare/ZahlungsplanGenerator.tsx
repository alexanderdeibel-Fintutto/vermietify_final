import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Receipt, Eye, FileDown, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Rate {
  datum: string;
  betrag: number;
}

export default function ZahlungsplanGenerator() {
  const [formData, setFormData] = useState({
    vermieterName: "",
    mieterName: "",
    objektAdresse: "",
    gesamtschuld: "",
    anzahlRaten: "6",
    startDatum: "",
    zusatzvereinbarung: "",
  });
  const [showPreview, setShowPreview] = useState(false);

  const update = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const raten: Rate[] = (() => {
    const gesamt = Number(formData.gesamtschuld) || 0;
    const anzahl = Number(formData.anzahlRaten) || 1;
    const rateBetrag = Math.floor((gesamt / anzahl) * 100) / 100;
    const rest = Math.round((gesamt - rateBetrag * anzahl) * 100) / 100;
    const start = formData.startDatum ? new Date(formData.startDatum) : new Date();

    return Array.from({ length: anzahl }, (_, i) => {
      const datum = new Date(start);
      datum.setMonth(datum.getMonth() + i);
      return {
        datum: datum.toISOString().split("T")[0],
        betrag: i === anzahl - 1 ? rateBetrag + rest : rateBetrag,
      };
    });
  })();

  return (
    <MainLayout
      title="Zahlungsplan"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Zahlungsplanvereinbarung" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Zahlungsplanvereinbarung"
          subtitle="Ratenzahlungsvereinbarung für offene Mietforderungen erstellen."
          actions={
            <Button variant="outline" asChild>
              <Link to="/formulare"><ArrowLeft className="mr-2 h-4 w-4" />Alle Formulare</Link>
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Parteien</CardTitle></CardHeader>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Zahlungsplan</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Gesamtschuld (EUR) *</Label>
                  <Input type="number" value={formData.gesamtschuld} onChange={(e) => update("gesamtschuld", e.target.value)} placeholder="0,00" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Anzahl Raten *</Label>
                    <Input type="number" min="1" max="36" value={formData.anzahlRaten} onChange={(e) => update("anzahlRaten", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Erste Rate am *</Label>
                    <Input type="date" value={formData.startDatum} onChange={(e) => update("startDatum", e.target.value)} />
                  </div>
                </div>

                {Number(formData.gesamtschuld) > 0 && (
                  <div className="mt-4 rounded-lg border p-3">
                    <p className="text-sm font-medium mb-2">Ratenplan ({raten.length} Raten)</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {raten.map((rate, i) => (
                        <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                          <span>Rate {i + 1} — {new Date(rate.datum).toLocaleDateString("de-DE")}</span>
                          <span className="font-medium">{rate.betrag.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Zusätzliche Vereinbarungen</Label>
                  <Textarea value={formData.zusatzvereinbarung} onChange={(e) => update("zusatzvereinbarung", e.target.value)} placeholder="Z.B. Verfallsklausel bei Nichtzahlung..." rows={3} />
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
                    <Receipt className="h-5 w-5" />Vorschau
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-4 text-sm">
                    <p className="text-center font-bold text-lg">Ratenzahlungsvereinbarung</p>

                    <p>Zwischen</p>
                    <p className="font-medium">{formData.vermieterName || "[Vermieter]"}</p>
                    <p>— nachfolgend „Vermieter" —</p>
                    <p>und</p>
                    <p className="font-medium">{formData.mieterName || "[Mieter]"}</p>
                    <p>— nachfolgend „Mieter" —</p>

                    <p>wird bezüglich des Mietverhältnisses über {formData.objektAdresse || "[Mietobjekt]"} folgende Ratenzahlungsvereinbarung getroffen:</p>

                    <p><strong>§ 1 Forderung</strong></p>
                    <p>Der Mieter erkennt eine Gesamtforderung in Höhe von {Number(formData.gesamtschuld || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} aus rückständigen Mietzahlungen an.</p>

                    <p><strong>§ 2 Ratenzahlung</strong></p>
                    <p>Die Forderung wird in {formData.anzahlRaten} monatlichen Raten beglichen:</p>
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left">Rate</th>
                          <th className="p-2 text-left">Fällig am</th>
                          <th className="p-2 text-right">Betrag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {raten.map((rate, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{i + 1}</td>
                            <td className="p-2">{new Date(rate.datum).toLocaleDateString("de-DE")}</td>
                            <td className="p-2 text-right">{rate.betrag.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <p><strong>§ 3 Verfallsklausel</strong></p>
                    <p>Wird eine Rate nicht fristgerecht gezahlt, wird die gesamte Restforderung sofort fällig.</p>

                    {formData.zusatzvereinbarung && (
                      <>
                        <p><strong>§ 4 Zusätzliche Vereinbarungen</strong></p>
                        <p>{formData.zusatzvereinbarung}</p>
                      </>
                    )}

                    <div className="mt-12 grid grid-cols-2 gap-8">
                      <div className="border-t pt-2 text-center">
                        <p className="text-xs text-muted-foreground">Ort, Datum, Unterschrift Vermieter</p>
                      </div>
                      <div className="border-t pt-2 text-center">
                        <p className="text-xs text-muted-foreground">Ort, Datum, Unterschrift Mieter</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[300px]">
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
