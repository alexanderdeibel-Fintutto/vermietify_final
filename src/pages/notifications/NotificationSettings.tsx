import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Mail,
  Smartphone,
  Moon,
  Clock,
  ArrowLeft,
  CreditCard,
  AlertTriangle,
  ClipboardList,
  FileText,
  FileUp,
  Gauge,
  MessageSquare,
  Info,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  useNotificationSettings,
  NOTIFICATION_TYPES,
  NotificationPreference,
} from "@/hooks/useNotificationSettings";
import { NOTIFICATION_TYPE_CONFIG } from "@/hooks/useNotifications";
import type { Database } from "@/integrations/supabase/types";

type NotificationType = Database["public"]["Enums"]["notification_type"];

// Icon mapping for notification types - using semantic colors
const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  payment_received: <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  payment_overdue: <AlertTriangle className="h-4 w-4 text-destructive" />,
  payment_reminder: <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  contract_ending: <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  contract_created: <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  contract_terminated: <FileText className="h-4 w-4 text-muted-foreground" />,
  tenant_created: <CreditCard className="h-4 w-4 text-primary" />,
  tenant_document: <FileUp className="h-4 w-4 text-primary" />,
  task_assigned: <ClipboardList className="h-4 w-4 text-primary" />,
  task_due: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  task_completed: <ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  meter_reading_due: <Gauge className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  meter_reading_submitted: <Gauge className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  document_uploaded: <FileUp className="h-4 w-4 text-primary" />,
  document_signed: <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  message_received: <MessageSquare className="h-4 w-4 text-primary" />,
  inquiry_received: <MessageSquare className="h-4 w-4 text-primary" />,
  billing_created: <FileText className="h-4 w-4 text-primary" />,
  billing_sent: <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  workflow_completed: <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  workflow_failed: <AlertTriangle className="h-4 w-4 text-destructive" />,
  system_alert: <AlertTriangle className="h-4 w-4 text-destructive" />,
  system_info: <Info className="h-4 w-4 text-muted-foreground" />,
};

// Group notification types by category
const NOTIFICATION_CATEGORIES = [
  { 
    name: "Zahlungen", 
    types: ["payment_received", "payment_overdue", "payment_reminder"] 
  },
  { 
    name: "Verträge", 
    types: ["contract_ending", "contract_created", "contract_terminated"] 
  },
  { 
    name: "Mieter", 
    types: ["tenant_created", "tenant_document"] 
  },
  { 
    name: "Aufgaben", 
    types: ["task_assigned", "task_due", "task_completed"] 
  },
  { 
    name: "Zähler", 
    types: ["meter_reading_due", "meter_reading_submitted"] 
  },
  { 
    name: "Dokumente", 
    types: ["document_uploaded", "document_signed"] 
  },
  { 
    name: "Nachrichten", 
    types: ["message_received", "inquiry_received"] 
  },
  { 
    name: "Abrechnung", 
    types: ["billing_created", "billing_sent"] 
  },
  { 
    name: "Automatisierung", 
    types: ["workflow_completed", "workflow_failed"] 
  },
  { 
    name: "System", 
    types: ["system_alert", "system_info"] 
  },
];

export default function NotificationSettings() {
  const navigate = useNavigate();
  const {
    usePreferences,
    useSettings,
    updatePreference,
    updateSettings,
    isPushSupported,
    requestPushPermission,
    getPushPermissionStatus,
  } = useNotificationSettings();

  const { data: preferences, isLoading: preferencesLoading } = usePreferences();
  const { data: settings, isLoading: settingsLoading } = useSettings();

  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setPushPermission(getPushPermissionStatus());
  }, []);

  const handleRequestPush = async () => {
    const granted = await requestPushPermission();
    setPushPermission(granted ? "granted" : "denied");
  };

  // Get preference for a notification type, with defaults
  const getPreference = (type: NotificationType): NotificationPreference => {
    const pref = preferences?.find((p) => p.notification_type === type);
    return {
      notification_type: type,
      in_app_enabled: pref?.in_app_enabled ?? true,
      email_enabled: pref?.email_enabled ?? true,
      push_enabled: pref?.push_enabled ?? false,
    };
  };

  const handlePreferenceChange = (
    type: NotificationType,
    field: "in_app_enabled" | "email_enabled" | "push_enabled",
    value: boolean
  ) => {
    const current = getPreference(type);
    updatePreference.mutate({
      ...current,
      [field]: value,
    });
  };

  const getTypeInfo = (type: string) => {
    return NOTIFICATION_TYPES.find((t) => t.type === type);
  };

  const isLoading = preferencesLoading || settingsLoading;

  return (
    <MainLayout
      title="Benachrichtigungseinstellungen"
      breadcrumbs={[
        { label: "Benachrichtigungen", href: "/benachrichtigungen" },
        { label: "Einstellungen" },
      ]}
      actions={
        <Button variant="outline" onClick={() => navigate("/benachrichtigungen")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
      }
    >
      <div className="space-y-6 max-w-4xl">
        {/* Push Notification Permission */}
        {isPushSupported && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Push-Benachrichtigungen
              </CardTitle>
              <CardDescription>
                Erhalten Sie Benachrichtigungen auch wenn die App nicht geöffnet ist.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      pushPermission === "granted"
                        ? "default"
                        : pushPermission === "denied"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {pushPermission === "granted" && "Aktiviert"}
                    {pushPermission === "denied" && "Blockiert"}
                    {pushPermission === "default" && "Nicht aktiviert"}
                    {pushPermission === "unsupported" && "Nicht unterstützt"}
                  </Badge>
                </div>
                {pushPermission === "default" && (
                  <Button onClick={handleRequestPush}>
                    Push aktivieren
                  </Button>
                )}
                {pushPermission === "denied" && (
                  <p className="text-sm text-muted-foreground">
                    Bitte erlauben Sie Push-Benachrichtigungen in Ihren Browser-Einstellungen.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Allgemeine Einstellungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Frequency */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">E-Mail-Häufigkeit</Label>
                <p className="text-sm text-muted-foreground">
                  Wie oft möchten Sie E-Mail-Benachrichtigungen erhalten?
                </p>
              </div>
              <Select
                value={settings?.email_frequency || "instant"}
                onValueChange={(value) =>
                  updateSettings.mutate({ email_frequency: value as "instant" | "daily" | "weekly" })
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Sofort</SelectItem>
                  <SelectItem value="daily">Tägliche Zusammenfassung</SelectItem>
                  <SelectItem value="weekly">Wöchentliche Zusammenfassung</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Quiet Hours */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Ruhezeiten
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Keine Benachrichtigungen während dieser Zeit.
                  </p>
                </div>
                <Switch
                  checked={settings?.quiet_hours_enabled || false}
                  onCheckedChange={(checked) =>
                    updateSettings.mutate({ quiet_hours_enabled: checked })
                  }
                />
              </div>

              {settings?.quiet_hours_enabled && (
                <div className="flex items-center gap-4 ml-6">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="quiet-start">Von</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      className="w-32"
                      value={settings?.quiet_hours_start || "22:00"}
                      onChange={(e) =>
                        updateSettings.mutate({ quiet_hours_start: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="quiet-end">Bis</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      className="w-32"
                      value={settings?.quiet_hours_end || "07:00"}
                      onChange={(e) =>
                        updateSettings.mutate({ quiet_hours_end: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Per-Type Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Benachrichtigungstypen
            </CardTitle>
            <CardDescription>
              Wählen Sie für jeden Benachrichtigungstyp, wie Sie benachrichtigt werden möchten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Laden...</p>
              </div>
            ) : (
              NOTIFICATION_CATEGORIES.map((category) => (
                <div key={category.name}>
                  <h4 className="font-medium mb-4">{category.name}</h4>
                  <div className="space-y-4">
                    {category.types.map((type) => {
                      const typeInfo = getTypeInfo(type);
                      const pref = getPreference(type as NotificationType);

                      if (!typeInfo) return null;

                      return (
                        <div
                          key={type}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            {NOTIFICATION_ICONS[type]}
                            <div>
                              <p className="font-medium text-sm">{typeInfo.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {typeInfo.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            {/* In-App */}
                            <div className="flex flex-col items-center gap-1">
                              <Bell className="h-4 w-4 text-muted-foreground" />
                              <Switch
                                checked={pref.in_app_enabled}
                                onCheckedChange={(checked) =>
                                  handlePreferenceChange(
                                    type as NotificationType,
                                    "in_app_enabled",
                                    checked
                                  )
                                }
                              />
                            </div>

                            {/* Email */}
                            <div className="flex flex-col items-center gap-1">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <Switch
                                checked={pref.email_enabled}
                                onCheckedChange={(checked) =>
                                  handlePreferenceChange(
                                    type as NotificationType,
                                    "email_enabled",
                                    checked
                                  )
                                }
                              />
                            </div>

                            {/* Push */}
                            <div className="flex flex-col items-center gap-1">
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                              <Switch
                                checked={pref.push_enabled}
                                disabled={pushPermission !== "granted"}
                                onCheckedChange={(checked) =>
                                  handlePreferenceChange(
                                    type as NotificationType,
                                    "push_enabled",
                                    checked
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {category !== NOTIFICATION_CATEGORIES[NOTIFICATION_CATEGORIES.length - 1] && (
                    <Separator className="mt-6" />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Column Legend */}
        <div className="flex items-center justify-end gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>In-App</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>E-Mail</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span>Push</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
