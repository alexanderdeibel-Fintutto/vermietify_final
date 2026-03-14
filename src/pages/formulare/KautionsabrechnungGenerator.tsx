import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { KeyRound, Download, Copy, Eye, Plus, Trash2, Calculator } from "lucide-react";

interface Abzug {
  id: string;
  beschreibung: string;
  betrag: string;
}

interface KautionsFormState {
  mieterName: string;
  mieterAdresse: string;
  vermieterName: string;
  vermieterAdresse: string;
  kautionsbetrag: string;
  eingezahltAm: string;
  auszugAm: string;
  abzuege: Abzug[];
  fristRueckzahlung: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function KautionsabrechnungGenerator() {
  const [form, setForm] = useState<KautionsFormState>({
    mieterName: "",
    mieterAdresse: "",
    vermieterName: "",
    vermieterAdresse: "",
    kautionsbetrag: "",
    eingezahltAm: "",
    auszugAm: "",
    abzuege: [],
    fristRueckzahlung: "",
  });

  const updateField = <K extends keyof KautionsFormState>(
    field: K,
    value: KautionsFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addAbzug = () => {
    setForm((prev) => ({
      ...prev,
      abzuege: [
        ...prev.abzuege,
        { id: generateId(), beschreibung: "", betrag: "" },
      ],
    }));
  };

  const removeAbzug = (id: string) => {
    setForm((prev) => ({
      ...prev,
      abzuege: prev.abzuege.filter((a) => a.id !== id),
    }));
  };

  const updateAbzug = (id: string, field: keyof Omit<Abzug, "id">, value: string) => {
    setForm((prev) => ({
      ...prev,
      abzuege: prev.abzuege.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    }));
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

  const calculations = useMemo(() => {
    const kaution = parseFloat(form.kautionsbetrag) || 0;
    const gesamtAbzuege = form.abzuege.reduce(
      (sum, a) => sum + (parseFloat(a.betrag) || 0),
      0
    );

    // Calculate interest: simplified annual rate of 0.5% (typical savings account)
    let zinsen = 0;
    if (form.eingezahltAm && form.auszugAm) {
      const start = new Date(form.eingezahltAm);
      const end = new Date(form.auszugAm);
      const years =
        (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (years > 0) {
        zinsen = kaution * 0.005 * years;
      }
    }

    const rueckzahlung = kaution + zinsen - gesamtAbzuege;

    return {
      kaution,
      gesamtAbzuege,
      zinsen: Math.round(zinsen * 100) / 100,
      rueckzahlung: Math.round(rueckzahlung * 100) / 100,
    };
  }, [form.kautionsbetrag, form.abzuege, form.eingezahltAm, form.auszugAm]);

  const abzuegeText = form.abzuege.length > 0
    ? form.abzuege
        .map(
          (a, i) =>
            `  ${i + 1}. ${a.beschreibung || "[Beschreibung]"}: ${a.betrag ? `${parseFloat(a.betrag).toFixed(2)} EUR` : "[Betrag]"}`
        )
        .join("\n")
    : "  Keine Abzüge";

  const previewText = `
KAUTIONSABRECHNUNG

Datum: ${heute}

═══════════════════════════════════════════════

VERMIETER
${form.vermieterName || "[Name des Vermieters]"}
${form.vermieterAdresse || "[Adresse des Vermieters]"}

MIETER
${form.mieterName || "[Name des Mieters]"}
${form.mieterAdresse || "[Adresse des Mieters]"}

═══════════════════════════════════════════════

KAUTIONSÜBERSICHT

Kautionsbetrag:        ${calculations.kaution.toFixed(2)} EUR
Eingezahlt am:         ${formatDate(form.eingezahltAm)}
Auszug am:             ${formatDate(form.auszugAm)}

═══════════════════════════════════════════════

ZINSEN AUF KAUTION

Zinssatz:              0,5 % p.a. (marktüblich)
Berechnete Zinsen:     ${calculations.zinsen.toFixed(2)} EUR

═══════════════════════════════════════════════

ABZÜGE

${abzuegeText}

Gesamte Abzüge:        ${calculations.gesamtAbzuege.toFixed(2)} EUR

═══════════════════════════════════════════════

BERECHNUNG

  Kautionsbetrag:       ${calculations.kaution.toFixed(2)} EUR
+ Zinsen:               ${calculations.zinsen.toFixed(2)} EUR
- Abzüge:               ${calculations.gesamtAbzuege.toFixed(2)} EUR
─────────────────────────────────
= Rückzahlungsbetrag:   ${calculations.rueckzahlung.toFixed(2)} EUR

═══════════════════════════════════════════════

${
  calculations.rueckzahlung > 0
    ? `Der Rückzahlungsbetrag in Höhe von ${calculations.rueckzahlung.toFixed(2)} EUR wird bis zum ${formatDate(form.fristRueckzahlung)} auf das von Ihnen angegebene Konto überwiesen.`
    : calculations.rueckzahlung < 0
      ? `Die Abzüge übersteigen die Kaution um ${Math.abs(calculations.rueckzahlung).toFixed(2)} EUR. Ich bitte um Ausgleich des offenen Betrages bis zum ${formatDate(form.fristRueckzahlung)}.`
      : "Die Kaution ist vollständig durch die Abzüge verrechnet."
}

Sollten Sie mit einzelnen Positionen nicht einverstanden sein, bitte ich um schriftliche Mitteilung innerhalb von 4 Wochen.


_________________________
Ort, Datum


_________________________
Unterschrift Vermieter
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
    a.download = `Kautionsabrechnung_${form.mieterName || "Mieter"}_${heute}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout
      title="Kautionsabrechnung"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Kautionsabrechnung" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Kautionsabrechnung"
          subtitle="Erstellen Sie eine detaillierte Kautionsabrechnung mit automatischer Zins- und Rückzahlungsberechnung."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Vermieter
                </CardTitle>
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
                <CardTitle>Mieter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mieterName">Name</Label>
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
                  <Label htmlFor="mieterAdresse">Adresse</Label>
                  <Textarea
                    id="mieterAdresse"
                    placeholder="Aktuelle Adresse des Mieters"
                    value={form.mieterAdresse}
                    onChange={(e) =>
                      updateField("mieterAdresse", e.target.value)
                    }
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Kaution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kautionsbetrag">Kautionsbetrag (EUR)</Label>
                  <Input
                    id="kautionsbetrag"
                    type="number"
                    placeholder="z.B. 1500.00"
                    value={form.kautionsbetrag}
                    onChange={(e) =>
                      updateField("kautionsbetrag", e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eingezahltAm">Eingezahlt am</Label>
                    <Input
                      id="eingezahltAm"
                      type="date"
                      value={form.eingezahltAm}
                      onChange={(e) =>
                        updateField("eingezahltAm", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auszugAm">Auszug am</Label>
                    <Input
                      id="auszugAm"
                      type="date"
                      value={form.auszugAm}
                      onChange={(e) =>
                        updateField("auszugAm", e.target.value)
                      }
                    />
                  </div>
                </div>
                {calculations.zinsen > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Berechnete Zinsen: {calculations.zinsen.toFixed(2)} EUR
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Abzüge</span>
                  <Button variant="outline" size="sm" onClick={addAbzug}>
                    <Plus className="mr-2 h-4 w-4" />
                    Abzug hinzufügen
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.abzuege.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Keine Abzüge hinzugefügt. Klicken Sie auf "Abzug
                    hinzufügen" um Positionen zu ergänzen.
                  </p>
                )}
                {form.abzuege.map((abzug, index) => (
                  <div
                    key={abzug.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <Label>Beschreibung</Label>
                        <Input
                          placeholder="z.B. Schönheitsreparaturen"
                          value={abzug.beschreibung}
                          onChange={(e) =>
                            updateAbzug(
                              abzug.id,
                              "beschreibung",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Betrag (EUR)</Label>
                        <Input
                          type="number"
                          placeholder="z.B. 250.00"
                          value={abzug.betrag}
                          onChange={(e) =>
                            updateAbzug(abzug.id, "betrag", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAbzug(abzug.id)}
                      className="text-destructive hover:text-destructive shrink-0 mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {form.abzuege.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center font-medium">
                      <span>Gesamte Abzüge:</span>
                      <span>{calculations.gesamtAbzuege.toFixed(2)} EUR</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rückzahlung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fristRueckzahlung">
                    Frist für Rückzahlung
                  </Label>
                  <Input
                    id="fristRueckzahlung"
                    type="date"
                    value={form.fristRueckzahlung}
                    onChange={(e) =>
                      updateField("fristRueckzahlung", e.target.value)
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Kaution:</span>
                    <span>{calculations.kaution.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>+ Zinsen:</span>
                    <span>{calculations.zinsen.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>- Abzüge:</span>
                    <span>{calculations.gesamtAbzuege.toFixed(2)} EUR</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Rückzahlungsbetrag:</span>
                    <Badge
                      variant={
                        calculations.rueckzahlung >= 0
                          ? "default"
                          : "destructive"
                      }
                      className="text-base"
                    >
                      {calculations.rueckzahlung.toFixed(2)} EUR
                    </Badge>
                  </div>
                </div>
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
