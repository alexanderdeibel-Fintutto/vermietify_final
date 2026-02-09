import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CalendarCategory,
  CalendarEvent,
  CreateEventInput,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  RelatedEntityType,
} from "@/hooks/useCalendar";
import { useBuildings } from "@/hooks/useBuildings";
import { useUnits } from "@/hooks/useUnits";
import { useTenants } from "@/hooks/useTenants";
import { useContracts } from "@/hooks/useContracts";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  onSave: (data: CreateEventInput) => void;
  onDelete?: (id: string) => void;
}

const REMINDER_OPTIONS = [
  { value: 0, label: "Keine Erinnerung" },
  { value: 60, label: "1 Stunde vorher" },
  { value: 1440, label: "1 Tag vorher" },
  { value: 4320, label: "3 Tage vorher" },
  { value: 10080, label: "1 Woche vorher" },
];

export function EventDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
  onSave,
  onDelete,
}: EventDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<CalendarCategory>("other");
  const [selectedRelatedType, setSelectedRelatedType] = useState<RelatedEntityType | "">("");
  const [startDate, setStartDate] = useState<Date>(defaultDate || new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [allDay, setAllDay] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<number>(0);

  const { useBuildingsList } = useBuildings();
  const { useUnitsList } = useUnits();
  const { useTenantsList } = useTenants();
  const { useContractsList } = useContracts();

  const { data: buildingsData } = useBuildingsList(1, 100);
  const { data: unitsData } = useUnitsList();
  const { data: tenantsData } = useTenantsList();
  const { data: contractsData } = useContractsList();

  const { register, handleSubmit, reset, setValue, watch } = useForm<{
    title: string;
    description: string;
    location: string;
    related_id: string;
    start_time: string;
    end_time: string;
  }>();

  useEffect(() => {
    if (event) {
      setValue("title", event.title);
      setValue("description", event.description || "");
      setValue("location", event.location || "");
      setValue("related_id", event.related_id || "");
      setSelectedCategory(event.category);
      setSelectedRelatedType(event.related_type || "");
      setStartDate(new Date(event.start_at));
      setEndDate(event.end_at ? new Date(event.end_at) : undefined);
      setAllDay(event.all_day);
      setValue("start_time", format(new Date(event.start_at), "HH:mm"));
      if (event.end_at) {
        setValue("end_time", format(new Date(event.end_at), "HH:mm"));
      }
      setReminderMinutes(event.reminder_minutes?.[0] || 0);
    } else {
      reset();
      setSelectedCategory("other");
      setSelectedRelatedType("");
      setStartDate(defaultDate || new Date());
      setEndDate(undefined);
      setAllDay(false);
      setValue("start_time", "09:00");
      setValue("end_time", "10:00");
      setReminderMinutes(1440);
    }
  }, [event, defaultDate, setValue, reset]);

  const onSubmit = handleSubmit((data) => {
    const start = new Date(startDate);
    if (!allDay && data.start_time) {
      const [hours, minutes] = data.start_time.split(":").map(Number);
      start.setHours(hours, minutes, 0, 0);
    } else {
      start.setHours(0, 0, 0, 0);
    }

    let end: Date | undefined;
    if (endDate) {
      end = new Date(endDate);
      if (!allDay && data.end_time) {
        const [hours, minutes] = data.end_time.split(":").map(Number);
        end.setHours(hours, minutes, 0, 0);
      }
    }

    onSave({
      title: data.title,
      description: data.description || undefined,
      category: selectedCategory,
      start_at: start.toISOString(),
      end_at: end?.toISOString(),
      all_day: allDay,
      location: data.location || undefined,
      related_type: selectedRelatedType || undefined,
      related_id: data.related_id || undefined,
      reminder_minutes: reminderMinutes > 0 ? [reminderMinutes] : [],
    });
    onOpenChange(false);
  });

  const getRelatedOptions = () => {
    switch (selectedRelatedType) {
      case "building":
        return buildingsData?.buildings?.map(b => ({ id: b.id, label: b.name })) || [];
      case "unit":
        return unitsData?.map((u: any) => ({ id: u.id, label: `${u.buildings?.name || ""} - ${u.unit_number}` })) || [];
      case "tenant":
        return tenantsData?.map((t: any) => ({ id: t.id, label: `${t.first_name} ${t.last_name}` })) || [];
      case "contract":
        return contractsData?.map((c: any) => ({ id: c.id, label: `Vertrag ${c.id.slice(0, 8)}` })) || [];
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? "Termin bearbeiten" : "Neuer Termin"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder="Terminbezeichnung"
            />
          </div>

          <div className="space-y-2">
            <Label>Kategorie</Label>
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as CalendarCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[key as CalendarCategory] }}
                      />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Startdatum *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd.MM.yyyy", { locale: de }) : "Datum wählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => d && setStartDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Enddatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd.MM.yyyy", { locale: de }) : "Optional"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="all_day"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked as boolean)}
            />
            <Label htmlFor="all_day">Ganztägig</Label>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Startzeit</Label>
                <Input
                  id="start_time"
                  type="time"
                  {...register("start_time")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Endzeit</Label>
                <Input
                  id="end_time"
                  type="time"
                  {...register("end_time")}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Bezug</Label>
            <Select value={selectedRelatedType || "none"} onValueChange={(v) => setSelectedRelatedType(v === "none" ? "" : v as RelatedEntityType)}>
              <SelectTrigger>
                <SelectValue placeholder="Kein Bezug" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keiner</SelectItem>
                <SelectItem value="building">Gebäude</SelectItem>
                <SelectItem value="unit">Einheit</SelectItem>
                <SelectItem value="tenant">Mieter</SelectItem>
                <SelectItem value="contract">Vertrag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedRelatedType && (
            <div className="space-y-2">
              <Label>Objekt auswählen</Label>
              <Select {...register("related_id")}>
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {getRelatedOptions().map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location">Ort</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="Adresse oder Treffpunkt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Weitere Details..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Erinnerung</Label>
            <Select
              value={reminderMinutes.toString()}
              onValueChange={(v) => setReminderMinutes(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex justify-between">
            {event && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete(event.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button type="submit">
                {event ? "Speichern" : "Erstellen"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
