import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';

export interface RecurringTransaction {
  id: string;
  company_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  day_of_month?: number; // For monthly/yearly
  day_of_week?: number; // For weekly (0-6)
  start_date: string;
  end_date?: string;
  next_execution: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'fintutto_recurring_transactions';

function getStoredRecurringTransactions(): RecurringTransaction[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveRecurringTransactions(transactions: RecurringTransaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function calculateNextExecution(
  frequency: RecurringTransaction['frequency'],
  startDate: string,
  dayOfMonth?: number,
  dayOfWeek?: number
): string {
  const now = new Date();
  const start = new Date(startDate);
  let next = new Date(Math.max(now.getTime(), start.getTime()));

  switch (frequency) {
    case 'daily':
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;
    case 'weekly':
      const targetDay = dayOfWeek ?? next.getDay();
      const daysUntilTarget = (targetDay - next.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntilTarget);
      break;
    case 'monthly':
      const targetDayOfMonth = dayOfMonth ?? next.getDate();
      if (next.getDate() >= targetDayOfMonth) {
        next.setMonth(next.getMonth() + 1);
      }
      next.setDate(Math.min(targetDayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      break;
    case 'quarterly':
      const quarterMonth = Math.floor(next.getMonth() / 3) * 3;
      next.setMonth(quarterMonth + 3);
      next.setDate(dayOfMonth ?? 1);
      break;
    case 'yearly':
      if (next.getMonth() > start.getMonth() ||
          (next.getMonth() === start.getMonth() && next.getDate() >= (dayOfMonth ?? start.getDate()))) {
        next.setFullYear(next.getFullYear() + 1);
      }
      next.setMonth(start.getMonth());
      next.setDate(dayOfMonth ?? start.getDate());
      break;
  }

  return next.toISOString().split('T')[0];
}

export function useRecurringTransactions() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load recurring transactions for current company
  useEffect(() => {
    if (currentCompany) {
      const allTransactions = getStoredRecurringTransactions();
      const companyTransactions = allTransactions.filter(
        (t) => t.company_id === currentCompany.id
      );
      setRecurringTransactions(companyTransactions);
    }
    setLoading(false);
  }, [currentCompany]);

  // Create a new recurring transaction
  const createRecurringTransaction = useCallback(
    async (data: Omit<RecurringTransaction, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'next_execution'>) => {
      if (!currentCompany) return null;

      const nextExecution = calculateNextExecution(
        data.frequency,
        data.start_date,
        data.day_of_month,
        data.day_of_week
      );

      const newTransaction: RecurringTransaction = {
        ...data,
        id: crypto.randomUUID(),
        company_id: currentCompany.id,
        next_execution: nextExecution,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const allTransactions = getStoredRecurringTransactions();
      allTransactions.push(newTransaction);
      saveRecurringTransactions(allTransactions);

      setRecurringTransactions((prev) => [...prev, newTransaction]);

      toast({
        title: 'Erfolg',
        description: 'Wiederkehrende Buchung wurde erstellt.',
      });

      return newTransaction;
    },
    [currentCompany, toast]
  );

  // Update a recurring transaction
  const updateRecurringTransaction = useCallback(
    async (id: string, data: Partial<RecurringTransaction>) => {
      const allTransactions = getStoredRecurringTransactions();
      const index = allTransactions.findIndex((t) => t.id === id);

      if (index === -1) return null;

      const updated = {
        ...allTransactions[index],
        ...data,
        updated_at: new Date().toISOString(),
      };

      // Recalculate next execution if frequency or dates changed
      if (data.frequency || data.start_date || data.day_of_month || data.day_of_week) {
        updated.next_execution = calculateNextExecution(
          updated.frequency,
          updated.start_date,
          updated.day_of_month,
          updated.day_of_week
        );
      }

      allTransactions[index] = updated;
      saveRecurringTransactions(allTransactions);

      setRecurringTransactions((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      );

      toast({
        title: 'Erfolg',
        description: 'Wiederkehrende Buchung wurde aktualisiert.',
      });

      return updated;
    },
    [toast]
  );

  // Delete a recurring transaction
  const deleteRecurringTransaction = useCallback(
    async (id: string) => {
      const allTransactions = getStoredRecurringTransactions();
      const filtered = allTransactions.filter((t) => t.id !== id);
      saveRecurringTransactions(filtered);

      setRecurringTransactions((prev) => prev.filter((t) => t.id !== id));

      toast({
        title: 'Erfolg',
        description: 'Wiederkehrende Buchung wurde gelöscht.',
      });
    },
    [toast]
  );

  // Execute a recurring transaction (create actual transaction)
  const executeRecurringTransaction = useCallback(
    async (recurring: RecurringTransaction) => {
      if (!currentCompany) return null;

      // Create the actual transaction
      const { error, data } = await supabase.from('transactions').insert({
        company_id: currentCompany.id,
        type: recurring.type,
        amount: recurring.amount,
        description: `[Wiederkehrend] ${recurring.description}`,
        category: recurring.category,
        date: new Date().toISOString().split('T')[0],
      }).select().single();

      if (error) {
        toast({
          title: 'Fehler',
          description: 'Buchung konnte nicht ausgeführt werden.',
          variant: 'destructive',
        });
        return null;
      }

      // Update next execution date
      const nextExecution = calculateNextExecution(
        recurring.frequency,
        recurring.next_execution,
        recurring.day_of_month,
        recurring.day_of_week
      );

      await updateRecurringTransaction(recurring.id, { next_execution: nextExecution });

      toast({
        title: 'Erfolg',
        description: `Buchung "${recurring.description}" wurde ausgeführt.`,
      });

      return data;
    },
    [currentCompany, toast, updateRecurringTransaction]
  );

  // Check and execute due recurring transactions
  const checkAndExecuteDueTransactions = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const dueTransactions = recurringTransactions.filter(
      (t) => t.is_active && t.next_execution <= today && (!t.end_date || t.end_date >= today)
    );

    for (const transaction of dueTransactions) {
      await executeRecurringTransaction(transaction);
    }

    return dueTransactions.length;
  }, [recurringTransactions, executeRecurringTransaction]);

  return {
    recurringTransactions,
    loading,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    executeRecurringTransaction,
    checkAndExecuteDueTransactions,
  };
}
