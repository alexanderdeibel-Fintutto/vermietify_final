import { useEffect, useState } from 'react';
import { Landmark, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface BankAccount {
  id: string;
  name: string;
  iban: string | null;
  balance: number | null;
  currency: string | null;
}

function formatIban(iban: string | null): string {
  if (!iban) return '–';
  return `••• ${iban.slice(-4)}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function BankAccountsWidget() {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    if (!currentCompany) return;
    supabase
      .from('bank_accounts')
      .select('id, name, iban, balance, currency')
      .eq('company_id', currentCompany.id)
      .order('name')
      .then(({ data }) => setAccounts(data || []));
  }, [currentCompany]);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Bankkonten</h3>
        </div>
        <button
          onClick={() => navigate('/bankkonten')}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Alle <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-xs text-muted-foreground">Keine Konten vorhanden</p>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => navigate(`/buchungen?konto=${acc.id}`)}
              className="w-full flex items-center justify-between text-left hover:bg-white/5 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{acc.name}</p>
                <p className="text-xs text-muted-foreground">{formatIban(acc.iban)}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(acc.balance ?? 0)}</p>
            </button>
          ))}
          <div className="border-t border-white/10 pt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Gesamt</p>
            <p className="text-sm font-bold tabular-nums">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
