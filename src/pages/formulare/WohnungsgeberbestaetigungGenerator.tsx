import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileCheck, Download, Copy, Eye, AlertCircle } from "lucide-react";

interface WGBFormState {
  vermieterName: string;
  vermieterAdresse: string;
  mieterName: string;
  mieterGeburtsdatum: string;
  mieterVorherigeAnschrift: string;
  einzugsdatum: string;
  wohnungAnschrift: string;
  wohnungLage: string;
}

export default function WohnungsgeberbestaetigungGenerator() {
  const [form, setForm] = useState<WGBFormState>({
    vermieterName: "",
    vermieterAdresse: "",
    mieterName: "",
    mieterGeburtsdatum: "",
    mieterVorherigeAnschrift: "",
    einzugsdatum: "",
    wohnungAnschrift: "",
    wohnungLage: "",
  });

  const updateField = <K extends keyof WGBFormState>(
    field: K,
    value: WGBFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const heute = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "[Datum]";
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const previewText = `
WOHNUNGSGEBERBESTÄTIGUNG
gemäß § 19 Bundesmeldegesetz (BMG)

Datum: ${heute}

═══════════════════════════════════════════════

1. ANGABEN ZUM WOHNUNGSGEBER / VERMIETER

Name:       ${form.vermieterName || "[Name des Vermieters]"}
Anschrift:  ${form.vermieterAdresse || "[Adresse des Vermieters]"}

═══════════════════════════════════════════════

2. ANGABEN ZUR MELDEPFLICHTIGEN PERSON

Name:                  ${form.mieterName || "[Name des Mieters]"}
Geburtsdatum:          ${formatDate(form.mieterGeburtsdatum)}
Vorherige Anschrift:   ${form.mieterVorherigeAnschrift || "[Vorherige Anschrift]"}

═══════════════════════════════════════════════

3. ANGABEN ZUR WOHNUNG

Anschrift der Wohnung:   ${form.wohnungAnschrift || "[Anschrift der Wohnung]"}
Lage der Wohnung:        ${form.wohnungLage || "[z.B. 2. OG links]"}

═══════════════════════════════════════════════

4. EINZUG

Art des Vorgangs:   ☒ Einzug
Einzugsdatum:       ${formatDate(form.einzugsdatum)}

═══════════════════════════════════════════════

Hiermit bestätige ich als Wohnungsgeber den Einzug der oben genannten Person in die bezeichnete Wohnung.

Diese Bestätigung wird gemäß § 19 Abs. 1 BMG ausgestellt.


_________________________
Ort, Datum


_________________________
Unterschrift des Wohnungsgebers
${form.vermieterName || "[Name des Vermieters]"}
  `.trim();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(previewText);
  };

  const handleDownloadPDF = () => {
    const blob = new Blob([previewText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Wohnungsgeberbestaetigung_${form.mieterName || "Mieter"}_${heute}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout
      title="Wohnungsgeberbestätigung"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Wohnungsgeberbestätigung" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Wohnungsgeberbestätigung"
          subtitle="Erstellen Sie eine Wohnungsgeberbestätigung gemäß § 19 BMG für die Anmeldung Ihres Mieters."
        />

        {/* Legal notice */}
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-orange-800 dark:text-orange-300">
                Gesetzliche Pflicht
              </p>
              <p className="text-orange-700 dark:text-orange-400 mt-1">
                Der Wohnungsgeber ist gemäß § 19 BMG verpflichtet, dem Mieter
                den Einzug innerhalb von <strong>zwei Wochen</strong> nach
                Einzug schriftlich oder elektronisch zu bestätigen. Ein Verstoß
                kann mit einem Bußgeld von bis zu 1.000 EUR geahndet werden.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Vermieter / Wohnungsgeber
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vermieterName">Name</Label>
                  <Input
                    id="vermieterName"
                    placeholder="Name des Vermieters / der Hausverwaltung"
                    value={form.vermieterName}
                    onChange={(e) =>
                      updateField("vermieterName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vermieterAdresse">Anschrift</Label>
                  <Textarea
                    id="vermieterAdresse"
                    placeholder="Anschrift des Vermieters"
                    value={form.vermieterAdresse}
                    onChange={(e) =>
                      updateField("vermieterAdresse", e.target.value)
                    }
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meldepflichtige Person (Mieter)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mieterName">Vollständiger Name</Label>
                  <Input
                    id="mieterName"
                    placeholder="Vor- und Nachname"
                    value={form.mieterName}
                    onChange={(e) =>
                      updateField("mieterName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mieterGeburtsdatum">Geburtsdatum</Label>
                  <Input
                    id="mieterGeburtsdatum"
                    type="date"
                    value={form.mieterGeburtsdatum}
                    onChange={(e) =>
                      updateField("mieterGeburtsdatum", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mieterVorherigeAnschrift">
                    Vorherige Anschrift
                  </Label>
                  <Textarea
                    id="mieterVorherigeAnschrift"
                    placeholder="Bisherige Wohnanschrift des Mieters"
                    value={form.mieterVorherigeAnschrift}
                    onChange={(e) =>
                      updateField("mieterVorherigeAnschrift", e.target.value)
                    }
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wohnung & Einzug</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wohnungAnschrift">
                    Anschrift der Wohnung
                  </Label>
                  <Input
                    id="wohnungAnschrift"
                    placeholder="Straße, PLZ Ort"
                    value={form.wohnungAnschrift}
                    onChange={(e) =>
                      updateField("wohnungAnschrift", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wohnungLage">
                    Lage der Wohnung (optional)
                  </Label>
                  <Input
                    id="wohnungLage"
                    placeholder="z.B. 2. OG links"
                    value={form.wohnungLage}
                    onChange={(e) =>
                      updateField("wohnungLage", e.target.value)
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="einzugsdatum">Einzugsdatum</Label>
                  <Input
                    id="einzugsdatum"
                    type="date"
                    value={form.einzugsdatum}
                    onChange={(e) =>
                      updateField("einzugsdatum", e.target.value)
                    }
                  />
                </div>
                {form.einzugsdatum && (
                  <Badge variant="secondary" className="text-xs">
                    Frist für Ausstellung:{" "}
                    {new Date(
                      new Date(form.einzugsdatum).getTime() +
                        14 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString("de-DE")}
                  </Badge>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => {}} className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                Vorschau anzeigen
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Vorschau</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToClipboard}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      In Zwischenablage kopieren
                    </Button>
                    <Button size="sm" onClick={handleDownloadPDF}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-gray-950 border rounded-lg p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed min-h-[600px]">
                  {previewText}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
