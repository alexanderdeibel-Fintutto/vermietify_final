import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess: () => void;
}

export function AddBankAccountDialog({ open, onOpenChange, companyId, onSuccess }: AddBankAccountDialogProps) {
  const [name, setName] = useState('');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setName('');
    setIban('');
    setBic('');
    setBalance('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const { error } = await supabase.from('bank_accounts').insert({
      company_id: companyId,
      name: name.trim(),
      iban: iban.trim() || null,
      bic: bic.trim() || null,
      balance: balance ? parseFloat(balance.replace(',', '.')) : 0,
    });

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Das Bankkonto konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bankkonto erstellt',
        description: `"${name}" wurde erfolgreich hinzugefügt.`,
      });
      resetForm();
      onOpenChange(false);
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neues Bankkonto hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Kontobezeichnung *</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Geschäftskonto Sparkasse"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-iban">IBAN</Label>
            <Input
              id="account-iban"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="DE89 3704 0044 0532 0130 00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-bic">BIC</Label>
            <Input
              id="account-bic"
              value={bic}
              onChange={(e) => setBic(e.target.value)}
              placeholder="COBADEFFXXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-balance">Anfangssaldo (€)</Label>
            <Input
              id="account-balance"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0,00"
              type="text"
              inputMode="decimal"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Speichern...' : 'Konto erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
