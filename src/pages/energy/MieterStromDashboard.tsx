import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Sun,
  Users,
  Zap,
  Euro,
  TrendingUp,
  Building2,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Teilnehmer {
  id: string;
  name: string;
  einheit: string;
  teilnahme: boolean;
  verbrauch: number;
  anteilPV: number;
  netzstrom: number;
  kostenPV: number;
  kostenNetz: number;
}

const teilnehmer: Teilnehmer[] = [
  { id: "1", name: "Müller, Anna", einheit: "Whg. 1 EG", teilnahme: true, verbrauch: 2800, anteilPV: 1680, netzstrom: 1120, kostenPV: 403.2, kostenNetz: 364.0 },
  { id: "2", name: "Schmidt, Thomas", einheit: "Whg. 2 EG", teilnahme: true, verbrauch: 1900, anteilPV: 1140, netzstrom: 760, kostenPV: 273.6, kostenNetz: 247.0 },
  { id: "3", name: "Weber, Lisa", einheit: "Whg. 3 OG", teilnahme: true, verbrauch: 3200, anteilPV: 1920, netzstrom: 1280, kostenPV: 460.8, kostenNetz: 416.0 },
  { id: "4", name: "Fischer, Klaus", einheit: "Whg. 4 OG", teilnahme: false, verbrauch: 2400, anteilPV: 0, netzstrom: 2400, kostenPV: 0, kostenNetz: 780.0 },
  { id: "5", name: "Braun, Maria", einheit: "Whg. 5 DG", teilnahme: true, verbrauch: 2100, anteilPV: 1260, netzstrom: 840, kostenPV: 302.4, kostenNetz: 273.0 },
  { id: "6", name: "Wagner, Peter", einheit: "Whg. 6 DG", teilnahme: true, verbrauch: 1800, anteilPV: 1080, netzstrom: 720, kostenPV: 259.2, kostenNetz: 234.0 },
];

const monate = [
  { value: "2026-03", label: "März 2026" },
  { value: "2026-02", label: "Februar 2026" },
  { value: "2026-01", label: "Januar 2026" },
  { value: "2025-12", label: "Dezember 2025" },
];

export default function MieterStromDashboard() {
  const [selectedMonat, setSelectedMonat] = useState("2026-03");

  const pvPreis = 24.0; // ct/kWh
  const netzPreis = 32.5; // ct/kWh
  const einspeiseverguetung = 8.2; // ct/kWh

  const gesamtErzeugung = 4200;
  const gesamtVerbrauch = teilnehmer.reduce((sum, t) => sum + t.verbrauch, 0);
  const gesamtPV = teilnehmer.reduce((sum, t) => sum + t.anteilPV, 0);
  const teilnehmerCount = teilnehmer.filter((t) => t.teilnahme).length;
  const einspeisung = gesamtErzeugung - gesamtPV;
  const einspeisungEuro = (einspeisung * einspeiseverguetung) / 100;

  const gesamtKostenPV = teilnehmer.reduce((sum, t) => sum + t.kostenPV, 0);
  const gesamtKostenNetz = teilnehmer.reduce((sum, t) => sum + t.kostenNetz, 0);

  return (
    <MainLayout
      title="Mieterstrom"
      breadcrumbs={[
        { label: "Energie", href: "/energy" },
        { label: "Mieterstrom" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Mieterstrom-Dashboard"
          subtitle="Übersicht über das Mieterstrom-Modell: Erzeugung, Verbrauch und Abrechnung."
        />

        {/* Period Selector */}
        <div className="flex items-center gap-4">
          <Select value={selectedMonat} onValueChange={setSelectedMonat}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monate.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">PV-Erzeugung</p>
                  <p className="text-2xl font-bold">{gesamtErzeugung.toLocaleString("de-DE")} kWh</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Sun className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gesamtverbrauch</p>
                  <p className="text-2xl font-bold">{gesamtVerbrauch.toLocaleString("de-DE")} kWh</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teilnehmer</p>
                  <p className="text-2xl font-bold">
                    {teilnehmerCount}/{teilnehmer.length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Netzeinspeisung</p>
                  <p className="text-2xl font-bold">{einspeisung.toLocaleString("de-DE")} kWh</p>
                  <p className="text-xs text-muted-foreground">
                    = {einspeisungEuro.toFixed(2)} € Vergütung
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Erzeugung vs. Verbrauch */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Erzeugung vs. Verbrauch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">PV-Erzeugung</span>
                  <span className="font-medium">{gesamtErzeugung.toLocaleString("de-DE")} kWh</span>
                </div>
                <div className="w-full bg-muted rounded-full h-6">
                  <div
                    className="bg-yellow-400 h-6 rounded-full flex items-center justify-end pr-2 text-xs font-medium"
                    style={{ width: `${(gesamtErzeugung / Math.max(gesamtErzeugung, gesamtVerbrauch)) * 100}%` }}
                  >
                    {gesamtErzeugung.toLocaleString("de-DE")}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Direktverbrauch (Mieterstrom)</span>
                  <span className="font-medium">{gesamtPV.toLocaleString("de-DE")} kWh</span>
                </div>
                <div className="w-full bg-muted rounded-full h-6">
                  <div
                    className="bg-green-400 h-6 rounded-full flex items-center justify-end pr-2 text-xs font-medium"
                    style={{ width: `${(gesamtPV / Math.max(gesamtErzeugung, gesamtVerbrauch)) * 100}%` }}
                  >
                    {gesamtPV.toLocaleString("de-DE")}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Netzstrom-Restbezug</span>
                  <span className="font-medium">
                    {(gesamtVerbrauch - gesamtPV).toLocaleString("de-DE")} kWh
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-6">
                  <div
                    className="bg-blue-400 h-6 rounded-full flex items-center justify-end pr-2 text-xs font-medium"
                    style={{ width: `${((gesamtVerbrauch - gesamtPV) / Math.max(gesamtErzeugung, gesamtVerbrauch)) * 100}%` }}
                  >
                    {(gesamtVerbrauch - gesamtPV).toLocaleString("de-DE")}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vergütungssätze */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Vergütungssätze
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border text-center">
                <p className="text-sm text-muted-foreground">Mieterstrom-Preis</p>
                <p className="text-2xl font-bold text-green-600">{pvPreis.toFixed(1)} ct/kWh</p>
                <p className="text-xs text-muted-foreground">
                  {((1 - pvPreis / netzPreis) * 100).toFixed(0)}% günstiger als Netzstrom
                </p>
              </div>
              <div className="p-4 rounded-lg border text-center">
                <p className="text-sm text-muted-foreground">Netzstrom-Preis</p>
                <p className="text-2xl font-bold">{netzPreis.toFixed(1)} ct/kWh</p>
                <p className="text-xs text-muted-foreground">aktueller Tarif</p>
              </div>
              <div className="p-4 rounded-lg border text-center">
                <p className="text-sm text-muted-foreground">Einspeisevergütung</p>
                <p className="text-2xl font-bold text-orange-600">{einspeiseverguetung.toFixed(1)} ct/kWh</p>
                <p className="text-xs text-muted-foreground">für Überschuss</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teilnehmer / Abrechnungsübersicht */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teilnehmer & Kostenverteilung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mieter</TableHead>
                  <TableHead>Einheit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Gesamt kWh</TableHead>
                  <TableHead className="text-right">PV-Anteil</TableHead>
                  <TableHead className="text-right">Netzstrom</TableHead>
                  <TableHead className="text-right">Kosten PV</TableHead>
                  <TableHead className="text-right">Kosten Netz</TableHead>
                  <TableHead className="text-right">Gesamt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teilnehmer.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.einheit}</TableCell>
                    <TableCell>
                      {t.teilnahme ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          <XCircle className="h-3 w-3 mr-1" />
                          Kein TN
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{t.verbrauch.toLocaleString("de-DE")}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {t.anteilPV > 0 ? t.anteilPV.toLocaleString("de-DE") : "-"}
                    </TableCell>
                    <TableCell className="text-right">{t.netzstrom.toLocaleString("de-DE")}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {t.kostenPV > 0 ? `${t.kostenPV.toFixed(2)} €` : "-"}
                    </TableCell>
                    <TableCell className="text-right">{t.kostenNetz.toFixed(2)} €</TableCell>
                    <TableCell className="text-right font-bold">
                      {(t.kostenPV + t.kostenNetz).toFixed(2)} €
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold border-t-2">
                  <TableCell colSpan={3}>Gesamt</TableCell>
                  <TableCell className="text-right">{gesamtVerbrauch.toLocaleString("de-DE")}</TableCell>
                  <TableCell className="text-right text-green-600">{gesamtPV.toLocaleString("de-DE")}</TableCell>
                  <TableCell className="text-right">{(gesamtVerbrauch - gesamtPV).toLocaleString("de-DE")}</TableCell>
                  <TableCell className="text-right text-green-600">{gesamtKostenPV.toFixed(2)} €</TableCell>
                  <TableCell className="text-right">{gesamtKostenNetz.toFixed(2)} €</TableCell>
                  <TableCell className="text-right">{(gesamtKostenPV + gesamtKostenNetz).toFixed(2)} €</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
