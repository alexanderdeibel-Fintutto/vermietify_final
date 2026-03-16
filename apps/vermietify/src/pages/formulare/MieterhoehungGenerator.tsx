import { useState, useMemo } from "react";
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
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";

type ErhoehungsTyp = "vergleichsmiete" | "modernisierung" | "index";

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

function getZustimmungsfrist(): string {
  const now = new Date();
  let zielMonat = now.getMonth() + 3;
  let zielJahr = now.getFullYear();
  if (zielMonat > 11) {
    zielMonat -= 12;
    zielJahr += 1;
  }
  const letzterTag = new Date(zielJahr, zielMonat, 0);
  return letzterTag.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function MieterhoehungGenerator() {
  const [typ, setTyp] = useState<ErhoehungsTyp>("vergleichsmiete");

  const [vermieterName, setVermieterName] = useState("");
  const [vermieterAdresse, setVermieterAdresse] = useState("");
  const [mieterName, setMieterName] = useState("");
  const [mieterAdresse, setMieterAdresse] = useState("");
  const [objektAdresse, setObjektAdresse] = useState("");
  const [wohnflaeche, setWohnflaeche] = useState("");
  const [aktuelleMiete, setAktuelleMiete] = useState("");
  const [neueMiete, setNeueMiete] = useState("");
  const [begruendung, setBegruendung] = useState("");
  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [angespannterMarkt, setAngespannterMarkt] = useState(false);

  // Vergleichsmiete
  const [mietspiegelBezug, setMietspiegelBezug] = useState("");
  const [mieteVor3Jahren, setMieteVor3Jahren] = useState("");

  // Modernisierung
  const [modernisierungskosten, setModernisierungskosten] = useState("");
  const [wohnungAnteil, setWohnungAnteil] = useState("100");

  // Index
  const [basisIndex, setBasisIndex] = useState("");
  const [aktuellerIndex, setAktuellerIndex] = useState("");

  const [showPreview, setShowPreview] = useState(false);

  // Checklist
  const [checkSchriftform, setCheckSchriftform] = useState(false);
  const [checkBegruendung, setCheckBegruendung] = useState(false);
  const [checkKappungsgrenze, setCheckKappungsgrenze] = useState(false);
  const [checkWartefrist, setCheckWartefrist] = useState(false);

  const flaeche = parseFloat(wohnflaeche) || 0;
  const aktuell = parseFloat(aktuelleMiete) || 0;
  const neu = parseFloat(neueMiete) || 0;
  const kappungsgrenze = angespannterMarkt ? 15 : 20;

  const vergleichsmieteCalc = useMemo(() => {
    if (typ !== "vergleichsmiete") return null;
    const altMiete = parseFloat(mieteVor3Jahren) || aktuell;
    const erhoehungProzent = altMiete > 0 ? ((neu - altMiete) / altMiete) * 100 : 0;
    const kappungOk = erhoehungProzent <= kappungsgrenze;
    return {
      erhoehungAbsolut: neu - aktuell,
      erhoehungProzent,
      kappungOk,
      kappungsgrenze,
    };
  }, [typ, aktuell, neu, mieteVor3Jahren, kappungsgrenze]);

  const modernisierungCalc = useMemo(() => {
    if (typ !== "modernisierung") return null;
    const kosten = parseFloat(modernisierungskosten) || 0;
    const anteil = parseFloat(wohnungAnteil) || 100;
    const kostenAnteil = kosten * (anteil / 100);
    const jaehrlicheUmlage = kostenAnteil * 0.08;
    const monatlicheUmlage = jaehrlicheUmlage / 12;
    const proQm = flaeche > 0 ? monatlicheUmlage / flaeche : 0;
    const aktuellProQm = flaeche > 0 ? aktuell / flaeche : 0;
    const maxProQm = aktuellProQm < 7 ? 2 : 3;
    const maxUmlage = maxProQm * flaeche;
    const effektiveUmlage = Math.min(monatlicheUmlage, maxUmlage);
    return {
      kostenAnteil,
      jaehrlicheUmlage,
      monatlicheUmlage,
      proQm,
      maxProQm,
      maxUmlage,
      effektiveUmlage,
      kappungGreift: monatlicheUmlage > maxUmlage,
    };
  }, [typ, modernisierungskosten, wohnungAnteil, flaeche, aktuell]);

  const indexCalc = useMemo(() => {
    if (typ !== "index") return null;
    const basis = parseFloat(basisIndex) || 0;
    const aktuellIdx = parseFloat(aktuellerIndex) || 0;
    if (basis <= 0) return null;
    const steigerung = ((aktuellIdx - basis) / basis) * 100;
    const neueMieteBerechnet = aktuell * (1 + steigerung / 100);
    return {
      steigerung,
      neueMieteBerechnet,
      erhoehung: neueMieteBerechnet - aktuell,
    };
  }, [typ, basisIndex, aktuellerIndex, aktuell]);

  const zustimmungsfrist = getZustimmungsfrist();

  const generatePreviewText = (): string => {
    let inhalt = "";

    if (typ === "vergleichsmiete") {
      inhalt = `Mieterhöhungsverlangen auf die ortsübliche Vergleichsmiete (§ 558 BGB)

Bezugnahme auf den Mietspiegel:
${mietspiegelBezug || "[Mietspiegel-Bezug angeben]"}

Die aktuelle Nettokaltmiete für die o.g. Wohnung beträgt ${formatEuro(aktuell)}.

Ich verlange Ihre Zustimmung zur Erhöhung der Nettokaltmiete auf ${formatEuro(neu)} ab dem ${zustimmungsfrist}.

Dies entspricht einer Erhöhung um ${formatEuro(neu - aktuell)} (${vergleichsmieteCalc ? vergleichsmieteCalc.erhoehungProzent.toFixed(1) : "0"}% innerhalb von 3 Jahren).
Die Kappungsgrenze von ${kappungsgrenze}% in 3 Jahren${angespannterMarkt ? " (angespannter Wohnungsmarkt)" : ""} wird ${vergleichsmieteCalc?.kappungOk ? "eingehalten" : "ÜBERSCHRITTEN"}.

Begründung:
${begruendung || "[Begründung angeben]"}`;
    } else if (typ === "modernisierung") {
      const effUmlage = modernisierungCalc?.effektiveUmlage ?? 0;
      inhalt = `Mieterhöhung wegen Modernisierung (§ 559 BGB)

Die durchgeführten Modernisierungsmaßnahmen:
${begruendung || "[Beschreibung der Modernisierung]"}

Modernisierungskosten gesamt:       ${formatEuro(parseFloat(modernisierungskosten) || 0)}
Anteil dieser Wohnung (${wohnungAnteil}%):  ${modernisierungCalc ? formatEuro(modernisierungCalc.kostenAnteil) : "0,00 EUR"}
Umlagefähiger Betrag (8% p.a.):     ${modernisierungCalc ? formatEuro(modernisierungCalc.jaehrlicheUmlage) : "0,00 EUR"}
Monatliche Umlage:                  ${modernisierungCalc ? formatEuro(modernisierungCalc.monatlicheUmlage) : "0,00 EUR"}
${modernisierungCalc?.kappungGreift ? `Kappungsgrenze (${modernisierungCalc.maxProQm} EUR/m²): ${formatEuro(modernisierungCalc.maxUmlage)}\nEffektive Umlage:                   ${formatEuro(modernisierungCalc.effektiveUmlage)}` : ""}

Bisherige Nettokaltmiete:           ${formatEuro(aktuell)}
Neue Nettokaltmiete:                ${formatEuro(aktuell + effUmlage)}

Die Mieterhöhung wird ab dem dritten Kalendermonat nach Zugang dieses Schreibens wirksam (§ 559b Abs. 2 BGB).`;
    } else if (typ === "index") {
      inhalt = `Mietanpassung nach Indexklausel (§ 557b BGB)

Gemäß der in unserem Mietvertrag vereinbarten Indexklausel passe ich die Miete wie folgt an:

Basisindex (Verbraucherpreisindex):  ${basisIndex || "[Basiswert]"}
Aktueller Index:                     ${aktuellerIndex || "[aktueller Wert]"}
Indexsteigerung:                     ${indexCalc ? indexCalc.steigerung.toFixed(2) : "0"}%

Bisherige Nettokaltmiete:           ${formatEuro(aktuell)}
Neue Nettokaltmiete:                ${indexCalc ? formatEuro(indexCalc.neueMieteBerechnet) : formatEuro(aktuell)}
Erhöhung:                           ${indexCalc ? formatEuro(indexCalc.erhoehung) : "0,00 EUR"}

Die neue Miete ist ab dem Beginn des übernächsten Monats nach Zugang dieses Schreibens zu entrichten.`;
    }

    return `${vermieterName || "___________"}
${vermieterAdresse || "___________"}

${mieterName || "___________"}
${mieterAdresse || "___________"}

${formatDate(datum)}

Betreff: Mieterhöhungsverlangen
Mietobjekt: ${objektAdresse || "___________"}
Wohnfläche: ${wohnflaeche || "___"} m²

Sehr geehrte/r ${mieterName || "___________"},

${inhalt}

Ich bitte Sie, Ihre Zustimmung zur Mieterhöhung bis spätestens ${zustimmungsfrist} (Ende des übernächsten Monats nach Zugang) schriftlich zu erklären.

Sollten Sie der Mieterhöhung nicht zustimmen, bin ich berechtigt, innerhalb von drei weiteren Monaten Klage auf Zustimmung zu erheben (§ 558b Abs. 2 BGB).

Mit freundlichen Grüßen


____________________________
${vermieterName || "___________"}`;
  };

  return (
    <MainLayout
      title="Mieterhöhung Generator"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Mieterhöhung Generator" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Mieterhöhung Generator"
          subtitle="Erstellen Sie ein formell korrektes Mieterhöhungsverlangen mit automatischer Kappungsgrenzen-Prüfung."
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
          <div className="lg:col-span-2 space-y-6">
            {/* Erhöhungstyp */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Art der Mieterhöhung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={typ} onValueChange={(v) => setTyp(v as ErhoehungsTyp)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vergleichsmiete">Vergleichsmiete (§ 558 BGB)</SelectItem>
                    <SelectItem value="modernisierung">Modernisierung (§ 559 BGB)</SelectItem>
                    <SelectItem value="index">Indexmiete (§ 557b BGB)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Badge variant={typ === "vergleichsmiete" ? "default" : "outline"}>
                    § 558
                  </Badge>
                  <Badge variant={typ === "modernisierung" ? "default" : "outline"}>
                    § 559
                  </Badge>
                  <Badge variant={typ === "index" ? "default" : "outline"}>
                    § 557b
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Parteien */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vertragsparteien</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Vermieter</h4>
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={vermieterName}
                        onChange={(e) => setVermieterName(e.target.value)}
                        placeholder="Max Mustermann"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Adresse *</Label>
                      <Textarea
                        value={vermieterAdresse}
                        onChange={(e) => setVermieterAdresse(e.target.value)}
                        rows={2}
                        placeholder="Musterstraße 1, 10115 Berlin"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Mieter</h4>
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={mieterName}
                        onChange={(e) => setMieterName(e.target.value)}
                        placeholder="Maria Musterfrau"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Adresse *</Label>
                      <Textarea
                        value={mieterAdresse}
                        onChange={(e) => setMieterAdresse(e.target.value)}
                        rows={2}
                        placeholder="Beispielweg 5, 80331 München"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mietobjekt & Miete */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mietobjekt & aktuelle Miete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mietobjekt *</Label>
                  <Input
                    value={objektAdresse}
                    onChange={(e) => setObjektAdresse(e.target.value)}
                    placeholder="Hauptstraße 10, Whg. 3, 10115 Berlin"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Wohnfläche (m²)</Label>
                    <Input
                      type="number"
                      value={wohnflaeche}
                      onChange={(e) => setWohnflaeche(e.target.value)}
                      placeholder="65"
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Aktuelle Nettokaltmiete (EUR)</Label>
                    <Input
                      type="number"
                      value={aktuelleMiete}
                      onChange={(e) => setAktuelleMiete(e.target.value)}
                      placeholder="650.00"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Datum</Label>
                    <Input
                      type="date"
                      value={datum}
                      onChange={(e) => setDatum(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vergleichsmiete */}
            {typ === "vergleichsmiete" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vergleichsmiete (§ 558)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Neue Nettokaltmiete (EUR) *</Label>
                      <Input
                        type="number"
                        value={neueMiete}
                        onChange={(e) => setNeueMiete(e.target.value)}
                        placeholder="720.00"
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Miete vor 3 Jahren (EUR)</Label>
                      <Input
                        type="number"
                        value={mieteVor3Jahren}
                        onChange={(e) => setMieteVor3Jahren(e.target.value)}
                        placeholder="600.00"
                        min={0}
                        step={0.01}
                      />
                      <p className="text-xs text-muted-foreground">
                        Für Kappungsgrenzen-Berechnung (leer = aktuelle Miete)
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Bezug auf Mietspiegel *</Label>
                    <Textarea
                      value={mietspiegelBezug}
                      onChange={(e) => setMietspiegelBezug(e.target.value)}
                      rows={2}
                      placeholder="Berliner Mietspiegel 2024, Feld K3, mittlere Wohnlage..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="angespannterMarkt"
                      checked={angespannterMarkt}
                      onCheckedChange={(v) => setAngespannterMarkt(v === true)}
                    />
                    <Label htmlFor="angespannterMarkt" className="text-sm">
                      Angespannter Wohnungsmarkt (Kappungsgrenze 15% statt 20%)
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Begründung *</Label>
                    <Textarea
                      value={begruendung}
                      onChange={(e) => setBegruendung(e.target.value)}
                      rows={3}
                      placeholder="Die verlangte Miete liegt innerhalb der ortsüblichen Vergleichsmiete..."
                    />
                  </div>

                  {vergleichsmieteCalc && neu > 0 && (
                    <div
                      className={`rounded-lg p-4 text-sm ${
                        vergleichsmieteCalc.kappungOk
                          ? "bg-green-50 border-green-200 border"
                          : "bg-red-50 border-red-200 border"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {vergleichsmieteCalc.kappungOk ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <span className="font-medium">
                          Kappungsgrenze ({vergleichsmieteCalc.kappungsgrenze}% in 3 Jahren):
                          {vergleichsmieteCalc.kappungOk ? " Eingehalten" : " Überschritten!"}
                        </span>
                      </div>
                      <p>
                        Erhöhung: {formatEuro(vergleichsmieteCalc.erhoehungAbsolut)} (
                        {vergleichsmieteCalc.erhoehungProzent.toFixed(1)}%)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Modernisierung */}
            {typ === "modernisierung" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Modernisierung (§ 559)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Modernisierungskosten gesamt (EUR) *</Label>
                      <Input
                        type="number"
                        value={modernisierungskosten}
                        onChange={(e) => setModernisierungskosten(e.target.value)}
                        placeholder="25000"
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Anteil dieser Wohnung (%)</Label>
                      <Input
                        type="number"
                        value={wohnungAnteil}
                        onChange={(e) => setWohnungAnteil(e.target.value)}
                        placeholder="100"
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Beschreibung der Modernisierung *</Label>
                    <Textarea
                      value={begruendung}
                      onChange={(e) => setBegruendung(e.target.value)}
                      rows={3}
                      placeholder="Einbau einer neuen Heizungsanlage, Wärmedämmung der Fassade..."
                    />
                  </div>

                  {modernisierungCalc && (
                    <div className="border rounded-lg p-4 space-y-2 text-sm">
                      <p className="font-medium mb-2">Berechnung der Modernisierungsumlage</p>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Kostenanteil Wohnung:</span>
                        <span className="text-right">
                          {formatEuro(modernisierungCalc.kostenAnteil)}
                        </span>
                        <span className="text-muted-foreground">8% Umlage p.a.:</span>
                        <span className="text-right">
                          {formatEuro(modernisierungCalc.jaehrlicheUmlage)}
                        </span>
                        <span className="text-muted-foreground">Monatliche Umlage:</span>
                        <span className="text-right font-medium">
                          {formatEuro(modernisierungCalc.monatlicheUmlage)}
                        </span>
                        <span className="text-muted-foreground">Pro m²:</span>
                        <span className="text-right">
                          {modernisierungCalc.proQm.toFixed(2)} EUR/m²
                        </span>
                      </div>
                      {modernisierungCalc.kappungGreift && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span className="font-medium text-amber-800">
                              Kappungsgrenze greift: max. {modernisierungCalc.maxProQm} EUR/m² ={" "}
                              {formatEuro(modernisierungCalc.maxUmlage)}/Monat
                            </span>
                          </div>
                          <p className="text-amber-700 mt-1">
                            Effektive Umlage: {formatEuro(modernisierungCalc.effektiveUmlage)}
                            /Monat
                          </p>
                        </div>
                      )}
                      <div className="border-t pt-2 mt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-muted-foreground">Bisherige Miete:</span>
                          <span className="text-right">{formatEuro(aktuell)}</span>
                          <span className="font-medium">Neue Miete:</span>
                          <span className="text-right font-bold text-primary">
                            {formatEuro(aktuell + modernisierungCalc.effektiveUmlage)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground">
                    <strong>§ 559 BGB Kappungsgrenzen:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>
                        Miete unter 7 EUR/m²: max. Erhöhung um 2 EUR/m² innerhalb von 6 Jahren
                      </li>
                      <li>
                        Miete ab 7 EUR/m²: max. Erhöhung um 3 EUR/m² innerhalb von 6 Jahren
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Index */}
            {typ === "index" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Indexmiete (§ 557b)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Basis-Verbraucherpreisindex *</Label>
                      <Input
                        type="number"
                        value={basisIndex}
                        onChange={(e) => setBasisIndex(e.target.value)}
                        placeholder="z.B. 111.1"
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground">
                        Index bei Mietbeginn oder letzter Anpassung
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Aktueller Verbraucherpreisindex *</Label>
                      <Input
                        type="number"
                        value={aktuellerIndex}
                        onChange={(e) => setAktuellerIndex(e.target.value)}
                        placeholder="z.B. 120.3"
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground">
                        Aktueller VPI laut Statistischem Bundesamt
                      </p>
                    </div>
                  </div>

                  {indexCalc && (
                    <div className="border rounded-lg p-4 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Indexsteigerung:</span>
                        <span className="text-right font-medium">
                          {indexCalc.steigerung.toFixed(2)}%
                        </span>
                        <span className="text-muted-foreground">Bisherige Miete:</span>
                        <span className="text-right">{formatEuro(aktuell)}</span>
                        <span className="font-medium">Neue Miete:</span>
                        <span className="text-right font-bold text-primary">
                          {formatEuro(indexCalc.neueMieteBerechnet)}
                        </span>
                        <span className="text-muted-foreground">Erhöhung:</span>
                        <span className="text-right font-medium">
                          {formatEuro(indexCalc.erhoehung)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground">
                    <strong>Hinweis:</strong> Bei einer Indexmietvereinbarung ist die Miete an den
                    Verbraucherpreisindex gekoppelt. Die Anpassung muss in Textform erklärt werden
                    und ist frühestens ein Jahr nach der letzten Anpassung möglich.
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={() => setShowPreview(true)}
              className="w-full gap-2"
              size="lg"
            >
              <Eye className="h-4 w-4" />
              Vorschau generieren
            </Button>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Zustimmungsfrist</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  Der Mieter hat bis zum Ende des übernächsten Monats nach Zugang Zeit, der
                  Mieterhöhung zuzustimmen.
                </p>
                <Badge variant="default" className="text-sm">
                  {zustimmungsfrist}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Formale Anforderungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="c1"
                    checked={checkSchriftform}
                    onCheckedChange={(v) => setCheckSchriftform(v === true)}
                  />
                  <Label htmlFor="c1" className="text-sm">
                    Schriftform (Textform genügt)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="c2"
                    checked={checkBegruendung}
                    onCheckedChange={(v) => setCheckBegruendung(v === true)}
                  />
                  <Label htmlFor="c2" className="text-sm">
                    Begründung beigefügt
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="c3"
                    checked={checkKappungsgrenze}
                    onCheckedChange={(v) => setCheckKappungsgrenze(v === true)}
                  />
                  <Label htmlFor="c3" className="text-sm">
                    Kappungsgrenze eingehalten
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="c4"
                    checked={checkWartefrist}
                    onCheckedChange={(v) => setCheckWartefrist(v === true)}
                  />
                  <Label htmlFor="c4" className="text-sm">
                    15-Monats-Wartefrist beachtet
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>
                    <strong>§ 558 BGB:</strong> Zustimmung zur Mieterhöhung bis zur ortsüblichen
                    Vergleichsmiete. Kappungsgrenze: max. 20% (15% in angespannten Märkten) in 3
                    Jahren.
                  </p>
                  <p>
                    <strong>§ 559 BGB:</strong> Modernisierungsumlage: 8% der Kosten p.a.
                    Kappungsgrenze: 2 EUR/m² (bei Miete unter 7 EUR/m²) bzw. 3 EUR/m².
                  </p>
                  <p>
                    <strong>§ 557b BGB:</strong> Indexmiete: Anpassung an Verbraucherpreisindex
                    (VPI). Muss im Mietvertrag vereinbart sein.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-primary" />
                Vorschau - Mieterhöhungsverlangen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white border rounded-lg p-8 font-mono text-sm whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                {generatePreviewText()}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    alert(
                      "PDF-Download wird in einer zukünftigen Version verfügbar sein."
                    )
                  }
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Als PDF herunterladen
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigator.clipboard.writeText(generatePreviewText())
                  }
                  className="gap-2"
                >
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
