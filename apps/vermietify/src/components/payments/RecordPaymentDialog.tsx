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
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { usePayments } from "@/hooks/usePayments";
 import { useContracts } from "@/hooks/useContracts";
 import { formatCurrency } from "@/lib/utils";
 import { Euro } from "lucide-react";
 
 interface RecordPaymentDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   preselectedLease?: any;
 }
 
 export function RecordPaymentDialog({
   open,
   onOpenChange,
   preselectedLease,
 }: RecordPaymentDialogProps) {
   const { recordPayment } = usePayments();
   const { useContractsList } = useContracts();
   const { data: contracts } = useContractsList({ isActive: true });
 
   const [formData, setFormData] = useState({
     leaseId: "",
     amount: "",
     transactionDate: new Date().toISOString().split("T")[0],
     paymentMethod: "transfer" as "transfer" | "direct_debit" | "cash",
     reference: "",
     transactionType: "rent" as "rent" | "deposit" | "utility",
   });
 
   useEffect(() => {
     if (preselectedLease) {
       setFormData((prev) => ({
         ...prev,
         leaseId: preselectedLease.id,
         amount: (preselectedLease.totalDue / 100).toFixed(2),
       }));
     }
   }, [preselectedLease]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
 
     await recordPayment.mutateAsync({
       leaseId: formData.leaseId,
       amount: Math.round(parseFloat(formData.amount) * 100),
       transactionDate: formData.transactionDate,
       paymentMethod: formData.paymentMethod,
       reference: formData.reference || undefined,
       transactionType: formData.transactionType,
     });
 
     onOpenChange(false);
     setFormData({
       leaseId: "",
       amount: "",
       transactionDate: new Date().toISOString().split("T")[0],
       paymentMethod: "transfer",
       reference: "",
       transactionType: "rent",
     });
   };
 
   const selectedContract = contracts?.find((c: any) => c.id === formData.leaseId);
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[500px]">
         <DialogHeader>
           <DialogTitle>Zahlung erfassen</DialogTitle>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           {/* Lease Selection */}
           <div className="space-y-2">
             <Label htmlFor="lease">Mietvertrag</Label>
             <Select
               value={formData.leaseId}
               onValueChange={(value) =>
                 setFormData((prev) => ({ ...prev, leaseId: value }))
               }
               disabled={!!preselectedLease}
             >
               <SelectTrigger id="lease">
                 <SelectValue placeholder="Vertrag auswählen" />
               </SelectTrigger>
               <SelectContent>
                 {contracts?.map((contract: any) => (
                   <SelectItem key={contract.id} value={contract.id}>
                     {contract.tenants?.first_name} {contract.tenants?.last_name} -{" "}
                     {contract.units?.unit_number}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
             {selectedContract && (
               <p className="text-sm text-muted-foreground">
                 Erwartete Miete:{" "}
                 {formatCurrency(
                   (Number(selectedContract.rent_amount) +
                     Number(selectedContract.utility_advance || 0)) /
                     100
                 )}
               </p>
             )}
           </div>
 
           {/* Transaction Type */}
           <div className="space-y-2">
             <Label htmlFor="type">Zahlungstyp</Label>
             <Select
               value={formData.transactionType}
               onValueChange={(value: "rent" | "deposit" | "utility") =>
                 setFormData((prev) => ({ ...prev, transactionType: value }))
               }
             >
               <SelectTrigger id="type">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="rent">Miete</SelectItem>
                 <SelectItem value="deposit">Kaution</SelectItem>
                 <SelectItem value="utility">Nebenkosten-Nachzahlung</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           {/* Amount */}
           <div className="space-y-2">
             <Label htmlFor="amount">Betrag (€)</Label>
             <div className="relative">
               <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input
                 id="amount"
                 type="number"
                 step="0.01"
                 min="0"
                 value={formData.amount}
                 onChange={(e) =>
                   setFormData((prev) => ({ ...prev, amount: e.target.value }))
                 }
                 className="pl-9"
                 required
               />
             </div>
           </div>
 
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
 
           {/* Reference */}
           <div className="space-y-2">
             <Label htmlFor="reference">Verwendungszweck / Referenz</Label>
             <Input
               id="reference"
               value={formData.reference}
               onChange={(e) =>
                 setFormData((prev) => ({ ...prev, reference: e.target.value }))
               }
               placeholder="Optional"
             />
           </div>
 
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               Abbrechen
             </Button>
             <Button type="submit" disabled={recordPayment.isPending || !formData.leaseId}>
               {recordPayment.isPending ? "Wird gespeichert..." : "Zahlung erfassen"}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }