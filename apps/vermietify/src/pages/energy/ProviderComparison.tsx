import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ArrowUpDown,
  TrendingDown,
  Award,
  Zap,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  anbieter: string;
  tarifname: string;
  grundpreis: number;
  arbeitspreis: number;
  gesamtkosten: number;
  oekostrom: boolean;
  kuendigungsfrist: string;
  vertragslaufzeit: string;
  bewertung: number;
}

const mockProviders: Provider[] = [
  {
    id: "1",
    anbieter: "Grünstrom GmbH",
    tarifname: "NaturPur 12",
    grundpreis: 9.9,
    arbeitspreis: 29.8,
    gesamtkosten: 1107.6,
    oekostrom: true,
    kuendigungsfrist: "4 Wochen",
    vertragslaufzeit: "12 Monate",
    bewertung: 4.5,
  },
  {
    id: "2",
    anbieter: "Stadtwerke Regional",
    tarifname: "Basis Strom",
    grundpreis: 11.5,
    arbeitspreis: 31.2,
    gesamtkosten: 1186.0,
    oekostrom: false,
    kuendigungsfrist: "6 Wochen",
    vertragslaufzeit: "12 Monate",
    bewertung: 3.8,
  },
  {
    id: "3",
    anbieter: "E.ON Energie",
    tarifname: "Fix12 Strom",
    grundpreis: 12.0,
    arbeitspreis: 33.5,
    gesamtkosten: 1264.0,
    oekostrom: false,
    kuendigungsfrist: "6 Wochen",
    vertragslaufzeit: "12 Monate",
    bewertung: 4.0,
  },
  {
    id: "4",
    anbieter: "Vattenfall",
    tarifname: "Natur12",
    grundpreis: 10.5,
    arbeitspreis: 30.9,
    gesamtkosten: 1161.0,
    oekostrom: true,
    kuendigungsfrist: "4 Wochen",
    vertragslaufzeit: "12 Monate",
    bewertung: 4.2,
  },
  {
    id: "5",
    anbieter: "EnBW",
    tarifname: "Komfort Strom",
    grundpreis: 13.0,
    arbeitspreis: 32.0,
    gesamtkosten: 1236.0,
    oekostrom: false,
    kuendigungsfrist: "3 Monate",
    vertragslaufzeit: "24 Monate",
    bewertung: 3.5,
  },
];

type SortField = "gesamtkosten" | "grundpreis" | "arbeitspreis";

export default function ProviderComparison() {
  const [plz, setPlz] = useState("80331");
  const [verbrauch, setVerbrauch] = useState("3500");
  const [typ, setTyp] = useState("strom");
  const [sortBy, setSortBy] = useState<SortField>("gesamtkosten");
  const [hasSearched, setHasSearched] = useState(true);

  const currentTariffCost = 1320;

  const sorted = [...mockProviders].sort((a, b) => a[sortBy] - b[sortBy]);
  const cheapest = sorted[0];

  const handleSort = (field: SortField) => {
    setSortBy(field);
  };

  return (
    <MainLayout
      title="Anbietervergleich"
      breadcrumbs={[
        { label: "Energie", href: "/energy" },
        { label: "Anbietervergleich" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Energieanbieter-Vergleich"
          subtitle="Vergleichen Sie Energieanbieter und finden Sie den günstigsten Tarif."
        />

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Vergleichsparameter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>PLZ</Label>
                <Input
                  value={plz}
                  onChange={(e) => setPlz(e.target.value)}
                  placeholder="z.B. 80331"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Jahresverbrauch (kWh)</Label>
                <Input
                  type="number"
                  value={verbrauch}
                  onChange={(e) => setVerbrauch(e.target.value)}
                  placeholder="z.B. 3500"
                />
              </div>
              <div className="space-y-2">
                <Label>Energietyp</Label>
                <Select value={typ} onValueChange={setTyp}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strom">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Strom
                      </div>
                    </SelectItem>
                    <SelectItem value="gas">
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4" />
                        Gas
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={() => setHasSearched(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Vergleichen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasSearched && (
          <>
            {/* Savings Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-green-300 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Günstigster Tarif</p>
                      <p className="text-xl font-bold text-green-800">{cheapest.anbieter}</p>
                      <p className="text-sm text-green-600">{cheapest.tarifname}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                      <Award className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gesamtkosten/Jahr</p>
                      <p className="text-2xl font-bold">{cheapest.gesamtkosten.toLocaleString("de-DE")} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Ersparnis vs. aktueller Tarif
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {(currentTariffCost - cheapest.gesamtkosten).toLocaleString("de-DE")} €
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aktueller Tarif: {currentTariffCost.toLocaleString("de-DE")} €/Jahr
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingDown className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Ergebnisse für PLZ {plz} · {parseInt(verbrauch).toLocaleString("de-DE")} kWh/Jahr
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Anbieter / Tarif</TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={() => handleSort("grundpreis")}
                        >
                          Grundpreis
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={() => handleSort("arbeitspreis")}
                        >
                          Arbeitspreis
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={() => handleSort("gesamtkosten")}
                        >
                          Gesamtkosten
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>Ersparnis</TableHead>
                      <TableHead>Laufzeit</TableHead>
                      <TableHead>Ökostrom</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((provider, idx) => {
                      const isCheapest = provider.id === cheapest.id;
                      const ersparnis = currentTariffCost - provider.gesamtkosten;
                      return (
                        <TableRow
                          key={provider.id}
                          className={cn(isCheapest && "bg-green-50")}
                        >
                          <TableCell>
                            {isCheapest ? (
                              <Badge className="bg-green-600">1</Badge>
                            ) : (
                              <span className="text-muted-foreground">{idx + 1}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{provider.anbieter}</p>
                              <p className="text-sm text-muted-foreground">{provider.tarifname}</p>
                            </div>
                          </TableCell>
                          <TableCell>{provider.grundpreis.toFixed(2)} €/Monat</TableCell>
                          <TableCell>{provider.arbeitspreis.toFixed(1)} ct/kWh</TableCell>
                          <TableCell className="font-medium">
                            {provider.gesamtkosten.toLocaleString("de-DE")} €
                          </TableCell>
                          <TableCell>
                            {ersparnis > 0 ? (
                              <span className="text-green-600 font-medium">
                                -{ersparnis.toLocaleString("de-DE")} €
                              </span>
                            ) : (
                              <span className="text-red-600">
                                +{Math.abs(ersparnis).toLocaleString("de-DE")} €
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{provider.vertragslaufzeit}</TableCell>
                          <TableCell>
                            {provider.oekostrom ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800">Ja</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-muted text-muted-foreground">Nein</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
