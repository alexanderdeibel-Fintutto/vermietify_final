import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncStatus {
  is_synced: boolean;
  building: any | null;
  company: any | null;
  units_synced: number;
  tasks_synced: number;
  last_synced_at: string | null;
}

async function callSyncFunction(action: string, params: Record<string, any>) {
  const { data: { session } } = await supabase.auth.getSession();
  const resp = await supabase.functions.invoke("sync-hausmeister-data", {
    body: { action, ...params },
  });
  if (resp.error) throw new Error(resp.error.message);
  if (resp.data?.error) throw new Error(resp.data.error);
  return resp.data;
}

export function useHausmeisterSync(buildingId: string) {
  const qc = useQueryClient();

  const statusQuery = useQuery<SyncStatus>({
    queryKey: ["hausmeister-sync-status", buildingId],
    queryFn: () => callSyncFunction("get_status", { building_id: buildingId }),
    enabled: !!buildingId,
  });

  const syncBuilding = useMutation({
    mutationFn: () => callSyncFunction("sync_building", { building_id: buildingId }),
    onSuccess: (data) => {
      toast.success(`Gebäude synchronisiert (${data.units_synced} Einheiten)`);
      qc.invalidateQueries({ queryKey: ["hausmeister-sync-status", buildingId] });
    },
    onError: (err: Error) => toast.error(`Sync fehlgeschlagen: ${err.message}`),
  });

  const syncTasks = useMutation({
    mutationFn: () => callSyncFunction("sync_tasks", { building_id: buildingId }),
    onSuccess: (data) => {
      toast.success(`Aufgaben synchronisiert (${data.tasks_pushed} gesendet, ${data.tasks_pulled} empfangen)`);
      qc.invalidateQueries({ queryKey: ["hausmeister-sync-status", buildingId] });
    },
    onError: (err: Error) => toast.error(`Aufgaben-Sync fehlgeschlagen: ${err.message}`),
  });

  const checkUser = useMutation({
    mutationFn: (email: string) => callSyncFunction("check_user", { email }),
  });

  return { statusQuery, syncBuilding, syncTasks, checkUser };
}
