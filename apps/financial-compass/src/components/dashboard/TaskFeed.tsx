import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileText, Receipt, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface TaskItem {
  icon: React.ElementType;
  label: string;
  count: number;
  amount?: number;
  link: string;
  color: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function TaskFeed() {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    if (!currentCompany) return;

    const fetchTasks = async () => {
      const today = new Date().toISOString().split('T')[0];

      const [overdueInvoices, unassignedReceipts] = await Promise.all([
        supabase
          .from('invoices')
          .select('amount')
          .eq('company_id', currentCompany.id)
          .eq('status', 'sent')
          .lt('due_date', today),
        supabase
          .from('receipts')
          .select('id')
          .eq('company_id', currentCompany.id)
          .is('transaction_id', null),
      ]);

      const items: TaskItem[] = [];

      const overdueData = overdueInvoices.data || [];
      if (overdueData.length > 0) {
        const totalOverdue = overdueData.reduce((s, i) => s + Number(i.amount), 0);
        items.push({
          icon: AlertTriangle,
          label: 'Überfällige Rechnungen',
          count: overdueData.length,
          amount: totalOverdue,
          link: '/rechnungen',
          color: 'text-destructive',
        });
      }

      const receiptsData = unassignedReceipts.data || [];
      if (receiptsData.length > 0) {
        items.push({
          icon: Receipt,
          label: 'Belege ohne Zuordnung',
          count: receiptsData.length,
          link: '/belege',
          color: 'text-orange-400',
        });
      }

      if (items.length === 0) {
        items.push({
          icon: FileText,
          label: 'Alles erledigt!',
          count: 0,
          link: '',
          color: 'text-success',
        });
      }

      setTasks(items);
    };

    fetchTasks();
  }, [currentCompany]);

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Handlungsbedarf</h3>
      </div>

      <div className="space-y-3">
        {tasks.map((task, i) => (
          <button
            key={i}
            disabled={!task.link}
            onClick={() => task.link && navigate(task.link)}
            className="w-full flex items-center gap-3 text-left hover:bg-white/5 rounded-lg px-2 py-2 -mx-2 transition-colors disabled:opacity-100 disabled:cursor-default"
          >
            <task.icon className={`h-4 w-4 shrink-0 ${task.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm">{task.label}</p>
              {task.amount !== undefined && (
                <p className="text-xs text-muted-foreground">{formatCurrency(task.amount)}</p>
              )}
            </div>
            {task.count > 0 && (
              <span className="text-xs font-semibold bg-white/10 rounded-full px-2 py-0.5">{task.count}</span>
            )}
            {task.link && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}
