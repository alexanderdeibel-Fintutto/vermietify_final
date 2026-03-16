import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, Send, CheckCircle2 } from "lucide-react";
import { TenantAppInviteDialog } from "./TenantAppInviteDialog";

interface MieterAppPromoWidgetProps {
  tenantId: string;
  tenantName: string;
  tenantEmail: string | null;
}

export function MieterAppPromoWidget({ tenantId, tenantName, tenantEmail }: MieterAppPromoWidgetProps) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
          <Smartphone className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-tight">Fintutto Mieter-App</p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            Kostenlos – Verträge, Zähler & Mängelmeldung
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs shrink-0"
          onClick={() => setInviteOpen(true)}
        >
          <Send className="h-3 w-3 mr-1" />
          Einladen
        </Button>
      </div>

      <TenantAppInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        tenantId={tenantId}
        tenantName={tenantName}
        tenantEmail={tenantEmail}
      />
    </>
  );
}
