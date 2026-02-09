import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useBuildings } from "@/hooks/useBuildings";
import { useTenants } from "@/hooks/useTenants";
import { useRentalOffers } from "@/hooks/useRentalOffers";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { OfferStepUnit } from "./wizard/OfferStepUnit";
import { OfferStepTenant } from "./wizard/OfferStepTenant";
import { OfferStepPricing } from "./wizard/OfferStepPricing";
import { OfferStepSummary } from "./wizard/OfferStepSummary";
import { Building2, UserPlus, Euro, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  { id: 1, title: "Einheit", icon: Building2 },
  { id: 2, title: "Interessent", icon: UserPlus },
  { id: 3, title: "Preiskalkulation", icon: Euro },
  { id: 4, title: "Zusammenfassung", icon: CheckCircle },
];

export interface OfferWizardData {
  // Step 1
  buildingId: string;
  unitId: string;
  selectedUnit: any;
  selectedBuilding: any;

  // Step 2
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  isSocialBenefits: boolean;
  householdSize: number;
  incomeCents: number;
  previousLandlord: string;
  schufaStatus: string;

  // Step 3
  rentAmountCents: number;
  utilityAdvanceCents: number;
  heatingAdvanceCents: number;
  depositAmountCents: number;
  totalAmountCents: number;
  proposedStartDate: string;
  proposedEndDate: string;
  validUntil: string;
  isKduEligible: boolean;
  kduRateId: string;
  kduMaxTotalCents: number;
  specialAgreements: string;

  // Step 4
  confirmed: boolean;
}

const initialData: OfferWizardData = {
  buildingId: "",
  unitId: "",
  selectedUnit: null,
  selectedBuilding: null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  isSocialBenefits: false,
  householdSize: 1,
  incomeCents: 0,
  previousLandlord: "",
  schufaStatus: "",
  rentAmountCents: 0,
  utilityAdvanceCents: 0,
  heatingAdvanceCents: 0,
  depositAmountCents: 0,
  totalAmountCents: 0,
  proposedStartDate: "",
  proposedEndDate: "",
  validUntil: "",
  isKduEligible: false,
  kduRateId: "",
  kduMaxTotalCents: 0,
  specialAgreements: "",
  confirmed: false,
};

export function OfferWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { createTenant } = useTenants();
  const { createOffer } = useRentalOffers();

  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OfferWizardData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateData = useCallback((updates: Partial<OfferWizardData>) => {
    setData((prev) => {
      const next = { ...prev, ...updates };
      // Auto-calculate total
      next.totalAmountCents = next.rentAmountCents + next.utilityAdvanceCents + next.heatingAdvanceCents;
      return next;
    });
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1: return !!data.buildingId && !!data.unitId;
      case 2: return !!data.firstName && !!data.lastName;
      case 3: return data.rentAmountCents > 0 && !!data.proposedStartDate;
      case 4: return data.confirmed;
      default: return false;
    }
  }, [currentStep, data]);

  const handleSubmit = async () => {
    if (!profile?.organization_id) {
      toast({ title: "Fehler", description: "Organisation nicht gefunden.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create tenant as "interessent"
      const newTenant = await createTenant.mutateAsync({
        organization_id: profile.organization_id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
      });

      // Update tenant with additional fields
      await supabase.from("tenants").update({
        status: "interessent",
        is_social_benefits: data.isSocialBenefits,
        household_size: data.householdSize,
        income_cents: data.incomeCents || null,
        previous_landlord: data.previousLandlord || null,
        schufa_status: data.schufaStatus || null,
        birth_date: data.birthDate || null,
      }).eq("id", newTenant.id);

      // 2. Create rental offer
      const offer = await createOffer.mutateAsync({
        organization_id: profile.organization_id,
        unit_id: data.unitId,
        tenant_id: newTenant.id,
        rent_amount_cents: data.rentAmountCents,
        utility_advance_cents: data.utilityAdvanceCents,
        heating_advance_cents: data.heatingAdvanceCents,
        total_amount_cents: data.totalAmountCents,
        deposit_amount_cents: data.depositAmountCents,
        proposed_start_date: data.proposedStartDate,
        proposed_end_date: data.proposedEndDate || undefined,
        valid_until: data.validUntil || undefined,
        is_kdu_eligible: data.isKduEligible,
        kdu_rate_id: data.kduRateId || undefined,
        kdu_max_total_cents: data.kduMaxTotalCents || undefined,
        special_agreements: data.specialAgreements || undefined,
        status: "draft",
        created_by: profile.user_id,
      });

      // 3. Auto-create tasks
      const taskTitles = [
        `SCHUFA prüfen: ${data.firstName} ${data.lastName}`,
        `Unterlagen anfordern: ${data.firstName} ${data.lastName}`,
        `Mietschuldenfreiheit prüfen: ${data.firstName} ${data.lastName}`,
        `Besichtigungstermin: ${data.selectedUnit?.unit_number || "Einheit"}`,
      ];

      for (const title of taskTitles) {
        await supabase.from("tasks").insert({
          organization_id: profile.organization_id,
          title,
          category: "other" as const,
          status: "open" as const,
          priority: "medium",
          source: "landlord" as const,
          unit_id: data.unitId,
          created_by: profile.user_id,
        });
      }

      // 4. Create calendar event for viewing
      const startDate = data.proposedStartDate ? new Date(data.proposedStartDate) : new Date();
      const viewingDate = new Date();
      viewingDate.setDate(viewingDate.getDate() + 3); // 3 days from now

      await supabase.from("calendar_events").insert({
        organization_id: profile.organization_id,
        title: `Besichtigung: ${data.selectedUnit?.unit_number} - ${data.firstName} ${data.lastName}`,
        start_at: viewingDate.toISOString(),
        end_at: new Date(viewingDate.getTime() + 60 * 60 * 1000).toISOString(),
        category: "viewing",
        created_by: profile.user_id,
        related_type: "unit",
        related_id: data.unitId,
      });

      toast({
        title: "Mietangebot erstellt",
        description: "Interessent, Angebot, Aufgaben und Besichtigungstermin wurden angelegt.",
      });

      navigate(`/angebote/${offer.id}`);
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = (currentStep / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div key={step.id} className={`flex items-center ${index < STEPS.length - 1 ? "flex-1" : ""}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted || isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="py-6">
          {currentStep === 1 && <OfferStepUnit data={data} updateData={updateData} />}
          {currentStep === 2 && <OfferStepTenant data={data} updateData={updateData} />}
          {currentStep === 3 && <OfferStepPricing data={data} updateData={updateData} />}
          {currentStep === 4 && <OfferStepSummary data={data} updateData={updateData} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep((s) => s - 1)} disabled={currentStep === 1}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Zurück
        </Button>
        {currentStep < 4 ? (
          <Button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed()}>
            Weiter <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}>
            {isSubmitting ? "Wird erstellt..." : "Angebot erstellen"}
          </Button>
        )}
      </div>
    </div>
  );
}
