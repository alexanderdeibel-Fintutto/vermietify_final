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
 import { MeterInsert, MeterType, MeterWithStatus } from "@/hooks/useMeters";
 import { useBuildings } from "@/hooks/useBuildings";
 import { useUnits } from "@/hooks/useUnits";
 
 const METER_TYPES: { value: MeterType; label: string; icon: React.ElementType }[] = [
   { value: "electricity", label: "Strom", icon: Zap },
   { value: "gas", label: "Gas", icon: Flame },
   { value: "water", label: "Wasser", icon: Droplet },
   { value: "heating", label: "Heizung", icon: Thermometer },
 ];
 
 interface MeterFormDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   meter?: MeterWithStatus | null;
   onSave: (data: MeterInsert) => void;
   isSaving: boolean;
 }
 
 export function MeterFormDialog({
   open,
   onOpenChange,
   meter,
   onSave,
   isSaving,
 }: MeterFormDialogProps) {
  const { useBuildingsList } = useBuildings();
  const { useUnitsList } = useUnits();
  const { data: buildingsData } = useBuildingsList(1, 100);
  const buildings = buildingsData?.buildings ?? [];
   
   const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
   const [unitId, setUnitId] = useState<string>("");
   const [meterNumber, setMeterNumber] = useState("");
   const [meterType, setMeterType] = useState<MeterType>("electricity");
   const [installationDate, setInstallationDate] = useState<Date | undefined>();
   const [readingInterval, setReadingInterval] = useState("12");
   const [notes, setNotes] = useState("");
 
   const isEditing = !!meter;
 
  const { data: unitsData } = useUnitsList(selectedBuildingId || undefined);
  const filteredUnits = unitsData ?? [];
 
   useEffect(() => {
     if (meter) {
       setSelectedBuildingId(meter.unit?.building_id || "");
       setUnitId(meter.unit_id);
       setMeterNumber(meter.meter_number);
       setMeterType(meter.meter_type);
       setInstallationDate(meter.installation_date ? new Date(meter.installation_date) : undefined);
       setReadingInterval(meter.reading_interval_months.toString());
       setNotes(meter.notes || "");
     } else {
       setSelectedBuildingId("");
       setUnitId("");
       setMeterNumber("");
       setMeterType("electricity");
       setInstallationDate(undefined);
       setReadingInterval("12");
       setNotes("");
     }
   }, [meter, open]);
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!unitId || !meterNumber.trim()) return;
 
     onSave({
       unit_id: unitId,
       meter_number: meterNumber.trim(),
       meter_type: meterType,
       installation_date: installationDate ? format(installationDate, "yyyy-MM-dd") : null,
       reading_interval_months: parseInt(readingInterval),
       notes: notes.trim() || null,
     });
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
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Gebäude *</Label>
                 <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
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
 
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="meterNumber">Zählernummer *</Label>
                 <Input
                   id="meterNumber"
                   value={meterNumber}
                   onChange={(e) => setMeterNumber(e.target.value)}
                   placeholder="z.B. 1234567890"
                   required
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
                 <Label>Ableseintervall</Label>
                 <Select value={readingInterval} onValueChange={setReadingInterval}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="1">Monatlich</SelectItem>
                     <SelectItem value="3">Vierteljährlich</SelectItem>
                     <SelectItem value="6">Halbjährlich</SelectItem>
                     <SelectItem value="12">Jährlich</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
 
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
           </div>
 
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               Abbrechen
             </Button>
             <Button type="submit" disabled={!unitId || !meterNumber.trim() || isSaving}>
               {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               {isEditing ? "Speichern" : "Erstellen"}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }