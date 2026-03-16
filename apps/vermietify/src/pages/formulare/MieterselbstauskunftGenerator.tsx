import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Copy, Eye, User, Briefcase, Home } from "lucide-react";

interface SelbstauskunftFormState {
  name: string;
  geburtsdatum: string;
  familienstand: string;
  beruf: string;
  arbeitgeber: string;
  nettoeinkommen: string;
  aktuelleWohnsituation: string;
  grundUmzug: string;
  mietrueckstaende: string;
  insolvenz: string;
  haustiere: string;
  haustiereDetails: string;
  raucher: string;
  anzahlPersonen: string;
  schufaEinwilligung: boolean;
}

export default function MieterselbstauskunftGenerator() {
  const [form, setForm] = useState<SelbstauskunftFormState>({
    name: "",
    geburtsdatum: "",
    familienstand: "",
    beruf: "",
    arbeitgeber: "",
    nettoeinkommen: "",
    aktuelleWohnsituation: "",
    grundUmzug: "",
    mietrueckstaende: "nein",
    insolvenz: "nein",
    haustiere: "nein",
    haustiereDetails: "",
    raucher: "nein",
    anzahlPersonen: "1",
    schufaEinwilligung: false,
  });

  const updateField = <K extends keyof SelbstauskunftFormState>(
    field: K,
    value: SelbstauskunftFormState[K]
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
MIETERSELBSTAUSKUNFT

Datum: ${heute}

═══════════════════════════════════════════════

1. PERSÖNLICHE DATEN

Name:            ${form.name || "[Name]"}
Geburtsdatum:    ${formatDate(form.geburtsdatum)}
Familienstand:   ${form.familienstand || "[Familienstand]"}

═══════════════════════════════════════════════

2. BERUFLICHE SITUATION

Beruf:           ${form.beruf || "[Beruf]"}
Arbeitgeber:     ${form.arbeitgeber || "[Arbeitgeber]"}
Nettoeinkommen:  ${form.nettoeinkommen ? `${form.nettoeinkommen} EUR / Monat` : "[Nettoeinkommen]"}

═══════════════════════════════════════════════

3. AKTUELLE WOHNSITUATION

Aktuelle Wohnung:   ${form.aktuelleWohnsituation || "[Aktuelle Wohnsituation]"}
Grund des Umzugs:   ${form.grundUmzug || "[Grund des Umzugs]"}

═══════════════════════════════════════════════

4. WEITERE ANGABEN

Mietrückstände:                          ${form.mietrueckstaende === "ja" ? "Ja" : "Nein"}
Insolvenzverfahren / Eidesstattliche
Versicherung abgegeben:                  ${form.insolvenz === "ja" ? "Ja" : "Nein"}
Haustiere:                               ${form.haustiere === "ja" ? `Ja – ${form.haustiereDetails || "[Details]"}` : "Nein"}
Raucher:                                 ${form.raucher === "ja" ? "Ja" : "Nein"}
Anzahl einziehender Personen:            ${form.anzahlPersonen || "1"}

═══════════════════════════════════════════════

5. SCHUFA-EINWILLIGUNG

${
  form.schufaEinwilligung
    ? "☒ Ich willige ein, dass der Vermieter eine SCHUFA-Auskunft über mich einholen darf."
    : "☐ Ich willige ein, dass der Vermieter eine SCHUFA-Auskunft über mich einholen darf."
}

═══════════════════════════════════════════════

ERKLÄRUNG

Ich versichere, dass die vorstehenden Angaben wahrheitsgemäß und vollständig sind. Mir ist bekannt, dass falsche Angaben den Vermieter zur Anfechtung des Mietvertrages berechtigen können.

Die Angaben werden ausschließlich zum Zweck der Prüfung meiner Bewerbung als Mieter erhoben und nach Datenschutzgrundverordnung (DSGVO) behandelt.


_________________________
Ort, Datum


_________________________
Unterschrift
${form.name || "[Name]"}
  `.trim();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(previewText);
  };

  const handleDownloadPDF = () => {
    const blob = new Blob([previewText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Mieterselbstauskunft_${form.name || "Mieter"}_${heute}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout
      title="Mieterselbstauskunft"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Mieterselbstauskunft" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Mieterselbstauskunft"
          subtitle="Erstellen Sie einen Selbstauskunftsbogen für Mietinteressenten."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Persönliche Daten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vollständiger Name</Label>
                  <Input
                    id="name"
                    placeholder="Vor- und Nachname"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
                  <Input
                    id="geburtsdatum"
                    type="date"
                    value={form.geburtsdatum}
                    onChange={(e) =>
                      updateField("geburtsdatum", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Familienstand</Label>
                  <Select
                    value={form.familienstand}
                    onValueChange={(v) => updateField("familienstand", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bitte wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ledig">Ledig</SelectItem>
                      <SelectItem value="verheiratet">Verheiratet</SelectItem>
                      <SelectItem value="geschieden">Geschieden</SelectItem>
                      <SelectItem value="verwitwet">Verwitwet</SelectItem>
                      <SelectItem value="eingetragene-lebenspartnerschaft">
                        Eingetr. Lebenspartnerschaft
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Beruf & Einkommen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="beruf">Beruf</Label>
                  <Input
                    id="beruf"
                    placeholder="z.B. Softwareentwickler"
                    value={form.beruf}
                    onChange={(e) => updateField("beruf", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arbeitgeber">Arbeitgeber</Label>
                  <Input
                    id="arbeitgeber"
                    placeholder="Name des Arbeitgebers"
                    value={form.arbeitgeber}
                    onChange={(e) =>
                      updateField("arbeitgeber", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nettoeinkommen">
                    Monatliches Nettoeinkommen (EUR)
                  </Label>
                  <Input
                    id="nettoeinkommen"
                    type="number"
                    placeholder="z.B. 2500"
                    value={form.nettoeinkommen}
                    onChange={(e) =>
                      updateField("nettoeinkommen", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  Aktuelle Wohnsituation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aktuelleWohnsituation">
                    Aktuelle Wohnsituation
                  </Label>
                  <Input
                    id="aktuelleWohnsituation"
                    placeholder="z.B. 2-Zimmer-Wohnung zur Miete"
                    value={form.aktuelleWohnsituation}
                    onChange={(e) =>
                      updateField("aktuelleWohnsituation", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grundUmzug">Grund des Umzugs</Label>
                  <Textarea
                    id="grundUmzug"
                    placeholder="z.B. Beruflicher Wechsel, Vergrößerung..."
                    value={form.grundUmzug}
                    onChange={(e) =>
                      updateField("grundUmzug", e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weitere Angaben</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bestehen Mietrückstände?</Label>
                  <Select
                    value={form.mietrueckstaende}
                    onValueChange={(v) => updateField("mietrueckstaende", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nein">Nein</SelectItem>
                      <SelectItem value="ja">Ja</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.mietrueckstaende === "ja" && (
                    <Badge variant="destructive" className="text-xs">
                      Mietrückstände vorhanden
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>
                    Insolvenzverfahren / Eidesstattliche Versicherung?
                  </Label>
                  <Select
                    value={form.insolvenz}
                    onValueChange={(v) => updateField("insolvenz", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nein">Nein</SelectItem>
                      <SelectItem value="ja">Ja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Haustiere</Label>
                  <Select
                    value={form.haustiere}
                    onValueChange={(v) => updateField("haustiere", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nein">Nein</SelectItem>
                      <SelectItem value="ja">Ja</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.haustiere === "ja" && (
                    <Input
                      placeholder="Welche Haustiere? (Art, Anzahl)"
                      value={form.haustiereDetails}
                      onChange={(e) =>
                        updateField("haustiereDetails", e.target.value)
                      }
                    />
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Raucher</Label>
                  <Select
                    value={form.raucher}
                    onValueChange={(v) => updateField("raucher", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nein">Nein</SelectItem>
                      <SelectItem value="ja">Ja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="anzahlPersonen">
                    Anzahl einziehender Personen
                  </Label>
                  <Input
                    id="anzahlPersonen"
                    type="number"
                    min="1"
                    value={form.anzahlPersonen}
                    onChange={(e) =>
                      updateField("anzahlPersonen", e.target.value)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="schufaEinwilligung"
                    checked={form.schufaEinwilligung}
                    onCheckedChange={(checked) =>
                      updateField("schufaEinwilligung", checked === true)
                    }
                  />
                  <Label htmlFor="schufaEinwilligung" className="cursor-pointer">
                    Einwilligung zur SCHUFA-Abfrage erteilen
                  </Label>
                </div>
                {form.schufaEinwilligung && (
                  <Badge variant="default" className="text-xs">
                    SCHUFA-Einwilligung erteilt
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
