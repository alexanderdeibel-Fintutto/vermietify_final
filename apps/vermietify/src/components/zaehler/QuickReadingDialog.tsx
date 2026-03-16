import { useState, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarIcon, 
  Loader2, 
  Zap, 
  Flame, 
  Droplet, 
  Thermometer,
  Camera,
  Upload,
  X,
  AlertTriangle,
  Gauge,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MeterType, MeterWithStatus } from "@/hooks/useMeters";

const METER_TYPE_CONFIG: Record<MeterType, { icon: React.ElementType; label: string; unit: string }> = {
  electricity: { icon: Zap, label: "Strom", unit: "kWh" },
  gas: { icon: Flame, label: "Gas", unit: "m³" },
  water: { icon: Droplet, label: "Wasser", unit: "m³" },
  heating: { icon: Thermometer, label: "Heizung", unit: "kWh" },
};

interface QuickReadingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meter: MeterWithStatus | null;
  onSuccess?: () => void;
}

export function QuickReadingDialog({
  open,
  onOpenChange,
  meter,
  onSuccess,
}: QuickReadingDialogProps) {
  const { user } = useAuth();
  const [readingValue, setReadingValue] = useState("");
  const [readingDate, setReadingDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [overflowConfirmed, setOverflowConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const config = meter ? METER_TYPE_CONFIG[meter.meter_type] : null;
  const Icon = config?.icon || Gauge;

  const parsedValue = parseFloat(readingValue.replace(",", "."));
  const lastReading = meter?.last_reading_value ?? 0;
  const lastReadingDate = meter?.last_reading_date ? new Date(meter.last_reading_date) : null;

  // Calculate consumption stats
  const consumptionStats = useMemo(() => {
    if (isNaN(parsedValue) || !lastReadingDate) {
      return null;
    }
    
    const daysSince = differenceInDays(readingDate, lastReadingDate);
    const consumption = parsedValue - lastReading;
    const dailyConsumption = daysSince > 0 ? consumption / daysSince : 0;

    return {
      consumption,
      daysSince,
      dailyConsumption,
    };
  }, [parsedValue, lastReading, lastReadingDate, readingDate]);

  // Check if value is lower than last reading (potential overflow)
  const isOverflow = !isNaN(parsedValue) && parsedValue < lastReading;
  
  // Validation
  const isValid = !isNaN(parsedValue) && parsedValue >= 0 && (!isOverflow || overflowConfirmed);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !meter) return;

    setIsSaving(true);
    try {
      let imageUrl: string | null = null;

      // Upload photo if exists
      if (photo) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${meter.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("meter-photos")
          .upload(fileName, photo);

        if (uploadError) {
          console.error("Photo upload error:", uploadError);
          toast.error("Fehler beim Hochladen des Fotos");
        } else {
          const { data: signedData } = await supabase.storage
            .from("meter-photos")
            .createSignedUrl(fileName, 3600);
          imageUrl = signedData?.signedUrl || null;
        }
      }

      // Create meter reading
      const { error: readingError } = await supabase
        .from("meter_readings")
        .insert({
          meter_id: meter.id,
          reading_value: parsedValue,
          reading_date: format(readingDate, "yyyy-MM-dd"),
          notes: notes.trim() || null,
          recorded_by: user?.id,
          image_url: imageUrl,
        });

      if (readingError) throw readingError;

      toast.success("Ablesung gespeichert");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error saving reading:", error);
      toast.error("Fehler beim Speichern der Ablesung");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setReadingValue("");
    setReadingDate(new Date());
    setNotes("");
    setPhoto(null);
    setPhotoPreview(null);
    setOverflowConfirmed(false);
    onOpenChange(false);
  };

  if (!meter || !config) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Zählerstand erfassen
            </DialogTitle>
            <DialogDescription className="space-y-1">
              <div className="font-medium text-foreground">{meter.meter_number}</div>
              <div>
                {meter.unit?.unit_number} • {meter.unit?.building?.name}
              </div>
              {lastReadingDate && (
                <div className="text-sm">
                  Letzter Stand: <span className="font-mono font-medium">{lastReading.toLocaleString("de-DE")} {config.unit}</span>
                  {" "}({format(lastReadingDate, "dd.MM.yyyy", { locale: de })})
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Reading Date */}
            <div className="space-y-2">
              <Label>Ablesedatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !readingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(readingDate, "PPP", { locale: de })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={readingDate}
                    onSelect={(date) => date && setReadingDate(date)}
                    locale={de}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Reading Value */}
            <div className="space-y-2">
              <Label htmlFor="readingValue">Zählerstand ({config.unit}) *</Label>
              <Input
                id="readingValue"
                type="text"
                inputMode="decimal"
                value={readingValue}
                onChange={(e) => {
                  setReadingValue(e.target.value);
                  setOverflowConfirmed(false);
                }}
                placeholder="z.B. 12345,67"
                required
                autoFocus
              />
            </div>

            {/* Overflow Warning */}
            {isOverflow && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex flex-col gap-2">
                  <span>
                    Der neue Zählerstand ist niedriger als der letzte Stand. 
                    Handelt es sich um einen Zählerüberlauf?
                  </span>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overflow"
                      checked={overflowConfirmed}
                      onCheckedChange={(checked) => setOverflowConfirmed(checked === true)}
                    />
                    <label
                      htmlFor="overflow"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Ja, dies ist ein Zählerüberlauf
                    </label>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Consumption Calculation */}
            {consumptionStats && consumptionStats.consumption >= 0 && (
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <p className="text-sm font-medium">Berechneter Verbrauch</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Verbrauch</p>
                    <p className="font-mono font-medium">
                      {consumptionStats.consumption.toLocaleString("de-DE", { maximumFractionDigits: 2 })} {config.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tage</p>
                    <p className="font-mono font-medium">{consumptionStats.daysSince}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pro Tag</p>
                    <p className="font-mono font-medium">
                      {consumptionStats.dailyConsumption.toLocaleString("de-DE", { maximumFractionDigits: 2 })} {config.unit}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Foto (optional)</Label>
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Zählerstand"
                    className="max-h-40 rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removePhoto}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Foto aufnehmen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Hochladen
                  </Button>
                </div>
              )}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optionale Bemerkungen..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!readingValue || !isValid || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}