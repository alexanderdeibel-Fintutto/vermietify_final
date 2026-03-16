import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualAccountDialog({ open, onOpenChange }: Props) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bankName: "",
    accountName: "",
    iban: "",
    accountType: "checking",
    initialBalance: "",
  });

  const handleSave = async () => {
    if (!profile?.organization_id) return;
    if (!form.bankName || !form.accountName || !form.iban) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    setSaving(true);
    try {
      // Create a manual connection first
      const { data: connection, error: connErr } = await supabase
        .from("finapi_connections")
        .insert({
          organization_id: profile.organization_id,
          bank_id: `manual_${Date.now()}`,
          bank_name: form.bankName,
          status: "connected",
          last_sync_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (connErr) throw connErr;

      // Create the account
      const balanceCents = form.initialBalance
        ? Math.round(parseFloat(form.initialBalance.replace(",", ".")) * 100)
        : 0;

      const { error: accErr } = await supabase.from("bank_accounts").insert({
        connection_id: connection.id,
        iban: form.iban.replace(/\s/g, ""),
        account_name: form.accountName,
        account_type: form.accountType,
        balance_cents: balanceCents,
        balance_date: new Date().toISOString(),
      });

      if (accErr) throw accErr;

      queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Konto erfolgreich angelegt");
      onOpenChange(false);
      setForm({
        bankName: "",
        accountName: "",
        iban: "",
        accountType: "checking",
        initialBalance: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Anlegen des Kontos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Konto manuell anlegen
          </DialogTitle>
          <DialogDescription>
            Legen Sie ein Bankkonto an, um Transaktionen per CSV/PDF zu
            importieren.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>
              Bankname <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="z.B. Sparkasse München"
              value={form.bankName}
              onChange={(e) =>
                setForm((p) => ({ ...p, bankName: e.target.value }))
              }
            />
          </div>

          <div>
            <Label>
              Kontobezeichnung <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="z.B. Geschäftskonto"
              value={form.accountName}
              onChange={(e) =>
                setForm((p) => ({ ...p, accountName: e.target.value }))
              }
            />
          </div>

          <div>
            <Label>
              IBAN <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="DE89 3704 0044 0532 0130 00"
              value={form.iban}
              onChange={(e) =>
                setForm((p) => ({ ...p, iban: e.target.value }))
              }
              className="font-mono"
            />
          </div>

          <div>
            <Label>Kontotyp</Label>
            <Select
              value={form.accountType}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, accountType: v }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Girokonto</SelectItem>
                <SelectItem value="savings">Sparkonto</SelectItem>
                <SelectItem value="credit_card">Kreditkarte</SelectItem>
                <SelectItem value="loan">Darlehen</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Anfangssaldo (€)</Label>
            <Input
              placeholder="0,00"
              value={form.initialBalance}
              onChange={(e) =>
                setForm((p) => ({ ...p, initialBalance: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />
              {saving ? "Wird angelegt…" : "Konto anlegen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
