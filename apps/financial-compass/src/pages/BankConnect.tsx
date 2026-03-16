 import { useState } from 'react';
 import { Building2, CheckCircle2, XCircle, RefreshCw, Link2, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { useCompany } from '@/contexts/CompanyContext';
 import { SUPPORTED_BANKS, SupportedBank, BankConnection, syncAccount } from '@/services/finapi';
 import { BankConnectDialog } from '@/components/bank/BankConnectDialog';
 import { useToast } from '@/hooks/use-toast';
 
 // Simulierte verbundene Konten (später aus DB)
 const mockConnections: Record<string, BankConnection> = {
   sparkasse: {
     id: 'conn-1',
     bankName: 'Sparkasse',
     iban: 'DE89 3704 0044 0532 0130 00',
     lastSync: '2026-02-05T10:30:00',
     status: 'active',
   },
 };
 
 export default function BankConnect() {
   const { currentCompany } = useCompany();
   const { toast } = useToast();
   const [connections, setConnections] = useState<Record<string, BankConnection>>(mockConnections);
   const [selectedBank, setSelectedBank] = useState<SupportedBank | null>(null);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [syncingId, setSyncingId] = useState<string | null>(null);
 
   const handleConnectClick = (bank: SupportedBank) => {
     setSelectedBank(bank);
     setDialogOpen(true);
   };
 
   const handleConnectionSuccess = () => {
     if (!selectedBank) return;
     
     // Simuliere neue Verbindung
     setConnections(prev => ({
       ...prev,
       [selectedBank.code]: {
         id: `conn-${Date.now()}`,
         bankName: selectedBank.name,
         iban: 'DE** **** **** **** ** **',
         lastSync: new Date().toISOString(),
         status: 'active',
       },
     }));
     
     toast({
       title: 'Bank verbunden',
       description: `${selectedBank.name} wurde erfolgreich verbunden`,
     });
   };
 
   const handleSync = async (bankCode: string) => {
     const connection = connections[bankCode];
     if (!connection) return;
 
     setSyncingId(bankCode);
     try {
       await syncAccount(connection.id);
       setConnections(prev => ({
         ...prev,
         [bankCode]: {
           ...prev[bankCode],
           lastSync: new Date().toISOString(),
         },
       }));
       toast({
         title: 'Synchronisiert',
         description: `${connection.bankName} wurde aktualisiert`,
       });
     } catch (error) {
       toast({
         title: 'Sync fehlgeschlagen',
         description: 'Bitte versuchen Sie es später erneut',
         variant: 'destructive',
       });
     } finally {
       setSyncingId(null);
     }
   };
 
   const formatLastSync = (isoDate: string) => {
     const date = new Date(isoDate);
     return date.toLocaleString('de-DE', {
       day: '2-digit',
       month: '2-digit',
       year: 'numeric',
       hour: '2-digit',
       minute: '2-digit',
     });
   };
 
   const getStatusBadge = (status: BankConnection['status']) => {
     switch (status) {
       case 'active':
         return (
          <Badge className="bg-success/10 text-success border-success/20">
             <CheckCircle2 className="mr-1 h-3 w-3" />
             Verbunden
           </Badge>
         );
       case 'expired':
         return (
          <Badge variant="outline" className="text-warning border-warning/50">
             Erneuerung nötig
           </Badge>
         );
       case 'error':
         return (
           <Badge variant="destructive">
             <XCircle className="mr-1 h-3 w-3" />
             Fehler
           </Badge>
         );
     }
   };
 
   if (!currentCompany) {
     return (
       <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
         Bitte wählen Sie eine Firma aus.
       </div>
     );
   }
 
   return (
     <div className="space-y-6 animate-fade-in">
       <div>
         <h1 className="text-3xl font-bold mb-2">Bankkonten verbinden</h1>
         <p className="text-muted-foreground">
           Verbinden Sie Ihre Bankkonten für automatischen Kontoabruf
         </p>
       </div>
 
       {/* Info Box */}
       <div className="glass rounded-xl p-6">
         <div className="flex items-start gap-4">
           <div className="p-3 rounded-lg bg-primary/10">
             <Building2 className="h-6 w-6 text-primary" />
           </div>
           <div>
             <h3 className="font-semibold mb-1">Sichere PSD2-Verbindung</h3>
             <p className="text-sm text-muted-foreground">
               Ihre Bankdaten werden über die regulierte PSD2-Schnittstelle abgerufen. 
               Wir haben keinen Zugriff auf Ihre Zugangsdaten - die Autorisierung erfolgt direkt bei Ihrer Bank.
             </p>
           </div>
         </div>
       </div>
 
       {/* Bank List */}
       <div className="space-y-3">
         <h2 className="text-lg font-semibold">Unterstützte Banken</h2>
         <div className="grid gap-3">
           {SUPPORTED_BANKS.map((bank) => {
             const connection = connections[bank.code];
             const isSyncing = syncingId === bank.code;
 
             return (
               <div
                 key={bank.code}
                 className="glass rounded-xl p-4 flex items-center justify-between gap-4"
               >
                 <div className="flex items-center gap-4">
                   {/* Bank Logo/Initial */}
                   <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                     <span className="text-lg font-bold text-primary">
                       {bank.name.charAt(0)}
                     </span>
                   </div>
 
                   {/* Bank Info */}
                   <div>
                     <p className="font-semibold">{bank.name}</p>
                     {connection ? (
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <span className="font-mono">{connection.iban}</span>
                         <span>•</span>
                         <span>Zuletzt: {formatLastSync(connection.lastSync)}</span>
                       </div>
                     ) : (
                       <p className="text-sm text-muted-foreground">Nicht verbunden</p>
                     )}
                   </div>
                 </div>
 
                 {/* Status & Actions */}
                 <div className="flex items-center gap-3">
                   {connection ? (
                     <>
                       {getStatusBadge(connection.status)}
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleSync(bank.code)}
                         disabled={isSyncing}
                       >
                         {isSyncing ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <RefreshCw className="h-4 w-4" />
                         )}
                         <span className="ml-2 hidden sm:inline">Synchronisieren</span>
                       </Button>
                     </>
                   ) : (
                     <Button onClick={() => handleConnectClick(bank)}>
                       <Link2 className="mr-2 h-4 w-4" />
                       Bank verbinden
                     </Button>
                   )}
                 </div>
               </div>
             );
           })}
         </div>
       </div>
 
       {/* Connect Dialog */}
       <BankConnectDialog
         open={dialogOpen}
         onOpenChange={setDialogOpen}
         bank={selectedBank}
         onSuccess={handleConnectionSuccess}
       />
     </div>
   );
 }