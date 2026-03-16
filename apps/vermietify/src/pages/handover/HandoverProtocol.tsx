 import { useState, useEffect } from "react";
 import { useParams, useNavigate, useSearchParams } from "react-router-dom";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { Textarea } from "@/components/ui/textarea";
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
 import { Label } from "@/components/ui/label";
 import { Input } from "@/components/ui/input";
 import { Checkbox } from "@/components/ui/checkbox";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
 } from "@/components/ui/accordion";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import {
   ArrowLeft,
   ArrowRight,
   Camera,
   Check,
   AlertTriangle,
   Key,
   Gauge,
   FileSignature,
   CheckCircle,
   Home,
   User,
 } from "lucide-react";
 import {
   useHandoverProtocol,
   DEFAULT_ROOMS,
   DEFAULT_KEYS,
   RoomItem,
   DefectSeverity,
   KeyType,
 } from "@/hooks/useHandover";
 import { supabase } from "@/integrations/supabase/client";
 import { SignaturePad } from "@/components/handover/SignaturePad";
 import { PhotoCapture } from "@/components/handover/PhotoCapture";
 import { toast } from "@/hooks/use-toast";
 
 interface LocalRoom {
   name: string;
   items: RoomItem[];
   photos: string[];
   notes: string;
   completed: boolean;
 }
 
 interface LocalKey {
   type: KeyType;
   label: string;
   quantity: number;
   handedOver: boolean;
 }
 
 interface LocalMeterReading {
   meterId: string;
   meterNumber: string;
   meterType: string;
   value: string;
   photo: string | null;
 }
 
 export default function HandoverProtocol() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
 
   const {
     protocol,
     isLoading,
     createRoom,
     createDefect,
     createSignature,
     createKey,
     uploadFile,
   } = useHandoverProtocol(id);
 
   const [currentSection, setCurrentSection] = useState<
     "rooms" | "meters" | "keys" | "signatures" | "summary"
   >("rooms");
   const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
   const [rooms, setRooms] = useState<LocalRoom[]>([]);
   const [keys, setKeys] = useState<LocalKey[]>([]);
   const [meterReadings, setMeterReadings] = useState<LocalMeterReading[]>([]);
   const [meters, setMeters] = useState<any[]>([]);
   const [signatures, setSignatures] = useState<{
     landlord?: string;
     tenant?: string;
     witness?: string;
   }>({});
   const [signatureDialogType, setSignatureDialogType] = useState<
     "landlord" | "tenant" | "witness" | null
   >(null);
 
   // Initialize rooms from URL params or defaults
   useEffect(() => {
     const roomNames = searchParams.get("rooms")?.split(",") || [];
     const initialRooms =
       roomNames.length > 0
         ? roomNames.map((name) => {
             const defaultRoom = DEFAULT_ROOMS.find((r) => r.name === name);
             return {
               name,
               items: (defaultRoom?.items || []).map((item, i) => ({
                 id: `item-${i}`,
                 name: item,
                 status: "pending" as const,
               })),
               photos: [],
               notes: "",
               completed: false,
             };
           })
         : DEFAULT_ROOMS.map((r) => ({
             name: r.name,
             items: r.items.map((item, i) => ({
               id: `item-${i}`,
               name: item,
               status: "pending" as const,
             })),
             photos: [],
             notes: "",
             completed: false,
           }));
     setRooms(initialRooms);
     setKeys(
       DEFAULT_KEYS.map((k) => ({
         ...k,
         quantity: 1,
         handedOver: false,
       }))
     );
   }, [searchParams]);
 
   // Load meters for the unit
   useEffect(() => {
     if (!protocol?.unit_id) return;
     supabase
       .from("meters")
       .select("*")
       .eq("unit_id", protocol.unit_id)
       .then(({ data }) => {
         if (data) {
           setMeters(data);
           setMeterReadings(
             data.map((m) => ({
               meterId: m.id,
               meterNumber: m.meter_number,
               meterType: m.meter_type,
               value: "",
               photo: null,
             }))
           );
         }
       });
   }, [protocol?.unit_id]);
 
   const currentRoom = rooms[currentRoomIndex];
   const progress = rooms.length > 0
     ? ((rooms.filter((r) => r.completed).length / rooms.length) * 100)
     : 0;
 
   const updateItemStatus = (
     itemId: string,
     status: "ok" | "defect",
     defect?: RoomItem["defect"]
   ) => {
     setRooms((prev) =>
       prev.map((room, i) =>
         i === currentRoomIndex
           ? {
               ...room,
               items: room.items.map((item) =>
                 item.id === itemId ? { ...item, status, defect } : item
               ),
             }
           : room
       )
     );
   };
 
   const addRoomPhoto = async (blob: Blob) => {
     if (!id) return;
     const path = `${id}/rooms/${currentRoomIndex}/${Date.now()}.jpg`;
     try {
       const url = await uploadFile(blob, path);
       setRooms((prev) =>
         prev.map((room, i) =>
           i === currentRoomIndex
             ? { ...room, photos: [...room.photos, url] }
             : room
         )
       );
       toast({ title: "Foto hinzugefügt" });
     } catch (error) {
       toast({ title: "Fehler beim Hochladen", variant: "destructive" });
     }
   };
 
   const completeRoom = () => {
     setRooms((prev) =>
       prev.map((room, i) =>
         i === currentRoomIndex ? { ...room, completed: true } : room
       )
     );
     if (currentRoomIndex < rooms.length - 1) {
       setCurrentRoomIndex(currentRoomIndex + 1);
     } else {
       setCurrentSection("meters");
     }
   };
 
   const handleSignature = async (dataUrl: string) => {
     if (!signatureDialogType || !id) return;
 
     // Convert data URL to blob and upload
     const response = await fetch(dataUrl);
     const blob = await response.blob();
     const path = `${id}/signatures/${signatureDialogType}-${Date.now()}.png`;
 
     try {
       const url = await uploadFile(blob, path);
       setSignatures((prev) => ({ ...prev, [signatureDialogType]: url }));
       setSignatureDialogType(null);
       toast({ title: "Unterschrift gespeichert" });
     } catch (error) {
       toast({ title: "Fehler beim Speichern", variant: "destructive" });
     }
   };
 
   const completeProtocol = async () => {
     if (!id || !protocol) return;
 
     try {
       // Save all rooms
       for (let i = 0; i < rooms.length; i++) {
         const room = rooms[i];
         await createRoom.mutateAsync({
           protocol_id: id,
           room_name: room.name,
           order_index: i,
           items: room.items,
           photos: room.photos,
           notes: room.notes || null,
           overall_status: room.items.some((item) => item.status === "defect")
             ? "defect"
             : "ok",
         });
 
         // Save defects
         for (const item of room.items) {
           if (item.status === "defect" && item.defect) {
             await createDefect.mutateAsync({
               protocol_id: id,
               room_id: null,
               description: item.defect.description || item.name,
               severity: item.defect.severity,
               photo_paths: item.defect.photo_paths,
               is_tenant_responsible: item.defect.is_tenant_responsible,
               estimated_cost_cents: 0,
               resolved_at: null,
             });
           }
         }
       }
 
       // Save keys
       for (const key of keys) {
         await createKey.mutateAsync({
           protocol_id: id,
           key_type: key.type,
           key_label: key.label,
           quantity: key.quantity,
           handed_over: key.handedOver,
           notes: null,
         });
       }
 
       // Save signatures
       if (signatures.landlord) {
         await createSignature.mutateAsync({
           protocol_id: id,
           signer_type: "landlord",
           signer_name: "Vermieter",
           signature_path: signatures.landlord,
         });
       }
       if (signatures.tenant) {
         await createSignature.mutateAsync({
           protocol_id: id,
           signer_type: "tenant",
           signer_name: protocol.tenant
             ? `${protocol.tenant.first_name} ${protocol.tenant.last_name}`
             : "Mieter",
           signature_path: signatures.tenant,
         });
       }
       if (signatures.witness) {
         await createSignature.mutateAsync({
           protocol_id: id,
           signer_type: "witness",
           signer_name: "Zeuge",
           signature_path: signatures.witness,
         });
       }
 
       // Save meter readings
       for (const reading of meterReadings) {
         if (reading.value) {
           await supabase.from("meter_readings").insert({
             meter_id: reading.meterId,
             reading_date: new Date().toISOString().split("T")[0],
             reading_value: parseFloat(reading.value),
             notes: `Übergabeprotokoll ${protocol.type === "move_in" ? "Einzug" : "Auszug"}`,
             image_url: reading.photo,
           });
         }
       }
 
       // Update protocol status
       await supabase
         .from("handover_protocols")
         .update({
           status: signatures.landlord && signatures.tenant ? "signed" : "completed",
           completed_at: new Date().toISOString(),
         })
         .eq("id", id);
 
       toast({ title: "Protokoll abgeschlossen!" });
       navigate(`/uebergaben/${id}/pdf`);
     } catch (error: any) {
       toast({
         title: "Fehler beim Speichern",
         description: error.message,
         variant: "destructive",
       });
     }
   };
 
   if (isLoading || !protocol) {
     return (
       <MainLayout title="Übergabeprotokoll">
         <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
         </div>
       </MainLayout>
     );
   }
 
   return (
     <MainLayout title="Übergabeprotokoll">
       <div className="max-w-2xl mx-auto space-y-4 pb-20">
         {/* Header */}
         <div className="sticky top-0 bg-background z-10 pb-4 border-b">
           <div className="flex items-center justify-between mb-2">
             <Button variant="ghost" size="sm" onClick={() => navigate("/uebergaben")}>
               <ArrowLeft className="h-4 w-4 mr-2" />
               Abbrechen
             </Button>
             <Badge variant={protocol.type === "move_in" ? "default" : "secondary"}>
               {protocol.type === "move_in" ? "Einzug" : "Auszug"}
             </Badge>
           </div>
           <div className="flex items-center gap-4 text-sm text-muted-foreground">
             <div className="flex items-center gap-1">
               <Home className="h-4 w-4" />
               {protocol.unit?.unit_number}
             </div>
             {protocol.tenant && (
               <div className="flex items-center gap-1">
                 <User className="h-4 w-4" />
                 {protocol.tenant.first_name} {protocol.tenant.last_name}
               </div>
             )}
           </div>
           <div className="mt-3">
             <div className="flex justify-between text-xs mb-1">
               <span>Fortschritt</span>
               <span>{Math.round(progress)}%</span>
             </div>
             <Progress value={progress} />
           </div>
         </div>
 
         {/* Navigation Tabs */}
         <div className="flex gap-2 overflow-x-auto pb-2">
           {[
             { id: "rooms", label: "Räume", icon: Home },
             { id: "meters", label: "Zähler", icon: Gauge },
             { id: "keys", label: "Schlüssel", icon: Key },
             { id: "signatures", label: "Unterschriften", icon: FileSignature },
           ].map((tab) => (
             <Button
               key={tab.id}
               variant={currentSection === tab.id ? "default" : "outline"}
               size="sm"
               onClick={() => setCurrentSection(tab.id as any)}
             >
               <tab.icon className="h-4 w-4 mr-1" />
               {tab.label}
             </Button>
           ))}
         </div>
 
         {/* Rooms Section */}
         {currentSection === "rooms" && currentRoom && (
           <Card>
             <CardHeader className="pb-2">
               <div className="flex items-center justify-between">
                 <CardTitle className="text-lg">{currentRoom.name}</CardTitle>
                 <Badge variant="outline">
                   Raum {currentRoomIndex + 1} von {rooms.length}
                 </Badge>
               </div>
             </CardHeader>
             <CardContent className="space-y-4">
               <Accordion type="multiple" className="w-full">
                 {currentRoom.items.map((item) => (
                   <AccordionItem key={item.id} value={item.id}>
                     <AccordionTrigger className="hover:no-underline">
                       <div className="flex items-center gap-2">
                         {item.status === "ok" && (
                           <Check className="h-4 w-4 text-green-600" />
                         )}
                         {item.status === "defect" && (
                           <AlertTriangle className="h-4 w-4 text-destructive" />
                         )}
                         {item.status === "pending" && (
                           <div className="h-4 w-4 rounded-full border-2" />
                         )}
                         <span>{item.name}</span>
                       </div>
                     </AccordionTrigger>
                     <AccordionContent className="space-y-3 pt-2">
                       <RadioGroup
                         value={item.status === "pending" ? undefined : item.status}
                         onValueChange={(val) =>
                           updateItemStatus(
                             item.id,
                             val as "ok" | "defect",
                             val === "defect"
                               ? {
                                   description: "",
                                   severity: "light",
                                   is_tenant_responsible: false,
                                   photo_paths: [],
                                 }
                               : undefined
                           )
                         }
                       >
                         <div className="flex gap-4">
                           <Label className="flex items-center gap-2 cursor-pointer">
                             <RadioGroupItem value="ok" />
                             <span className="text-green-600">In Ordnung</span>
                           </Label>
                           <Label className="flex items-center gap-2 cursor-pointer">
                             <RadioGroupItem value="defect" />
                             <span className="text-destructive">Mangel</span>
                           </Label>
                         </div>
                       </RadioGroup>
 
                       {item.status === "defect" && (
                         <div className="space-y-3 pl-4 border-l-2 border-destructive/30">
                           <div className="space-y-1">
                             <Label className="text-xs">Beschreibung</Label>
                             <Textarea
                               placeholder="Beschreiben Sie den Mangel..."
                               value={item.defect?.description || ""}
                               onChange={(e) =>
                                 updateItemStatus(item.id, "defect", {
                                   ...item.defect!,
                                   description: e.target.value,
                                 })
                               }
                               rows={2}
                             />
                           </div>
                           <div className="space-y-1">
                             <Label className="text-xs">Schweregrad</Label>
                             <Select
                               value={item.defect?.severity || "light"}
                               onValueChange={(val) =>
                                 updateItemStatus(item.id, "defect", {
                                   ...item.defect!,
                                   severity: val as DefectSeverity,
                                 })
                               }
                             >
                               <SelectTrigger>
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="light">Leicht</SelectItem>
                                 <SelectItem value="medium">Mittel</SelectItem>
                                 <SelectItem value="severe">Schwer</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           <label className="flex items-center gap-2 cursor-pointer">
                             <Checkbox
                               checked={item.defect?.is_tenant_responsible}
                               onCheckedChange={(checked) =>
                                 updateItemStatus(item.id, "defect", {
                                   ...item.defect!,
                                   is_tenant_responsible: !!checked,
                                 })
                               }
                             />
                             <span className="text-sm">
                               Kostenpflichtig für Mieter
                             </span>
                           </label>
                           <PhotoCapture
                             onCapture={async (blob) => {
                               if (!id) return;
                               const path = `${id}/defects/${item.id}/${Date.now()}.jpg`;
                               const url = await uploadFile(blob, path);
                               updateItemStatus(item.id, "defect", {
                                 ...item.defect!,
                                 photo_paths: [
                                   ...(item.defect?.photo_paths || []),
                                   url,
                                 ],
                               });
                             }}
                           />
                         </div>
                       )}
                     </AccordionContent>
                   </AccordionItem>
                 ))}
               </Accordion>
 
               {/* Room photos */}
               <div className="space-y-2">
                 <Label>Fotos des Raums</Label>
                 <div className="flex gap-2 flex-wrap">
                   {currentRoom.photos.map((photo, i) => (
                     <img
                       key={i}
                       src={photo}
                       alt={`Foto ${i + 1}`}
                       className="w-20 h-20 object-cover rounded"
                     />
                   ))}
                   <PhotoCapture
                     onCapture={addRoomPhoto}
                     trigger={
                       <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-muted/50">
                         <Camera className="h-6 w-6 text-muted-foreground" />
                       </div>
                     }
                   />
                 </div>
               </div>
 
               {/* Room notes */}
               <div className="space-y-2">
                 <Label>Notizen</Label>
                 <Textarea
                   placeholder="Zusätzliche Anmerkungen zum Raum..."
                   value={currentRoom.notes}
                   onChange={(e) =>
                     setRooms((prev) =>
                       prev.map((room, i) =>
                         i === currentRoomIndex
                           ? { ...room, notes: e.target.value }
                           : room
                       )
                     )
                   }
                   rows={2}
                 />
               </div>
 
               {/* Navigation */}
               <div className="flex justify-between pt-4">
                 <Button
                   variant="outline"
                   onClick={() =>
                     currentRoomIndex > 0
                       ? setCurrentRoomIndex(currentRoomIndex - 1)
                       : null
                   }
                   disabled={currentRoomIndex === 0}
                 >
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Vorheriger
                 </Button>
                 <Button onClick={completeRoom}>
                   {currentRoomIndex < rooms.length - 1 ? (
                     <>
                       Nächster Raum
                       <ArrowRight className="h-4 w-4 ml-2" />
                     </>
                   ) : (
                     <>
                       Weiter zu Zählern
                       <ArrowRight className="h-4 w-4 ml-2" />
                     </>
                   )}
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Meters Section */}
         {currentSection === "meters" && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Gauge className="h-5 w-5" />
                 Zählerstände
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {meters.length === 0 ? (
                 <p className="text-muted-foreground text-center py-8">
                   Keine Zähler für diese Einheit gefunden.
                 </p>
               ) : (
                 meterReadings.map((reading, index) => (
                   <div
                     key={reading.meterId}
                     className="p-4 border rounded-lg space-y-3"
                   >
                     <div className="flex justify-between">
                       <div>
                         <div className="font-medium">{reading.meterNumber}</div>
                         <div className="text-sm text-muted-foreground capitalize">
                           {reading.meterType.replace("_", " ")}
                         </div>
                       </div>
                       <PhotoCapture
                         onCapture={async (blob) => {
                           if (!id) return;
                           const path = `${id}/meters/${reading.meterId}/${Date.now()}.jpg`;
                           const url = await uploadFile(blob, path);
                           setMeterReadings((prev) =>
                             prev.map((r, i) =>
                               i === index ? { ...r, photo: url } : r
                             )
                           );
                         }}
                       />
                     </div>
                     <div className="flex gap-2">
                       <Input
                         type="number"
                         placeholder="Zählerstand"
                         value={reading.value}
                         onChange={(e) =>
                           setMeterReadings((prev) =>
                             prev.map((r, i) =>
                               i === index ? { ...r, value: e.target.value } : r
                             )
                           )
                         }
                       />
                       {reading.photo && (
                         <img
                           src={reading.photo}
                           alt="Zählerfoto"
                           className="w-12 h-12 object-cover rounded"
                         />
                       )}
                     </div>
                   </div>
                 ))
               )}
 
               <div className="flex justify-between pt-4">
                 <Button variant="outline" onClick={() => setCurrentSection("rooms")}>
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Zurück
                 </Button>
                 <Button onClick={() => setCurrentSection("keys")}>
                   Weiter zu Schlüsseln
                   <ArrowRight className="h-4 w-4 ml-2" />
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Keys Section */}
         {currentSection === "keys" && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Key className="h-5 w-5" />
                 Schlüsselübergabe
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {keys.map((key, index) => (
                 <div
                   key={key.type}
                   className="flex items-center justify-between p-3 border rounded-lg"
                 >
                   <div className="flex items-center gap-3">
                     <Checkbox
                       checked={key.handedOver}
                       onCheckedChange={(checked) =>
                         setKeys((prev) =>
                           prev.map((k, i) =>
                             i === index
                               ? { ...k, handedOver: !!checked }
                               : k
                           )
                         )
                       }
                     />
                     <span>{key.label}</span>
                   </div>
                   <Input
                     type="number"
                     min="0"
                     className="w-20"
                     value={key.quantity}
                     onChange={(e) =>
                       setKeys((prev) =>
                         prev.map((k, i) =>
                           i === index
                             ? { ...k, quantity: parseInt(e.target.value) || 0 }
                             : k
                         )
                       )
                     }
                   />
                 </div>
               ))}
 
               <div className="flex justify-between pt-4">
                 <Button variant="outline" onClick={() => setCurrentSection("meters")}>
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Zurück
                 </Button>
                 <Button onClick={() => setCurrentSection("signatures")}>
                   Weiter zu Unterschriften
                   <ArrowRight className="h-4 w-4 ml-2" />
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Signatures Section */}
         {currentSection === "signatures" && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <FileSignature className="h-5 w-5" />
                 Unterschriften
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {/* Summary */}
               <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                 <h4 className="font-medium">Zusammenfassung</h4>
                 <div className="text-sm space-y-1">
                   <div className="flex justify-between">
                     <span>Räume geprüft:</span>
                     <span>{rooms.filter((r) => r.completed).length} / {rooms.length}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Mängel:</span>
                     <span className="text-destructive">
                       {rooms.flatMap((r) => r.items).filter((i) => i.status === "defect").length}
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span>Schlüssel übergeben:</span>
                     <span>
                       {keys.filter((k) => k.handedOver).reduce((sum, k) => sum + k.quantity, 0)}
                     </span>
                   </div>
                 </div>
               </div>
 
               {/* Signature buttons */}
               <div className="space-y-3">
                 {[
                   { type: "landlord" as const, label: "Vermieter" },
                   { type: "tenant" as const, label: "Mieter" },
                   { type: "witness" as const, label: "Zeuge (optional)" },
                 ].map((signer) => (
                   <div
                     key={signer.type}
                     className="flex items-center justify-between p-4 border rounded-lg"
                   >
                     <div className="flex items-center gap-2">
                       {signatures[signer.type] ? (
                         <CheckCircle className="h-5 w-5 text-green-600" />
                       ) : (
                         <div className="h-5 w-5 rounded-full border-2" />
                       )}
                       <span>{signer.label}</span>
                     </div>
                     {signatures[signer.type] ? (
                       <img
                         src={signatures[signer.type]}
                         alt={`Unterschrift ${signer.label}`}
                         className="h-12 border rounded bg-white"
                       />
                     ) : (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setSignatureDialogType(signer.type)}
                       >
                         Unterschreiben
                       </Button>
                     )}
                   </div>
                 ))}
               </div>
 
               <div className="flex justify-between pt-4">
                 <Button variant="outline" onClick={() => setCurrentSection("keys")}>
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Zurück
                 </Button>
                 <Button
                   size="lg"
                   onClick={completeProtocol}
                   disabled={!signatures.landlord || !signatures.tenant}
                 >
                   <CheckCircle className="h-4 w-4 mr-2" />
                   Protokoll abschließen
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
       </div>
 
       {/* Signature Dialog */}
       <Dialog
         open={!!signatureDialogType}
         onOpenChange={(open) => !open && setSignatureDialogType(null)}
       >
         <DialogContent>
           <DialogHeader>
             <DialogTitle>
               Unterschrift{" "}
               {signatureDialogType === "landlord"
                 ? "Vermieter"
                 : signatureDialogType === "tenant"
                 ? "Mieter"
                 : "Zeuge"}
             </DialogTitle>
           </DialogHeader>
           <SignaturePad
             onSave={handleSignature}
             onCancel={() => setSignatureDialogType(null)}
           />
         </DialogContent>
       </Dialog>
     </MainLayout>
   );
 }