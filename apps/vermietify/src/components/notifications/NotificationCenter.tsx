import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  useNotifications, 
  NOTIFICATION_TYPE_CONFIG,
  formatRelativeTime 
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export function NotificationCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const {
    useRecentNotifications,
    useUnreadCount,
    markAsRead,
    markAllAsRead,
    useRealtimeNotifications,
  } = useNotifications();

  // Enable realtime updates
  useRealtimeNotifications();

  const { data: notifications, isLoading } = useRecentNotifications(10);
  const { data: unreadCount } = useUnreadCount();

  const handleNotificationClick = (notification: NotificationRow) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate to link if available
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/benachrichtigungen");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Benachrichtigungen</h4>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <Check className="h-3 w-3 mr-1" />
              Alle als gelesen
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="h-[350px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground">Laden...</p>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = NOTIFICATION_TYPE_CONFIG[notification.type];
                return (
                  <button
                    key={notification.id}
                    className={cn(
                      "w-full text-left p-4 hover:bg-muted/50 transition-colors",
                      !notification.is_read && "bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 text-xl">
                        {notification.icon || config?.icon || "🔔"}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            !notification.is_read && "text-foreground",
                            notification.is_read && "text-muted-foreground"
                          )}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        {notification.message && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Keine Benachrichtigungen
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="p-2 flex justify-between">
          <Button variant="ghost" size="sm" onClick={handleViewAll}>
            Alle anzeigen
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setOpen(false);
              navigate("/einstellungen/benachrichtigungen");
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
