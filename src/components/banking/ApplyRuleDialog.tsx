import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpRight, ArrowDownRight, Search, CheckCircle, Loader2 } from "lucide-react";
import { TransactionRule } from "@/hooks/useBanking";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface MatchedTransaction {
  id: string;
  counterpart_name: string | null;
  purpose: string | null;
  amount_cents: number;
  booking_date: string;
  booking_text: string | null;
}

interface Props {
  rule: TransactionRule;
  onClose: () => void;
}

export function ApplyRuleDialog({ rule, onClose }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'loading' | 'preview' | 'applying' | 'done'>('loading');
  const [matches, setMatches] = useState<MatchedTransaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [appliedCount, setAppliedCount] = useState(0);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  // Load preview on mount
  useState(() => {
    loadPreview();
  });

  async function loadPreview() {
    try {
      const { data, error } = await supabase.functions.invoke('apply-rule-retroactively', {
        body: { ruleId: rule.id, preview: true },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      setMatches(data.matches || []);
      setSelectedIds((data.matches || []).map((m: MatchedTransaction) => m.id));
      setStep('preview');
    } catch (err) {
      toast.error('Fehler beim Laden: ' + (err instanceof Error ? err.message : 'Unbekannt'));
      onClose();
    }
  }

  async function applyRule() {
    setStep('applying');
    try {
      const { data, error } = await supabase.functions.invoke('apply-rule-retroactively', {
        body: { ruleId: rule.id, transactionIds: selectedIds, preview: false },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setAppliedCount(data.applied);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-rules'] });
      toast.success(`${data.applied} Transaktionen zugeordnet`);
    } catch (err) {
      toast.error('Fehler: ' + (err instanceof Error ? err.message : 'Unbekannt'));
      setStep('preview');
    }
  }

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? matches.map(m => m.id) : []);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Regel rückwirkend anwenden</DialogTitle>
        </DialogHeader>

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Suche passende Transaktionen…</p>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-3">
                <p className="text-sm font-medium">Regel: {rule.name}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {rule.conditions.map((c, i) => (
                    <span key={i}>
                      {i > 0 && ' UND '}
                      {c.field} {c.operator} „{c.value}"
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {matches.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Keine offenen Transaktionen gefunden, die dieser Regel entsprechen.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.length === matches.length}
                      onCheckedChange={(c) => toggleAll(!!c)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedIds.length} von {matches.length} ausgewählt
                    </span>
                  </div>
                  <Badge variant="secondary">{matches.length} Treffer</Badge>
                </div>

                <ScrollArea className="h-[350px] border rounded-lg">
                  <div className="divide-y">
                    {matches.map(tx => {
                      const isIncome = tx.amount_cents > 0;
                      return (
                        <div
                          key={tx.id}
                          className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer ${
                            selectedIds.includes(tx.id) ? 'bg-muted/30' : ''
                          }`}
                          onClick={() => toggleOne(tx.id, !selectedIds.includes(tx.id))}
                        >
                          <Checkbox
                            checked={selectedIds.includes(tx.id)}
                            onCheckedChange={(c) => toggleOne(tx.id, !!c)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{tx.counterpart_name || 'Unbekannt'}</p>
                            <p className="text-xs text-muted-foreground truncate">{tx.purpose || tx.booking_text}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`flex items-center gap-1 text-sm font-medium ${isIncome ? 'text-primary' : 'text-destructive'}`}>
                              {isIncome ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {formatCurrency(Math.abs(tx.amount_cents))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.booking_date), "dd.MM.yyyy", { locale: de })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Abbrechen</Button>
              <Button
                onClick={applyRule}
                disabled={selectedIds.length === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {selectedIds.length} Transaktionen zuordnen
              </Button>
            </div>
          </div>
        )}

        {step === 'applying' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Ordne {selectedIds.length} Transaktionen zu…</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <CheckCircle className="h-12 w-12 text-primary" />
            <p className="text-lg font-medium">{appliedCount} Transaktionen zugeordnet</p>
            <p className="text-sm text-muted-foreground">Die Regel wird auch für zukünftige Transaktionen automatisch angewendet.</p>
            <Button onClick={onClose} className="mt-4">Schließen</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
