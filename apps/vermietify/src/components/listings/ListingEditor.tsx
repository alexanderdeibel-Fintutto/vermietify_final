import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronRight, 
  ChevronLeft, 
  Building2, 
  FileText, 
  Euro, 
  ImageIcon, 
  Globe,
  Upload,
  X,
  GripVertical
} from "lucide-react";
import { useUnits } from "@/hooks/useUnits";
import { useListings, LISTING_FEATURES, PORTAL_INFO, ListingFormData, ListingWithDetails } from "@/hooks/useListings";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type PortalType = Database["public"]["Enums"]["portal_type"];
type ListingStatus = Database["public"]["Enums"]["listing_status"];

interface ListingEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing?: ListingWithDetails | null;
}

const STEPS = [
  { id: 1, title: "Einheit & Grunddaten", icon: Building2 },
  { id: 2, title: "Details", icon: FileText },
  { id: 3, title: "Preise", icon: Euro },
  { id: 4, title: "Fotos", icon: ImageIcon },
  { id: 5, title: "Portale & Veröffentlichung", icon: Globe },
];

const ENERGY_CLASSES = ["A+", "A", "B", "C", "D", "E", "F", "G", "H"];

export function ListingEditor({ open, onOpenChange, listing }: ListingEditorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>({
    unit_id: "",
    title: "",
    description: "",
    rent_cold: 0,
    rent_additional: 0,
    heating_included: true,
    heating_costs: 0,
    deposit: 0,
    commission: "",
    features: {},
    photos: [],
    main_photo_index: 0,
    available_from: "",
    energy_certificate_type: "",
    energy_value: undefined,
    energy_class: "",
    status: "draft",
    portals: [],
  });

  const { useUnitsList } = useUnits();
  const { data: units, isLoading: unitsLoading } = useUnitsList();
  const { createListing, updateListing } = useListings();

  // Get available (vacant) units
  const availableUnits = units?.filter(u => u.status === "vacant") || [];
  const selectedUnit = units?.find(u => u.id === formData.unit_id);

  // Initialize form with existing listing data
  useEffect(() => {
    if (listing) {
      setFormData({
        unit_id: listing.unit_id,
        title: listing.title,
        description: listing.description || "",
        rent_cold: (listing.rent_cold || 0) / 100,
        rent_additional: (listing.rent_additional || 0) / 100,
        heating_included: listing.heating_included ?? true,
        heating_costs: (listing.heating_costs || 0) / 100,
        deposit: (listing.deposit || 0) / 100,
        commission: listing.commission || "",
        features: (listing.features as Record<string, boolean>) || {},
        photos: listing.photos || [],
        main_photo_index: listing.main_photo_index || 0,
        available_from: listing.available_from || "",
        energy_certificate_type: listing.energy_certificate_type || "",
        energy_value: listing.energy_value ? Number(listing.energy_value) : undefined,
        energy_class: listing.energy_class || "",
        status: listing.status,
        portals: listing.portals?.map(p => p.portal) || [],
      });
    } else {
      // Reset form for new listing
      setFormData({
        unit_id: "",
        title: "",
        description: "",
        rent_cold: 0,
        rent_additional: 0,
        heating_included: true,
        heating_costs: 0,
        deposit: 0,
        commission: "",
        features: {},
        photos: [],
        main_photo_index: 0,
        available_from: "",
        energy_certificate_type: "",
        energy_value: undefined,
        energy_class: "",
        status: "draft",
        portals: [],
      });
      setCurrentStep(1);
    }
  }, [listing, open]);

  // Auto-fill when unit is selected
  useEffect(() => {
    if (selectedUnit && !listing) {
      setFormData(prev => ({
        ...prev,
        rent_cold: selectedUnit.rent_amount || 0,
        rent_additional: selectedUnit.utility_advance || 0,
        title: `${selectedUnit.rooms}-Zimmer-Wohnung in ${(selectedUnit as any).buildings?.city || ""}`,
      }));
    }
  }, [selectedUnit, listing]);

  const updateFormData = (updates: Partial<ListingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features?.[feature],
      },
    }));
  };

  const handlePortalToggle = (portal: PortalType) => {
    setFormData(prev => {
      const currentPortals = prev.portals || [];
      if (currentPortals.includes(portal)) {
        return { ...prev, portals: currentPortals.filter(p => p !== portal) };
      } else {
        return { ...prev, portals: [...currentPortals, portal] };
      }
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // In a real app, you'd upload to storage and get URLs
      // For now, we'll create object URLs (demo purposes)
      const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
      setFormData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...newPhotos],
      }));
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index),
      main_photo_index: prev.main_photo_index === index ? 0 : 
        prev.main_photo_index && prev.main_photo_index > index ? prev.main_photo_index - 1 : prev.main_photo_index,
    }));
  };

  const setMainPhoto = (index: number) => {
    setFormData(prev => ({ ...prev, main_photo_index: index }));
  };

  const handleSubmit = async (publishNow: boolean) => {
    const dataToSubmit = {
      ...formData,
      status: publishNow ? "active" as ListingStatus : "draft" as ListingStatus,
    };

    if (listing) {
      await updateListing.mutateAsync({ id: listing.id, data: dataToSubmit });
    } else {
      await createListing.mutateAsync(dataToSubmit);
    }

    onOpenChange(false);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.unit_id && formData.title;
      case 2:
        return true; // Details are optional
      case 3:
        return formData.rent_cold > 0;
      case 4:
        return true; // Photos are optional but recommended
      case 5:
        return true;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Einheit auswählen *</Label>
              <Select
                value={formData.unit_id}
                onValueChange={(value) => updateFormData({ unit_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Verfügbare Einheit wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUnits.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.buildings?.name} - {unit.unit_number} ({unit.rooms} Zimmer, {unit.area} m²)
                    </SelectItem>
                  ))}
                  {availableUnits.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">
                      Keine verfügbaren Einheiten
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedUnit && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Einheitsdaten (vorausgefüllt)</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Adresse:</span>
                      <p>{(selectedUnit as any).buildings?.address}, {(selectedUnit as any).buildings?.city}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Größe:</span>
                      <p>{selectedUnit.area} m²</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Zimmer:</span>
                      <p>{selectedUnit.rooms}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Etage:</span>
                      <p>{selectedUnit.floor || "EG"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Titel * (max. 100 Zeichen)</Label>
              <Input
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value.slice(0, 100) })}
                placeholder="z.B. Helle 3-Zimmer-Wohnung mit Balkon"
              />
              <p className="text-xs text-muted-foreground">{formData.title.length}/100 Zeichen</p>
            </div>

            <div className="space-y-2">
              <Label>Verfügbar ab</Label>
              <Input
                type="date"
                value={formData.available_from}
                onChange={(e) => updateFormData({ available_from: e.target.value })}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Beschreibung (max. 2000 Zeichen)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value.slice(0, 2000) })}
                placeholder="Beschreiben Sie die Wohnung..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">{formData.description?.length || 0}/2000 Zeichen</p>
            </div>

            <div className="space-y-3">
              <Label>Ausstattung</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(LISTING_FEATURES).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={formData.features?.[key] || false}
                      onCheckedChange={() => handleFeatureToggle(key)}
                    />
                    <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Energieausweis</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Ausweistyp</Label>
                  <Select
                    value={formData.energy_certificate_type}
                    onValueChange={(value) => updateFormData({ energy_certificate_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demand">Bedarfsausweis</SelectItem>
                      <SelectItem value="consumption">Verbrauchsausweis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Energieklasse</Label>
                  <Select
                    value={formData.energy_class}
                    onValueChange={(value) => updateFormData({ energy_class: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Klasse..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ENERGY_CLASSES.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Energiekennwert (kWh/m²a)</Label>
                <Input
                  type="number"
                  value={formData.energy_value || ""}
                  onChange={(e) => updateFormData({ energy_value: parseFloat(e.target.value) || undefined })}
                  placeholder="z.B. 85"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kaltmiete * (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rent_cold || ""}
                  onChange={(e) => updateFormData({ rent_cold: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Nebenkosten (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rent_additional || ""}
                  onChange={(e) => updateFormData({ rent_additional: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="heating_included"
                  checked={formData.heating_included}
                  onCheckedChange={(checked) => updateFormData({ heating_included: !!checked })}
                />
                <Label htmlFor="heating_included" className="cursor-pointer">
                  Heizkosten in Nebenkosten enthalten
                </Label>
              </div>

              {!formData.heating_included && (
                <div className="space-y-2">
                  <Label>Heizkosten (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.heating_costs || ""}
                    onChange={(e) => updateFormData({ heating_costs: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Kaution (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.deposit || ""}
                onChange={(e) => updateFormData({ deposit: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Provision (falls zutreffend)</Label>
              <Input
                value={formData.commission || ""}
                onChange={(e) => updateFormData({ commission: e.target.value })}
                placeholder="z.B. 2 Monatsmieten zzgl. MwSt."
              />
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Zusammenfassung</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Kaltmiete:</span>
                    <span>{formatCurrency(formData.rent_cold || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nebenkosten:</span>
                    <span>{formatCurrency(formData.rent_additional || 0)}</span>
                  </div>
                  {!formData.heating_included && (
                    <div className="flex justify-between">
                      <span>Heizkosten:</span>
                      <span>{formatCurrency(formData.heating_costs || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Warmmiete:</span>
                    <span>
                      {formatCurrency(
                        (formData.rent_cold || 0) + 
                        (formData.rent_additional || 0) + 
                        (formData.heating_included ? 0 : (formData.heating_costs || 0))
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Fotos hochladen</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Fotos hier ablegen oder klicken zum Auswählen
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Empfohlen: Mindestens 3 Fotos
                  </p>
                </label>
              </div>
            </div>

            {(formData.photos?.length || 0) > 0 && (
              <div className="space-y-3">
                <Label>Hochgeladene Fotos ({formData.photos?.length})</Label>
                <div className="grid grid-cols-3 gap-4">
                  {formData.photos?.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 left-2">
                        {index === formData.main_photo_index ? (
                          <Badge className="bg-primary">Hauptbild</Badge>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setMainPhoto(index)}
                          >
                            Als Hauptbild
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-white drop-shadow-lg cursor-move" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(formData.photos?.length || 0) < 3 && (
              <p className="text-sm text-warning">
                💡 Tipp: Inserate mit mindestens 3 Fotos erhalten mehr Anfragen.
              </p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Portale für Veröffentlichung</Label>
              <div className="grid grid-cols-2 gap-4">
                {(Object.entries(PORTAL_INFO) as [PortalType, typeof PORTAL_INFO[PortalType]][]).map(([portal, info]) => (
                  <Card
                    key={portal}
                    className={`cursor-pointer transition-all ${
                      formData.portals?.includes(portal) 
                        ? "border-primary ring-2 ring-ring/20" 
                        : "hover:border-muted-foreground/50"
                    }`}
                    onClick={() => handlePortalToggle(portal)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${info.color} text-white text-xl`}>
                        {info.logo}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{info.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formData.portals?.includes(portal) ? "Ausgewählt" : "Klicken zum Auswählen"}
                        </p>
                      </div>
                      <Checkbox
                        checked={formData.portals?.includes(portal)}
                        onCheckedChange={() => handlePortalToggle(portal)}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-3">Inserat-Zusammenfassung</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Titel:</span>
                    <span className="font-medium">{formData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warmmiete:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        (formData.rent_cold || 0) + 
                        (formData.rent_additional || 0) + 
                        (formData.heating_included ? 0 : (formData.heating_costs || 0))
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fotos:</span>
                    <span>{formData.photos?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Portale:</span>
                    <span>{formData.portals?.length || 0} ausgewählt</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {listing ? "Inserat bearbeiten" : "Neues Inserat erstellen"}
          </DialogTitle>
          <DialogDescription>
            {STEPS[currentStep - 1].title} (Schritt {currentStep} von {STEPS.length})
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-2">
          <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-1 text-xs ${
                    step.id <= currentStep ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="py-4">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>

          {currentStep === STEPS.length ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={createListing.isPending || updateListing.isPending}
              >
                Als Entwurf speichern
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={createListing.isPending || updateListing.isPending || (formData.portals?.length || 0) === 0}
              >
                {createListing.isPending || updateListing.isPending ? "Speichere..." : "Veröffentlichen"}
              </Button>
            </div>
          ) : (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Weiter
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
