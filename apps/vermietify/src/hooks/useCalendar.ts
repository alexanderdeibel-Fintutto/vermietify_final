import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type CalendarCategory = 'viewing' | 'handover' | 'deadline' | 'payment' | 'maintenance' | 'other';
export type RelatedEntityType = 'building' | 'unit' | 'tenant' | 'contract' | 'handover';

export interface CalendarEvent {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  category: CalendarCategory;
  start_at: string;
  end_at?: string;
  all_day: boolean;
  location?: string;
  related_type?: RelatedEntityType;
  related_id?: string;
  recurrence_rule?: any;
  reminder_minutes?: number[];
  color?: string;
  is_auto_generated: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  category: CalendarCategory;
  start_at: string;
  end_at?: string;
  all_day?: boolean;
  location?: string;
  related_type?: RelatedEntityType;
  related_id?: string;
  recurrence_rule?: any;
  reminder_minutes?: number[];
}

export const CATEGORY_COLORS: Record<CalendarCategory, string> = {
  viewing: '#3b82f6',    // Blue
  handover: '#22c55e',   // Green
  deadline: '#f97316',   // Orange
  payment: '#ef4444',    // Red
  maintenance: '#a855f7', // Purple
  other: '#6b7280',      // Gray
};

export const CATEGORY_LABELS: Record<CalendarCategory, string> = {
  viewing: 'Besichtigung',
  handover: 'Übergabe',
  deadline: 'Frist',
  payment: 'Zahlungsfrist',
  maintenance: 'Wartung/Handwerker',
  other: 'Sonstige',
};

export function useCalendar() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = profile?.organization_id;

  // Fetch all events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["calendar-events", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("organization_id", organizationId)
        .order("start_at", { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!organizationId,
  });

  // Fetch events for a date range
  const useEventsInRange = (startDate: Date, endDate: Date) => {
    return useQuery({
      queryKey: ["calendar-events-range", organizationId, startDate.toISOString(), endDate.toISOString()],
      queryFn: async () => {
        if (!organizationId) return [];

        const { data, error } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("organization_id", organizationId)
          .gte("start_at", startDate.toISOString())
          .lte("start_at", endDate.toISOString())
          .order("start_at", { ascending: true });

        if (error) throw error;
        return data as CalendarEvent[];
      },
      enabled: !!organizationId,
    });
  };

  // Create event
  const createEvent = useMutation({
    mutationFn: async (input: CreateEventInput) => {
      if (!organizationId) throw new Error("No organization");

      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          ...input,
          organization_id: organizationId,
          all_day: input.all_day ?? false,
          is_auto_generated: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Create reminders if specified
      if (input.reminder_minutes && input.reminder_minutes.length > 0) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const startAt = new Date(input.start_at);
          const reminders = input.reminder_minutes.map(minutes => ({
            event_id: data.id,
            user_id: userData.user!.id,
            remind_at: new Date(startAt.getTime() - minutes * 60 * 1000).toISOString(),
            channel: 'app' as const,
          }));

          await supabase.from("calendar_reminders").insert(reminders);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Termin erstellt");
    },
    onError: (error) => {
      toast.error("Fehler beim Erstellen: " + error.message);
    },
  });

  // Update event
  const updateEvent = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CalendarEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Termin aktualisiert");
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    },
  });

  // Delete event
  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Termin gelöscht");
    },
    onError: (error) => {
      toast.error("Fehler beim Löschen: " + error.message);
    },
  });

  // Sync auto-generated events
  const syncAutoEvents = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("No organization");

      const { data, error } = await supabase.functions.invoke("sync-auto-events", {
        body: { organization_id: organizationId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success(`${data.created_events} automatische Termine erstellt`);
    },
    onError: (error) => {
      toast.error("Fehler bei der Synchronisation: " + error.message);
    },
  });

  // Get iCal token
  const { data: icalToken } = useQuery({
    queryKey: ["ical-token", organizationId],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || !organizationId) return null;

      const { data, error } = await supabase
        .from("calendar_ical_tokens")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("user_id", userData.user.id)
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Create iCal token
  const createIcalToken = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || !organizationId) throw new Error("Not authenticated");

      // Delete existing tokens
      await supabase
        .from("calendar_ical_tokens")
        .delete()
        .eq("organization_id", organizationId)
        .eq("user_id", userData.user.id);

      // Create new token
      const { data, error } = await supabase
        .from("calendar_ical_tokens")
        .insert({
          organization_id: organizationId,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ical-token"] });
      toast.success("Neuer iCal-Link erstellt");
    },
  });

  // Get upcoming events (next 7 days)
  const upcomingEvents = events?.filter(event => {
    const eventDate = new Date(event.start_at);
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return eventDate >= now && eventDate <= weekFromNow;
  }) || [];

  // Get overdue deadlines
  const overdueDeadlines = events?.filter(event => {
    const eventDate = new Date(event.start_at);
    const now = new Date();
    return event.category === 'deadline' && eventDate < now;
  }) || [];

  return {
    events,
    eventsLoading,
    useEventsInRange,
    createEvent,
    updateEvent,
    deleteEvent,
    syncAutoEvents,
    icalToken,
    createIcalToken,
    upcomingEvents,
    overdueDeadlines,
    CATEGORY_COLORS,
    CATEGORY_LABELS,
  };
}
