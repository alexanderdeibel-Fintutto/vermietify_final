import { useState } from "react";
import { Download, RefreshCw, Link as LinkIcon, Calendar, List, LayoutGrid } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CalendarView } from "@/components/calendar/CalendarView";
import { CalendarSidebar } from "@/components/calendar/CalendarSidebar";
import { EventDialog } from "@/components/calendar/EventDialog";
import { useCalendar, CalendarCategory, CalendarEvent, CreateEventInput } from "@/hooks/useCalendar";
import { LoadingState } from "@/components/shared/LoadingState";

type ViewMode = "month" | "week" | "day" | "list";

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [defaultCategory, setDefaultCategory] = useState<CalendarCategory | undefined>();
  const [icalDialogOpen, setIcalDialogOpen] = useState(false);

  const {
    events,
    eventsLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    syncAutoEvents,
    icalToken,
    createIcalToken,
    upcomingEvents,
    overdueDeadlines,
  } = useCalendar();

  const handleNewEvent = (category?: CalendarCategory) => {
    setSelectedEvent(null);
    setSelectedDate(undefined);
    setDefaultCategory(category);
    setEventDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setDefaultCategory(undefined);
    setEventDialogOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setSelectedEvent(null);
    setSelectedDate(date);
    setDefaultCategory(undefined);
    setEventDialogOpen(true);
  };

  const handleSaveEvent = (data: CreateEventInput) => {
    if (selectedEvent) {
      updateEvent.mutate({ id: selectedEvent.id, ...data });
    } else {
      createEvent.mutate(data);
    }
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent.mutate(id);
  };

  const getIcalUrl = () => {
    if (!icalToken) return "";
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${baseUrl}/functions/v1/generate-ical-feed?token=${icalToken.token}`;
  };

  const copyIcalUrl = () => {
    navigator.clipboard.writeText(getIcalUrl());
    toast.success("Link kopiert!");
  };

  if (eventsLoading) {
    return (
      <MainLayout title="Kalender">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Kalender">
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="px-6 py-4 border-b">
          <PageHeader
            title="Kalender"
            subtitle="Termine, Fristen und Übergaben verwalten"
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncAutoEvents.mutate()}
                  disabled={syncAutoEvents.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncAutoEvents.isPending ? "animate-spin" : ""}`} />
                  Auto-Sync
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIcalDialogOpen(true)}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  iCal-Link
                </Button>
                <Button onClick={() => handleNewEvent()}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Neuer Termin
                </Button>
              </div>
            }
          />

          <div className="mt-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="month">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Monat
                </TabsTrigger>
                <TabsTrigger value="week">
                  <Calendar className="h-4 w-4 mr-2" />
                  Woche
                </TabsTrigger>
                <TabsTrigger value="day">
                  <Calendar className="h-4 w-4 mr-2" />
                  Tag
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  Liste
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-6 overflow-auto">
            <CalendarView
              events={events || []}
              viewMode={viewMode}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          </div>

          <CalendarSidebar
            upcomingEvents={upcomingEvents}
            overdueDeadlines={overdueDeadlines}
            onNewEvent={handleNewEvent}
            onEventClick={handleEventClick}
          />
        </div>
      </div>

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={selectedEvent}
        defaultDate={selectedDate}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      <Dialog open={icalDialogOpen} onOpenChange={setIcalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kalender abonnieren</DialogTitle>
            <DialogDescription>
              Verwenden Sie diesen Link, um Ihren Vermietify-Kalender in Google Calendar, Outlook oder anderen Apps zu abonnieren.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {icalToken ? (
              <div className="space-y-2">
                <Label>iCal-Feed URL</Label>
                <div className="flex gap-2">
                  <Input value={getIcalUrl()} readOnly />
                  <Button onClick={copyIcalUrl}>
                    Kopieren
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dieser Link wird automatisch aktualisiert. Teilen Sie ihn nicht mit anderen.
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Sie haben noch keinen iCal-Link erstellt.
                </p>
                <Button onClick={() => createIcalToken.mutate()}>
                  Link erstellen
                </Button>
              </div>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">So fügen Sie den Kalender hinzu:</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>Google Calendar:</strong> Einstellungen → Kalender hinzufügen → Per URL → Link einfügen</p>
                <p><strong>Apple Kalender:</strong> Ablage → Neues Kalenderabonnement → Link einfügen</p>
                <p><strong>Outlook:</strong> Kalender hinzufügen → Aus dem Internet abonnieren → Link einfügen</p>
              </CardContent>
            </Card>

            {icalToken && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => createIcalToken.mutate()}
              >
                Neuen Link generieren
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
