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
import { Separator } from "@/components/ui/separator";
import { Ban, Download, Copy, Eye } from "lucide-react";

interface MietminderungFormState {
  mieterName: string;
  mieterAdresse: string;
  gemeldetenMangel: string;
  anerkennung: string;
  minderungsquote: string;
  geplAnteAbhilfe: string;
  abhilfeTimeline: string;
  vermieterName: string;
  vermieterAdresse: string;
}

export default function MietminderungReaktion() {
  const [form, setForm] = useState<MietminderungFormState>({
    mieterName: "",
    mieterAdresse: "",
    gemeldetenMangel: "",
    anerkennung: "",
    minderungsquote: "",
    geplAnteAbhilfe: "",
    abhilfeTimeline: "",
    vermieterName: "",
    vermieterAdresse: "",
  });
  const [showPreview, setShowPreview] = useState(false);

  const updateField = <K extends keyof MietminderungFormState>(
    field: K,
    value: MietminderungFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const heute = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const anerkennungText = () => {
    switch (form.anerkennung) {
      case "ja":
        return "Ich erkenne den von Ihnen gemeldeten Mangel an und bestätige Ihr Recht auf eine angemessene Mietminderung.";
      case "teilweise":
        return `Ich erkenne den von Ihnen gemeldeten Mangel teilweise an. Nach meiner Einschätzung ist eine Mietminderung in Höhe von ${form.minderungsquote || "[X]"}% angemessen.`;
      case "nein":
        return "Ich weise die von Ihnen geltend gemachte Mietminderung zurück. Nach meiner Auffassung liegt kein minderungsrelevanter Mangel vor.";
      default:
        return "[Anerkennung nicht angegeben]";
    }
  };

  const previewText = `
STELLUNGNAHME ZUR MIETMINDERUNGSANZEIGE

Datum: ${heute}

${form.vermieterName || "[Vermieter Name]"}
${form.vermieterAdresse || "[Vermieter Adresse]"}

An:
${form.mieterName || "[Mieter Name]"}
${form.mieterAdresse || "[Mieter Adresse]"}

Betreff: Stellungnahme zu Ihrer Mietminderungsanzeige

Sehr geehrte/r ${form.mieterName || "[Name des Mieters]"},

ich nehme Bezug auf Ihre Mitteilung bezüglich einer Mietminderung und den von Ihnen gemeldeten Mangel:

Gemeldeter Mangel:
${form.gemeldetenMangel || "[Beschreibung des Mangels]"}

Stellungnahme:
${anerkennungText()}

Geplante Abhilfe:
${form.geplAnteAbhilfe || "[Beschreibung der geplanten Maßnahmen]"}

Zeitrahmen:
${form.abhilfeTimeline || "[Geplanter Zeitrahmen]"}

${
  form.anerkennung === "nein"
    ? "Ich fordere Sie auf, die volle Miete ab dem kommenden Monat wieder in voller Höhe zu entrichten. Sollten Sie die Mietminderung dennoch fortsetzen, behalte ich mir die Geltendmachung der ausstehenden Mietbeträge vor."
    : "Ich bitte um Ihr Verständnis und werde mich bemühen, den Mangel schnellstmöglich zu beheben."
}

Mit freundlichen Grüßen


_________________________
${form.vermieterName || "Unterschrift Vermieter"}
  `.trim();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(previewText);
  };

  const handleDownloadPDF = () => {
    const blob = new Blob([previewText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Mietminderung_Reaktion_${form.mieterName || "Mieter"}_${heute}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout
      title="Mietminderung Reaktion"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Mietminderung Reaktion" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Reaktion auf Mietminderung"
          subtitle="Erstellen Sie eine Antwort auf eine Mietminderungsanzeige Ihres Mieters."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vermieter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vermieterName">Name</Label>
                  <Input
                    id="vermieterName"
                    placeholder="Name des Vermieters"
                    value={form.vermieterName}
                    onChange={(e) =>
                      updateField("vermieterName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vermieterAdresse">Adresse</Label>
                  <Textarea
                    id="vermieterAdresse"
                    placeholder="Adresse des Vermieters"
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
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-red-500" />
                  Mieter / Mangelmeldung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mieterName">Mieter Name</Label>
                  <Input
                    id="mieterName"
                    placeholder="Name des Mieters"
                    value={form.mieterName}
                    onChange={(e) =>
                      updateField("mieterName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mieterAdresse">Mieter Adresse</Label>
                  <Textarea
                    id="mieterAdresse"
                    placeholder="Adresse des Mieters"
                    value={form.mieterAdresse}
                    onChange={(e) =>
                      updateField("mieterAdresse", e.target.value)
                    }
                    rows={2}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="gemeldetenMangel">
                    Gemeldeter Mangel
                  </Label>
                  <Textarea
                    id="gemeldetenMangel"
                    placeholder="Beschreibung des gemeldeten Mangels..."
                    value={form.gemeldetenMangel}
                    onChange={(e) =>
                      updateField("gemeldetenMangel", e.target.value)
                    }
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reaktion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Anerkennung des Mangels</Label>
                  <Select
                    value={form.anerkennung}
                    onValueChange={(v) => updateField("anerkennung", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bitte wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ja">Ja - Mangel anerkannt</SelectItem>
                      <SelectItem value="teilweise">
                        Teilweise anerkannt
                      </SelectItem>
                      <SelectItem value="nein">
                        Nein - Mangel nicht anerkannt
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.anerkennung === "teilweise" && (
                  <div className="space-y-2">
                    <Label htmlFor="minderungsquote">
                      Angemessene Minderungsquote (%)
                    </Label>
                    <Input
                      id="minderungsquote"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="z.B. 10"
                      value={form.minderungsquote}
                      onChange={(e) =>
                        updateField("minderungsquote", e.target.value)
                      }
                    />
                  </div>
                )}

                {form.anerkennung && (
                  <Badge
                    variant={
                      form.anerkennung === "ja"
                        ? "default"
                        : form.anerkennung === "teilweise"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {form.anerkennung === "ja"
                      ? "Vollständig anerkannt"
                      : form.anerkennung === "teilweise"
                        ? "Teilweise anerkannt"
                        : "Abgelehnt"}
                  </Badge>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="geplAnteAbhilfe">
                    Geplante Abhilfe / Maßnahmen
                  </Label>
                  <Textarea
                    id="geplAnteAbhilfe"
                    placeholder="Beschreiben Sie die geplanten Maßnahmen..."
                    value={form.geplAnteAbhilfe}
                    onChange={(e) =>
                      updateField("geplAnteAbhilfe", e.target.value)
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abhilfeTimeline">Zeitrahmen</Label>
                  <Input
                    id="abhilfeTimeline"
                    placeholder="z.B. Innerhalb von 14 Tagen"
                    value={form.abhilfeTimeline}
                    onChange={(e) =>
                      updateField("abhilfeTimeline", e.target.value)
                    }
                  />
                </div>
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
