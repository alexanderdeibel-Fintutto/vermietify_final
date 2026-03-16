import { useState, useMemo } from "react";
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
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Eye,
  FileText,
  AlertTriangle,
  UserX,
  Info,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  { id: 1, label: "Kündigungstyp" },
  { id: 2, label: "Absender & Empfänger" },
  { id: 3, label: "Mietobjekt & Details" },
  { id: 4, label: "Vorschau" },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "___________";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  // Set to end of month for Kündigungsfrist
  d.setDate(0);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

export default function KuendigungGenerator() {
  const [step, setStep] = useState(1);

  // Typ
  const [kuendigungstyp, setKuendigungstyp] = useState("ordentlich");

  // Absender / Empfänger
  const [absenderName, setAbsenderName] = useState("");
  const [absenderAdresse, setAbsenderAdresse] = useState("");
  const [empfaengerName, setEmpfaengerName] = useState("");
  const [empfaengerAdresse, setEmpfaengerAdresse] = useState("");

  // Mietobjekt & Details
  const [objektAdresse, setObjektAdresse] = useState("");
  const [mietvertragDatum, setMietvertragDatum] = useState("");
  const [mietdauerJahre, setMietdauerJahre] = useState(0);
  const [kuendigungsgrund, setKuendigungsgrund] = useState("");
  const [kuendigungsDatum, setKuendigungsDatum] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Automatic Kündigungsfrist calculation
  const kuendigungsfrist = useMemo(() => {
    if (kuendigungstyp === "ausserordentlich") return { monate: 0, label: "Fristlos (unverzüglich)" };
    if (kuendigungstyp === "sonderkuendigung") return { monate: 3, label: "3 Monate (Sonderkündigungsrecht)" };
    // Ordentliche Kündigung - Vermieter
    if (mietdauerJahre < 5) return { monate: 3, label: "3 Monate (Mietdauer unter 5 Jahren)" };
    if (mietdauerJahre <= 8) return { monate: 6, label: "6 Monate (Mietdauer 5-8 Jahre)" };
    return { monate: 9, label: "9 Monate (Mietdauer über 8 Jahre)" };
  }, [kuendigungstyp, mietdauerJahre]);

  const kuendigungZum = useMemo(() => {
    if (!kuendigungsDatum || kuendigungsfrist.monate === 0) return "";
    return addMonths(kuendigungsDatum, kuendigungsfrist.monate);
  }, [kuendigungsDatum, kuendigungsfrist]);

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    switch (currentStep) {
      case 1:
        // No validation needed, default value is set
        break;
      case 2:
        if (!absenderName.trim()) newErrors.absenderName = "Name ist erforderlich";
        if (!absenderAdresse.trim()) newErrors.absenderAdresse = "Adresse ist erforderlich";
        if (!empfaengerName.trim()) newErrors.empfaengerName = "Name ist erforderlich";
        if (!empfaengerAdresse.trim()) newErrors.empfaengerAdresse = "Adresse ist erforderlich";
        break;
      case 3:
        if (!objektAdresse.trim()) newErrors.objektAdresse = "Adresse des Mietobjekts ist erforderlich";
        if (!kuendigungsDatum) newErrors.kuendigungsDatum = "Kündigungsdatum ist erforderlich";
        if (kuendigungstyp === "ausserordentlich" && !kuendigungsgrund.trim()) {
          newErrors.kuendigungsgrund = "Bei außerordentlicher Kündigung ist ein Grund erforderlich";
        }
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const typLabels: Record<string, string> = {
    ordentlich: "Ordentliche Kündigung",
    ausserordentlich: "Außerordentliche (fristlose) Kündigung",
    sonderkuendigung: "Sonderkündigung",
  };

  const generatePreviewText = (): string => {
    const isAusserordentlich = kuendigungstyp === "ausserordentlich";

    return `${absenderName || "___________"}
${absenderAdresse || "___________"}

${empfaengerName || "___________"}
${empfaengerAdresse || "___________"}

${kuendigungsDatum ? formatDate(kuendigungsDatum) : "___________"}

Betreff: ${typLabels[kuendigungstyp]} des Mietverhältnisses
Mietobjekt: ${objektAdresse || "___________"}
${mietvertragDatum ? `Mietvertrag vom: ${formatDate(mietvertragDatum)}` : ""}

Sehr geehrte/r ${empfaengerName || "___________"},

hiermit ${isAusserordentlich ? "kündige ich das oben genannte Mietverhältnis fristlos aus wichtigem Grund" : `kündige ich das oben genannte Mietverhältnis ordnungsgemäß unter Einhaltung der gesetzlichen Kündigungsfrist`}.

${isAusserordentlich ? "" : `Die Kündigungsfrist beträgt ${kuendigungsfrist.label}.
Das Mietverhältnis endet somit zum ${kuendigungZum ? formatDate(kuendigungZum) : "___________"}.`}

${kuendigungsgrund ? `Begründung:\n${kuendigungsgrund}\n` : ""}${isAusserordentlich ? `Die fristlose Kündigung erfolgt gemäß § 543 BGB.\n\nHilfsweise spreche ich hiermit auch die ordentliche Kündigung zum nächstmöglichen Termin aus.\n` : ""}
Ich bitte Sie, die Wohnung zum genannten Termin geräumt und in vertragsgemäßem Zustand zu übergeben. Bitte vereinbaren Sie mit mir einen Termin für eine Wohnungsübergabe.

${kuendigungstyp === "ordentlich" ? `Der Widerspruch gegen diese Kündigung ist gemäß § 574 BGB möglich. Ich weise Sie darauf hin, dass ein eventueller Widerspruch spätestens zwei Monate vor Beendigung des Mietverhältnisses schriftlich gegenüber dem Vermieter zu erklären ist.\n` : ""}
Bitte bestätigen Sie den Erhalt dieser Kündigung schriftlich.

Mit freundlichen Grüßen


____________________________
${absenderName || "___________"}


Bestätigung des Empfangs:

Ich, ${empfaengerName || "___________"}, bestätige hiermit den Empfang dieser Kündigung am _____________.


____________________________
Unterschrift`;
  };

  return (
    <MainLayout
      title="Kündigung Generator"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Kündigung Generator" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Kündigung Generator"
          subtitle="Erstellen Sie eine rechtssichere Kündigung des Mietvertrags."
          actions={
            <Button variant="outline" asChild>
              <Link to="/formulare">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Alle Formulare
              </Link>
            </Button>
          }
        />

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  step > s.id
                    ? "bg-primary text-primary-foreground"
                    : step === s.id
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className={`text-xs ml-1 hidden md:inline ${step === s.id ? "font-semibold" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className={`h-0.5 w-6 mx-2 ${step > s.id ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Legal Warnings */}
        {kuendigungstyp === "ausserordentlich" && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex gap-3">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-destructive">Hinweis zur außerordentlichen Kündigung</p>
                <p className="text-muted-foreground mt-1">
                  Eine fristlose Kündigung ist nur bei Vorliegen eines wichtigen Grundes nach § 543 BGB zulässig
                  (z.B. erheblicher Zahlungsrückstand, schwerwiegende Vertragsverletzungen). Es wird dringend empfohlen,
                  vor Ausspruch der Kündigung rechtliche Beratung einzuholen.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserX className="h-5 w-5 text-primary" />
              {STEPS[step - 1].label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Typ */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Kündigungstyp</Label>
                  <Select value={kuendigungstyp} onValueChange={setKuendigungstyp}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ordentlich">Ordentliche Kündigung</SelectItem>
                      <SelectItem value="ausserordentlich">Außerordentliche (fristlose) Kündigung</SelectItem>
                      <SelectItem value="sonderkuendigung">Sonderkündigung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  {kuendigungstyp === "ordentlich" && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 flex gap-3">
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Ordentliche Kündigung</p>
                          <p className="text-muted-foreground mt-1">
                            Die ordentliche Kündigung erfolgt unter Einhaltung der gesetzlichen Kündigungsfristen
                            nach § 573c BGB. Die Frist beträgt je nach Mietdauer 3, 6 oder 9 Monate.
                            Als Vermieter benötigen Sie ein berechtigtes Interesse (§ 573 BGB).
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {kuendigungstyp === "ausserordentlich" && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Außerordentliche Kündigung</p>
                          <p className="text-muted-foreground mt-1">
                            Fristlos möglich bei wichtigem Grund (§ 543 BGB), z.B. Zahlungsverzug von 2 Monatsmieten,
                            erhebliche Störung des Hausfriedens oder vertragswidriger Gebrauch der Mietsache.
                            Eine vorherige Abmahnung ist in der Regel erforderlich.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {kuendigungstyp === "sonderkuendigung" && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 flex gap-3">
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Sonderkündigung</p>
                          <p className="text-muted-foreground mt-1">
                            Sonderkündigungsrechte bestehen z.B. bei Mieterhöhung (§ 561 BGB),
                            Modernisierungsankündigung (§ 555e BGB) oder Tod des Mieters (§ 564 BGB).
                            Die Kündigungsfrist beträgt in der Regel 3 Monate.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Absender & Empfänger */}
            {step === 2 && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Absender (Vermieter)</h4>
                  <div className="space-y-2">
                    <Label htmlFor="absenderName">Name *</Label>
                    <Input id="absenderName" placeholder="Max Mustermann" value={absenderName} onChange={(e) => setAbsenderName(e.target.value)} />
                    {errors.absenderName && <p className="text-sm text-destructive">{errors.absenderName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="absenderAdresse">Adresse *</Label>
                    <Textarea id="absenderAdresse" placeholder="Musterstraße 1, 10115 Berlin" value={absenderAdresse} onChange={(e) => setAbsenderAdresse(e.target.value)} rows={3} />
                    {errors.absenderAdresse && <p className="text-sm text-destructive">{errors.absenderAdresse}</p>}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Empfänger (Mieter)</h4>
                  <div className="space-y-2">
                    <Label htmlFor="empfaengerName">Name *</Label>
                    <Input id="empfaengerName" placeholder="Maria Musterfrau" value={empfaengerName} onChange={(e) => setEmpfaengerName(e.target.value)} />
                    {errors.empfaengerName && <p className="text-sm text-destructive">{errors.empfaengerName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empfaengerAdresse">Adresse *</Label>
                    <Textarea id="empfaengerAdresse" placeholder="Beispielweg 5, 80331 München" value={empfaengerAdresse} onChange={(e) => setEmpfaengerAdresse(e.target.value)} rows={3} />
                    {errors.empfaengerAdresse && <p className="text-sm text-destructive">{errors.empfaengerAdresse}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Mietobjekt & Details */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="objektAdresse">Adresse des Mietobjekts *</Label>
                  <Input id="objektAdresse" placeholder="Hauptstraße 10, 10115 Berlin" value={objektAdresse} onChange={(e) => setObjektAdresse(e.target.value)} />
                  {errors.objektAdresse && <p className="text-sm text-destructive">{errors.objektAdresse}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mietvertragDatum">Datum des Mietvertrags</Label>
                    <Input id="mietvertragDatum" type="date" value={mietvertragDatum} onChange={(e) => setMietvertragDatum(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kuendigungsDatum">Datum der Kündigung *</Label>
                    <Input id="kuendigungsDatum" type="date" value={kuendigungsDatum} onChange={(e) => setKuendigungsDatum(e.target.value)} />
                    {errors.kuendigungsDatum && <p className="text-sm text-destructive">{errors.kuendigungsDatum}</p>}
                  </div>
                </div>
                {kuendigungstyp === "ordentlich" && (
                  <div className="space-y-2">
                    <Label htmlFor="mietdauerJahre">Mietdauer in Jahren</Label>
                    <Input
                      id="mietdauerJahre"
                      type="number"
                      value={mietdauerJahre || ""}
                      onChange={(e) => setMietdauerJahre(Number(e.target.value))}
                      min={0}
                      placeholder="z.B. 3"
                    />
                    <p className="text-xs text-muted-foreground">
                      Wird zur Berechnung der Kündigungsfrist benötigt.
                    </p>
                  </div>
                )}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold">Berechnete Kündigungsfrist</p>
                    <p className="text-lg font-bold text-primary mt-1">{kuendigungsfrist.label}</p>
                    {kuendigungZum && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Mietverhältnis endet zum: <strong>{formatDate(kuendigungZum)}</strong>
                      </p>
                    )}
                  </CardContent>
                </Card>
                {kuendigungstyp === "ausserordentlich" && (
                  <div className="space-y-2">
                    <Label htmlFor="kuendigungsgrund">Kündigungsgrund (erforderlich) *</Label>
                    <Textarea
                      id="kuendigungsgrund"
                      placeholder="Beschreiben Sie den wichtigen Grund für die fristlose Kündigung..."
                      value={kuendigungsgrund}
                      onChange={(e) => setKuendigungsgrund(e.target.value)}
                      rows={4}
                    />
                    {errors.kuendigungsgrund && <p className="text-sm text-destructive">{errors.kuendigungsgrund}</p>}
                  </div>
                )}
                {kuendigungstyp !== "ausserordentlich" && (
                  <div className="space-y-2">
                    <Label htmlFor="kuendigungsgrund">Kündigungsgrund (optional bei ordentlicher Kündigung)</Label>
                    <Textarea
                      id="kuendigungsgrund"
                      placeholder="z.B. Eigenbedarf, wirtschaftliche Verwertung..."
                      value={kuendigungsgrund}
                      onChange={(e) => setKuendigungsgrund(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </>
            )}

            {/* Step 4: Preview */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Vorschau</Badge>
                  <span className="text-sm text-muted-foreground">Überprüfen Sie das generierte Kündigungsschreiben</span>
                </div>

                {/* Legal notice */}
                <Card className="border-amber-300 bg-amber-50">
                  <CardContent className="p-4 flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-amber-800">Rechtlicher Hinweis</p>
                      <p className="text-amber-700 mt-1">
                        Dieses Dokument dient als Vorlage und ersetzt keine individuelle Rechtsberatung.
                        Bitte stellen Sie sicher, dass die Kündigung per Einschreiben mit Rückschein
                        zugestellt wird. Die Kündigung muss allen im Mietvertrag genannten Mietern zugehen.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-white border rounded-lg p-8 font-mono text-sm whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                  {generatePreviewText()}
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => alert("PDF-Download wird in einer zukünftigen Version verfügbar sein.")} className="gap-2">
                    <Download className="h-4 w-4" />
                    Als PDF herunterladen
                  </Button>
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(generatePreviewText())} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Text kopieren
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          {step < 4 ? (
            <Button onClick={handleNext} className="gap-2">
              Weiter
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </MainLayout>
  );
}
