import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHausmeisterSync } from "@/hooks/useHausmeisterSync";
import { Building2, ListTodo, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  buildingName: string;
}

export function HausmeisterSyncDialog({ open, onOpenChange, buildingId, buildingName }: Props) {
  const { statusQuery, syncBuilding, syncTasks } = useHausmeisterSync(buildingId);
  const status = statusQuery.data;
  const isSynced = status?.is_synced ?? false;
  const isBusy = syncBuilding.isPending || syncTasks.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>HausmeisterPro Synchronisation</DialogTitle>
          <DialogDescription>
            Synchronisieren Sie „{buildingName}" mit der HausmeisterPro-App.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status overview */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              {isSynced ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Verbunden
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" /> Nicht synchronisiert
                </Badge>
              )}
            </div>
            {status?.last_synced_at && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Letzter Sync: {format(new Date(status.last_synced_at), "dd.MM.yyyy HH:mm", { locale: de })}
              </p>
            )}
            {isSynced && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{status?.units_synced ?? 0} Einheiten</span>
                <span>{status?.tasks_synced ?? 0} Aufgaben</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full justify-start gap-2"
              variant="outline"
              disabled={isBusy}
              onClick={() => syncBuilding.mutate()}
            >
              {syncBuilding.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              Gebäude & Einheiten synchronisieren
            </Button>

            <Button
              className="w-full justify-start gap-2"
              variant="outline"
              disabled={isBusy || !isSynced}
              onClick={() => syncTasks.mutate()}
            >
              {syncTasks.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ListTodo className="h-4 w-4" />
              )}
              Aufgaben synchronisieren
            </Button>
          </div>

          {!isSynced && (
            <p className="text-xs text-muted-foreground">
              Synchronisieren Sie zuerst das Gebäude, um Aufgaben abgleichen zu können.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
