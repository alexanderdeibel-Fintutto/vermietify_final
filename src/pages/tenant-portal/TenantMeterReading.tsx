 import { useState } from "react";
 import { TenantLayout } from "@/components/tenant-portal/TenantLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { useTenantPortal } from "@/hooks/useTenantPortal";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { LoadingState, EmptyState } from "@/components/shared";
 import {
   Droplets,
   Flame,
   Zap,
   Gauge,
   Camera,
   Upload,
   X,
   Loader2,
   Calendar,
 } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 const meterIcons: Record<string, any> = {
   water: Droplets,
   gas: Flame,
   electricity: Zap,
   heating: Flame,
 };
 
 const meterColors: Record<string, string> = {
   water: "text-cyan-500 bg-cyan-50",
   gas: "text-orange-500 bg-orange-50",
   electricity: "text-yellow-500 bg-yellow-50",
   heating: "text-red-500 bg-red-50",
 };
 
 const meterLabels: Record<string, string> = {
   water: "Wasser",
   gas: "Gas",
   electricity: "Strom",
   heating: "Heizung",
 };
 
 export default function TenantMeterReading() {
   const { toast } = useToast();
   const { user } = useAuth();
   const { useTenantMeters } = useTenantPortal();
   const { data: meters = [], isLoading, refetch } = useTenantMeters();
 
   const [selectedMeter, setSelectedMeter] = useState<any>(null);
   const [readingValue, setReadingValue] = useState("");
   const [photoFile, setPhotoFile] = useState<File | null>(null);
   const [photoPreview, setPhotoPreview] = useState<string>("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [showHistory, setShowHistory] = useState<any>(null);
 
   const getLastReading = (meter: any) => {
     const readings = meter.meter_readings || [];
     if (readings.length === 0) return null;
     return readings.sort((a: any, b: any) => 
       new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime()
     )[0];
   };
 
   const handlePhotoSelect = (files: FileList | null) => {
     if (!files || files.length === 0) return;
     const file = files[0];
     setPhotoFile(file);
     setPhotoPreview(URL.createObjectURL(file));
   };
 
   const removePhoto = () => {
     if (photoPreview) URL.revokeObjectURL(photoPreview);
     setPhotoFile(null);
     setPhotoPreview("");
   };
 
   const handleSubmit = async () => {
     if (!selectedMeter || !user || !readingValue) return;
 
     const lastReading = getLastReading(selectedMeter);
     const newValue = parseFloat(readingValue);
 
     if (lastReading && newValue < lastReading.reading_value) {
       toast({
         title: "Ungültiger Stand",
         description: "Der neue Stand muss größer oder gleich dem letzten Stand sein.",
         variant: "destructive",
       });
       return;
     }
 
     setIsSubmitting(true);
 
     try {
       let imageUrl = null;
 
       // Upload photo if provided
       if (photoFile) {
         const fileExt = photoFile.name.split(".").pop();
         const fileName = `${user.id}/${selectedMeter.id}/${Date.now()}.${fileExt}`;
 
         const { error: uploadError } = await supabase.storage
           .from("meter-readings")
           .upload(fileName, photoFile);
 
         if (!uploadError) {
           const { data: urlData } = supabase.storage
             .from("meter-readings")
             .getPublicUrl(fileName);
           imageUrl = urlData.publicUrl;
         }
       }
 
       // Create reading
       const { error } = await supabase.from("meter_readings").insert({
         meter_id: selectedMeter.id,
         reading_date: new Date().toISOString().split("T")[0],
         reading_value: newValue,
         image_url: imageUrl,
         recorded_by: user.id,
       });
 
       if (error) throw error;
 
       toast({ title: "Zählerstand erfasst" });
       setSelectedMeter(null);
       setReadingValue("");
       removePhoto();
       refetch();
     } catch (error: any) {
       toast({
         title: "Fehler",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   if (isLoading) {
     return (
       <TenantLayout>
         <LoadingState />
       </TenantLayout>
     );
   }
 
   return (
     <TenantLayout>
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl font-bold">Zähler</h1>
           <p className="text-muted-foreground">
             Erfassen Sie Ihre Zählerstände und sehen Sie Ihre Verbrauchshistorie.
           </p>
         </div>
 
         {meters.length === 0 ? (
           <EmptyState
             icon={Gauge}
             title="Keine Zähler"
             description="Es sind keine Zähler für Ihre Wohnung hinterlegt."
           />
         ) : (
           <div className="grid gap-4 md:grid-cols-2">
             {meters.map((meter: any) => {
               const Icon = meterIcons[meter.meter_type] || Gauge;
               const lastReading = getLastReading(meter);
 
               return (
                 <Card key={meter.id}>
                   <CardHeader className="pb-3">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className={`h-10 w-10 rounded-full flex items-center justify-center ${meterColors[meter.meter_type] || "bg-gray-100"}`}>
                           <Icon className="h-5 w-5" />
                         </div>
                         <div>
                           <CardTitle className="text-base">
                             {meterLabels[meter.meter_type] || meter.meter_type}
                           </CardTitle>
                           <p className="text-sm text-muted-foreground">
                             Nr. {meter.meter_number}
                           </p>
                         </div>
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent className="space-y-3">
                     <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">Letzter Stand:</span>
                       <span className="font-medium">
                         {lastReading
                           ? `${lastReading.reading_value.toLocaleString("de-DE")} (${format(
                               new Date(lastReading.reading_date),
                               "dd.MM.yyyy",
                               { locale: de }
                             )})`
                           : "Keine Ablesung"}
                       </span>
                     </div>
 
                     <div className="flex gap-2">
                       <Button
                         className="flex-1"
                         onClick={() => setSelectedMeter(meter)}
                       >
                         <Gauge className="h-4 w-4 mr-2" />
                         Ablesen
                       </Button>
                       <Button
                         variant="outline"
                         onClick={() => setShowHistory(meter)}
                       >
                         <Calendar className="h-4 w-4" />
                       </Button>
                     </div>
                   </CardContent>
                 </Card>
               );
             })}
           </div>
         )}
       </div>
 
       {/* Reading Dialog */}
       <Dialog open={!!selectedMeter} onOpenChange={() => setSelectedMeter(null)}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Zählerstand erfassen</DialogTitle>
           </DialogHeader>
 
           {selectedMeter && (
             <div className="space-y-4">
               <div className="p-3 bg-muted rounded-lg">
                 <p className="text-sm font-medium">
                   {meterLabels[selectedMeter.meter_type]} - Nr. {selectedMeter.meter_number}
                 </p>
                 {getLastReading(selectedMeter) && (
                   <p className="text-sm text-muted-foreground">
                     Letzter Stand: {getLastReading(selectedMeter).reading_value.toLocaleString("de-DE")}
                   </p>
                 )}
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="reading">Neuer Stand *</Label>
                 <Input
                   id="reading"
                   type="number"
                   step="0.01"
                   value={readingValue}
                   onChange={(e) => setReadingValue(e.target.value)}
                   placeholder="z.B. 12345.67"
                 />
               </div>
 
               <div className="space-y-2">
                 <Label>Foto (optional)</Label>
                 {photoPreview ? (
                   <div className="relative w-32 h-32">
                     <img
                       src={photoPreview}
                       alt="Vorschau"
                       className="w-full h-full object-cover rounded-lg"
                     />
                     <Button
                       variant="destructive"
                       size="icon"
                       className="absolute top-1 right-1 h-6 w-6"
                       onClick={removePhoto}
                     >
                       <X className="h-3 w-3" />
                     </Button>
                   </div>
                 ) : (
                   <div className="flex gap-2">
                     <Button variant="outline" size="sm" className="relative">
                       <input
                         type="file"
                         accept="image/*"
                         capture="environment"
                         className="absolute inset-0 opacity-0 cursor-pointer"
                         onChange={(e) => handlePhotoSelect(e.target.files)}
                       />
                       <Camera className="h-4 w-4 mr-2" />
                       Kamera
                     </Button>
                     <Button variant="outline" size="sm" className="relative">
                       <input
                         type="file"
                         accept="image/*"
                         className="absolute inset-0 opacity-0 cursor-pointer"
                         onChange={(e) => handlePhotoSelect(e.target.files)}
                       />
                       <Upload className="h-4 w-4 mr-2" />
                       Datei
                     </Button>
                   </div>
                 )}
               </div>
             </div>
           )}
 
           <DialogFooter>
             <Button variant="outline" onClick={() => setSelectedMeter(null)}>
               Abbrechen
             </Button>
             <Button onClick={handleSubmit} disabled={isSubmitting || !readingValue}>
               {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               Speichern
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* History Dialog */}
       <Dialog open={!!showHistory} onOpenChange={() => setShowHistory(null)}>
         <DialogContent className="max-w-lg">
           <DialogHeader>
             <DialogTitle>Ablese-Historie</DialogTitle>
           </DialogHeader>
 
           {showHistory && (
             <div className="max-h-[400px] overflow-y-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Datum</TableHead>
                     <TableHead className="text-right">Stand</TableHead>
                     <TableHead className="text-right">Verbrauch</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {(showHistory.meter_readings || [])
                     .sort((a: any, b: any) => 
                       new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime()
                     )
                     .map((reading: any, index: number, arr: any[]) => {
                       const prevReading = arr[index + 1];
                       const consumption = prevReading
                         ? reading.reading_value - prevReading.reading_value
                         : null;
 
                       return (
                         <TableRow key={reading.id}>
                           <TableCell>
                             {format(new Date(reading.reading_date), "dd.MM.yyyy", { locale: de })}
                           </TableCell>
                           <TableCell className="text-right font-mono">
                             {reading.reading_value.toLocaleString("de-DE")}
                           </TableCell>
                           <TableCell className="text-right">
                             {consumption !== null ? (
                               <Badge variant="outline">
                                 +{consumption.toLocaleString("de-DE")}
                               </Badge>
                             ) : (
                               "-"
                             )}
                           </TableCell>
                         </TableRow>
                       );
                     })}
                 </TableBody>
               </Table>
               {(!showHistory.meter_readings || showHistory.meter_readings.length === 0) && (
                 <p className="text-center text-muted-foreground py-8">
                   Noch keine Ablesungen vorhanden.
                 </p>
               )}
             </div>
           )}
         </DialogContent>
       </Dialog>
     </TenantLayout>
   );
 }