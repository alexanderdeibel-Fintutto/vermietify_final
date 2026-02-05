 import { useState, useEffect } from "react";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent } from "@/components/ui/card";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { usePayments } from "@/hooks/usePayments";
 import { formatCurrency } from "@/lib/utils";
 import { Euro, AlertCircle } from "lucide-react";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 
 interface PartialPaymentDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   lease: any;
 }
 
 export function PartialPaymentDialog({
   open,
   onOpenChange,
   lease,
 }: PartialPaymentDialogProps) {
   const { recordPartialPayment } = usePayments();
 
   const [formData, setFormData] = useState({
     paidAmount: "",
     transactionDate: new Date().toISOString().split("T")[0],
     paymentMethod: "transfer" as "transfer" | "direct_debit" | "cash",
   });
 
   const originalAmount = lease?.totalDue || 0;
   const paidAmount = parseFloat(formData.paidAmount || "0") * 100;
   const remainingAmount = Math.max(0, originalAmount - paidAmount);
 
   useEffect(() => {
     if (lease) {
       setFormData((prev) => ({
         ...prev,
         paidAmount: "",
       }));
     }
   }, [lease]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
 
     if (!lease) return;
 
     await recordPartialPayment.mutateAsync({
       leaseId: lease.id,
       originalAmount,
       paidAmount: Math.round(paidAmount),
       transactionDate: formData.transactionDate,
       paymentMethod: formData.paymentMethod,
     });
 
     onOpenChange(false);
     setFormData({
       paidAmount: "",
       transactionDate: new Date().toISOString().split("T")[0],
       paymentMethod: "transfer",
     });
   };
 
   if (!lease) return null;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[500px]">
         <DialogHeader>
           <DialogTitle>Teilzahlung erfassen</DialogTitle>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           {/* Tenant Info */}
           <Card className="bg-muted/50">
             <CardContent className="pt-4">
               <p className="font-medium">
                 {lease.tenants?.first_name} {lease.tenants?.last_name}
               </p>
               <p className="text-sm text-muted-foreground">
                 {lease.units?.unit_number} • {lease.units?.buildings?.name}
               </p>
             </CardContent>
           </Card>
 
           {/* Amount Breakdown */}
           <div className="space-y-3">
             <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
               <span className="text-muted-foreground">Ursprungsbetrag</span>
               <span className="font-semibold">{formatCurrency(originalAmount / 100)}</span>
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="paidAmount">Gezahlter Betrag (€)</Label>
               <div className="relative">
                 <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                 <Input
                   id="paidAmount"
                   type="number"
                   step="0.01"
                   min="0"
                   max={(originalAmount / 100).toFixed(2)}
                   value={formData.paidAmount}
                   onChange={(e) =>
                     setFormData((prev) => ({ ...prev, paidAmount: e.target.value }))
                   }
                   className="pl-9"
                   required
                 />
               </div>
             </div>
 
             <div className="flex justify-between items-center p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
               <span className="text-destructive font-medium">Restbetrag</span>
               <span className="font-bold text-destructive">
                 {formatCurrency(remainingAmount / 100)}
               </span>
             </div>
           </div>
 
           {remainingAmount > 0 && (
             <Alert>
               <AlertCircle className="h-4 w-4" />
               <AlertDescription>
                 Der Restbetrag von {formatCurrency(remainingAmount / 100)} bleibt als
                 offener Posten bestehen.
               </AlertDescription>
             </Alert>
           )}
 
           {/* Date */}
           <div className="space-y-2">
             <Label htmlFor="date">Zahlungsdatum</Label>
             <Input
               id="date"
               type="date"
               value={formData.transactionDate}
               onChange={(e) =>
                 setFormData((prev) => ({ ...prev, transactionDate: e.target.value }))
               }
               required
             />
           </div>
 
           {/* Payment Method */}
           <div className="space-y-2">
             <Label htmlFor="method">Zahlungsmethode</Label>
             <Select
               value={formData.paymentMethod}
               onValueChange={(value: "transfer" | "direct_debit" | "cash") =>
                 setFormData((prev) => ({ ...prev, paymentMethod: value }))
               }
             >
               <SelectTrigger id="method">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="transfer">Überweisung</SelectItem>
                 <SelectItem value="direct_debit">Lastschrift</SelectItem>
                 <SelectItem value="cash">Bar</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               Abbrechen
             </Button>
             <Button
               type="submit"
               disabled={recordPartialPayment.isPending || !formData.paidAmount}
             >
               {recordPartialPayment.isPending ? "Wird gespeichert..." : "Teilzahlung erfassen"}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }