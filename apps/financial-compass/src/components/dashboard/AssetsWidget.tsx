import { useEffect, useState } from 'react';
import { Wallet, Home, Briefcase, TrendingUp, Shield, Car, ChevronRight } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { type: 'immobilie', label: 'Immobilien', icon: Home },
  { type: 'beteiligung', label: 'Gesellschaften', icon: Briefcase },
  { type: 'asset', label: 'Assets', icon: TrendingUp },
  { type: 'versicherung', label: 'Versicherungen', icon: Shield },
  { type: 'fahrzeug', label: 'Fahrzeuge', icon: Car },
];

export function AssetsWidget() {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();
  const [data, setData] = useState<{ type: string; count: number; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentCompany) return;
    (async () => {
      setLoading(true);
      const { data: assets } = await supabase
        .from('assets')
        .select('type, current_value, purchase_price')
        .eq('company_id', currentCompany.id);
      if (assets) {
        const map = new Map<string, { count: number; value: number }>();
        assets.forEach(a => {
          const cur = map.get(a.type) || { count: 0, value: 0 };
          cur.count++;
          cur.value += Number(a.current_value || a.purchase_price || 0);
          map.set(a.type, cur);
        });
        setData(CATEGORIES.map(c => ({ type: c.type, ...(map.get(c.type) || { count: 0, value: 0 }) })));
      }
      setLoading(false);
    })();
  }, [currentCompany]);

  const totalValue = data.reduce((s, d) => s + d.value, 0);
  const totalCount = data.reduce((s, d) => s + d.count, 0);
  const formatCurrency = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div className="glass rounded-xl p-4 sm:p-5">
      <button
        onClick={() => navigate('/vermoegen')}
        className="w-full text-left group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Vermögen</h3>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <p className="text-2xl font-bold text-primary mb-1">
          {loading ? '...' : formatCurrency(totalValue)}
        </p>
        <p className="text-xs text-muted-foreground mb-3">{totalCount} Vermögenswerte</p>
      </button>

      <div className="space-y-2">
        {CATEGORIES.map(cat => {
          const d = data.find(x => x.type === cat.type);
          if (!d || d.count === 0) return null;
          const Icon = cat.icon;
          return (
            <div key={cat.type} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{d.count}×</span>
                <span className="font-medium">{formatCurrency(d.value)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
