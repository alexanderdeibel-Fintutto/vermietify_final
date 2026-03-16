import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import type { Database } from "@/integrations/supabase/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
type NotificationType = Database["public"]["Enums"]["notification_type"];

const NOTIFICATIONS_KEY = "notifications";

// Notification type configuration
export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { icon: string; color: string; category: string }> = {
  payment_received: { icon: "💰", color: "text-success", category: "Zahlungen" },
  payment_overdue: { icon: "⚠️", color: "text-destructive", category: "Zahlungen" },
  payment_reminder: { icon: "🔔", color: "text-warning", category: "Zahlungen" },
  contract_ending: { icon: "📋", color: "text-warning", category: "Verträge" },
  contract_created: { icon: "📝", color: "text-success", category: "Verträge" },
  contract_terminated: { icon: "🚪", color: "text-muted-foreground", category: "Verträge" },
  tenant_created: { icon: "👤", color: "text-primary", category: "Mieter" },
  tenant_document: { icon: "📄", color: "text-primary", category: "Mieter" },
  task_assigned: { icon: "✅", color: "text-primary", category: "Aufgaben" },
  task_due: { icon: "⏰", color: "text-warning", category: "Aufgaben" },
  task_completed: { icon: "✔️", color: "text-success", category: "Aufgaben" },
  meter_reading_due: { icon: "📊", color: "text-warning", category: "Zähler" },
  meter_reading_submitted: { icon: "📈", color: "text-success", category: "Zähler" },
  document_uploaded: { icon: "📤", color: "text-primary", category: "Dokumente" },
  document_signed: { icon: "✍️", color: "text-success", category: "Dokumente" },
  message_received: { icon: "💬", color: "text-primary", category: "Nachrichten" },
  inquiry_received: { icon: "📩", color: "text-primary", category: "Anfragen" },
  billing_created: { icon: "📊", color: "text-primary", category: "Abrechnung" },
  billing_sent: { icon: "📬", color: "text-success", category: "Abrechnung" },
  workflow_completed: { icon: "⚡", color: "text-success", category: "Automatisierung" },
  workflow_failed: { icon: "❌", color: "text-destructive", category: "Automatisierung" },
  system_alert: { icon: "🚨", color: "text-destructive", category: "System" },
  system_info: { icon: "ℹ️", color: "text-muted-foreground", category: "System" },
};

export function useNotifications() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  const queryClient = useQueryClient();

  // Fetch recent notifications (for dropdown)
  const useRecentNotifications = (limit = 10) => {
    return useQuery({
      queryKey: [NOTIFICATIONS_KEY, "recent", organizationId, limit],
      queryFn: async () => {
        if (!organizationId) return [];

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data as NotificationRow[];
      },
      enabled: !!organizationId,
    });
  };

  // Fetch all notifications with pagination
  const useAllNotifications = (options?: { 
    filter?: "all" | "unread"; 
    type?: NotificationType;
    page?: number;
    pageSize?: number;
  }) => {
    const { filter = "all", type, page = 1, pageSize = 50 } = options || {};
    
    return useQuery({
      queryKey: [NOTIFICATIONS_KEY, "all", organizationId, filter, type, page, pageSize],
      queryFn: async () => {
        if (!organizationId) return { data: [], count: 0 };

        let query = supabase
          .from("notifications")
          .select("*", { count: "exact" })
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);

        if (filter === "unread") {
          query = query.eq("is_read", false);
        }

        if (type) {
          query = query.eq("type", type);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data as NotificationRow[], count: count || 0 };
      },
      enabled: !!organizationId,
    });
  };

  // Get unread count
  const useUnreadCount = () => {
    return useQuery({
      queryKey: [NOTIFICATIONS_KEY, "unread_count", organizationId],
      queryFn: async () => {
        if (!organizationId) return 0;

        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("is_read", false);

        if (error) throw error;
        return count || 0;
      },
      enabled: !!organizationId,
    });
  };

  // Mark single notification as read
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("Organization required");

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("organization_id", organizationId)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      toast({
        title: "Alle gelesen",
        description: "Alle Benachrichtigungen wurden als gelesen markiert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Benachrichtigungen konnten nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  // Create notification
  const createNotification = useMutation({
    mutationFn: async (data: Omit<NotificationInsert, "organization_id">) => {
      if (!organizationId) throw new Error("Organization required");

      const { data: notification, error } = await supabase
        .from("notifications")
        .insert({
          ...data,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      return notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });

  // Subscribe to real-time updates
  const useRealtimeNotifications = () => {
    useEffect(() => {
      if (!organizationId) return;

      const channel = supabase
        .channel("notifications-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `organization_id=eq.${organizationId}`,
          },
          (payload) => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
            
            // Show toast for new notification
            const notification = payload.new as NotificationRow;
            toast({
              title: notification.title,
              description: notification.message || undefined,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [organizationId, queryClient, toast]);
  };

  return {
    useRecentNotifications,
    useAllNotifications,
    useUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    useRealtimeNotifications,
  };
}

// Helper function to format relative time
export function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `vor ${diffMins} Min`;
  if (diffHours < 24) return `vor ${diffHours} Std`;
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  
  return then.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Helper function to group notifications by date
export function groupNotificationsByDate(notifications: NotificationRow[]): Record<string, NotificationRow[]> {
  const groups: Record<string, NotificationRow[]> = {
    "Heute": [],
    "Gestern": [],
    "Diese Woche": [],
    "Älter": [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  notifications.forEach(notification => {
    const date = new Date(notification.created_at);
    const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (notificationDate.getTime() === today.getTime()) {
      groups["Heute"].push(notification);
    } else if (notificationDate.getTime() === yesterday.getTime()) {
      groups["Gestern"].push(notification);
    } else if (notificationDate.getTime() > weekAgo.getTime()) {
      groups["Diese Woche"].push(notification);
    } else {
      groups["Älter"].push(notification);
    }
  });

  return groups;
}
