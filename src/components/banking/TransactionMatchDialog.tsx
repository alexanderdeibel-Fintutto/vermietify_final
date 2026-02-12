 import { useState } from "react";
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Card, CardContent } from "@/components/ui/card";
 import { 
   ArrowUpRight, 
   ArrowDownRight, 
   Lightbulb,
   User,
   Save
 } from "lucide-react";
 import { BankTransaction, useBanking } from "@/hooks/useBanking";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 interface Props {
   transaction: BankTransaction;
   tenants: Array<{ id: string; first_name: string; last_name: string }>;
   onClose: () => void;
 }
 
type TransactionType = 'rent' | 'deposit' | 'utility' | 'maintenance' | 'other';

 export function TransactionMatchDialog({ transaction, tenants, onClose }: Props) {
   const { matchTransaction } = useBanking();
   
   const [formData, setFormData] = useState({
     tenantId: transaction.matched_tenant_id || '',
     leaseId: transaction.matched_lease_id || '',
    transactionType: (transaction.transaction_type || 'rent') as TransactionType,
     createRule: false,
   });
 
   const formatCurrency = (cents: number) => {
     return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
   };
 
   const isIncome = transaction.amount_cents > 0;
 
   // Find potential matches based on name
   const suggestions = tenants.filter(t => {
     const fullName = `${t.first_name} ${t.last_name}`.toLowerCase();
     const counterpart = (transaction.counterpart_name || '').toLowerCase();
     const purpose = (transaction.purpose || '').toLowerCase();
     return counterpart.includes(t.last_name.toLowerCase()) || 
            purpose.includes(t.last_name.toLowerCase()) ||
            counterpart.includes(fullName) ||
            purpose.includes(fullName);
   });
 
   const handleSubmit = async () => {
      await matchTransaction.mutateAsync({
        transactionId: transaction.id,
        tenantId: formData.tenantId === 'none' ? undefined : formData.tenantId || undefined,
        leaseId: formData.leaseId === 'none' ? undefined : formData.leaseId || undefined,
       transactionType: formData.transactionType,
       createRule: formData.createRule,
       ruleConditions: formData.createRule ? [
         { field: 'counterpart_name', operator: 'contains', value: transaction.counterpart_name || '' }
       ] : undefined,
     });
     onClose();
   };
 
   return (
     <Dialog open onOpenChange={onClose}>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle>Transaktion zuordnen</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4">
           {/* Transaction Details */}
           <Card>
             <CardContent className="p-4">
               <div className="flex items-start justify-between">
                 <div>
                   <p className="font-medium">{transaction.counterpart_name || 'Unbekannt'}</p>
                   <p className="text-sm text-muted-foreground">{transaction.purpose || transaction.booking_text}</p>
                   <p className="text-xs text-muted-foreground mt-1">
                     {format(new Date(transaction.booking_date), "dd.MM.yyyy", { locale: de })}
                   </p>
                 </div>
                 <div className={`flex items-center gap-1 text-lg font-bold ${isIncome ? 'text-primary' : 'text-destructive'}`}>
                   {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                   {formatCurrency(Math.abs(transaction.amount_cents))}
                 </div>
               </div>
               {transaction.counterpart_iban && (
                 <p className="text-xs font-mono text-muted-foreground mt-2">
                   IBAN: {transaction.counterpart_iban}
                 </p>
               )}
             </CardContent>
           </Card>
 
           {/* Suggestions */}
           {suggestions.length > 0 && (
             <div>
               <Label className="flex items-center gap-2 mb-2">
                 <Lightbulb className="h-4 w-4 text-accent-foreground" />
                 Vorschläge
               </Label>
               <div className="space-y-2">
                 {suggestions.map(tenant => (
                   <Card 
                     key={tenant.id}
                     className={`cursor-pointer transition-colors ${formData.tenantId === tenant.id ? 'border-primary' : 'hover:border-primary/50'}`}
                     onClick={() => setFormData(prev => ({ ...prev, tenantId: tenant.id }))}
                   >
                     <CardContent className="p-3 flex items-center gap-3">
                       <User className="h-4 w-4 text-muted-foreground" />
                       <span>{tenant.first_name} {tenant.last_name}</span>
                       <Badge variant="outline" className="ml-auto">Wahrscheinlich</Badge>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             </div>
           )}
 
           {/* Manual Selection */}
           <div>
             <Label>Typ</Label>
             <Select
               value={formData.transactionType}
              onValueChange={(v) => setFormData(prev => ({ ...prev, transactionType: v as TransactionType }))}
             >
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="rent">Mietzahlung</SelectItem>
                 <SelectItem value="deposit">Kaution</SelectItem>
                 <SelectItem value="utility">Nebenkosten</SelectItem>
                 <SelectItem value="maintenance">Instandhaltung</SelectItem>
                 <SelectItem value="other">Sonstiges</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div>
             <Label>Mieter zuordnen</Label>
             <Select
               value={formData.tenantId}
               onValueChange={(v) => setFormData(prev => ({ ...prev, tenantId: v }))}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Mieter auswählen..." />
               </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Zuordnung</SelectItem>
                 {tenants.map(t => (
                   <SelectItem key={t.id} value={t.id}>
                     {t.first_name} {t.last_name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Create Rule Option */}
           <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
             <Checkbox 
               id="createRule"
               checked={formData.createRule}
               onCheckedChange={(checked) => setFormData(prev => ({ ...prev, createRule: checked as boolean }))}
             />
             <Label htmlFor="createRule" className="text-sm cursor-pointer">
               Regel erstellen für zukünftige Transaktionen mit diesem Muster
             </Label>
           </div>
 
           <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={onClose}>
               Abbrechen
             </Button>
             <Button onClick={handleSubmit} disabled={matchTransaction.isPending}>
               <Save className="h-4 w-4 mr-2" />
               Zuordnen
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }