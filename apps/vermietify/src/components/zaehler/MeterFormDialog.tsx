 import { useState, useEffect } from "react";
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
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Calendar } from "@/components/ui/calendar";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { CalendarIcon, Loader2, Zap, Flame, Droplet, Thermometer } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { cn } from "@/lib/utils";
 import { toast } from "sonner";
 import { supabase } from "@/integrations/supabase/client";
 import { useBuildings } from "@/hooks/useBuildings";
 import { useUnits } from "@/hooks/useUnits";
 import { useAuth } from "@/hooks/useAuth";
 import { useQueryClient } from "@tanstack/react-query";
 import type { MeterType, Meter } from "@/hooks/useMeters";
 
 const METER_TYPES: { value: MeterType; label: string; icon: React.ElementType }[] = [
   { value: "electricity", label: "Strom", icon: Zap },
   { value: "gas", label: "Gas", icon: Flame },
   { value: "water", label: "Wasser", icon: Droplet },
   { value: "heating", label: "Heizung", icon: Thermometer },
 ];
 
 interface MeterFormDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   unitId?: string;
   meter?: Meter | null;
   onSuccess?: () => void;
 }
 
 export function MeterFormDialog({
   open,
   onOpenChange,
   unitId: preselectedUnitId,
   meter,
   onSuccess,
 }: MeterFormDialogProps) {
   const queryClient = useQueryClient();
   const { user } = useAuth();
   const { useBuildingsList } = useBuildings();
   const { useUnitsList } = useUnits();
   const { data: buildingsData } = useBuildingsList(1, 100);
   const buildings = buildingsData?.buildings ?? [];
 
   const [isSaving, setIsSaving] = useState(false);
   const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
   const [unitId, setUnitId] = useState<string>("");
   const [meterNumber, setMeterNumber] = useState("");
   const [meterType, setMeterType] = useState<MeterType>("electricity");
   const [installationDate, setInstallationDate] = useState<Date | undefined>();
   const [calibrationValidUntil, setCalibrationValidUntil] = useState<Date | undefined>();
   const [initialReading, setInitialReading] = useState("");
   const [notes, setNotes] = useState("");
   const [validationError, setValidationError] = useState<string | null>(null);
 
   const isEditing = !!meter;
 
   // Get units filtered by building
   const { data: unitsData } = useUnitsList(selectedBuildingId || undefined);
   const filteredUnits = unitsData ?? [];
 
   // Preselect unit if provided
   useEffect(() => {
     if (preselectedUnitId && !meter) {
       setUnitId(preselectedUnitId);
       // Find the building for this unit
       const unit = filteredUnits.find((u) => u.id === preselectedUnitId);
       if (unit) {
         setSelectedBuildingId(unit.building_id);
       }
     }
   }, [preselectedUnitId, filteredUnits, meter]);
 
   // Populate form when editing
   useEffect(() => {
     if (meter) {
       setSelectedBuildingId(meter.unit?.building_id || "");
       setUnitId(meter.unit_id);
       setMeterNumber(meter.meter_number);
       setMeterType(meter.meter_type);
       setInstallationDate(meter.installation_date ? new Date(meter.installation_date) : undefined);
       setCalibrationValidUntil(
         (meter as any).calibration_valid_until 
           ? new Date((meter as any).calibration_valid_until) 
           : undefined
       );
       setNotes(meter.notes || "");
       setInitialReading("");
     } else {
       resetForm();
     }
   }, [meter, open]);
 
   const resetForm = () => {
     if (!preselectedUnitId) {
       setSelectedBuildingId("");
       setUnitId("");
     }
     setMeterNumber("");
     setMeterType("electricity");
     setInstallationDate(undefined);
     setCalibrationValidUntil(undefined);
     setInitialReading("");
     setNotes("");
     setValidationError(null);
   };
 
   const validateForm = async (): Promise<boolean> => {
     setValidationError(null);
 
     if (meterNumber.trim().length < 3) {
       setValidationError("Zählernummer muss mindestens 3 Zeichen haben");
       return false;
     }
 
     // Check for duplicate meter number + type for this unit
     const { data: existing, error } = await supabase
       .from("meters")
       .select("id")
       .eq("unit_id", unitId)
       .eq("meter_number", meterNumber.trim())
       .eq("meter_type", meterType);
 
     if (error) {
       console.error("Error checking duplicate:", error);
       return false;
     }
 
     // If editing, exclude current meter from duplicate check
     const isDuplicate = existing.some((m) => m.id !== meter?.id);
     if (isDuplicate) {
       setValidationError("Ein Zähler mit dieser Nummer und Typ existiert bereits für diese Einheit");
       return false;
     }
 
     return true;
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!unitId || !meterNumber.trim()) return;
 
     const isValid = await validateForm();
     if (!isValid) return;
 
     setIsSaving(true);
 
     try {
       const meterData = {
         unit_id: unitId,
         meter_number: meterNumber.trim(),
         meter_type: meterType,
         installation_date: installationDate ? format(installationDate, "yyyy-MM-dd") : null,
         calibration_valid_until: calibrationValidUntil ? format(calibrationValidUntil, "yyyy-MM-dd") : null,
         notes: notes.trim() || null,
       };
 
       let meterId: string;
 
       if (isEditing && meter) {
         // Update existing meter
         const { error } = await supabase
           .from("meters")
           .update(meterData)
           .eq("id", meter.id);
 
         if (error) throw error;
         meterId = meter.id;
         toast.success("Zähler aktualisiert");
       } else {
         // Create new meter
         const { data: newMeter, error } = await supabase
           .from("meters")
           .insert(meterData)
           .select()
           .single();
 
         if (error) throw error;
         meterId = newMeter.id;
 
         // Create initial reading if provided
         if (initialReading.trim()) {
           const readingValue = parseFloat(initialReading.replace(",", "."));
           if (!isNaN(readingValue)) {
             const { error: readingError } = await supabase
               .from("meter_readings")
               .insert({
                 meter_id: meterId,
                 reading_value: readingValue,
                 reading_date: installationDate 
                   ? format(installationDate, "yyyy-MM-dd") 
                   : format(new Date(), "yyyy-MM-dd"),
                 recorded_by: user?.id,
                 notes: "Anfangsstand bei Installation",
               });
 
             if (readingError) {
               console.error("Error creating initial reading:", readingError);
             }
           }
         }
 
         toast.success("Zähler hinzugefügt");
       }
 
       // Invalidate queries
       queryClient.invalidateQueries({ queryKey: ["meters"] });
       queryClient.invalidateQueries({ queryKey: ["meter-readings"] });
 
       onOpenChange(false);
       onSuccess?.();
     } catch (error) {
       console.error("Error saving meter:", error);
       toast.error(isEditing ? "Fehler beim Aktualisieren" : "Fehler beim Erstellen");
     } finally {
       setIsSaving(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[500px]">
         <form onSubmit={handleSubmit}>
           <DialogHeader>
             <DialogTitle>
               {isEditing ? "Zähler bearbeiten" : "Neuen Zähler hinzufügen"}
             </DialogTitle>
             <DialogDescription>
               {isEditing
                 ? "Bearbeiten Sie die Zählerdaten"
                 : "Fügen Sie einen neuen Zähler zu einer Einheit hinzu"}
             </DialogDescription>
           </DialogHeader>
 
           <div className="grid gap-4 py-4">
             {/* Building & Unit Selection */}
             {!preselectedUnitId && (
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Gebäude *</Label>
                   <Select 
                     value={selectedBuildingId} 
                     onValueChange={(v) => {
                       setSelectedBuildingId(v);
                       setUnitId("");
                     }}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Gebäude wählen" />
                     </SelectTrigger>
                     <SelectContent>
                       {buildings.map((b) => (
                         <SelectItem key={b.id} value={b.id}>
                           {b.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
 
                 <div className="space-y-2">
                   <Label>Einheit *</Label>
                   <Select
                     value={unitId}
                     onValueChange={setUnitId}
                     disabled={!selectedBuildingId}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Einheit wählen" />
                     </SelectTrigger>
                     <SelectContent>
                       {filteredUnits.map((u) => (
                         <SelectItem key={u.id} value={u.id}>
                           {u.unit_number}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
             )}
 
             {/* Meter Number & Type */}
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="meterNumber">Zählernummer *</Label>
                 <Input
                   id="meterNumber"
                   value={meterNumber}
                   onChange={(e) => setMeterNumber(e.target.value)}
                   placeholder="z.B. 1234567890"
                   required
                   minLength={3}
                 />
               </div>
 
               <div className="space-y-2">
                 <Label>Zählertyp *</Label>
                 <Select value={meterType} onValueChange={(v) => setMeterType(v as MeterType)}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {METER_TYPES.map((type) => (
                       <SelectItem key={type.value} value={type.value}>
                         <div className="flex items-center gap-2">
                           <type.icon className="h-4 w-4" />
                           {type.label}
                         </div>
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
 
             {/* Installation Date & Calibration Valid Until */}
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Einbaudatum</Label>
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button
                       variant="outline"
                       className={cn(
                         "w-full justify-start text-left font-normal",
                         !installationDate && "text-muted-foreground"
                       )}
                     >
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {installationDate
                         ? format(installationDate, "dd.MM.yyyy", { locale: de })
                         : "Datum wählen"}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={installationDate}
                       onSelect={setInstallationDate}
                       locale={de}
                       initialFocus
                     />
                   </PopoverContent>
                 </Popover>
               </div>
 
               <div className="space-y-2">
                 <Label>Eichgültigkeit bis</Label>
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button
                       variant="outline"
                       className={cn(
                         "w-full justify-start text-left font-normal",
                         !calibrationValidUntil && "text-muted-foreground"
                       )}
                     >
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {calibrationValidUntil
                         ? format(calibrationValidUntil, "dd.MM.yyyy", { locale: de })
                         : "Datum wählen"}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={calibrationValidUntil}
                       onSelect={setCalibrationValidUntil}
                       locale={de}
                       initialFocus
                     />
                   </PopoverContent>
                 </Popover>
               </div>
             </div>
 
             {/* Initial Reading (only for new meters) */}
             {!isEditing && (
               <div className="space-y-2">
                 <Label htmlFor="initialReading">Anfangsstand (optional)</Label>
                 <Input
                   id="initialReading"
                   type="text"
                   inputMode="decimal"
                   value={initialReading}
                   onChange={(e) => setInitialReading(e.target.value)}
                   placeholder="z.B. 12345,67"
                 />
                 <p className="text-xs text-muted-foreground">
                   Wird als erste Ablesung zum Einbaudatum gespeichert
                 </p>
               </div>
             )}
 
             {/* Notes */}
             <div className="space-y-2">
               <Label htmlFor="notes">Notizen</Label>
               <Textarea
                 id="notes"
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder="Optionale Bemerkungen zum Zähler..."
                 rows={2}
               />
             </div>
 
             {/* Validation Error */}
             {validationError && (
               <p className="text-sm text-destructive">{validationError}</p>
             )}
           </div>
 
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               Abbrechen
             </Button>
             <Button
               type="submit"
               disabled={!unitId || !meterNumber.trim() || meterNumber.trim().length < 3 || isSaving}
             >
               {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               {isEditing ? "Speichern" : "Erstellen"}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }