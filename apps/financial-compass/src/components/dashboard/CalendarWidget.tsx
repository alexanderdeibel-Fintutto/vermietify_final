import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface UpcomingItem {
  id: string;
  label: string;
  date: string;
  type: 'invoice' | 'generic';
  link: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function CalendarWidget() {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();
  const [items, setItems] = useState<UpcomingItem[]>([]);

  useEffect(() => {
    if (!currentCompany) return;

    const fetchUpcoming = async () => {
      const today = new Date().toISOString().split('T')[0];
      const in14Days = new Date();
      in14Days.setDate(in14Days.getDate() + 14);
      const endStr = in14Days.toISOString().split('T')[0];

      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, due_date, amount')
        .eq('company_id', currentCompany.id)
        .eq('status', 'sent')
        .gte('due_date', today)
        .lte('due_date', endStr)
        .order('due_date')
        .limit(5);

      const upcoming: UpcomingItem[] = (invoices || []).map((inv) => ({
        id: inv.id,
        label: `${inv.invoice_number} fällig`,
        date: inv.due_date || '',
        type: 'invoice',
        link: '/rechnungen',
      }));

      setItems(upcoming);
    };

    fetchUpcoming();
  }, [currentCompany]);

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Anstehend</h3>
        </div>
        <button
          onClick={() => navigate('/kalender')}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Kalender <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Keine anstehenden Fristen</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const days = daysUntil(item.date);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.link)}
                className="w-full flex items-center justify-between text-left hover:bg-white/5 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
              >
                <div>
                  <p className="text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  days <= 2 ? 'bg-destructive/20 text-destructive' : 'bg-white/10 text-muted-foreground'
                }`}>
                  {days === 0 ? 'Heute' : days === 1 ? 'Morgen' : `${days} Tage`}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
