import { useState, useEffect, useMemo } from 'react';
import { Plus, Shield, Search, Pencil, Trash2, MoreHorizontal, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

interface Asset {
  id: string; company_id: string; name: string; type: string; description: string | null;
  purchase_date: string | null; purchase_price: number | null; current_value: number | null;
  address: string | null; city: string | null; zip: string | null;
  units: number | null; area_sqm: number | null; serial_number: string | null; notes: string | null;
  created_at: string; updated_at: string;
}

const INSURANCE_TYPES = [
  { value: 'haftpflicht', label: 'Haftpflicht' }, { value: 'hausrat', label: 'Hausrat' },
  { value: 'gebaude', label: 'Gebäudeversicherung' }, { value: 'kfz', label: 'KFZ-Versicherung' },
  { value: 'leben', label: 'Lebensversicherung' }, { value: 'bu', label: 'Berufsunfähigkeit' },
  { value: 'kranken', label: 'Krankenversicherung' }, { value: 'rechtsschutz', label: 'Rechtsschutz' },
  { value: 'unfall', label: 'Unfallversicherung' }, { value: 'betrieb', label: 'Betriebshaftpflicht' },
  { value: 'sonstige', label: 'Sonstige' },
];

const PAYMENT_INTERVALS = [
  { value: 'monatlich', label: 'Monatlich' }, { value: 'vierteljaehrlich', label: 'Vierteljährlich' },
  { value: 'halbjaehrlich', label: 'Halbjährlich' }, { value: 'jaehrlich', label: 'Jährlich' },
];

const WIZARD_STEPS = ['Versicherung', 'Vertrag', 'Kosten & Leistung'];

export default function Insurance() {
  const { currentCompany } = useCompany();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  const [form, setForm] = useState({
    name: '', insurance_type: 'haftpflicht', provider: '', policy_number: '',
    start_date: '', end_date: '', premium: '', interval: 'jaehrlich',
    coverage: '', deductible: '', notes: '',
  });

  useEffect(() => { if (currentCompany) fetchAssets(); }, [currentCompany]);

  const fetchAssets = async () => {
    if (!currentCompany) return;
    setLoading(true);
    const { data } = await supabase.from('assets').select('*')
      .eq('company_id', currentCompany.id).eq('type', 'versicherung')
      .order('created_at', { ascending: false }).limit(10000);
    if (data) setAssets(data);
    setLoading(false);
  };

  const formatCurrency = (v: number | null) => v === null ? '-' : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

  const filteredAssets = useMemo(() => assets.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [assets, searchQuery]);

  const pagination = usePagination(filteredAssets);

  const stats = useMemo(() => ({
    total: assets.length,
    annualCost: assets.reduce((s, a) => {
      let parsed: any = {}; try { parsed = JSON.parse(a.notes || '{}'); } catch {}
      const premium = a.purchase_price || 0;
      const interval = parsed.interval || 'jaehrlich';
      const multiplier = interval === 'monatlich' ? 12 : interval === 'vierteljaehrlich' ? 4 : interval === 'halbjaehrlich' ? 2 : 1;
      return s + premium * multiplier;
    }, 0),
  }), [assets]);

  const resetForm = () => { setForm({ name: '', insurance_type: 'haftpflicht', provider: '', policy_number: '', start_date: '', end_date: '', premium: '', interval: 'jaehrlich', coverage: '', deductible: '', notes: '' }); setWizardStep(0); };
  const openCreate = () => { setEditingAsset(null); resetForm(); setDialogOpen(true); };
  const openEdit = (a: Asset) => {
    setEditingAsset(a);
    let parsed: any = {}; try { parsed = JSON.parse(a.notes || '{}'); } catch {}
    setForm({
      name: a.name, insurance_type: a.serial_number || 'haftpflicht', provider: a.description || '',
      policy_number: parsed.policy_number || '', start_date: a.purchase_date || '',
      end_date: parsed.end_date || '', premium: a.purchase_price?.toString() || '',
      interval: parsed.interval || 'jaehrlich', coverage: a.current_value?.toString() || '',
      deductible: parsed.deductible || '', notes: parsed.notes || '',
    });
    setWizardStep(0); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentCompany || !form.name.trim()) { toast.error('Bitte geben Sie einen Namen ein.'); return; }
    setSaving(true);
    const notesData = JSON.stringify({ policy_number: form.policy_number, end_date: form.end_date, interval: form.interval, deductible: form.deductible, notes: form.notes });
    const payload = {
      company_id: currentCompany.id, name: form.name.trim(), type: 'versicherung' as const,
      description: form.provider || null, serial_number: form.insurance_type,
      purchase_date: form.start_date || null,
      purchase_price: form.premium ? parseFloat(form.premium.replace(',', '.')) : null,
      current_value: form.coverage ? parseFloat(form.coverage.replace(',', '.')) : null,
      notes: notesData, address: null, city: null, zip: null, units: null, area_sqm: null,
    };
    let error;
    if (editingAsset) { ({ error } = await supabase.from('assets').update(payload).eq('id', editingAsset.id)); }
    else { ({ error } = await supabase.from('assets').insert(payload)); }
    if (error) { toast.error('Fehler beim Speichern.'); console.error(error); }
    else { toast.success(editingAsset ? 'Versicherung aktualisiert.' : 'Versicherung erstellt.'); setDialogOpen(false); fetchAssets(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) toast.error('Fehler.'); else { toast.success('Gelöscht.'); fetchAssets(); }
  };

  const u = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  if (!currentCompany) return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Bitte wählen Sie eine Firma aus.</div>;

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 0: return (
        <div className="space-y-4">
          <div><Label>Bezeichnung *</Label><Input value={form.name} onChange={e => u('name', e.target.value)} placeholder="z.B. Privathaftpflicht Allianz" /></div>
          <div><Label>Versicherungsart</Label>
            <Select value={form.insurance_type} onValueChange={v => u('insurance_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{INSURANCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Versicherer</Label><Input value={form.provider} onChange={e => u('provider', e.target.value)} placeholder="z.B. Allianz, HUK-COBURG" /></div>
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <div><Label>Vertragsnummer / Policennummer</Label><Input value={form.policy_number} onChange={e => u('policy_number', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Vertragsbeginn</Label><Input type="date" value={form.start_date} onChange={e => u('start_date', e.target.value)} /></div>
            <div><Label>Vertragsende</Label><Input type="date" value={form.end_date} onChange={e => u('end_date', e.target.value)} /></div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Beitrag (€)</Label><Input value={form.premium} onChange={e => u('premium', e.target.value)} placeholder="0,00" /></div>
            <div><Label>Zahlungsintervall</Label>
              <Select value={form.interval} onValueChange={v => u('interval', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_INTERVALS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Deckungssumme (€)</Label><Input value={form.coverage} onChange={e => u('coverage', e.target.value)} placeholder="0,00" /></div>
            <div><Label>Selbstbeteiligung (€)</Label><Input value={form.deductible} onChange={e => u('deductible', e.target.value)} placeholder="0,00" /></div>
          </div>
          <div><Label>Notizen</Label><Textarea value={form.notes} onChange={e => u('notes', e.target.value)} rows={2} /></div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold mb-2">Versicherungen</h1><p className="text-muted-foreground">Alle Versicherungsverträge verwalten</p></div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Neue Versicherung</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="kpi-card"><p className="text-sm text-muted-foreground">Verträge</p><p className="text-2xl font-bold">{stats.total}</p></div>
        <div className="kpi-card"><p className="text-sm text-muted-foreground">Jahreskosten</p><p className="text-2xl font-bold text-primary">{formatCurrency(stats.annualCost)}</p></div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Versicherung suchen..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-secondary/50" />
      </div>

      {loading ? <div className="p-8 text-center text-muted-foreground">Laden...</div>
      : filteredAssets.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-2">Keine Versicherungen vorhanden</p>
          <Button variant="outline" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Erste Versicherung anlegen</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pagination.paginatedItems.map(asset => {
              let parsed: any = {}; try { parsed = JSON.parse(asset.notes || '{}'); } catch {}
              return (
                <div key={asset.id} className="glass rounded-xl p-4 hover:bg-secondary/30 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-3 rounded-lg bg-primary/10"><Shield className="h-6 w-6 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><p className="font-medium truncate">{asset.name}</p><Badge variant="outline" className="text-xs shrink-0">{INSURANCE_TYPES.find(t => t.value === asset.serial_number)?.label || asset.serial_number}</Badge></div>
                        {asset.description && <p className="text-sm text-muted-foreground mt-1">{asset.description}</p>}
                        <div className="flex items-center gap-4 mt-2">
                          {asset.purchase_price && <p className="text-sm font-semibold text-primary">{formatCurrency(asset.purchase_price)} / {PAYMENT_INTERVALS.find(i => i.value === parsed.interval)?.label || 'Jahr'}</p>}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(asset)}><Pencil className="mr-2 h-4 w-4" />Bearbeiten</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(asset.id)}><Trash2 className="mr-2 h-4 w-4" />Löschen</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
          <PaginationControls currentPage={pagination.currentPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} startIndex={pagination.startIndex} endIndex={pagination.endIndex} hasNextPage={pagination.hasNextPage} hasPrevPage={pagination.hasPrevPage} onNextPage={pagination.nextPage} onPrevPage={pagination.prevPage} onGoToPage={pagination.goToPage} />
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingAsset ? 'Versicherung bearbeiten' : 'Neue Versicherung anlegen'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              {WIZARD_STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${i <= wizardStep ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    {i < wizardStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className="text-xs hidden sm:inline">{s}</span>
                  {i < WIZARD_STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < wizardStep ? 'bg-primary' : 'bg-border'}`} />}
                </div>
              ))}
            </div>
            <Progress value={((wizardStep + 1) / WIZARD_STEPS.length) * 100} className="h-1" />
            {renderWizardStep()}
          </div>
          <DialogFooter className="gap-2">
            {wizardStep > 0 && <Button variant="outline" onClick={() => setWizardStep(s => s - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Zurück</Button>}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            {wizardStep < WIZARD_STEPS.length - 1
              ? <Button onClick={() => { if (wizardStep === 0 && !form.name.trim()) { toast.error('Name ist erforderlich.'); return; } setWizardStep(s => s + 1); }}>Weiter<ChevronRight className="ml-1 h-4 w-4" /></Button>
              : <Button onClick={handleSave} disabled={saving}>{saving ? 'Speichert...' : editingAsset ? 'Speichern' : 'Erstellen'}</Button>
            }
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
