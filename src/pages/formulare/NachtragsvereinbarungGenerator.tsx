import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileCheck, Eye, FileDown, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Amendment { title: string; text: string; }

export default function NachtragsvereinbarungGenerator() {
  const [formData, setFormData] = useState({
    vermieterName: "", mieterName: "", objektAdresse: "", originalVertragDatum: "",
  });
  const [amendments, setAmendments] = useState<Amendment[]>([{ title: "", text: "" }]);
  const [showPreview, setShowPreview] = useState(false);
  const update = (key: string, value: string) => setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <MainLayout title="Nachtragsvereinbarung" breadcrumbs={[{ label: "Formulare", href: "/formulare" }, { label: "Nachtragsvereinbarung" }]}>
      <div className="space-y-6">
        <PageHeader title="Nachtragsvereinbarung" subtitle="Ergänzung oder Änderung zum bestehenden Mietvertrag." actions={<Button variant="outline" asChild><Link to="/formulare"><ArrowLeft className="mr-2 h-4 w-4" />Alle Formulare</Link></Button>} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Vertragsbezug</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2"><Label>Vermieter *</Label><Input value={formData.vermieterName} onChange={(e) => update("vermieterName", e.target.value)} /></div>
                <div className="space-y-2"><Label>Mieter *</Label><Input value={formData.mieterName} onChange={(e) => update("mieterName", e.target.value)} /></div>
                <div className="space-y-2"><Label>Mietobjekt *</Label><Input value={formData.objektAdresse} onChange={(e) => update("objektAdresse", e.target.value)} /></div>
                <div className="space-y-2"><Label>Datum des Ursprungsvertrags *</Label><Input type="date" value={formData.originalVertragDatum} onChange={(e) => update("originalVertragDatum", e.target.value)} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Änderungen</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setAmendments((prev) => [...prev, { title: "", text: "" }])}><Plus className="h-4 w-4 mr-1" />Paragraph</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {amendments.map((a, i) => (
                  <div key={i} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Änderung {i + 1}</Label>
                      {amendments.length > 1 && <Button size="icon" variant="ghost" onClick={() => setAmendments((prev) => prev.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                    <Input placeholder="Betreff / Paragraph-Titel" value={a.title} onChange={(e) => setAmendments((prev) => prev.map((am, j) => j === i ? { ...am, title: e.target.value } : am))} />
                    <Textarea placeholder="Neuer Wortlaut..." value={a.text} onChange={(e) => setAmendments((prev) => prev.map((am, j) => j === i ? { ...am, text: e.target.value } : am))} rows={3} />
                  </div>
                ))}
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
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileCheck className="h-5 w-5" />Vorschau</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-3 text-sm">
                    <p className="text-center font-bold text-lg">Nachtragsvereinbarung<br />zum Mietvertrag vom {formData.originalVertragDatum ? new Date(formData.originalVertragDatum).toLocaleDateString("de-DE") : "[Datum]"}</p>
                    <p>Zwischen <strong>{formData.vermieterName || "[Vermieter]"}</strong> (Vermieter) und <strong>{formData.mieterName || "[Mieter]"}</strong> (Mieter) wird bezüglich des Mietverhältnisses über {formData.objektAdresse || "[Adresse]"} folgende Nachtragsvereinbarung getroffen:</p>
                    {amendments.map((a, i) => (
                      <div key={i}>
                        <p><strong>§ {i + 1} {a.title || "[Titel]"}</strong></p>
                        <p>{a.text || "[Neuer Wortlaut]"}</p>
                      </div>
                    ))}
                    <p><strong>§ {amendments.length + 1} Schlussbestimmungen</strong></p>
                    <p>Alle übrigen Bestimmungen des Mietvertrags vom {formData.originalVertragDatum ? new Date(formData.originalVertragDatum).toLocaleDateString("de-DE") : "[Datum]"} bleiben unberührt. Diese Nachtragsvereinbarung wird Bestandteil des Mietvertrags.</p>
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
