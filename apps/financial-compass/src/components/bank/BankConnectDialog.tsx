 import { useState } from 'react';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Checkbox } from '@/components/ui/checkbox';
 import { Label } from '@/components/ui/label';
 import { ExternalLink, Shield, Loader2 } from 'lucide-react';
 import { SupportedBank, connectBank } from '@/services/finapi';
 import { useToast } from '@/hooks/use-toast';
 
 interface BankConnectDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   bank: SupportedBank | null;
   onSuccess: () => void;
 }
 
 export function BankConnectDialog({ open, onOpenChange, bank, onSuccess }: BankConnectDialogProps) {
   const [privacyAccepted, setPrivacyAccepted] = useState(false);
   const [connecting, setConnecting] = useState(false);
   const { toast } = useToast();
 
   const handleConnect = async () => {
     if (!bank || !privacyAccepted) return;
 
     setConnecting(true);
     try {
       const redirectUrl = await connectBank(bank.code);
       
       // Simuliere erfolgreiche Verbindung (in Produktion würde hier Redirect erfolgen)
       toast({
         title: 'Verbindung simuliert',
         description: `In Produktion würden Sie zu ${bank.name} weitergeleitet: ${redirectUrl}`,
       });
       
       onSuccess();
       onOpenChange(false);
     } catch (error) {
       toast({
         title: 'Fehler',
         description: 'Verbindung konnte nicht hergestellt werden',
         variant: 'destructive',
       });
     } finally {
       setConnecting(false);
       setPrivacyAccepted(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Shield className="h-5 w-5 text-primary" />
             {bank?.name} verbinden
           </DialogTitle>
           <DialogDescription>
             Stellen Sie eine sichere Verbindung zu Ihrem Bankkonto her
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           {/* Bank Info */}
           <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
             <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
               <span className="text-lg font-bold text-primary">
                 {bank?.name.charAt(0)}
               </span>
             </div>
             <div>
               <p className="font-semibold">{bank?.name}</p>
               <p className="text-sm text-muted-foreground">Sichere PSD2-Verbindung</p>
             </div>
           </div>
 
           {/* Redirect Notice */}
          <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <ExternalLink className="h-5 w-5 text-primary mt-0.5 shrink-0" />
             <div className="text-sm">
              <p className="font-medium text-primary">
                 Weiterleitung zur Bank
               </p>
               <p className="text-muted-foreground">
                 Sie werden zur sicheren Login-Seite Ihrer Bank weitergeleitet, um die Verbindung zu autorisieren.
               </p>
             </div>
           </div>
 
           {/* Privacy Checkbox */}
           <div className="flex items-start space-x-3">
             <Checkbox
               id="privacy"
               checked={privacyAccepted}
               onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
             />
             <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
               Ich stimme der Verarbeitung meiner Bankdaten gemäß der{' '}
               <a href="#" className="text-primary hover:underline">
                 Datenschutzerklärung
               </a>{' '}
               zu und autorisiere den Zugriff auf meine Kontoinformationen.
             </Label>
           </div>
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Abbrechen
           </Button>
           <Button
             onClick={handleConnect}
             disabled={!privacyAccepted || connecting}
           >
             {connecting ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Verbinde...
               </>
             ) : (
               <>
                 <ExternalLink className="mr-2 h-4 w-4" />
                 Verbindung herstellen
               </>
             )}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }