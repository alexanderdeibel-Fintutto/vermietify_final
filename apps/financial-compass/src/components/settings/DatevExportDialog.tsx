 import { useState } from 'react';
 import { format } from 'date-fns';
 import { de } from 'date-fns/locale';
 import { CalendarIcon, Download, FileSpreadsheet, Info } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Calendar } from '@/components/ui/calendar';
 import { Checkbox } from '@/components/ui/checkbox';
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
 import { generateDatevCSV, downloadDatevFile } from '@/services/datevExport';
 
 interface DatevExportDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function DatevExportDialog({ open, onOpenChange }: DatevExportDialogProps) {
   const { currentCompany } = useCompany();
   const { toast } = useToast();
   
   const [dateFrom, setDateFrom] = useState<Date | undefined>(
     new Date(new Date().getFullYear(), new Date().getMonth(), 1)
   );
   const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
   const [onlyBooked, setOnlyBooked] = useState(false);
   const [withReceipts, setWithReceipts] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const [progress, setProgress] = useState(0);
 
   const handleExport = async () => {
     if (!currentCompany || !dateFrom || !dateTo) return;
 
     setIsExporting(true);
     setProgress(10);
 
     try {
       // Fetch transactions within date range
       let query = supabase
         .from('transactions')
         .select('*')
         .eq('company_id', currentCompany.id)
         .gte('date', dateFrom.toISOString().split('T')[0])
         .lte('date', dateTo.toISOString().split('T')[0])
         .order('date', { ascending: true });
 
       setProgress(30);
       const { data: transactions, error } = await query;
 
       if (error) throw error;
 
       setProgress(50);
 
       if (!transactions || transactions.length === 0) {
         toast({
           title: 'Keine Daten',
           description: 'Im gewählten Zeitraum wurden keine Buchungen gefunden.',
           variant: 'destructive',
         });
         setIsExporting(false);
         setProgress(0);
         return;
       }
 
       setProgress(70);
 
       // Generate DATEV CSV
       const csv = generateDatevCSV(transactions, {
         name: currentCompany.name,
         taxId: 'DE123456789', // TODO: Get from company settings
       });
 
       setProgress(90);
 
       // Download file
       const periodStr = `${format(dateFrom, 'yyyy-MM')}_${format(dateTo, 'yyyy-MM')}`;
       const filename = `DATEV_${currentCompany.name.replace(/[^a-zA-Z0-9]/g, '_')}_${periodStr}.csv`;
       downloadDatevFile(csv, filename);
 
       setProgress(100);
 
       toast({
         title: 'DATEV-Export erfolgreich',
         description: `${transactions.length} Buchungen exportiert: ${filename}`,
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
         description: 'Der DATEV-Export konnte nicht durchgeführt werden.',
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
             <FileSpreadsheet className="h-5 w-5 text-blue-500" />
             DATEV-Export
           </DialogTitle>
           <DialogDescription>
             Exportieren Sie Ihre Buchungsdaten im DATEV-Format für Ihren Steuerberater.
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
 
           {/* Checkboxes */}
           <div className="space-y-4">
             <div className="flex items-center space-x-2">
               <Checkbox
                 id="onlyBooked"
                 checked={onlyBooked}
                 onCheckedChange={(checked) => setOnlyBooked(checked === true)}
               />
               <Label htmlFor="onlyBooked" className="cursor-pointer">
                 Nur gebuchte Belege
               </Label>
             </div>
 
             <div className="flex items-center space-x-2">
               <Checkbox
                 id="withReceipts"
                 checked={withReceipts}
                 onCheckedChange={(checked) => setWithReceipts(checked === true)}
               />
               <Label htmlFor="withReceipts" className="cursor-pointer">
                 Mit Belegbildern (ZIP)
               </Label>
             </div>
           </div>
 
           {/* Info Box */}
           <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
             <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
             <div>
               <p className="font-medium text-blue-600 dark:text-blue-400">DATEV-Format 7.0 kompatibel</p>
               <p className="text-sm text-muted-foreground">
                 Der Export entspricht dem aktuellen DATEV-Buchungsstapel-Format und kann direkt importiert werden.
               </p>
             </div>
           </div>
 
           {/* Progress Bar */}
           {isExporting && (
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span>Exportiere Daten...</span>
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
             {isExporting ? 'Exportiere...' : 'Export starten'}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }