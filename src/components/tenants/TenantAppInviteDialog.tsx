import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Smartphone, Send, CheckCircle2, Loader2, Mail } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  tenantName: string;
  tenantEmail: string | null;
}

export function TenantAppInviteDialog({ open, onOpenChange, tenantId, tenantName, tenantEmail }: Props) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!tenantEmail) {
      toast.error("Keine E-Mail-Adresse hinterlegt. Bitte zuerst eine E-Mail beim Mieter ergänzen.");
      return;
    }

    setIsSending(true);
    try {
      const resp = await supabase.functions.invoke("send-tenant-app-invite", {
        body: { tenant_id: tenantId },
      });

      if (resp.error) throw new Error(resp.error.message);
      if (resp.data?.error) throw new Error(resp.data.error);

      setSent(true);
      toast.success(`Einladung an ${tenantEmail} gesendet`);
    } catch (err: any) {
      toast.error(`Fehler: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = (o: boolean) => {
    if (!o) setSent(false);
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mieter-App Einladung
          </DialogTitle>
          <DialogDescription>
            Laden Sie {tenantName} zur kostenlosen Fintutto Mieter-App ein.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <p className="font-medium">Einladung gesendet!</p>
            <p className="text-sm text-muted-foreground">
              Eine E-Mail mit Registrierungslink wurde an <strong>{tenantEmail}</strong> gesendet.
              Der Mieter muss nur noch ein Passwort vergeben.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Empfänger</span>
              </div>
              {tenantEmail ? (
                <p className="text-sm">{tenantEmail}</p>
              ) : (
                <p className="text-sm text-destructive">
                  Keine E-Mail-Adresse hinterlegt. Bitte zuerst eine E-Mail beim Mieter ergänzen.
                </p>
              )}
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">Was passiert?</p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Der Mieter erhält eine E-Mail mit Einladungslink
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Ein Klick öffnet die Registrierung – E-Mail ist vorausgefüllt
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Nur noch ein Passwort vergeben – fertig!
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Die App ist für Mieter dauerhaft kostenlos
                </li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          {sent ? (
            <Button onClick={() => handleClose(false)}>Schließen</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>Abbrechen</Button>
              <Button onClick={handleSend} disabled={isSending || !tenantEmail}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Einladung senden
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
