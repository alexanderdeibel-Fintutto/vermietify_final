import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export type SepaPaymentType = 'transfer' | 'direct_debit';
export type SepaPaymentStatus = 'draft' | 'pending' | 'exported' | 'executed' | 'failed';

export interface SepaPayment {
  id: string;
  company_id: string;
  type: SepaPaymentType;
  status: SepaPaymentStatus;

  // Creditor/Debitor info
  creditor_name: string;
  creditor_iban: string;
  creditor_bic?: string;

  // Payment details
  amount: number;
  currency: string;
  reference: string; // Verwendungszweck
  end_to_end_id: string;

  // Mandate (for direct debit)
  mandate_id?: string;
  mandate_date?: string;
  sequence_type?: 'FRST' | 'RCUR' | 'OOFF' | 'FNAL';

  // Execution
  execution_date: string;
  batch_id?: string;

  // Linked records
  invoice_id?: string;
  contact_id?: string;

  created_at: string;
  updated_at: string;
}

export interface SepaBatch {
  id: string;
  company_id: string;
  type: SepaPaymentType;
  status: 'open' | 'closed' | 'exported';
  message_id: string;
  payment_count: number;
  total_amount: number;
  execution_date: string;
  created_at: string;
  xml_content?: string;
}

interface SepaConfig {
  creditor_id: string; // Gläubiger-ID for direct debits
  company_name: string;
  iban: string;
  bic: string;
}

const STORAGE_KEY = 'fintutto_sepa_payments';
const BATCH_STORAGE_KEY = 'fintutto_sepa_batches';

export function useSepaPayments() {
  const { currentCompany } = useCompany();
  const [payments, setPayments] = useState<SepaPayment[]>([]);
  const [batches, setBatches] = useState<SepaBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Load payments from localStorage
  useEffect(() => {
    if (!currentCompany) return;

    const stored = localStorage.getItem(`${STORAGE_KEY}_${currentCompany.id}`);
    const storedBatches = localStorage.getItem(`${BATCH_STORAGE_KEY}_${currentCompany.id}`);

    if (stored) {
      try {
        setPayments(JSON.parse(stored));
      } catch {
        setPayments([]);
      }
    } else {
      // Demo payments
      setPayments([
        {
          id: 'sepa-1',
          company_id: currentCompany.id,
          type: 'transfer',
          status: 'draft',
          creditor_name: 'Bürobedarf Schmidt GmbH',
          creditor_iban: 'DE89370400440532013000',
          creditor_bic: 'COBADEFFXXX',
          amount: 450.00,
          currency: 'EUR',
          reference: 'Rechnung 2024-001 Büromaterial',
          end_to_end_id: 'TRF-2024-001',
          execution_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'sepa-2',
          company_id: currentCompany.id,
          type: 'direct_debit',
          status: 'pending',
          creditor_name: 'Kunde Müller AG',
          creditor_iban: 'DE91100000000123456789',
          creditor_bic: 'BEVODEBB',
          amount: 1200.00,
          currency: 'EUR',
          reference: 'Rechnung RE-2024-0012',
          end_to_end_id: 'DD-2024-012',
          mandate_id: 'MNDT-2024-001',
          mandate_date: '2024-01-15',
          sequence_type: 'RCUR',
          execution_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    }

    if (storedBatches) {
      try {
        setBatches(JSON.parse(storedBatches));
      } catch {
        setBatches([]);
      }
    }

    setLoading(false);
  }, [currentCompany]);

  // Save payments to localStorage
  const savePayments = useCallback((newPayments: SepaPayment[]) => {
    if (!currentCompany) return;
    localStorage.setItem(`${STORAGE_KEY}_${currentCompany.id}`, JSON.stringify(newPayments));
    setPayments(newPayments);
  }, [currentCompany]);

  // Save batches to localStorage
  const saveBatches = useCallback((newBatches: SepaBatch[]) => {
    if (!currentCompany) return;
    localStorage.setItem(`${BATCH_STORAGE_KEY}_${currentCompany.id}`, JSON.stringify(newBatches));
    setBatches(newBatches);
  }, [currentCompany]);

  // Create a new payment
  const createPayment = useCallback((payment: Omit<SepaPayment, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => {
    if (!currentCompany) return null;

    const newPayment: SepaPayment = {
      ...payment,
      id: `sepa-${Date.now()}`,
      company_id: currentCompany.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    savePayments([newPayment, ...payments]);
    return newPayment;
  }, [currentCompany, payments, savePayments]);

  // Update payment status
  const updatePaymentStatus = useCallback((paymentId: string, status: SepaPaymentStatus) => {
    const updated = payments.map(p =>
      p.id === paymentId
        ? { ...p, status, updated_at: new Date().toISOString() }
        : p
    );
    savePayments(updated);
  }, [payments, savePayments]);

  // Delete a payment
  const deletePayment = useCallback((paymentId: string) => {
    const filtered = payments.filter(p => p.id !== paymentId);
    savePayments(filtered);
  }, [payments, savePayments]);

  // Generate SEPA XML for a batch of payments
  const generateSepaXml = useCallback((type: SepaPaymentType, paymentIds: string[], config: SepaConfig): string => {
    const selectedPayments = payments.filter(p => paymentIds.includes(p.id));
    const totalAmount = selectedPayments.reduce((sum, p) => sum + p.amount, 0);
    const messageId = `MSG-${Date.now()}`;
    const creationDateTime = new Date().toISOString();

    if (type === 'transfer') {
      // SEPA Credit Transfer (pain.001.003.03)
      return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.003.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${messageId}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>${selectedPayments.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${escapeXml(config.company_name)}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT-${Date.now()}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${selectedPayments.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${selectedPayments[0]?.execution_date || new Date().toISOString().split('T')[0]}</ReqdExctnDt>
      <Dbtr>
        <Nm>${escapeXml(config.company_name)}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${config.iban}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${config.bic}</BIC>
        </FinInstnId>
      </DbtrAgt>
${selectedPayments.map(p => `      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${p.end_to_end_id}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${p.amount.toFixed(2)}</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            ${p.creditor_bic ? `<BIC>${p.creditor_bic}</BIC>` : '<Othr><Id>NOTPROVIDED</Id></Othr>'}
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>${escapeXml(p.creditor_name)}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${p.creditor_iban}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${escapeXml(p.reference)}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`).join('\n')}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
    } else {
      // SEPA Direct Debit (pain.008.003.02)
      return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.003.02" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${messageId}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>${selectedPayments.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${escapeXml(config.company_name)}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT-${Date.now()}</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>${selectedPayments.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>CORE</Cd>
        </LclInstrm>
        <SeqTp>${selectedPayments[0]?.sequence_type || 'OOFF'}</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>${selectedPayments[0]?.execution_date || new Date().toISOString().split('T')[0]}</ReqdColltnDt>
      <Cdtr>
        <Nm>${escapeXml(config.company_name)}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${config.iban}</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId>
          <BIC>${config.bic}</BIC>
        </FinInstnId>
      </CdtrAgt>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${config.creditor_id}</Id>
              <SchmeNm>
                <Prtry>SEPA</Prtry>
              </SchmeNm>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>
${selectedPayments.map(p => `      <DrctDbtTxInf>
        <PmtId>
          <EndToEndId>${p.end_to_end_id}</EndToEndId>
        </PmtId>
        <InstdAmt Ccy="EUR">${p.amount.toFixed(2)}</InstdAmt>
        <DrctDbtTx>
          <MndtRltdInf>
            <MndtId>${p.mandate_id || 'NOTPROVIDED'}</MndtId>
            <DtOfSgntr>${p.mandate_date || new Date().toISOString().split('T')[0]}</DtOfSgntr>
          </MndtRltdInf>
        </DrctDbtTx>
        <DbtrAgt>
          <FinInstnId>
            ${p.creditor_bic ? `<BIC>${p.creditor_bic}</BIC>` : '<Othr><Id>NOTPROVIDED</Id></Othr>'}
          </FinInstnId>
        </DbtrAgt>
        <Dbtr>
          <Nm>${escapeXml(p.creditor_name)}</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>${p.creditor_iban}</IBAN>
          </Id>
        </DbtrAcct>
        <RmtInf>
          <Ustrd>${escapeXml(p.reference)}</Ustrd>
        </RmtInf>
      </DrctDbtTxInf>`).join('\n')}
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`;
    }
  }, [payments]);

  // Create batch and export
  const createBatchAndExport = useCallback((type: SepaPaymentType, paymentIds: string[], config: SepaConfig) => {
    if (!currentCompany) return null;

    const selectedPayments = payments.filter(p => paymentIds.includes(p.id));
    const totalAmount = selectedPayments.reduce((sum, p) => sum + p.amount, 0);
    const xml = generateSepaXml(type, paymentIds, config);

    const batch: SepaBatch = {
      id: `batch-${Date.now()}`,
      company_id: currentCompany.id,
      type,
      status: 'exported',
      message_id: `MSG-${Date.now()}`,
      payment_count: selectedPayments.length,
      total_amount: totalAmount,
      execution_date: selectedPayments[0]?.execution_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      xml_content: xml,
    };

    // Update payments to exported status
    const updatedPayments = payments.map(p =>
      paymentIds.includes(p.id)
        ? { ...p, status: 'exported' as SepaPaymentStatus, batch_id: batch.id, updated_at: new Date().toISOString() }
        : p
    );

    savePayments(updatedPayments);
    saveBatches([batch, ...batches]);

    return { batch, xml };
  }, [currentCompany, payments, batches, generateSepaXml, savePayments, saveBatches]);

  // Validate IBAN
  const validateIban = useCallback((iban: string): boolean => {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();

    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(cleanIban)) {
      return false;
    }

    // Move first 4 chars to end
    const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);

    // Convert letters to numbers (A=10, B=11, etc.)
    let numericString = '';
    for (const char of rearranged) {
      if (/[A-Z]/.test(char)) {
        numericString += (char.charCodeAt(0) - 55).toString();
      } else {
        numericString += char;
      }
    }

    // Mod 97 check
    let remainder = 0;
    for (const digit of numericString) {
      remainder = (remainder * 10 + parseInt(digit)) % 97;
    }

    return remainder === 1;
  }, []);

  // Get pending payments
  const getPendingPayments = useCallback((type?: SepaPaymentType) => {
    return payments.filter(p =>
      (p.status === 'draft' || p.status === 'pending') &&
      (!type || p.type === type)
    );
  }, [payments]);

  // Get statistics
  const getStats = useCallback(() => {
    const transfers = payments.filter(p => p.type === 'transfer');
    const directDebits = payments.filter(p => p.type === 'direct_debit');

    return {
      totalTransfers: transfers.length,
      pendingTransferAmount: transfers
        .filter(p => p.status === 'draft' || p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0),
      totalDirectDebits: directDebits.length,
      pendingDirectDebitAmount: directDebits
        .filter(p => p.status === 'draft' || p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0),
      exportedBatches: batches.length,
    };
  }, [payments, batches]);

  return {
    payments,
    batches,
    loading,
    createPayment,
    updatePaymentStatus,
    deletePayment,
    generateSepaXml,
    createBatchAndExport,
    validateIban,
    getPendingPayments,
    getStats,
  };
}

// Helper to escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
