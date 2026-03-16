import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Filter,
  Search,
  CheckCircle,
  ArrowRight,
  Tag,
  History,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ---------- Types ----------

interface AssignmentRule {
  id: string;
  company_id: string;
  name: string;
  field: 'description' | 'amount' | 'contact';
  operator: 'contains' | 'equals' | 'greater_than' | 'less_than' | 'starts_with';
  value: string;
  target_category: string;
  is_active: boolean;
  created_at: string;
}

interface MatchedTransaction {
  id: string;
  date: string;
  description: string | null;
  amount: number;
  type: string;
  category: string | null;
  selected: boolean;
}

// ---------- Constants ----------

const STORAGE_KEY = 'fintutto_assignment_rules';

const fieldLabels: Record<string, string> = {
  description: 'Beschreibung',
  amount: 'Betrag',
  contact: 'Kontakt',
};

const operatorLabels: Record<string, string> = {
  contains: 'enthält',
  equals: 'ist gleich',
  greater_than: 'größer als',
  less_than: 'kleiner als',
  starts_with: 'beginnt mit',
};

const categories = [
  'Umsatzerlöse',
  'Wareneinkauf',
  'Personalaufwand',
  'Miete',
  'Versicherungen',
  'Bürokosten',
  'Reisekosten',
  'Werbung',
  'Telekommunikation',
  'Beratungskosten',
  'Sonstige Ausgaben',
  'Privatentnahme',
  'Privateinlage',
];

// ---------- Local-storage helpers ----------

function getStoredRules(): AssignmentRule[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveStoredRules(rules: AssignmentRule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

// ---------- Page component ----------

export default function AssignmentRules() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();

  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AssignmentRule | null>(null);
  const [matchedTransactions, setMatchedTransactions] = useState<MatchedTransaction[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [applyingLoading, setApplyingLoading] = useState(false);

  // Form state
  const [formField, setFormField] = useState<AssignmentRule['field']>('description');
  const [formOperator, setFormOperator] = useState<AssignmentRule['operator']>('contains');
  const [formValue, setFormValue] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formName, setFormName] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [applyHistorical, setApplyHistorical] = useState(true);

  // Load rules
  useEffect(() => {
    if (!currentCompany) return;
    const all = getStoredRules();
    setRules(all.filter((r) => r.company_id === currentCompany.id));
    setLoading(false);
  }, [currentCompany]);

  const resetForm = () => {
    setFormField('description');
    setFormOperator('contains');
    setFormValue('');
    setFormCategory('');
    setFormName('');
    setFormActive(true);
    setApplyHistorical(true);
    setSelectedRule(null);
    setMatchedTransactions([]);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (rule: AssignmentRule) => {
    setSelectedRule(rule);
    setFormField(rule.field);
    setFormOperator(rule.operator);
    setFormValue(rule.value);
    setFormCategory(rule.target_category);
    setFormName(rule.name);
    setFormActive(rule.is_active);
    setApplyHistorical(true);
    setMatchedTransactions([]);
    setDialogOpen(true);
  };

  // ---------- Match preview ----------

  const findMatches = useCallback(async () => {
    if (!currentCompany || !formValue) return;
    setMatchLoading(true);

    try {
      // Fetch all transactions for this company
      const { data, error } = await supabase
        .from('transactions')
        .select('id, date, description, amount, type, category')
        .eq('company_id', currentCompany.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const matched: MatchedTransaction[] = (data || [])
        .filter((tx) => {
          const fieldVal =
            formField === 'description'
              ? (tx.description || '').toLowerCase()
              : formField === 'amount'
                ? String(tx.amount)
                : '';

          const searchVal = formValue.toLowerCase();

          switch (formOperator) {
            case 'contains':
              return fieldVal.includes(searchVal);
            case 'equals':
              return fieldVal === searchVal;
            case 'starts_with':
              return fieldVal.startsWith(searchVal);
            case 'greater_than':
              return tx.amount > parseFloat(formValue);
            case 'less_than':
              return tx.amount < parseFloat(formValue);
            default:
              return false;
          }
        })
        .map((tx) => ({ ...tx, selected: true }));

      setMatchedTransactions(matched);
    } catch {
      toast({ title: 'Fehler', description: 'Buchungen konnten nicht geladen werden.', variant: 'destructive' });
    } finally {
      setMatchLoading(false);
    }
  }, [currentCompany, formField, formOperator, formValue, toast]);

  // When user clicks "Vorschau & Anwenden" in the creation dialog
  const handlePreview = async () => {
    if (!formValue || !formCategory || !formName) {
      toast({ title: 'Pflichtfelder', description: 'Bitte Name, Wert und Kategorie ausfüllen.' });
      return;
    }
    await findMatches();
    setDialogOpen(false);
    setPreviewOpen(true);
  };

  // Save without historical application (edit mode or skip)
  const handleSaveOnly = () => {
    if (!formValue || !formCategory || !formName) {
      toast({ title: 'Pflichtfelder', description: 'Bitte Name, Wert und Kategorie ausfüllen.' });
      return;
    }
    persistRule();
    setDialogOpen(false);
  };

  // Persist rule + optionally apply to selected transactions
  const persistRule = (applyIds?: string[]) => {
    if (!currentCompany) return;

    const allRules = getStoredRules();
    const now = new Date().toISOString();

    if (selectedRule) {
      // Update
      const idx = allRules.findIndex((r) => r.id === selectedRule.id);
      if (idx >= 0) {
        allRules[idx] = {
          ...allRules[idx],
          name: formName,
          field: formField,
          operator: formOperator,
          value: formValue,
          target_category: formCategory,
          is_active: formActive,
        };
      }
    } else {
      // Create
      const newRule: AssignmentRule = {
        id: crypto.randomUUID(),
        company_id: currentCompany.id,
        name: formName,
        field: formField,
        operator: formOperator,
        value: formValue,
        target_category: formCategory,
        is_active: formActive,
        created_at: now,
      };
      allRules.push(newRule);
    }

    saveStoredRules(allRules);
    setRules(allRules.filter((r) => r.company_id === currentCompany.id));
    toast({ title: 'Erfolg', description: 'Zuordnungsregel gespeichert.' });
    resetForm();

    // Apply to historical transactions
    if (applyIds && applyIds.length > 0) {
      applyToTransactions(applyIds);
    }
  };

  const applyToTransactions = async (ids: string[]) => {
    setApplyingLoading(true);
    try {
      // Update in batches
      const batchSize = 50;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error } = await supabase
          .from('transactions')
          .update({ category: formCategory })
          .in('id', batch);
        if (error) throw error;
      }

      toast({
        title: 'Zuordnung abgeschlossen',
        description: `${ids.length} Buchung${ids.length === 1 ? '' : 'en'} wurden der Kategorie „${formCategory}" zugeordnet.`,
      });
    } catch {
      toast({ title: 'Fehler', description: 'Einige Buchungen konnten nicht aktualisiert werden.', variant: 'destructive' });
    } finally {
      setApplyingLoading(false);
      setPreviewOpen(false);
    }
  };

  const handleConfirmAndSave = () => {
    const selectedIds = matchedTransactions.filter((t) => t.selected).map((t) => t.id);
    persistRule(selectedIds.length > 0 ? selectedIds : undefined);
    setPreviewOpen(false);
  };

  const handleDelete = () => {
    if (!selectedRule || !currentCompany) return;
    const allRules = getStoredRules().filter((r) => r.id !== selectedRule.id);
    saveStoredRules(allRules);
    setRules(allRules.filter((r) => r.company_id === currentCompany.id));
    toast({ title: 'Erfolg', description: 'Zuordnungsregel gelöscht.' });
    setDeleteDialogOpen(false);
    setSelectedRule(null);
  };

  const toggleRuleActive = (rule: AssignmentRule) => {
    const allRules = getStoredRules();
    const idx = allRules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      allRules[idx].is_active = !allRules[idx].is_active;
      saveStoredRules(allRules);
      setRules(allRules.filter((r) => r.company_id === currentCompany!.id));
    }
  };

  const toggleTransactionSelection = (id: string) => {
    setMatchedTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const toggleAllTransactions = (selected: boolean) => {
    setMatchedTransactions((prev) => prev.map((t) => ({ ...t, selected })));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Bitte wählen Sie eine Firma aus.
      </div>
    );
  }

  const selectedCount = matchedTransactions.filter((t) => t.selected).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Zuordnungsregeln</h1>
          <p className="text-muted-foreground">
            Automatische Kategorisierung von Kontobuchungen anhand von Regeln
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Regel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Regeln gesamt</p>
                <p className="text-2xl font-bold">{rules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktiv</p>
                <p className="text-2xl font-bold">{rules.filter((r) => r.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Tag className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kategorien abgedeckt</p>
                <p className="text-2xl font-bold">
                  {new Set(rules.map((r) => r.target_category)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules list */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Regeln
          </CardTitle>
          <CardDescription>Wenn eine Buchung die Bedingung erfüllt, wird sie automatisch kategorisiert.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Laden...</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Filter className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1">Keine Zuordnungsregeln</p>
              <p className="text-sm">Erstellen Sie Ihre erste Regel, um Buchungen automatisch zu kategorisieren.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className={`p-2 rounded-lg ${rule.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Tag className={`h-5 w-5 ${rule.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${!rule.is_active ? 'text-muted-foreground' : ''}`}>{rule.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {fieldLabels[rule.field]} {operatorLabels[rule.operator]} „{rule.value}"
                      <ArrowRight className="inline h-3 w-3 mx-1" />
                      <Badge variant="secondary" className="text-xs">{rule.target_category}</Badge>
                    </p>
                  </div>
                  <Switch checked={rule.is_active} onCheckedChange={() => toggleRuleActive(rule)} />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedRule(rule);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== Create / Edit Dialog ========== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{selectedRule ? 'Regel bearbeiten' : 'Neue Zuordnungsregel'}</DialogTitle>
            <DialogDescription>
              Definieren Sie eine Bedingung und die Zielkategorie.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="z.B. Amazon-Bestellungen" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Feld</Label>
                <Select value={formField} onValueChange={(v) => setFormField(v as AssignmentRule['field'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="description">Beschreibung</SelectItem>
                    <SelectItem value="amount">Betrag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Operator</Label>
                <Select value={formOperator} onValueChange={(v) => setFormOperator(v as AssignmentRule['operator'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">enthält</SelectItem>
                    <SelectItem value="equals">ist gleich</SelectItem>
                    <SelectItem value="starts_with">beginnt mit</SelectItem>
                    {formField === 'amount' && (
                      <>
                        <SelectItem value="greater_than">größer als</SelectItem>
                        <SelectItem value="less_than">kleiner als</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Wert</Label>
                <Input
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder={formField === 'amount' ? '100' : 'Suchbegriff'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Zielkategorie</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Regel aktiv</Label>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <Checkbox
                checked={applyHistorical}
                onCheckedChange={(v) => setApplyHistorical(v === true)}
                id="apply-historical"
              />
              <Label htmlFor="apply-historical" className="text-sm cursor-pointer">
                <span className="font-medium">Auf bestehende Buchungen anwenden</span>
                <span className="block text-muted-foreground text-xs mt-0.5">
                  Durchsucht alle Buchungen und zeigt eine Vorschau zur Bestätigung
                </span>
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            {applyHistorical ? (
              <Button onClick={handlePreview}>
                <Search className="mr-2 h-4 w-4" />
                Vorschau & Anwenden
              </Button>
            ) : (
              <Button onClick={handleSaveOnly}>
                {selectedRule ? 'Speichern' : 'Erstellen'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Preview / Confirmation Dialog ========== */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Gefundene Buchungen — Vorschau
            </DialogTitle>
            <DialogDescription>
              {matchedTransactions.length} Buchung{matchedTransactions.length !== 1 ? 'en' : ''} stimmen mit der Regel überein.
              Wählen Sie aus, welche Buchungen der Kategorie „{formCategory}" zugeordnet werden sollen.
            </DialogDescription>
          </DialogHeader>

          {matchLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : matchedTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Keine passenden Buchungen gefunden</p>
              <p className="text-sm mt-1">Die Regel wird trotzdem erstellt und auf zukünftige Buchungen angewandt.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto -mx-6 px-6">
              <div className="flex items-center gap-3 mb-3">
                <Checkbox
                  checked={selectedCount === matchedTransactions.length}
                  onCheckedChange={(v) => toggleAllTransactions(v === true)}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedCount} von {matchedTransactions.length} ausgewählt
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                    <TableHead>Aktuelle Kategorie</TableHead>
                    <TableHead>Neue Kategorie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchedTransactions.map((tx) => (
                    <TableRow key={tx.id} className={tx.selected ? '' : 'opacity-50'}>
                      <TableCell>
                        <Checkbox
                          checked={tx.selected}
                          onCheckedChange={() => toggleTransactionSelection(tx.id)}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{tx.description || '–'}</TableCell>
                      <TableCell className={`text-right whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-500' : 'text-destructive'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                      </TableCell>
                      <TableCell>
                        {tx.category ? (
                          <Badge variant="outline" className="text-xs">{tx.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{formCategory}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => { setPreviewOpen(false); setDialogOpen(true); }}>
              Zurück
            </Button>
            <Button
              onClick={handleConfirmAndSave}
              disabled={applyingLoading}
            >
              {applyingLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {selectedCount > 0
                ? `Regel erstellen & ${selectedCount} Buchung${selectedCount === 1 ? '' : 'en'} zuordnen`
                : 'Nur Regel erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Delete Dialog ========== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Regel „{selectedRule?.name}" wirklich löschen? Bereits zugeordnete Buchungen werden nicht zurückgesetzt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
