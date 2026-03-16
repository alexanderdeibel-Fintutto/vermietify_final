 import { useState } from "react";
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
 import { Calendar } from "@/components/ui/calendar";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { CalendarIcon, Loader2, Zap, Flame, Droplet, Thermometer } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { cn } from "@/lib/utils";
 import { MeterWithStatus, MeterType } from "@/hooks/useMeters";
 
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
   onSave: (data: { meter_id: string; reading_value: number; reading_date: string; notes?: string }) => void;
   isSaving: boolean;
 }
 
 export function QuickReadingDialog({
   open,
   onOpenChange,
   meter,
   onSave,
   isSaving,
 }: QuickReadingDialogProps) {
   const [readingValue, setReadingValue] = useState("");
   const [readingDate, setReadingDate] = useState<Date>(new Date());
   const [notes, setNotes] = useState("");
 
   if (!meter) return null;
 
   const config = METER_TYPE_CONFIG[meter.meter_type];
   const Icon = config.icon;
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     const value = parseFloat(readingValue.replace(",", "."));
     if (isNaN(value)) return;
 
     onSave({
       meter_id: meter.id,
       reading_value: value,
       reading_date: format(readingDate, "yyyy-MM-dd"),
       notes: notes.trim() || undefined,
     });
   };
 
   const handleOpenChange = (newOpen: boolean) => {
     if (!newOpen) {
       setReadingValue("");
       setReadingDate(new Date());
       setNotes("");
     }
     onOpenChange(newOpen);
   };
 
   return (
     <Dialog open={open} onOpenChange={handleOpenChange}>
       <DialogContent className="sm:max-w-[425px]">
         <form onSubmit={handleSubmit}>
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Icon className="h-5 w-5" />
               Zählerstand erfassen
             </DialogTitle>
             <DialogDescription>
               {meter.meter_number} • {meter.unit?.unit_number} • {meter.unit?.building?.name}
             </DialogDescription>
           </DialogHeader>
 
           <div className="grid gap-4 py-4">
             {meter.last_reading_value !== null && (
               <div className="p-3 bg-muted rounded-lg">
                 <p className="text-sm text-muted-foreground">Letzter Stand</p>
                 <p className="text-lg font-semibold">
                   {meter.last_reading_value.toLocaleString("de-DE")} {config.unit}
                 </p>
                 {meter.last_reading_date && (
                   <p className="text-xs text-muted-foreground">
                     am {format(new Date(meter.last_reading_date), "dd.MM.yyyy", { locale: de })}
                   </p>
                 )}
               </div>
             )}
 
             <div className="space-y-2">
               <Label htmlFor="readingValue">Neuer Zählerstand ({config.unit}) *</Label>
               <Input
                 id="readingValue"
                 type="text"
                 inputMode="decimal"
                 value={readingValue}
                 onChange={(e) => setReadingValue(e.target.value)}
                 placeholder="z.B. 12345,67"
                 required
                 autoFocus
               />
             </div>
 
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
             <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
               Abbrechen
             </Button>
             <Button type="submit" disabled={!readingValue || isSaving}>
               {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               Speichern
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }