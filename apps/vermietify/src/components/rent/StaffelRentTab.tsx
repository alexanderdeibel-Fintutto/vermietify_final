import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Plus, ChevronRight, AlertCircle, Check } from "lucide-react";
import { useRentAdjustments, StaffelStep } from "@/hooks/useRentAdjustments";
import { format, isPast, isFuture, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { LoadingState } from "@/components/shared/LoadingState";

interface StaffelContract {
  id: string;
  tenant: string;
  unit: string;
  currentRent: number;
  steps: StaffelStep[];
  currentStep: number;
  nextStep?: StaffelStep;
  daysUntilNext?: number;
}

export function StaffelRentTab() {
  const { useLeasesWithSettings } = useRentAdjustments();
  const { data: leases, isLoading } = useLeasesWithSettings();

  // Filter to staffel contracts
  const staffelContracts: StaffelContract[] = (leases || [])
    .filter((l: any) => l.lease_rent_settings?.rent_type === "staffel")
    .map((lease: any) => {
      const settings = lease.lease_rent_settings;
      const steps: StaffelStep[] = settings?.staffel_steps || [];
      const today = new Date();
      
      // Find current step
      const activeSteps = steps.filter(s => isPast(new Date(s.effective_date)));
      const currentStep = activeSteps.length;
      const currentRent = activeSteps.length > 0 
        ? activeSteps[activeSteps.length - 1].rent_cents / 100
        : lease.rent_amount;
      
      // Find next step
      const futureSteps = steps.filter(s => isFuture(new Date(s.effective_date)));
      const nextStep = futureSteps.length > 0 ? futureSteps[0] : undefined;
      const daysUntilNext = nextStep 
        ? differenceInDays(new Date(nextStep.effective_date), today)
        : undefined;

      return {
        id: lease.id,
        tenant: lease.tenants ? `${lease.tenants.first_name} ${lease.tenants.last_name}` : "Unbekannt",
        unit: lease.units ? `${lease.units.buildings?.name} - ${lease.units.unit_number}` : "Unbekannt",
        currentRent,
        steps,
        currentStep,
        nextStep,
        daysUntilNext,
      };
    });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Staffelmietverträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{staffelContracts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">
              Nächste Stufe in 30 Tagen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {staffelContracts.filter(c => c.daysUntilNext && c.daysUntilNext <= 30).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Vollständig abgeschlossen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {staffelContracts.filter(c => !c.nextStep).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contract List */}
      {staffelContracts.length > 0 ? (
        <div className="space-y-4">
          {staffelContracts.map((contract) => (
            <Card key={contract.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{contract.tenant}</CardTitle>
                    <CardDescription>{contract.unit}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Aktuelle Miete</p>
                    <p className="text-xl font-bold">{contract.currentRent.toFixed(2)} €</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fortschritt</span>
                    <span>Stufe {contract.currentStep} von {contract.steps.length}</span>
                  </div>
                  <Progress 
                    value={(contract.currentStep / contract.steps.length) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  {contract.steps.map((step, index) => {
                    const isActive = index < contract.currentStep;
                    const isCurrent = index === contract.currentStep - 1;
                    const isNext = index === contract.currentStep;
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isCurrent 
                            ? "border-primary bg-primary/5" 
                            : isNext 
                              ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20"
                              : isActive 
                                ? "border-green-200 bg-green-50 dark:bg-green-950/20" 
                                : "border-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isActive 
                              ? "bg-green-500 text-white" 
                              : isNext 
                                ? "bg-orange-500 text-white"
                                : "bg-muted text-muted-foreground"
                          }`}>
                            {isActive ? <Check className="h-4 w-4" /> : step.step_number}
                          </div>
                          <div>
                            <p className="font-medium">Stufe {step.step_number}</p>
                            <p className="text-sm text-muted-foreground">
                              Ab {format(new Date(step.effective_date), "dd.MM.yyyy", { locale: de })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{(step.rent_cents / 100).toFixed(2)} €</p>
                          {isNext && contract.daysUntilNext && (
                            <Badge variant="outline" className="text-orange-600">
                              In {contract.daysUntilNext} Tagen
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Next Step Alert */}
                {contract.nextStep && contract.daysUntilNext && contract.daysUntilNext <= 30 && (
                  <div className="mt-4 flex items-center gap-2 text-orange-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      Nächste Mietsteigerung auf {(contract.nextStep.rent_cents / 100).toFixed(2)} € in {contract.daysUntilNext} Tagen
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Keine Staffelmietverträge</p>
            <p className="text-sm text-muted-foreground mb-4">
              Staffelmietverträge können bei der Vertragserstellung konfiguriert werden
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Staffelmiete einrichten
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}