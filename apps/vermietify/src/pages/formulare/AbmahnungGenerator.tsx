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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Download, Eye, Copy } from "lucide-react";

interface AbmahnungFormState {
  empfaengerName: string;
  empfaengerAdresse: string;
  artVerletzung: string;
  beschreibung: string;
  fristAbhilfe: string;
  androhungKuendigung: boolean;
}

const VERLETZUNGSARTEN = [
  "Zahlungsverzug",
  "Ruhestörung",
  "Unerlaubte Untervermietung",
  "Beschädigung",
  "Sonstiges",
];

export default function AbmahnungGenerator() {
  const [form, setForm] = useState<AbmahnungFormState>({
    empfaengerName: "",
    empfaengerAdresse: "",
    artVerletzung: "",
    beschreibung: "",
    fristAbhilfe: "",
    androhungKuendigung: false,
  });
  const [showPreview, setShowPreview] = useState(false);

  const updateField = <K extends keyof AbmahnungFormState>(
    field: K,
    value: AbmahnungFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const heute = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const previewText = `
ABMAHNUNG

Datum: ${heute}

An:
${form.empfaengerName}
${form.empfaengerAdresse}

Betreff: Abmahnung wegen ${form.artVerletzung || "[Art der Pflichtverletzung]"}

Sehr geehrte/r ${form.empfaengerName || "[Name des Mieters]"},

hiermit mahne ich Sie wegen folgender Pflichtverletzung aus dem bestehenden Mietverhältnis ab:

Art der Pflichtverletzung: ${form.artVerletzung || "[nicht angegeben]"}

Beschreibung des Verstoßes:
${form.beschreibung || "[Beschreibung des Verstoßes]"}

Ich fordere Sie hiermit auf, den oben beschriebenen vertragswidrigen Zustand bis zum ${form.fristAbhilfe || "[Frist]"} zu beseitigen bzw. das vertragswidrige Verhalten unverzüglich einzustellen.

${
  form.androhungKuendigung
    ? "Sollten Sie dieser Aufforderung nicht fristgerecht nachkommen, behalte ich mir ausdrücklich vor, das Mietverhältnis fristlos, hilfsweise fristgerecht zu kündigen. Diese Abmahnung dient als Voraussetzung für eine eventuelle verhaltensbedingte Kündigung gemäß § 543 BGB."
    : "Ich erwarte, dass Sie der Aufforderung fristgerecht nachkommen."
}

Mit freundlichen Grüßen


_________________________
Unterschrift Vermieter
  `.trim();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(previewText);
  };

  const handleDownloadPDF = () => {
    const blob = new Blob([previewText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Abmahnung_${form.empfaengerName || "Mieter"}_${heute}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout
      title="Abmahnung"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Abmahnung" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Abmahnung erstellen"
          subtitle="Erstellen Sie eine rechtssichere Abmahnung bei Vertragsverletzung durch den Mieter."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Empfänger
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="empfaengerName">Name des Mieters</Label>
                  <Input
                    id="empfaengerName"
                    placeholder="Max Mustermann"
                    value={form.empfaengerName}
                    onChange={(e) =>
                      updateField("empfaengerName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empfaengerAdresse">Anschrift</Label>
                  <Textarea
                    id="empfaengerAdresse"
                    placeholder="Musterstraße 1&#10;12345 Musterstadt"
                    value={form.empfaengerAdresse}
                    onChange={(e) =>
                      updateField("empfaengerAdresse", e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pflichtverletzung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Art der Pflichtverletzung</Label>
                  <Select
                    value={form.artVerletzung}
                    onValueChange={(v) => updateField("artVerletzung", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bitte wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {VERLETZUNGSARTEN.map((art) => (
                        <SelectItem key={art} value={art}>
                          {art}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beschreibung">
                    Beschreibung des Verstoßes
                  </Label>
                  <Textarea
                    id="beschreibung"
                    placeholder="Beschreiben Sie den konkreten Verstoß..."
                    value={form.beschreibung}
                    onChange={(e) =>
                      updateField("beschreibung", e.target.value)
                    }
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Frist & Konsequenzen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fristAbhilfe">Frist zur Abhilfe</Label>
                  <Input
                    id="fristAbhilfe"
                    type="date"
                    value={form.fristAbhilfe}
                    onChange={(e) =>
                      updateField("fristAbhilfe", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="androhungKuendigung"
                    checked={form.androhungKuendigung}
                    onCheckedChange={(checked) =>
                      updateField("androhungKuendigung", checked === true)
                    }
                  />
                  <Label htmlFor="androhungKuendigung" className="cursor-pointer">
                    Androhung der Kündigung bei Nichtbeachtung
                  </Label>
                </div>
                {form.androhungKuendigung && (
                  <Badge variant="destructive" className="text-xs">
                    Kündigungsandrohung wird in das Schreiben aufgenommen
                  </Badge>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => setShowPreview(true)} className="flex-1">
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
