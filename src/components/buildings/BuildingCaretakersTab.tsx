import { useState } from "react";
import { useCaretakers } from "@/hooks/useCaretakers";
import { CaretakerInviteDialog } from "./CaretakerInviteDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { UserPlus, Mail, Phone, Trash2, Wrench } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  invited: { label: "Eingeladen", variant: "secondary" },
  active: { label: "Aktiv", variant: "default" },
  inactive: { label: "Inaktiv", variant: "outline" },
};

interface Props {
  buildingId: string;
  buildingName: string;
}

export function BuildingCaretakersTab({ buildingId, buildingName }: Props) {
  const { caretakersQuery, sendInvites, removeCaretaker } = useCaretakers(buildingId);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const caretakers = caretakersQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Hausmeister ({caretakers.length})</h3>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Hausmeister einladen
        </Button>
      </div>

      {caretakers.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Keine Hausmeister zugewiesen"
          description="Laden Sie Hausmeister ein, um die Gebäudeverwaltung zu vereinfachen."
          action={{ label: "Hausmeister einladen", onClick: () => setInviteOpen(true) }}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {caretakers.map((c) => {
            const st = statusConfig[c.status] ?? statusConfig.invited;
            const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
            return (
              <Card key={c.id}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{name || c.email}</CardTitle>
                    {name && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="h-3.5 w-3.5" /> {c.email}
                      </p>
                    )}
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {c.phone}
                      </span>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CaretakerInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        isSending={sendInvites.isPending}
        buildingName={buildingName}
        onSend={(entries) => {
          sendInvites.mutate(
            { building_id: buildingId, emails: entries },
            { onSuccess: () => setInviteOpen(false) }
          );
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Hausmeister entfernen"
        description="Möchten Sie diesen Hausmeister wirklich von diesem Gebäude entfernen?"
        confirmLabel="Entfernen"
        destructive
        onConfirm={() => {
          if (deleteId) removeCaretaker.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
      />
    </div>
  );
}
