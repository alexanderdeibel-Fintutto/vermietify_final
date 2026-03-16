import { useState, useEffect, useMemo } from 'react';
import { Home, Briefcase, TrendingUp, Shield, Car, Wallet, ChevronRight } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Asset {
  id: string; type: string; current_value: number | null; purchase_price: number | null;
}

const CATEGORIES = [
  { type: 'immobilie', label: 'Immobilien', icon: Home, url: '/vermoegen/immobilien', desc: 'Grundstücke, Häuser, Wohnungen' },
  { type: 'beteiligung', label: 'Gesellschaften', icon: Briefcase, url: '/vermoegen/gesellschaften', desc: 'Firmenbeteiligungen & Anteile' },
  { type: 'asset', label: 'Assets', icon: TrendingUp, url: '/vermoegen/assets', desc: 'Aktien, ETFs, Krypto, Gold' },
  { type: 'versicherung', label: 'Versicherungen', icon: Shield, url: '/vermoegen/versicherungen', desc: 'Alle Versicherungsverträge' },
  { type: 'fahrzeug', label: 'Fahrzeuge', icon: Car, url: '/vermoegen/fahrzeuge', desc: 'Firmen- & Privatfahrzeuge' },
];

export default function Assets() {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (currentCompany) fetchAssets(); }, [currentCompany]);

  const fetchAssets = async () => {
    if (!currentCompany) return;
    setLoading(true);
    const { data } = await supabase.from('assets').select('id, type, current_value, purchase_price')
      .eq('company_id', currentCompany.id).limit(10000);
    if (data) setAssets(data);
    setLoading(false);
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

  const totalValue = useMemo(() => assets.reduce((s, a) => s + (a.current_value || a.purchase_price || 0), 0), [assets]);

  const categoryStats = useMemo(() => CATEGORIES.map(cat => ({
    ...cat,
    count: assets.filter(a => a.type === cat.type).length,
    value: assets.filter(a => a.type === cat.type).reduce((s, a) => s + (a.current_value || a.purchase_price || 0), 0),
  })), [assets]);

  if (!currentCompany) return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Bitte wählen Sie eine Firma aus.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Vermögensübersicht</h1>
        <p className="text-muted-foreground">Alle Vermögenswerte von {currentCompany.name}</p>
      </div>

      <div className="kpi-card">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10"><Wallet className="h-6 w-6 text-primary" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Gesamtvermögen</p>
            <p className="text-3xl font-bold text-primary">{loading ? '...' : formatCurrency(totalValue)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categoryStats.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.type}
              onClick={() => navigate(cat.url)}
              className="glass rounded-xl p-5 text-left hover:bg-secondary/40 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-lg">{cat.label}</h3>
                <p className="text-sm text-muted-foreground">{cat.desc}</p>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <span className="text-2xl font-bold">{cat.count}</span>
                {cat.value > 0 && <span className="text-sm text-primary font-medium">{formatCurrency(cat.value)}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
