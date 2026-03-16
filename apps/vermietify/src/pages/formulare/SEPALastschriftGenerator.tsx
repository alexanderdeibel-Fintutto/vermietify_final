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
import { CreditCard, Download, Copy, Eye, RefreshCw } from "lucide-react";

interface SEPAFormState {
  zahlungspflichtigerName: string;
  zahlungspflichtigerAdresse: string;
  iban: string;
  bic: string;
  glaeubigerName: string;
  glaeubigerAdresse: string;
  glaeubigerID: string;
  mandatsreferenz: string;
  datumUnterschrift: string;
  verwendungszweck: string;
  betrag: string;
}

function generateMandatsreferenz(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MAND-${date}-${random}`;
}

function formatIBAN(iban: string): string {
  return iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}

export default function SEPALastschriftGenerator() {
  const [form, setForm] = useState<SEPAFormState>({
    zahlungspflichtigerName: "",
    zahlungspflichtigerAdresse: "",
    iban: "",
    bic: "",
    glaeubigerName: "",
    glaeubigerAdresse: "",
    glaeubigerID: "",
    mandatsreferenz: generateMandatsreferenz(),
    datumUnterschrift: "",
    verwendungszweck: "Miete",
    betrag: "",
  });

  const updateField = <K extends keyof SEPAFormState>(
    field: K,
    value: SEPAFormState[K]
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
SEPA-LASTSCHRIFTMANDAT
(SEPA Direct Debit Mandate)

═══════════════════════════════════════════════

Mandatsreferenz:   ${form.mandatsreferenz}
Gläubiger-ID:      ${form.glaeubigerID || "[Gläubiger-Identifikationsnummer]"}

═══════════════════════════════════════════════

GLÄUBIGER (VERMIETER)

Name:       ${form.glaeubigerName || "[Name des Vermieters]"}
Anschrift:  ${form.glaeubigerAdresse || "[Adresse des Vermieters]"}

═══════════════════════════════════════════════

ZAHLUNGSPFLICHTIGER (MIETER)

Name:       ${form.zahlungspflichtigerName || "[Name des Mieters]"}
Anschrift:  ${form.zahlungspflichtigerAdresse || "[Adresse des Mieters]"}

IBAN:  ${form.iban ? formatIBAN(form.iban) : "[IBAN]"}
BIC:   ${form.bic || "[BIC]"}

═══════════════════════════════════════════════

ERMÄCHTIGUNG

Ich ermächtige den oben genannten Zahlungsempfänger (Gläubiger), Zahlungen von meinem Konto mittels Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an, die vom Gläubiger auf mein Konto gezogenen Lastschriften einzulösen.

Verwendungszweck:  ${form.verwendungszweck || "Miete"}
${form.betrag ? `Betrag:            ${form.betrag} EUR / Monat` : ""}

Hinweis: Ich kann innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung des belasteten Betrages verlangen. Es gelten dabei die mit meinem Kreditinstitut vereinbarten Bedingungen.

Art der Zahlung:   ☒ Wiederkehrende Zahlung

═══════════════════════════════════════════════


_________________________
Ort, Datum: ${formatDate(form.datumUnterschrift)}


_________________________
Unterschrift des Zahlungspflichtigen
${form.zahlungspflichtigerName || "[Name]"}
  `.trim();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(previewText);
  };

  const handleDownloadPDF = () => {
    const blob = new Blob([previewText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SEPA_Lastschriftmandat_${form.zahlungspflichtigerName || "Mieter"}_${heute}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout
      title="SEPA-Lastschriftmandat"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "SEPA-Lastschriftmandat" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="SEPA-Lastschriftmandat"
          subtitle="Erstellen Sie ein SEPA-Lastschriftmandat für den regelmäßigen Mieteinzug."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Gläubiger (Vermieter)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="glaeubigerName">Name</Label>
                  <Input
                    id="glaeubigerName"
                    placeholder="Name des Vermieters"
                    value={form.glaeubigerName}
                    onChange={(e) =>
                      updateField("glaeubigerName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="glaeubigerAdresse">Adresse</Label>
                  <Textarea
                    id="glaeubigerAdresse"
                    placeholder="Adresse des Vermieters"
                    value={form.glaeubigerAdresse}
                    onChange={(e) =>
                      updateField("glaeubigerAdresse", e.target.value)
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="glaeubigerID">
                    Gläubiger-Identifikationsnummer
                  </Label>
                  <Input
                    id="glaeubigerID"
                    placeholder="DE98ZZZ09999999999"
                    value={form.glaeubigerID}
                    onChange={(e) =>
                      updateField("glaeubigerID", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zahlungspflichtiger (Mieter)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zahlungspflichtigerName">Name</Label>
                  <Input
                    id="zahlungspflichtigerName"
                    placeholder="Name des Mieters"
                    value={form.zahlungspflichtigerName}
                    onChange={(e) =>
                      updateField("zahlungspflichtigerName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zahlungspflichtigerAdresse">Adresse</Label>
                  <Textarea
                    id="zahlungspflichtigerAdresse"
                    placeholder="Adresse des Mieters"
                    value={form.zahlungspflichtigerAdresse}
                    onChange={(e) =>
                      updateField(
                        "zahlungspflichtigerAdresse",
                        e.target.value
                      )
                    }
                    rows={2}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    placeholder="DE89 3704 0044 0532 0130 00"
                    value={form.iban}
                    onChange={(e) => updateField("iban", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bic">BIC</Label>
                  <Input
                    id="bic"
                    placeholder="COBADEFFXXX"
                    value={form.bic}
                    onChange={(e) => updateField("bic", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mandat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mandatsreferenz">Mandatsreferenz</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mandatsreferenz"
                      value={form.mandatsreferenz}
                      onChange={(e) =>
                        updateField("mandatsreferenz", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateField(
                          "mandatsreferenz",
                          generateMandatsreferenz()
                        )
                      }
                      title="Neue Referenz generieren"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Automatisch generiert
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verwendungszweck">Verwendungszweck</Label>
                  <Input
                    id="verwendungszweck"
                    placeholder="Miete"
                    value={form.verwendungszweck}
                    onChange={(e) =>
                      updateField("verwendungszweck", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="betrag">Monatlicher Betrag (EUR)</Label>
                  <Input
                    id="betrag"
                    type="number"
                    placeholder="z.B. 850.00"
                    value={form.betrag}
                    onChange={(e) => updateField("betrag", e.target.value)}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="datumUnterschrift">
                    Datum der Unterschrift
                  </Label>
                  <Input
                    id="datumUnterschrift"
                    type="date"
                    value={form.datumUnterschrift}
                    onChange={(e) =>
                      updateField("datumUnterschrift", e.target.value)
                    }
                  />
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
