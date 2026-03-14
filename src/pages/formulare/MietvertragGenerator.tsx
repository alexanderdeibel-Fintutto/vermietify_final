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
import {
  Home,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Eye,
  FileText,
  User,
  Building2,
  Euro,
  ClipboardList,
} from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  { id: 1, label: "Vermieter", icon: User },
  { id: 2, label: "Mieter", icon: User },
  { id: 3, label: "Mietobjekt", icon: Building2 },
  { id: 4, label: "Konditionen", icon: Euro },
  { id: 5, label: "Sondervereinbarungen", icon: ClipboardList },
  { id: 6, label: "Vorschau", icon: Eye },
];

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

export default function MietvertragGenerator() {
  const [step, setStep] = useState(1);

  // Vermieter
  const [vermieterName, setVermieterName] = useState("");
  const [vermieterAdresse, setVermieterAdresse] = useState("");

  // Mieter
  const [mieterName, setMieterName] = useState("");
  const [mieterAdresse, setMieterAdresse] = useState("");
  const [mieterGeburtsdatum, setMieterGeburtsdatum] = useState("");

  // Mietobjekt
  const [objektAdresse, setObjektAdresse] = useState("");
  const [objektEtage, setObjektEtage] = useState("");
  const [objektFlaeche, setObjektFlaeche] = useState(0);
  const [objektZimmer, setObjektZimmer] = useState(0);

  // Konditionen
  const [kaltmiete, setKaltmiete] = useState(0);
  const [nebenkosten, setNebenkosten] = useState(0);
  const [kaution, setKaution] = useState(0);
  const [mietbeginn, setMietbeginn] = useState("");
  const [befristung, setBefristung] = useState("unbefristet");
  const [befristungEnde, setBefristungEnde] = useState("");

  // Sondervereinbarungen
  const [haustiere, setHaustiere] = useState("nicht_erlaubt");
  const [rauchen, setRauchen] = useState("nicht_erlaubt");
  const [renovierung, setRenovierung] = useState("mieter");
  const [sonstigeVereinbarungen, setSonstigeVereinbarungen] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    switch (currentStep) {
      case 1:
        if (!vermieterName.trim()) newErrors.vermieterName = "Name ist erforderlich";
        if (!vermieterAdresse.trim()) newErrors.vermieterAdresse = "Adresse ist erforderlich";
        break;
      case 2:
        if (!mieterName.trim()) newErrors.mieterName = "Name ist erforderlich";
        if (!mieterAdresse.trim()) newErrors.mieterAdresse = "Adresse ist erforderlich";
        if (!mieterGeburtsdatum) newErrors.mieterGeburtsdatum = "Geburtsdatum ist erforderlich";
        break;
      case 3:
        if (!objektAdresse.trim()) newErrors.objektAdresse = "Adresse ist erforderlich";
        if (objektFlaeche <= 0) newErrors.objektFlaeche = "Fläche muss größer als 0 sein";
        if (objektZimmer <= 0) newErrors.objektZimmer = "Zimmeranzahl muss größer als 0 sein";
        break;
      case 4:
        if (kaltmiete <= 0) newErrors.kaltmiete = "Kaltmiete muss größer als 0 sein";
        if (nebenkosten < 0) newErrors.nebenkosten = "Nebenkosten dürfen nicht negativ sein";
        if (kaution < 0) newErrors.kaution = "Kaution darf nicht negativ sein";
        if (!mietbeginn) newErrors.mietbeginn = "Mietbeginn ist erforderlich";
        if (befristung === "befristet" && !befristungEnde) newErrors.befristungEnde = "Befristungsende ist erforderlich";
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 6));
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const warmmiete = kaltmiete + nebenkosten;

  const generatePreviewText = (): string => {
    return `WOHNUNGSMIETVERTRAG

Zwischen
${vermieterName || "___________"}
${vermieterAdresse || "___________"}
- nachfolgend "Vermieter" genannt -

und
${mieterName || "___________"}
${mieterAdresse || "___________"}
geboren am ${formatDate(mieterGeburtsdatum)}
- nachfolgend "Mieter" genannt -

wird folgender Mietvertrag geschlossen:

\u00A7 1 Mietobjekt
Der Vermieter vermietet dem Mieter die Wohnung in:
${objektAdresse || "___________"}
Etage: ${objektEtage || "___________"}
Wohnfläche: ca. ${objektFlaeche || "___"} m\u00B2
Zimmer: ${objektZimmer || "___"}

\u00A7 2 Mietdauer
Das Mietverhältnis beginnt am ${formatDate(mietbeginn)}.
${befristung === "befristet"
  ? `Das Mietverhältnis ist befristet bis zum ${formatDate(befristungEnde)}.`
  : "Das Mietverhältnis wird auf unbestimmte Zeit geschlossen."}

\u00A7 3 Miete
Die monatliche Miete setzt sich wie folgt zusammen:
Kaltmiete (Nettomiete): ${formatEuro(kaltmiete)}
Vorauszahlung Nebenkosten: ${formatEuro(nebenkosten)}
Gesamtmiete (Warmmiete): ${formatEuro(warmmiete)}

Die Miete ist monatlich im Voraus, spätestens bis zum 3. Werktag des Monats zu entrichten.

\u00A7 4 Kaution
Der Mieter zahlt eine Mietkaution in Höhe von ${formatEuro(kaution)}.
Die Kaution ist in drei gleichen monatlichen Raten zu zahlen.
Die erste Rate ist zu Beginn des Mietverhältnisses fällig.

\u00A7 5 Sondervereinbarungen
Tierhaltung: ${haustiere === "erlaubt" ? "Die Haltung von Haustieren ist gestattet." : haustiere === "mit_genehmigung" ? "Die Haltung von Haustieren bedarf der vorherigen Zustimmung des Vermieters." : "Die Haltung von Haustieren ist nicht gestattet. Kleintiere sind hiervon ausgenommen."}
Rauchen: ${rauchen === "erlaubt" ? "Das Rauchen in der Wohnung ist gestattet." : "Das Rauchen in der Wohnung ist nicht gestattet."}
Schönheitsreparaturen: ${renovierung === "mieter" ? "Schönheitsreparaturen obliegen dem Mieter." : "Schönheitsreparaturen werden vom Vermieter durchgeführt."}
${sonstigeVereinbarungen ? `\nWeitere Vereinbarungen:\n${sonstigeVereinbarungen}` : ""}

\u00A7 6 Schlussbestimmungen
Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform.
Sollten einzelne Bestimmungen dieses Vertrages unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt.

____________________________          ____________________________
Ort, Datum                            Ort, Datum

____________________________          ____________________________
Unterschrift Vermieter                Unterschrift Mieter`;
  };

  return (
    <MainLayout
      title="Mietvertrag Generator"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Mietvertrag Generator" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Mietvertrag Generator"
          subtitle="Erstellen Sie einen rechtssicheren Wohnungsmietvertrag Schritt für Schritt."
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
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${isActive ? "font-semibold" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-8 sm:w-16 mx-1 ${
                      step > s.id ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              {STEPS[step - 1].label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Vermieter */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="vermieterName">Name des Vermieters *</Label>
                  <Input
                    id="vermieterName"
                    placeholder="Max Mustermann / Mustermann GmbH"
                    value={vermieterName}
                    onChange={(e) => setVermieterName(e.target.value)}
                  />
                  {errors.vermieterName && <p className="text-sm text-destructive">{errors.vermieterName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vermieterAdresse">Adresse des Vermieters *</Label>
                  <Textarea
                    id="vermieterAdresse"
                    placeholder="Musterstraße 1, 10115 Berlin"
                    value={vermieterAdresse}
                    onChange={(e) => setVermieterAdresse(e.target.value)}
                    rows={3}
                  />
                  {errors.vermieterAdresse && <p className="text-sm text-destructive">{errors.vermieterAdresse}</p>}
                </div>
              </>
            )}

            {/* Step 2: Mieter */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mieterName">Name des Mieters *</Label>
                  <Input
                    id="mieterName"
                    placeholder="Maria Musterfrau"
                    value={mieterName}
                    onChange={(e) => setMieterName(e.target.value)}
                  />
                  {errors.mieterName && <p className="text-sm text-destructive">{errors.mieterName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mieterAdresse">Aktuelle Adresse des Mieters *</Label>
                  <Textarea
                    id="mieterAdresse"
                    placeholder="Beispielweg 5, 80331 München"
                    value={mieterAdresse}
                    onChange={(e) => setMieterAdresse(e.target.value)}
                    rows={3}
                  />
                  {errors.mieterAdresse && <p className="text-sm text-destructive">{errors.mieterAdresse}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mieterGeburtsdatum">Geburtsdatum *</Label>
                  <Input
                    id="mieterGeburtsdatum"
                    type="date"
                    value={mieterGeburtsdatum}
                    onChange={(e) => setMieterGeburtsdatum(e.target.value)}
                  />
                  {errors.mieterGeburtsdatum && <p className="text-sm text-destructive">{errors.mieterGeburtsdatum}</p>}
                </div>
              </>
            )}

            {/* Step 3: Mietobjekt */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="objektAdresse">Adresse des Mietobjekts *</Label>
                  <Textarea
                    id="objektAdresse"
                    placeholder="Hauptstraße 10, 10115 Berlin"
                    value={objektAdresse}
                    onChange={(e) => setObjektAdresse(e.target.value)}
                    rows={3}
                  />
                  {errors.objektAdresse && <p className="text-sm text-destructive">{errors.objektAdresse}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="objektEtage">Etage</Label>
                    <Input
                      id="objektEtage"
                      placeholder="z.B. 3. OG"
                      value={objektEtage}
                      onChange={(e) => setObjektEtage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objektFlaeche">Wohnfläche (m\u00B2) *</Label>
                    <Input
                      id="objektFlaeche"
                      type="number"
                      value={objektFlaeche || ""}
                      onChange={(e) => setObjektFlaeche(Number(e.target.value))}
                      min={0}
                    />
                    {errors.objektFlaeche && <p className="text-sm text-destructive">{errors.objektFlaeche}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objektZimmer">Anzahl Zimmer *</Label>
                    <Input
                      id="objektZimmer"
                      type="number"
                      value={objektZimmer || ""}
                      onChange={(e) => setObjektZimmer(Number(e.target.value))}
                      min={0}
                      step={0.5}
                    />
                    {errors.objektZimmer && <p className="text-sm text-destructive">{errors.objektZimmer}</p>}
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Konditionen */}
            {step === 4 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="kaltmiete">Kaltmiete (EUR/Monat) *</Label>
                    <Input
                      id="kaltmiete"
                      type="number"
                      value={kaltmiete || ""}
                      onChange={(e) => setKaltmiete(Number(e.target.value))}
                      min={0}
                      step={10}
                    />
                    {errors.kaltmiete && <p className="text-sm text-destructive">{errors.kaltmiete}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nebenkosten">Nebenkosten-Vorauszahlung (EUR/Monat) *</Label>
                    <Input
                      id="nebenkosten"
                      type="number"
                      value={nebenkosten || ""}
                      onChange={(e) => setNebenkosten(Number(e.target.value))}
                      min={0}
                      step={10}
                    />
                    {errors.nebenkosten && <p className="text-sm text-destructive">{errors.nebenkosten}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kaution">Kaution (EUR) *</Label>
                  <Input
                    id="kaution"
                    type="number"
                    value={kaution || ""}
                    onChange={(e) => setKaution(Number(e.target.value))}
                    min={0}
                    step={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximal 3 Nettokaltmieten ({formatEuro(kaltmiete * 3)})
                  </p>
                  {errors.kaution && <p className="text-sm text-destructive">{errors.kaution}</p>}
                  {kaution > kaltmiete * 3 && kaltmiete > 0 && (
                    <p className="text-sm text-destructive">Kaution übersteigt die gesetzliche Grenze von 3 Nettokaltmieten!</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mietbeginn">Mietbeginn *</Label>
                  <Input
                    id="mietbeginn"
                    type="date"
                    value={mietbeginn}
                    onChange={(e) => setMietbeginn(e.target.value)}
                  />
                  {errors.mietbeginn && <p className="text-sm text-destructive">{errors.mietbeginn}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Befristung</Label>
                  <Select value={befristung} onValueChange={setBefristung}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unbefristet">Unbefristet</SelectItem>
                      <SelectItem value="befristet">Befristet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {befristung === "befristet" && (
                  <div className="space-y-2">
                    <Label htmlFor="befristungEnde">Befristungsende *</Label>
                    <Input
                      id="befristungEnde"
                      type="date"
                      value={befristungEnde}
                      onChange={(e) => setBefristungEnde(e.target.value)}
                    />
                    {errors.befristungEnde && <p className="text-sm text-destructive">{errors.befristungEnde}</p>}
                  </div>
                )}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Zusammenfassung Miete</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <span className="text-muted-foreground">Kaltmiete:</span>
                      <span className="text-right font-medium">{formatEuro(kaltmiete)}</span>
                      <span className="text-muted-foreground">Nebenkosten:</span>
                      <span className="text-right font-medium">{formatEuro(nebenkosten)}</span>
                      <span className="text-muted-foreground font-semibold">Warmmiete:</span>
                      <span className="text-right font-bold text-primary">{formatEuro(warmmiete)}</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Step 5: Sondervereinbarungen */}
            {step === 5 && (
              <>
                <div className="space-y-2">
                  <Label>Tierhaltung</Label>
                  <Select value={haustiere} onValueChange={setHaustiere}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nicht_erlaubt">Nicht erlaubt (Kleintiere ausgenommen)</SelectItem>
                      <SelectItem value="mit_genehmigung">Mit vorheriger Genehmigung</SelectItem>
                      <SelectItem value="erlaubt">Erlaubt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rauchen in der Wohnung</Label>
                  <Select value={rauchen} onValueChange={setRauchen}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nicht_erlaubt">Nicht erlaubt</SelectItem>
                      <SelectItem value="erlaubt">Erlaubt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Schönheitsreparaturen</Label>
                  <Select value={renovierung} onValueChange={setRenovierung}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mieter">Mieter (mit fachgerechter Ausführung)</SelectItem>
                      <SelectItem value="vermieter">Vermieter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sonstige">Sonstige Vereinbarungen</Label>
                  <Textarea
                    id="sonstige"
                    placeholder="Weitere Vereinbarungen hier eingeben..."
                    value={sonstigeVereinbarungen}
                    onChange={(e) => setSonstigeVereinbarungen(e.target.value)}
                    rows={4}
                  />
                </div>
              </>
            )}

            {/* Step 6: Preview */}
            {step === 6 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Vorschau</Badge>
                  <span className="text-sm text-muted-foreground">Überprüfen Sie den generierten Mietvertrag</span>
                </div>
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

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          {step < 6 ? (
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
