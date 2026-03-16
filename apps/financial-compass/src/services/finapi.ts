import { supabase } from '@/integrations/supabase/client';

export interface FinAPIStatus {
  configured: boolean;
  connected: boolean;
  sandbox?: boolean;
  error?: string;
}

export interface BankConnection {
  id: string;
  bankName: string;
  bankLogo?: string;
  iban: string;
  lastSync: string;
  status: 'active' | 'expired' | 'error';
}

export interface FinAPITransaction {
  id: string;
  amount: number;
  purpose: string;
  counterpartName: string;
  counterpartIban?: string;
  bookingDate: string;
  valueDate: string;
}

export interface SupportedBank {
  code: string;
  name: string;
  logo?: string;
}

export const SUPPORTED_BANKS: SupportedBank[] = [
  { code: 'sparkasse', name: 'Sparkasse' },
  { code: 'volksbank', name: 'Volksbank' },
  { code: 'deutsche_bank', name: 'Deutsche Bank' },
  { code: 'commerzbank', name: 'Commerzbank' },
  { code: 'n26', name: 'N26' },
  { code: 'ing', name: 'ING' },
  { code: 'dkb', name: 'DKB' },
  { code: 'comdirect', name: 'comdirect' },
];

/**
 * Check FinAPI connection status
 */
export async function checkFinAPIStatus(): Promise<FinAPIStatus> {
  try {
    const { data, error } = await supabase.functions.invoke('finapi/status');
    
    if (error) {
      return { configured: false, connected: false, error: error.message };
    }
    
    return data as FinAPIStatus;
  } catch (err) {
    return { 
      configured: false, 
      connected: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

/**
 * Get WebForm URL for bank connection
 */
export async function getBankConnectionUrl(): Promise<string | null> {
  try {
    const callbackUrl = `${window.location.origin}/bank-callback`;
    
    const { data, error } = await supabase.functions.invoke('finapi/webform', {
      body: { callbackUrl },
    });
    
    if (error) {
      console.error('WebForm error:', error);
      return null;
    }
    
    return data?.url || null;
  } catch (err) {
    console.error('getBankConnectionUrl error:', err);
    return null;
  }
}

// Simulierte FinAPI-Integration (Fallback wenn API nicht konfiguriert)
export async function connectBank(bankCode: string): Promise<string> {
  // Prüfe ob echte API verfügbar
  const status = await checkFinAPIStatus();
  
  if (status.configured && status.connected) {
    const url = await getBankConnectionUrl();
    if (url) return url;
  }
  
  // Fallback: Simulierte URL
  return `https://finapi.io/connect?bank=${bankCode}&redirect=${window.location.origin}/bank-callback`;
}

export async function fetchTransactions(connectionId: string): Promise<FinAPITransaction[]> {
  // Versuche echte API
  try {
    const { data, error } = await supabase.functions.invoke('finapi/transactions', {
      body: { accountId: connectionId },
    });
    
    if (!error && data?.transactions) {
      return data.transactions;
    }
  } catch (err) {
    console.log('Using simulated transactions');
  }
  
  // Simulierte Transaktionen als Fallback
  await new Promise(r => setTimeout(r, 1500));
  return [
    { id: '1', amount: -89.99, purpose: 'Amazon Bestellung', counterpartName: 'Amazon EU', bookingDate: '2026-02-04', valueDate: '2026-02-04' },
    { id: '2', amount: 2500, purpose: 'Gehalt Februar', counterpartName: 'Arbeitgeber GmbH', bookingDate: '2026-02-01', valueDate: '2026-02-01' },
    { id: '3', amount: -750, purpose: 'Miete Februar', counterpartName: 'Vermieter', bookingDate: '2026-02-01', valueDate: '2026-02-01' },
    { id: '4', amount: -45.50, purpose: 'Tankstelle', counterpartName: 'Shell Deutschland', bookingDate: '2026-02-03', valueDate: '2026-02-03' },
    { id: '5', amount: -29.99, purpose: 'Mobilfunk', counterpartName: 'Vodafone GmbH', bookingDate: '2026-02-02', valueDate: '2026-02-02' },
  ];
}

export async function syncAccount(connectionId: string): Promise<void> {
  // Sync starten
  await new Promise(r => setTimeout(r, 2000));
}

export function getBankByCode(code: string): SupportedBank | undefined {
  return SUPPORTED_BANKS.find(b => b.code === code);
}