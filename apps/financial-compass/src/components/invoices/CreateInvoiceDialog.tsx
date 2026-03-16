 import { useState, useEffect, useRef } from 'react';
 import { Plus, Trash2, Eye, Save, Download, Mail, FileText } from 'lucide-react';
 import html2canvas from 'html2canvas';
 import jsPDF from 'jspdf';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
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
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { supabase } from '@/integrations/supabase/client';
 import { useCompany } from '@/contexts/CompanyContext';
 import { useToast } from '@/hooks/use-toast';
 import { InvoicePreview, InvoiceData, InvoiceItem } from './InvoicePreview';
 import { generateInvoiceNumber, calculateDueDate, formatDate } from '@/lib/invoiceUtils';
 
 interface Contact {
   id: string;
   name: string;
   address: string | null;
 }
 
 interface InvoiceLineItem {
   id: string;
   description: string;
   quantity: number;
   unit: string;
   price: number;
   vatRate: number;
 }
 
 interface CreateInvoiceDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSuccess: () => void;
 }
 
 const UNITS = [
   { value: 'Stück', label: 'Stück' },
   { value: 'Stunde', label: 'Stunde' },
   { value: 'Tag', label: 'Tag' },
   { value: 'Pauschal', label: 'Pauschal' },
   { value: 'Monat', label: 'Monat' },
 ];
 
 const VAT_RATES = [
   { value: '19', label: '19%' },
   { value: '7', label: '7%' },
   { value: '0', label: '0%' },
 ];
 
 export function CreateInvoiceDialog({ open, onOpenChange, onSuccess }: CreateInvoiceDialogProps) {
   const { currentCompany } = useCompany();
   const { toast } = useToast();
   
   const [contacts, setContacts] = useState<Contact[]>([]);
   const [selectedContactId, setSelectedContactId] = useState<string>('');
   const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
   const [servicePeriodFrom, setServicePeriodFrom] = useState(new Date().toISOString().split('T')[0]);
   const [servicePeriodTo, setServicePeriodTo] = useState(new Date().toISOString().split('T')[0]);
   const [paymentTermDays, setPaymentTermDays] = useState(14);
   const [items, setItems] = useState<InvoiceLineItem[]>([
     { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'Stück', price: 0, vatRate: 19 },
   ]);
   const [saving, setSaving] = useState(false);
   const [activeTab, setActiveTab] = useState('details');
   const [exporting, setExporting] = useState(false);
   const [generatedInvoiceNumber] = useState(generateInvoiceNumber());
   const invoiceRef = useRef<HTMLDivElement>(null);
 
   useEffect(() => {
     if (open && currentCompany) {
       fetchContacts();
     }
   }, [open, currentCompany]);
 
   const fetchContacts = async () => {
     if (!currentCompany) return;
     const { data } = await supabase
       .from('contacts')
       .select('id, name, address')
       .eq('company_id', currentCompany.id)
       .order('name');
     if (data) setContacts(data);
   };
 
   const addItem = () => {
     setItems([
       ...items,
       { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'Stück', price: 0, vatRate: 19 },
     ]);
   };
 
   const removeItem = (id: string) => {
     if (items.length > 1) {
       setItems(items.filter((item) => item.id !== id));
     }
   };
 
   const updateItem = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
     setItems(
       items.map((item) =>
         item.id === id ? { ...item, [field]: value } : item
       )
     );
   };
 
   const calculateTotals = () => {
     const netTotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
     const vatTotal = items.reduce(
       (sum, item) => sum + (item.quantity * item.price * item.vatRate) / 100,
       0
     );
     return { netTotal, vatTotal, grossTotal: netTotal + vatTotal };
   };
 
   const { netTotal, vatTotal, grossTotal } = calculateTotals();
 
   const selectedContact = contacts.find((c) => c.id === selectedContactId);
 
   const getPreviewData = (): InvoiceData => ({
     number: generatedInvoiceNumber,
     date: formatDate(invoiceDate),
     dueDate: formatDate(calculateDueDate(invoiceDate, paymentTermDays)),
     servicePeriodFrom: formatDate(servicePeriodFrom),
     servicePeriodTo: formatDate(servicePeriodTo),
     customer: {
       name: selectedContact?.name || 'Kunde auswählen',
       address: selectedContact?.address || '',
     },
     company: {
       name: currentCompany?.name || '',
       address: currentCompany?.address || '',
       taxId: currentCompany?.tax_id || 'DE000000000',
       bankAccount: 'IBAN: DE00 0000 0000 0000 0000 00',
     },
     items: items.map((item) => ({
       description: item.description || 'Beschreibung fehlt',
       quantity: item.quantity,
       unit: item.unit,
       price: item.price,
       vatRate: item.vatRate,
     })),
   });
 
   const exportPDF = async () => {
     const element = document.getElementById('invoice-pdf');
     if (!element) {
       toast({
         title: 'Fehler',
         description: 'Bitte wechseln Sie zur Vorschau-Ansicht.',
         variant: 'destructive',
       });
       setActiveTab('preview');
       return;
     }
 
     setExporting(true);
     try {
       const canvas = await html2canvas(element, {
         scale: 2,
         useCORS: true,
         logging: false,
         backgroundColor: '#ffffff',
       });
 
       const imgWidth = 210;
       const imgHeight = (canvas.height * imgWidth) / canvas.width;
       
       const pdf = new jsPDF('p', 'mm', 'a4');
       const imgData = canvas.toDataURL('image/png');
       
       // If content is longer than one page, scale it down
       if (imgHeight > 297) {
         const scaleFactor = 297 / imgHeight;
         pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * scaleFactor, 297);
       } else {
         pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
       }
       
       pdf.save(`Rechnung_${generatedInvoiceNumber}.pdf`);
 
       toast({
         title: 'PDF erstellt',
         description: `Rechnung_${generatedInvoiceNumber}.pdf wurde heruntergeladen.`,
       });
     } catch (error) {
       console.error('PDF export error:', error);
       toast({
         title: 'Fehler',
         description: 'PDF konnte nicht erstellt werden.',
         variant: 'destructive',
       });
     } finally {
       setExporting(false);
     }
   };
 
   const handleSendEmail = () => {
     const previewData = getPreviewData();
     const subject = encodeURIComponent(`Rechnung ${generatedInvoiceNumber}`);
     const body = encodeURIComponent(
       `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unsere Rechnung ${generatedInvoiceNumber} über ${grossTotal.toFixed(2)} €.\n\nBitte überweisen Sie den Betrag bis zum ${previewData.dueDate}.\n\nMit freundlichen Grüßen\n${currentCompany?.name || ''}`
     );
     window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
     
     toast({
       title: 'E-Mail vorbereitet',
       description: 'Ihr E-Mail-Programm wurde geöffnet. Bitte fügen Sie die PDF als Anhang hinzu.',
     });
   };
 
   const handleSave = async () => {
     if (!currentCompany || !selectedContactId) {
       toast({
         title: 'Fehler',
         description: 'Bitte wählen Sie einen Kunden aus.',
         variant: 'destructive',
       });
       return;
     }
 
     if (items.some((item) => !item.description || item.price <= 0)) {
       toast({
         title: 'Fehler',
         description: 'Bitte füllen Sie alle Positionen aus.',
         variant: 'destructive',
       });
       return;
     }
 
     setSaving(true);
     try {
       const invoiceNumber = generatedInvoiceNumber;
       const dueDate = calculateDueDate(invoiceDate, paymentTermDays);
 
       const { error } = await supabase.from('invoices').insert({
         company_id: currentCompany.id,
         contact_id: selectedContactId,
         invoice_number: invoiceNumber,
         type: 'outgoing',
         status: 'draft',
         amount: grossTotal,
         tax_amount: vatTotal,
         issue_date: invoiceDate,
         due_date: dueDate,
         description: items.map((i) => i.description).join(', '),
       });
 
       if (error) throw error;
 
       toast({
         title: 'Rechnung erstellt',
         description: `Rechnung ${invoiceNumber} wurde als Entwurf gespeichert.`,
       });
 
       onSuccess();
       resetForm();
       onOpenChange(false);
     } catch (error) {
       console.error('Error creating invoice:', error);
       toast({
         title: 'Fehler',
         description: 'Die Rechnung konnte nicht erstellt werden.',
         variant: 'destructive',
       });
     } finally {
       setSaving(false);
     }
   };
 
   const resetForm = () => {
     setSelectedContactId('');
     setInvoiceDate(new Date().toISOString().split('T')[0]);
     setServicePeriodFrom(new Date().toISOString().split('T')[0]);
     setServicePeriodTo(new Date().toISOString().split('T')[0]);
     setPaymentTermDays(14);
     setItems([
       { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'Stück', price: 0, vatRate: 19 },
     ]);
     setActiveTab('details');
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Neue Rechnung erstellen</DialogTitle>
         </DialogHeader>
 
         <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList className="grid w-full grid-cols-2">
             <TabsTrigger value="details">Details & Positionen</TabsTrigger>
             <TabsTrigger value="preview">
               <Eye className="h-4 w-4 mr-2" />
               Vorschau
             </TabsTrigger>
           </TabsList>
 
           <TabsContent value="details" className="space-y-6 mt-4">
             {/* Rechnungsdetails */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="col-span-2">
                 <Label>Kunde</Label>
                 <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                   <SelectTrigger>
                     <SelectValue placeholder="Kunde auswählen..." />
                   </SelectTrigger>
                   <SelectContent>
                     {contacts.map((contact) => (
                       <SelectItem key={contact.id} value={contact.id}>
                         {contact.name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
 
               <div>
                 <Label>Rechnungsdatum</Label>
                 <Input
                   type="date"
                   value={invoiceDate}
                   onChange={(e) => setInvoiceDate(e.target.value)}
                 />
               </div>
 
               <div>
                 <Label>Zahlungsziel (Tage)</Label>
                 <Input
                   type="number"
                   min={1}
                   value={paymentTermDays}
                   onChange={(e) => setPaymentTermDays(parseInt(e.target.value) || 14)}
                 />
               </div>
 
               <div>
                 <Label>Leistungszeitraum von</Label>
                 <Input
                   type="date"
                   value={servicePeriodFrom}
                   onChange={(e) => setServicePeriodFrom(e.target.value)}
                 />
               </div>
 
               <div>
                 <Label>Leistungszeitraum bis</Label>
                 <Input
                   type="date"
                   value={servicePeriodTo}
                   onChange={(e) => setServicePeriodTo(e.target.value)}
                 />
               </div>
             </div>
 
             {/* Positionen-Tabelle */}
             <div>
               <div className="flex items-center justify-between mb-2">
                 <Label>Positionen</Label>
                 <Button type="button" variant="outline" size="sm" onClick={addItem}>
                   <Plus className="h-4 w-4 mr-1" />
                   Position hinzufügen
                 </Button>
               </div>
 
               <div className="border rounded-lg overflow-hidden">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead className="w-12">Pos.</TableHead>
                       <TableHead>Beschreibung</TableHead>
                       <TableHead className="w-20">Menge</TableHead>
                       <TableHead className="w-28">Einheit</TableHead>
                       <TableHead className="w-28">Einzelpreis</TableHead>
                       <TableHead className="w-24">USt.</TableHead>
                       <TableHead className="w-28 text-right">Gesamt</TableHead>
                       <TableHead className="w-12"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {items.map((item, index) => (
                       <TableRow key={item.id}>
                         <TableCell className="font-medium">{index + 1}</TableCell>
                         <TableCell>
                           <Input
                             placeholder="Beschreibung..."
                             value={item.description}
                             onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                             className="min-w-[200px]"
                           />
                         </TableCell>
                         <TableCell>
                           <Input
                             type="number"
                             min={0.01}
                             step={0.01}
                             value={item.quantity}
                             onChange={(e) =>
                               updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                             }
                           />
                         </TableCell>
                         <TableCell>
                           <Select
                             value={item.unit}
                             onValueChange={(v) => updateItem(item.id, 'unit', v)}
                           >
                             <SelectTrigger>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               {UNITS.map((unit) => (
                                 <SelectItem key={unit.value} value={unit.value}>
                                   {unit.label}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </TableCell>
                         <TableCell>
                           <Input
                             type="number"
                             min={0}
                             step={0.01}
                             value={item.price}
                             onChange={(e) =>
                               updateItem(item.id, 'price', parseFloat(e.target.value) || 0)
                             }
                           />
                         </TableCell>
                         <TableCell>
                           <Select
                             value={item.vatRate.toString()}
                             onValueChange={(v) => updateItem(item.id, 'vatRate', parseInt(v))}
                           >
                             <SelectTrigger>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               {VAT_RATES.map((rate) => (
                                 <SelectItem key={rate.value} value={rate.value}>
                                   {rate.label}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </TableCell>
                         <TableCell className="text-right font-medium">
                           {(item.quantity * item.price).toFixed(2)} €
                         </TableCell>
                         <TableCell>
                           <Button
                             type="button"
                             variant="ghost"
                             size="icon"
                             onClick={() => removeItem(item.id)}
                             disabled={items.length === 1}
                           >
                             <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
 
               {/* Summen */}
               <div className="flex justify-end mt-4">
                 <div className="w-72 space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Nettobetrag:</span>
                     <span>{netTotal.toFixed(2)} €</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">USt. gesamt:</span>
                     <span>{vatTotal.toFixed(2)} €</span>
                   </div>
                   <div className="flex justify-between font-bold text-lg pt-2 border-t">
                     <span>Gesamtbetrag:</span>
                     <span>{grossTotal.toFixed(2)} €</span>
                   </div>
                 </div>
               </div>
             </div>
           </TabsContent>
 
           <TabsContent value="preview" className="mt-4">
             <div className="space-y-4">
               {/* Action buttons for preview */}
               <div className="flex gap-2 justify-end">
                 <Button
                   variant="outline"
                   onClick={exportPDF}
                   disabled={exporting}
                 >
                   <Download className="h-4 w-4 mr-2" />
                   {exporting ? 'Exportiert...' : 'Als PDF speichern'}
                 </Button>
                 <Button variant="outline" onClick={handleSendEmail}>
                   <Mail className="h-4 w-4 mr-2" />
                   Per E-Mail senden
                 </Button>
               </div>
               
               <div className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-[55vh]">
               <InvoicePreview invoice={getPreviewData()} />
             </div>
             </div>
           </TabsContent>
         </Tabs>
 
         <DialogFooter className="mt-6">
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Abbrechen
           </Button>
           <Button
             variant="outline"
             onClick={() => setActiveTab('preview')}
           >
             <Eye className="h-4 w-4 mr-2" />
             Vorschau
           </Button>
           <Button onClick={handleSave} disabled={saving}>
             <Save className="h-4 w-4 mr-2" />
             {saving ? 'Speichert...' : 'Speichern'}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }