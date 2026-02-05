import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type NotificationType = Database["public"]["Enums"]["notification_type"];

const NOTIFICATION_SETTINGS_KEY = "notification_settings";
const NOTIFICATION_PREFERENCES_KEY = "notification_preferences";

// All available notification types with labels
export const NOTIFICATION_TYPES: { type: NotificationType; label: string; description: string }[] = [
  { type: "payment_received", label: "Zahlung eingegangen", description: "Wenn eine Mietzahlung eingeht" },
  { type: "payment_overdue", label: "Zahlung überfällig", description: "Wenn eine Zahlung überfällig ist" },
  { type: "payment_reminder", label: "Zahlungserinnerung", description: "Erinnerung an ausstehende Zahlungen" },
  { type: "contract_ending", label: "Vertrag endet", description: "Wenn ein Vertrag bald ausläuft" },
  { type: "contract_created", label: "Vertrag erstellt", description: "Wenn ein neuer Vertrag erstellt wird" },
  { type: "contract_terminated", label: "Vertrag gekündigt", description: "Wenn ein Vertrag gekündigt wird" },
  { type: "tenant_created", label: "Neuer Mieter", description: "Wenn ein neuer Mieter angelegt wird" },
  { type: "tenant_document", label: "Mieter-Dokument", description: "Wenn ein Mieter ein Dokument hochlädt" },
  { type: "task_assigned", label: "Aufgabe zugewiesen", description: "Wenn eine Aufgabe zugewiesen wird" },
  { type: "task_due", label: "Aufgabe fällig", description: "Wenn eine Aufgabe fällig wird" },
  { type: "task_completed", label: "Aufgabe erledigt", description: "Wenn eine Aufgabe abgeschlossen wird" },
  { type: "meter_reading_due", label: "Zählerablesung fällig", description: "Wenn eine Zählerablesung ansteht" },
  { type: "meter_reading_submitted", label: "Zählerablesung eingereicht", description: "Wenn ein Zählerstand eingereicht wird" },
  { type: "document_uploaded", label: "Dokument hochgeladen", description: "Wenn ein Dokument hochgeladen wird" },
  { type: "document_signed", label: "Dokument signiert", description: "Wenn ein Dokument signiert wird" },
  { type: "message_received", label: "Nachricht erhalten", description: "Wenn eine neue Nachricht eingeht" },
  { type: "inquiry_received", label: "Anfrage erhalten", description: "Wenn eine neue Anfrage eingeht" },
  { type: "billing_created", label: "Abrechnung erstellt", description: "Wenn eine Abrechnung erstellt wird" },
  { type: "billing_sent", label: "Abrechnung versendet", description: "Wenn eine Abrechnung versendet wird" },
  { type: "workflow_completed", label: "Workflow abgeschlossen", description: "Wenn ein Workflow erfolgreich ist" },
  { type: "workflow_failed", label: "Workflow fehlgeschlagen", description: "Wenn ein Workflow fehlschlägt" },
  { type: "system_alert", label: "System-Warnung", description: "Wichtige Systemwarnungen" },
  { type: "system_info", label: "System-Info", description: "Allgemeine Systeminformationen" },
];

export interface NotificationPreference {
  id?: string;
  notification_type: NotificationType;
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
}

export interface NotificationSettings {
  id?: string;
  digest_frequency: "instant" | "daily" | "weekly";
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  email_frequency: "instant" | "daily" | "weekly";
}

export function useNotificationSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  // Fetch notification preferences
  const usePreferences = () => {
    return useQuery({
      queryKey: [NOTIFICATION_PREFERENCES_KEY, userId],
      queryFn: async () => {
        if (!userId) return [];

        const { data, error } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", userId);

        if (error) throw error;
        return data;
      },
      enabled: !!userId,
    });
  };

  // Fetch general notification settings
  const useSettings = () => {
    return useQuery({
      queryKey: [NOTIFICATION_SETTINGS_KEY, userId],
      queryFn: async () => {
        if (!userId) return null;

        const { data, error } = await supabase
          .from("notification_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        return data;
      },
      enabled: !!userId,
    });
  };

  // Upsert preference for a notification type
  const updatePreference = useMutation({
    mutationFn: async (preference: NotificationPreference) => {
      if (!userId) throw new Error("User required");

      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: userId,
            notification_type: preference.notification_type,
            in_app_enabled: preference.in_app_enabled,
            email_enabled: preference.email_enabled,
            push_enabled: preference.push_enabled,
          },
          {
            onConflict: "user_id,notification_type",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATION_PREFERENCES_KEY] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Einstellung konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Update general settings
  const updateSettings = useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      if (!userId) throw new Error("User required");

      const { data, error } = await supabase
        .from("notification_settings")
        .upsert(
          {
            user_id: userId,
            ...settings,
          },
          {
            onConflict: "user_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATION_SETTINGS_KEY] });
      toast({
        title: "Gespeichert",
        description: "Benachrichtigungseinstellungen wurden aktualisiert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Check if push notifications are supported
  const isPushSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

  // Request push permission
  const requestPushPermission = async (): Promise<boolean> => {
    if (!isPushSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch {
      return false;
    }
  };

  // Get push permission status
  const getPushPermissionStatus = (): NotificationPermission | "unsupported" => {
    if (!isPushSupported) return "unsupported";
    return Notification.permission;
  };

  return {
    usePreferences,
    useSettings,
    updatePreference,
    updateSettings,
    isPushSupported,
    requestPushPermission,
    getPushPermissionStatus,
  };
}
