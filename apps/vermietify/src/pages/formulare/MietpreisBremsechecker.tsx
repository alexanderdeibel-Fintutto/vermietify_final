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
  Scale,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  MapPin,
  Building2,
  Euro,
} from "lucide-react";
import { Link } from "react-router-dom";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

interface MietspiegelData {
  stadt: string;
  plzBereiche: string[];
  mietpreisbremseAktiv: boolean;
  vergleichsmiete: Record<string, Record<string, number>>;
}

const MIETSPIEGEL_DATA: MietspiegelData[] = [
  {
    stadt: "Berlin",
    plzBereiche: ["10115", "10117", "10119", "10178", "10179", "10243", "10245", "10247", "10249", "10315", "10317", "10405", "10407", "10435", "10437", "10551", "10553", "10555", "10557", "10585", "10587", "10589", "10623", "10625", "10627", "10629", "10707", "10709", "10711", "10713", "10715", "10717", "10719", "10777", "10779", "10781", "10783", "10785", "10787", "10789", "10823", "10825", "10827", "10829", "10961", "10963", "10965", "10967", "10969", "10997", "10999", "12043", "12045", "12047", "12049", "12051", "12053", "12055", "12099", "12101", "12103", "12105", "12107", "12157", "12159", "12161", "12163", "12165", "12167", "12203", "12205", "12207", "12209", "12247", "12249", "12277", "12305", "12347", "12349", "12351", "12353", "13051", "13053", "13055", "13086", "13088", "13125", "13127", "13156", "13158", "13187", "13189", "14050"],
    mietpreisbremseAktiv: true,
    vergleichsmiete: {
      "vor1949": { standard: 7.20, gehoben: 9.10, luxus: 12.50 },
      "1949-1978": { standard: 6.80, gehoben: 8.50, luxus: 11.80 },
      "1979-1990": { standard: 7.50, gehoben: 9.30, luxus: 12.00 },
      "1991-2002": { standard: 8.20, gehoben: 10.10, luxus: 13.50 },
      "2003-2013": { standard: 9.50, gehoben: 11.80, luxus: 15.00 },
      "nach2014": { standard: 11.00, gehoben: 13.50, luxus: 17.00 },
    },
  },
  {
    stadt: "München",
    plzBereiche: ["80331", "80333", "80335", "80336", "80337", "80339", "80469", "80538", "80539", "80634", "80636", "80637", "80638", "80639", "80686", "80687", "80689", "80796", "80797", "80798", "80799", "80801", "80802", "80803", "80804", "80805", "80807", "80809", "80933", "80935", "80937", "80992", "80993", "80995", "81241", "81243", "81245", "81247", "81369", "81371", "81373", "81375", "81377", "81475", "81477", "81539", "81541", "81543", "81545", "81547", "81667", "81669", "81671", "81673", "81675", "81735", "81737", "81825", "81827"],
    mietpreisbremseAktiv: true,
    vergleichsmiete: {
      "vor1949": { standard: 11.50, gehoben: 14.20, luxus: 19.00 },
      "1949-1978": { standard: 10.80, gehoben: 13.50, luxus: 18.00 },
      "1979-1990": { standard: 11.80, gehoben: 14.50, luxus: 18.50 },
      "1991-2002": { standard: 12.50, gehoben: 15.80, luxus: 20.00 },
      "2003-2013": { standard: 14.00, gehoben: 17.50, luxus: 22.00 },
      "nach2014": { standard: 16.00, gehoben: 19.50, luxus: 25.00 },
    },
  },
  {
    stadt: "Hamburg",
    plzBereiche: ["20095", "20097", "20099", "20144", "20146", "20148", "20149", "20249", "20251", "20253", "20255", "20257", "20259", "20354", "20355", "20357", "20359", "20457", "20459", "20535", "20537", "22041", "22043", "22045", "22047", "22049", "22081", "22083", "22085", "22087", "22089", "22111", "22113", "22115", "22143", "22145", "22175", "22177"],
    mietpreisbremseAktiv: true,
    vergleichsmiete: {
      "vor1949": { standard: 8.50, gehoben: 10.80, luxus: 14.50 },
      "1949-1978": { standard: 8.00, gehoben: 10.20, luxus: 13.50 },
      "1979-1990": { standard: 8.80, gehoben: 11.00, luxus: 14.00 },
      "1991-2002": { standard: 9.50, gehoben: 12.00, luxus: 15.50 },
      "2003-2013": { standard: 11.00, gehoben: 13.80, luxus: 17.00 },
      "nach2014": { standard: 12.50, gehoben: 15.50, luxus: 19.50 },
    },
  },
  {
    stadt: "Frankfurt am Main",
    plzBereiche: ["60306", "60308", "60310", "60311", "60313", "60314", "60316", "60318", "60320", "60322", "60323", "60325", "60326", "60327", "60329", "60385", "60386", "60431", "60433", "60435", "60437", "60486", "60487", "60488", "60489", "60528", "60529", "60594", "60596", "60598", "60599"],
    mietpreisbremseAktiv: true,
    vergleichsmiete: {
      "vor1949": { standard: 9.80, gehoben: 12.50, luxus: 16.50 },
      "1949-1978": { standard: 9.20, gehoben: 11.80, luxus: 15.50 },
      "1979-1990": { standard: 10.00, gehoben: 12.80, luxus: 16.00 },
      "1991-2002": { standard: 11.00, gehoben: 13.80, luxus: 17.50 },
      "2003-2013": { standard: 12.50, gehoben: 15.50, luxus: 19.50 },
      "nach2014": { standard: 14.50, gehoben: 17.50, luxus: 22.00 },
    },
  },
  {
    stadt: "Köln",
    plzBereiche: ["50667", "50668", "50670", "50672", "50674", "50676", "50677", "50678", "50679", "50733", "50735", "50737", "50823", "50825", "50827", "50829", "50931", "50933", "50935", "50937", "50939", "50968", "50969", "51061", "51063", "51065", "51103", "51105"],
    mietpreisbremseAktiv: true,
    vergleichsmiete: {
      "vor1949": { standard: 8.20, gehoben: 10.50, luxus: 14.00 },
      "1949-1978": { standard: 7.80, gehoben: 9.80, luxus: 13.00 },
      "1979-1990": { standard: 8.50, gehoben: 10.80, luxus: 13.50 },
      "1991-2002": { standard: 9.20, gehoben: 11.50, luxus: 14.80 },
      "2003-2013": { standard: 10.50, gehoben: 13.00, luxus: 16.50 },
      "nach2014": { standard: 12.00, gehoben: 14.80, luxus: 18.50 },
    },
  },
  {
    stadt: "Düsseldorf",
    plzBereiche: ["40210", "40211", "40212", "40213", "40215", "40217", "40219", "40221", "40223", "40225", "40227", "40229", "40231", "40233", "40235", "40237", "40239"],
    mietpreisbremseAktiv: true,
    vergleichsmiete: {
      "vor1949": { standard: 8.80, gehoben: 11.20, luxus: 15.00 },
      "1949-1978": { standard: 8.30, gehoben: 10.50, luxus: 14.00 },
      "1979-1990": { standard: 9.00, gehoben: 11.50, luxus: 14.50 },
      "1991-2002": { standard: 9.80, gehoben: 12.30, luxus: 15.80 },
      "2003-2013": { standard: 11.20, gehoben: 14.00, luxus: 17.50 },
      "nach2014": { standard: 13.00, gehoben: 16.00, luxus: 20.00 },
    },
  },
  {
    stadt: "Stuttgart",
    plzBereiche: ["70173", "70174", "70176", "70178", "70180", "70182", "70184", "70186", "70188", "70190", "70191", "70192", "70193", "70195", "70197", "70199", "70327", "70329", "70372", "70374", "70376", "70435", "70437", "70469", "70499", "70563", "70565", "70567", "70597", "70599", "70619", "70629"],
    mietpreisbremseAktiv: true,
    vergleichsmiete: {
      "vor1949": { standard: 9.50, gehoben: 12.00, luxus: 16.00 },
      "1949-1978": { standard: 8.80, gehoben: 11.20, luxus: 15.00 },
      "1979-1990": { standard: 9.80, gehoben: 12.20, luxus: 15.50 },
      "1991-2002": { standard: 10.50, gehoben: 13.20, luxus: 17.00 },
      "2003-2013": { standard: 12.00, gehoben: 15.00, luxus: 19.00 },
      "nach2014": { standard: 14.00, gehoben: 17.00, luxus: 21.50 },
    },
  },
];

const MIETPREISBREMSE_STAEDTE = MIETSPIEGEL_DATA.filter((d) => d.mietpreisbremseAktiv).map((d) => d.stadt);

function getBaujahrsKategorie(baujahr: number): string {
  if (baujahr < 1949) return "vor1949";
  if (baujahr <= 1978) return "1949-1978";
  if (baujahr <= 1990) return "1979-1990";
  if (baujahr <= 2002) return "1991-2002";
  if (baujahr <= 2013) return "2003-2013";
  return "nach2014";
}

function getBaujahrsLabel(key: string): string {
  const labels: Record<string, string> = {
    "vor1949": "vor 1949",
    "1949-1978": "1949\u20131978",
    "1979-1990": "1979\u20131990",
    "1991-2002": "1991\u20132002",
    "2003-2013": "2003\u20132013",
    "nach2014": "ab 2014 (Neubau)",
  };
  return labels[key] || key;
}

export default function MietpreisBremsechecker() {
  const [plz, setPlz] = useState("");
  const [stadt, setStadt] = useState("");
  const [wohnflaeche, setWohnflaeche] = useState(0);
  const [baujahr, setBaujahr] = useState(0);
  const [ausstattung, setAusstattung] = useState("standard");
  const [aktuelleMieteProQm, setAktuelleMieteProQm] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stadtData = useMemo(() => {
    const byPlz = MIETSPIEGEL_DATA.find((d) => d.plzBereiche.includes(plz));
    if (byPlz) return byPlz;
    return MIETSPIEGEL_DATA.find((d) => d.stadt.toLowerCase() === stadt.toLowerCase()) || null;
  }, [plz, stadt]);

  const result = useMemo(() => {
    if (!stadtData || !baujahr || !wohnflaeche || !aktuelleMieteProQm) return null;

    const kategorie = getBaujahrsKategorie(baujahr);
    const vergleichsmieteProQm = stadtData.vergleichsmiete[kategorie]?.[ausstattung] || 0;
    const maxZulaessigProQm = vergleichsmieteProQm * 1.10;
    const differenzProQm = aktuelleMieteProQm - maxZulaessigProQm;
    const differenzGesamt = differenzProQm * wohnflaeche;
    const istUeberhoeht = aktuelleMieteProQm > maxZulaessigProQm;
    const isNeubau = baujahr >= 2014;

    return {
      vergleichsmieteProQm,
      maxZulaessigProQm,
      differenzProQm,
      differenzGesamt,
      istUeberhoeht,
      mietpreisbremseAktiv: stadtData.mietpreisbremseAktiv,
      kategorie,
      isNeubau,
      vergleichsmieteGesamt: vergleichsmieteProQm * wohnflaeche,
      maxZulaessigGesamt: maxZulaessigProQm * wohnflaeche,
      aktuelleMieteGesamt: aktuelleMieteProQm * wohnflaeche,
    };
  }, [stadtData, baujahr, wohnflaeche, aktuelleMieteProQm, ausstattung]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!plz.trim() && !stadt.trim()) newErrors.plz = "PLZ oder Stadt ist erforderlich";
    if (wohnflaeche <= 0) newErrors.wohnflaeche = "Wohnfläche muss größer als 0 sein";
    if (baujahr <= 0 || baujahr > new Date().getFullYear()) newErrors.baujahr = "Gültiges Baujahr eingeben";
    if (aktuelleMieteProQm <= 0) newErrors.aktuelleMieteProQm = "Aktuelle Miete pro m\u00B2 eingeben";
    if (!stadtData) newErrors.plz = "Keine Mietspiegeldaten für diese PLZ/Stadt verfügbar";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheck = () => {
    if (validate()) setHasChecked(true);
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
          subtitle="Prüfen Sie, ob die Mietpreisbremse bei Ihrem Mietobjekt greift und ob die aktuelle Miete zulässig ist."
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
          {/* Input Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5 text-primary" />
                  Mietobjekt-Daten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plz">Postleitzahl</Label>
                    <Input
                      id="plz"
                      placeholder="z.B. 10115"
                      value={plz}
                      onChange={(e) => { setPlz(e.target.value); setHasChecked(false); }}
                      maxLength={5}
                    />
                    {errors.plz && <p className="text-sm text-destructive">{errors.plz}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Stadt</Label>
                    <Select value={stadt} onValueChange={(v) => { setStadt(v); setHasChecked(false); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Stadt wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {MIETSPIEGEL_DATA.map((d) => (
                          <SelectItem key={d.stadt} value={d.stadt}>{d.stadt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="wohnflaeche">Wohnfläche (m²)</Label>
                    <Input
                      id="wohnflaeche"
                      type="number"
                      value={wohnflaeche || ""}
                      onChange={(e) => { setWohnflaeche(Number(e.target.value)); setHasChecked(false); }}
                      min={0}
                    />
                    {errors.wohnflaeche && <p className="text-sm text-destructive">{errors.wohnflaeche}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baujahr">Baujahr</Label>
                    <Input
                      id="baujahr"
                      type="number"
                      value={baujahr || ""}
                      onChange={(e) => { setBaujahr(Number(e.target.value)); setHasChecked(false); }}
                      min={1800}
                      max={new Date().getFullYear()}
                      placeholder="z.B. 1975"
                    />
                    {errors.baujahr && <p className="text-sm text-destructive">{errors.baujahr}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Ausstattung</Label>
                    <Select value={ausstattung} onValueChange={(v) => { setAusstattung(v); setHasChecked(false); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="gehoben">Gehoben</SelectItem>
                        <SelectItem value="luxus">Luxus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aktuelleMieteProQm">Aktuelle Kaltmiete pro m² (EUR)</Label>
                  <Input
                    id="aktuelleMieteProQm"
                    type="number"
                    value={aktuelleMieteProQm || ""}
                    onChange={(e) => { setAktuelleMieteProQm(Number(e.target.value)); setHasChecked(false); }}
                    min={0}
                    step={0.1}
                    placeholder="z.B. 12.50"
                  />
                  {errors.aktuelleMieteProQm && <p className="text-sm text-destructive">{errors.aktuelleMieteProQm}</p>}
                  {wohnflaeche > 0 && aktuelleMieteProQm > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Gesamtmiete: {formatEuro(aktuelleMieteProQm * wohnflaeche)} / Monat
                    </p>
                  )}
                </div>
                <Button onClick={handleCheck} className="w-full gap-2" size="lg">
                  <Scale className="h-4 w-4" />
                  Mietpreisbremse prüfen
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {hasChecked && result && (
              <div className="space-y-4">
                {result.isNeubau && (
                  <Card className="border-amber-300 bg-amber-50">
                    <CardContent className="p-4 flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-800">Neubau-Ausnahme</p>
                        <p className="text-amber-700 mt-1">
                          Wohnungen, die nach dem 1. Oktober 2014 erstmals genutzt und vermietet werden,
                          sind von der Mietpreisbremse ausgenommen (§ 556f BGB). Die Ergebnisse dienen
                          nur zur Orientierung.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className={result.istUeberhoeht && result.mietpreisbremseAktiv && !result.isNeubau ? "border-destructive/50" : "border-emerald-500/50"}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {result.istUeberhoeht && result.mietpreisbremseAktiv && !result.isNeubau ? (
                        <>
                          <XCircle className="h-8 w-8 text-destructive" />
                          <div>
                            <Badge variant="destructive" className="text-sm">Mietpreisbremse greift</Badge>
                            <p className="text-sm text-muted-foreground mt-1">Die aktuelle Miete liegt über der zulässigen Höchstmiete.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                          <div>
                            <Badge className="bg-emerald-600 text-sm">Mietpreisbremse greift nicht</Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {result.isNeubau
                                ? "Neubau ist von der Mietpreisbremse ausgenommen."
                                : "Die aktuelle Miete liegt innerhalb des zulässigen Rahmens."}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 mt-6">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Ortsübliche Vergleichsmiete</p>
                        <p className="text-2xl font-bold text-primary mt-1">
                          {formatEuro(result.vergleichsmieteProQm)}/m²
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          = {formatEuro(result.vergleichsmieteGesamt)}/Monat
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ({getBaujahrsLabel(result.kategorie)}, {ausstattung})
                        </p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Max. zulässige Miete (+10%)</p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">
                          {formatEuro(result.maxZulaessigProQm)}/m²
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          = {formatEuro(result.maxZulaessigGesamt)}/Monat
                        </p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Ihre aktuelle Miete</p>
                        <p className={`text-2xl font-bold mt-1 ${result.istUeberhoeht ? "text-destructive" : "text-emerald-600"}`}>
                          {formatEuro(aktuelleMieteProQm)}/m²
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          = {formatEuro(result.aktuelleMieteGesamt)}/Monat
                        </p>
                      </div>
                    </div>

                    {result.istUeberhoeht && result.mietpreisbremseAktiv && !result.isNeubau && (
                      <Card className="mt-4 bg-destructive/5 border-destructive/20">
                        <CardContent className="p-4">
                          <p className="text-sm font-semibold text-destructive">Überhöhung</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <span className="text-muted-foreground">Differenz pro m²:</span>
                            <span className="text-right font-medium text-destructive">+{formatEuro(result.differenzProQm)}</span>
                            <span className="text-muted-foreground">Differenz gesamt/Monat:</span>
                            <span className="text-right font-bold text-destructive">+{formatEuro(result.differenzGesamt)}</span>
                            <span className="text-muted-foreground">Überhöhung p.a.:</span>
                            <span className="text-right font-bold text-destructive">+{formatEuro(result.differenzGesamt * 12)}</span>
                          </div>
                          <div className="mt-3 p-3 bg-destructive/10 rounded-lg text-sm">
                            <p className="font-medium text-destructive">Handlungsempfehlung:</p>
                            <p className="text-muted-foreground mt-1">
                              Sie können die überhöhte Miete gegenüber Ihrem Vermieter rügen. Die zu viel gezahlte
                              Miete kann ab dem Zeitpunkt der qualifizierten Rüge zurückgefordert werden.
                              Wir empfehlen eine schriftliche Rüge per Einschreiben.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="h-5 w-5 text-primary" />
                  Rechtsgrundlage
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div>
                  <p className="font-semibold">§ 556d BGB - Mietpreisbremse</p>
                  <p className="text-muted-foreground mt-1">
                    In Gebieten mit angespanntem Wohnungsmarkt darf die Miete bei Wiedervermietung
                    höchstens 10% über der ortsüblichen Vergleichsmiete liegen.
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Ausnahmen (§ 556f BGB):</p>
                  <ul className="text-muted-foreground mt-1 space-y-1 list-disc pl-4">
                    <li>Neubauten (Erstbezug nach 01.10.2014)</li>
                    <li>Umfassend modernisierte Wohnungen</li>
                    <li>Vormiete war bereits höher (§ 556e BGB)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">§ 556g BGB - Rechtsfolgen</p>
                  <p className="text-muted-foreground mt-1">
                    Der Mieter kann die Herabsetzung der Miete verlangen und zu viel gezahlte Miete
                    zurückfordern (qualifizierte Rüge erforderlich).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-primary" />
                  Gebiete mit Mietpreisbremse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  In folgenden Städten gilt die Mietpreisbremse (simulierte Daten):
                </p>
                <div className="flex flex-wrap gap-2">
                  {MIETPREISBREMSE_STAEDTE.map((s) => (
                    <Badge
                      key={s}
                      variant={stadtData?.stadt === s ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => { setStadt(s); setHasChecked(false); }}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">Verfügbare Städte</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    {MIETSPIEGEL_DATA.map((d) => (
                      <div key={d.stadt} className="flex items-center gap-1">
                        {d.mietpreisbremseAktiv ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground" />
                        )}
                        {d.stadt}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Hinweis</p>
                  <p className="mt-1">
                    Die angezeigten Mietspiegeldaten sind simuliert und dienen nur zur Veranschaulichung.
                    Für verbindliche Auskünfte nutzen Sie bitte den offiziellen Mietspiegel Ihrer Kommune.
                  </p>
                </div>
              </CardContent>
            </Card>

            {stadtData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Euro className="h-5 w-5 text-primary" />
                    Mietspiegel {stadtData.stadt}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    {Object.entries(stadtData.vergleichsmiete).map(([key, values]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">{getBaujahrsLabel(key)}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">{formatEuro(values.standard)}</Badge>
                          <Badge variant="outline" className="text-xs">{formatEuro(values.gehoben)}</Badge>
                          <Badge variant="outline" className="text-xs">{formatEuro(values.luxus)}</Badge>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end gap-2 mt-1 text-muted-foreground">
                      <span className="text-xs">Standard</span>
                      <span className="text-xs">Gehoben</span>
                      <span className="text-xs">Luxus</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">(Angaben in EUR/m²)</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
