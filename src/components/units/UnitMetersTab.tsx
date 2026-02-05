import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared";
import { 
  Gauge, 
  Plus,
  Calendar,
  TrendingUp,
  Droplets,
  Flame,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface UnitMetersTabProps {
  unitId: string;
}

// TODO: Replace with actual meters hook when implemented
const METER_TYPE_CONFIG: Record<string, { label: string; icon: typeof Gauge; color: string }> = {
  electricity: { label: "Strom", icon: Zap, color: "text-yellow-500" },
  gas: { label: "Gas", icon: Flame, color: "text-orange-500" },
  water: { label: "Wasser", icon: Droplets, color: "text-blue-500" },
  heating: { label: "Heizung", icon: Flame, color: "text-red-500" },
};

export function UnitMetersTab({ unitId }: UnitMetersTabProps) {
  // TODO: Use useMeters hook when available
  // const { data: meters, isLoading } = useMeters(unitId);
  const meters: any[] = []; // Placeholder
  const isLoading = false;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!meters || meters.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={Gauge}
            title="Keine Zähler vorhanden"
            description="Für diese Einheit wurden noch keine Zähler angelegt."
            action={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Zähler hinzufügen
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Zähler ({meters.length})</h3>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Zähler hinzufügen
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {meters.map((meter) => {
          const config = METER_TYPE_CONFIG[meter.type] || {
            label: meter.type,
            icon: Gauge,
            color: "text-muted-foreground",
          };
          const Icon = config.icon;

          return (
            <Card key={meter.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    {config.label}
                  </CardTitle>
                  <Badge variant="outline">{meter.meter_number}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Letzter Stand</p>
                    <p className="text-2xl font-bold">
                      {meter.last_reading?.value || "–"}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {meter.unit}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Letzte Ablesung</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {meter.last_reading?.date
                        ? format(new Date(meter.last_reading.date), "dd.MM.yyyy", { locale: de })
                        : "–"}
                    </p>
                  </div>
                </div>

                {meter.consumption_trend && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Verbrauch: {meter.consumption_trend} {meter.unit}/Monat
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Ablesen
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/meters/${meter.id}`}>Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
