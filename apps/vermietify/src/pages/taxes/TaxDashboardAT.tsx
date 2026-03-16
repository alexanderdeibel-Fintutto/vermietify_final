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
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Calculator, Calendar, FileText, Euro } from "lucide-react";
import { Link } from "react-router-dom";

const einkommensteuerAT = [
  { von: 0, bis: 12816, satz: "0 %", grenzsteuersatz: 0 },
  { von: 12816, bis: 20818, satz: "20 %", grenzsteuersatz: 20 },
  { von: 20818, bis: 34513, satz: "30 %", grenzsteuersatz: 30 },
  { von: 34513, bis: 66612, satz: "40 %", grenzsteuersatz: 40 },
  { von: 66612, bis: 99266, satz: "48 %", grenzsteuersatz: 48 },
  { von: 99266, bis: 1000000, satz: "50 %", grenzsteuersatz: 50 },
  { von: 1000000, bis: Infinity, satz: "55 %", grenzsteuersatz: 55 },
];

const deadlines = [
  { termin: "30. April", beschreibung: "Abgabe Einkommensteuererklarung (Papier)" },
  { termin: "30. Juni", beschreibung: "Abgabe Einkommensteuererklarung (FinanzOnline)" },
  { termin: "10. des Folgemonats", beschreibung: "Umsatzsteuer-Voranmeldung (monatlich)" },
  { termin: "15. des 2. Folgemonats", beschreibung: "Umsatzsteuer-Voranmeldung (vierteljahrlich)" },
  { termin: "30. September", beschreibung: "Vorauszahlung Einkommensteuer (3. Quartal)" },
];

const keyDifferencesDE = [
  { thema: "AfA Wohngebaude", de: "2 % (ab 2023: 3 % fur Neubau)", at: "1,5 % (Standard)" },
  { thema: "Steuersatze", de: "14 - 45 %", at: "0 - 55 %" },
  { thema: "Spitzensteuersatz ab", de: "277.826 EUR", at: "1.000.000 EUR" },
  { thema: "USt-Option Vermietung", de: "Nur bei Gewerbevermietung", at: "Wohn- und Gewerbe moglich (10 % / 20 %)" },
  { thema: "Spekulationsfrist", de: "10 Jahre", at: "Abgeschafft (ImmoESt 30 %)" },
  { thema: "Grunderwerbsteuer", de: "3,5 - 6,5 %", at: "3,5 %" },
];

export default function TaxDashboardAT() {
  const [activeTab, setActiveTab] = useState("uebersicht");

  return (
    <MainLayout
      title="Steuern Osterreich"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Steuern", href: "/taxes" },
        { label: "Osterreich" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Steuer-Dashboard Osterreich"
          subtitle="Ubersicht uber die steuerlichen Regelungen fur Immobilienvermietung in Osterreich."
          actions={
            <Button variant="outline" asChild>
              <Link to="/taxes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Steuerubersicht
              </Link>
            </Button>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="uebersicht">Ubersicht</TabsTrigger>
            <TabsTrigger value="afa">AfA</TabsTrigger>
            <TabsTrigger value="ust">Umsatzsteuer</TabsTrigger>
            <TabsTrigger value="unterschiede">Unterschiede zu DE</TabsTrigger>
            <TabsTrigger value="fristen">Fristen</TabsTrigger>
          </TabsList>

          <TabsContent value="uebersicht" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator className="h-5 w-5 text-primary" />
                  Einkommensteuer-Tarif Osterreich 2026
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Von (EUR)</TableHead>
                      <TableHead>Bis (EUR)</TableHead>
                      <TableHead>Grenzsteuersatz</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {einkommensteuerAT.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.von.toLocaleString("de-AT")}</TableCell>
                        <TableCell>
                          {row.bis === Infinity ? "daruber" : row.bis.toLocaleString("de-AT")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.satz}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-4">
                  * Platzhalterdaten. Aktuelle Tarife beim BMF Osterreich.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Besteuerung von Mieteinkommen in Osterreich</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Einkunfte aus Vermietung und Verpachtung werden in Osterreich als Teil des
                      Gesamteinkommens mit dem progressiven Einkommensteuertarif besteuert.
                      Werbungskosten wie AfA, Zinsen und Instandhaltung sind abzugsfahig.
                      Bei Verausserung fallt die Immobilienertragsteuer (ImmoESt) von 30 % an.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="afa" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Euro className="h-5 w-5 text-primary" />
                  Absetzung fur Abnutzung (AfA) - Osterreich
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium">Standardsatz Wohngebaude</p>
                    <p className="text-3xl font-bold text-primary mt-1">1,5 %</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      entspricht 66,67 Jahre Nutzungsdauer
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium">Beschleunigte AfA (seit 2024)</p>
                    <p className="text-3xl font-bold text-primary mt-1">bis 4,5 %</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      im ersten Jahr bei Neubau (dreifacher Satz)
                    </p>
                  </div>
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-sm space-y-2">
                    <p><strong>Hinweise zur AfA in Osterreich:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>AfA-Basis: Anschaffungskosten abzuglich Grundanteil</li>
                      <li>Grundanteil pauschal 40 % (Gemeinden uber 100.000 Einwohner) oder 20 %</li>
                      <li>Bei Nachweis eines hoheren/niedrigeren Grundanteils: abweichende Berechnung</li>
                      <li>Instandsetzungsaufwendungen: auf 15 Jahre verteilt absetzbar</li>
                      <li>Instandhaltungskosten: sofort in voller Hohe absetzbar</li>
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ust" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Umsatzsteuer-Option bei Vermietung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <Badge className="bg-emerald-100 text-emerald-800 mb-2">Wohnraumvermietung</Badge>
                    <p className="text-2xl font-bold">10 % USt</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ermassigter Steuersatz fur Wohnraumvermietung
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Badge className="bg-blue-100 text-blue-800 mb-2">Gewerbevermietung</Badge>
                    <p className="text-2xl font-bold">20 % USt</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Normaler Steuersatz fur gewerbliche Vermietung
                    </p>
                  </div>
                </div>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium text-blue-900">Vorsteuerabzug bei Vermietung</p>
                        <p className="mt-1">
                          Wer zur Umsatzsteuerpflicht optiert, kann die Vorsteuer aus Herstellungs- und
                          Instandhaltungskosten geltend machen. Dies ist besonders bei hohen Investitionen
                          (Neubau, Sanierung) vorteilhaft. Die Option ist fur mindestens 20 Jahre bindend.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unterschiede" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Wesentliche Unterschiede zu Deutschland</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thema</TableHead>
                      <TableHead>Deutschland</TableHead>
                      <TableHead>Osterreich</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keyDifferencesDE.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.thema}</TableCell>
                        <TableCell>{row.de}</TableCell>
                        <TableCell>{row.at}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fristen" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Wichtige Fristen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deadlines.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border">
                      <Badge variant="outline" className="min-w-[140px] justify-center">
                        {d.termin}
                      </Badge>
                      <span className="text-sm">{d.beschreibung}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Anlage E1c
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Die Beilage E1c zur Einkommenssteuererklarung dient der Erfassung von
                  Einkuenften aus Vermietung und Verpachtung in Osterreich. Hier werden
                  Einnahmen, Werbungskosten und AfA detailliert aufgeschlusselt.
                </p>
                <Button variant="outline" className="mt-4" disabled>
                  <FileText className="mr-2 h-4 w-4" />
                  Anlage E1c erstellen (in Vorbereitung)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
