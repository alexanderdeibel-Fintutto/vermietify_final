import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReceiptAnalysisResult {
  vendor: string;
  date: string;
  grossAmount: number;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  category: string;
  confidence: number;
  suggestedAccount: string;
  lineItems?: { description: string; amount: number }[];
  rawText?: string;
  fallback?: boolean;
  error?: string;
}

export function useAIAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeReceipt = async (file: File): Promise<ReceiptAnalysisResult> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);
      const mediaType = file.type || 'image/jpeg';

      // Call Edge Function for analysis
      const { data, error: fnError } = await supabase.functions.invoke('analyze-receipt', {
        body: { image: base64, mediaType },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Analyse fehlgeschlagen');
      }

      if (data.fallback) {
        setError('KI-Analyse nicht verfügbar, Demo-Daten werden verwendet');
        return getDemoResult(file.name);
      }

      return data as ReceiptAnalysisResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(message);
      console.error('Receipt analysis error:', err);
      // Return demo data as fallback
      return getDemoResult(file.name);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeReceipt, isAnalyzing, error };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function getDemoResult(filename: string): ReceiptAnalysisResult {
  // Generate realistic demo data based on filename patterns
  const fileName = filename.toLowerCase();
  let vendor = 'Demo Lieferant GmbH';
  let category = 'Sonstiges';
  let suggestedAccount = '4900 - Sonstige Aufwendungen';
  let grossAmount = Math.round((50 + Math.random() * 200) * 100) / 100;

  if (fileName.includes('amazon')) {
    vendor = 'Amazon EU S.à r.l.';
    category = 'Bürobedarf';
    suggestedAccount = '4930 - Bürobedarf';
  } else if (fileName.includes('rewe') || fileName.includes('edeka') || fileName.includes('lidl')) {
    vendor = fileName.includes('rewe') ? 'REWE' : fileName.includes('edeka') ? 'EDEKA' : 'Lidl';
    category = 'Bewirtung';
    suggestedAccount = '4650 - Bewirtungskosten';
    grossAmount = Math.round((30 + Math.random() * 100) * 100) / 100;
  } else if (fileName.includes('shell') || fileName.includes('aral') || fileName.includes('tank')) {
    vendor = fileName.includes('shell') ? 'Shell Deutschland' : fileName.includes('aral') ? 'Aral AG' : 'Tankstelle';
    category = 'Fahrzeugkosten';
    suggestedAccount = '4530 - Kfz-Kosten';
  } else if (fileName.includes('telekom') || fileName.includes('vodafone')) {
    vendor = fileName.includes('telekom') ? 'Deutsche Telekom' : 'Vodafone GmbH';
    category = 'Kommunikation';
    suggestedAccount = '4920 - Telefon';
  } else if (fileName.includes('hotel')) {
    vendor = 'Best Western Hotel';
    category = 'Reisekosten';
    suggestedAccount = '4660 - Reisekosten Arbeitnehmer';
    grossAmount = Math.round((150 + Math.random() * 200) * 100) / 100;
  }

  const vatRate = category === 'Bewirtung' ? 7 : 19;
  const netAmount = Math.round((grossAmount / (1 + vatRate / 100)) * 100) / 100;
  const vatAmount = Math.round((grossAmount - netAmount) * 100) / 100;

  return {
    vendor,
    date: new Date().toISOString().split('T')[0],
    grossAmount,
    netAmount,
    vatRate,
    vatAmount,
    category,
    suggestedAccount,
    confidence: 0.75,
    lineItems: [
      { description: 'Artikel 1', amount: netAmount * 0.6 },
      { description: 'Artikel 2', amount: netAmount * 0.4 },
    ],
    fallback: true,
  };
}
