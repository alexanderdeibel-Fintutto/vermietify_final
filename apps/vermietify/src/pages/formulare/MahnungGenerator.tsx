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
  Download,
  FileText,
  AlertTriangle,
  Receipt,
  Eye,
  Calculator,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";

function formatDate(dateStr: string): string {
  if (!dateStr) return "___________";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function daysBetween(date1: string, date2: string): number {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.max(0, Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function MahnungGenerator() {
  // Form fields
  const [mahnstufe, setMahnstufe] = useState("1");
  const [vermieterName, setVermieterName] = useState("");
  const [vermieterAdresse, setVermieterAdresse] = useState("");
  const [mieterName, setMieterName] = useState("");
  const [mieterAdresse, setMieterAdresse] = useState("");
  const [objektAdresse, setObjektAdresse] = useState("");
  const [offenerBetrag, setOffenerBetrag] = useState(0);
  const [faelligkeitsdatum, setFaelligkeitsdatum] = useState("");
  const [mahnDatum, setMahnDatum] = useState(new Date().toISOString().split("T")[0]);
  const [zahlungsfrist, setZahlungsfrist] = useState(14);
  const [zusaetzlicherText, setZusaetzlicherText] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Verzugszinsen: 5 Prozentpunkte über Basiszinssatz (aktuell simuliert: 3.62%)
  const basiszinssatz = 3.62;
  const verzugszinssatz = basiszinssatz + 5;

  const verzugstage = useMemo(() => daysBetween(faelligkeitsdatum, mahnDatum), [faelligkeitsdatum, mahnDatum]);
  const verzugszinsen = useMemo(() => {
    if (offenerBetrag <= 0 || verzugstage <= 0) return 0;
    return (offenerBetrag * verzugszinssatz * verzugstage) / (365 * 100);
  }, [offenerBetrag, verzugszinssatz, verzugstage]);

  const gesamtforderung = offenerBetrag + verzugszinsen;

  const fristDatum = useMemo(() => {
    if (!mahnDatum) return "";
    const d = new Date(mahnDatum);
    d.setDate(d.getDate() + zahlungsfrist);
    return d.toISOString().split("T")[0];
  }, [mahnDatum, zahlungsfrist]);

  const mahnstufeLabels: Record<string, string> = {
    "1": "1. Mahnung (Zahlungserinnerung)",
    "2": "2. Mahnung",
    "3": "3. Mahnung (Letzte Mahnung)",
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!vermieterName.trim()) newErrors.vermieterName = "Erforderlich";
    if (!vermieterAdresse.trim()) newErrors.vermieterAdresse = "Erforderlich";
    if (!mieterName.trim()) newErrors.mieterName = "Erforderlich";
    if (!mieterAdresse.trim()) newErrors.mieterAdresse = "Erforderlich";
    if (!objektAdresse.trim()) newErrors.objektAdresse = "Erforderlich";
    if (offenerBetrag <= 0) newErrors.offenerBetrag = "Betrag muss größer als 0 sein";
    if (!faelligkeitsdatum) newErrors.faelligkeitsdatum = "Erforderlich";
    if (!mahnDatum) newErrors.mahnDatum = "Erforderlich";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShowPreview = () => {
    if (validate()) setShowPreview(true);
  };

  const getAnrede = (): string => {
    switch (mahnstufe) {
      case "1": return `Sehr geehrte/r ${mieterName || "___________"},`;
      case "2": return `Sehr geehrte/r ${mieterName || "___________"},`;
      case "3": return `${mieterName || "___________"},`;
      default: return `Sehr geehrte/r ${mieterName || "___________"},`;
    }
  };

  const getMainText = (): string => {
    switch (mahnstufe) {
      case "1":
        return `wir möchten Sie freundlich daran erinnern, dass die nachstehend aufgeführte Zahlung trotz Fälligkeit noch nicht bei uns eingegangen ist. Möglicherweise handelt es sich um ein Versehen.

Wir bitten Sie, den ausstehenden Betrag innerhalb der unten genannten Frist auf unser Konto zu überweisen.

Sollte sich Ihre Zahlung mit diesem Schreiben gekreuzt haben, betrachten Sie diese Erinnerung bitte als gegenstandslos.`;
      case "2":
        return `trotz unserer Zahlungserinnerung vom _____________ haben wir bis zum heutigen Tag keinen Zahlungseingang feststellen können.

Wir fordern Sie hiermit erneut und nachdrücklich auf, den ausstehenden Betrag zuzüglich der angefallenen Verzugszinsen unverzüglich zu begleichen.

Bitte beachten Sie, dass wir bei weiterem Zahlungsverzug rechtliche Schritte einleiten werden.`;
      case "3":
        return `trotz unserer wiederholten Mahnungen ist die nachstehend aufgeführte Forderung weiterhin nicht beglichen worden.

Wir setzen Ihnen hiermit eine letzte Frist zur Zahlung. Sollte der Gesamtbetrag nicht fristgerecht bei uns eingehen, werden wir ohne weitere Ankündigung:

1. Ein gerichtliches Mahnverfahren einleiten
2. Die Angelegenheit an unseren Rechtsanwalt übergeben
3. Gegebenenfalls eine fristlose Kündigung des Mietverhältnisses nach § 543 Abs. 2 Nr. 3 BGB aussprechen

Die hierdurch entstehenden zusätzlichen Kosten (Anwalts- und Gerichtskosten) gehen zu Ihren Lasten.`;
      default:
        return "";
    }
  };

  const generatePreviewText = (): string => {
    return `${vermieterName || "___________"}
${vermieterAdresse || "___________"}

${mieterName || "___________"}
${mieterAdresse || "___________"}

${formatDate(mahnDatum)}

Betreff: ${mahnstufeLabels[mahnstufe]}
Mietobjekt: ${objektAdresse || "___________"}

${getAnrede()}

${getMainText()}

Offene Forderung:
${"─".repeat(50)}
Ausstehende Miete/Nebenkosten:    ${formatEuro(offenerBetrag)}
Fällig seit:                       ${formatDate(faelligkeitsdatum)}
Verzugstage:                       ${verzugstage} Tage
Verzugszinsen (${verzugszinssatz.toFixed(2)}% p.a.):     ${formatEuro(verzugszinsen)}
${"─".repeat(50)}
Gesamtforderung:                   ${formatEuro(gesamtforderung)}
${"─".repeat(50)}

Zahlungsfrist: ${formatDate(fristDatum)}

Bitte überweisen Sie den Betrag unter Angabe des Verwendungszwecks "${objektAdresse ? objektAdresse.split(",")[0] : "Mietobjekt"} - Mietnachzahlung" auf unser Konto.
${zusaetzlicherText ? `\n${zusaetzlicherText}\n` : ""}
Mit freundlichen Grüßen


____________________________
${vermieterName || "___________"}`;
  };

  return (
    <MainLayout
      title="Mahnung Generator"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Mahnung Generator" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Mahnung Generator"
          subtitle="Erstellen Sie eine professionelle Zahlungserinnerung bzw. Mahnung mit automatischer Verzugszinsenberechnung."
          actions={
            <Button variant="outline" asChild>
              <Link to="/formulare">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Alle Formulare
              </Link>
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mahnstufe */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Mahnstufe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mahnstufe auswählen</Label>
                  <Select value={mahnstufe} onValueChange={setMahnstufe}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1. Mahnung (Zahlungserinnerung)</SelectItem>
                      <SelectItem value="2">2. Mahnung</SelectItem>
                      <SelectItem value="3">3. Mahnung (Letzte Mahnung)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Badge variant={mahnstufe === "1" ? "default" : "outline"}>Freundlich</Badge>
                  <Badge variant={mahnstufe === "2" ? "default" : "outline"}>Nachdrücklich</Badge>
                  <Badge variant={mahnstufe === "3" ? "destructive" : "outline"}>Letzte Warnung</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Absender & Empfänger */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Absender & Empfänger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Vermieter</h4>
                    <div className="space-y-2">
                      <Label htmlFor="vermieterName">Name *</Label>
                      <Input id="vermieterName" value={vermieterName} onChange={(e) => setVermieterName(e.target.value)} placeholder="Max Mustermann" />
                      {errors.vermieterName && <p className="text-sm text-destructive">{errors.vermieterName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vermieterAdresse">Adresse *</Label>
                      <Textarea id="vermieterAdresse" value={vermieterAdresse} onChange={(e) => setVermieterAdresse(e.target.value)} rows={2} placeholder="Musterstraße 1, 10115 Berlin" />
                      {errors.vermieterAdresse && <p className="text-sm text-destructive">{errors.vermieterAdresse}</p>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Mieter</h4>
                    <div className="space-y-2">
                      <Label htmlFor="mieterName">Name *</Label>
                      <Input id="mieterName" value={mieterName} onChange={(e) => setMieterName(e.target.value)} placeholder="Maria Musterfrau" />
                      {errors.mieterName && <p className="text-sm text-destructive">{errors.mieterName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mieterAdresse">Adresse *</Label>
                      <Textarea id="mieterAdresse" value={mieterAdresse} onChange={(e) => setMieterAdresse(e.target.value)} rows={2} placeholder="Beispielweg 5, 80331 München" />
                      {errors.mieterAdresse && <p className="text-sm text-destructive">{errors.mieterAdresse}</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Forderung */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-5 w-5 text-primary" />
                  Forderung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="objektAdresse">Mietobjekt *</Label>
                  <Input id="objektAdresse" value={objektAdresse} onChange={(e) => setObjektAdresse(e.target.value)} placeholder="Hauptstraße 10, 10115 Berlin" />
                  {errors.objektAdresse && <p className="text-sm text-destructive">{errors.objektAdresse}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="offenerBetrag">Offener Betrag (EUR) *</Label>
                    <Input id="offenerBetrag" type="number" value={offenerBetrag || ""} onChange={(e) => setOffenerBetrag(Number(e.target.value))} min={0} step={0.01} />
                    {errors.offenerBetrag && <p className="text-sm text-destructive">{errors.offenerBetrag}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faelligkeitsdatum">Fälligkeitsdatum *</Label>
                    <Input id="faelligkeitsdatum" type="date" value={faelligkeitsdatum} onChange={(e) => setFaelligkeitsdatum(e.target.value)} />
                    {errors.faelligkeitsdatum && <p className="text-sm text-destructive">{errors.faelligkeitsdatum}</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mahnDatum">Datum der Mahnung *</Label>
                    <Input id="mahnDatum" type="date" value={mahnDatum} onChange={(e) => setMahnDatum(e.target.value)} />
                    {errors.mahnDatum && <p className="text-sm text-destructive">{errors.mahnDatum}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zahlungsfrist">Zahlungsfrist (Tage)</Label>
                    <Input id="zahlungsfrist" type="number" value={zahlungsfrist} onChange={(e) => setZahlungsfrist(Number(e.target.value))} min={1} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zusaetzlicherText">Zusätzlicher Text (optional)</Label>
                  <Textarea id="zusaetzlicherText" value={zusaetzlicherText} onChange={(e) => setZusaetzlicherText(e.target.value)} rows={3} placeholder="Weitere Hinweise oder Bankverbindung..." />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleShowPreview} className="w-full gap-2" size="lg">
              <Eye className="h-4 w-4" />
              Vorschau generieren
            </Button>
          </div>

          {/* Sidebar: Calculation & Info */}
          <div className="space-y-4">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="h-5 w-5 text-primary" />
                  Verzugszinsen-Berechnung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Basiszinssatz:</span>
                  <span className="text-right">{basiszinssatz.toFixed(2)}%</span>
                  <span className="text-muted-foreground">Verzugszinssatz:</span>
                  <span className="text-right font-medium">{verzugszinssatz.toFixed(2)}%</span>
                  <span className="text-muted-foreground">Verzugstage:</span>
                  <span className="text-right">{verzugstage}</span>
                  <span className="text-muted-foreground">Offener Betrag:</span>
                  <span className="text-right">{formatEuro(offenerBetrag)}</span>
                </div>
                <hr />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Verzugszinsen:</span>
                  <span className="text-right font-medium text-amber-600">{formatEuro(verzugszinsen)}</span>
                  <span className="font-semibold">Gesamt:</span>
                  <span className="text-right font-bold text-primary">{formatEuro(gesamtforderung)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-2">
                  <p><strong>§ 288 BGB - Verzugszinsen:</strong> Der Verzugszinssatz beträgt für das Jahr fünf Prozentpunkte über dem Basiszinssatz.</p>
                  <p><strong>§ 286 BGB - Verzug:</strong> Der Schuldner kommt spätestens in Verzug, wenn er nicht innerhalb von 30 Tagen nach Fälligkeit und Zugang einer Rechnung leistet.</p>
                  <p><strong>Tipp:</strong> Bei einem Zahlungsrückstand von 2 Monatsmieten kann eine fristlose Kündigung nach § 543 Abs. 2 Nr. 3 BGB ausgesprochen werden.</p>
                </div>
              </CardContent>
            </Card>

            {mahnstufe === "3" && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-destructive">Letzte Mahnung</p>
                    <p className="text-muted-foreground mt-1">
                      Nach der 3. Mahnung sollten Sie rechtliche Schritte einleiten (gerichtliches Mahnverfahren)
                      oder eine fristlose Kündigung in Betracht ziehen.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-primary" />
                Vorschau - {mahnstufeLabels[mahnstufe]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
