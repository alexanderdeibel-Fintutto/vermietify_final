 import { useState } from "react";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Checkbox } from "@/components/ui/checkbox";
 import { 
   Search, 
   Building2, 
   ChevronRight, 
   ChevronLeft,
   Shield,
   Lock,
   CheckCircle
 } from "lucide-react";
 import { useBanking } from "@/hooks/useBanking";
 import { useNavigate } from "react-router-dom";
 import { cn } from "@/lib/utils";
 
 const popularBanks = [
   { id: "sparkasse", name: "Sparkasse", logo: "🏦", bic: "DEUTDEDB" },
   { id: "volksbank", name: "Volksbank", logo: "🏛️", bic: "GENODEM" },
   { id: "dkb", name: "DKB", logo: "💳", bic: "BYLADEM" },
   { id: "ing", name: "ING", logo: "🦁", bic: "INGDDEFF" },
   { id: "commerzbank", name: "Commerzbank", logo: "🟡", bic: "COBADEFF" },
   { id: "deutsche_bank", name: "Deutsche Bank", logo: "🔵", bic: "DEUTDEFF" },
   { id: "postbank", name: "Postbank", logo: "📬", bic: "PBNKDEFF" },
   { id: "hypovereinsbank", name: "HypoVereinsbank", logo: "🔷", bic: "HYVEDEMM" },
   { id: "n26", name: "N26", logo: "🟢", bic: "NTSBDEB1" },
   { id: "comdirect", name: "comdirect", logo: "🟠", bic: "COBADEHDXXX" },
 ];
 
 export default function BankConnect() {
   const navigate = useNavigate();
   const { connectBank } = useBanking();
   const [step, setStep] = useState(1);
   const [searchQuery, setSearchQuery] = useState("");
   const [selectedBank, setSelectedBank] = useState<typeof popularBanks[0] | null>(null);
   const [credentials, setCredentials] = useState({ username: "", password: "" });
   const [selectedAccounts, setSelectedAccounts] = useState<string[]>(["main"]);
   const [agreedToTerms, setAgreedToTerms] = useState(false);
 
   const filteredBanks = popularBanks.filter(bank =>
     bank.name.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
   const handleConnect = async () => {
     if (!selectedBank) return;
     
     await connectBank.mutateAsync({
       bankId: selectedBank.id,
       bankName: selectedBank.name,
       bankBic: selectedBank.bic,
     });
     
     navigate('/banking');
   };
 
   const simulatedAccounts = [
     { id: "main", name: "Geschäftskonto", type: "Girokonto", iban: "DE89 3704 0044 0532 0130 00" },
     { id: "savings", name: "Tagesgeld", type: "Sparkonto", iban: "DE89 3704 0044 0532 0130 01" },
   ];
 
   return (
     <MainLayout 
       title="Konto verbinden"
       breadcrumbs={[
         { label: "Banking", href: "/banking" },
         { label: "Konto verbinden" }
       ]}
     >
       <div className="max-w-2xl mx-auto space-y-6">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">Bankkonto verbinden</h1>
           <p className="text-muted-foreground">Verbinden Sie Ihr Geschäftskonto sicher mit FinAPI</p>
         </div>
 
         {/* Progress Steps */}
         <div className="flex items-center justify-between mb-8">
           {[1, 2, 3, 4].map((s) => (
             <div key={s} className="flex items-center">
               <div className={cn(
                 "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                 step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
               )}>
                 {step > s ? <CheckCircle className="h-4 w-4" /> : s}
               </div>
               {s < 4 && (
                 <div className={cn(
                   "w-16 h-1 mx-2",
                   step > s ? "bg-primary" : "bg-muted"
                 )} />
               )}
             </div>
           ))}
         </div>
 
         {/* Step 1: Bank Search */}
         {step === 1 && (
           <Card>
             <CardHeader>
               <CardTitle>Bank auswählen</CardTitle>
               <CardDescription>Suchen Sie Ihre Bank oder wählen Sie aus der Liste</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   placeholder="Bank suchen..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-9"
                 />
               </div>
 
               <div className="grid grid-cols-2 gap-3">
                 {filteredBanks.map((bank) => (
                   <div
                     key={bank.id}
                     className={cn(
                       "p-4 rounded-lg border cursor-pointer transition-colors",
                       selectedBank?.id === bank.id
                         ? "border-primary bg-primary/5"
                         : "hover:border-primary/50"
                     )}
                     onClick={() => setSelectedBank(bank)}
                   >
                     <div className="flex items-center gap-3">
                       <span className="text-2xl">{bank.logo}</span>
                       <span className="font-medium">{bank.name}</span>
                     </div>
                   </div>
                 ))}
               </div>
 
               <div className="flex justify-end">
                 <Button 
                   onClick={() => setStep(2)} 
                   disabled={!selectedBank}
                 >
                   Weiter
                   <ChevronRight className="h-4 w-4 ml-2" />
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Step 2: Credentials */}
         {step === 2 && (
           <Card>
             <CardHeader>
               <div className="flex items-center gap-3 mb-2">
                 <span className="text-3xl">{selectedBank?.logo}</span>
                 <div>
                   <CardTitle>{selectedBank?.name}</CardTitle>
                   <CardDescription>Geben Sie Ihre Zugangsdaten ein</CardDescription>
                 </div>
               </div>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
                 <Shield className="h-5 w-5 text-primary mt-0.5" />
                 <div className="text-sm">
                   <p className="font-medium">Sichere Verbindung</p>
                   <p className="text-muted-foreground">
                     Ihre Zugangsdaten werden verschlüsselt über FinAPI übertragen und niemals bei uns gespeichert.
                   </p>
                 </div>
               </div>
 
               <div>
                 <Label>Benutzername / Anmeldename</Label>
                 <Input
                   value={credentials.username}
                   onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                   placeholder="Ihr Online-Banking Benutzername"
                 />
               </div>
 
               <div>
                 <Label>PIN / Passwort</Label>
                 <div className="relative">
                   <Input
                     type="password"
                     value={credentials.password}
                     onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                     placeholder="Ihre Online-Banking PIN"
                   />
                   <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 </div>
               </div>
 
               <div className="flex justify-between">
                 <Button variant="outline" onClick={() => setStep(1)}>
                   <ChevronLeft className="h-4 w-4 mr-2" />
                   Zurück
                 </Button>
                 <Button 
                   onClick={() => setStep(3)}
                   disabled={!credentials.username || !credentials.password}
                 >
                   Weiter
                   <ChevronRight className="h-4 w-4 ml-2" />
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Step 3: Select Accounts */}
         {step === 3 && (
           <Card>
             <CardHeader>
               <CardTitle>Konten auswählen</CardTitle>
               <CardDescription>Wählen Sie die Konten, die Sie verbinden möchten</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               {simulatedAccounts.map((account) => (
                 <div 
                   key={account.id}
                   className={cn(
                     "p-4 rounded-lg border cursor-pointer transition-colors",
                     selectedAccounts.includes(account.id)
                       ? "border-primary bg-primary/5"
                       : "hover:border-primary/50"
                   )}
                   onClick={() => {
                     setSelectedAccounts(prev => 
                       prev.includes(account.id)
                         ? prev.filter(id => id !== account.id)
                         : [...prev, account.id]
                     );
                   }}
                 >
                   <div className="flex items-center gap-3">
                     <Checkbox 
                       checked={selectedAccounts.includes(account.id)}
                       onCheckedChange={() => {}}
                     />
                     <Building2 className="h-5 w-5 text-muted-foreground" />
                     <div className="flex-1">
                       <p className="font-medium">{account.name}</p>
                       <p className="text-sm text-muted-foreground">{account.type}</p>
                     </div>
                     <p className="text-sm font-mono text-muted-foreground">{account.iban}</p>
                   </div>
                 </div>
               ))}
 
               <div className="flex justify-between">
                 <Button variant="outline" onClick={() => setStep(2)}>
                   <ChevronLeft className="h-4 w-4 mr-2" />
                   Zurück
                 </Button>
                 <Button 
                   onClick={() => setStep(4)}
                   disabled={selectedAccounts.length === 0}
                 >
                   Weiter
                   <ChevronRight className="h-4 w-4 ml-2" />
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Step 4: Confirmation */}
         {step === 4 && (
           <Card>
             <CardHeader>
               <CardTitle>Bestätigung</CardTitle>
               <CardDescription>Überprüfen Sie Ihre Auswahl und verbinden Sie Ihre Konten</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="bg-muted rounded-lg p-4">
                 <div className="flex items-center gap-3 mb-4">
                   <span className="text-2xl">{selectedBank?.logo}</span>
                   <div>
                     <p className="font-medium">{selectedBank?.name}</p>
                     <p className="text-sm text-muted-foreground">
                       {selectedAccounts.length} Konto(en) ausgewählt
                     </p>
                   </div>
                 </div>
 
                 <div className="space-y-2">
                   {simulatedAccounts
                     .filter(a => selectedAccounts.includes(a.id))
                     .map(account => (
                       <div key={account.id} className="flex items-center gap-2 text-sm">
                         <CheckCircle className="h-4 w-4 text-primary" />
                         <span>{account.name}</span>
                         <span className="text-muted-foreground">({account.type})</span>
                       </div>
                     ))
                   }
                 </div>
               </div>
 
               <div className="bg-muted/50 rounded-lg p-4">
                 <h4 className="font-medium mb-2">Datenschutz-Hinweis</h4>
                 <p className="text-sm text-muted-foreground">
                   Mit der Verbindung Ihres Bankkontos stimmen Sie zu, dass wir über FinAPI 
                   Ihre Transaktionsdaten abrufen dürfen. Wir speichern nur die für die 
                   Zuordnung notwendigen Daten. Sie können die Verbindung jederzeit trennen.
                 </p>
               </div>
 
               <div className="flex items-center gap-2">
                 <Checkbox 
                   id="terms"
                   checked={agreedToTerms}
                   onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                 />
                 <Label htmlFor="terms" className="text-sm">
                   Ich stimme den Nutzungsbedingungen und der Datenschutzerklärung zu
                 </Label>
               </div>
 
               <div className="flex justify-between">
                 <Button variant="outline" onClick={() => setStep(3)}>
                   <ChevronLeft className="h-4 w-4 mr-2" />
                   Zurück
                 </Button>
                 <Button 
                   onClick={handleConnect}
                   disabled={!agreedToTerms || connectBank.isPending}
                 >
                   {connectBank.isPending ? "Verbinde..." : "Konten verbinden"}
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
       </div>
     </MainLayout>
   );
 }