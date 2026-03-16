import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useTrackReferral } from "@/hooks/useEcosystemReferrals";
import type { EcosystemApp } from "@/hooks/useEcosystemApps";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: EcosystemApp;
}

export function EcosystemInviteDialog({ open, onOpenChange, app }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const trackReferral = useTrackReferral();

  const registerUrl = `${app.register_url}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&ref=vermietify`;

  const handleSend = async () => {
    if (!email) {
      toast.error("Bitte E-Mail-Adresse eingeben");
      return;
    }

    try {
      await trackReferral.mutateAsync({
        app_slug: app.slug,
        app_name: app.name,
        invited_email: email,
        invited_name: name || undefined,
        channel: "email",
      });

      // Open register URL for the invitee (copy link approach)
      await navigator.clipboard.writeText(registerUrl);
      setSent(true);
      toast.success(`Einladungslink für ${app.name} kopiert!`);
    } catch (err: any) {
      toast.error(`Fehler: ${err.message}`);
    }
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      setSent(false);
      setEmail("");
      setName("");
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{app.icon_emoji}</span>
            {app.name} – Einladen
          </DialogTitle>
          <DialogDescription>
            Laden Sie jemanden zu {app.name} ein. Der Registrierungslink wird automatisch generiert.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <p className="font-medium">Link kopiert!</p>
            <p className="text-sm text-muted-foreground">
              Der Registrierungslink für <strong>{email}</strong> wurde in die Zwischenablage kopiert.
            </p>
            <div className="rounded-lg bg-muted p-3 text-xs break-all text-left">
              {registerUrl}
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={registerUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Link öffnen
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">E-Mail *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="name@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name (optional)</Label>
              <Input
                id="invite-name"
                placeholder="Max Mustermann"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Was passiert?</p>
              <ul className="space-y-1">
                <li>• Ein Registrierungslink mit vorausgefüllter E-Mail wird generiert</li>
                <li>• Der Eingeladene muss nur noch ein Passwort vergeben</li>
                <li>• Die Einladung wird für Ihr Referral-Tracking gespeichert</li>
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
              <Button
                onClick={handleSend}
                disabled={!email || trackReferral.isPending}
                style={{ background: `linear-gradient(135deg, ${app.color_from}, ${app.color_to})` }}
              >
                {trackReferral.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Einladungslink generieren
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
