import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, AlertTriangle, FileDown, Eye, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function EigenbedarfGenerator() {
  const [formData, setFormData] = useState({
    vermieterName: "",
    vermieterAdresse: "",
    mieterName: "",
    mieterAdresse: "",
    objektAdresse: "",
    bedarfsPerson: "",
    verwandtschaft: "",
    begruendung: "",
    mietbeginn: "",
    kuendigungsfrist: "3",
    alternativeAngebote: "",
  });
  const [showPreview, setShowPreview] = useState(false);

  const update = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const calculateKuendigungsfrist = (): string => {
    if (!formData.mietbeginn) return "3 Monate (Standard)";
    const start = new Date(formData.mietbeginn);
    const now = new Date();
    const years = (now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (years >= 8) return "9 Monate (Mietdauer > 8 Jahre)";
    if (years >= 5) return "6 Monate (Mietdauer 5-8 Jahre)";
    return "3 Monate (Mietdauer < 5 Jahre)";
  };

  return (
    <MainLayout
      title="Eigenbedarfskündigung"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Eigenbedarfskündigung" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Eigenbedarfskündigung"
          subtitle="Kündigung wegen Eigenbedarf gemäß § 573 Abs. 2 Nr. 2 BGB erstellen."
          actions={
            <Button variant="outline" asChild>
              <Link to="/formulare">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Alle Formulare
              </Link>
            </Button>
          }
        />

        {/* Legal Warning */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Wichtige Hinweise zur Eigenbedarfskündigung</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Der Eigenbedarf muss konkret und nachvollziehbar begründet werden</li>
                  <li>Vorgetäuschter Eigenbedarf kann zu Schadensersatzansprüchen führen</li>
                  <li>Bei Härtefällen kann der Mieter der Kündigung widersprechen (§ 574 BGB)</li>
                  <li>Sozialklausel beachten: besonderer Schutz für ältere/kranke Mieter</li>
                  <li>Die Kündigungsfrist richtet sich nach der Mietdauer</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vermieter</CardTitle>
              </CardHeader>
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
              <CardHeader>
                <CardTitle className="text-lg">Mieter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={formData.mieterName} onChange={(e) => update("mieterName", e.target.value)} placeholder="Anna Müller" />
                </div>
                <div className="space-y-2">
                  <Label>Adresse des Mietobjekts *</Label>
                  <Input value={formData.objektAdresse} onChange={(e) => update("objektAdresse", e.target.value)} placeholder="Hauptstr. 5, WE 3, 10117 Berlin" />
                </div>
                <div className="space-y-2">
                  <Label>Mietbeginn</Label>
                  <Input type="date" value={formData.mietbeginn} onChange={(e) => update("mietbeginn", e.target.value)} />
                  <p className="text-xs text-muted-foreground">
                    Kündigungsfrist: {calculateKuendigungsfrist()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Eigenbedarf</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Bedarfsperson *</Label>
                  <Input value={formData.bedarfsPerson} onChange={(e) => update("bedarfsPerson", e.target.value)} placeholder="Name der Person, die einziehen soll" />
                </div>
                <div className="space-y-2">
                  <Label>Verwandtschaftsverhältnis *</Label>
                  <Select value={formData.verwandtschaft} onValueChange={(v) => update("verwandtschaft", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selbst">Eigene Nutzung</SelectItem>
                      <SelectItem value="ehepartner">Ehepartner/Lebenspartner</SelectItem>
                      <SelectItem value="kind">Kind</SelectItem>
                      <SelectItem value="eltern">Eltern</SelectItem>
                      <SelectItem value="geschwister">Geschwister</SelectItem>
                      <SelectItem value="enkel">Enkel</SelectItem>
                      <SelectItem value="grosseltern">Großeltern</SelectItem>
                      <SelectItem value="sonstige">Sonstige Familienangehörige</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Begründung des Eigenbedarfs *</Label>
                  <Textarea
                    value={formData.begruendung}
                    onChange={(e) => update("begruendung", e.target.value)}
                    placeholder="Detaillierte Begründung, warum die Wohnung benötigt wird..."
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Je konkreter und nachvollziehbarer die Begründung, desto rechtssicherer die Kündigung.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Alternativangebote (optional)</Label>
                  <Textarea
                    value={formData.alternativeAngebote}
                    onChange={(e) => update("alternativeAngebote", e.target.value)}
                    placeholder="Verfügbare Alternativwohnungen, die dem Mieter angeboten werden können..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => setShowPreview(true)} className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Vorschau anzeigen
              </Button>
              <Button variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Als PDF
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div>
            {showPreview ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Vorschau: Eigenbedarfskündigung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-4 text-sm">
                    <div className="text-right">
                      <p>{formData.vermieterName || "[Vermieter]"}</p>
                      <p>{formData.vermieterAdresse || "[Adresse]"}</p>
                      <p className="mt-4">{new Date().toLocaleDateString("de-DE")}</p>
                    </div>

                    <div>
                      <p>{formData.mieterName || "[Mieter]"}</p>
                      <p>{formData.objektAdresse || "[Mietobjekt]"}</p>
                    </div>

                    <p className="font-bold">
                      Kündigung des Mietverhältnisses wegen Eigenbedarf
                    </p>

                    <p>Sehr geehrte/r {formData.mieterName || "[Mieter]"},</p>

                    <p>
                      hiermit kündige ich das zwischen uns bestehende Mietverhältnis über die Wohnung{" "}
                      {formData.objektAdresse || "[Adresse]"} ordentlich wegen Eigenbedarfs gemäß
                      § 573 Abs. 2 Nr. 2 BGB mit einer Frist von {calculateKuendigungsfrist()}.
                    </p>

                    <p>
                      <strong>Begründung des Eigenbedarfs:</strong>
                    </p>
                    <p>
                      Die Wohnung wird benötigt für {formData.bedarfsPerson || "[Bedarfsperson]"}
                      {formData.verwandtschaft && formData.verwandtschaft !== "selbst"
                        ? ` (${formData.verwandtschaft})`
                        : ""}.{" "}
                      {formData.begruendung || "[Begründung]"}
                    </p>

                    {formData.alternativeAngebote && (
                      <>
                        <p><strong>Alternativangebot:</strong></p>
                        <p>{formData.alternativeAngebote}</p>
                      </>
                    )}

                    <p>
                      Ich weise Sie darauf hin, dass Sie gemäß § 574 BGB der Kündigung
                      widersprechen können, wenn die Beendigung des Mietverhältnisses für Sie
                      oder Ihre Familie eine Härte bedeuten würde. Der Widerspruch muss
                      spätestens zwei Monate vor Beendigung des Mietverhältnisses schriftlich
                      erklärt werden.
                    </p>

                    <p>Mit freundlichen Grüßen</p>
                    <p className="mt-8 border-t pt-2">
                      {formData.vermieterName || "[Unterschrift Vermieter]"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Füllen Sie das Formular aus und klicken Sie auf "Vorschau anzeigen"</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
