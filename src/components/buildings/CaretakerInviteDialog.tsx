import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Plus, Trash2, Send } from "lucide-react";

interface InviteEntry {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}

const empty = (): InviteEntry => ({ email: "", first_name: "", last_name: "", phone: "" });

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSend: (entries: InviteEntry[]) => void;
  isSending: boolean;
  buildingName: string;
}

export function CaretakerInviteDialog({ open, onOpenChange, onSend, isSending, buildingName }: Props) {
  const [entries, setEntries] = useState<InviteEntry[]>([empty()]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const update = (idx: number, field: keyof InviteEntry, value: string) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };

  const handleSend = () => {
    let toSend: InviteEntry[];
    if (bulkMode) {
      toSend = bulkText
        .split(/[,\n;]+/)
        .map((s) => s.trim())
        .filter((s) => s.includes("@"))
        .map((email) => ({ email, first_name: "", last_name: "", phone: "" }));
    } else {
      toSend = entries.filter((e) => e.email.includes("@"));
    }
    if (toSend.length === 0) return;
    onSend(toSend);
    setEntries([empty()]);
    setBulkText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Hausmeister einladen
          </DialogTitle>
          <DialogDescription>
            Laden Sie Hausmeister für <strong>{buildingName}</strong> ein. Sie erhalten eine E-Mail mit Informationen zur Hausmeister Pro App.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button size="sm" variant={bulkMode ? "outline" : "default"} onClick={() => setBulkMode(false)}>
            Einzeln
          </Button>
          <Button size="sm" variant={bulkMode ? "default" : "outline"} onClick={() => setBulkMode(true)}>
            Mehrere E-Mails
          </Button>
        </div>

        {bulkMode ? (
          <div className="space-y-2">
            <Label>E-Mail-Adressen (kommagetrennt oder eine pro Zeile)</Label>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"max@beispiel.de\nanna@beispiel.de"}
              rows={5}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, idx) => (
              <div key={idx} className="space-y-2 p-3 border rounded-lg relative">
                {entries.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-1 right-1 h-7 w-7"
                    onClick={() => setEntries((p) => p.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <div>
                  <Label>E-Mail *</Label>
                  <Input value={entry.email} onChange={(e) => update(idx, "email", e.target.value)} placeholder="max@beispiel.de" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Vorname</Label>
                    <Input value={entry.first_name} onChange={(e) => update(idx, "first_name", e.target.value)} />
                  </div>
                  <div>
                    <Label>Nachname</Label>
                    <Input value={entry.last_name} onChange={(e) => update(idx, "last_name", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input value={entry.phone} onChange={(e) => update(idx, "phone", e.target.value)} />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setEntries((p) => [...p, empty()])}>
              <Plus className="h-4 w-4 mr-1" /> Weiteren Hausmeister hinzufügen
            </Button>
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground mt-2">
          <p className="font-medium text-foreground mb-1">Vorschau der Einladungsmail:</p>
          <p>Ihr Verwalter hat Sie eingeladen, die App <strong>Hausmeister Pro</strong> kostenlos auszuprobieren. Die App bleibt für Sie kostenlos, solange Sie nur dieses Gebäude verwalten – und vereinfacht die Kommunikation zwischen Verwalter, Hausmeister und Mieter.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSend} disabled={isSending}>
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Wird gesendet…" : "Einladungen senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
