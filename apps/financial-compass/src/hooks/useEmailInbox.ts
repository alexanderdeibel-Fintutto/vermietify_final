import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

export interface EmailInbox {
  id: string;
  company_id: string;
  inbox_address: string;
  allowed_senders: string[];
  is_active: boolean;
  created_at: string;
}

export interface EmailReceipt {
  id: string;
  company_id: string;
  inbox_id: string;
  sender_email: string;
  subject: string | null;
  received_at: string;
  status: 'pending' | 'processed' | 'question' | 'error' | 'booked';
  file_name: string | null;
  file_url: string | null;
  vendor: string | null;
  amount: number | null;
  tax_amount: number | null;
  date: string | null;
  category: string | null;
  description: string | null;
  confidence: number | null;
  question_text: string | null;
  receipt_id: string | null;
  transaction_id: string | null;
  created_at: string;
}

function generateInboxAddress(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `belege-${id}@eingang.vermietify.de`;
}

export function useEmailInbox() {
  const { currentCompany } = useCompany();
  const [inbox, setInbox] = useState<EmailInbox | null>(null);
  const [emailReceipts, setEmailReceipts] = useState<EmailReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptsLoading, setReceiptsLoading] = useState(true);

  const fetchInbox = useCallback(async () => {
    if (!currentCompany) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('email_inboxes')
      .select('*')
      .eq('company_id', currentCompany.id)
      .maybeSingle();

    if (!error && data) {
      setInbox(data as unknown as EmailInbox);
    } else {
      setInbox(null);
    }
    setLoading(false);
  }, [currentCompany]);

  const fetchEmailReceipts = useCallback(async () => {
    if (!currentCompany) return;
    setReceiptsLoading(true);

    const { data, error } = await supabase
      .from('email_receipts')
      .select('*')
      .eq('company_id', currentCompany.id)
      .order('received_at', { ascending: false });

    if (!error && data) {
      setEmailReceipts(data as unknown as EmailReceipt[]);
    }
    setReceiptsLoading(false);
  }, [currentCompany]);

  useEffect(() => {
    fetchInbox();
    fetchEmailReceipts();
  }, [fetchInbox, fetchEmailReceipts]);

  const createInbox = async () => {
    if (!currentCompany) return;

    const address = generateInboxAddress();
    const { data, error } = await supabase
      .from('email_inboxes')
      .insert({
        company_id: currentCompany.id,
        inbox_address: address,
        allowed_senders: [],
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast.error('Fehler beim Erstellen der E-Mail-Adresse');
      console.error(error);
    } else {
      setInbox(data as unknown as EmailInbox);
      toast.success('E-Mail-Adresse wurde generiert');
    }
  };

  const addAllowedSender = async (email: string) => {
    if (!inbox) return;

    const updatedSenders = [...(inbox.allowed_senders || []), email.toLowerCase()];
    const { error } = await supabase
      .from('email_inboxes')
      .update({ allowed_senders: updatedSenders })
      .eq('id', inbox.id);

    if (error) {
      toast.error('Fehler beim Hinzufügen des Absenders');
    } else {
      setInbox({ ...inbox, allowed_senders: updatedSenders });
      toast.success(`${email} als erlaubter Absender hinzugefügt`);
    }
  };

  const removeAllowedSender = async (email: string) => {
    if (!inbox) return;

    const updatedSenders = inbox.allowed_senders.filter(
      (s) => s.toLowerCase() !== email.toLowerCase()
    );
    const { error } = await supabase
      .from('email_inboxes')
      .update({ allowed_senders: updatedSenders })
      .eq('id', inbox.id);

    if (error) {
      toast.error('Fehler beim Entfernen des Absenders');
    } else {
      setInbox({ ...inbox, allowed_senders: updatedSenders });
      toast.success(`${email} entfernt`);
    }
  };

  const toggleInboxActive = async () => {
    if (!inbox) return;

    const newActive = !inbox.is_active;
    const { error } = await supabase
      .from('email_inboxes')
      .update({ is_active: newActive })
      .eq('id', inbox.id);

    if (error) {
      toast.error('Fehler beim Aktualisieren');
    } else {
      setInbox({ ...inbox, is_active: newActive });
      toast.success(newActive ? 'E-Mail-Empfang aktiviert' : 'E-Mail-Empfang deaktiviert');
    }
  };

  const bookEmailReceipt = async (receiptId: string) => {
    const emailReceipt = emailReceipts.find((r) => r.id === receiptId);
    if (!emailReceipt || !currentCompany) return;

    try {
      // Create transaction
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          company_id: currentCompany.id,
          type: 'expense',
          amount: emailReceipt.amount || 0,
          date: emailReceipt.date || new Date().toISOString().split('T')[0],
          description: `${emailReceipt.vendor || 'Unbekannt'} - ${emailReceipt.category || 'Sonstiges'}`,
          category: emailReceipt.category || 'Sonstiges',
        })
        .select('id')
        .single();

      if (txError) throw txError;

      // Create receipt
      const { data: rcptData, error: rcptError } = await supabase
        .from('receipts')
        .insert({
          company_id: currentCompany.id,
          file_name: emailReceipt.file_name || 'email-beleg.pdf',
          file_type: 'application/pdf',
          amount: emailReceipt.amount,
          date: emailReceipt.date || new Date().toISOString().split('T')[0],
          description: `${emailReceipt.vendor || ''} - ${emailReceipt.description || ''}`,
          transaction_id: txData.id,
        })
        .select('id')
        .single();

      if (rcptError) throw rcptError;

      // Update email receipt status
      await supabase
        .from('email_receipts')
        .update({
          status: 'booked',
          transaction_id: txData.id,
          receipt_id: rcptData.id,
        })
        .eq('id', receiptId);

      setEmailReceipts((prev) =>
        prev.map((r) =>
          r.id === receiptId
            ? { ...r, status: 'booked' as const, transaction_id: txData.id, receipt_id: rcptData.id }
            : r
        )
      );

      toast.success('Beleg erfolgreich gebucht');
    } catch (error) {
      console.error('Error booking email receipt:', error);
      toast.error('Fehler beim Buchen des Belegs');
    }
  };

  const resolveQuestion = async (receiptId: string, updates: Partial<EmailReceipt>) => {
    const { error } = await supabase
      .from('email_receipts')
      .update({
        ...updates,
        status: 'processed',
        question_text: null,
      })
      .eq('id', receiptId);

    if (error) {
      toast.error('Fehler beim Aktualisieren');
    } else {
      setEmailReceipts((prev) =>
        prev.map((r) =>
          r.id === receiptId ? { ...r, ...updates, status: 'processed' as const, question_text: null } : r
        )
      );
      toast.success('Frage beantwortet – Beleg bereit zur Buchung');
    }
  };

  const deleteEmailReceipt = async (receiptId: string) => {
    const { error } = await supabase
      .from('email_receipts')
      .delete()
      .eq('id', receiptId);

    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      setEmailReceipts((prev) => prev.filter((r) => r.id !== receiptId));
      toast.success('Eintrag gelöscht');
    }
  };

  return {
    inbox,
    emailReceipts,
    loading,
    receiptsLoading,
    createInbox,
    addAllowedSender,
    removeAllowedSender,
    toggleInboxActive,
    bookEmailReceipt,
    resolveQuestion,
    deleteEmailReceipt,
    refetch: () => {
      fetchInbox();
      fetchEmailReceipts();
    },
  };
}
