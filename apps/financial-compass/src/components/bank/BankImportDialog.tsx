 import { useState, useCallback, useEffect } from 'react';
 import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Link2, Copy, SquareCheck, Square } from 'lucide-react';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { Checkbox } from '@/components/ui/checkbox';
 import { Badge } from '@/components/ui/badge';
 import { supabase } from '@/integrations/supabase/client';
 import { useCompany } from '@/contexts/CompanyContext';
 import { useToast } from '@/hooks/use-toast';
  import {
    BankTransaction,
    BankFormat,
    BANK_FORMATS,
    parseCSV,
    parseMT940,
    parseCAMT053,
    detectFileFormat,
    detectBankFormat,
  } from '@/services/bankImport';
 
 interface BankAccount {
   id: string;
   name: string;
   iban: string | null;
 }
 
 interface OpenInvoice {
   id: string;
   invoice_number: string;
   amount: number;
   status: string;
 }
 
 interface EnhancedTransaction extends BankTransaction {
   id: string;
   isDuplicate: boolean;
   selected: boolean;
   matchingInvoice?: OpenInvoice;
 }
 
 interface ImportStats {
   imported: number;
   duplicatesSkipped: number;
   linkedToInvoices: number;
 }
 
 interface BankImportDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   accounts: BankAccount[];
   onSuccess: () => void;
 }
 
 export function BankImportDialog({ open, onOpenChange, accounts, onSuccess }: BankImportDialogProps) {
   const { currentCompany } = useCompany();
   const { toast } = useToast();
 
   const [selectedAccountId, setSelectedAccountId] = useState<string>('');
   const [bankFormat, setBankFormat] = useState<BankFormat>('general');
  const [files, setFiles] = useState<File[]>([]);
  const [enhancedTransactions, setEnhancedTransactions] = useState<EnhancedTransaction[]>([]);
   const [existingTransactions, setExistingTransactions] = useState<{ date: string; amount: number }[]>([]);
   const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
   const [importing, setImporting] = useState(false);
   const [parseError, setParseError] = useState<string | null>(null);
   const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
   const [importStats, setImportStats] = useState<ImportStats | null>(null);
 
   useEffect(() => {
     if (open && currentCompany) {
       fetchExistingData();
     }
   }, [open, currentCompany]);
 
   const fetchExistingData = async () => {
     if (!currentCompany) return;
 
      const { data: transactions } = await supabase
        .from('transactions')
        .select('date, amount')
        .eq('company_id', currentCompany.id)
        .order('date', { ascending: false })
        .limit(10000);
 
     if (transactions) {
       setExistingTransactions(transactions.map(t => ({
         date: t.date,
         amount: Number(t.amount)
       })));
     }
 
     const { data: invoices } = await supabase
       .from('invoices')
       .select('id, invoice_number, amount, status')
       .eq('company_id', currentCompany.id)
       .in('status', ['sent', 'draft'])
       .order('issue_date', { ascending: false });
 
     if (invoices) {
       setOpenInvoices(invoices.map(i => ({
         ...i,
         amount: Number(i.amount)
       })));
     }
   };
 
   const checkDuplicate = useCallback((tx: BankTransaction): boolean => {
     return existingTransactions.some(
       existing => existing.date === tx.date && Math.abs(existing.amount - Math.abs(tx.amount)) < 0.01
     );
   }, [existingTransactions]);
 
   const findMatchingInvoice = useCallback((tx: BankTransaction): OpenInvoice | undefined => {
     if (tx.amount <= 0) return undefined;
    
    // First check: Exact amount match (±0.01€)
    const amountMatch = openInvoices.find(inv => Math.abs(inv.amount - tx.amount) < 0.01);
    if (amountMatch) return amountMatch;
    
    // Second check: Reference/description contains invoice number
    const searchText = `${tx.description || ''} ${tx.reference || ''}`.toLowerCase();
    const referenceMatch = openInvoices.find(inv => 
      searchText.includes(inv.invoice_number.toLowerCase())
    );
    if (referenceMatch) return referenceMatch;
    
    return undefined;
   }, [openInvoices]);
 
    const processTransactions = useCallback((transactions: BankTransaction[]) => {
      if (transactions.length === 0) {
        setParseError('Keine Transaktionen gefunden. Bitte überprüfen Sie das Dateiformat.');
        return;
      }

      const enhanced = transactions.map((tx, index) => {
        const isDuplicate = checkDuplicate(tx);
        return {
          ...tx,
          id: `tx-${index}-${Date.now()}`,
          isDuplicate,
          selected: !isDuplicate,
          matchingInvoice: findMatchingInvoice(tx),
        };
      });
      setEnhancedTransactions(enhanced);
      setStep('preview');
    }, [checkDuplicate, findMatchingInvoice]);

    const parseSingleFile = useCallback(async (selectedFile: File): Promise<BankTransaction[]> => {
      if (selectedFile.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        const { data, error } = await supabase.functions.invoke('parse-bank-pdf', {
          body: { pdfBase64: base64, filename: selectedFile.name },
        });

        if (error) {
          console.error('PDF parse error:', error);
          throw new Error(`PDF "${selectedFile.name}" konnte nicht analysiert werden.`);
        }

        return data.transactions || [];
      }

      const content = await selectedFile.text();
      const fileFormat = detectFileFormat(content, selectedFile.name);

      if (fileFormat === 'mt940') return parseMT940(content);
      if (fileFormat === 'camt053') return parseCAMT053(content);

      const detectedFormat = detectBankFormat(content);
      const effectiveFormat = detectedFormat || bankFormat;

      if (detectedFormat && detectedFormat !== bankFormat) {
        setBankFormat(detectedFormat);
        const formatLabel = BANK_FORMATS.find(f => f.value === detectedFormat)?.label || detectedFormat;
        toast({ title: 'Format erkannt', description: `${formatLabel}-Format wurde automatisch erkannt.` });
      }

      return parseCSV(content, effectiveFormat);
    }, [bankFormat, toast]);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length === 0) return;

      setFiles(selectedFiles);
      setParseError(null);
      setImporting(true);

      try {
        const allTransactions: BankTransaction[] = [];
        for (const f of selectedFiles) {
          const txs = await parseSingleFile(f);
          allTransactions.push(...txs);
        }
        processTransactions(allTransactions);
      } catch (error: any) {
        console.error('Parse error:', error);
        setParseError(error?.message || 'Fehler beim Lesen der Dateien.');
      } finally {
        setImporting(false);
      }
    }, [parseSingleFile, processTransactions]);
 
   const toggleSelection = (id: string) => {
     setEnhancedTransactions(prev =>
       prev.map(tx => tx.id === id ? { ...tx, selected: !tx.selected } : tx)
     );
   };
 
   const selectAll = () => {
     setEnhancedTransactions(prev =>
       prev.map(tx => ({ ...tx, selected: !tx.isDuplicate }))
     );
   };
 
   const selectNone = () => {
     setEnhancedTransactions(prev =>
       prev.map(tx => ({ ...tx, selected: false }))
     );
   };
 
   const linkToInvoice = (txId: string, invoiceId: string | null) => {
     setEnhancedTransactions(prev =>
       prev.map(tx => {
         if (tx.id === txId) {
           return {
             ...tx,
             matchingInvoice: invoiceId 
               ? openInvoices.find(inv => inv.id === invoiceId)
               : undefined
           };
         }
         return tx;
       })
     );
    };

    const recalculateAccountBalance = async (accountId: string) => {
      if (!currentCompany) return;
      
      // Sum all transactions for this bank account
      const { data: txData } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('company_id', currentCompany.id)
        .eq('bank_account_id', accountId);
      
      if (txData) {
        const balance = txData.reduce((sum, tx) => {
          return sum + (tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount));
        }, 0);
        
        await supabase
          .from('bank_accounts')
          .update({ balance })
          .eq('id', accountId);
      }
    };
  
    const handleImport = async () => {
     const selectedTransactions = enhancedTransactions.filter(tx => tx.selected);
     
     if (!currentCompany || !selectedAccountId || selectedTransactions.length === 0) {
       toast({
         title: 'Fehler',
         description: 'Bitte wählen Sie mindestens eine Transaktion zum Importieren aus.',
         variant: 'destructive',
       });
       return;
     }
 
     setImporting(true);
     let imported = 0;
     let linkedToInvoices = 0;
     
     try {
       for (const tx of selectedTransactions) {
         const { error } = await supabase.from('transactions').insert({
           company_id: currentCompany.id,
           bank_account_id: selectedAccountId,
           date: tx.date || new Date().toISOString().split('T')[0],
           type: tx.amount >= 0 ? 'income' : 'expense',
           amount: Math.abs(tx.amount),
           description: tx.description || tx.counterpartName || 'Importierte Buchung',
           category: tx.category || 'Bank-Import',
         });
 
         if (error) {
           console.error('Insert error:', error);
           continue;
         }
         imported++;
 
         if (tx.matchingInvoice) {
           await supabase
             .from('invoices')
             .update({ status: 'paid' })
             .eq('id', tx.matchingInvoice.id);
           linkedToInvoices++;
         }
        }

        // Recalculate and update bank account balance from all linked transactions
        await recalculateAccountBalance(selectedAccountId);
  
        const duplicatesSkipped = enhancedTransactions.filter(tx => tx.isDuplicate && !tx.selected).length;
        
        setImportStats({
          imported,
          duplicatesSkipped,
          linkedToInvoices,
        });
        setStep('complete');
        onSuccess();
     } catch (error) {
       console.error('Import error:', error);
       toast({
         title: 'Fehler',
         description: 'Transaktionen konnten nicht importiert werden.',
         variant: 'destructive',
       });
     } finally {
       setImporting(false);
     }
   };
 
   const resetForm = () => {
     setSelectedAccountId('');
     setBankFormat('general');
    setFiles([]);
    setEnhancedTransactions([]);
    setParseError(null);
     setStep('upload');
     setImportStats(null);
   };
 
   const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat('de-DE', {
       style: 'currency',
       currency: 'EUR',
     }).format(amount);
   };
 
   const selectedCount = enhancedTransactions.filter(tx => tx.selected).length;
   const duplicateCount = enhancedTransactions.filter(tx => tx.isDuplicate).length;
   const matchedCount = enhancedTransactions.filter(tx => tx.matchingInvoice).length;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Kontoauszug importieren</DialogTitle>
         </DialogHeader>
 
         {step === 'complete' && importStats ? (
           <div className="space-y-6 py-8">
             <div className="text-center">
               <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-success" />
               <h3 className="text-2xl font-bold mb-2">Import abgeschlossen</h3>
             </div>
             
             <div className="grid grid-cols-3 gap-4">
               <div className="glass rounded-lg p-4 text-center">
                 <p className="text-sm text-muted-foreground">Importiert</p>
                 <p className="text-3xl font-bold text-success">{importStats.imported}</p>
                 <p className="text-xs text-muted-foreground">neue Transaktionen</p>
               </div>
               <div className="glass rounded-lg p-4 text-center">
                 <p className="text-sm text-muted-foreground">Übersprungen</p>
                 <p className="text-3xl font-bold text-muted-foreground">{importStats.duplicatesSkipped}</p>
                 <p className="text-xs text-muted-foreground">Duplikate</p>
               </div>
               <div className="glass rounded-lg p-4 text-center">
                 <p className="text-sm text-muted-foreground">Verknüpft</p>
                 <p className="text-3xl font-bold text-info">{importStats.linkedToInvoices}</p>
                 <p className="text-xs text-muted-foreground">Rechnungen bezahlt</p>
               </div>
             </div>
           </div>
         ) : step === 'upload' ? (
           <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label>Zielkonto</Label>
                 <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                   <SelectTrigger>
                     <SelectValue placeholder="Konto auswählen..." />
                   </SelectTrigger>
                   <SelectContent>
                     {accounts.map((account) => (
                       <SelectItem key={account.id} value={account.id}>
                         {account.name} {account.iban ? `(${account.iban.slice(-4)})` : ''}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
 
               <div>
                 <Label>Bank-Format</Label>
                 <Select value={bankFormat} onValueChange={(v) => setBankFormat(v as BankFormat)}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {BANK_FORMATS.map((format) => (
                       <SelectItem key={format.value} value={format.value}>
                         {format.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
 
             <div>
               <Label>Datei hochladen</Label>
               <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                   <input
                     type="file"
                     accept=".csv,.txt,.sta,.mt940,.xml,.pdf"
                     multiple
                     onChange={handleFileChange}
                     className="hidden"
                     id="bank-file-upload"
                   />
                   <label htmlFor="bank-file-upload" className="cursor-pointer">
                     {importing ? (
                       <>
                         <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                         <p className="text-lg font-medium mb-1">Dateien werden analysiert...</p>
                         <p className="text-sm text-muted-foreground">
                           {files.length} {files.length === 1 ? 'Datei wird' : 'Dateien werden'} verarbeitet
                         </p>
                       </>
                     ) : (
                       <>
                         <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                         <p className="text-lg font-medium mb-1">
                           {files.length > 0
                             ? `${files.length} ${files.length === 1 ? 'Datei' : 'Dateien'} ausgewählt`
                             : 'Dateien auswählen oder hier ablegen'}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           Unterstützte Formate: CSV, MT940, CAMT.053, PDF – Mehrfachauswahl möglich
                         </p>
                       </>
                     )}
                   </label>
               </div>
             </div>
 
             {parseError && (
               <Alert variant="destructive">
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Fehler</AlertTitle>
                 <AlertDescription>{parseError}</AlertDescription>
               </Alert>
             )}
 
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Hinweis zum Dateiformat</AlertTitle>
                <AlertDescription>
                  Laden Sie die Kontoauszüge direkt aus Ihrem Online-Banking herunter. 
                  MT940 und CAMT.053 Formate werden automatisch erkannt. 
                  PDF-Kontoauszüge werden per KI analysiert.
                </AlertDescription>
              </Alert>
           </div>
         ) : (
           <div className="space-y-4">
             <div className="grid grid-cols-4 gap-3">
               <div className="glass rounded-lg p-3 text-center">
                 <p className="text-xs text-muted-foreground">Transaktionen</p>
                 <p className="text-xl font-bold">{enhancedTransactions.length}</p>
               </div>
               <div className="glass rounded-lg p-3 text-center">
                 <p className="text-xs text-muted-foreground">Ausgewählt</p>
                 <p className="text-xl font-bold text-primary">{selectedCount}</p>
               </div>
               <div className="glass rounded-lg p-3 text-center">
                 <p className="text-xs text-muted-foreground">Duplikate</p>
                 <p className="text-xl font-bold text-warning">{duplicateCount}</p>
               </div>
               <div className="glass rounded-lg p-3 text-center">
                 <p className="text-xs text-muted-foreground">Rechnungs-Match</p>
                 <p className="text-xl font-bold text-info">{matchedCount}</p>
               </div>
             </div>
 
             <div className="flex items-center justify-between">
               <p className="text-sm text-muted-foreground">
                 <span className="font-medium">{selectedCount} von {enhancedTransactions.length}</span> Transaktionen ausgewählt
               </p>
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={selectAll}>
                   <SquareCheck className="h-4 w-4 mr-1" />
                   Alle auswählen
                 </Button>
                 <Button variant="outline" size="sm" onClick={selectNone}>
                   <Square className="h-4 w-4 mr-1" />
                   Keine auswählen
                 </Button>
               </div>
             </div>
 
             <div className="border rounded-lg overflow-hidden max-h-[35vh] overflow-y-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="w-10"></TableHead>
                     <TableHead className="w-24">Datum</TableHead>
                     <TableHead>Beschreibung</TableHead>
                     <TableHead className="w-20">Status</TableHead>
                     <TableHead className="w-28 text-right">Betrag</TableHead>
                     <TableHead className="w-40">Rechnungs-Match</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {enhancedTransactions.map((transaction) => (
                     <TableRow 
                       key={transaction.id}
                       className={transaction.isDuplicate ? 'opacity-50' : ''}
                     >
                       <TableCell>
                         <Checkbox
                           checked={transaction.selected}
                           onCheckedChange={() => toggleSelection(transaction.id)}
                         />
                       </TableCell>
                       <TableCell className="font-mono text-xs">
                         {transaction.date}
                       </TableCell>
                       <TableCell className="max-w-[180px] truncate text-sm">
                         {transaction.description}
                       </TableCell>
                       <TableCell>
                         {transaction.isDuplicate ? (
                           <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
                             <Copy className="h-3 w-3 mr-1" />
                             Doppelt
                           </Badge>
                         ) : (
                           <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                             Neu
                           </Badge>
                         )}
                       </TableCell>
                       <TableCell className={`text-right font-medium ${transaction.amount >= 0 ? 'text-success' : 'text-destructive'}`}>
                         {formatCurrency(transaction.amount)}
                       </TableCell>
                       <TableCell>
                         {transaction.matchingInvoice ? (
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30 cursor-pointer" onClick={() => linkToInvoice(transaction.id, null)}>
                                <Link2 className="h-3 w-3 mr-1" />
                                {transaction.matchingInvoice.invoice_number}
                              </Badge>
                              <p className="text-[10px] text-muted-foreground">
                                Passt zu Rechnung
                              </p>
                            </div>
                          ) : transaction.amount > 0 && openInvoices.length > 0 ? (
                           <Select
                             value=""
                             onValueChange={(invId) => linkToInvoice(transaction.id, invId)}
                           >
                             <SelectTrigger className="h-6 text-xs w-full">
                               <SelectValue placeholder="Verknüpfen..." />
                             </SelectTrigger>
                             <SelectContent>
                                {openInvoices.map((inv) => (
                                   <SelectItem key={inv.id} value={inv.id}>
                                      {inv.invoice_number} ({new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(inv.amount)})
                                   </SelectItem>
                                 ))}
                             </SelectContent>
                           </Select>
                         ) : (
                           <span className="text-muted-foreground text-xs">-</span>
                         )}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
 
             {duplicateCount > 0 && (
               <Alert>
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>{duplicateCount} mögliche Duplikate erkannt</AlertTitle>
                 <AlertDescription>
                   Transaktionen mit gleichem Datum und Betrag wurden als Duplikate markiert.
                 </AlertDescription>
               </Alert>
             )}
           </div>
         )}
 
         <DialogFooter className="mt-6">
           {step === 'complete' ? (
             <Button onClick={() => { resetForm(); onOpenChange(false); }}>
               Schließen
             </Button>
           ) : (
             <>
               {step === 'preview' && (
                 <Button variant="outline" onClick={() => setStep('upload')}>
                   Zurück
                 </Button>
               )}
               <Button variant="outline" onClick={() => onOpenChange(false)}>
                 Abbrechen
               </Button>
               {step === 'preview' && (
                 <Button onClick={handleImport} disabled={importing || selectedCount === 0}>
                   {importing ? (
                     <>
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       Importiert...
                     </>
                   ) : (
                     <>
                       <Upload className="h-4 w-4 mr-2" />
                       {selectedCount} Transaktionen importieren
                     </>
                   )}
                 </Button>
               )}
             </>
           )}
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }