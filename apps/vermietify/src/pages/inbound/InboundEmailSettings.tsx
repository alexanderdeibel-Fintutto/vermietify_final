import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useInboundEmail } from "@/hooks/useInboundEmail";
import { Mail, Copy, Plus, X, Check, Inbox, AlertCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InboundEmailSettings() {
  const { toast } = useToast();
  const {
    emailAddress,
    isLoadingAddress,
    generateAddress,
    updateAllowedSenders,
    toggleActive,
  } = useInboundEmail();

  const [newSender, setNewSender] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (emailAddress?.full_address) {
      navigator.clipboard.writeText(emailAddress.full_address);
      setCopied(true);
      toast({ title: "Kopiert!", description: "E-Mail-Adresse in die Zwischenablage kopiert." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddSender = () => {
    if (!newSender.trim() || !newSender.includes("@")) {
      toast({ title: "Ungültig", description: "Bitte geben Sie eine gültige E-Mail-Adresse ein.", variant: "destructive" });
      return;
    }
    const updated = [...(emailAddress?.allowed_senders || []), newSender.trim().toLowerCase()];
    updateAllowedSenders.mutate(updated);
    setNewSender("");
  };

  const handleRemoveSender = (sender: string) => {
    const updated = (emailAddress?.allowed_senders || []).filter((s) => s !== sender);
    updateAllowedSenders.mutate(updated);
  };

  if (isLoadingAddress) {
    return (
      <MainLayout title="E-Mail-Empfang">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="E-Mail-Empfang">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-Mail-Empfang</h1>
          <p className="text-muted-foreground">
            Empfangen Sie Rechnungen und Belege per E-Mail für die automatische Betriebskostenbuchung
          </p>
        </div>

        {/* Generated Address Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Ihre Empfangsadresse
            </CardTitle>
            <CardDescription>
              Leiten Sie Rechnungen und Belege an diese Adresse weiter. PDFs werden automatisch verarbeitet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailAddress ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-mono text-sm font-medium">{emailAddress.full_address}</span>
                  </div>
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Empfang aktiv</Label>
                    <p className="text-xs text-muted-foreground">
                      Eingehende E-Mails werden verarbeitet
                    </p>
                  </div>
                  <Switch
                    checked={emailAddress.is_active}
                    onCheckedChange={(checked) => toggleActive.mutate(checked)}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Noch keine Empfangsadresse</h3>
                <p className="text-muted-foreground mb-4">
                  Generieren Sie eine persönliche E-Mail-Adresse für den automatischen Rechnungseingang
                </p>
                <Button onClick={() => generateAddress.mutate()} disabled={generateAddress.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adresse generieren
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {emailAddress && (
          <>
            {/* Allowed Senders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Verifizierte Absender
                </CardTitle>
                <CardDescription>
                  Nur E-Mails von diesen Adressen werden akzeptiert. Lassen Sie die Liste leer, um alle Absender zu erlauben.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="absender@beispiel.de"
                    value={newSender}
                    onChange={(e) => setNewSender(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSender()}
                  />
                  <Button onClick={handleAddSender} disabled={updateAllowedSenders.isPending}>
                    <Plus className="mr-2 h-4 w-4" />
                    Hinzufügen
                  </Button>
                </div>

                {emailAddress.allowed_senders.length === 0 ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Alle Absender sind derzeit erlaubt. Fügen Sie verifizierte Adressen hinzu, um nur von bestimmten Absendern E-Mails zu akzeptieren.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {emailAddress.allowed_senders.map((sender) => (
                      <Badge key={sender} variant="secondary" className="flex items-center gap-1 pl-3 pr-1 py-1.5">
                        {sender}
                        <button
                          onClick={() => handleRemoveSender(sender)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How it works */}
            <Card>
              <CardHeader>
                <CardTitle>So funktioniert's</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">E-Mail weiterleiten</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Leiten Sie Rechnungen mit PDF-Anhang an Ihre Empfangsadresse weiter
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">KI-Analyse</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Beträge, Kostenarten und Gebäude werden automatisch erkannt
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Buchung oder Review</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Eindeutige Belege werden automatisch gebucht, unklare landen in der Prüfungsliste
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
