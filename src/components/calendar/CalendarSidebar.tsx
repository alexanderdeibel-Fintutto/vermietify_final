import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarPlus, Clock, AlertTriangle, Eye, Key, Wrench, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarEvent, CATEGORY_COLORS, CATEGORY_LABELS, CalendarCategory } from "@/hooks/useCalendar";

interface CalendarSidebarProps {
  upcomingEvents: CalendarEvent[];
  overdueDeadlines: CalendarEvent[];
  onNewEvent: (category?: CalendarCategory) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const CATEGORY_ICONS: Record<CalendarCategory, React.ReactNode> = {
  viewing: <Eye className="h-4 w-4" />,
  handover: <Key className="h-4 w-4" />,
  deadline: <AlertTriangle className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  maintenance: <Wrench className="h-4 w-4" />,
  other: <Clock className="h-4 w-4" />,
};

export function CalendarSidebar({
  upcomingEvents,
  overdueDeadlines,
  onNewEvent,
  onEventClick,
}: CalendarSidebarProps) {
  return (
    <div className="w-80 border-l bg-muted/20 p-4 space-y-4 overflow-hidden flex flex-col">
      {/* Quick Add Buttons */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Schnell erstellen</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() => onNewEvent("viewing")}
          >
            <Eye className="h-4 w-4 mr-2 text-blue-500" />
            Besichtigung
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() => onNewEvent("handover")}
          >
            <Key className="h-4 w-4 mr-2 text-green-500" />
            Übergabe
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() => onNewEvent("maintenance")}
          >
            <Wrench className="h-4 w-4 mr-2 text-purple-500" />
            Wartung
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() => onNewEvent("deadline")}
          >
            <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
            Frist
          </Button>
        </CardContent>
      </Card>

      {/* Overdue Deadlines */}
      {overdueDeadlines.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Überfällige Fristen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {overdueDeadlines.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="w-full text-left p-2 rounded-md hover:bg-destructive/10 transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-destructive">
                      {format(new Date(event.start_at), "dd.MM.yyyy", { locale: de })}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Nächste 7 Tage
            <Badge variant="secondary" className="ml-auto">
              {upcomingEvents.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine anstehenden Termine
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[event.category] }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[event.category]}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.start_at), "EEEE, dd.MM.", { locale: de })}
                      {!event.all_day && (
                        <span> • {format(new Date(event.start_at), "HH:mm")}</span>
                      )}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
