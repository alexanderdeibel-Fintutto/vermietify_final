import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Calculator,
  Info,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Home,
} from "lucide-react";
import { Link } from "react-router-dom";

interface MietspiegelEntry {
  stadt: string;
  vergleichsmiete: number;
  mietpreisbremseAktiv: boolean;
}

const MIETSPIEGEL_DATA: MietspiegelEntry[] = [
  { stadt: "Berlin", vergleichsmiete: 8.5, mietpreisbremseAktiv: true },
  { stadt: "München", vergleichsmiete: 12.8, mietpreisbremseAktiv: true },
  { stadt: "Hamburg", vergleichsmiete: 9.2, mietpreisbremseAktiv: true },
  { stadt: "Frankfurt", vergleichsmiete: 10.5, mietpreisbremseAktiv: true },
  { stadt: "Köln", vergleichsmiete: 8.9, mietpreisbremseAktiv: true },
  { stadt: "Stuttgart", vergleichsmiete: 10.2, mietpreisbremseAktiv: true },
];

const AUSSTATTUNG_FAKTOREN: Record<string, number> = {
  einfach: 0.85,
  standard: 1.0,
  gehoben: 1.2,
};

const BAUJAHR_FAKTOREN: Record<string, number> = {
  vor1950: 0.9,
  "1950-1979": 0.95,
  "1980-1999": 1.0,
  "2000-2013": 1.05,
  ab2014: 1.1,
};

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export default function MietpreisBremsechecker() {
  const [stadt, setStadt] = useState("");
  const [wohnflaeche, setWohnflaeche] = useState("");
  const [baujahr, setBaujahr] = useState("");
  const [ausstattung, setAusstattung] = useState("");
  const [aktuelleMieteProQm, setAktuelleMieteProQm] = useState("");
  const [showResult, setShowResult] = useState(false);

  const selectedStadt = MIETSPIEGEL_DATA.find((m) => m.stadt === stadt);

  const calculation = useMemo(() => {
    if (!selectedStadt || !wohnflaeche || !baujahr || !ausstattung || !aktuelleMieteProQm) {
      return null;
    }

    const flaeche = parseFloat(wohnflaeche);
    const mieteProQm = parseFloat(aktuelleMieteProQm);
    if (isNaN(flaeche) || isNaN(mieteProQm) || flaeche <= 0) return null;

    const basisMiete = selectedStadt.vergleichsmiete;
    const ausstattungFaktor = AUSSTATTUNG_FAKTOREN[ausstattung] ?? 1.0;
    const baujahrFaktor = BAUJAHR_FAKTOREN[baujahr] ?? 1.0;

    const ortsueblicheVergleichsmiete = basisMiete * ausstattungFaktor * baujahrFaktor;
    const maxZulaessigProQm = ortsueblicheVergleichsmiete * 1.1;
    const differenzProQm = mieteProQm - maxZulaessigProQm;
    const differenzGesamt = differenzProQm * flaeche;

    const istNeubauAb2014 = baujahr === "ab2014";

    let status: "greift" | "ok" | "nicht_anwendbar";
    if (!selectedStadt.mietpreisbremseAktiv) {
      status = "nicht_anwendbar";
    } else if (istNeubauAb2014) {
      status = "nicht_anwendbar";
    } else if (mieteProQm > maxZulaessigProQm) {
      status = "greift";
    } else {
      status = "ok";
    }

    return {
      ortsueblicheVergleichsmiete,
      maxZulaessigProQm,
      aktuellProQm: mieteProQm,
      differenzProQm,
      differenzGesamt,
      gesamtMiete: mieteProQm * flaeche,
      maxGesamtMiete: maxZulaessigProQm * flaeche,
      status,
      istNeubauAb2014,
    };
  }, [selectedStadt, wohnflaeche, baujahr, ausstattung, aktuelleMieteProQm]);

  const handleCheck = () => {
    if (calculation) setShowResult(true);
  };

  return (
    <MainLayout
      title="Mietpreisbremse-Checker"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Mietpreisbremse-Checker" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Mietpreisbremse-Checker"
          subtitle="Prüfen Sie, ob Ihre Miete die zulässige Obergrenze nach § 556d BGB überschreitet."
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-5 w-5 text-primary" />
                  Angaben zur Wohnung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Stadt</Label>
                    <Select value={stadt} onValueChange={setStadt}>
                      <SelectTrigger>
                        <SelectValue placeholder="Stadt auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {MIETSPIEGEL_DATA.map((m) => (
                          <SelectItem key={m.stadt} value={m.stadt}>
                            {m.stadt} (Mietspiegel: {m.vergleichsmiete.toFixed(2)} EUR/m²)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wohnflaeche">Wohnfläche (m²)</Label>
                    <Input
                      id="wohnflaeche"
                      type="number"
                      placeholder="z.B. 65"
                      value={wohnflaeche}
                      onChange={(e) => setWohnflaeche(e.target.value)}
                      min={1}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Baujahr</Label>
                    <Select value={baujahr} onValueChange={setBaujahr}>
                      <SelectTrigger>
                        <SelectValue placeholder="Baujahr auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vor1950">Vor 1950</SelectItem>
                        <SelectItem value="1950-1979">1950 - 1979</SelectItem>
                        <SelectItem value="1980-1999">1980 - 1999</SelectItem>
                        <SelectItem value="2000-2013">2000 - 2013</SelectItem>
                        <SelectItem value="ab2014">Ab 2014 (Neubau)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ausstattung</Label>
                    <Select value={ausstattung} onValueChange={setAusstattung}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ausstattung auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="einfach">Einfach</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="gehoben">Gehoben</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aktuelleMiete">Aktuelle Kaltmiete pro m²</Label>
                  <Input
                    id="aktuelleMiete"
                    type="number"
                    placeholder="z.B. 11.50"
                    value={aktuelleMieteProQm}
                    onChange={(e) => setAktuelleMieteProQm(e.target.value)}
                    min={0}
                    step={0.01}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleCheck} className="w-full gap-2" size="lg" disabled={!calculation}>
              <Calculator className="h-4 w-4" />
              Mietpreisbremse prüfen
            </Button>

            {showResult && calculation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {calculation.status === "greift" && (
                      <>
                        <ShieldAlert className="h-5 w-5 text-destructive" />
                        Ergebnis der Prüfung
                      </>
                    )}
                    {calculation.status === "ok" && (
                      <>
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        Ergebnis der Prüfung
                      </>
                    )}
                    {calculation.status === "nicht_anwendbar" && (
                      <>
                        <ShieldQuestion className="h-5 w-5 text-muted-foreground" />
                        Ergebnis der Prüfung
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    {calculation.status === "greift" && (
                      <Badge variant="destructive" className="text-base px-4 py-2">
                        Mietpreisbremse greift!
                      </Badge>
                    )}
                    {calculation.status === "ok" && (
                      <Badge className="bg-green-600 text-white text-base px-4 py-2">
                        Miete im Rahmen
                      </Badge>
                    )}
                    {calculation.status === "nicht_anwendbar" && (
                      <Badge variant="secondary" className="text-base px-4 py-2">
                        Mietpreisbremse gilt nicht in diesem Fall
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm border rounded-lg p-4">
                    <span className="text-muted-foreground">Ortsübliche Vergleichsmiete:</span>
                    <span className="text-right font-medium">
                      {calculation.ortsueblicheVergleichsmiete.toFixed(2)} EUR/m²
                    </span>
                    <span className="text-muted-foreground">Max. zulässige Miete (+10%):</span>
                    <span className="text-right font-medium">
                      {calculation.maxZulaessigProQm.toFixed(2)} EUR/m²
                    </span>
                    <span className="text-muted-foreground">Ihre aktuelle Miete:</span>
                    <span className="text-right font-medium">
                      {calculation.aktuellProQm.toFixed(2)} EUR/m²
                    </span>
                    <hr className="col-span-2" />
                    <span className="text-muted-foreground">Max. zulässige Gesamtmiete:</span>
                    <span className="text-right font-medium">
                      {formatEuro(calculation.maxGesamtMiete)}
                    </span>
                    <span className="text-muted-foreground">Ihre Gesamtmiete:</span>
                    <span className="text-right font-medium">
                      {formatEuro(calculation.gesamtMiete)}
                    </span>
                    {calculation.status === "greift" && (
                      <>
                        <hr className="col-span-2" />
                        <span className="font-semibold text-destructive">Überhöhung pro m²:</span>
                        <span className="text-right font-bold text-destructive">
                          {calculation.differenzProQm.toFixed(2)} EUR/m²
                        </span>
                        <span className="font-semibold text-destructive">Überhöhung gesamt:</span>
                        <span className="text-right font-bold text-destructive">
                          {formatEuro(calculation.differenzGesamt)} /Monat
                        </span>
                      </>
                    )}
                  </div>

                  {calculation.istNeubauAb2014 && (
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                      <strong>Hinweis:</strong> Neubauten ab dem 01.10.2014 sind von der
                      Mietpreisbremse ausgenommen (§ 556f S. 1 BGB).
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {selectedStadt && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Mietspiegel {selectedStadt.stadt}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vergleichsmiete:</span>
                    <span className="font-medium">{selectedStadt.vergleichsmiete.toFixed(2)} EUR/m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mietpreisbremse:</span>
                    <Badge variant={selectedStadt.mietpreisbremseAktiv ? "default" : "secondary"}>
                      {selectedStadt.mietpreisbremseAktiv ? "Aktiv" : "Nicht aktiv"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-muted/50">
              <CardContent className="p-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>
                    <strong>§ 556d BGB - Mietpreisbremse:</strong> Bei Wiedervermietung darf die
                    Miete höchstens 10% über der ortsüblichen Vergleichsmiete liegen.
                  </p>
                  <p>
                    <strong>Voraussetzung:</strong> Die Landesregierung muss das Gebiet per
                    Rechtsverordnung als angespannten Wohnungsmarkt ausgewiesen haben.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">Ausnahmen von der Mietpreisbremse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong>1. Neubau ab 01.10.2014:</strong> Erstmalig genutzte und vermietete
                  Wohnungen sind ausgenommen (§ 556f S. 1 BGB).
                </p>
                <p>
                  <strong>2. Umfassende Modernisierung:</strong> Nach umfassender Modernisierung
                  gilt die erste Vermietung als Neuvermietung (§ 556f S. 2 BGB).
                </p>
                <p>
                  <strong>3. Vormieterhöhe:</strong> War die Vormiete bereits höher als die
                  zulässige Miete, darf die gleiche Miete weiter verlangt werden (§ 556e BGB).
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4 text-xs text-muted-foreground">
                <strong>Hinweis:</strong> Die angezeigten Mietspiegel-Werte sind vereinfachte
                Durchschnittswerte. Für eine verbindliche Auskunft konsultieren Sie den
                qualifizierten Mietspiegel Ihrer Stadt oder einen Fachanwalt für Mietrecht.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
