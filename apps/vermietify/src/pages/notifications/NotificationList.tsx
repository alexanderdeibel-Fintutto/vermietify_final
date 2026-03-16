import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bell, 
  Check, 
  Settings, 
  Trash2,
  ExternalLink 
} from "lucide-react";
import {
  useNotifications,
  NOTIFICATION_TYPE_CONFIG,
  formatRelativeTime,
  groupNotificationsByDate,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationType = Database["public"]["Enums"]["notification_type"];

// Get unique categories from notification types
const NOTIFICATION_CATEGORIES = Array.from(
  new Set(Object.values(NOTIFICATION_TYPE_CONFIG).map(c => c.category))
);

export default function NotificationList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const {
    useAllNotifications,
    useUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const { data: notificationsData, isLoading } = useAllNotifications({
    filter,
    type: typeFilter !== "all" ? (typeFilter as NotificationType) : undefined,
  });
  const { data: unreadCount } = useUnreadCount();

  const notifications = notificationsData?.data || [];
  const groupedNotifications = groupNotificationsByDate(notifications);

  const handleNotificationClick = (notification: NotificationRow) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const renderNotificationItem = (notification: NotificationRow) => {
    const config = NOTIFICATION_TYPE_CONFIG[notification.type];
    
    return (
      <div
        key={notification.id}
        className={cn(
          "flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer",
          !notification.is_read && "bg-primary/5 border-primary/20"
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl">
          {notification.icon || config?.icon || "🔔"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn(
                "font-medium",
                !notification.is_read ? "text-foreground" : "text-muted-foreground"
              )}>
                {notification.title}
              </p>
              {notification.message && (
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {config?.category || "Sonstige"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(notification.created_at)}
                </span>
              </div>
            </div>

            {/* Unread indicator */}
            {!notification.is_read && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {notification.link && (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                markAsRead.mutate(notification.id);
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification.mutate(notification.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <MainLayout
      title="Benachrichtigungen"
      breadcrumbs={[{ label: "Benachrichtigungen" }]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => markAllAsRead.mutate()}
            disabled={!unreadCount || unreadCount === 0 || markAllAsRead.isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            Alle als gelesen
          </Button>
          <Button variant="outline" onClick={() => navigate("/einstellungen/benachrichtigungen")}>
            <Settings className="h-4 w-4 mr-2" />
            Einstellungen
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ungelesen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gesamt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notificationsData?.count || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Heute
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {groupedNotifications["Heute"]?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")} className="flex-1">
                <TabsList>
                  <TabsTrigger value="all">Alle</TabsTrigger>
                  <TabsTrigger value="unread">
                    Ungelesen
                    {unreadCount && unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Typ filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  {NOTIFICATION_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification List */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Laden...</p>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Keine Benachrichtigungen</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === "unread"
                  ? "Sie haben alle Benachrichtigungen gelesen"
                  : "Es gibt noch keine Benachrichtigungen"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([group, groupNotifications]) => {
              if (groupNotifications.length === 0) return null;

              return (
                <div key={group}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {group}
                  </h3>
                  <div className="space-y-2">
                    {groupNotifications.map(renderNotificationItem)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
