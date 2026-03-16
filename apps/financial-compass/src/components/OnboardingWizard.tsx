import { useState } from 'react';
import { Check, Building2, CreditCard, FileText, Sparkles, ChevronRight, ChevronLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  { id: 'welcome', title: 'Willkommen', icon: Sparkles },
  { id: 'company', title: 'Firma', icon: Building2 },
  { id: 'bank', title: 'Bank', icon: CreditCard },
  { id: 'receipt', title: 'Beleg', icon: FileText },
  { id: 'done', title: 'Fertig', icon: Check },
];

const features = [
  { icon: Building2, title: 'Firmenverwaltung', description: 'Verwalten Sie mehrere Firmen an einem Ort' },
  { icon: FileText, title: 'Rechnungen & Belege', description: 'Erstellen und verwalten Sie Dokumente' },
  { icon: CreditCard, title: 'Bankanbindung', description: 'Importieren Sie Transaktionen automatisch' },
];

const legalForms = [
  { value: 'gmbh', label: 'GmbH' },
  { value: 'ug', label: 'UG (haftungsbeschränkt)' },
  { value: 'ag', label: 'Aktiengesellschaft (AG)' },
  { value: 'kg', label: 'Kommanditgesellschaft (KG)' },
  { value: 'ohg', label: 'OHG' },
  { value: 'gbr', label: 'GbR' },
  { value: 'einzelunternehmen', label: 'Einzelunternehmen' },
];

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [companyData, setCompanyData] = useState({
    name: '',
    legalForm: '',
  });
  const [dragOver, setDragOver] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      if (currentStep + 1 === steps.length - 1) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const createCompany = async () => {
    if (!companyData.name || !user) return;

    setLoading(true);
    const { error } = await supabase
      .from('companies')
      .insert({
        name: companyData.name,
        legal_form: companyData.legalForm || null,
      });

    setLoading(false);

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Firma konnte nicht erstellt werden.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Firma erstellt',
      description: `${companyData.name} wurde erfolgreich angelegt.`,
    });
    nextStep();
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Demo-Upload - just show success
    toast({
      title: 'Demo-Upload',
      description: 'Beleg wurde erfolgreich hochgeladen (Demo).',
    });
  };

  const renderStep = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Willkommen bei Fintutto!</h2>
              <p className="text-muted-foreground">
                Ihre moderne Lösung für Finanzbuchhaltung. Lassen Sie uns gemeinsam starten.
              </p>
            </div>
            
            <div className="grid gap-4 mt-8">
              {features.map((feature) => (
                <Card key={feature.title} className="text-left">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{feature.title}</p>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Firma anlegen</h2>
              <p className="text-muted-foreground">Erstellen Sie Ihre erste Firma</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Firmenname *</Label>
                <Input
                  id="companyName"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  placeholder="z.B. Muster GmbH"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalForm">Rechtsform</Label>
                <Select
                  value={companyData.legalForm}
                  onValueChange={(value) => setCompanyData({ ...companyData, legalForm: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rechtsform wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {legalForms.map((form) => (
                      <SelectItem key={form.value} value={form.value}>
                        {form.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'bank':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Bankverbindung</h2>
              <p className="text-muted-foreground">Verbinden Sie Ihr Bankkonto für automatischen Import</p>
            </div>

            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="font-medium mb-2">Bank jetzt verbinden?</p>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Importieren Sie Ihre Transaktionen automatisch von über 3.000 Banken.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={nextStep}>
                    Später
                  </Button>
                  <Button onClick={nextStep}>
                    Jetzt verbinden
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'receipt':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Erster Beleg</h2>
              <p className="text-muted-foreground">Laden Sie Ihren ersten Beleg hoch (Demo)</p>
            </div>

            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium mb-2">Beleg hierher ziehen</p>
              <p className="text-sm text-muted-foreground mb-4">
                oder klicken zum Auswählen (PDF, JPG, PNG)
              </p>
              <Button variant="outline" size="sm">
                Datei auswählen
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Sie können diesen Schritt überspringen und später Belege hochladen.
            </p>
          </div>
        );

      case 'done':
        return (
          <div className="text-center space-y-6">
            {showConfetti && (
              <div className="fixed inset-0 pointer-events-none z-50">
                {[...Array(50)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-bounce"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 2}s`,
                    }}
                  >
                    <span className="text-2xl" role="img" aria-label="celebration">🎉</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Alles eingerichtet!</h2>
              <p className="text-muted-foreground">
                Ihre Fintutto-Umgebung ist bereit. Starten Sie jetzt mit Ihrer Buchhaltung.
              </p>
            </div>

            <div className="grid gap-3 mt-6">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Firma angelegt</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Konto eingerichtet</span>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="sr-only">Onboarding</DialogTitle>
          <DialogDescription className="sr-only">Einrichtungsassistent für neue Benutzer</DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex flex-col items-center',
                    index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                      index < currentStep
                        ? 'bg-primary text-primary-foreground'
                        : index === currentStep
                        ? 'border-2 border-primary'
                        : 'border-2 border-muted'
                    )}
                  >
                    {index < currentStep ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[350px]">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Zurück
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button onClick={completeOnboarding}>
              Zum Dashboard
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : currentStep === 1 ? (
            <Button onClick={createCompany} disabled={!companyData.name || loading}>
              {loading ? 'Wird erstellt...' : 'Firma erstellen'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Weiter
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
