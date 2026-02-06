import { useState } from "react";
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
  Thermometer,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useMeters, MeterWithStatus, MeterType, MeterStatus } from "@/hooks/useMeters";
import { QuickReadingDialog } from "@/components/meters/QuickReadingDialog";
import { MeterFormDialog } from "@/components/meters/MeterFormDialog";

interface UnitMetersTabProps {
  unitId: string;
}

const METER_TYPE_CONFIG: Record<MeterType, { label: string; icon: typeof Gauge; color: string; unit: string }> = {
  electricity: { label: "Strom", icon: Zap, color: "text-yellow-500", unit: "kWh" },
  gas: { label: "Gas", icon: Flame, color: "text-orange-500", unit: "m³" },
  water: { label: "Wasser", icon: Droplets, color: "text-blue-500", unit: "m³" },
  heating: { label: "Heizung", icon: Thermometer, color: "text-red-500", unit: "kWh" },
};

const STATUS_CONFIG: Record<MeterStatus, { label: string; icon: typeof CheckCircle; variant: "default" | "secondary" | "destructive" }> = {
  current: { label: "Aktuell", icon: CheckCircle, variant: "default" },
  reading_due: { label: "Ablesung fällig", icon: Clock, variant: "secondary" },
  overdue: { label: "Überfällig", icon: AlertCircle, variant: "destructive" },
};

export function UnitMetersTab({ unitId }: UnitMetersTabProps) {
  const { meters, isLoading, addReading, createMeter, isAddingReading, isCreating } = useMeters();
  const [selectedMeter, setSelectedMeter] = useState<MeterWithStatus | null>(null);
  const [readingDialogOpen, setReadingDialogOpen] = useState(false);
  const [addMeterDialogOpen, setAddMeterDialogOpen] = useState(false);

  // Filter meters for this unit
  const unitMeters = meters.filter((m) => m.unit_id === unitId);

  const handleReadingClick = (meter: MeterWithStatus) => {
    setSelectedMeter(meter);
    setReadingDialogOpen(true);
  };

  const handleSaveReading = (data: { meter_id: string; reading_value: number; reading_date: string; notes?: string }) => {
    addReading(data, {
      onSuccess: () => {
        setReadingDialogOpen(false);
        setSelectedMeter(null);
      },
    });
  };

  const handleCreateMeter = (data: any) => {
    createMeter({ ...data, unit_id: unitId }, {
      onSuccess: () => {
        setAddMeterDialogOpen(false);
      },
    });
  };

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

  if (unitMeters.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Gauge}
              title="Keine Zähler vorhanden"
              description="Für diese Einheit wurden noch keine Zähler angelegt."
              action={
                <Button onClick={() => setAddMeterDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Zähler hinzufügen
                </Button>
              }
            />
          </CardContent>
        </Card>

        <MeterFormDialog
          open={addMeterDialogOpen}
          onOpenChange={setAddMeterDialogOpen}
          onSave={handleCreateMeter}
          isSaving={isCreating}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Zähler ({unitMeters.length})</h3>
        <Button onClick={() => setAddMeterDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Zähler hinzufügen
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {unitMeters.map((meter) => {
          const typeConfig = METER_TYPE_CONFIG[meter.meter_type];
          const statusConfig = STATUS_CONFIG[meter.status];
          const Icon = typeConfig.icon;
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={meter.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className={`h-5 w-5 ${typeConfig.color}`} />
                    {typeConfig.label}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusConfig.variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{meter.meter_number}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Letzter Stand</p>
                    <p className="text-2xl font-bold">
                      {meter.last_reading_value !== null 
                        ? meter.last_reading_value.toLocaleString("de-DE") 
                        : "–"}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {typeConfig.unit}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Letzte Ablesung</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {meter.last_reading_date
                        ? format(new Date(meter.last_reading_date), "dd.MM.yyyy", { locale: de })
                        : "–"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleReadingClick(meter)}
                  >
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

      <QuickReadingDialog
        open={readingDialogOpen}
        onOpenChange={setReadingDialogOpen}
        meter={selectedMeter}
        onSave={handleSaveReading}
        isSaving={isAddingReading}
      />

      <MeterFormDialog
        open={addMeterDialogOpen}
        onOpenChange={setAddMeterDialogOpen}
        onSave={handleCreateMeter}
        isSaving={isCreating}
      />
    </div>
  );
}
