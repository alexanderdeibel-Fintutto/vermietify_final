import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Info, Scale, FileText, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

type Country = "DE" | "AT" | "CH";

const COUNTRY_LABELS: Record<Country, string> = {
  DE: "Deutschland",
  AT: "Osterreich",
  CH: "Schweiz",
};

const comparisonData = [
  {
    thema: "Einkommensteuer (Spitzensatz)",
    DE: "42 % (+ 5,5 % SolZ)",
    AT: "55 %",
    CH: "11,5 % Bund + kantonal (ca. 20-35 % gesamt)",
  },
  {
    thema: "AfA Wohngebaude",
    DE: "2 % (Neubau ab 2023: 3 %)",
    AT: "1,5 % (Standard)",
    CH: "Pauschal 10-20 % oder effektiv",
  },
  {
    thema: "Grunderwerbsteuer",
    DE: "3,5 - 6,5 % (je Bundesland)",
    AT: "3,5 %",
    CH: "Handanderungssteuer 1-3 % (kantonal)",
  },
  {
    thema: "Spekulationsfrist / Gewinnsteuer",
    DE: "10 Jahre (danach steuerfrei)",
    AT: "ImmoESt 30 % (keine Frist)",
    CH: "Grundstuckgewinnsteuer (degressiv)",
  },
  {
    thema: "Umsatzsteuer Vermietung",
    DE: "USt-Option nur Gewerbe (19 %)",
    AT: "Wohnen 10 %, Gewerbe 20 %",
    CH: "MWST-Option moglich (7,7 %)",
  },
  {
    thema: "Verlustverrechnung",
    DE: "Mit anderen Einkuenften moglich",
    AT: "Mit anderen Einkuenften moglich",
    CH: "Kantonal unterschiedlich",
  },
  {
    thema: "Mietrechts-Besonderheit",
    DE: "Mietpreisbremse, Mietspiegel",
    AT: "Richtwertmieten, Kategoriemieten",
    CH: "Eigenmietwert fur Selbstnutzung",
  },
];

const dbaInfo = [
  {
    pair: "DE-AT",
    title: "Deutschland - Osterreich",
    details: [
      "DBA in Kraft seit 2002 (revidiert 2012)",
      "Besteuerungsrecht fur Immobilien: Belegenheitsstaat",
      "Mieteinkunfte werden im Land der Immobilie besteuert",
      "Freistellungsmethode mit Progressionsvorbehalt in DE",
      "Anrechnungsmethode in AT",
    ],
  },
  {
    pair: "DE-CH",
    title: "Deutschland - Schweiz",
    details: [
      "DBA in Kraft seit 1972 (mehrfach revidiert)",
      "Besteuerungsrecht fur Immobilien: Belegenheitsstaat",
      "Mieteinkunfte werden im Land der Immobilie besteuert",
      "Freistellungsmethode mit Progressionsvorbehalt in DE",
      "Quellensteuer-Regelungen beachten",
    ],
  },
  {
    pair: "AT-CH",
    title: "Osterreich - Schweiz",
    details: [
      "DBA in Kraft seit 1974 (revidiert 2007)",
      "Besteuerungsrecht fur Immobilien: Belegenheitsstaat",
      "Mieteinkunfte werden im Land der Immobilie besteuert",
      "Anrechnungsmethode in AT",
    ],
  },
];

const withholdingRules = [
  {
    land: "Deutschland",
    regel: "Keine Quellensteuer auf Mieteinnahmen. Beschrankte Steuerpflicht fur Nichtansassige.",
    hinweis: "Steuererklarungspflicht auch fur Nichtansassige bei deutschen Mieteinkunften.",
  },
  {
    land: "Osterreich",
    regel: "Keine Quellensteuer. Beschrankte Steuerpflicht gemaess Paragraph 98 EStG AT.",
    hinweis: "Mieteinkunfte in AT sind in der AT-Steuererklarung anzugeben.",
  },
  {
    land: "Schweiz",
    regel: "Quellensteuer moglich auf Mieteinkunfte von Nichtansassigen (kantonal).",
    hinweis: "Steuererklarung im Belegenheitskanton erforderlich.",
  },
];

export default function CrossBorderTaxDashboard() {
  const [selectedCountry, setSelectedCountry] = useState<Country>("DE");
  const [activeTab, setActiveTab] = useState("vergleich");

  return (
    <MainLayout
      title="Grenzuberschreitende Besteuerung"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Steuern", href: "/taxes" },
        { label: "DACH-Vergleich" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Grenzuberschreitende Besteuerung"
          subtitle="Vergleichen Sie Steuerregelungen fur Immobilieninvestments in Deutschland, Osterreich und der Schweiz."
          actions={
            <div className="flex gap-2 items-center">
              <Select value={selectedCountry} onValueChange={(v) => setSelectedCountry(v as Country)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DE">Deutschland</SelectItem>
                  <SelectItem value="AT">Osterreich</SelectItem>
                  <SelectItem value="CH">Schweiz</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" asChild>
                <Link to="/taxes">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Steuerubersicht
                </Link>
              </Button>
            </div>
          }
        />

        {/* Country Badge */}
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Ansassigkeitsstaat:</span>
          <Badge className="bg-primary/10 text-primary">
            {COUNTRY_LABELS[selectedCountry]}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="vergleich">Landervergleich</TabsTrigger>
            <TabsTrigger value="dba">Doppelbesteuerungsabkommen</TabsTrigger>
            <TabsTrigger value="quellensteuer">Quellensteuer</TabsTrigger>
            <TabsTrigger value="erklaerung">Wo deklarieren?</TabsTrigger>
          </TabsList>

          <TabsContent value="vergleich" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scale className="h-5 w-5 text-primary" />
                  Steuerlicher Vergleich DE / AT / CH
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Thema</TableHead>
                      <TableHead>Deutschland</TableHead>
                      <TableHead>Osterreich</TableHead>
                      <TableHead>Schweiz</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.thema}</TableCell>
                        <TableCell>
                          <span className={selectedCountry === "DE" ? "font-semibold text-primary" : ""}>
                            {row.DE}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={selectedCountry === "AT" ? "font-semibold text-primary" : ""}>
                            {row.AT}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={selectedCountry === "CH" ? "font-semibold text-primary" : ""}>
                            {row.CH}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dba" className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Doppelbesteuerungsabkommen (DBA)</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Doppelbesteuerungsabkommen regeln, welcher Staat bei grenzuberschreitenden
                      Sachverhalten das Besteuerungsrecht hat. Fur Immobilien gilt grundsatzlich
                      das Belegenheitsprinzip: Das Land, in dem die Immobilie liegt, hat das
                      primare Besteuerungsrecht.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {dbaInfo.map((dba) => (
              <Card key={dba.pair}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    {dba.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {dba.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">-</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="quellensteuer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quellensteuer-Regelungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {withholdingRules.map((rule, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{rule.land}</Badge>
                      </div>
                      <p className="text-sm">{rule.regel}</p>
                      <div className="flex items-start gap-2 mt-2 p-2 bg-muted/50 rounded">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">{rule.hinweis}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="erklaerung" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Wo sind Mieteinkunfte zu deklarieren?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ansassig in: <strong>{COUNTRY_LABELS[selectedCountry]}</strong>
                </p>

                <div className="space-y-4">
                  {(["DE", "AT", "CH"] as Country[]).map((country) => {
                    const isHome = country === selectedCountry;
                    return (
                      <div key={country} className={`p-4 border rounded-lg ${isHome ? "border-primary/30 bg-primary/5" : ""}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={isHome ? "bg-primary text-primary-foreground" : ""} variant={isHome ? "default" : "outline"}>
                            Immobilie in {COUNTRY_LABELS[country]}
                          </Badge>
                          {isHome && <Badge className="bg-emerald-100 text-emerald-800">Inland</Badge>}
                        </div>
                        {isHome ? (
                          <p className="text-sm">
                            Mieteinkunfte werden regulaer in Ihrer Einkommensteuererklarung in{" "}
                            {COUNTRY_LABELS[country]} angegeben. Keine besonderen grenzuberschreitenden
                            Regelungen.
                          </p>
                        ) : (
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Belegenheitsstaat ({COUNTRY_LABELS[country]}):</strong>{" "}
                              Steuererklarung fur beschrankt Steuerpflichtige abgeben. Mieteinkunfte
                              werden dort besteuert.
                            </p>
                            <p>
                              <strong>Ansassigkeitsstaat ({COUNTRY_LABELS[selectedCountry]}):</strong>{" "}
                              {selectedCountry === "DE"
                                ? "Einkunfte in Anlage AUS angeben. Freistellung mit Progressionsvorbehalt."
                                : selectedCountry === "AT"
                                ? "Einkunfte deklarieren. Anrechnung der im Ausland gezahlten Steuer."
                                : "Einkunfte deklarieren. Anrechnung der auslandischen Steuer moglich."}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-yellow-800">
                        <strong>Wichtig:</strong> Bei grenzuberschreitenden Immobilieninvestments
                        empfehlen wir dringend die Beratung durch einen auf internationales
                        Steuerrecht spezialisierten Steuerberater. Die hier dargestellten
                        Informationen ersetzen keine individuelle Steuerberatung.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
