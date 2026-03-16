import { useState, useEffect, useMemo } from 'react';
import { Tags, UserPlus, Landmark, FileText, Wand2, Trash2, X, CheckSquare, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  description: string | null;
  amount: number;
  type: string;
  date: string;
  category: string | null;
  bank_account_id: string | null;
}

interface Contact {
  id: string;
  name: string;
}

interface BankAccount {
  id: string;
  name: string;
}

interface Receipt {
  id: string;
  file_name: string;
  amount: number | null;
}

const categories = [
  'Miete',
  'Kaution',
  'Nebenkosten',
  'Instandhaltung',
  'Versicherung',
  'Steuer',
  'Reparatur',
  'Umsatzerlöse',
  'Sonstige Erträge',
  'Gehälter',
  'Sozialabgaben',
  'Büromaterial',
  'Marketing',
  'Reisekosten',
  'Telekommunikation',
  'Fahrzeugkosten',
  'Abschreibungen',
  'Zinsen',
  'Beratungskosten',
  'Fortbildung',
  'Bewirtung',
  'Porto',
  'Software & IT',
  'Sonstiges',
];

const BATCH_SIZE = 100;

/** Process IDs in batches of BATCH_SIZE, calling `fn` for each chunk.
 *  Returns total errors encountered. */
async function processBatches(
  ids: string[],
  fn: (batch: string[]) => PromiseLike<{ error: any }>,
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  let errors = 0;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const { error } = await fn(batch);
    if (error) errors++;
    onProgress?.(Math.min(i + BATCH_SIZE, ids.length), ids.length);
  }
  return errors;
}

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  selectedTransactions: Transaction[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export function BulkActionsBar({
  selectedIds,
  selectedTransactions,
  onClearSelection,
  onRefresh,
}: BulkActionsBarProps) {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const count = selectedIds.size;

  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Data for selects
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  // Selected values
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [ruleCategory, setRuleCategory] = useState('');
  const [ruleContact, setRuleContact] = useState('');

  useEffect(() => {
    if (!currentCompany) return;
    Promise.all([
      supabase.from('contacts').select('id, name').eq('company_id', currentCompany.id).order('name'),
      supabase.from('bank_accounts').select('id, name').eq('company_id', currentCompany.id).order('name'),
      supabase.from('receipts').select('id, file_name, amount').eq('company_id', currentCompany.id).is('transaction_id', null).order('created_at', { ascending: false }).limit(100),
    ]).then(([contactsRes, banksRes, receiptsRes]) => {
      setContacts(contactsRes.data || []);
      setBankAccounts(banksRes.data || []);
      setReceipts(receiptsRes.data || []);
    });
  }, [currentCompany]);

  const ids = Array.from(selectedIds);

  // Find the most frequent description pattern from selected transactions
  const mostFrequentPattern = useMemo(() => {
    const descMap = new Map<string, number>();
    for (const tx of selectedTransactions) {
      const desc = tx.description?.trim();
      if (!desc) continue;
      // Extract first 3 significant words as pattern
      const words = desc.split(/\s+/).slice(0, 3).join(' ');
      if (words) descMap.set(words, (descMap.get(words) || 0) + 1);
    }
    let best = '';
    let bestCount = 0;
    for (const [pattern, cnt] of descMap) {
      if (cnt > bestCount) { best = pattern; bestCount = cnt; }
    }
    return best;
  }, [selectedTransactions]);

  const onProgress = (done: number, total: number) => {
    setProgress(Math.round((done / total) * 100));
  };

  const handleBulkCategory = async () => {
    if (!selectedCategory) return;
    setLoading(true);
    setProgress(0);
    const errors = await processBatches(
      ids,
      (batch) => supabase.from('transactions').update({ category: selectedCategory }).in('id', batch).select(),
      onProgress,
    );
    setLoading(false);
    if (errors) {
      toast({ title: 'Teilweise Fehler', description: `${errors} Batches fehlgeschlagen.`, variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: `${count} Buchungen → Kategorie "${selectedCategory}".` });
    }
    setCategoryDialogOpen(false);
    setSelectedCategory('');
    onClearSelection();
    onRefresh();
  };

  const handleBulkContact = async () => {
    if (!selectedContact) return;
    setLoading(true);
    setProgress(0);
    const errors = await processBatches(
      ids,
      (batch) => supabase.from('transactions').update({ contact_id: selectedContact }).in('id', batch).select(),
      onProgress,
    );
    setLoading(false);
    if (errors) {
      toast({ title: 'Teilweise Fehler', description: `${errors} Batches fehlgeschlagen.`, variant: 'destructive' });
    } else {
      const contactName = contacts.find((c) => c.id === selectedContact)?.name || '';
      toast({ title: 'Erfolg', description: `${count} Buchungen → Mieter "${contactName}".` });
    }
    setContactDialogOpen(false);
    setSelectedContact('');
    onClearSelection();
    onRefresh();
  };

  const handleBulkBank = async () => {
    if (!selectedBank) return;
    setLoading(true);
    setProgress(0);
    const errors = await processBatches(
      ids,
      (batch) => supabase.from('transactions').update({ bank_account_id: selectedBank }).in('id', batch).select(),
      onProgress,
    );
    setLoading(false);
    if (errors) {
      toast({ title: 'Teilweise Fehler', description: `${errors} Batches fehlgeschlagen.`, variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: `${count} Buchungen einem Bankkonto zugeordnet.` });
    }
    setBankDialogOpen(false);
    setSelectedBank('');
    onClearSelection();
    onRefresh();
  };

  const handleBulkBuilding = async () => {
    if (!selectedBuilding) return;
    setLoading(true);
    setProgress(0);
    const errors = await processBatches(
      ids,
      (batch) => supabase.from('transactions').update({ building: selectedBuilding } as any).in('id', batch).select(),
      onProgress,
    );
    setLoading(false);
    if (errors) {
      toast({ title: 'Teilweise Fehler', description: `${errors} Batches fehlgeschlagen.`, variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: `${count} Buchungen → Gebäude "${selectedBuilding}".` });
    }
    setBuildingDialogOpen(false);
    setSelectedBuilding('');
    onClearSelection();
    onRefresh();
  };

  const handleBulkReceipt = async () => {
    if (!selectedReceipt || ids.length !== 1) return;
    setLoading(true);
    const { error } = await supabase
      .from('receipts')
      .update({ transaction_id: ids[0] })
      .eq('id', selectedReceipt);
    setLoading(false);
    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: 'Beleg verknüpft.' });
    }
    setReceiptDialogOpen(false);
    setSelectedReceipt('');
    onClearSelection();
    onRefresh();
  };

  const handleCreateRule = async () => {
    if (!ruleCategory || !ruleName || !currentCompany) return;

    setLoading(true);
    setProgress(0);

    // Build update payload
    const updatePayload: Record<string, string> = { category: ruleCategory };
    if (ruleContact) updatePayload.contact_id = ruleContact;

    const errors = await processBatches(
      ids,
      (batch) => supabase.from('transactions').update(updatePayload).in('id', batch).select(),
      onProgress,
    );

    if (errors) {
      toast({ title: 'Teilweise Fehler', description: `${errors} Batches fehlgeschlagen.`, variant: 'destructive' });
    } else {
      toast({
        title: 'Regel angewendet',
        description: `"${ruleName}" → ${ruleCategory}. ${count} Buchungen aktualisiert. Für dauerhafte Regeln nutzen Sie die Zuordnungsregeln-Seite.`,
      });
    }
    setLoading(false);
    setRuleDialogOpen(false);
    setRuleName('');
    setRuleCategory('');
    setRuleContact('');
    onClearSelection();
    onRefresh();
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    setProgress(0);
    const errors = await processBatches(
      ids,
      (batch) => supabase.from('transactions').delete().in('id', batch).select(),
      onProgress,
    );
    setLoading(false);
    if (errors) {
      toast({ title: 'Teilweise Fehler', description: `${errors} Batches fehlgeschlagen.`, variant: 'destructive' });
    } else {
      toast({ title: 'Gelöscht', description: `${count} Buchungen gelöscht.` });
    }
    setDeleteDialogOpen(false);
    onClearSelection();
    onRefresh();
  };

  if (count === 0) return null;

  return (
    <>
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 glass rounded-xl p-3 border border-primary/30 animate-fade-in">
        <Badge variant="default" className="bg-primary text-primary-foreground gap-1.5 text-sm px-3 py-1.5">
          <CheckSquare className="h-3.5 w-3.5" />
          {count} ausgewählt
        </Badge>

        <div className="flex flex-wrap gap-1.5 flex-1">
          <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)} className="gap-1.5">
            <Tags className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kategorie</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setContactDialogOpen(true)} className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mieter</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBuildingDialogOpen(true)} className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Gebäude</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBankDialogOpen(true)} className="gap-1.5">
            <Landmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bankkonto</span>
          </Button>
          {count === 1 && (
            <Button variant="outline" size="sm" onClick={() => setReceiptDialogOpen(true)} className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Beleg</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => {
            setRuleName(mostFrequentPattern);
            setRuleDialogOpen(true);
          }} className="gap-1.5">
            <Wand2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Regel erstellen</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)} className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Löschen</span>
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress indicator during batch operations */}
      {loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verarbeite {count} Buchungen in Batches...
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Typ / Kategorie zuweisen</DialogTitle>
            <DialogDescription>{count} Buchungen erhalten eine neue Kategorie.</DialogDescription>
          </DialogHeader>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleBulkCategory} disabled={!selectedCategory || loading}>
              {loading ? 'Wird gespeichert...' : 'Zuweisen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact / Mieter Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mieter / Kontakt zuordnen</DialogTitle>
            <DialogDescription>{count} Buchungen einem Mieter zuordnen.</DialogDescription>
          </DialogHeader>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Keine Kontakte vorhanden. Erstellen Sie zuerst einen Kontakt unter „Kontakte".</p>
          ) : (
            <Select value={selectedContact} onValueChange={setSelectedContact}>
              <SelectTrigger><SelectValue placeholder="Mieter wählen" /></SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleBulkContact} disabled={!selectedContact || loading}>
              {loading ? 'Wird gespeichert...' : 'Zuordnen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Building / Gebäude Dialog */}
      <Dialog open={buildingDialogOpen} onOpenChange={setBuildingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gebäude zuordnen</DialogTitle>
            <DialogDescription>{count} Buchungen einem Gebäude zuordnen.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Gebäude (Adresse oder Name)</Label>
            <Input
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              placeholder="z.B. Musterstraße 12, Berlin"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuildingDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleBulkBuilding} disabled={!selectedBuilding.trim() || loading}>
              {loading ? 'Wird gespeichert...' : 'Zuordnen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bank Account Dialog */}
      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bankkonto zuordnen</DialogTitle>
            <DialogDescription>{count} Buchungen einem Bankkonto zuordnen.</DialogDescription>
          </DialogHeader>
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger><SelectValue placeholder="Bankkonto wählen" /></SelectTrigger>
            <SelectContent>
              {bankAccounts.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleBulkBank} disabled={!selectedBank || loading}>
              {loading ? 'Wird gespeichert...' : 'Zuordnen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Beleg verknüpfen</DialogTitle>
            <DialogDescription>Einen offenen Beleg mit dieser Buchung verknüpfen.</DialogDescription>
          </DialogHeader>
          {receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Keine offenen Belege vorhanden.</p>
          ) : (
            <Select value={selectedReceipt} onValueChange={setSelectedReceipt}>
              <SelectTrigger><SelectValue placeholder="Beleg wählen" /></SelectTrigger>
              <SelectContent>
                {receipts.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.file_name} {r.amount ? `(${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(r.amount)})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleBulkReceipt} disabled={!selectedReceipt || loading}>
              {loading ? 'Wird verknüpft...' : 'Verknüpfen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rule Dialog – auto-fills most frequent pattern */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Automatische Regel erstellen</DialogTitle>
            <DialogDescription>
              Das häufigste Muster aus {count} Buchungen wurde vorausgefüllt. Passen Sie es an und wählen Sie die Zuordnung.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Muster (Beschreibung enthält)</Label>
              <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="z.B. REWE, Miete, Hausgeld..." />
              {mostFrequentPattern && (
                <p className="text-xs text-muted-foreground">
                  Häufigstes Muster: „{mostFrequentPattern}"
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={ruleCategory} onValueChange={setRuleCategory}>
                <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mieter (optional)</Label>
              <Select value={ruleContact} onValueChange={setRuleContact}>
                <SelectTrigger><SelectValue placeholder="Keinen Mieter zuweisen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Keinen Mieter zuweisen</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleCreateRule} disabled={!ruleCategory || !ruleName || loading}>
              {loading ? 'Wird verarbeitet...' : `Regel anwenden (${count})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{count} Buchungen löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle {count} ausgewählten Buchungen werden dauerhaft gelöscht.
              {count > 100 && ` Die Verarbeitung erfolgt in Batches von ${BATCH_SIZE}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? 'Wird gelöscht...' : 'Endgültig löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
