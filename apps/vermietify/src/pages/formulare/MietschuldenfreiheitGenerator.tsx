import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, FileDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function MietschuldenfreiheitGenerator() {
  const [formData, setFormData] = useState({
    vermieterName: "",
    vermieterAdresse: "",
    mieterName: "",
    objektAdresse: "",
    mietbeginn: "",
    mietende: "",
    ausstellungsdatum: new Date().toISOString().split("T")[0],
  });
  const [showPreview, setShowPreview] = useState(false);

  const update = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <MainLayout
      title="Mietschuldenfreiheit"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Mietschuldenfreiheit" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Mietschuldenfreiheitsbescheinigung"
          subtitle="Bestätigung, dass keine Mietrückstände bestehen."
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
                  <Label>Name *</Label>
                  <Input value={formData.vermieterName} onChange={(e) => update("vermieterName", e.target.value)} placeholder="Max Mustermann" />
                </div>
                <div className="space-y-2">
                  <Label>Adresse *</Label>
                  <Input value={formData.vermieterAdresse} onChange={(e) => update("vermieterAdresse", e.target.value)} placeholder="Musterstr. 1, 10115 Berlin" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Mieter & Mietobjekt</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Mieter *</Label>
                  <Input value={formData.mieterName} onChange={(e) => update("mieterName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Mietobjekt *</Label>
                  <Input value={formData.objektAdresse} onChange={(e) => update("objektAdresse", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Mietbeginn</Label>
                    <Input type="date" value={formData.mietbeginn} onChange={(e) => update("mietbeginn", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mietende (falls beendet)</Label>
                    <Input type="date" value={formData.mietende} onChange={(e) => update("mietende", e.target.value)} />
                  </div>
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
                    <Shield className="h-5 w-5" />Vorschau
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-4 text-sm">
                    <div className="text-right">
                      <p>{formData.vermieterName || "[Vermieter]"}</p>
                      <p>{formData.vermieterAdresse || "[Adresse]"}</p>
                      <p className="mt-4">{new Date(formData.ausstellungsdatum).toLocaleDateString("de-DE")}</p>
                    </div>

                    <p className="text-center font-bold text-lg mt-8">Mietschuldenfreiheitsbescheinigung</p>

                    <p>Hiermit bestätige ich, {formData.vermieterName || "[Vermieter]"}, als Vermieter der Wohnung</p>

                    <p className="font-medium text-center">{formData.objektAdresse || "[Adresse des Mietobjekts]"}</p>

                    <p>
                      dass {formData.mieterName || "[Mieter]"} das Mietverhältnis
                      {formData.mietbeginn && ` seit dem ${new Date(formData.mietbeginn).toLocaleDateString("de-DE")}`}
                      {formData.mietende && ` bis zum ${new Date(formData.mietende).toLocaleDateString("de-DE")}`}
                      {!formData.mietende && " bis zum heutigen Tag"} stets pünktlich und vollständig
                      die vereinbarte Miete einschließlich aller Nebenkosten entrichtet hat.
                    </p>

                    <p>
                      Es bestehen zum Zeitpunkt der Ausstellung dieser Bescheinigung
                      <strong> keine Mietrückstände oder sonstigen offenen Forderungen</strong> aus dem
                      Mietverhältnis.
                    </p>

                    <p>
                      Diese Bescheinigung wird auf Wunsch des Mieters ausgestellt und dient zur Vorlage
                      bei einem neuen Vermieter.
                    </p>

                    <div className="mt-12 grid grid-cols-2 gap-8">
                      <div className="border-t pt-2 text-center">
                        <p>Ort, Datum</p>
                      </div>
                      <div className="border-t pt-2 text-center">
                        <p>Unterschrift Vermieter</p>
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
