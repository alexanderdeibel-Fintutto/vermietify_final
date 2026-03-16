 import { useState } from 'react';
 import { useAuth } from '@/contexts/AuthContext';
 import { useCompany } from '@/contexts/CompanyContext';
 import { supabase } from '@/integrations/supabase/client';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
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
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { useToast } from '@/hooks/use-toast';
 import { Building2, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface NewCompanyDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 interface NewCompanyForm {
   name: string;
   legalForm: string;
   taxId: string;
   vatId: string;
   address: string;
   zip: string;
   city: string;
   chartOfAccounts: string;
   bankName: string;
   iban: string;
   bic: string;
 }
 
 const legalForms = [
   { value: 'gmbh', label: 'GmbH', description: 'Gesellschaft mit beschränkter Haftung' },
   { value: 'ug', label: 'UG', description: 'Unternehmergesellschaft (haftungsbeschränkt)' },
   { value: 'ag', label: 'AG', description: 'Aktiengesellschaft' },
   { value: 'kg', label: 'KG', description: 'Kommanditgesellschaft' },
   { value: 'ohg', label: 'OHG', description: 'Offene Handelsgesellschaft' },
   { value: 'gbr', label: 'GbR', description: 'Gesellschaft bürgerlichen Rechts' },
   { value: 'einzelunternehmen', label: 'Einzelunternehmen', description: 'Einzelkaufmann/-frau' },
 ];
 
 const steps = [
   { id: 1, title: 'Grunddaten', description: 'Name & Rechtsform' },
   { id: 2, title: 'Steuerdaten', description: 'Optional' },
   { id: 3, title: 'Adresse', description: 'Optional' },
   { id: 4, title: 'Kontenrahmen', description: 'Buchhaltung' },
   { id: 5, title: 'Bankverbindung', description: 'Optional' },
 ];
 
 export function NewCompanyDialog({ open, onOpenChange }: NewCompanyDialogProps) {
   const { user } = useAuth();
   const { refetchCompanies, setCurrentCompany } = useCompany();
   const { toast } = useToast();
   const [currentStep, setCurrentStep] = useState(1);
   const [isCreating, setIsCreating] = useState(false);
   const [form, setForm] = useState<NewCompanyForm>({
     name: '',
     legalForm: '',
     taxId: '',
     vatId: '',
     address: '',
     zip: '',
     city: '',
     chartOfAccounts: 'skr03',
     bankName: '',
     iban: '',
     bic: '',
   });
 
   const updateForm = (field: keyof NewCompanyForm, value: string) => {
     setForm(prev => ({ ...prev, [field]: value }));
   };
 
   const canProceed = () => {
     if (currentStep === 1) {
       return form.name.trim() !== '' && form.legalForm !== '';
     }
     return true;
   };
 
   const handleNext = () => {
     if (currentStep < 5) {
       setCurrentStep(prev => prev + 1);
     }
   };
 
   const handleBack = () => {
     if (currentStep > 1) {
       setCurrentStep(prev => prev - 1);
     }
   };
 
    const handleCreate = async () => {
      if (!user) return;
  
      setIsCreating(true);
      try {
        // Generate ID client-side to avoid .select() timing issues with RLS
        const companyId = crypto.randomUUID();

        // Step 1: Insert company without .select() to avoid RLS read check
        const { error: insertError } = await supabase
          .from('companies')
          .insert({
            id: companyId,
            name: form.name.trim(),
            legal_form: form.legalForm,
            tax_id: form.taxId || null,
            vat_id: form.vatId || null,
            address: form.address || null,
            zip: form.zip || null,
            city: form.city || null,
            chart_of_accounts: form.chartOfAccounts,
          });
  
        if (insertError) throw insertError;

        // Step 2: Ensure membership exists (fallback if trigger didn't fire)
        const { data: membership } = await supabase
          .from('company_members')
          .select('id')
          .eq('company_id', companyId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!membership) {
          await supabase.from('company_members').insert({
            company_id: companyId,
            user_id: user.id,
            role: 'owner',
          });
        }

        // Step 3: Now fetch the company (membership is guaranteed)
        const { data: company, error: fetchError } = await supabase
          .from('companies')
          .select('id, name, tax_id, address, legal_form, vat_id, zip, city, chart_of_accounts')
          .eq('id', companyId)
          .single();

        if (fetchError) throw fetchError;
  
        // Step 4: Create bank account if provided
        if (form.bankName && form.iban) {
          await supabase.from('bank_accounts').insert({
            company_id: companyId,
            name: form.bankName,
            iban: form.iban,
            bic: form.bic || null,
          });
        }
  
        await refetchCompanies();
        setCurrentCompany(company);
 
       toast({
         title: 'Firma erstellt',
         description: `${form.name} wurde erfolgreich angelegt.`,
       });
 
       // Reset and close
       setForm({
         name: '',
         legalForm: '',
         taxId: '',
         vatId: '',
         address: '',
         zip: '',
         city: '',
         chartOfAccounts: 'skr03',
         bankName: '',
         iban: '',
         bic: '',
       });
       setCurrentStep(1);
       onOpenChange(false);
     } catch (error) {
       console.error('Error creating company:', error);
       toast({
         title: 'Fehler',
         description: 'Die Firma konnte nicht erstellt werden.',
         variant: 'destructive',
       });
     } finally {
       setIsCreating(false);
     }
   };
 
   const renderStepContent = () => {
     switch (currentStep) {
       case 1:
         return (
           <div className="space-y-6">
             <div className="space-y-2">
               <Label htmlFor="name">Firmenname *</Label>
               <Input
                 id="name"
                 placeholder="z.B. Musterfirma"
                 value={form.name}
                 onChange={(e) => updateForm('name', e.target.value)}
               />
             </div>
             <div className="space-y-3">
               <Label>Rechtsform *</Label>
               <Select value={form.legalForm} onValueChange={(v) => updateForm('legalForm', v)}>
                 <SelectTrigger>
                   <SelectValue placeholder="Rechtsform wählen" />
                 </SelectTrigger>
                 <SelectContent>
                   {legalForms.map((lf) => (
                     <SelectItem key={lf.value} value={lf.value}>
                       <div className="flex flex-col">
                         <span className="font-medium">{lf.label}</span>
                         <span className="text-xs text-muted-foreground">{lf.description}</span>
                       </div>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
         );
 
       case 2:
         return (
           <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
               Diese Angaben sind optional und können später ergänzt werden.
             </p>
             <div className="space-y-2">
               <Label htmlFor="taxId">Steuernummer</Label>
               <Input
                 id="taxId"
                 placeholder="z.B. 123/456/78901"
                 value={form.taxId}
                 onChange={(e) => updateForm('taxId', e.target.value)}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="vatId">USt-IdNr.</Label>
               <Input
                 id="vatId"
                 placeholder="z.B. DE123456789"
                 value={form.vatId}
                 onChange={(e) => updateForm('vatId', e.target.value)}
               />
             </div>
           </div>
         );
 
       case 3:
         return (
           <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
               Die Adresse wird auf Rechnungen und Dokumenten verwendet.
             </p>
             <div className="space-y-2">
               <Label htmlFor="address">Straße und Hausnummer</Label>
               <Input
                 id="address"
                 placeholder="z.B. Musterstraße 123"
                 value={form.address}
                 onChange={(e) => updateForm('address', e.target.value)}
               />
             </div>
             <div className="grid grid-cols-3 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="zip">PLZ</Label>
                 <Input
                   id="zip"
                   placeholder="12345"
                   value={form.zip}
                   onChange={(e) => updateForm('zip', e.target.value)}
                 />
               </div>
               <div className="col-span-2 space-y-2">
                 <Label htmlFor="city">Stadt</Label>
                 <Input
                   id="city"
                   placeholder="Musterstadt"
                   value={form.city}
                   onChange={(e) => updateForm('city', e.target.value)}
                 />
               </div>
             </div>
           </div>
         );
 
       case 4:
         return (
           <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
               Der Kontenrahmen bestimmt die Struktur Ihrer Buchführung.
             </p>
             <RadioGroup
               value={form.chartOfAccounts}
               onValueChange={(v) => updateForm('chartOfAccounts', v)}
               className="space-y-3"
             >
               <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                 <RadioGroupItem value="skr03" id="skr03" className="mt-1" />
                 <div className="flex-1">
                   <Label htmlFor="skr03" className="font-medium cursor-pointer">
                     SKR03 (Empfohlen)
                   </Label>
                   <p className="text-sm text-muted-foreground">
                     Prozessgliederungsprinzip - Der am häufigsten verwendete Kontenrahmen
                   </p>
                 </div>
               </div>
               <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                 <RadioGroupItem value="skr04" id="skr04" className="mt-1" />
                 <div className="flex-1">
                   <Label htmlFor="skr04" className="font-medium cursor-pointer">
                     SKR04
                   </Label>
                   <p className="text-sm text-muted-foreground">
                     Abschlussgliederungsprinzip - Orientiert sich am Bilanzaufbau
                   </p>
                 </div>
               </div>
             </RadioGroup>
           </div>
         );
 
       case 5:
         return (
           <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
               Fügen Sie optional ein Bankkonto hinzu.
             </p>
             <div className="space-y-2">
               <Label htmlFor="bankName">Kontobezeichnung</Label>
               <Input
                 id="bankName"
                 placeholder="z.B. Geschäftskonto Sparkasse"
                 value={form.bankName}
                 onChange={(e) => updateForm('bankName', e.target.value)}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="iban">IBAN</Label>
               <Input
                 id="iban"
                 placeholder="DE89 3704 0044 0532 0130 00"
                 value={form.iban}
                 onChange={(e) => updateForm('iban', e.target.value)}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="bic">BIC</Label>
               <Input
                 id="bic"
                 placeholder="COBADEFFXXX"
                 value={form.bic}
                 onChange={(e) => updateForm('bic', e.target.value)}
               />
             </div>
           </div>
         );
 
       default:
         return null;
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Building2 className="h-5 w-5 text-primary" />
             Neue Firma erstellen
           </DialogTitle>
           <DialogDescription>
             Richten Sie eine neue Firma in wenigen Schritten ein.
           </DialogDescription>
         </DialogHeader>
 
         {/* Step Indicator */}
         <div className="flex items-center justify-between px-2 py-4">
           {steps.map((step, index) => (
             <div key={step.id} className="flex items-center">
               <div className="flex flex-col items-center">
                 <div
                   className={cn(
                     'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                     currentStep > step.id
                       ? 'bg-primary text-primary-foreground'
                       : currentStep === step.id
                       ? 'bg-primary text-primary-foreground'
                       : 'bg-muted text-muted-foreground'
                   )}
                 >
                   {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                 </div>
                 <span className="text-xs mt-1 text-center hidden sm:block">
                   {step.title}
                 </span>
               </div>
               {index < steps.length - 1 && (
                 <div
                   className={cn(
                     'w-8 md:w-12 h-0.5 mx-1',
                     currentStep > step.id ? 'bg-primary' : 'bg-muted'
                   )}
                 />
               )}
             </div>
           ))}
         </div>
 
         {/* Step Content */}
         <div className="min-h-[250px] py-4">
           <h3 className="text-lg font-semibold mb-1">{steps[currentStep - 1].title}</h3>
           <p className="text-sm text-muted-foreground mb-4">
             {steps[currentStep - 1].description}
           </p>
           {renderStepContent()}
         </div>
 
         {/* Navigation */}
         <div className="flex justify-between pt-4 border-t">
           <Button
             variant="outline"
             onClick={handleBack}
             disabled={currentStep === 1}
           >
             <ChevronLeft className="h-4 w-4 mr-1" />
             Zurück
           </Button>
 
           {currentStep < 5 ? (
             <Button onClick={handleNext} disabled={!canProceed()}>
               Weiter
               <ChevronRight className="h-4 w-4 ml-1" />
             </Button>
           ) : (
             <Button onClick={handleCreate} disabled={isCreating || !canProceed()}>
               {isCreating ? (
                 <>
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   Wird erstellt...
                 </>
               ) : (
                 <>
                   <Check className="h-4 w-4 mr-2" />
                   Firma erstellen
                 </>
               )}
             </Button>
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 }