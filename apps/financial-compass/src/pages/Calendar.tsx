import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Eye,
  CreditCard,
  Wrench,
  MoreHorizontal,
  Bell,
  Repeat,
  Home,
  User,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  type: 'deadline' | 'viewing' | 'payment' | 'maintenance' | 'other';
  propertyId?: string;
  propertyName?: string;
  contactId?: string;
  contactName?: string;
  reminder: 'none' | '1day' | '1week';
  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  color: string;
}

const EVENT_TYPES = [
  { value: 'deadline', label: 'Frist', color: 'bg-red-500', icon: AlertCircle },
  { value: 'viewing', label: 'Besichtigung', color: 'bg-blue-500', icon: Eye },
  { value: 'payment', label: 'Zahlung', color: 'bg-green-500', icon: CreditCard },
  { value: 'maintenance', label: 'Wartung', color: 'bg-orange-500', icon: Wrench },
  { value: 'other', label: 'Sonstiges', color: 'bg-gray-500', icon: MoreHorizontal },
];

const DAYS_OF_WEEK = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

const getEventTypeConfig = (type: string) => {
  return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[4];
};

export default function Calendar() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Nebenkostenabrechnung 2025',
      description: 'Frist für die Erstellung der Nebenkostenabrechnung',
      startDate: '2026-12-31',
      type: 'deadline',
      reminder: '1week',
      recurring: 'yearly',
      color: 'bg-red-500',
    },
    {
      id: '2',
      title: 'Besichtigung Musterstraße 12',
      description: 'Interessent: Herr Müller',
      startDate: '2026-02-10',
      startTime: '14:00',
      endTime: '14:30',
      type: 'viewing',
      propertyName: 'Musterstraße 12, Whg 3',
      reminder: '1day',
      recurring: 'none',
      color: 'bg-blue-500',
    },
    {
      id: '3',
      title: 'Mietzahlung Familie Schmidt',
      description: 'Monatliche Kaltmiete: 850€',
      startDate: '2026-02-01',
      type: 'payment',
      contactName: 'Familie Schmidt',
      reminder: 'none',
      recurring: 'monthly',
      color: 'bg-green-500',
    },
    {
      id: '4',
      title: 'Rauchmelder-Prüfung',
      description: 'Jährliche Wartung aller Rauchmelder',
      startDate: '2026-03-15',
      type: 'maintenance',
      propertyName: 'Alle Objekte',
      reminder: '1week',
      recurring: 'yearly',
      color: 'bg-orange-500',
    },
    {
      id: '5',
      title: 'Heizungswartung',
      description: 'Jährliche Heizungswartung',
      startDate: '2026-02-20',
      startTime: '09:00',
      endTime: '12:00',
      type: 'maintenance',
      propertyName: 'Beispielweg 5',
      reminder: '1day',
      recurring: 'none',
      color: 'bg-orange-500',
    },
  ]);
  
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endTime: '',
    type: 'other',
    propertyName: '',
    contactName: '',
    reminder: 'none',
    recurring: 'none',
  });

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert to Monday = 0
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      if (event.startDate === dateStr) return true;
      
      // Handle recurring events
      if (event.recurring !== 'none') {
        const eventDate = new Date(event.startDate);
        
        if (event.recurring === 'monthly' && eventDate.getDate() === date.getDate()) {
          return true;
        }
        if (event.recurring === 'yearly' && 
            eventDate.getMonth() === date.getMonth() && 
            eventDate.getDate() === date.getDate()) {
          return true;
        }
      }
      
      return false;
    });
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setFormData({
      ...formData,
      startDate: clickedDate.toISOString().split('T')[0],
    });
    setDialogOpen(true);
  };

  const handleNewEvent = () => {
    setSelectedDate(new Date());
    setFormData({
      title: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      type: 'other',
      propertyName: '',
      contactName: '',
      reminder: 'none',
      recurring: 'none',
    });
    setDialogOpen(true);
  };

  const handleSaveEvent = () => {
    if (!formData.title || !formData.startDate) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen Titel und ein Datum ein.',
        variant: 'destructive',
      });
      return;
    }

    const typeConfig = getEventTypeConfig(formData.type || 'other');
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      type: formData.type as CalendarEvent['type'],
      propertyName: formData.propertyName,
      contactName: formData.contactName,
      reminder: formData.reminder as CalendarEvent['reminder'],
      recurring: formData.recurring as CalendarEvent['recurring'],
      color: typeConfig.color,
    };

    setEvents([...events, newEvent]);
    setDialogOpen(false);
    toast({
      title: 'Termin erstellt',
      description: `"${formData.title}" wurde zum Kalender hinzugefügt.`,
    });
  };

  // Get upcoming events for next 7 days
  const getUpcomingEvents = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate >= today && eventDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  // Render calendar grid
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-muted/20 rounded-lg" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-24 md:h-32 p-2 rounded-lg border cursor-pointer transition-colors hover:border-primary/50 ${
            isToday ? 'bg-primary/10 border-primary' : 'bg-card/50 border-border'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
            {day}
          </div>
          <div className="space-y-1 overflow-hidden">
            {dayEvents.slice(0, 3).map((event) => {
              const typeConfig = getEventTypeConfig(event.type);
              return (
                <div
                  key={event.id}
                  className={`text-xs px-1.5 py-0.5 rounded truncate text-white ${typeConfig.color}`}
                >
                  {event.startTime && `${event.startTime} `}
                  {event.title}
                </div>
              );
            })}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{dayEvents.length - 3} weitere
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kalender</h1>
          <p className="text-muted-foreground">Termine und Fristen im Überblick</p>
        </div>
        <Button onClick={handleNewEvent} className="gap-2">
          <Plus className="h-4 w-4" />
          Neuer Termin
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Calendar */}
        <div className="lg:col-span-3">
          <Card className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={previousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" onClick={goToToday}>
                  Heute
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {renderCalendarGrid()}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                {EVENT_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${type.color}`} />
                    <span className="text-sm text-muted-foreground">{type.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Nächste 7 Tage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Keine anstehenden Termine
                </p>
              ) : (
                upcomingEvents.map((event) => {
                  const typeConfig = getEventTypeConfig(event.type);
                  const TypeIcon = typeConfig.icon;
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
                    >
                      <div className={`p-2 rounded-lg ${typeConfig.color}/10`}>
                        <TypeIcon className={`h-4 w-4 ${typeConfig.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString('de-DE', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {event.startTime && ` • ${event.startTime}`}
                        </p>
                        {event.propertyName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Home className="h-3 w-3" />
                            {event.propertyName}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Automatic Deadlines Info */}
          <Card className="glass border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-orange-500">
                <AlertCircle className="h-4 w-4" />
                Automatische Fristen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Nebenkostenabrechnung (31.12.)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Rauchmelder-Prüfung (jährlich)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Mieterhöhung (Ankündigungsfrist)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neuer Termin</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Kalendertermin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                placeholder="Terminbezeichnung"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Weitere Details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Datum *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Typ</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as CalendarEvent['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded ${type.color}`} />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Von</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Bis</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="property">Objekt</Label>
                <Input
                  id="property"
                  placeholder="z.B. Musterstr. 12"
                  value={formData.propertyName}
                  onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Kontakt</Label>
                <Input
                  id="contact"
                  placeholder="z.B. Herr Müller"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Erinnerung</Label>
                <Select
                  value={formData.reminder}
                  onValueChange={(value) => setFormData({ ...formData, reminder: value as CalendarEvent['reminder'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine</SelectItem>
                    <SelectItem value="1day">1 Tag vorher</SelectItem>
                    <SelectItem value="1week">1 Woche vorher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Wiederholung</Label>
                <Select
                  value={formData.recurring}
                  onValueChange={(value) => setFormData({ ...formData, recurring: value as CalendarEvent['recurring'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine</SelectItem>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                    <SelectItem value="yearly">Jährlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEvent}>
              Termin erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
