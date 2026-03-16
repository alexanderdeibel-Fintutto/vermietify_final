import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaxDeadlines, TaxDeadline } from "@/hooks/useTaxDeadlines";
import { LoadingState, EmptyState } from "@/components/shared";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, addMonths, subMonths } from "date-fns";
import { de } from "date-fns/locale";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: typeof Circle; label: string }> = {
  upcoming: {
    color: "text-blue-600",
    bgColor: "bg-blue-100 text-blue-800",
    icon: Circle,
    label: "Anstehend",
  },
  due_soon: {
    color: "text-orange-600",
    bgColor: "bg-orange-100 text-orange-800",
    icon: AlertTriangle,
    label: "Bald fallig",
  },
  overdue: {
    color: "text-red-600",
    bgColor: "bg-red-100 text-red-800",
    icon: AlertCircle,
    label: "Uberschritten",
  },
  completed: {
    color: "text-green-600",
    bgColor: "bg-green-100 text-green-800",
    icon: CheckCircle2,
    label: "Erledigt",
  },
};

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function TaxDeadlines() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const { data: deadlines = [], isLoading, updateDeadline } = useTaxDeadlines(selectedYear);

  const handleMarkCompleted = (deadline: TaxDeadline) => {
    updateDeadline.mutate({
      id: deadline.id,
      status: deadline.status === "completed" ? "upcoming" : "completed",
    });
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Adjust for Monday start (German calendar)
  const startDay = getDay(monthStart);
  const paddingDays = startDay === 0 ? 6 : startDay - 1;

  const getDeadlinesForDay = (day: Date) => {
    return (deadlines as TaxDeadline[]).filter((d) =>
      isSameDay(new Date(d.deadline_date), day)
    );
  };

  const statusCounts = {
    upcoming: (deadlines as TaxDeadline[]).filter((d) => d.status === "upcoming").length,
    due_soon: (deadlines as TaxDeadline[]).filter((d) => d.status === "due_soon").length,
    overdue: (deadlines as TaxDeadline[]).filter((d) => d.status === "overdue").length,
    completed: (deadlines as TaxDeadline[]).filter((d) => d.status === "completed").length,
  };

  return (
    <MainLayout title="Steuerfristen">
      <div className="space-y-6">
        <PageHeader
          title="Steuerfristen"
          subtitle={`Fristen und Termine fur ${selectedYear}`}
          breadcrumbs={[
            { label: "Steuern", href: "/steuern" },
            { label: "Fristen" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "calendar" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            </div>
          }
        />

        {/* Status Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const StatusIcon = config.icon;
            return (
              <Card key={status}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-5 w-5 ${config.color}`} />
                    <div>
                      <p className="text-2xl font-bold">{statusCounts[status as keyof typeof statusCounts]}</p>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {isLoading ? (
          <LoadingState />
        ) : viewMode === "calendar" ? (
          /* Calendar View */
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle>
                  {format(currentMonth, "MMMM yyyy", { locale: de })}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {/* Weekday headers */}
                {WEEKDAY_LABELS.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}

                {/* Padding days */}
                {Array.from({ length: paddingDays }).map((_, i) => (
                  <div key={`pad-${i}`} className="min-h-[80px]" />
                ))}

                {/* Calendar days */}
                {daysInMonth.map((day) => {
                  const dayDeadlines = getDeadlinesForDay(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[80px] p-1 border rounded-lg ${
                        isToday ? "border-primary bg-primary/5" : "border-muted"
                      }`}
                    >
                      <p className={`text-xs text-right ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                        {format(day, "d")}
                      </p>
                      <div className="space-y-1 mt-1">
                        {dayDeadlines.map((dl) => (
                          <div
                            key={dl.id}
                            className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer ${
                              STATUS_CONFIG[dl.status]?.bgColor || "bg-gray-100"
                            }`}
                            title={dl.title}
                            onClick={() => handleMarkCompleted(dl)}
                          >
                            {dl.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* List View */
          <div className="space-y-3">
            {(deadlines as TaxDeadline[]).length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Keine Fristen"
                description={`Keine Steuerfristen fur ${selectedYear} gefunden`}
              />
            ) : (
              (deadlines as TaxDeadline[]).map((deadline) => {
                const config = STATUS_CONFIG[deadline.status];
                const StatusIcon = config?.icon || Circle;

                return (
                  <Card key={deadline.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <StatusIcon className={`h-5 w-5 ${config?.color || "text-gray-400"}`} />
                          <div>
                            <p className="font-medium">{deadline.title}</p>
                            {deadline.description && (
                              <p className="text-sm text-muted-foreground">{deadline.description}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              Frist: {format(new Date(deadline.deadline_date), "dd. MMMM yyyy", { locale: de })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={config?.bgColor}>
                            {config?.label || deadline.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkCompleted(deadline)}
                          >
                            {deadline.status === "completed" ? "Wiederherstellen" : "Als erledigt markieren"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
