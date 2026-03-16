import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTerminations } from "@/hooks/useTerminations";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  Building2,
  User,
  FileX,
  Upload,
  Loader2,
  Handshake,
  FileText,
} from "lucide-react";

const STEPS = [
  { label: "Typ wählen", icon: FileX },
  { label: "Einheit & Mieter", icon: Building2 },
  { label: "Daten", icon: Calendar },
  { label: "Dokument", icon: FileText },
  { label: "Bestätigung", icon: Check },
];

const TERMINATION_TYPES = [
  {
    value: "tenant" as const,
    label: "Mieter-Kündigung",
    description: "Der Mieter kündigt den Mietvertrag.",
    icon: User,
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
  },
  {
    value: "landlord" as const,
    label: "Vermieter-Kündigung",
    description: "Der Vermieter kündigt den Mietvertrag.",
    icon: Building2,
    color: "bg-orange-50 border-orange-200 hover:border-orange-400",
  },
  {
    value: "mutual" as const,
    label: "Einvernehmlich",
    description: "Beide Parteien vereinbaren die Auflösung.",
    icon: Handshake,
    color: "bg-green-50 border-green-200 hover:border-green-400",
  },
];

export default function TerminationWizard() {
  const navigate = useNavigate();
  const { createTermination } = useTerminations();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: "" as "tenant" | "landlord" | "mutual" | "",
    unit_id: "",
    tenant_id: "",
    notice_date: "",
    effective_date: "",
    reason: "",
    document: null as File | null,
    notes: "",
  });

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!formData.type;
      case 1:
        return !!formData.unit_id;
      case 2:
        return !!formData.notice_date && !!formData.effective_date;
      case 3:
        return true; // Document upload is optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.type || !formData.notice_date || !formData.effective_date) return;
    setIsSubmitting(true);
    try {
      await createTermination.mutateAsync({
        type: formData.type,
        unit_id: formData.unit_id || null,
        tenant_id: formData.tenant_id || null,
        notice_date: formData.notice_date,
        effective_date: formData.effective_date,
        reason: formData.reason || null,
        notes: formData.notes || null,
        status: "pending",
      });
      toast({ title: "Kündigung erfolgreich erfasst" });
      navigate("/kuendigungen");
    } catch {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Wählen Sie den Typ der Kündigung aus.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {TERMINATION_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setFormData((prev) => ({ ...prev, type: type.value }))}
                    className={`p-6 rounded-lg border-2 text-left transition-all ${type.color} ${
                      isSelected ? "ring-2 ring-primary border-primary" : ""
                    }`}
                  >
                    <Icon className="h-8 w-8 mb-3" />
                    <h3 className="font-semibold mb-1">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                    {isSelected && (
                      <Badge className="mt-3 bg-primary text-primary-foreground">
                        <Check className="h-3 w-3 mr-1" />
                        Ausgewählt
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Wählen Sie die betroffene Einheit und den Mieter aus.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Einheit *</Label>
                <Select
                  value={formData.unit_id}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, unit_id: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Einheit auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder-unit-1">Musterstr. 10, WE 1</SelectItem>
                    <SelectItem value="placeholder-unit-2">Musterstr. 10, WE 2</SelectItem>
                    <SelectItem value="placeholder-unit-3">Hauptweg 5, WE 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mieter</Label>
                <Select
                  value={formData.tenant_id}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, tenant_id: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mieter auswählen (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder-tenant-1">Müller, Anna</SelectItem>
                    <SelectItem value="placeholder-tenant-2">Schmidt, Thomas</SelectItem>
                    <SelectItem value="placeholder-tenant-3">Weber, Lisa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Legen Sie die relevanten Daten für die Kündigung fest.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Kündigungsdatum *</Label>
                <Input
                  type="date"
                  value={formData.notice_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notice_date: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Datum, an dem die Kündigung ausgesprochen wird.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Wirksamkeitsdatum *</Label>
                <Input
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, effective_date: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Datum, ab dem die Kündigung wirksam wird.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kündigungsgrund</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Grund für die Kündigung angeben..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Zusätzliche Notizen</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optionale Anmerkungen..."
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Laden Sie das Kündigungsschreiben oder relevante Dokumente hoch.
            </p>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium mb-1">Dokument hochladen</h3>
              <p className="text-sm text-muted-foreground mb-4">
                PDF, JPG oder PNG. Maximal 10 MB.
              </p>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setFormData((prev) => ({ ...prev, document: file }));
                }}
                className="max-w-xs mx-auto"
              />
              {formData.document && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{formData.document.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData((prev) => ({ ...prev, document: null }))}
                  >
                    Entfernen
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Überprüfen Sie die Angaben und bestätigen Sie die Kündigung.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Kündigungstyp</p>
                      <p className="font-medium">
                        {TERMINATION_TYPES.find((t) => t.value === formData.type)?.label || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kündigungsdatum</p>
                      <p className="font-medium">{formData.notice_date || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Wirksamkeitsdatum</p>
                      <p className="font-medium">{formData.effective_date || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Kündigungsgrund</p>
                      <p className="font-medium">{formData.reason || "Kein Grund angegeben"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dokument</p>
                      <p className="font-medium">
                        {formData.document ? formData.document.name : "Kein Dokument hochgeladen"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Notizen</p>
                      <p className="font-medium">{formData.notes || "Keine Notizen"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <p className="text-sm text-yellow-800">
                  Nach der Bestätigung wird die Kündigung mit dem Status "Ausstehend" erfasst.
                  Sie können den Status später in der Übersicht ändern.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout
      title="Neue Kündigung"
      breadcrumbs={[
        { label: "Kündigungen", href: "/kuendigungen" },
        { label: "Neue Kündigung" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Neue Kündigung erfassen"
          subtitle="Erstellen Sie eine neue Mietvertragskündigung Schritt für Schritt."
        />

        {/* Step Indicator */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                return (
                  <div key={index} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <span
                        className={`text-xs mt-1 hidden sm:block ${
                          isActive ? "font-medium text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`h-0.5 w-8 sm:w-16 mx-2 ${
                          index < currentStep ? "bg-green-500" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              Schritt {currentStep + 1}: {STEPS[currentStep].label}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? () => navigate("/kuendigungen") : handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? "Abbrechen" : "Zurück"}
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Weiter
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              Kündigung erfassen
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
