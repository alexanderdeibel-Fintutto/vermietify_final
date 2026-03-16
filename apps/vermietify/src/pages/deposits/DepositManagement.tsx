import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Landmark, Plus, Euro, Info, PiggyBank, Calculator } from "lucide-react";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

type DepositStatus = "eingegangen" | "teilweise" | "ausstehend" | "zurueckgezahlt";

const STATUS_CONFIG: Record<DepositStatus, { label: string; color: string }> = {
  eingegangen: { label: "Eingegangen", color: "bg-emerald-100 text-emerald-800" },
  teilweise: { label: "Teilweise", color: "bg-yellow-100 text-yellow-800" },
  ausstehend: { label: "Ausstehend", color: "bg-orange-100 text-orange-800" },
  zurueckgezahlt: { label: "Zuruckgezahlt", color: "bg-slate-100 text-slate-800" },
};

interface Deposit {
  id: string;
  mieter: string;
  einheit: string;
  betrag: number;
  eingangsdatum: string;
  status: DepositStatus;
  kontoAnlage: string;
  monatsmiete: number;
}

const BASISZINSSATZ = 1.55; // placeholder

const placeholderDeposits: Deposit[] = [
  { id: "1", mieter: "Schmidt, Maria", einheit: "Hauptstr. 12 / 1A", betrag: 2400, eingangsdatum: "2023-04-01", status: "eingegangen", kontoAnlage: "Sparkonto", monatsmiete: 800 },
  { id: "2", mieter: "Muller, Thomas", einheit: "Hauptstr. 12 / 2B", betrag: 1800, eingangsdatum: "2024-01-15", status: "eingegangen", kontoAnlage: "Mietkautionskonto", monatsmiete: 950 },
  { id: "3", mieter: "Weber, Anna", einheit: "Gartenweg 5 / 1A", betrag: 700, eingangsdatum: "2025-06-01", status: "teilweise", kontoAnlage: "Sparkonto", monatsmiete: 750 },
  { id: "4", mieter: "Fischer, Lukas", einheit: "Gartenweg 5 / 3C", betrag: 0, eingangsdatum: "", status: "ausstehend", kontoAnlage: "-", monatsmiete: 680 },
  { id: "5", mieter: "Bauer, Petra", einheit: "Bergstr. 8 / 2A", betrag: 2100, eingangsdatum: "2021-09-01", status: "zurueckgezahlt", kontoAnlage: "Sparkonto", monatsmiete: 700 },
];

function calcZinsen(betrag: number, eingangsdatum: string): number {
  if (!eingangsdatum || betrag <= 0) return 0;
  const start = new Date(eingangsdatum);
  const now = new Date();
  const years = (now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return betrag * (BASISZINSSATZ / 100) * years;
}

export default function DepositManagement() {
  const [deposits, setDeposits] = useState<Deposit[]>(placeholderDeposits);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDeposit, setNewDeposit] = useState({
    mieter: "",
    einheit: "",
    betrag: 0,
    eingangsdatum: "",
    kontoAnlage: "Sparkonto",
    monatsmiete: 0,
  });

  const activeDeposits = deposits.filter((d) => d.status !== "zurueckgezahlt");
  const totalBetrag = activeDeposits.reduce((sum, d) => sum + d.betrag, 0);
  const totalZinsen = activeDeposits.reduce((sum, d) => sum + calcZinsen(d.betrag, d.eingangsdatum), 0);

  const handleAdd = () => {
    const deposit: Deposit = {
      id: crypto.randomUUID(),
      mieter: newDeposit.mieter,
      einheit: newDeposit.einheit,
      betrag: newDeposit.betrag,
      eingangsdatum: newDeposit.eingangsdatum,
      status: newDeposit.betrag > 0 ? "eingegangen" : "ausstehend",
      kontoAnlage: newDeposit.kontoAnlage,
      monatsmiete: newDeposit.monatsmiete,
    };
    setDeposits((prev) => [deposit, ...prev]);
    setNewDeposit({ mieter: "", einheit: "", betrag: 0, eingangsdatum: "", kontoAnlage: "Sparkonto", monatsmiete: 0 });
    setDialogOpen(false);
  };

  return (
    <MainLayout
      title="Kautionsverwaltung"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Kautionen" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Kautionsverwaltung"
          subtitle="Verwalten Sie Mietkautionen, Zinsentwicklung und Abrechnungen."
          actions={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Kaution anlegen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Kaution anlegen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mieter</Label>
                      <Input
                        value={newDeposit.mieter}
                        onChange={(e) => setNewDeposit({ ...newDeposit, mieter: e.target.value })}
                        placeholder="Name des Mieters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Einheit</Label>
                      <Input
                        value={newDeposit.einheit}
                        onChange={(e) => setNewDeposit({ ...newDeposit, einheit: e.target.value })}
                        placeholder="z.B. Hauptstr. 12 / 1A"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kautionsbetrag (EUR)</Label>
                      <Input
                        type="number"
                        value={newDeposit.betrag}
                        onChange={(e) => setNewDeposit({ ...newDeposit, betrag: Number(e.target.value) })}
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Monatsmiete (EUR)</Label>
                      <Input
                        type="number"
                        value={newDeposit.monatsmiete}
                        onChange={(e) => setNewDeposit({ ...newDeposit, monatsmiete: Number(e.target.value) })}
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Eingangsdatum</Label>
                      <Input
                        type="date"
                        value={newDeposit.eingangsdatum}
                        onChange={(e) => setNewDeposit({ ...newDeposit, eingangsdatum: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Konto / Anlage</Label>
                      <Select
                        value={newDeposit.kontoAnlage}
                        onValueChange={(val) => setNewDeposit({ ...newDeposit, kontoAnlage: val })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sparkonto">Sparkonto</SelectItem>
                          <SelectItem value="Mietkautionskonto">Mietkautionskonto</SelectItem>
                          <SelectItem value="Sparbuch">Sparbuch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newDeposit.monatsmiete > 0 && newDeposit.betrag > newDeposit.monatsmiete * 3 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      Achtung: Die Kaution uberschreitet das gesetzliche Maximum von 3 Monatsmieten ({formatEuro(newDeposit.monatsmiete * 3)}).
                    </div>
                  )}
                  <Button onClick={handleAdd} className="w-full">
                    Kaution anlegen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <PiggyBank className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktive Kautionen</p>
                <p className="text-2xl font-bold">{activeDeposits.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-100">
                <Euro className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gesamtbetrag</p>
                <p className="text-2xl font-bold">{formatEuro(totalBetrag)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aufgelaufene Zinsen</p>
                <p className="text-2xl font-bold">{formatEuro(totalZinsen)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100">
                <Landmark className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Basiszinssatz</p>
                <p className="text-2xl font-bold">{BASISZINSSATZ} %</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deposit Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Landmark className="h-5 w-5 text-primary" />
              Kautionen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mieter</TableHead>
                  <TableHead>Einheit</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>Max. (3x Miete)</TableHead>
                  <TableHead>Eingangsdatum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Konto/Anlage</TableHead>
                  <TableHead>Zinsen</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.map((d) => {
                  const maxKaution = d.monatsmiete * 3;
                  const zinsen = calcZinsen(d.betrag, d.eingangsdatum);
                  const statusCfg = STATUS_CONFIG[d.status];

                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.mieter}</TableCell>
                      <TableCell>{d.einheit}</TableCell>
                      <TableCell>{formatEuro(d.betrag)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatEuro(maxKaution)}</TableCell>
                      <TableCell>{d.eingangsdatum || "-"}</TableCell>
                      <TableCell>
                        <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell>{d.kontoAnlage}</TableCell>
                      <TableCell>{zinsen > 0 ? formatEuro(zinsen) : "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Abrechnen
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Legal Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="font-medium text-blue-900">Gesetzliche Regelungen zur Mietkaution</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Die Kaution darf maximal 3 Nettokaltmieten betragen (Paragraph 551 BGB).</li>
                  <li>Der Mieter kann die Kaution in drei gleichen Monatsraten zahlen.</li>
                  <li>Die Kaution muss getrennt vom Vermogen des Vermieters angelegt werden (Anlagepflicht).</li>
                  <li>Die Anlage muss zum ublichen Zinssatz fur Spareinlagen mit dreimonatiger Kundigungsfrist erfolgen.</li>
                  <li>Zinsen stehen dem Mieter zu und erhohen die Kaution.</li>
                  <li>Nach Mietende ist die Kaution innerhalb einer angemessenen Frist (i.d.R. 3-6 Monate) abzurechnen.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
