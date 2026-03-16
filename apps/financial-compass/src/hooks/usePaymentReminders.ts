import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentReminder {
  id: string;
  invoice_id: string;
  invoice_number: string;
  contact_name: string;
  contact_email: string | null;
  amount: number;
  due_date: string;
  days_overdue: number;
  reminder_level: 0 | 1 | 2 | 3; // 0 = not sent, 1 = 1st reminder, 2 = 2nd, 3 = final
  last_reminder_sent: string | null;
  status: 'pending' | 'sent' | 'paid' | 'cancelled';
}

const REMINDER_STORAGE_KEY = 'fintutto_reminder_history';

interface ReminderHistory {
  invoice_id: string;
  reminder_level: number;
  sent_at: string;
}

function getReminderHistory(): ReminderHistory[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveReminderHistory(history: ReminderHistory[]) {
  localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(history));
}

export function usePaymentReminders() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompany) {
      fetchOverdueInvoices();
    }
  }, [currentCompany]);

  const fetchOverdueInvoices = async () => {
    if (!currentCompany) return;
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];

    // Fetch invoices that are unpaid and due or overdue
    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        amount,
        due_date,
        status,
        contact_id,
        contacts (
          name,
          email
        )
      `)
      .eq('company_id', currentCompany.id)
      .eq('type', 'outgoing')
      .in('status', ['sent', 'overdue'])
      .lte('due_date', today);

    const history = getReminderHistory();

    const overdueReminders: PaymentReminder[] = (invoices || []).map((invoice: any) => {
      const dueDate = new Date(invoice.due_date);
      const todayDate = new Date();
      const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const invoiceHistory = history.filter((h) => h.invoice_id === invoice.id);
      const lastReminder = invoiceHistory.length > 0
        ? invoiceHistory.reduce((latest, h) => h.reminder_level > latest.reminder_level ? h : latest)
        : null;

      return {
        id: invoice.id,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        contact_name: invoice.contacts?.name || 'Unbekannt',
        contact_email: invoice.contacts?.email || null,
        amount: invoice.amount,
        due_date: invoice.due_date,
        days_overdue: Math.max(0, daysOverdue),
        reminder_level: (lastReminder?.reminder_level || 0) as 0 | 1 | 2 | 3,
        last_reminder_sent: lastReminder?.sent_at || null,
        status: invoice.status === 'paid' ? 'paid' : daysOverdue > 0 ? 'pending' : 'sent',
      };
    });

    // Sort by days overdue descending
    overdueReminders.sort((a, b) => b.days_overdue - a.days_overdue);

    setReminders(overdueReminders);
    setLoading(false);
  };

  const sendReminder = useCallback(
    async (reminderId: string, level: 1 | 2 | 3) => {
      const reminder = reminders.find((r) => r.id === reminderId);
      if (!reminder) return false;

      // In a real app, this would send an email
      // For now, we'll simulate it and store the history

      const history = getReminderHistory();
      history.push({
        invoice_id: reminder.invoice_id,
        reminder_level: level,
        sent_at: new Date().toISOString(),
      });
      saveReminderHistory(history);

      // Update invoice status to overdue if not already
      if (reminder.days_overdue > 0) {
        await supabase
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('id', reminder.invoice_id);
      }

      setReminders((prev) =>
        prev.map((r) =>
          r.id === reminderId
            ? {
                ...r,
                reminder_level: level,
                last_reminder_sent: new Date().toISOString(),
                status: 'sent',
              }
            : r
        )
      );

      const reminderLabels = {
        1: 'Erste Zahlungserinnerung',
        2: 'Zweite Mahnung',
        3: 'Letzte Mahnung',
      };

      toast({
        title: 'Mahnung gesendet',
        description: `${reminderLabels[level]} für Rechnung ${reminder.invoice_number} wurde versendet.`,
      });

      return true;
    },
    [reminders, toast]
  );

  const markAsPaid = useCallback(
    async (reminderId: string) => {
      const reminder = reminders.find((r) => r.id === reminderId);
      if (!reminder) return false;

      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', reminder.invoice_id);

      setReminders((prev) => prev.filter((r) => r.id !== reminderId));

      toast({
        title: 'Zahlung erfasst',
        description: `Rechnung ${reminder.invoice_number} wurde als bezahlt markiert.`,
      });

      return true;
    },
    [reminders, toast]
  );

  const cancelReminder = useCallback(
    async (reminderId: string) => {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === reminderId
            ? { ...r, status: 'cancelled' as const }
            : r
        )
      );

      toast({
        title: 'Mahnung storniert',
        description: 'Die Mahnung wurde storniert.',
      });
    },
    [toast]
  );

  const getRecommendedAction = (reminder: PaymentReminder): { level: 1 | 2 | 3; label: string } | null => {
    const { days_overdue, reminder_level } = reminder;

    if (days_overdue >= 1 && days_overdue < 14 && reminder_level === 0) {
      return { level: 1, label: '1. Zahlungserinnerung' };
    }
    if (days_overdue >= 14 && days_overdue < 28 && reminder_level < 2) {
      return { level: 2, label: '2. Mahnung' };
    }
    if (days_overdue >= 28 && reminder_level < 3) {
      return { level: 3, label: 'Letzte Mahnung' };
    }
    return null;
  };

  // Statistics
  const stats = {
    totalOverdue: reminders.length,
    totalAmount: reminders.reduce((sum, r) => sum + r.amount, 0),
    criticalCount: reminders.filter((r) => r.days_overdue > 30).length,
    pendingReminders: reminders.filter((r) => {
      const recommended = getRecommendedAction(r);
      return recommended !== null;
    }).length,
  };

  return {
    reminders,
    loading,
    sendReminder,
    markAsPaid,
    cancelReminder,
    getRecommendedAction,
    stats,
    refresh: fetchOverdueInvoices,
  };
}
