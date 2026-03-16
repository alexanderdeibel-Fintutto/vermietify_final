import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, Save, Check } from 'lucide-react';
import { COMPANY_GRADIENTS } from '@/lib/companyGradients';
import { cn } from '@/lib/utils';

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
    legal_form?: string;
    tax_id?: string;
    vat_id?: string;
    address?: string;
    zip?: string;
    city?: string;
    chart_of_accounts?: string;
    theme_index?: number;
  } | null;
}

const legalForms = [
  { value: 'gmbh', label: 'GmbH', description: 'Gesellschaft mit beschränkter Haftung' },
  { value: 'ug', label: 'UG', description: 'Unternehmergesellschaft (haftungsbeschränkt)' },
  { value: 'ag', label: 'AG', description: 'Aktiengesellschaft' },
  { value: 'kg', label: 'KG', description: 'Kommanditgesellschaft' },
  { value: 'ohg', label: 'OHG', description: 'Offene Handelsgesellschaft' },
  { value: 'gbr', label: 'GbR', description: 'Gesellschaft bürgerlichen Rechts' },
  { value: 'einzelunternehmen', label: 'Einzelunternehmen', description: 'Einzelkaufmann/-frau' },
];

export function EditCompanyDialog({ open, onOpenChange, company }: EditCompanyDialogProps) {
  const { refetchCompanies, currentCompany, setCurrentCompany } = useCompany();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    legalForm: '',
    taxId: '',
    vatId: '',
    address: '',
    zip: '',
    city: '',
    chartOfAccounts: 'skr03',
    themeIndex: 0,
  });

  useEffect(() => {
    if (company && open) {
      setForm({
        name: company.name || '',
        legalForm: company.legal_form || '',
        taxId: company.tax_id || '',
        vatId: company.vat_id || '',
        address: company.address || '',
        zip: company.zip || '',
        city: company.city || '',
        chartOfAccounts: company.chart_of_accounts || 'skr03',
        themeIndex: company.theme_index ?? 0,
      });
    }
  }, [company, open]);

  const updateForm = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!company) return;
    if (!form.name.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen Firmennamen ein.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: form.name.trim(),
          legal_form: form.legalForm || null,
          tax_id: form.taxId || null,
          vat_id: form.vatId || null,
          address: form.address || null,
          zip: form.zip || null,
          city: form.city || null,
          chart_of_accounts: form.chartOfAccounts,
          theme_index: form.themeIndex,
        })
        .eq('id', company.id);

      if (error) throw error;

      await refetchCompanies();

      // Update currentCompany if we just edited the active one
      if (currentCompany?.id === company.id) {
        setCurrentCompany({
          id: company.id,
          name: form.name.trim(),
          tax_id: form.taxId || undefined,
          address: form.address || undefined,
        });
      }

      toast({
        title: 'Firma aktualisiert',
        description: `${form.name} wurde erfolgreich gespeichert.`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: 'Fehler',
        description: 'Die Firma konnte nicht aktualisiert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Firma bearbeiten
          </DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Daten Ihrer Firma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Grunddaten */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Grunddaten
            </h3>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Firmenname *</Label>
              <Input
                id="edit-name"
                placeholder="z.B. Musterfirma"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rechtsform</Label>
              <Select value={form.legalForm} onValueChange={(v) => updateForm('legalForm', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Rechtsform wählen" />
                </SelectTrigger>
                <SelectContent>
                  {legalForms.map((lf) => (
                    <SelectItem key={lf.value} value={lf.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{lf.label}</span>
                        <span className="text-xs text-muted-foreground">{lf.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Steuerdaten */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Steuerdaten
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-taxId">Steuernummer</Label>
                <Input
                  id="edit-taxId"
                  placeholder="z.B. 123/456/78901"
                  value={form.taxId}
                  onChange={(e) => updateForm('taxId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vatId">USt-IdNr.</Label>
                <Input
                  id="edit-vatId"
                  placeholder="z.B. DE123456789"
                  value={form.vatId}
                  onChange={(e) => updateForm('vatId', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Adresse
            </h3>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Straße und Hausnummer</Label>
              <Input
                id="edit-address"
                placeholder="z.B. Musterstraße 123"
                value={form.address}
                onChange={(e) => updateForm('address', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-zip">PLZ</Label>
                <Input
                  id="edit-zip"
                  placeholder="12345"
                  value={form.zip}
                  onChange={(e) => updateForm('zip', e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-city">Stadt</Label>
                <Input
                  id="edit-city"
                  placeholder="Musterstadt"
                  value={form.city}
                  onChange={(e) => updateForm('city', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Farbthema */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Farbthema
            </h3>
            <p className="text-sm text-muted-foreground">
              Wählen Sie eine Farbe, um diese Firma visuell zu unterscheiden.
            </p>
            <div className="grid grid-cols-6 gap-3">
              {COMPANY_GRADIENTS.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => updateForm('themeIndex', i)}
                  className={cn(
                    'relative h-12 rounded-lg border-2 transition-all duration-200 cursor-pointer',
                    form.themeIndex === i
                      ? 'ring-2 ring-offset-2 ring-offset-background scale-105'
                      : 'hover:scale-105 border-transparent'
                  )}
                  style={{
                    background: g.gradient,
                    borderColor: form.themeIndex === i ? g.accent : 'transparent',
                    // @ts-ignore ring color via CSS variable
                    '--tw-ring-color': g.accent,
                  }}
                >
                  {form.themeIndex === i && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-5 w-5" style={{ color: g.accent }} />
                    </div>
                  )}
                  <span className="sr-only">{g.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {COMPANY_GRADIENTS[form.themeIndex]?.name}
            </p>
          </div>

          {/* Kontenrahmen */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Kontenrahmen
            </h3>
            <RadioGroup
              value={form.chartOfAccounts}
              onValueChange={(v) => updateForm('chartOfAccounts', v)}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="skr03" id="edit-skr03" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="edit-skr03" className="font-medium cursor-pointer">
                    SKR03
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Prozessgliederungsprinzip - Der am häufigsten verwendete Kontenrahmen
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="skr04" id="edit-skr04" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="edit-skr04" className="font-medium cursor-pointer">
                    SKR04
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Abschlussgliederungsprinzip - Orientiert sich am Bilanzaufbau
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
