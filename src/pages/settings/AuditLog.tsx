import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  History,
  Search,
  Download,
  Filter,
  CalendarIcon,
  Eye,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  FileDown,
  FileUp,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  update: <Pencil className="h-4 w-4 text-primary" />,
  delete: <Trash2 className="h-4 w-4 text-destructive" />,
  login: <LogIn className="h-4 w-4 text-primary" />,
  logout: <LogOut className="h-4 w-4 text-muted-foreground" />,
  export: <FileDown className="h-4 w-4 text-primary" />,
  import: <FileUp className="h-4 w-4 text-primary" />,
};

const ACTION_LABELS: Record<string, string> = {
  create: "Erstellt",
  update: "Aktualisiert",
  delete: "Gelöscht",
  login: "Anmeldung",
  logout: "Abmeldung",
  export: "Export",
  import: "Import",
};

const ENTITY_LABELS: Record<string, string> = {
  building: "Gebäude",
  unit: "Einheit",
  tenant: "Mieter",
  lease: "Vertrag",
  payment: "Zahlung",
  document: "Dokument",
  user: "Benutzer",
  task: "Aufgabe",
  meter: "Zähler",
};

export default function AuditLog() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", profile?.organization_id, actionFilter, entityFilter, dateFrom, dateTo],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      let query = supabase
        .from("audit_logs")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }
      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }
      if (dateFrom) {
        query = query.gte("created_at", dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte("created_at", dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
    enabled: !!profile?.organization_id,
  });

  const filteredLogs = logs.filter(
    (log) =>
      log.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const csv = [
      ["Zeitpunkt", "Aktion", "Entität", "Name", "IP-Adresse"].join(","),
      ...filteredLogs.map((log) =>
        [
          format(new Date(log.created_at), "dd.MM.yyyy HH:mm:ss"),
          ACTION_LABELS[log.action] || log.action,
          ENTITY_LABELS[log.entity_type] || log.entity_type,
          log.entity_name || "-",
          log.ip_address || "-",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout
      title="Aktivitäten"
      breadcrumbs={[
        { label: "Einstellungen", href: "/einstellungen" },
        { label: "Aktivitäten" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <History className="h-8 w-8" />
              Aktivitäten
            </h1>
            <p className="text-muted-foreground">
              Alle Änderungen in Ihrer Organisation werden hier protokolliert
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportieren
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="md:col-span-2">
                <Label htmlFor="search">Suche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Name oder Typ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label>Aktion</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="create">Erstellt</SelectItem>
                    <SelectItem value="update">Aktualisiert</SelectItem>
                    <SelectItem value="delete">Gelöscht</SelectItem>
                    <SelectItem value="login">Anmeldung</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Entität</Label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="building">Gebäude</SelectItem>
                    <SelectItem value="unit">Einheit</SelectItem>
                    <SelectItem value="tenant">Mieter</SelectItem>
                    <SelectItem value="lease">Vertrag</SelectItem>
                    <SelectItem value="payment">Zahlung</SelectItem>
                    <SelectItem value="document">Dokument</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Zeitraum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd.MM.yy") : "Von"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      locale={de}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Zeitpunkt</TableHead>
                  <TableHead className="w-[120px]">Aktion</TableHead>
                  <TableHead>Entität</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">Laden...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Keine Einträge gefunden</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {ACTION_ICONS[log.action]}
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">
                          {ENTITY_LABELS[log.entity_type] || log.entity_type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.entity_name || "-"}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Aktivitätsdetails</DialogTitle>
                              <DialogDescription>
                                {format(new Date(log.created_at), "dd. MMMM yyyy, HH:mm:ss", {
                                  locale: de,
                                })}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Aktion:</span>
                                  <p className="font-medium">
                                    {ACTION_LABELS[log.action] || log.action}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Entität:</span>
                                  <p className="font-medium">
                                    {ENTITY_LABELS[log.entity_type] || log.entity_type}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Name:</span>
                                  <p className="font-medium">{log.entity_name || "-"}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">IP-Adresse:</span>
                                  <p className="font-mono">{log.ip_address || "-"}</p>
                                </div>
                              </div>

                              {(log.old_data || log.new_data) && (
                                <div className="grid grid-cols-2 gap-4">
                                  {log.old_data && (
                                    <div>
                                      <span className="text-sm text-muted-foreground mb-2 block">
                                        Vorher:
                                      </span>
                                      <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                                        {JSON.stringify(log.old_data, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.new_data && (
                                    <div>
                                      <span className="text-sm text-muted-foreground mb-2 block">
                                        Nachher:
                                      </span>
                                      <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                                        {JSON.stringify(log.new_data, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Info */}
        <p className="text-sm text-muted-foreground text-center">
          Aktivitäten werden 2 Jahre aufbewahrt. Zeige {filteredLogs.length} von {logs.length} Einträgen.
        </p>
      </div>
    </MainLayout>
  );
}
