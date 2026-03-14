import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Info,
  Globe,
  Scale,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from "lucide-react";

type Country = "DE" | "AT" | "CH";

const countryLabels: Record<Country, string> = {
  DE: "Deutschland",
  AT: "Österreich",
  CH: "Schweiz",
};

interface ComparisonRow {
  category: string;
  DE: string;
  AT: string;
  CH: string;
}

const comparisonData: ComparisonRow[] = [
  {
    category: "Einkommensteuersatz",
    DE: "14-45% (+ Soli)",
    AT: "0-55% (progressiv)",
    CH: "~20-45% (Bund+Kanton+Gemeinde)",
  },
  {
    category: "AfA / Abschreibung",
    DE: "2% (Altbau) / 3% (Neubau ab 2023)",
    AT: "1,5% (Standard)",
    CH: "Pauschal 10-20% oder effektiv",
  },
  {
    category: "Umsatzsteuer (Wohnen)",
    DE: "Umsatzsteuerfrei (Option §9 UStG)",
    AT: "10% (ermäßigt)",
    CH: "MWST-befreit (Option möglich)",
  },
  {
    category: "Umsatzsteuer (Gewerbe)",
    DE: "19% (Option möglich)",
    AT: "20% (Normalsatz)",
    CH: "8,1% (Option möglich)",
  },
  {
    category: "Meldepflichten",
    DE: "Anlage V, Anlage SO, UStVA",
    AT: "Einkommensteuererklärung, UVA",
    CH: "Steuererklärung, Verrechnungssteuer",
  },
  {
    category: "Spekulationsfrist",
    DE: "10 Jahre (dann steuerfrei)",
    AT: "Keine Frist (Immo-ESt 30%)",
    CH: "Grundstückgewinnsteuer (Haltedauer-Rabatt)",
  },
  {
    category: "Doppelbesteuerungsabkommen",
    DE: "DBA mit AT und CH",
    AT: "DBA mit DE und CH",
    CH: "DBA mit DE und AT",
  },
];

const recommendations = [
  {
    countries: ["DE", "AT"] as Country[],
    title: "Deutschland - Österreich",
    points: [
      "Mieteinnahmen werden im Belegenheitsstaat (Staat der Immobilie) besteuert",
      "DBA sorgt für Freistellungsmethode mit Progressionsvorbehalt",
      "Grenzgänger sollten die Zuordnung von Werbungskosten beachten",
      "Umsatzsteuerliche Registrierung im Belegenheitsstaat prüfen",
    ],
  },
  {
    countries: ["DE", "CH"] as Country[],
    title: "Deutschland - Schweiz",
    points: [
      "Belegenheitsprinzip: Besteuerung am Standort der Immobilie",
      "CH: Verrechnungssteuer auf Mieteinnahmen beachten",
      "DE: Progressionsvorbehalt bei Freistellung der CH-Einkünfte",
      "Wechselkursrisiken bei CHF-EUR-Umrechnungen berücksichtigen",
    ],
  },
  {
    countries: ["AT", "CH"] as Country[],
    title: "Österreich - Schweiz",
    points: [
      "Belegenheitsprinzip gilt auch hier",
      "DBA AT-CH: Freistellungsmethode in der Regel anwendbar",
      "Unterschiedliche Abschreibungsmethoden beachten",
      "Grundstückgewinnsteuer CH vs. Immobilienertragsteuer AT vergleichen",
    ],
  },
];

export default function CrossBorderTaxDashboard() {
  const [selectedCountries, setSelectedCountries] = useState<[Country, Country]>(["DE", "AT"]);

  const filteredRecommendation = recommendations.find(
    (r) =>
      r.countries.includes(selectedCountries[0]) &&
      r.countries.includes(selectedCountries[1])
  );

  return (
    <MainLayout
      title="Grenzüberschreitende Besteuerung"
      breadcrumbs={[
        { label: "Steuern", href: "/taxes" },
        { label: "DACH-Vergleich" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Grenzüberschreitende Besteuerung"
          subtitle="Steuervergleich und Empfehlungen für DACH-Länder."
        />

        {/* Country Toggle */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Land 1</p>
                <Select
                  value={selectedCountries[0]}
                  onValueChange={(v) =>
                    setSelectedCountries([v as Country, selectedCountries[1]])
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DE">Deutschland</SelectItem>
                    <SelectItem value="AT">Österreich</SelectItem>
                    <SelectItem value="CH">Schweiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ArrowRight className="h-5 w-5 text-muted-foreground mt-6" />

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Land 2</p>
                <Select
                  value={selectedCountries[1]}
                  onValueChange={(v) =>
                    setSelectedCountries([selectedCountries[0], v as Country])
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DE">Deutschland</SelectItem>
                    <SelectItem value="AT">Österreich</SelectItem>
                    <SelectItem value="CH">Schweiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Steuervergleich
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kategorie</th>
                    <th className="text-left py-3 px-4 font-medium">
                      <Badge
                        variant="outline"
                        className={
                          selectedCountries.includes("DE")
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-gray-50 text-gray-500"
                        }
                      >
                        DE
                      </Badge>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      <Badge
                        variant="outline"
                        className={
                          selectedCountries.includes("AT")
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-50 text-gray-500"
                        }
                      >
                        AT
                      </Badge>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      <Badge
                        variant="outline"
                        className={
                          selectedCountries.includes("CH")
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-50 text-gray-500"
                        }
                      >
                        CH
                      </Badge>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{row.category}</td>
                      <td
                        className={`py-3 px-4 ${
                          !selectedCountries.includes("DE") ? "text-muted-foreground/40" : ""
                        }`}
                      >
                        {row.DE}
                      </td>
                      <td
                        className={`py-3 px-4 ${
                          !selectedCountries.includes("AT") ? "text-muted-foreground/40" : ""
                        }`}
                      >
                        {row.AT}
                      </td>
                      <td
                        className={`py-3 px-4 ${
                          !selectedCountries.includes("CH") ? "text-muted-foreground/40" : ""
                        }`}
                      >
                        {row.CH}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Declaration Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Wo sind Mieteinnahmen zu erklären?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Grundsätzlich gilt das <strong>Belegenheitsprinzip</strong>: Einkünfte aus Vermietung und
              Verpachtung werden in dem Staat besteuert, in dem sich die Immobilie befindet.
            </p>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-blue-800">
                  <p><strong>Belegenheitsprinzip:</strong> Wenn Sie als deutscher Steuerpflichtiger eine
                  Immobilie in Österreich vermieten, werden die Mieteinnahmen in Österreich besteuert.
                  In Deutschland werden diese Einkünfte freigestellt, unterliegen aber dem Progressionsvorbehalt.</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <Badge className="bg-yellow-100 text-yellow-800 mb-2">Deutschland</Badge>
                <p className="text-sm text-muted-foreground">
                  Anlage V der Einkommensteuererklärung. Ausländische Einkünfte in Anlage AUS.
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <Badge className="bg-red-100 text-red-800 mb-2">Österreich</Badge>
                <p className="text-sm text-muted-foreground">
                  Formular E1: Einkünfte aus V&V. Ausländische Einkünfte in Beilage E1a.
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <Badge className="bg-red-100 text-red-800 mb-2">Schweiz</Badge>
                <p className="text-sm text-muted-foreground">
                  Kantonale Steuererklärung: Liegenschaftsverzeichnis. Ausländische Liegenschaften separat.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withholding Tax */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Quellensteuer / Withholding Tax
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Bei grenzüberschreitender Vermietung können Quellensteuern anfallen. Diese werden
              in der Regel auf die Steuerschuld im Wohnsitzstaat angerechnet.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Deutschland</p>
                  <p className="text-sm text-muted-foreground">
                    Keine Quellensteuer auf Mieteinnahmen für Ausländer
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">0%</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Österreich</p>
                  <p className="text-sm text-muted-foreground">
                    Beschränkte Steuerpflicht für ausländische Vermieter, Abzugsverfahren möglich
                  </p>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Variabel</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Schweiz</p>
                  <p className="text-sm text-muted-foreground">
                    Quellenbesteuerung für beschränkt Steuerpflichtige, kantonaler Tarif
                  </p>
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700">Kantonal</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {filteredRecommendation && selectedCountries[0] !== selectedCountries[1] && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Empfehlungen: {filteredRecommendation.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {filteredRecommendation.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-700">{i + 1}</span>
                    </div>
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-yellow-800">
                    <strong>Haftungshinweis:</strong> Diese Informationen dienen nur zur Orientierung und
                    ersetzen keine steuerliche Beratung. Bei grenzüberschreitenden Sachverhalten empfehlen
                    wir dringend die Konsultation eines spezialisierten Steuerberaters.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
