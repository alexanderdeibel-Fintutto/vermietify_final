import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Loader2,
  Info,
  Link2,
  ArrowUpDown,
  Calendar,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SyncLogEntry {
  id: string;
  timestamp: string;
  action: string;
  status: "success" | "error" | "warning";
  records: number;
  message: string;
}

const MOCK_SYNC_LOG: SyncLogEntry[] = [
  {
    id: "1",
    timestamp: "2025-01-15T14:30:00",
    action: "Buchungsstapel exportiert",
    status: "success",
    records: 142,
    message: "142 Buchungen erfolgreich ubertragen",
  },
  {
    id: "2",
    timestamp: "2025-01-10T09:15:00",
    action: "Sachkonten synchronisiert",
    status: "success",
    records: 28,
    message: "28 Sachkonten aktualisiert",
  },
  {
    id: "3",
    timestamp: "2025-01-05T16:45:00",
    action: "Belegbilder ubertragen",
    status: "warning",
    records: 85,
    message: "85 von 90 Belegen ubertragen, 5 fehlerhaft",
  },
  {
    id: "4",
    timestamp: "2024-12-20T11:00:00",
    action: "Stammdaten synchronisiert",
    status: "success",
    records: 12,
    message: "Mandantenstammdaten aktualisiert",
  },
  {
    id: "5",
    timestamp: "2024-12-15T08:30:00",
    action: "Buchungsstapel exportiert",
    status: "error",
    records: 0,
    message: "Verbindung zum DATEV-Server fehlgeschlagen",
  },
];

const STATUS_ICONS: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  success: { icon: CheckCircle2, color: "text-green-600" },
  error: { icon: XCircle, color: "text-red-600" },
  warning: { icon: Clock, color: "text-orange-600" },
};

const STATUS_BADGES: Record<string, string> = {
  success: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
  warning: "bg-orange-100 text-orange-800",
};

export default function DatevSync() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>(MOCK_SYNC_LOG);

  const [connectionForm, setConnectionForm] = useState({
    mandantennummer: "",
    beraternummer: "",
    serverUrl: "",
    apiKey: "",
  });

  const lastSync = syncLog.length > 0 ? syncLog[0] : null;

  const handleConnect = async () => {
    if (!connectionForm.mandantennummer || !connectionForm.beraternummer) {
      toast({
        title: "Fehler",
        description: "Bitte fullen Sie Mandantennummer und Beraternummer aus.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsConnecting(false);
    setIsConnected(true);
    toast({
      title: "Verbindung hergestellt",
      description: "DATEV-Verbindung wurde erfolgreich konfiguriert.",
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionForm({ mandantennummer: "", beraternummer: "", serverUrl: "", apiKey: "" });
    toast({ title: "Verbindung getrennt" });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const newEntry: SyncLogEntry = {
      id: String(Date.now()),
      timestamp: new Date().toISOString(),
      action: "Buchungsstapel exportiert",
      status: "success",
      records: Math.floor(Math.random() * 100) + 20,
      message: "Synchronisierung erfolgreich abgeschlossen",
    };

    setSyncLog((prev) => [newEntry, ...prev]);
    setIsSyncing(false);
    toast({
      title: "Synchronisierung abgeschlossen",
      description: `${newEntry.records} Datensatze ubertragen.`,
    });
  };

  return (
    <MainLayout title="DATEV">
      <div className="space-y-6">
        <PageHeader
          title="DATEV-Integration"
          subtitle="Verbindung zu DATEV fur den automatischen Datenaustausch mit Ihrem Steuerberater"
          breadcrumbs={[
            { label: "Steuern", href: "/steuern" },
            { label: "DATEV" },
          ]}
        />

        {/* Connection Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-3 ${isConnected ? "bg-green-100" : "bg-muted"}`}>
                  <Database className={`h-6 w-6 ${isConnected ? "text-green-600" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-medium">
                    {isConnected ? "DATEV verbunden" : "Keine Verbindung"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isConnected
                      ? `Mandant: ${connectionForm.mandantennummer} | Berater: ${connectionForm.beraternummer}`
                      : "Konfigurieren Sie die Verbindung zu DATEV"
                    }
                  </p>
                  {lastSync && isConnected && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Letzte Synchronisierung: {new Date(lastSync.timestamp).toLocaleString("de-DE")}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={isConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {isConnected ? "Verbunden" : "Getrennt"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Connection Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Verbindungseinstellungen
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie die DATEV-Verbindung mit Ihren Zugangsdaten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mandantennummer *</Label>
                  <Input
                    value={connectionForm.mandantennummer}
                    onChange={(e) => setConnectionForm((p) => ({ ...p, mandantennummer: e.target.value }))}
                    placeholder="z.B. 12345"
                    disabled={isConnected}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beraternummer *</Label>
                  <Input
                    value={connectionForm.beraternummer}
                    onChange={(e) => setConnectionForm((p) => ({ ...p, beraternummer: e.target.value }))}
                    placeholder="z.B. 67890"
                    disabled={isConnected}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>DATEV-Server URL (optional)</Label>
                <Input
                  value={connectionForm.serverUrl}
                  onChange={(e) => setConnectionForm((p) => ({ ...p, serverUrl: e.target.value }))}
                  placeholder="https://datev-server.example.com"
                  disabled={isConnected}
                />
              </div>
              <div className="space-y-2">
                <Label>API-Schlussel (optional)</Label>
                <Input
                  type="password"
                  value={connectionForm.apiKey}
                  onChange={(e) => setConnectionForm((p) => ({ ...p, apiKey: e.target.value }))}
                  placeholder="Ihr DATEV API-Schlussel"
                  disabled={isConnected}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                {isConnected ? (
                  <>
                    <Button variant="destructive" onClick={handleDisconnect}>
                      Verbindung trennen
                    </Button>
                    <Button onClick={handleSync} disabled={isSyncing}>
                      {isSyncing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Synchronisiere...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Jetzt synchronisieren
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verbinde...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Verbindung herstellen
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {isConnected && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Automatische Synchronisierung</AlertTitle>
            <AlertDescription>
              Die Daten werden automatisch alle 24 Stunden mit DATEV synchronisiert.
              Sie konnen auch jederzeit eine manuelle Synchronisierung auslosen.
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Synchronisierungs-Protokoll
            </CardTitle>
            <CardDescription>
              Verlauf aller DATEV-Synchronisierungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {syncLog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Noch keine Synchronisierungen durchgefuhrt
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeitpunkt</TableHead>
                    <TableHead>Aktion</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Datensatze</TableHead>
                    <TableHead>Nachricht</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLog.map((entry) => {
                    const statusConfig = STATUS_ICONS[entry.status];
                    const StatusIcon = statusConfig?.icon || Clock;

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(entry.timestamp).toLocaleString("de-DE")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{entry.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_BADGES[entry.status]}>
                            <StatusIcon className={`h-3 w-3 mr-1 ${statusConfig?.color}`} />
                            {entry.status === "success" && "Erfolgreich"}
                            {entry.status === "error" && "Fehler"}
                            {entry.status === "warning" && "Warnung"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{entry.records}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {entry.message}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
