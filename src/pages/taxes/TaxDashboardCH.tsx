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
import { ArrowLeft, Info, Calculator, Home, Building2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const kantonsvergleich = [
  { kanton: "Zurich", eigenmietwert: "60-70 % Marktwert", liegenschaftssteuer: "0,08 - 0,15 %", grundstuckgewinnsteuer: "Bis 40 % (degressiv)" },
  { kanton: "Bern", eigenmietwert: "60-70 % Marktwert", liegenschaftssteuer: "0,1 - 0,2 %", grundstuckgewinnsteuer: "Bis 40 % (degressiv)" },
  { kanton: "Luzern", eigenmietwert: "70 % Marktwert", liegenschaftssteuer: "0,05 - 0,15 %", grundstuckgewinnsteuer: "Bis 48 % (degressiv)" },
  { kanton: "Zug", eigenmietwert: "60 % Marktwert", liegenschaftssteuer: "0,05 %", grundstuckgewinnsteuer: "Bis 30 % (degressiv)" },
  { kanton: "Basel-Stadt", eigenmietwert: "70 % Marktwert", liegenschaftssteuer: "Keine", grundstuckgewinnsteuer: "Bis 60 % (degressiv)" },
  { kanton: "Genf", eigenmietwert: "Ca. 4 % des Steuerwerts", liegenschaftssteuer: "0,1 %", grundstuckgewinnsteuer: "Bis 50 % (degressiv)" },
  { kanton: "Waadt", eigenmietwert: "70 % Marktwert", liegenschaftssteuer: "0,1 %", grundstuckgewinnsteuer: "Bis 30 % (degressiv)" },
];

export default function TaxDashboardCH() {
  const [activeTab, setActiveTab] = useState("uebersicht");

  return (
    <MainLayout
      title="Steuern Schweiz"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Steuern", href: "/taxes" },
        { label: "Schweiz" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Steuer-Dashboard Schweiz"
          subtitle="Ubersicht uber die steuerlichen Regelungen fur Immobilieneigentum und Vermietung in der Schweiz."
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
            <TabsTrigger value="eigenmietwert">Eigenmietwert</TabsTrigger>
            <TabsTrigger value="unterhaltskosten">Unterhaltskosten</TabsTrigger>
            <TabsTrigger value="grundstueckgewinn">Grundstuckgewinn</TabsTrigger>
            <TabsTrigger value="kantone">Kantonsvergleich</TabsTrigger>
          </TabsList>

          <TabsContent value="uebersicht" className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium text-blue-900">Besteuerung von Immobilien in der Schweiz</p>
                    <p className="text-sm text-blue-800">
                      Die Schweiz besteuert Immobilieneigentum auf Bundes-, Kantons- und Gemeindeebene.
                      Das System unterscheidet sich grundlegend von Deutschland und Osterreich,
                      insbesondere durch den Eigenmietwert, die kantonalen Liegenschaftssteuern und
                      die Grundstuckgewinnsteuer.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Home className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-medium">Eigenmietwert</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Selbstgenutzte Immobilien werden mit einem fiktiven Mietwert (60-70 % des Marktwerts)
                    als Einkommen besteuert.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-medium">Liegenschaftssteuer</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Jahrliche Steuer auf den amtlichen Wert der Liegenschaft.
                    Hohe und Erhebung variieren nach Kanton.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-medium">Kantonale Unterschiede</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Die steuerliche Belastung variiert erheblich zwischen den 26 Kantonen.
                    Steuersatze, Abzuge und Bewertungsmethoden unterscheiden sich deutlich.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mieteinkommen Schweiz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  Mieteinnahmen aus vermieteten Liegenschaften werden als Einkommen besteuert.
                  Im Gegensatz zu selbstgenutzten Immobilien wird kein Eigenmietwert zugerechnet,
                  sondern die tatsachlichen Mieteinnahmen versteuert.
                </p>
                <p>
                  Abzugsfahig sind: Unterhalts- und Verwaltungskosten, Versicherungspramien,
                  Schuldzinsen, sowie wertvermehrende Investitionen unter bestimmten Voraussetzungen.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eigenmietwert" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-5 w-5 text-primary" />
                  Eigenmietwert
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Der Eigenmietwert ist ein fiktives Einkommen, das Eigentumern selbstgenutzter
                  Wohnungen zugerechnet wird. Er entspricht dem Betrag, den ein Dritter als
                  Miete fur die gleiche Liegenschaft zahlen wurde, wird aber in der Regel auf
                  60-70 % des Marktmietwerts festgesetzt.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium text-emerald-700">Vorteile</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Schuldzinsen voll abzugsfahig</li>
                      <li>Unterhaltskosten absetzbar</li>
                      <li>Energetische Sanierung abzugsfahig</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium text-destructive">Nachteile</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Besteuerung ohne echten Geldfluss</li>
                      <li>Steigt mit Marktwert der Immobilie</li>
                      <li>Benachteiligung schuldfreier Eigentumer</li>
                    </ul>
                  </div>
                </div>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Hinweis:</strong> Eine Reform des Eigenmietwerts wird seit Jahren diskutiert.
                      Ein Systemwechsel (Abschaffung fur Erstwohnsitz) ist politisch in Vorbereitung,
                      jedoch noch nicht beschlossen.
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unterhaltskosten" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator className="h-5 w-5 text-primary" />
                  Unterhaltskosten: Pauschal vs. Effektiv
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <Badge className="bg-blue-100 text-blue-800 mb-2">Pauschalabzug</Badge>
                    <div className="space-y-2 text-sm">
                      <p><strong>Gebaude bis 10 Jahre:</strong> 10 % des Bruttomietwerts</p>
                      <p><strong>Gebaude uber 10 Jahre:</strong> 20 % des Bruttomietwerts</p>
                      <p className="text-muted-foreground mt-2">
                        Einfacher, kein Nachweis notwendig. Vorteilhaft bei geringen
                        tatsachlichen Kosten.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Badge className="bg-emerald-100 text-emerald-800 mb-2">Effektive Kosten</Badge>
                    <div className="space-y-2 text-sm">
                      <p><strong>Tatsachliche Unterhaltskosten</strong></p>
                      <p>Alle Belege mussen aufbewahrt werden</p>
                      <p className="text-muted-foreground mt-2">
                        Vorteilhaft bei hohen Unterhaltskosten, Sanierungen oder grosseren Reparaturen.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  * Der Wechsel zwischen Pauschal- und effektivem Abzug ist jahrlich moglich.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grundstueckgewinn" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Grundstuckgewinnsteuer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Die Grundstuckgewinnsteuer wird beim Verkauf einer Liegenschaft auf den Gewinn
                  erhoben. Sie ist kantonal geregelt und sinkt mit zunehmender Haltedauer
                  (degressiver Tarif). Bei kurzer Besitzdauer kann ein Spekulationszuschlag
                  anfallen.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Kurzfristig (&lt;2 Jahre)</p>
                    <p className="text-2xl font-bold text-destructive mt-1">Bis 60 %</p>
                    <p className="text-xs text-muted-foreground mt-1">mit Spekulationszuschlag</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Mittelfristig (5-10 Jahre)</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">20-35 %</p>
                    <p className="text-xs text-muted-foreground mt-1">je nach Kanton</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Langfristig (&gt;20 Jahre)</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">0-15 %</p>
                    <p className="text-xs text-muted-foreground mt-1">stark reduziert</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kantone" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Kantonsvergleich (Platzhalterdaten)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kanton</TableHead>
                      <TableHead>Eigenmietwert</TableHead>
                      <TableHead>Liegenschaftssteuer</TableHead>
                      <TableHead>Grundstuckgewinnsteuer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kantonsvergleich.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.kanton}</TableCell>
                        <TableCell>{row.eigenmietwert}</TableCell>
                        <TableCell>{row.liegenschaftssteuer}</TableCell>
                        <TableCell>{row.grundstuckgewinnsteuer}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-4">
                  * Platzhalterdaten. Verbindliche Informationen bei der kantonalen Steuerverwaltung.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
