import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Droplets,
  Zap,
  Moon,
  TrendingUp,
  Building2,
  Settings,
  Info,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Severity = "info" | "warnung" | "kritisch";

interface Alert {
  id: string;
  typ: string;
  beschreibung: string;
  severity: Severity;
  gebaeude: string;
  einheit: string;
  zeitpunkt: string;
  gelesen: boolean;
  icon: React.ElementType;
}

const alerts: Alert[] = [
  {
    id: "1",
    typ: "Verbrauchsspitze",
    beschreibung: "Stromverbrauch 45% über Durchschnitt der letzten 30 Tage",
    severity: "warnung",
    gebaeude: "Musterstraße 10",
    einheit: "Whg. 3 OG",
    zeitpunkt: "2026-03-14T08:30:00",
    gelesen: false,
    icon: TrendingUp,
  },
  {
    id: "2",
    typ: "Leckage-Verdacht",
    beschreibung: "Kontinuierlicher Wasserverbrauch über 48h ohne Unterbrechung erkannt",
    severity: "kritisch",
    gebaeude: "Hauptweg 5",
    einheit: "Whg. 1 EG",
    zeitpunkt: "2026-03-13T22:15:00",
    gelesen: false,
    icon: Droplets,
  },
  {
    id: "3",
    typ: "Ungewöhnlicher Nachtverbrauch",
    beschreibung: "Stromverbrauch zwischen 01:00-05:00 Uhr deutlich erhöht",
    severity: "warnung",
    gebaeude: "Parkallee 22",
    einheit: "Whg. 5 DG",
    zeitpunkt: "2026-03-13T06:00:00",
    gelesen: true,
    icon: Moon,
  },
  {
    id: "4",
    typ: "Heizungsanomalie",
    beschreibung: "Gasverbrauch trotz Außentemperatur >18°C ungewöhnlich hoch",
    severity: "warnung",
    gebaeude: "Musterstraße 10",
    einheit: "Whg. 2 EG",
    zeitpunkt: "2026-03-12T14:00:00",
    gelesen: true,
    icon: Zap,
  },
  {
    id: "5",
    typ: "Verbrauch normalisiert",
    beschreibung: "Wasserverbrauch in Whg. 4 wieder im Normalbereich",
    severity: "info",
    gebaeude: "Gartenring 8",
    einheit: "Whg. 4 OG",
    zeitpunkt: "2026-03-11T10:00:00",
    gelesen: true,
    icon: Info,
  },
];

interface AlertRule {
  id: string;
  name: string;
  beschreibung: string;
  schwellwert: string;
  aktiv: boolean;
}

const defaultRules: AlertRule[] = [
  {
    id: "1",
    name: "Verbrauchsspitze Strom",
    beschreibung: "Alarm wenn Verbrauch über Schwellwert des 30-Tage-Durchschnitts",
    schwellwert: "20",
    aktiv: true,
  },
  {
    id: "2",
    name: "Leckage-Erkennung",
    beschreibung: "Alarm bei kontinuierlichem Wasserverbrauch ohne Pause",
    schwellwert: "24",
    aktiv: true,
  },
  {
    id: "3",
    name: "Nachtverbrauch",
    beschreibung: "Alarm bei erhöhtem Verbrauch zwischen 00:00 und 05:00 Uhr",
    schwellwert: "30",
    aktiv: false,
  },
  {
    id: "4",
    name: "Heizung bei Wärme",
    beschreibung: "Alarm bei Heizungsverbrauch bei Außentemperatur über Schwellwert",
    schwellwert: "18",
    aktiv: true,
  },
];

const severityConfig: Record<Severity, { label: string; className: string; icon: React.ElementType }> = {
  info: { label: "Info", className: "bg-blue-100 text-blue-800", icon: Info },
  warnung: { label: "Warnung", className: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  kritisch: { label: "Kritisch", className: "bg-red-100 text-red-800", icon: XCircle },
};

export default function SmartAlerts() {
  const [rules, setRules] = useState(defaultRules);
  const [filterSeverity, setFilterSeverity] = useState("alle");

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, aktiv: !r.aktiv } : r))
    );
  };

  const updateSchwellwert = (id: string, value: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, schwellwert: value } : r))
    );
  };

  const filteredAlerts =
    filterSeverity === "alle"
      ? alerts
      : alerts.filter((a) => a.severity === filterSeverity);

  const unreadCount = alerts.filter((a) => !a.gelesen).length;

  return (
    <MainLayout
      title="Smart Alerts"
      breadcrumbs={[
        { label: "Energie", href: "/energy" },
        { label: "Smart Alerts" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Verbrauchsalarme"
          subtitle="Automatische Erkennung von Verbrauchsanomalien und Auffälligkeiten."
        />

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ungelesene Alerts</p>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kritisch</p>
                  <p className="text-2xl font-bold text-red-600">
                    {alerts.filter((a) => a.severity === "kritisch").length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Warnungen</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {alerts.filter((a) => a.severity === "warnung").length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aktive Regeln</p>
                  <p className="text-2xl font-bold">
                    {rules.filter((r) => r.aktiv).length}/{rules.length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alarme
              </CardTitle>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Stufen</SelectItem>
                  <SelectItem value="kritisch">Kritisch</SelectItem>
                  <SelectItem value="warnung">Warnung</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const severity = severityConfig[alert.severity];
                const AlertIcon = alert.icon;
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start justify-between p-4 rounded-lg border",
                      !alert.gelesen && "bg-muted/50 border-primary/20"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center mt-0.5",
                          alert.severity === "kritisch"
                            ? "bg-red-100"
                            : alert.severity === "warnung"
                            ? "bg-yellow-100"
                            : "bg-blue-100"
                        )}
                      >
                        <AlertIcon
                          className={cn(
                            "h-5 w-5",
                            alert.severity === "kritisch"
                              ? "text-red-600"
                              : alert.severity === "warnung"
                              ? "text-yellow-600"
                              : "text-blue-600"
                          )}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{alert.typ}</p>
                          {!alert.gelesen && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alert.beschreibung}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {alert.gebaeude}
                          </span>
                          <span>{alert.einheit}</span>
                          <span>
                            {new Date(alert.zeitpunkt).toLocaleString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={severity.className}>
                      {severity.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Alert Rules Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Alarmregeln konfigurieren
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4 flex-1">
                    <Switch
                      checked={rule.aktiv}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                    <div className="flex-1">
                      <p className={cn("font-medium", !rule.aktiv && "text-muted-foreground")}>
                        {rule.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{rule.beschreibung}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">
                      Schwellwert:
                    </Label>
                    <Input
                      className="w-20"
                      type="number"
                      value={rule.schwellwert}
                      onChange={(e) => updateSchwellwert(rule.id, e.target.value)}
                      disabled={!rule.aktiv}
                    />
                    <span className="text-sm text-muted-foreground">
                      {rule.id === "2" ? "h" : rule.id === "4" ? "°C" : "%"}
                    </span>
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
