import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send, Building2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface InviteManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyName: string;
  propertyAddress?: string | null;
}

const VERMIETIFY_URL = 'https://vermietify.fintutto.cloud';

function buildSignupUrl(email: string) {
  return `${VERMIETIFY_URL}/login?email=${encodeURIComponent(email)}&signup=true`;
}

function buildEmailBody(managerName: string, propertyName: string, propertyAddress: string, signupUrl: string) {
  return `Sehr geehrte/r ${managerName || 'Verwalter/in'},

Sie wurden als Verwalter/in für die Immobilie „${propertyName}"${propertyAddress ? ` (${propertyAddress})` : ''} eingeladen, unsere professionelle Immobilienverwaltungslösung VermieTify zu nutzen.

🏠 Was ist VermieTify?

VermieTify ist die moderne, digitale Immobilienverwaltung für professionelle Verwalter und Eigentümer. Damit vereinfachen Sie Ihren kompletten Verwaltungsalltag:

✅ Automatische Nebenkostenabrechnung – fehlerfrei und gesetzeskonform
✅ Digitale Mieterkommunikation – alles an einem Ort
✅ Mieteinnahmen & Zahlungsverfolgung – immer den Überblick behalten
✅ Dokumentenmanagement – Verträge, Protokolle, Belege digital und sicher
✅ CO₂-Kostenaufteilung nach dem neuen CO2KostAufG – automatisch berechnet
✅ ELSTER-Integration – Steuererklärungen direkt aus der App
✅ Bankanbindung mit automatischem Miet-Matching – kein manuelles Zuordnen mehr
✅ Kalender & Erinnerungen – nie wieder eine Frist verpassen

🚀 Starten Sie jetzt – kostenlos und unverbindlich!

Klicken Sie auf den folgenden Link, um sich zu registrieren:
${signupUrl}

Ihre E-Mail-Adresse ist bereits vorausgefüllt – Sie können sofort loslegen.

Bei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr Fintutto-Team

---
Fintutto GmbH · fintutto.cloud
Powered by VermieTify – Immobilienverwaltung, die Freude macht.`;
}

export function InviteManagerDialog({ open, onOpenChange, propertyName, propertyAddress }: InviteManagerDialogProps) {
  const [email, setEmail] = useState('');
  const [managerName, setManagerName] = useState('');
  const [sending, setSending] = useState(false);

  const signupUrl = buildSignupUrl(email);
  const subject = `Einladung: Verwalten Sie „${propertyName}" mit VermieTify`;
  const body = buildEmailBody(managerName, propertyName, propertyAddress || '', signupUrl);

  const handleSendViaMail = async () => {
    if (!email.trim()) { toast.error('Bitte geben Sie eine E-Mail-Adresse ein.'); return; }
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Bitte melden Sie sich an.'); setSending(false); return; }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            recipientEmail: email.trim(),
            recipientName: managerName.trim() || undefined,
            appName: 'VermieTify',
            appUrl: VERMIETIFY_URL,
            signupPath: '/login',
            appSubtitle: 'Immobilienverwaltung',
            features: [
              'Automatische Nebenkostenabrechnung',
              'CO₂-Kostenaufteilung nach CO2KostAufG',
              'Bankanbindung mit Miet-Matching',
              'ELSTER-Integration',
              'Digitale Mieterkommunikation',
            ],
            inviteTarget: 'Verwalter/in',
            propertyName,
            propertyAddress: propertyAddress || undefined,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Fehler');

      toast.success(`Einladung an ${email} wurde versendet!`);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Invite error:', err);
      toast.error(err.message || 'Fehler beim Senden.');
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = () => {
    if (!email.trim()) {
      toast.error('Bitte geben Sie eine E-Mail-Adresse ein.');
      return;
    }
    navigator.clipboard.writeText(signupUrl);
    toast.success('Einladungslink wurde kopiert.');
  };

  const handleCopyEmail = () => {
    if (!email.trim()) {
      toast.error('Bitte geben Sie eine E-Mail-Adresse ein.');
      return;
    }
    const fullText = `Betreff: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    toast.success('E-Mail-Text wurde in die Zwischenablage kopiert.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Verwalter zu VermieTify einladen
          </DialogTitle>
          <DialogDescription>
            Laden Sie einen Verwalter für „{propertyName}" ein, VermieTify für die professionelle Immobilienverwaltung zu nutzen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Name des Verwalters</Label>
            <Input
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              placeholder="z.B. Herr Müller"
            />
          </div>
          <div>
            <Label>E-Mail-Adresse *</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="verwalter@example.de"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Die E-Mail wird auf der Anmeldeseite von VermieTify vorausgefüllt.
            </p>
          </div>

          {email.trim() && (
            <div className="glass rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Einladungslink:</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-secondary/50 px-2 py-1 rounded flex-1 break-all">
                  {signupUrl}
                </code>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopyLink}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {email.trim() && (
            <div className="glass rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Vorschau E-Mail:</p>
              <div className="text-xs text-muted-foreground max-h-40 overflow-auto whitespace-pre-wrap bg-secondary/30 rounded p-2">
                <strong>Betreff:</strong> {subject}{'\n\n'}
                {body.slice(0, 400)}...
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={handleCopyEmail}>
                <Copy className="mr-1.5 h-3 w-3" />E-Mail-Text kopieren
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSendViaMail} disabled={!email.trim() || sending}>
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Wird gesendet...' : 'Einladung senden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
