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
  Sun,
  Users,
  Zap,
  Euro,
  TrendingUp,
  Battery,
  FileText,
  BarChart3,
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  unit: string;
  consumption: number;
  solarShare: number;
  gridShare: number;
  savings: number;
  active: boolean;
}

const placeholderParticipants: Participant[] = [
  { id: "1", name: "Schmidt, Maria", unit: "Whg. 1 EG", consumption: 210, solarShare: 145, gridShare: 65, savings: 28, active: true },
  { id: "2", name: "Müller, Thomas", unit: "Whg. 2 EG", consumption: 185, solarShare: 120, gridShare: 65, savings: 23, active: true },
  { id: "3", name: "Wagner, Anna", unit: "Whg. 3 OG", consumption: 240, solarShare: 160, gridShare: 80, savings: 31, active: true },
  { id: "4", name: "Becker, Hans", unit: "Whg. 4 OG", consumption: 195, solarShare: 130, gridShare: 65, savings: 25, active: true },
  { id: "5", name: "Fischer, Laura", unit: "Whg. 5 DG", consumption: 170, solarShare: 110, gridShare: 60, savings: 21, active: true },
  { id: "6", name: "Weber, Klaus", unit: "Whg. 6 DG", consumption: 220, solarShare: 150, gridShare: 70, savings: 29, active: false },
];

const monthlyData = [
  { month: "Okt", erzeugung: 680, verbrauch: 1100 },
  { month: "Nov", erzeugung: 420, verbrauch: 1200 },
  { month: "Dez", erzeugung: 280, verbrauch: 1350 },
  { month: "Jan", erzeugung: 320, verbrauch: 1280 },
  { month: "Feb", erzeugung: 480, verbrauch: 1180 },
  { month: "Mär", erzeugung: 750, verbrauch: 1050 },
];

export default function MieterStromDashboard() {
  const [selectedBuilding, setSelectedBuilding] = useState("musterstr");

  const activeParticipants = placeholderParticipants.filter((p) => p.active);
  const totalErzeugung = 750;
  const totalVerbrauch = activeParticipants.reduce((s, p) => s + p.consumption, 0);
  const totalSolarShare = activeParticipants.reduce((s, p) => s + p.solarShare, 0);
  const eigenverbrauchsquote = totalErzeugung > 0
    ? Math.round((totalSolarShare / totalErzeugung) * 100)
    : 0;
  const totalSavings = activeParticipants.reduce((s, p) => s + p.savings, 0);
  const maxBar = Math.max(...monthlyData.map((d) => Math.max(d.erzeugung, d.verbrauch)));

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
          subtitle="Übersicht über das Mieterstrom-Modell Ihrer Gebäude."
          actions={
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="musterstr">Musterstraße 10</SelectItem>
                <SelectItem value="hauptweg">Hauptweg 5</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teilnehmer</p>
                  <p className="text-2xl font-bold">
                    {activeParticipants.length}/{placeholderParticipants.length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gesamterzeugung</p>
                  <p className="text-2xl font-bold">{totalErzeugung} kWh</p>
                  <p className="text-xs text-muted-foreground">Aktueller Monat</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Eigenverbrauchsquote</p>
                  <p className="text-2xl font-bold">{eigenverbrauchsquote}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Battery className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vergütung (Monat)</p>
                  <p className="text-2xl font-bold">{totalSavings} EUR</p>
                  <p className="text-xs text-muted-foreground">Gesamtersparnis Mieter</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Euro className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PV-Erzeugung vs. Verbrauch */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              PV-Erzeugung vs. Verbrauch (letzte 6 Monate)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 h-48">
              {monthlyData.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end" style={{ height: "160px" }}>
                    <div
                      className="flex-1 bg-yellow-400 rounded-t"
                      style={{ height: `${(d.erzeugung / maxBar) * 100}%` }}
                      title={`Erzeugung: ${d.erzeugung} kWh`}
                    />
                    <div
                      className="flex-1 bg-blue-400 rounded-t"
                      style={{ height: `${(d.verbrauch / maxBar) * 100}%` }}
                      title={`Verbrauch: ${d.verbrauch} kWh`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{d.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-yellow-400" />
                <span className="text-sm text-muted-foreground">PV-Erzeugung (kWh)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-blue-400" />
                <span className="text-sm text-muted-foreground">Verbrauch (kWh)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teilnehmer List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teilnehmende Mieter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Mieter</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Einheit</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Verbrauch</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Solar-Anteil</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Netz-Anteil</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Ersparnis</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {placeholderParticipants.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{p.name}</td>
                      <td className="py-3 px-4">{p.unit}</td>
                      <td className="py-3 px-4 text-right">{p.consumption} kWh</td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-green-600 font-medium">{p.solarShare} kWh</span>
                      </td>
                      <td className="py-3 px-4 text-right">{p.gridShare} kWh</td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">
                        {p.savings} EUR
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant="outline"
                          className={
                            p.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {p.active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Abrechnungsübersicht */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Abrechnungsübersicht
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">Mieterstrom-Tarif</p>
                <p className="text-2xl font-bold">24,5 ct/kWh</p>
                <p className="text-xs text-muted-foreground">inkl. aller Umlagen</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">Netz-Vergleichstarif</p>
                <p className="text-2xl font-bold">32,0 ct/kWh</p>
                <p className="text-xs text-muted-foreground">Grundversorger</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">Vorteil Mieterstrom</p>
                <p className="text-2xl font-bold text-green-600">-23%</p>
                <p className="text-xs text-muted-foreground">Ersparnis zum Grundversorger</p>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gelieferter Mieterstrom (Monat)</span>
                <span className="font-medium">{totalSolarShare} kWh</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Einnahmen aus Mieterstrom</span>
                <span className="font-medium">{Math.round(totalSolarShare * 0.245)} EUR</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Netzeinspeisung (Überschuss)</span>
                <span className="font-medium">{totalErzeugung - totalSolarShare} kWh</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Einspeisevergütung</span>
                <span className="font-medium">
                  {Math.round((totalErzeugung - totalSolarShare) * 0.082)} EUR
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mieterstromvertrag Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Mieterstromvertrag
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Der Mieterstromvertrag regelt die Lieferung von lokal erzeugtem Solarstrom an die
              Mieter im Gebäude gemäß dem Mieterstromgesetz (§ 42a EnWG).
            </p>
            <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
              <p><strong>Wesentliche Vertragsbestandteile:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Laufzeit: 12 Monate, automatische Verlängerung</li>
                <li>Kündigungsfrist: 1 Monat zum Vertragsende</li>
                <li>Preisgarantie: Mieterstromtarif max. 90% des Grundversorgertarifs</li>
                <li>Vollversorgung: Reststrom wird aus dem Netz bezogen</li>
                <li>Keine Verpflichtung: Mieter können frei wählen</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Vertragsmuster anzeigen
              </Button>
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Wirtschaftlichkeitsrechnung
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
