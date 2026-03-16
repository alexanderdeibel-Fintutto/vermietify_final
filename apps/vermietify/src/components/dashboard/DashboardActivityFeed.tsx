import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Building2, Users, CreditCard, FileText, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  type: "building" | "tenant" | "payment" | "document" | "task";
  title: string;
  subtitle: string;
  timestamp: string;
}

const iconMap = {
  building: Building2,
  tenant: Users,
  payment: CreditCard,
  document: FileText,
  task: Wrench,
};

const colorMap = {
  building: "text-primary",
  tenant: "text-blue-500",
  payment: "text-green-500",
  document: "text-purple-500",
  task: "text-orange-500",
};

export function DashboardActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const [
        { data: buildings },
        { data: tenants },
        { data: tasks },
        { data: documents },
      ] = await Promise.all([
        supabase.from("buildings").select("id, name, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("tenants").select("id, first_name, last_name, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("tasks").select("id, title, created_at, status").order("created_at", { ascending: false }).limit(3),
        supabase.from("documents").select("id, title, created_at").order("created_at", { ascending: false }).limit(3),
      ]);

      const items: ActivityItem[] = [
        ...(buildings || []).map((b) => ({
          id: b.id,
          type: "building" as const,
          title: `Gebäude "${b.name}" angelegt`,
          subtitle: "Immobilien",
          timestamp: b.created_at,
        })),
        ...(tenants || []).map((t) => ({
          id: t.id,
          type: "tenant" as const,
          title: `Mieter ${t.first_name} ${t.last_name} hinzugefügt`,
          subtitle: "Mieterverwaltung",
          timestamp: t.created_at,
        })),
        ...(tasks || []).map((t) => ({
          id: t.id,
          type: "task" as const,
          title: t.title,
          subtitle: t.status === "completed" ? "Erledigt" : "Aufgabe erstellt",
          timestamp: t.created_at,
        })),
        ...(documents || []).map((d) => ({
          id: d.id,
          type: "document" as const,
          title: `Dokument "${d.title}" hochgeladen`,
          subtitle: "Dokumentenverwaltung",
          timestamp: d.created_at,
        })),
      ];

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 8));
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="backdrop-blur-md bg-white/10 border-white/15 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Letzte Aktivitäten
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Noch keine Aktivitäten vorhanden.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = iconMap[activity.type];
              return (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                >
                  <div className="flex-shrink-0">
                    <Icon className={`h-4 w-4 ${colorMap[activity.type]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(activity.timestamp), "dd.MM. HH:mm", { locale: de })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
