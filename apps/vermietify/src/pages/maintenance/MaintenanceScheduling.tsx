import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarClock, Plus, Bell, Euro, Wrench } from "lucide-react";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

type Frequency = "monatlich" | "vierteljaehrlich" | "halbjaehrlich" | "jaehrlich";

interface ScheduledMaintenance {
  id: string;
  bezeichnung: string;
  frequenz: Frequency;
  naechsterTermin: string;
  letzterTermin: string;
  dienstleister: string;
  kostenProEinsatz: number;
  erinnerungAktiv: boolean;
  erinnerungTageVorher: number;
}

const FREQUENCY_LABELS: Record<Frequency, string> = {
  monatlich: "Monatlich",
  vierteljaehrlich: "Vierteljahrlich",
  halbjaehrlich: "Halbjahrlich",
  jaehrlich: "Jahrlich",
};

const placeholderItems: ScheduledMaintenance[] = [
  {
    id: "1",
    bezeichnung: "Heizungswartung",
    frequenz: "jaehrlich",
    naechsterTermin: "2026-09-15",
    letzterTermin: "2025-09-10",
    dienstleister: "Muller Haustechnik GmbH",
    kostenProEinsatz: 350,
    erinnerungAktiv: true,
    erinnerungTageVorher: 30,
  },
  {
    id: "2",
    bezeichnung: "Aufzug TUV-Prufung",
    frequenz: "jaehrlich",
    naechsterTermin: "2026-06-01",
    letzterTermin: "2025-06-05",
    dienstleister: "TUV Sud",
    kostenProEinsatz: 800,
    erinnerungAktiv: true,
    erinnerungTageVorher: 60,
  },
  {
    id: "3",
    bezeichnung: "Rauchmelderprufung",
    frequenz: "jaehrlich",
    naechsterTermin: "2026-04-01",
    letzterTermin: "2025-04-03",
    dienstleister: "Brunata Metrona",
    kostenProEinsatz: 120,
    erinnerungAktiv: true,
    erinnerungTageVorher: 14,
  },
  {
    id: "4",
    bezeichnung: "Dachrinnenreinigung",
    frequenz: "halbjaehrlich",
    naechsterTermin: "2026-04-15",
    letzterTermin: "2025-10-20",
    dienstleister: "Gebaude-Service Schmidt",
    kostenProEinsatz: 280,
    erinnerungAktiv: false,
    erinnerungTageVorher: 14,
  },
  {
    id: "5",
    bezeichnung: "Treppenhausreinigung",
    frequenz: "monatlich",
    naechsterTermin: "2026-04-01",
    letzterTermin: "2026-03-01",
    dienstleister: "Clean Team Berlin",
    kostenProEinsatz: 150,
    erinnerungAktiv: false,
    erinnerungTageVorher: 3,
  },
  {
    id: "6",
    bezeichnung: "Gartenpflege",
    frequenz: "vierteljaehrlich",
    naechsterTermin: "2026-04-01",
    letzterTermin: "2026-01-10",
    dienstleister: "Grun & Schon GbR",
    kostenProEinsatz: 450,
    erinnerungAktiv: true,
    erinnerungTageVorher: 7,
  },
];

export default function MaintenanceScheduling() {
  const [items, setItems] = useState<ScheduledMaintenance[]>(placeholderItems);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Omit<ScheduledMaintenance, "id">>({
    bezeichnung: "",
    frequenz: "jaehrlich",
    naechsterTermin: "",
    letzterTermin: "",
    dienstleister: "",
    kostenProEinsatz: 0,
    erinnerungAktiv: true,
    erinnerungTageVorher: 14,
  });

  const totalKostenJahr = items.reduce((sum, item) => {
    const factor =
      item.frequenz === "monatlich" ? 12 :
      item.frequenz === "vierteljaehrlich" ? 4 :
      item.frequenz === "halbjaehrlich" ? 2 : 1;
    return sum + item.kostenProEinsatz * factor;
  }, 0);

  const toggleReminder = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, erinnerungAktiv: !item.erinnerungAktiv } : item
      )
    );
  };

  const handleAdd = () => {
    setItems((prev) => [{ ...newItem, id: crypto.randomUUID() }, ...prev]);
    setNewItem({
      bezeichnung: "",
      frequenz: "jaehrlich",
      naechsterTermin: "",
      letzterTermin: "",
      dienstleister: "",
      kostenProEinsatz: 0,
      erinnerungAktiv: true,
      erinnerungTageVorher: 14,
    });
    setDialogOpen(false);
  };

  return (
    <MainLayout
      title="Wartungsplanung"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Wartung", href: "/maintenance" },
        { label: "Wartungsplanung" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Wartungsplanung"
          subtitle="Planen und verwalten Sie wiederkehrende Wartungsarbeiten und Pruftermine."
          actions={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Neuer Wartungsplan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuen Wartungsplan anlegen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bezeichnung</Label>
                    <Input
                      value={newItem.bezeichnung}
                      onChange={(e) => setNewItem({ ...newItem, bezeichnung: e.target.value })}
                      placeholder="z.B. Heizungswartung"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequenz</Label>
                    <Select
                      value={newItem.frequenz}
                      onValueChange={(val) => setNewItem({ ...newItem, frequenz: val as Frequency })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nachster Termin</Label>
                      <Input
                        type="date"
                        value={newItem.naechsterTermin}
                        onChange={(e) => setNewItem({ ...newItem, naechsterTermin: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Letzter Termin</Label>
                      <Input
                        type="date"
                        value={newItem.letzterTermin}
                        onChange={(e) => setNewItem({ ...newItem, letzterTermin: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dienstleister</Label>
                    <Input
                      value={newItem.dienstleister}
                      onChange={(e) => setNewItem({ ...newItem, dienstleister: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kosten pro Einsatz (EUR)</Label>
                      <Input
                        type="number"
                        value={newItem.kostenProEinsatz}
                        onChange={(e) => setNewItem({ ...newItem, kostenProEinsatz: Number(e.target.value) })}
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Erinnerung (Tage vorher)</Label>
                      <Input
                        type="number"
                        value={newItem.erinnerungTageVorher}
                        onChange={(e) => setNewItem({ ...newItem, erinnerungTageVorher: Number(e.target.value) })}
                        min={1}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAdd} className="w-full">
                    Anlegen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wartungsplane</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-100">
                <Euro className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jahreskosten (geschatzt)</p>
                <p className="text-2xl font-bold">{formatEuro(totalKostenJahr)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktive Erinnerungen</p>
                <p className="text-2xl font-bold">
                  {items.filter((i) => i.erinnerungAktiv).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5 text-primary" />
              Wiederkehrende Wartungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bezeichnung</TableHead>
                  <TableHead>Frequenz</TableHead>
                  <TableHead>Nachster Termin</TableHead>
                  <TableHead>Letzter Termin</TableHead>
                  <TableHead>Dienstleister</TableHead>
                  <TableHead>Kosten</TableHead>
                  <TableHead>Erinnerung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.bezeichnung}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{FREQUENCY_LABELS[item.frequenz]}</Badge>
                    </TableCell>
                    <TableCell>{item.naechsterTermin}</TableCell>
                    <TableCell>{item.letzterTermin}</TableCell>
                    <TableCell>{item.dienstleister}</TableCell>
                    <TableCell>{formatEuro(item.kostenProEinsatz)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.erinnerungAktiv}
                          onCheckedChange={() => toggleReminder(item.id)}
                        />
                        {item.erinnerungAktiv && (
                          <span className="text-xs text-muted-foreground">
                            {item.erinnerungTageVorher} Tage
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kostenubersicht pro Wartungstyp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item) => {
                const factor =
                  item.frequenz === "monatlich" ? 12 :
                  item.frequenz === "vierteljaehrlich" ? 4 :
                  item.frequenz === "halbjaehrlich" ? 2 : 1;
                const jahreskosten = item.kostenProEinsatz * factor;
                const percent = totalKostenJahr > 0 ? (jahreskosten / totalKostenJahr) * 100 : 0;

                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.bezeichnung}</span>
                      <span className="font-medium">{formatEuro(jahreskosten)} / Jahr</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
