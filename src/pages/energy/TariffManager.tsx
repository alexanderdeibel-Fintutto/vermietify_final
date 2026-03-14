import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Zap,
  Flame,
  Thermometer,
  Plus,
  AlertTriangle,
  TrendingDown,
  Euro,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tarif {
  id: string;
  typ: "Strom" | "Gas" | "Fernwärme";
  anbieter: string;
  tarifname: string;
  grundpreis: number;
  arbeitspreis: number;
  vertragslaufzeit: string;
  kuendigungsfrist: string;
  vertragsende: string;
  gebaeude: string;
}

const tarife: Tarif[] = [
  {
    id: "1",
    typ: "Strom",
    anbieter: "Stadtwerke München",
    tarifname: "Ökostrom Basis",
    grundpreis: 12.5,
    arbeitspreis: 32.5,
    vertragslaufzeit: "12 Monate",
    kuendigungsfrist: "6 Wochen",
    vertragsende: "2026-06-30",
    gebaeude: "Musterstraße 10",
  },
  {
    id: "2",
    typ: "Gas",
    anbieter: "E.ON Energie",
    tarifname: "Erdgas Komfort",
    grundpreis: 15.0,
    arbeitspreis: 8.9,
    vertragslaufzeit: "24 Monate",
    kuendigungsfrist: "3 Monate",
    vertragsende: "2027-01-31",
    gebaeude: "Musterstraße 10",
  },
  {
    id: "3",
    typ: "Fernwärme",
    anbieter: "Fernwärme Berlin",
    tarifname: "Wärme Standard",
    grundpreis: 42.0,
    arbeitspreis: 9.8,
    vertragslaufzeit: "10 Jahre",
    kuendigungsfrist: "12 Monate",
    vertragsende: "2032-12-31",
    gebaeude: "Hauptweg 5",
  },
  {
    id: "4",
    typ: "Strom",
    anbieter: "Vattenfall",
    tarifname: "Natur12 Strom",
    grundpreis: 10.9,
    arbeitspreis: 34.2,
    vertragslaufzeit: "12 Monate",
    kuendigungsfrist: "4 Wochen",
    vertragsende: "2026-04-15",
    gebaeude: "Parkallee 22",
  },
];

const typConfig = {
  Strom: { icon: Zap, color: "text-yellow-600", bg: "bg-yellow-100" },
  Gas: { icon: Flame, color: "text-orange-600", bg: "bg-orange-100" },
  Fernwärme: { icon: Thermometer, color: "text-red-600", bg: "bg-red-100" },
};

function isExpiringSoon(dateStr: string): boolean {
  const end = new Date(dateStr);
  const threeMonths = new Date();
  threeMonths.setMonth(threeMonths.getMonth() + 3);
  return end <= threeMonths && end >= new Date();
}

export default function TariffManager() {
  const [showDialog, setShowDialog] = useState(false);

  const expiringSoon = tarife.filter((t) => isExpiringSoon(t.vertragsende));
  const avgArbeitspreis = tarife
    .filter((t) => t.typ === "Strom")
    .reduce((sum, t) => sum + t.arbeitspreis, 0) / tarife.filter((t) => t.typ === "Strom").length;

  return (
    <MainLayout
      title="Tarifverwaltung"
      breadcrumbs={[
        { label: "Energie", href: "/energy" },
        { label: "Tarifverwaltung" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Tarifverwaltung"
          subtitle="Verwalten Sie Ihre Energietarife und behalten Sie Vertragslaufzeiten im Blick."
          actions={
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neuen Tarif anlegen
            </Button>
          }
        />

        {/* Alert for expiring contracts */}
        {expiringSoon.length > 0 && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {expiringSoon.length} {expiringSoon.length === 1 ? "Vertrag läuft" : "Verträge laufen"} in den nächsten 3 Monaten aus
                  </p>
                  <p className="text-sm text-yellow-700">
                    {expiringSoon.map((t) => `${t.tarifname} (${t.gebaeude})`).join(", ")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aktive Tarife</p>
                  <p className="text-2xl font-bold">{tarife.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Euro className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ø Strompreis</p>
                  <p className="text-2xl font-bold">{avgArbeitspreis.toFixed(1)} ct/kWh</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Einsparpotenzial</p>
                  <p className="text-2xl font-bold text-green-600">~480 €/Jahr</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tariff Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tarifübersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Anbieter / Tarif</TableHead>
                  <TableHead>Gebäude</TableHead>
                  <TableHead className="text-right">Grundpreis</TableHead>
                  <TableHead className="text-right">Arbeitspreis</TableHead>
                  <TableHead>Laufzeit</TableHead>
                  <TableHead>Kündigungsfrist</TableHead>
                  <TableHead>Vertragsende</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarife.map((tarif) => {
                  const config = typConfig[tarif.typ];
                  const Icon = config.icon;
                  const expiring = isExpiringSoon(tarif.vertragsende);
                  return (
                    <TableRow key={tarif.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", config.bg)}>
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>
                          <span className="font-medium">{tarif.typ}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tarif.anbieter}</p>
                          <p className="text-sm text-muted-foreground">{tarif.tarifname}</p>
                        </div>
                      </TableCell>
                      <TableCell>{tarif.gebaeude}</TableCell>
                      <TableCell className="text-right">{tarif.grundpreis.toFixed(2)} €/Monat</TableCell>
                      <TableCell className="text-right">{tarif.arbeitspreis.toFixed(1)} ct/kWh</TableCell>
                      <TableCell>{tarif.vertragslaufzeit}</TableCell>
                      <TableCell>{tarif.kuendigungsfrist}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{new Date(tarif.vertragsende).toLocaleDateString("de-DE")}</span>
                          {expiring && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Bald
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* New Tariff Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Tarif anlegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Energietyp *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Typ auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strom">Strom</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="fernwaerme">Fernwärme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Anbieter *</Label>
              <Input placeholder="z.B. Stadtwerke München" />
            </div>
            <div className="space-y-2">
              <Label>Tarifname *</Label>
              <Input placeholder="z.B. Ökostrom Basis" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grundpreis (€/Monat) *</Label>
                <Input type="number" step="0.01" placeholder="12.50" />
              </div>
              <div className="space-y-2">
                <Label>Arbeitspreis (ct/kWh) *</Label>
                <Input type="number" step="0.1" placeholder="32.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vertragslaufzeit *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 Monate</SelectItem>
                    <SelectItem value="24">24 Monate</SelectItem>
                    <SelectItem value="36">36 Monate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kündigungsfrist *</Label>
                <Input placeholder="z.B. 6 Wochen" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vertragsende *</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>Gebäude *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Gebäude auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Musterstraße 10</SelectItem>
                  <SelectItem value="2">Hauptweg 5</SelectItem>
                  <SelectItem value="3">Parkallee 22</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => setShowDialog(false)}>Tarif speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
