import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const typeConfig: Record<Notification['type'], { icon: typeof Info; color: string; bgColor: string }> = {
  info: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  success: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  warning: { icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  error: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const recentNotifications = notifications.slice(0, 10);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Benachrichtigungen</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-8">
              <CheckCheck className="h-3 w-3 mr-1" />
              Alle gelesen
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Keine Benachrichtigungen</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => {
                const config = typeConfig[notification.type];
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-3 hover:bg-accent/50 transition-colors cursor-pointer',
                      !notification.read && 'bg-accent/20'
                    )}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={cn('p-2 rounded-full shrink-0', config.bgColor)}>
                        <Icon className={cn('h-4 w-4', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm font-medium truncate', !notification.read && 'font-semibold')}>
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: de })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button variant="ghost" className="w-full justify-center text-sm" asChild>
            <Link to="/benachrichtigungen">Alle anzeigen</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
