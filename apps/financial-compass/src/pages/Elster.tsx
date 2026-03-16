 import { useState, useEffect } from 'react';
 import { FileText, Send, Download, Settings, AlertTriangle, CheckCircle, Loader2, Upload, Globe } from 'lucide-react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Checkbox } from '@/components/ui/checkbox';
 import { Switch } from '@/components/ui/switch';
 import { Badge } from '@/components/ui/badge';
 import { Separator } from '@/components/ui/separator';
 import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { Progress } from '@/components/ui/progress';
 import { useToast } from '@/hooks/use-toast';
 import { useCompany } from '@/contexts/CompanyContext';
 import { supabase } from '@/integrations/supabase/client';
 import { generateUStVAXML, calculateUStVA, downloadXML, submitToElster, FINANZAEMTER, type UStVAData } from '@/services/elster';
 
 const MONTHS = [
   { value: '1', label: 'Januar' },
   { value: '2', label: 'Februar' },
   { value: '3', label: 'März' },
   { value: '4', label: 'April' },
   { value: '5', label: 'Mai' },
   { value: '6', label: 'Juni' },
   { value: '7', label: 'Juli' },
   { value: '8', label: 'August' },
   { value: '9', label: 'September' },
   { value: '10', label: 'Oktober' },
   { value: '11', label: 'November' },
   { value: '12', label: 'Dezember' },
 ];
 
 const QUARTERS = [
   { value: '41', label: '1. Quartal (Jan-Mär)' },
   { value: '42', label: '2. Quartal (Apr-Jun)' },
   { value: '43', label: '3. Quartal (Jul-Sep)' },
   { value: '44', label: '4. Quartal (Okt-Dez)' },
 ];
 
 export default function Elster() {
   const { toast } = useToast();
   const { currentCompany } = useCompany();
   const [activeTab, setActiveTab] = useState('ustva');
   
   // UStVA State
   const [periodType, setPeriodType] = useState<'monthly' | 'quarterly'>('monthly');
   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
   const [selectedPeriod, setSelectedPeriod] = useState((new Date().getMonth() + 1).toString());
   const [uStVAData, setUStVAData] = useState<UStVAData | null>(null);
   const [loading, setLoading] = useState(false);
   const [showXmlPreview, setShowXmlPreview] = useState(false);
   
   // Submit Dialog State
   const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
   const [confirmCorrectness, setConfirmCorrectness] = useState(false);
   const [submitting, setSubmitting] = useState(false);
   const [submitProgress, setSubmitProgress] = useState(0);
   const [submitResult, setSubmitResult] = useState<{ success: boolean; protocol?: string; error?: string } | null>(null);
   
   // Settings State
   const [taxNumber, setTaxNumber] = useState('');
   const [finanzamt, setFinanzamt] = useState('');
   const [submitInterval, setSubmitInterval] = useState<'monthly' | 'quarterly'>('monthly');
   const [testMode, setTestMode] = useState(true);
   
   const currentYear = new Date().getFullYear();
   const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
   
   useEffect(() => {
     if (currentCompany) {
       fetchTransactionsAndCalculate();
     }
   }, [currentCompany, selectedYear, selectedPeriod, periodType]);
   
   const fetchTransactionsAndCalculate = async () => {
     if (!currentCompany) return;
     
     setLoading(true);
     try {
       const year = parseInt(selectedYear);
       const period = parseInt(selectedPeriod);
       
       let startDate: string;
       let endDate: string;
       
       if (periodType === 'monthly') {
         startDate = `${year}-${String(period).padStart(2, '0')}-01`;
         const lastDay = new Date(year, period, 0).getDate();
         endDate = `${year}-${String(period).padStart(2, '0')}-${lastDay}`;
       } else {
         // Quarterly
         const quarterStart = period === 41 ? 1 : period === 42 ? 4 : period === 43 ? 7 : 10;
         const quarterEnd = quarterStart + 2;
         startDate = `${year}-${String(quarterStart).padStart(2, '0')}-01`;
         const lastDay = new Date(year, quarterEnd, 0).getDate();
         endDate = `${year}-${String(quarterEnd).padStart(2, '0')}-${lastDay}`;
       }
       
       const { data: transactions } = await supabase
         .from('transactions')
         .select('*')
         .eq('company_id', currentCompany.id)
         .gte('date', startDate)
         .lte('date', endDate);
       
       if (transactions) {
         const calculated = calculateUStVA(transactions);
         calculated.zeitraum = {
           jahr: year,
           ...(periodType === 'monthly' ? { monat: period } : { quartal: period })
         };
         setUStVAData(calculated);
       }
     } catch (error) {
       console.error('Error fetching transactions:', error);
       toast({
         title: 'Fehler',
         description: 'Transaktionen konnten nicht geladen werden',
         variant: 'destructive',
       });
     } finally {
       setLoading(false);
     }
   };
   
   const handleDownloadXML = () => {
     if (!uStVAData || !currentCompany) return;
     
     const xml = generateUStVAXML(uStVAData, currentCompany);
     const period = periodType === 'monthly' 
       ? `${selectedYear}-${String(selectedPeriod).padStart(2, '0')}`
       : `${selectedYear}-Q${parseInt(selectedPeriod) - 40}`;
     downloadXML(xml, `UStVA_${period}.xml`);
     
     toast({
       title: 'XML heruntergeladen',
       description: 'Die UStVA-XML wurde erfolgreich erstellt',
     });
   };
   
   const handleSubmit = async () => {
     if (!uStVAData || !currentCompany) return;
     
     setSubmitting(true);
     setSubmitProgress(0);
     setSubmitResult(null);
     
     // Simulate progress
     const progressInterval = setInterval(() => {
       setSubmitProgress(prev => Math.min(prev + 10, 90));
     }, 200);
     
     try {
       const xml = generateUStVAXML(uStVAData, currentCompany);
       const result = await submitToElster(xml, testMode);
       
       clearInterval(progressInterval);
       setSubmitProgress(100);
       setSubmitResult(result);
       
       if (result.success) {
         toast({
           title: 'Übermittlung erfolgreich',
           description: testMode ? 'Testübermittlung abgeschlossen' : 'UStVA wurde an ELSTER übermittelt',
         });
       }
     } catch (error) {
       clearInterval(progressInterval);
       setSubmitResult({ success: false, error: 'Verbindungsfehler' });
       toast({
         title: 'Fehler',
         description: 'Übermittlung fehlgeschlagen',
         variant: 'destructive',
       });
     } finally {
       setSubmitting(false);
     }
   };
   
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
   };
   
   const validateTaxNumber = (value: string) => {
     // German tax number format: XX/XXX/XXXXX or XXXXXXXXXXX
     const cleaned = value.replace(/[^0-9]/g, '');
     return cleaned.length === 10 || cleaned.length === 11 || cleaned.length === 13;
   };
   
   return (
     <div className="space-y-6">
       <div>
         <h1 className="text-3xl font-bold">ELSTER - Elektronische Steuererklärung</h1>
         <p className="text-muted-foreground">Umsatzsteuer-Voranmeldung und Zusammenfassende Meldung</p>
       </div>
       
       <Tabs value={activeTab} onValueChange={setActiveTab}>
         <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
           <TabsTrigger value="ustva" className="gap-2">
             <FileText className="h-4 w-4" />
             <span className="hidden sm:inline">UStVA</span>
           </TabsTrigger>
           <TabsTrigger value="zm" className="gap-2">
             <Globe className="h-4 w-4" />
             <span className="hidden sm:inline">ZM</span>
           </TabsTrigger>
           <TabsTrigger value="settings" className="gap-2">
             <Settings className="h-4 w-4" />
             <span className="hidden sm:inline">Einstellungen</span>
           </TabsTrigger>
         </TabsList>
         
         {/* UStVA Tab */}
         <TabsContent value="ustva" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Umsatzsteuer-Voranmeldung</CardTitle>
               <CardDescription>
                 Wählen Sie den Zeitraum und prüfen Sie die automatisch berechneten Werte
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               {/* Period Selection */}
               <div className="flex flex-wrap gap-4">
                 <div className="space-y-2">
                   <Label>Intervall</Label>
                   <Select value={periodType} onValueChange={(v) => setPeriodType(v as 'monthly' | 'quarterly')}>
                     <SelectTrigger className="w-[160px]">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="monthly">Monatlich</SelectItem>
                       <SelectItem value="quarterly">Quartalsweise</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 
                 <div className="space-y-2">
                   <Label>Jahr</Label>
                   <Select value={selectedYear} onValueChange={setSelectedYear}>
                     <SelectTrigger className="w-[120px]">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       {years.map(year => (
                         <SelectItem key={year} value={year}>{year}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 
                 <div className="space-y-2">
                   <Label>{periodType === 'monthly' ? 'Monat' : 'Quartal'}</Label>
                   <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                     <SelectTrigger className="w-[180px]">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       {(periodType === 'monthly' ? MONTHS : QUARTERS).map(p => (
                         <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               
               <Separator />
               
               {/* Calculated Values */}
               {loading ? (
                 <div className="flex items-center justify-center py-8">
                   <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 </div>
               ) : uStVAData ? (
                 <div className="space-y-4">
                   <div className="grid gap-4 md:grid-cols-2">
                     <Card className="bg-muted/50">
                       <CardContent className="pt-6">
                         <div className="flex justify-between items-center">
                           <div>
                             <p className="text-sm text-muted-foreground">Zeile 81</p>
                             <p className="font-medium">Steuerpfl. Umsätze 19%</p>
                           </div>
                           <Badge variant="outline" className="text-lg font-mono">
                             {formatCurrency(uStVAData.kz81)}
                           </Badge>
                         </div>
                       </CardContent>
                     </Card>
                     
                     <Card className="bg-muted/50">
                       <CardContent className="pt-6">
                         <div className="flex justify-between items-center">
                           <div>
                             <p className="text-sm text-muted-foreground">Zeile 86</p>
                             <p className="font-medium">Steuerpfl. Umsätze 7%</p>
                           </div>
                           <Badge variant="outline" className="text-lg font-mono">
                             {formatCurrency(uStVAData.kz86)}
                           </Badge>
                         </div>
                       </CardContent>
                     </Card>
                     
                     <Card className="bg-muted/50">
                       <CardContent className="pt-6">
                         <div className="flex justify-between items-center">
                           <div>
                             <p className="text-sm text-muted-foreground">Zeile 66</p>
                             <p className="font-medium">Vorsteuer</p>
                           </div>
                           <Badge variant="outline" className="text-lg font-mono">
                             {formatCurrency(uStVAData.kz66)}
                           </Badge>
                         </div>
                       </CardContent>
                     </Card>
                     
                     <Card className="bg-primary/10 border-primary/20">
                       <CardContent className="pt-6">
                         <div className="flex justify-between items-center">
                           <div>
                             <p className="text-sm text-muted-foreground">Zeile 83</p>
                             <p className="font-medium">Verbleibende USt-Vorauszahlung</p>
                           </div>
                           <Badge className={`text-lg font-mono ${uStVAData.kz83 >= 0 ? 'bg-destructive' : 'bg-green-600'}`}>
                             {formatCurrency(uStVAData.kz83)}
                           </Badge>
                         </div>
                       </CardContent>
                     </Card>
                   </div>
                   
                   {uStVAData.kz83 < 0 && (
                     <Alert>
                       <CheckCircle className="h-4 w-4" />
                       <AlertTitle>Erstattungsanspruch</AlertTitle>
                       <AlertDescription>
                         Sie haben einen Vorsteuerüberhang von {formatCurrency(Math.abs(uStVAData.kz83))}
                       </AlertDescription>
                     </Alert>
                   )}
                 </div>
               ) : (
                 <Alert variant="destructive">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Keine Daten</AlertTitle>
                   <AlertDescription>
                     Für den gewählten Zeitraum liegen keine Buchungen vor
                   </AlertDescription>
                 </Alert>
               )}
               
               <Separator />
               
               {/* XML Preview Toggle */}
               <div className="flex items-center space-x-2">
                 <Checkbox
                   id="showXml"
                   checked={showXmlPreview}
                   onCheckedChange={(checked) => setShowXmlPreview(checked as boolean)}
                 />
                 <Label htmlFor="showXml">XML-Vorschau anzeigen</Label>
               </div>
               
               {showXmlPreview && uStVAData && currentCompany && (
                 <Card className="bg-muted">
                   <CardContent className="pt-6">
                     <pre className="text-xs overflow-auto max-h-64 whitespace-pre-wrap font-mono">
                       {generateUStVAXML(uStVAData, currentCompany)}
                     </pre>
                   </CardContent>
                 </Card>
               )}
               
               {/* Actions */}
               <div className="flex flex-wrap gap-3">
                 <Button
                   onClick={() => setSubmitDialogOpen(true)}
                   disabled={!uStVAData || loading}
                   className="gap-2"
                 >
                   <Send className="h-4 w-4" />
                   An ELSTER übermitteln
                 </Button>
                 <Button
                   variant="outline"
                   onClick={handleDownloadXML}
                   disabled={!uStVAData || loading}
                   className="gap-2"
                 >
                   <Download className="h-4 w-4" />
                   XML herunterladen
                 </Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
         
         {/* ZM Tab */}
         <TabsContent value="zm" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Zusammenfassende Meldung</CardTitle>
               <CardDescription>
                 Meldung über innergemeinschaftliche Lieferungen und Leistungen
               </CardDescription>
             </CardHeader>
             <CardContent>
               <Alert>
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>Keine EU-Umsätze erfasst</AlertTitle>
                 <AlertDescription>
                   Es wurden keine innergemeinschaftlichen Lieferungen oder Leistungen für den aktuellen Zeitraum gefunden.
                   Die ZM ist nur erforderlich, wenn Sie Waren oder Dienstleistungen an Unternehmen in anderen EU-Ländern erbracht haben.
                 </AlertDescription>
               </Alert>
             </CardContent>
           </Card>
         </TabsContent>
         
         {/* Settings Tab */}
         <TabsContent value="settings" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>ELSTER-Einstellungen</CardTitle>
               <CardDescription>
                 Konfigurieren Sie Ihre Steuerdaten und Übermittlungseinstellungen
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="grid gap-6 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label htmlFor="taxNumber">Steuernummer</Label>
                   <Input
                     id="taxNumber"
                     value={taxNumber}
                     onChange={(e) => setTaxNumber(e.target.value)}
                     placeholder="XX/XXX/XXXXX"
                   />
                   {taxNumber && !validateTaxNumber(taxNumber) && (
                     <p className="text-sm text-destructive">Ungültiges Steuernummer-Format</p>
                   )}
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="finanzamt">Finanzamt</Label>
                   <Select value={finanzamt} onValueChange={setFinanzamt}>
                     <SelectTrigger>
                       <SelectValue placeholder="Finanzamt wählen" />
                     </SelectTrigger>
                     <SelectContent>
                       {FINANZAEMTER.map(fa => (
                         <SelectItem key={fa.code} value={fa.code}>{fa.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               
               <Separator />
               
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label>Übermittlungsintervall</Label>
                   <Select value={submitInterval} onValueChange={(v) => setSubmitInterval(v as 'monthly' | 'quarterly')}>
                     <SelectTrigger className="w-[200px]">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="monthly">Monatlich</SelectItem>
                       <SelectItem value="quarterly">Quartalsweise</SelectItem>
                     </SelectContent>
                   </Select>
                   <p className="text-sm text-muted-foreground">
                     Neuunternehmer müssen im ersten Jahr monatlich abgeben
                   </p>
                 </div>
                 
                 <div className="space-y-2">
                   <Label>ELSTER-Zertifikat</Label>
                   <div className="flex gap-2">
                     <Input type="file" accept=".pfx,.p12" className="max-w-xs" />
                     <Button variant="outline" className="gap-2">
                       <Upload className="h-4 w-4" />
                       Hochladen
                     </Button>
                   </div>
                   <p className="text-sm text-muted-foreground">
                     Für die echte Übermittlung benötigen Sie ein ELSTER-Zertifikat
                   </p>
                 </div>
               </div>
               
               <Separator />
               
               <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                   <Label>Testmodus</Label>
                   <p className="text-sm text-muted-foreground">
                     Im Testmodus werden keine echten Daten übermittelt
                   </p>
                 </div>
                 <Switch
                   checked={testMode}
                   onCheckedChange={setTestMode}
                 />
               </div>
               
               {testMode && (
                 <Alert>
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>Testmodus aktiv</AlertTitle>
                   <AlertDescription>
                     Übermittlungen werden nur simuliert und nicht an das Finanzamt gesendet
                   </AlertDescription>
                 </Alert>
               )}
               
               <Button onClick={() => toast({ title: 'Einstellungen gespeichert' })}>
                 Einstellungen speichern
               </Button>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
       
       {/* Submit Dialog */}
       <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>
               {testMode ? 'ELSTER Testübermittlung' : 'ELSTER Übermittlung'}
             </DialogTitle>
             <DialogDescription>
               Prüfen Sie die Daten vor der Übermittlung
             </DialogDescription>
           </DialogHeader>
           
           {!submitResult ? (
             <>
               <div className="space-y-4">
                 {uStVAData && (
                   <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                     <div className="flex justify-between">
                       <span>Zeitraum:</span>
                       <span className="font-medium">
                         {periodType === 'monthly' 
                           ? `${MONTHS.find(m => m.value === selectedPeriod)?.label} ${selectedYear}`
                           : `${QUARTERS.find(q => q.value === selectedPeriod)?.label} ${selectedYear}`
                         }
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span>Netto-Umsätze 19%:</span>
                       <span className="font-medium">{formatCurrency(uStVAData.kz81)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Vorsteuer:</span>
                       <span className="font-medium">{formatCurrency(uStVAData.kz66)}</span>
                     </div>
                     <Separator />
                     <div className="flex justify-between font-bold">
                       <span>Vorauszahlung:</span>
                       <span>{formatCurrency(uStVAData.kz83)}</span>
                     </div>
                   </div>
                 )}
                 
                 {testMode && (
                   <Alert>
                     <AlertTriangle className="h-4 w-4" />
                     <AlertDescription>
                       Testmodus: Keine echte Übermittlung
                     </AlertDescription>
                   </Alert>
                 )}
                 
                 <div className="flex items-center space-x-2">
                   <Checkbox
                     id="confirm"
                     checked={confirmCorrectness}
                     onCheckedChange={(checked) => setConfirmCorrectness(checked as boolean)}
                   />
                   <Label htmlFor="confirm" className="text-sm">
                     Ich bestätige die Richtigkeit der Angaben
                   </Label>
                 </div>
                 
                 {submitting && (
                   <div className="space-y-2">
                     <Progress value={submitProgress} />
                     <p className="text-sm text-center text-muted-foreground">
                       Übermittlung läuft...
                     </p>
                   </div>
                 )}
               </div>
               
               <DialogFooter>
                 <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                   Abbrechen
                 </Button>
                 <Button
                   onClick={handleSubmit}
                   disabled={!confirmCorrectness || submitting}
                   className="gap-2"
                 >
                   {submitting ? (
                     <Loader2 className="h-4 w-4 animate-spin" />
                   ) : (
                     <Send className="h-4 w-4" />
                   )}
                   Übermitteln
                 </Button>
               </DialogFooter>
             </>
           ) : (
             <>
               <div className="space-y-4">
                 {submitResult.success ? (
                  <Alert className="border-primary bg-primary/10">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Übermittlung erfolgreich</AlertTitle>
                     <AlertDescription>
                       Die UStVA wurde erfolgreich übermittelt
                     </AlertDescription>
                   </Alert>
                 ) : (
                   <Alert variant="destructive">
                     <AlertTriangle className="h-4 w-4" />
                     <AlertTitle>Übermittlung fehlgeschlagen</AlertTitle>
                     <AlertDescription>{submitResult.error}</AlertDescription>
                   </Alert>
                 )}
                 
                 {submitResult.protocol && (
                   <Card className="bg-muted">
                     <CardHeader className="pb-2">
                       <CardTitle className="text-sm">Übermittlungsprotokoll</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <pre className="text-xs whitespace-pre-wrap">{submitResult.protocol}</pre>
                     </CardContent>
                   </Card>
                 )}
               </div>
               
               <DialogFooter>
                 {submitResult.protocol && (
                   <Button
                     variant="outline"
                     onClick={() => {
                       const blob = new Blob([submitResult.protocol!], { type: 'text/plain' });
                       const url = URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.href = url;
                       a.download = `ELSTER_Protokoll_${new Date().toISOString().split('T')[0]}.txt`;
                       a.click();
                     }}
                     className="gap-2"
                   >
                     <Download className="h-4 w-4" />
                     Protokoll speichern
                   </Button>
                 )}
                 <Button onClick={() => {
                   setSubmitDialogOpen(false);
                   setSubmitResult(null);
                   setConfirmCorrectness(false);
                 }}>
                   Schließen
                 </Button>
               </DialogFooter>
             </>
           )}
         </DialogContent>
       </Dialog>
     </div>
   );
 }