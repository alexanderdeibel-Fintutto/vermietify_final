import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Building2,
} from "lucide-react";

type Status = "offen" | "in_bearbeitung" | "erledigt" | "ueberfaellig";
type Priority = "niedrig" | "mittel" | "hoch" | "dringend";

interface MaintenanceTask {
  id: string;
  titel: string;
  gebaeude: string;
  status: Status;
  prioritaet: Priority;
  erstelltAm: string;
  faelligAm: string;
  beschreibung: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: React.ElementType }> = {
  offen: { label: "Offen", color: "bg-blue-100 text-blue-800", icon: Clock },
  in_bearbeitung: { label: "In Bearbeitung", color: "bg-yellow-100 text-yellow-800", icon: Loader2 },
  erledigt: { label: "Erledigt", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  ueberfaellig: { label: "Uberfaellig", color: "bg-red-100 text-red-800", icon: AlertTriangle },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  niedrig: { label: "Niedrig", color: "bg-slate-100 text-slate-800" },
  mittel: { label: "Mittel", color: "bg-blue-100 text-blue-800" },
  hoch: { label: "Hoch", color: "bg-orange-100 text-orange-800" },
  dringend: { label: "Dringend", color: "bg-red-100 text-red-800" },
};

const placeholderTasks: MaintenanceTask[] = [
  { id: "1", titel: "Heizung defekt - Wohnung 3B", gebaeude: "Hauptstr. 12", status: "dringend" as Status, prioritaet: "dringend", erstelltAm: "2026-03-01", faelligAm: "2026-03-05", beschreibung: "Heizung funktioniert nicht" },
  { id: "2", titel: "Wasserhahn tropft - Wohnung 1A", gebaeude: "Hauptstr. 12", status: "offen", prioritaet: "mittel", erstelltAm: "2026-03-05", faelligAm: "2026-03-15", beschreibung: "Wasserhahn in Kuche" },
  { id: "3", titel: "Treppenhausbeleuchtung", gebaeude: "Gartenweg 5", status: "in_bearbeitung", prioritaet: "niedrig", erstelltAm: "2026-02-20", faelligAm: "2026-03-10", beschreibung: "Lampe im 2. OG defekt" },
  { id: "4", titel: "Dachrinne verstopft", gebaeude: "Gartenweg 5", status: "ueberfaellig", prioritaet: "hoch", erstelltAm: "2026-02-10", faelligAm: "2026-02-28", beschreibung: "Dachrinne Nordseite" },
  { id: "5", titel: "Fensterabdichtung erneuern", gebaeude: "Bergstr. 8", status: "erledigt", prioritaet: "mittel", erstelltAm: "2026-01-15", faelligAm: "2026-02-15", beschreibung: "Wohnung 2A, Schlafzimmer" },
  { id: "6", titel: "Aufzugswartung fallig", gebaeude: "Hauptstr. 12", status: "offen", prioritaet: "hoch", erstelltAm: "2026-03-10", faelligAm: "2026-03-20", beschreibung: "Jahrliche Wartung" },
];

const scheduledItems = [
  { datum: "2026-03-15", aufgabe: "Heizungswartung - Hauptstr. 12", typ: "Wartung" },
  { datum: "2026-03-20", aufgabe: "Aufzug TUV-Prufung - Hauptstr. 12", typ: "Prufung" },
  { datum: "2026-04-01", aufgabe: "Rauchmelderprufung - Alle Gebaude", typ: "Prufung" },
  { datum: "2026-04-15", aufgabe: "Gartenpflege Fruhjahr - Gartenweg 5", typ: "Pflege" },
  { datum: "2026-05-01", aufgabe: "Dachrinnenreinigung - Bergstr. 8", typ: "Reinigung" },
];

export default function MaintenanceDashboard() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(placeholderTasks);
  const [filterGebaeude, setFilterGebaeude] = useState<string>("alle");
  const [filterStatus, setFilterStatus] = useState<string>("alle");
  const [filterPrioritaet, setFilterPrioritaet] = useState<string>("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    titel: "",
    gebaeude: "",
    prioritaet: "mittel" as Priority,
    faelligAm: "",
    beschreibung: "",
  });

  const gebaeude = [...new Set(tasks.map((t) => t.gebaeude))];

  const stats = {
    offen: tasks.filter((t) => t.status === "offen").length,
    inBearbeitung: tasks.filter((t) => t.status === "in_bearbeitung").length,
    erledigt: tasks.filter((t) => t.status === "erledigt").length,
    ueberfaellig: tasks.filter((t) => t.status === "ueberfaellig").length,
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterGebaeude !== "alle" && t.gebaeude !== filterGebaeude) return false;
    if (filterStatus !== "alle" && t.status !== filterStatus) return false;
    if (filterPrioritaet !== "alle" && t.prioritaet !== filterPrioritaet) return false;
    return true;
  });

  const handleAddTask = () => {
    const task: MaintenanceTask = {
      id: crypto.randomUUID(),
      titel: newTask.titel,
      gebaeude: newTask.gebaeude,
      status: "offen",
      prioritaet: newTask.prioritaet,
      erstelltAm: new Date().toISOString().split("T")[0],
      faelligAm: newTask.faelligAm,
      beschreibung: newTask.beschreibung,
    };
    setTasks((prev) => [task, ...prev]);
    setNewTask({ titel: "", gebaeude: "", prioritaet: "mittel", faelligAm: "", beschreibung: "" });
    setDialogOpen(false);
  };

  return (
    <MainLayout
      title="Wartungsmanagement"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Wartung", href: "/maintenance" },
        { label: "Ubersicht" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Wartungsmanagement"
          subtitle="Verwalten Sie Wartungsauftrage, Reparaturen und Instandhaltungsarbeiten."
          actions={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Neuer Wartungsauftrag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuer Wartungsauftrag</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titel</Label>
                    <Input
                      value={newTask.titel}
                      onChange={(e) => setNewTask({ ...newTask, titel: e.target.value })}
                      placeholder="Kurze Beschreibung"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gebaude</Label>
                    <Input
                      value={newTask.gebaeude}
                      onChange={(e) => setNewTask({ ...newTask, gebaeude: e.target.value })}
                      placeholder="z.B. Hauptstr. 12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prioritat</Label>
                    <Select
                      value={newTask.prioritaet}
                      onValueChange={(val) => setNewTask({ ...newTask, prioritaet: val as Priority })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fallig am</Label>
                    <Input
                      type="date"
                      value={newTask.faelligAm}
                      onChange={(e) => setNewTask({ ...newTask, faelligAm: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Beschreibung</Label>
                    <Input
                      value={newTask.beschreibung}
                      onChange={(e) => setNewTask({ ...newTask, beschreibung: e.target.value })}
                      placeholder="Details zum Auftrag"
                    />
                  </div>
                  <Button onClick={handleAddTask} className="w-full">
                    Auftrag erstellen
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
              <div className="p-3 rounded-full bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Offene Auftrage</p>
                <p className="text-2xl font-bold">{stats.offen}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100">
                <Loader2 className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Bearbeitung</p>
                <p className="text-2xl font-bold">{stats.inBearbeitung}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Erledigt</p>
                <p className="text-2xl font-bold">{stats.erledigt}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uberfallig</p>
                <p className="text-2xl font-bold">{stats.ueberfaellig}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Gebaude</Label>
                <Select value={filterGebaeude} onValueChange={setFilterGebaeude}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Gebaude</SelectItem>
                    {gebaeude.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Status</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prioritat</Label>
                <Select value={filterPrioritaet} onValueChange={setFilterPrioritaet}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Prioritaten</SelectItem>
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5 text-primary" />
              Wartungsauftrage ({filteredTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Gebaude</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioritat</TableHead>
                  <TableHead>Fallig am</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const statusCfg = STATUS_CONFIG[task.status];
                  const prioCfg = PRIORITY_CONFIG[task.prioritaet];
                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.titel}</p>
                          <p className="text-xs text-muted-foreground">{task.beschreibung}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {task.gebaeude}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={prioCfg.color}>{prioCfg.label}</Badge>
                      </TableCell>
                      <TableCell>{task.faelligAm}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Geplante Wartungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="text-center min-w-[60px]">
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.datum).toLocaleDateString("de-DE", { month: "short" })}
                    </p>
                    <p className="text-xl font-bold">
                      {new Date(item.datum).getDate()}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.aufgabe}</p>
                    <Badge variant="outline" className="mt-1">{item.typ}</Badge>
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
