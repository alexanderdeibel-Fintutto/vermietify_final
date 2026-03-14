import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Eye, FileDown, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Staffel {
  abDatum: string;
  kaltmiete: string;
}

export default function StaffelmietvertragGenerator() {
  const [formData, setFormData] = useState({
    vermieterName: "",
    mieterName: "",
    objektAdresse: "",
    flaeche: "",
    nebenkosten: "",
    kaution: "",
    mietbeginn: "",
  });
  const [staffeln, setStaffeln] = useState<Staffel[]>([
    { abDatum: "", kaltmiete: "" },
    { abDatum: "", kaltmiete: "" },
  ]);
  const [showPreview, setShowPreview] = useState(false);

  const update = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const updateStaffel = (index: number, key: keyof Staffel, value: string) => {
    setStaffeln((prev) => prev.map((s, i) => i === index ? { ...s, [key]: value } : s));
  };

  return (
    <MainLayout
      title="Staffelmietvertrag"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Staffelmietvertrag" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Staffelmietvertrag-Generator"
          subtitle="Mietvertrag mit gestaffelter Mieterhöhung gemäß § 557a BGB."
          actions={
            <Button variant="outline" asChild>
              <Link to="/formulare"><ArrowLeft className="mr-2 h-4 w-4" />Alle Formulare</Link>
            </Button>
          }
        />

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
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Fläche (m²)</Label>
                    <Input type="number" value={formData.flaeche} onChange={(e) => update("flaeche", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nebenkosten</Label>
                    <Input type="number" value={formData.nebenkosten} onChange={(e) => update("nebenkosten", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Kaution</Label>
                    <Input type="number" value={formData.kaution} onChange={(e) => update("kaution", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mietbeginn *</Label>
                  <Input type="date" value={formData.mietbeginn} onChange={(e) => update("mietbeginn", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />Mietstaffeln
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setStaffeln((prev) => [...prev, { abDatum: "", kaltmiete: "" }])}>
                    <Plus className="h-4 w-4 mr-1" />Staffel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Mindestens 1 Jahr zwischen den Staffeln (§ 557a Abs. 2 BGB). Die Erhöhung muss als konkreter Geldbetrag angegeben werden.
                </p>
                {staffeln.map((staffel, i) => (
                  <div key={i} className="flex items-end gap-3 p-3 rounded-lg border">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Staffel {i + 1} — Ab Datum</Label>
                      <Input type="date" value={staffel.abDatum} onChange={(e) => updateStaffel(i, "abDatum", e.target.value)} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Kaltmiete (EUR)</Label>
                      <Input type="number" value={staffel.kaltmiete} onChange={(e) => updateStaffel(i, "kaltmiete", e.target.value)} />
                    </div>
                    {staffeln.length > 2 && (
                      <Button size="icon" variant="ghost" onClick={() => setStaffeln((prev) => prev.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
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
                <CardHeader><CardTitle className="text-lg">Vertragsvorschau</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-3 text-sm">
                    <p className="text-center font-bold text-lg">Staffelmietvertrag</p>
                    <p>Zwischen <strong>{formData.vermieterName || "[Vermieter]"}</strong> und <strong>{formData.mieterName || "[Mieter]"}</strong></p>
                    <p><strong>§ 1</strong> Mietgegenstand: {formData.objektAdresse || "[Adresse]"}, ca. {formData.flaeche || "?"} m²</p>
                    <p><strong>§ 2</strong> Mietbeginn: {formData.mietbeginn ? new Date(formData.mietbeginn).toLocaleDateString("de-DE") : "[Datum]"}</p>
                    <p><strong>§ 3 Staffelmiete (§ 557a BGB)</strong></p>
                    <p>Die Kaltmiete beträgt:</p>
                    <table className="w-full text-sm border">
                      <thead><tr className="bg-muted"><th className="p-2">Staffel</th><th className="p-2">Ab</th><th className="p-2 text-right">Kaltmiete</th></tr></thead>
                      <tbody>
                        {staffeln.map((s, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{i + 1}</td>
                            <td className="p-2">{s.abDatum ? new Date(s.abDatum).toLocaleDateString("de-DE") : "-"}</td>
                            <td className="p-2 text-right">{Number(s.kaltmiete || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p><strong>§ 4</strong> Nebenkosten-Vorauszahlung: {Number(formData.nebenkosten || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
                    <p><strong>§ 5</strong> Kaution: {Number(formData.kaution || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
                    <p className="text-xs text-muted-foreground mt-4">Während der Laufzeit der Staffelmiete ist eine Mieterhöhung nach §§ 558–559 BGB ausgeschlossen. Eine Mietminderung nach § 536 BGB bleibt unberührt.</p>
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
