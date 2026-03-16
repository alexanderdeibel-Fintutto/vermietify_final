 import { useState } from 'react';
 import { format } from 'date-fns';
 import { de } from 'date-fns/locale';
 import { CalendarIcon, Download, Database, Info, CheckCircle } from 'lucide-react';
 import JSZip from 'jszip';
 import { Button } from '@/components/ui/button';
 import { Calendar } from '@/components/ui/calendar';
 import { Label } from '@/components/ui/label';
 import { Progress } from '@/components/ui/progress';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from '@/components/ui/popover';
 import { cn } from '@/lib/utils';
 import { useCompany } from '@/contexts/CompanyContext';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 
 interface GdpduExportDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function GdpduExportDialog({ open, onOpenChange }: GdpduExportDialogProps) {
   const { currentCompany } = useCompany();
   const { toast } = useToast();
   
   const [dateFrom, setDateFrom] = useState<Date | undefined>(
     new Date(new Date().getFullYear(), 0, 1) // Start of year
   );
   const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
   const [isExporting, setIsExporting] = useState(false);
   const [progress, setProgress] = useState(0);
 
   const generateIndexXml = (tables: string[], dateRange: { from: string; to: string }) => {
     return `<?xml version="1.0" encoding="UTF-8"?>
 <DataSet xmlns="urn:gdpdu:fiskaly:gdpdu:1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
   <Version>1.0</Version>
   <DataSupplier>
     <Name>${currentCompany?.name || 'Unbekannt'}</Name>
     <Location>${currentCompany?.address || ''}</Location>
     <Comment>GDPdU-Export erstellt am ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}</Comment>
   </DataSupplier>
   <Media>
     <Name>GDPdU Datenexport</Name>
     ${tables.map(table => `
     <Table>
       <URL>${table}.csv</URL>
       <Name>${table}</Name>
       <Description>Exportierte ${table} Daten</Description>
       <Validity>
         <Range>
           <From>${dateRange.from}</From>
           <To>${dateRange.to}</To>
         </Range>
       </Validity>
       <UTF8/>
       <DecimalSymbol>,</DecimalSymbol>
       <DigitGroupingSymbol></DigitGroupingSymbol>
       <VariableLength>
         <ColumnDelimiter>;</ColumnDelimiter>
         <RecordDelimiter>&#13;&#10;</RecordDelimiter>
         <TextEncapsulator>"</TextEncapsulator>
       </VariableLength>
     </Table>`).join('')}
   </Media>
 </DataSet>`;
   };
 
   const generateTransactionsCSV = (transactions: any[]) => {
     const headers = [
       'ID', 'Datum', 'Typ', 'Betrag', 'Kategorie', 'Beschreibung', 
       'Erstellt am', 'Aktualisiert am'
     ].join(';');
 
     const rows = transactions.map(t => [
       t.id,
       format(new Date(t.date), 'dd.MM.yyyy'),
       t.type === 'income' ? 'Einnahme' : 'Ausgabe',
       t.amount.toFixed(2).replace('.', ','),
       t.category || '',
       `"${(t.description || '').replace(/"/g, '""')}"`,
       format(new Date(t.created_at), 'dd.MM.yyyy HH:mm'),
       format(new Date(t.updated_at), 'dd.MM.yyyy HH:mm'),
     ].join(';'));
 
     return [headers, ...rows].join('\r\n');
   };
 
   const generateInvoicesCSV = (invoices: any[]) => {
     const headers = [
       'ID', 'Rechnungsnummer', 'Typ', 'Status', 'Betrag', 'Steuerbetrag',
       'Ausstellungsdatum', 'Fälligkeitsdatum', 'Beschreibung'
     ].join(';');
 
     const rows = invoices.map(i => [
       i.id,
       i.invoice_number,
       i.type === 'incoming' ? 'Eingangsrechnung' : 'Ausgangsrechnung',
       i.status || '',
       i.amount.toFixed(2).replace('.', ','),
       (i.tax_amount || 0).toFixed(2).replace('.', ','),
       i.issue_date ? format(new Date(i.issue_date), 'dd.MM.yyyy') : '',
       i.due_date ? format(new Date(i.due_date), 'dd.MM.yyyy') : '',
       `"${(i.description || '').replace(/"/g, '""')}"`,
     ].join(';'));
 
     return [headers, ...rows].join('\r\n');
   };
 
   const handleExport = async () => {
     if (!currentCompany || !dateFrom || !dateTo) return;
 
     setIsExporting(true);
     setProgress(10);
 
     try {
       const dateFromStr = dateFrom.toISOString().split('T')[0];
       const dateToStr = dateTo.toISOString().split('T')[0];
 
       // Fetch transactions
       setProgress(20);
       const { data: transactions } = await supabase
         .from('transactions')
         .select('*')
         .eq('company_id', currentCompany.id)
         .gte('date', dateFromStr)
         .lte('date', dateToStr)
         .order('date', { ascending: true });
 
       // Fetch invoices
       setProgress(40);
       const { data: invoices } = await supabase
         .from('invoices')
         .select('*')
         .eq('company_id', currentCompany.id)
         .gte('issue_date', dateFromStr)
         .lte('issue_date', dateToStr)
         .order('issue_date', { ascending: true });
 
       setProgress(60);
 
       // Create ZIP file
       const zip = new JSZip();
 
       // Add index.xml
       const tables = ['Buchungen'];
       if (invoices && invoices.length > 0) tables.push('Rechnungen');
       
       zip.file('index.xml', generateIndexXml(tables, {
         from: format(dateFrom, 'dd.MM.yyyy'),
         to: format(dateTo, 'dd.MM.yyyy'),
       }));
 
       setProgress(70);
 
       // Add transactions CSV
       if (transactions && transactions.length > 0) {
         zip.file('Buchungen.csv', '\ufeff' + generateTransactionsCSV(transactions));
       }
 
       // Add invoices CSV
       if (invoices && invoices.length > 0) {
         zip.file('Rechnungen.csv', '\ufeff' + generateInvoicesCSV(invoices));
       }
 
       setProgress(85);
 
       // Generate and download ZIP
       const blob = await zip.generateAsync({ type: 'blob' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `GDPdU_${currentCompany.name.replace(/[^a-zA-Z0-9]/g, '_')}_${format(dateFrom, 'yyyy-MM')}_${format(dateTo, 'yyyy-MM')}.zip`;
       a.click();
       URL.revokeObjectURL(url);
 
       setProgress(100);
 
       toast({
         title: 'GDPdU-Export erfolgreich',
         description: `Export enthält ${transactions?.length || 0} Buchungen und ${invoices?.length || 0} Rechnungen.`,
       });
 
       setTimeout(() => {
         onOpenChange(false);
         setProgress(0);
         setIsExporting(false);
       }, 500);
     } catch (error) {
       console.error('Export error:', error);
       toast({
         title: 'Export fehlgeschlagen',
         description: 'Der GDPdU-Export konnte nicht durchgeführt werden.',
         variant: 'destructive',
       });
       setIsExporting(false);
       setProgress(0);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[500px]">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Database className="h-5 w-5 text-purple-500" />
             GDPdU-Export
           </DialogTitle>
           <DialogDescription>
             Steuerprüfungskonformer Export für Betriebsprüfungen nach GDPdU-Standard.
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-6 py-4">
           {/* Date Range Selection */}
           <div className="grid gap-4 sm:grid-cols-2">
             <div className="space-y-2">
               <Label>Von</Label>
               <Popover>
                 <PopoverTrigger asChild>
                   <Button
                     variant="outline"
                     className={cn(
                       'w-full justify-start text-left font-normal',
                       !dateFrom && 'text-muted-foreground'
                     )}
                   >
                     <CalendarIcon className="mr-2 h-4 w-4" />
                     {dateFrom ? format(dateFrom, 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0" align="start">
                   <Calendar
                     mode="single"
                     selected={dateFrom}
                     onSelect={setDateFrom}
                     initialFocus
                     className="p-3 pointer-events-auto"
                   />
                 </PopoverContent>
               </Popover>
             </div>
 
             <div className="space-y-2">
               <Label>Bis</Label>
               <Popover>
                 <PopoverTrigger asChild>
                   <Button
                     variant="outline"
                     className={cn(
                       'w-full justify-start text-left font-normal',
                       !dateTo && 'text-muted-foreground'
                     )}
                   >
                     <CalendarIcon className="mr-2 h-4 w-4" />
                     {dateTo ? format(dateTo, 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0" align="start">
                   <Calendar
                     mode="single"
                     selected={dateTo}
                     onSelect={setDateTo}
                     initialFocus
                     className="p-3 pointer-events-auto"
                   />
                 </PopoverContent>
               </Popover>
             </div>
           </div>
 
           {/* Included Data Info */}
           <div className="space-y-3">
             <Label>Enthaltene Daten</Label>
             <div className="space-y-2">
               <div className="flex items-center gap-2 text-sm">
                 <CheckCircle className="h-4 w-4 text-success" />
                 <span>index.xml (GDPdU Beschreibung)</span>
               </div>
               <div className="flex items-center gap-2 text-sm">
                 <CheckCircle className="h-4 w-4 text-success" />
                 <span>Buchungen.csv (Alle Transaktionen)</span>
               </div>
               <div className="flex items-center gap-2 text-sm">
                 <CheckCircle className="h-4 w-4 text-success" />
                 <span>Rechnungen.csv (Ein- & Ausgangsrechnungen)</span>
               </div>
             </div>
           </div>
 
           {/* Info Box */}
           <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
             <Info className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
             <div>
               <p className="font-medium text-purple-600 dark:text-purple-400">GDPdU-konform</p>
               <p className="text-sm text-muted-foreground">
                 Der Export entspricht den Grundsätzen zum Datenzugriff und zur Prüfbarkeit digitaler Unterlagen (GDPdU) 
                 und kann bei Betriebsprüfungen vorgelegt werden.
               </p>
             </div>
           </div>
 
           {/* Progress Bar */}
           {isExporting && (
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span>Erstelle ZIP-Archiv...</span>
                 <span>{progress}%</span>
               </div>
               <Progress value={progress} className="h-2" />
             </div>
           )}
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
             Abbrechen
           </Button>
           <Button onClick={handleExport} disabled={isExporting || !dateFrom || !dateTo} className="gap-2">
             <Download className="h-4 w-4" />
             {isExporting ? 'Exportiere...' : 'ZIP erstellen'}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }