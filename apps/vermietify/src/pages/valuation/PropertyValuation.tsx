import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Building2, Calculator, TrendingUp, Scale } from "lucide-react";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Vervielfaeltiger = (1 - (1 + i)^-n) / i
function calcVervielfaeltiger(liegenschaftszins: number, restnutzungsdauer: number): number {
  if (liegenschaftszins <= 0) return restnutzungsdauer;
  const i = liegenschaftszins / 100;
  return (1 - Math.pow(1 + i, -restnutzungsdauer)) / i;
}

// Placeholder Vervielfaeltiger table
const vervielfaeltigerData = [
  { zins: 3.0, rnd20: 14.88, rnd30: 19.6, rnd40: 23.11, rnd50: 25.73 },
  { zins: 4.0, rnd20: 13.59, rnd30: 17.29, rnd40: 19.79, rnd50: 21.48 },
  { zins: 5.0, rnd20: 12.46, rnd30: 15.37, rnd40: 17.16, rnd50: 18.26 },
  { zins: 6.0, rnd20: 11.47, rnd30: 13.76, rnd40: 15.05, rnd50: 15.76 },
  { zins: 7.0, rnd20: 10.59, rnd30: 12.41, rnd40: 13.33, rnd50: 13.8 },
];

export default function PropertyValuation() {
  // Ertragswert
  const [jahresreinertrag, setJahresreinertrag] = useState(24000);
  const [liegenschaftszins, setLiegenschaftszins] = useState(5.0);
  const [restnutzungsdauer, setRestnutzungsdauer] = useState(40);
  const [bodenwert, setBodenwert] = useState(80000);

  // Vergleichswert
  const [vergleichPreisProQm, setVergleichPreisProQm] = useState(3500);
  const [vergleichFlaeche, setVergleichFlaeche] = useState(75);

  // Sachwert
  const [herstellungskosten, setHerstellungskosten] = useState(250000);
  const [alterswertminderung, setAlterswertminderung] = useState(20);
  const [sachwertBodenwert, setSachwertBodenwert] = useState(80000);

  const ertragswert = useMemo(() => {
    const vervielfaeltiger = calcVervielfaeltiger(liegenschaftszins, restnutzungsdauer);
    const ertragswertGebaeude = jahresreinertrag * vervielfaeltiger;
    const gesamt = ertragswertGebaeude + bodenwert;
    return { vervielfaeltiger, ertragswertGebaeude, gesamt };
  }, [jahresreinertrag, liegenschaftszins, restnutzungsdauer, bodenwert]);

  const vergleichswert = useMemo(() => {
    return vergleichPreisProQm * vergleichFlaeche;
  }, [vergleichPreisProQm, vergleichFlaeche]);

  const sachwert = useMemo(() => {
    const wertminderung = herstellungskosten * (alterswertminderung / 100);
    const zeitwert = herstellungskosten - wertminderung;
    return zeitwert + sachwertBodenwert;
  }, [herstellungskosten, alterswertminderung, sachwertBodenwert]);

  return (
    <MainLayout
      title="Immobilienbewertung"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Bewertung" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Immobilienbewertung"
          subtitle="Berechnen Sie den Wert Ihrer Immobilie mit drei verschiedenen Bewertungsverfahren."
        />

        <Tabs defaultValue="ertragswert">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ertragswert">Ertragswertverfahren</TabsTrigger>
            <TabsTrigger value="vergleichswert">Vergleichswertverfahren</TabsTrigger>
            <TabsTrigger value="sachwert">Sachwertverfahren</TabsTrigger>
          </TabsList>

          {/* Ertragswertverfahren */}
          <TabsContent value="ertragswert">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="h-5 w-5 text-primary" />
                    Eingaben - Ertragswertverfahren
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Jahresreinertrag (EUR)</Label>
                    <Input
                      type="number"
                      value={jahresreinertrag}
                      onChange={(e) => setJahresreinertrag(Number(e.target.value))}
                      min={0}
                      step={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Rohertrag abzuglich Bewirtschaftungskosten
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Liegenschaftszins (%)</Label>
                    <Input
                      type="number"
                      value={liegenschaftszins}
                      onChange={(e) => setLiegenschaftszins(Number(e.target.value))}
                      min={0}
                      step={0.5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Restnutzungsdauer (Jahre)</Label>
                    <Input
                      type="number"
                      value={restnutzungsdauer}
                      onChange={(e) => setRestnutzungsdauer(Number(e.target.value))}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bodenwert (EUR)</Label>
                    <Input
                      type="number"
                      value={bodenwert}
                      onChange={(e) => setBodenwert(Number(e.target.value))}
                      min={0}
                      step={5000}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="border-primary/20">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Ertragswert</p>
                    <p className="text-4xl font-bold text-primary mt-1">
                      {formatEuro(ertragswert.gesamt)}
                    </p>
                  </CardContent>
                </Card>

                {/* Calculation steps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Berechnungsschritte</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Jahresreinertrag</span>
                      <span className="font-medium">{formatEuro(jahresreinertrag)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Vervielfaltiger ({liegenschaftszins}%, {restnutzungsdauer} J.)
                      </span>
                      <span className="font-medium">{ertragswert.vervielfaeltiger.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground">Ertragswert Gebaude</span>
                      <span className="font-medium">{formatEuro(ertragswert.ertragswertGebaeude)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">+ Bodenwert</span>
                      <span className="font-medium">{formatEuro(bodenwert)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2 font-bold">
                      <span>Ertragswert gesamt</span>
                      <span className="text-primary">{formatEuro(ertragswert.gesamt)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Vervielfaeltiger Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Vervielfaltiger-Tabelle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Zins</TableHead>
                          <TableHead>20 J.</TableHead>
                          <TableHead>30 J.</TableHead>
                          <TableHead>40 J.</TableHead>
                          <TableHead>50 J.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vervielfaeltigerData.map((row) => (
                          <TableRow key={row.zins}>
                            <TableCell className="font-medium">{row.zins} %</TableCell>
                            <TableCell>{row.rnd20}</TableCell>
                            <TableCell>{row.rnd30}</TableCell>
                            <TableCell>{row.rnd40}</TableCell>
                            <TableCell>{row.rnd50}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Vergleichswertverfahren */}
          <TabsContent value="vergleichswert">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scale className="h-5 w-5 text-primary" />
                    Eingaben - Vergleichswertverfahren
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Vergleichspreis pro m2 (EUR)</Label>
                    <Input
                      type="number"
                      value={vergleichPreisProQm}
                      onChange={(e) => setVergleichPreisProQm(Number(e.target.value))}
                      min={0}
                      step={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      Durchschnittlicher Quadratmeterpreis vergleichbarer Immobilien
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Wohnflache (m2)</Label>
                    <Input
                      type="number"
                      value={vergleichFlaeche}
                      onChange={(e) => setVergleichFlaeche(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="p-6 text-center flex flex-col justify-center h-full">
                  <p className="text-sm text-muted-foreground">Vergleichswert</p>
                  <p className="text-4xl font-bold text-primary mt-1">
                    {formatEuro(vergleichswert)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {vergleichPreisProQm.toLocaleString("de-DE")} EUR/m2 x {vergleichFlaeche} m2
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sachwertverfahren */}
          <TabsContent value="sachwert">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                    Eingaben - Sachwertverfahren
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Herstellungskosten Gebaude (EUR)</Label>
                    <Input
                      type="number"
                      value={herstellungskosten}
                      onChange={(e) => setHerstellungskosten(Number(e.target.value))}
                      min={0}
                      step={10000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alterswertminderung (%)</Label>
                    <Input
                      type="number"
                      value={alterswertminderung}
                      onChange={(e) => setAlterswertminderung(Number(e.target.value))}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bodenwert (EUR)</Label>
                    <Input
                      type="number"
                      value={sachwertBodenwert}
                      onChange={(e) => setSachwertBodenwert(Number(e.target.value))}
                      min={0}
                      step={5000}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="border-primary/20">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Sachwert</p>
                    <p className="text-4xl font-bold text-primary mt-1">
                      {formatEuro(sachwert)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Berechnungsschritte</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Herstellungskosten</span>
                      <span className="font-medium">{formatEuro(herstellungskosten)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">- Alterswertminderung ({alterswertminderung}%)</span>
                      <span className="font-medium text-destructive">
                        - {formatEuro(herstellungskosten * (alterswertminderung / 100))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground">Zeitwert Gebaude</span>
                      <span className="font-medium">
                        {formatEuro(herstellungskosten * (1 - alterswertminderung / 100))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">+ Bodenwert</span>
                      <span className="font-medium">{formatEuro(sachwertBodenwert)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2 font-bold">
                      <span>Sachwert gesamt</span>
                      <span className="text-primary">{formatEuro(sachwert)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Comparison of all three methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Vergleich der Bewertungsverfahren
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Ertragswert</p>
                <p className="text-2xl font-bold text-primary mt-1">{formatEuro(ertragswert.gesamt)}</p>
                <Badge variant="outline" className="mt-2">Investorsicht</Badge>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Vergleichswert</p>
                <p className="text-2xl font-bold text-primary mt-1">{formatEuro(vergleichswert)}</p>
                <Badge variant="outline" className="mt-2">Marktsicht</Badge>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Sachwert</p>
                <p className="text-2xl font-bold text-primary mt-1">{formatEuro(sachwert)}</p>
                <Badge variant="outline" className="mt-2">Substanzsicht</Badge>
              </div>
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Durchschnitt aller drei Verfahren:</strong>{" "}
                <span className="text-primary font-bold text-lg">
                  {formatEuro((ertragswert.gesamt + vergleichswert + sachwert) / 3)}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
