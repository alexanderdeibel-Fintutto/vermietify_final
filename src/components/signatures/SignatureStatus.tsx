 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { CheckCircle, Clock, Eye, Bell, Link2, AlertCircle, User } from "lucide-react";
 import { useSignatures, SignatureOrder } from "@/hooks/useSignatures";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { toast } from "sonner";
 
 interface SignatureStatusProps {
   orderId?: string;
   order?: SignatureOrder;
   compact?: boolean;
 }
 
 const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
   pending: { label: "Ausstehend", color: "text-muted-foreground", icon: <Clock className="h-4 w-4" /> },
   sent: { label: "Gesendet", color: "text-blue-500", icon: <Clock className="h-4 w-4" /> },
   viewed: { label: "Angesehen", color: "text-yellow-500", icon: <Eye className="h-4 w-4" /> },
   signed: { label: "Unterschrieben", color: "text-green-500", icon: <CheckCircle className="h-4 w-4" /> },
   declined: { label: "Abgelehnt", color: "text-destructive", icon: <AlertCircle className="h-4 w-4" /> },
 };
 
 export function SignatureStatus({ orderId, order: propOrder, compact = false }: SignatureStatusProps) {
   const { orders, sendReminder } = useSignatures();
   
   const order = propOrder || orders.find(o => o.id === orderId);
   
   if (!order) return null;
 
   const signers = order.signers || [];
   const signedCount = signers.filter(s => s.status === "signed").length;
   const totalCount = signers.length;
 
   const copySigningLink = (email: string) => {
     // In real implementation, would generate/copy actual signing link
     toast.success(`Link für ${email} kopiert`);
   };
 
   if (compact) {
     return (
       <div className="flex items-center gap-2">
         <Badge variant={order.status === "signed" ? "default" : "secondary"}>
           {signedCount}/{totalCount} unterschrieben
         </Badge>
         {order.status !== "signed" && (
           <Button 
             variant="ghost" 
             size="sm"
             onClick={() => sendReminder.mutate(order.id)}
           >
             <Bell className="h-4 w-4 mr-1" />
             Erinnern
           </Button>
         )}
       </div>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <CardTitle className="text-sm flex items-center justify-between">
           <span>Signaturstatus</span>
           <Badge variant={order.status === "signed" ? "default" : "outline"}>
             {signedCount}/{totalCount}
           </Badge>
         </CardTitle>
       </CardHeader>
       <CardContent className="space-y-3">
         {signers.map((signer, index) => {
           const config = statusConfig[signer.status] || statusConfig.pending;
           return (
             <div key={index} className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <User className="h-4 w-4 text-muted-foreground" />
                 <div>
                   <p className="text-sm font-medium">{signer.name}</p>
                   <p className="text-xs text-muted-foreground">{signer.email}</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <div className={`flex items-center gap-1 ${config.color}`}>
                   {config.icon}
                   <span className="text-xs">{config.label}</span>
                 </div>
                 {signer.status !== "signed" && signer.status !== "declined" && (
                   <Button 
                     variant="ghost" 
                     size="icon"
                     className="h-6 w-6"
                     onClick={() => copySigningLink(signer.email)}
                   >
                     <Link2 className="h-3 w-3" />
                   </Button>
                 )}
               </div>
             </div>
           );
         })}
 
         {order.expires_at && order.status !== "signed" && (
           <div className="pt-2 border-t">
             <p className="text-xs text-muted-foreground">
               Gültig bis: {format(new Date(order.expires_at), "dd.MM.yyyy", { locale: de })}
             </p>
           </div>
         )}
 
         {order.status !== "signed" && (
           <Button 
             variant="outline" 
             size="sm" 
             className="w-full"
             onClick={() => sendReminder.mutate(order.id)}
           >
             <Bell className="h-4 w-4 mr-2" />
             Alle erinnern
           </Button>
         )}
       </CardContent>
     </Card>
   );
 }