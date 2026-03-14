import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Info,
  ArrowLeft,
  Building2,
  Euro,
  Landmark,
  MapPin,
  Scale,
  Calculator,
} from "lucide-react";

const cantonalTaxes = [
  { canton: "Zürich (ZH)", liegenschaftssteuer: "0,5-1,5\u2030", grundsteuer: "Ja", besonderheit: "Gemeindezuschlag variiert" },
  { canton: "Bern (BE)", liegenschaftssteuer: "1,0-1,5\u2030", grundsteuer: "Ja", besonderheit: "Liegenschaftssteuer kantonal geregelt" },
  { canton: "Luzern (LU)", liegenschaftssteuer: "0,5-1,0\u2030", grundsteuer: "Ja", besonderheit: "" },
  { canton: "St. Gallen (SG)", liegenschaftssteuer: "0,3-0,8\u2030", grundsteuer: "Ja", besonderheit: "" },
  { canton: "Basel-Stadt (BS)", liegenschaftssteuer: "Keine", grundsteuer: "Nein", besonderheit: "Keine Liegenschaftssteuer" },
  { canton: "Genf (GE)", liegenschaftssteuer: "0,5-1,0\u2030", grundsteuer: "Ja", besonderheit: "Impôt immobilier complémentaire" },
  { canton: "Aargau (AG)", liegenschaftssteuer: "0,5-1,5\u2030", grundsteuer: "Ja", besonderheit: "" },
  { canton: "Zug (ZG)", liegenschaftssteuer: "0,5\u2030", grundsteuer: "Ja", besonderheit: "Niedriger Steuerfuß" },
];

export default function TaxDashboardCH() {
  return (
    <MainLayout
      title="Steuern Schweiz"
      breadcrumbs={[
        { label: "Steuern", href: "/taxes" },
        { label: "Schweiz" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Steuerübersicht Schweiz"
          subtitle="Besteuerung von Mieteinnahmen und Liegenschaften in der Schweiz."
          actions={
            <Link to="/taxes">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Übersicht
              </Button>
            </Link>
          }
        />

        {/* Eigenmietwert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Eigenmietwert
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Der <strong>Eigenmietwert</strong> ist ein fiktives Einkommen, das Eigentümer selbstgenutzter
              Liegenschaften als Einkommen versteuern müssen. Er entspricht in der Regel 60-70% des
              Marktmietwerts der Liegenschaft.
            </p>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-blue-800">
                  <p><strong>Wichtig:</strong> Der Eigenmietwert gilt nur für selbstgenutzte Liegenschaften.
                  Bei vermieteten Objekten werden stattdessen die tatsächlichen Mieteinnahmen versteuert.</p>
                  <p className="mt-2">Im Gegenzug können Unterhaltskosten, Hypothekarzinsen und
                  Versicherungsprämien abgezogen werden.</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-yellow-800">
                  <strong>Reformdiskussion:</strong> Die Abschaffung des Eigenmietwerts wird seit Jahren
                  politisch diskutiert. Eine mögliche Reform könnte auch Auswirkungen auf die Abzugsfähigkeit
                  von Schuldzinsen haben.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cantonal Differences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Kantonale Unterschiede
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Die Besteuerung von Liegenschaften unterscheidet sich in der Schweiz erheblich zwischen
              den 26 Kantonen. Sowohl Steuersätze als auch Abzugsmöglichkeiten variieren.
            </p>
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 text-sm">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                <p className="text-orange-800">
                  <strong>Hinweis:</strong> Die Einkommenssteuer auf Mieteinnahmen wird auf Bundes-, Kantons-
                  und Gemeindeebene erhoben. Der effektive Steuersatz kann daher je nach Standort stark
                  variieren (ca. 20-45%).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pauschalabzug vs. effektive Kosten */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Pauschalabzug vs. effektive Kosten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-800">Option 1</Badge>
                  <span className="font-medium">Pauschalabzug</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Jährlicher Pauschalabzug von <strong>10-20%</strong> des Bruttomietwerts
                  (je nach Alter der Liegenschaft). Einfach, kein Nachweis einzelner Kosten nötig.
                </p>
                <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside space-y-1">
                  <li>Liegenschaft bis 10 Jahre: 10%</li>
                  <li>Liegenschaft über 10 Jahre: 20%</li>
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-800">Option 2</Badge>
                  <span className="font-medium">Effektive Kosten</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Abzug der tatsächlich angefallenen Unterhalts- und Verwaltungskosten.
                  Lohnt sich bei grösseren Renovationen.
                </p>
                <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside space-y-1">
                  <li>Reparaturen und Unterhalt</li>
                  <li>Verwaltungskosten</li>
                  <li>Versicherungsprämien</li>
                  <li>Hypothekarzinsen</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Die Wahl zwischen Pauschal- und effektivem Abzug kann jedes Jahr neu getroffen werden.
            </p>
          </CardContent>
        </Card>

        {/* Liegenschaftssteuer by Canton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Liegenschaftssteuer nach Kanton
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground">Kanton</th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">Liegenschaftssteuer</th>
                    <th className="text-center py-2 px-4 font-medium text-muted-foreground">Grundsteuer</th>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground">Besonderheit</th>
                  </tr>
                </thead>
                <tbody>
                  {cantonalTaxes.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4 font-medium">{row.canton}</td>
                      <td className="py-2 px-4 text-right">{row.liegenschaftssteuer}</td>
                      <td className="py-2 px-4 text-center">
                        <Badge
                          variant="outline"
                          className={
                            row.grundsteuer === "Ja"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-50 text-gray-700"
                          }
                        >
                          {row.grundsteuer}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 text-muted-foreground">{row.besonderheit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Grundstückgewinnsteuer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Grundstückgewinnsteuer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Beim Verkauf einer Liegenschaft fällt in der Schweiz eine <strong>Grundstückgewinnsteuer</strong> an.
              Diese besteuert den Gewinn aus der Veräusserung von Grundstücken und wird kantonal geregelt.
            </p>
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <p><strong>Wichtige Merkmale:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Progressiver Tarif: Kurzfristige Gewinne werden höher besteuert</li>
                <li>Haltedauer-Rabatt: Je länger die Haltedauer, desto geringer die Steuer</li>
                <li>Spekulationszuschlag bei Besitzdauer unter 1-2 Jahren möglich</li>
                <li>Ersatzbeschaffung: Steuerneutrale Reinvestition unter bestimmten Bedingungen</li>
                <li>Wertvermehrende Investitionen können vom Gewinn abgezogen werden</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Key Differences from DE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Wesentliche Unterschiede zur Besteuerung in Deutschland
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  topic: "Eigenmietwert",
                  ch: "Fiktives Einkommen für selbstgenutzte Immobilien wird besteuert",
                  de: "Kein Eigenmietwert in Deutschland",
                },
                {
                  topic: "AfA / Abschreibung",
                  ch: "Keine lineare AfA wie in DE; stattdessen Pauschal- oder Effektivabzug",
                  de: "Lineare AfA: 2% (Altbau) bzw. 3% (Neubau ab 2023)",
                },
                {
                  topic: "Spekulationsfrist",
                  ch: "Grundstückgewinnsteuer mit Haltedauer-Rabatt, keine feste Frist",
                  de: "10-Jahres-Spekulationsfrist, danach steuerfrei",
                },
                {
                  topic: "Kantonale Steuern",
                  ch: "Drei Ebenen: Bund, Kanton, Gemeinde - erhebliche Unterschiede",
                  de: "Einheitliche Bundesregelung mit Solidaritätszuschlag",
                },
                {
                  topic: "Umsatzsteuer",
                  ch: "Option zur Versteuerung möglich (MWST 8,1%)",
                  de: "Grundsätzlich umsatzsteuerfrei (§ 4 Nr. 12 UStG), Option möglich",
                },
              ].map((item, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <p className="font-medium mb-2">{item.topic}</p>
                  <div className="grid gap-2 md:grid-cols-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 bg-red-50 text-red-700">CH</Badge>
                      <span className="text-muted-foreground">{item.ch}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 bg-yellow-50 text-yellow-700">DE</Badge>
                      <span className="text-muted-foreground">{item.de}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
