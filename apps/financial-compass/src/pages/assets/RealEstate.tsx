import { useState, useEffect, useMemo } from 'react';
import { Plus, Home, Search, Pencil, Trash2, MoreHorizontal, ChevronRight, ChevronLeft, Check, MapPin, Building2 } from 'lucide-react';
import { InviteManagerDialog } from '@/components/assets/InviteManagerDialog';
import { FintuttoAppsPromo } from '@/components/assets/FintuttoAppsPromo';
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

const PROPERTY_TYPES = [
  { value: 'mfh', label: 'Mehrfamilienhaus' },
  { value: 'efh', label: 'Einfamilienhaus' },
  { value: 'etw', label: 'Eigentumswohnung' },
  { value: 'gewerbe', label: 'Gewerbeimmobilie' },
  { value: 'grundstueck', label: 'Grundstück' },
  { value: 'sonstige', label: 'Sonstige' },
];

const WIZARD_STEPS = ['Grunddaten', 'Adresse', 'Details', 'Finanzen'];

export default function RealEstate() {
  const { currentCompany } = useCompany();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [inviteAsset, setInviteAsset] = useState<Asset | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '', property_type: 'mfh', description: '',
    address: '', zip: '', city: '', purchase_date: '',
    purchase_price: '', current_value: '', units: '', area_sqm: '',
    notes: '',
  });

  useEffect(() => { if (currentCompany) fetchAssets(); }, [currentCompany]);

  const fetchAssets = async () => {
    if (!currentCompany) return;
    setLoading(true);
    const { data } = await supabase.from('assets').select('*')
      .eq('company_id', currentCompany.id).eq('type', 'immobilie')
      .order('created_at', { ascending: false }).limit(10000);
    if (data) setAssets(data);
    setLoading(false);
  };

  const formatCurrency = (v: number | null) => v === null ? '-' : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

  const filteredAssets = useMemo(() => assets.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.city?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [assets, searchQuery]);

  const pagination = usePagination(filteredAssets);

  const stats = useMemo(() => ({
    total: assets.length,
    totalValue: assets.reduce((s, a) => s + (a.current_value || a.purchase_price || 0), 0),
    totalUnits: assets.reduce((s, a) => s + (a.units || 0), 0),
    totalArea: assets.reduce((s, a) => s + (a.area_sqm || 0), 0),
  }), [assets]);

  const resetForm = () => {
    setForm({ name: '', property_type: 'mfh', description: '', address: '', zip: '', city: '', purchase_date: '', purchase_price: '', current_value: '', units: '', area_sqm: '', notes: '' });
    setWizardStep(0);
  };

  const openCreate = () => { setEditingAsset(null); resetForm(); setDialogOpen(true); };

  const openEdit = (a: Asset) => {
    setEditingAsset(a);
    setForm({
      name: a.name, property_type: a.serial_number || 'mfh', description: a.description || '',
      address: a.address || '', zip: a.zip || '', city: a.city || '',
      purchase_date: a.purchase_date || '', purchase_price: a.purchase_price?.toString() || '',
      current_value: a.current_value?.toString() || '', units: a.units?.toString() || '',
      area_sqm: a.area_sqm?.toString() || '', notes: a.notes || '',
    });
    setWizardStep(0);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentCompany || !form.name.trim()) { toast.error('Bitte geben Sie einen Namen ein.'); return; }
    setSaving(true);
    const payload = {
      company_id: currentCompany.id, name: form.name.trim(), type: 'immobilie' as const,
      description: form.description || null, serial_number: form.property_type,
      address: form.address || null, city: form.city || null, zip: form.zip || null,
      purchase_date: form.purchase_date || null,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price.replace(',', '.')) : null,
      current_value: form.current_value ? parseFloat(form.current_value.replace(',', '.')) : null,
      units: form.units ? parseInt(form.units) : null,
      area_sqm: form.area_sqm ? parseFloat(form.area_sqm.replace(',', '.')) : null,
      notes: form.notes || null,
    };
    let error;
    if (editingAsset) { ({ error } = await supabase.from('assets').update(payload).eq('id', editingAsset.id)); }
    else { ({ error } = await supabase.from('assets').insert(payload)); }
    if (error) { toast.error('Fehler beim Speichern.'); console.error(error); }
    else { toast.success(editingAsset ? 'Immobilie aktualisiert.' : 'Immobilie erstellt.'); setDialogOpen(false); fetchAssets(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) toast.error('Fehler beim Löschen.');
    else { toast.success('Immobilie gelöscht.'); fetchAssets(); }
  };

  const u = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  if (!currentCompany) return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Bitte wählen Sie eine Firma aus.</div>;

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 0: return (
        <div className="space-y-4">
          <div><Label>Bezeichnung *</Label><Input value={form.name} onChange={e => u('name', e.target.value)} placeholder="z.B. Mietobjekt Hauptstraße 5" /></div>
          <div><Label>Immobilientyp</Label>
            <Select value={form.property_type} onValueChange={v => u('property_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Beschreibung</Label><Textarea value={form.description} onChange={e => u('description', e.target.value)} rows={2} placeholder="Optionale Beschreibung..." /></div>
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <div><Label>Straße und Hausnummer</Label><Input value={form.address} onChange={e => u('address', e.target.value)} placeholder="Musterstraße 123" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>PLZ</Label><Input value={form.zip} onChange={e => u('zip', e.target.value)} placeholder="12345" /></div>
            <div><Label>Stadt</Label><Input value={form.city} onChange={e => u('city', e.target.value)} placeholder="Berlin" /></div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Wohneinheiten</Label><Input type="number" value={form.units} onChange={e => u('units', e.target.value)} placeholder="z.B. 6" /></div>
            <div><Label>Gesamtfläche (m²)</Label><Input value={form.area_sqm} onChange={e => u('area_sqm', e.target.value)} placeholder="z.B. 450" /></div>
          </div>
          <div><Label>Notizen</Label><Textarea value={form.notes} onChange={e => u('notes', e.target.value)} rows={3} placeholder="Baujahr, Zustand, Besonderheiten..." /></div>
        </div>
      );
      case 3: return (
        <div className="space-y-4">
          <div><Label>Kaufdatum</Label><Input type="date" value={form.purchase_date} onChange={e => u('purchase_date', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Kaufpreis (€)</Label><Input value={form.purchase_price} onChange={e => u('purchase_price', e.target.value)} placeholder="0,00" /></div>
            <div><Label>Aktueller Verkehrswert (€)</Label><Input value={form.current_value} onChange={e => u('current_value', e.target.value)} placeholder="0,00" /></div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Immobilien</h1>
          <p className="text-muted-foreground">Immobilien und Grundstücke verwalten</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Neue Immobilie</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="kpi-card"><p className="text-sm text-muted-foreground">Objekte</p><p className="text-2xl font-bold">{stats.total}</p></div>
        <div className="kpi-card"><p className="text-sm text-muted-foreground">Gesamtwert</p><p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalValue)}</p></div>
        <div className="kpi-card"><p className="text-sm text-muted-foreground">Wohneinheiten</p><p className="text-2xl font-bold">{stats.totalUnits}</p></div>
        <div className="kpi-card"><p className="text-sm text-muted-foreground">Gesamtfläche</p><p className="text-2xl font-bold">{stats.totalArea.toLocaleString('de-DE')} m²</p></div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Immobilie suchen..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-secondary/50" />
      </div>

      {loading ? <div className="p-8 text-center text-muted-foreground">Laden...</div>
      : filteredAssets.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-2">Keine Immobilien vorhanden</p>
          <Button variant="outline" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Erste Immobilie anlegen</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pagination.paginatedItems.map(asset => (
              <div key={asset.id} className="glass rounded-xl p-4 hover:bg-secondary/30 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-3 rounded-lg bg-primary/10"><Home className="h-6 w-6 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{asset.name}</p>
                        <Badge variant="outline" className="text-xs shrink-0">{PROPERTY_TYPES.find(t => t.value === asset.serial_number)?.label || 'Immobilie'}</Badge>
                      </div>
                      {asset.address && <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{asset.address}{asset.zip || asset.city ? `, ${asset.zip || ''} ${asset.city || ''}` : ''}</p>}
                      {(asset.units || asset.area_sqm) && <p className="text-xs text-muted-foreground mt-0.5">{asset.units ? `${asset.units} Einheiten` : ''}{asset.units && asset.area_sqm ? ' · ' : ''}{asset.area_sqm ? `${asset.area_sqm} m²` : ''}</p>}
                      <div className="flex items-center gap-4 mt-2">
                        {(asset.current_value || asset.purchase_price) && <p className="text-sm font-semibold text-primary">{formatCurrency(asset.current_value || asset.purchase_price)}</p>}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(asset)}><Pencil className="mr-2 h-4 w-4" />Bearbeiten</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setInviteAsset(asset)}><Building2 className="mr-2 h-4 w-4" />Verwalter einladen</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(asset.id)}><Trash2 className="mr-2 h-4 w-4" />Löschen</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
          <PaginationControls currentPage={pagination.currentPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} startIndex={pagination.startIndex} endIndex={pagination.endIndex} hasNextPage={pagination.hasNextPage} hasPrevPage={pagination.hasPrevPage} onNextPage={pagination.nextPage} onPrevPage={pagination.prevPage} onGoToPage={pagination.goToPage} />
        </>
      )}

      {/* Fintutto Ökosystem Promo */}
      <FintuttoAppsPromo
        propertyName={assets.length > 0 ? assets[0].name : undefined}
        propertyAddress={assets.length > 0 && assets[0].address ? `${assets[0].address}${assets[0].zip || assets[0].city ? `, ${assets[0].zip || ''} ${assets[0].city || ''}` : ''}` : null}
        companyId={currentCompany?.id}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingAsset ? 'Immobilie bearbeiten' : 'Neue Immobilie anlegen'}</DialogTitle></DialogHeader>
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

      <InviteManagerDialog
        open={!!inviteAsset}
        onOpenChange={open => { if (!open) setInviteAsset(null); }}
        propertyName={inviteAsset?.name || ''}
        propertyAddress={inviteAsset?.address ? `${inviteAsset.address}${inviteAsset.zip || inviteAsset.city ? `, ${inviteAsset.zip || ''} ${inviteAsset.city || ''}` : ''}` : null}
      />
    </div>
  );
}
