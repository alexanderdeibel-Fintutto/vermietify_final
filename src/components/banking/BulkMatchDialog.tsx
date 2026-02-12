import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Building2, Users, Tag, Wand2 } from "lucide-react";
import { BankTransaction, useBanking } from "@/hooks/useBanking";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TransactionType = "rent" | "deposit" | "utility" | "maintenance" | "insurance" | "tax" | "repair" | "other";

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: "rent", label: "Mietzahlung" },
  { value: "deposit", label: "Kaution" },
  { value: "utility", label: "Nebenkosten" },
  { value: "maintenance", label: "Instandhaltung" },
  { value: "insurance", label: "Versicherung" },
  { value: "tax", label: "Steuer/Abgaben" },
  { value: "repair", label: "Reparatur" },
  { value: "other", label: "Sonstiges" },
];

interface Props {
  transactions: BankTransaction[];
  onClose: () => void;
  onDone: () => void;
}

export function BulkMatchDialog({ transactions, onClose, onDone }: Props) {
  const [tenantId, setTenantId] = useState<string>("");
  const [transactionType, setTransactionType] = useState<string>("");
  const [buildingId, setBuildingId] = useState<string>("");
  const [createRule, setCreateRule] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants-simple"],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("id, first_name, last_name");
      return data || [];
    },
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings-simple"],
    queryFn: async () => {
      const { data } = await supabase.from("buildings").select("id, name, address");
      return data || [];
    },
  });

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

  const totalAmount = transactions.reduce((s, t) => s + t.amount_cents, 0);
  const incomeCount = transactions.filter((t) => t.amount_cents > 0).length;
  const expenseCount = transactions.filter((t) => t.amount_cents < 0).length;

  const handleSubmit = async () => {
    if (!tenantId && !transactionType && !buildingId) {
      toast.error("Bitte mindestens ein Zuordnungsfeld ausfüllen.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-match-transactions", {
        body: {
          bulk: true,
          transactionIds: transactions.map((t) => t.id),
          tenantId: tenantId && tenantId !== "none" ? tenantId : undefined,
          transactionType: transactionType && transactionType !== "none" ? transactionType : undefined,
          buildingId: buildingId && buildingId !== "none" ? buildingId : undefined,
          createRule,
          // For rule creation, derive conditions from common counterpart_name
          ruleConditions: createRule ? deriveRuleConditions() : undefined,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success(`${transactions.length} Transaktionen zugeordnet${data.rule ? " + Regel erstellt" : ""}`);
      onDone();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      toast.error("Fehler: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deriveRuleConditions = () => {
    // Find a common counterpart_name among selected transactions
    const names = transactions.map((t) => t.counterpart_name?.trim()).filter(Boolean);
    if (names.length === 0) return undefined;

    // Find most common name
    const freq: Record<string, number> = {};
    names.forEach((n) => {
      freq[n!] = (freq[n!] || 0) + 1;
    });
    const commonName = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!commonName) return undefined;

    return [{ field: "counterpart_name", operator: "contains", value: commonName }];
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk-Zuordnung</DialogTitle>
          <DialogDescription>
            {transactions.length} Transaktionen gleichzeitig zuordnen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{transactions.length} Transaktionen</Badge>
            {incomeCount > 0 && (
              <Badge className="bg-primary/10 text-primary">{incomeCount} Eingänge</Badge>
            )}
            {expenseCount > 0 && (
              <Badge className="bg-destructive/10 text-destructive">{expenseCount} Ausgänge</Badge>
            )}
            <Badge variant="secondary">Summe: {formatCurrency(totalAmount)}</Badge>
          </div>

          {/* Tenant */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Mieter zuordnen
            </Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger>
                <SelectValue placeholder="Mieter auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Keine Zuordnung —</SelectItem>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.first_name} {t.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Type */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" /> Kategorie / Typ
            </Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger>
                <SelectValue placeholder="Typ auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Nicht ändern —</SelectItem>
                {TRANSACTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Building */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Gebäude zuordnen
            </Label>
            <Select value={buildingId} onValueChange={setBuildingId}>
              <SelectTrigger>
                <SelectValue placeholder="Gebäude auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Keine Zuordnung —</SelectItem>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} — {b.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create Rule */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Checkbox
              id="bulkCreateRule"
              checked={createRule}
              onCheckedChange={(c) => setCreateRule(c as boolean)}
            />
            <Label htmlFor="bulkCreateRule" className="text-sm cursor-pointer flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Automatische Regel aus häufigstem Muster erstellen
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Wird zugeordnet..." : `${transactions.length} zuordnen`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
