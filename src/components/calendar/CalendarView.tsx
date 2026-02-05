import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
} from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarEvent, CATEGORY_COLORS } from "@/hooks/useCalendar";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day" | "list";

interface CalendarViewProps {
  events: CalendarEvent[];
  viewMode: ViewMode;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
}

export function CalendarView({
  events,
  viewMode,
  currentDate,
  onDateChange,
  onEventClick,
  onDayClick,
}: CalendarViewProps) {
  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      onDateChange(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (viewMode === "week") {
      onDateChange(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else if (viewMode === "day") {
      onDateChange(direction === "next" ? addDays(currentDate, 1) : subDays(currentDate, 1));
    }
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.start_at), day));
  };

  const getTitle = () => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy", { locale: de });
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, "dd.MM.")} - ${format(end, "dd.MM.yyyy")}`;
    } else if (viewMode === "day") {
      return format(currentDate, "EEEE, dd. MMMM yyyy", { locale: de });
    }
    return "";
  };

  if (viewMode === "list") {
    return <ListView events={events} onEventClick={onEventClick} />;
  }

  if (viewMode === "day") {
    return (
      <DayView
        date={currentDate}
        events={getEventsForDay(currentDate)}
        onEventClick={onEventClick}
        title={getTitle()}
        onNavigate={navigate}
        onToday={() => onDateChange(new Date())}
      />
    );
  }

  if (viewMode === "week") {
    return (
      <WeekView
        currentDate={currentDate}
        events={events}
        onEventClick={onEventClick}
        onDayClick={onDayClick}
        title={getTitle()}
        onNavigate={navigate}
        onToday={() => onDateChange(new Date())}
      />
    );
  }

  // Month View
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{getTitle()}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
            Heute
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden flex-1">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
          <div
            key={day}
            className="bg-muted p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                "bg-background p-1 min-h-[100px] text-left hover:bg-muted/50 transition-colors",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1",
                  isToday && "bg-primary text-primary-foreground font-bold"
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[event.category]}20`,
                      borderLeft: `3px solid ${CATEGORY_COLORS[event.category]}`,
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayEvents.length - 3} weitere
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  currentDate,
  events,
  onEventClick,
  onDayClick,
  title,
  onNavigate,
  onToday,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
  title: string;
  onNavigate: (direction: "prev" | "next") => void;
  onToday: () => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_at);
      return isSameDay(eventDate, day) && eventDate.getHours() === hour && !event.all_day;
    });
  };

  const getAllDayEvents = (day: Date) => {
    return events.filter((event) => event.all_day && isSameDay(new Date(event.start_at), day));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToday}>
            Heute
          </Button>
          <Button variant="outline" size="icon" onClick={() => onNavigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onNavigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border rounded-lg">
        <div className="grid grid-cols-8 sticky top-0 bg-background z-10 border-b">
          <div className="w-16" />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "p-2 text-center border-l",
                isSameDay(day, new Date()) && "bg-primary/10"
              )}
            >
              <div className="text-sm text-muted-foreground">
                {format(day, "EEE", { locale: de })}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold",
                  isSameDay(day, new Date()) && "text-primary"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* All-day events */}
        <div className="grid grid-cols-8 border-b bg-muted/30">
          <div className="w-16 text-xs text-muted-foreground p-1">Ganztägig</div>
          {weekDays.map((day) => {
            const allDayEvents = getAllDayEvents(day);
            return (
              <div key={day.toISOString()} className="border-l p-1 min-h-[40px]">
                {allDayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="text-xs p-1 rounded mb-1 truncate cursor-pointer hover:opacity-80"
                    style={{
                      backgroundColor: CATEGORY_COLORS[event.category],
                      color: "white",
                    }}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Hour rows */}
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
            <div className="w-16 text-xs text-muted-foreground p-1 text-right pr-2">
              {hour.toString().padStart(2, "0")}:00
            </div>
            {weekDays.map((day) => {
              const hourEvents = getEventsForDayAndHour(day, hour);
              return (
                <div
                  key={day.toISOString()}
                  className="border-l p-1 cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    const clickedDate = new Date(day);
                    clickedDate.setHours(hour);
                    onDayClick(clickedDate);
                  }}
                >
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className="text-xs p-1 rounded mb-1 truncate cursor-pointer hover:opacity-80"
                      style={{
                        backgroundColor: CATEGORY_COLORS[event.category],
                        color: "white",
                      }}
                    >
                      {format(new Date(event.start_at), "HH:mm")} {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayView({
  date,
  events,
  onEventClick,
  title,
  onNavigate,
  onToday,
}: {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  title: string;
  onNavigate: (direction: "prev" | "next") => void;
  onToday: () => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const allDayEvents = events.filter((e) => e.all_day);
  const timedEvents = events.filter((e) => !e.all_day);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToday}>
            Heute
          </Button>
          <Button variant="outline" size="icon" onClick={() => onNavigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onNavigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border rounded-lg">
        {allDayEvents.length > 0 && (
          <div className="p-2 border-b bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Ganztägig</p>
            <div className="space-y-1">
              {allDayEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="text-sm p-2 rounded cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: CATEGORY_COLORS[event.category],
                    color: "white",
                  }}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {hours.map((hour) => {
          const hourEvents = timedEvents.filter(
            (e) => new Date(e.start_at).getHours() === hour
          );
          return (
            <div key={hour} className="flex border-b min-h-[60px]">
              <div className="w-16 text-xs text-muted-foreground p-1 text-right pr-2 flex-shrink-0">
                {hour.toString().padStart(2, "0")}:00
              </div>
              <div className="flex-1 p-1">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="text-sm p-2 rounded mb-1 cursor-pointer hover:opacity-80"
                    style={{
                      backgroundColor: CATEGORY_COLORS[event.category],
                      color: "white",
                    }}
                  >
                    <span className="font-medium">
                      {format(new Date(event.start_at), "HH:mm")}
                    </span>{" "}
                    {event.title}
                    {event.description && (
                      <p className="text-xs opacity-80 mt-1">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({
  events,
  onEventClick,
}: {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}) {
  const sortedEvents = useMemo(() => {
    return [...events]
      .filter((e) => new Date(e.start_at) >= new Date())
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [events]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    sortedEvents.forEach((event) => {
      const dateKey = format(new Date(event.start_at), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  }, [sortedEvents]);

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDate).map(([dateKey, dayEvents]) => (
        <div key={dateKey}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            {format(new Date(dateKey), "EEEE, dd. MMMM yyyy", { locale: de })}
          </h3>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: CATEGORY_COLORS[event.category],
                }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{event.title}</h4>
                  <span className="text-sm text-muted-foreground">
                    {event.all_day
                      ? "Ganztägig"
                      : format(new Date(event.start_at), "HH:mm")}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                )}
                {event.location && (
                  <p className="text-xs text-muted-foreground mt-1">📍 {event.location}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {sortedEvents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Keine anstehenden Termine
        </div>
      )}
    </div>
  );
}
