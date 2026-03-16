 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader } from "@/components/shared/PageHeader";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Checkbox } from "@/components/ui/checkbox";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   ArrowLeft,
   ArrowRight,
   LogIn,
   LogOut,
   GripVertical,
   Plus,
   X,
   Play,
 } from "lucide-react";
 import { useBuildings } from "@/hooks/useBuildings";
 import { useTenants } from "@/hooks/useTenants";
 import { useHandover, DEFAULT_ROOMS, HandoverType } from "@/hooks/useHandover";
 
 interface Participant {
   type: "landlord" | "tenant" | "caretaker" | "witness";
   label: string;
   checked: boolean;
 }
 
 interface RoomConfig {
   id: string;
   name: string;
   enabled: boolean;
 }
 
 export default function NewHandover() {
   const navigate = useNavigate();
   const { useBuildingsList } = useBuildings();
   const { useTenantsList } = useTenants();
   const { data: buildingsData } = useBuildingsList(1, 100);
   const { data: tenantsData } = useTenantsList();
   const { createProtocol } = useHandover();
 
   const [step, setStep] = useState(1);
   const [handoverType, setHandoverType] = useState<HandoverType | null>(null);
   const [unitId, setUnitId] = useState("");
   const [tenantId, setTenantId] = useState("");
   const [scheduledDate, setScheduledDate] = useState("");
   const [scheduledTime, setScheduledTime] = useState("10:00");
   const [participants, setParticipants] = useState<Participant[]>([
     { type: "landlord", label: "Vermieter", checked: true },
     { type: "tenant", label: "Mieter", checked: true },
     { type: "caretaker", label: "Hausmeister", checked: false },
     { type: "witness", label: "Zeuge", checked: false },
   ]);
   const [rooms, setRooms] = useState<RoomConfig[]>(
     DEFAULT_ROOMS.map((r, i) => ({
       id: `room-${i}`,
       name: r.name,
       enabled: true,
     }))
   );
   const [newRoomName, setNewRoomName] = useState("");
 
   const buildings = buildingsData?.buildings || [];
   const tenants = tenantsData || [];
 
   const allUnits = buildings.flatMap((b: any) =>
     (b.units || []).map((u: any) => ({
       id: u.id,
       label: `${u.unit_number} - ${b.name}`,
       buildingName: b.name,
     }))
   );
 
   const toggleParticipant = (type: string) => {
     setParticipants((prev) =>
       prev.map((p) => (p.type === type ? { ...p, checked: !p.checked } : p))
     );
   };
 
   const toggleRoom = (id: string) => {
     setRooms((prev) =>
       prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
     );
   };
 
   const addRoom = () => {
     if (!newRoomName.trim()) return;
     setRooms((prev) => [
       ...prev,
       { id: `room-${Date.now()}`, name: newRoomName.trim(), enabled: true },
     ]);
     setNewRoomName("");
   };
 
   const removeRoom = (id: string) => {
     setRooms((prev) => prev.filter((r) => r.id !== id));
   };
 
   const canProceedStep1 =
     handoverType && unitId && scheduledDate && scheduledTime;
 
   const handleStartHandover = async () => {
     if (!handoverType || !unitId || !scheduledDate) return;
 
     const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
     const activeParticipants = participants
       .filter((p) => p.checked)
       .map((p) => ({ type: p.type, label: p.label }));
 
     const result = await createProtocol.mutateAsync({
       unit_id: unitId,
       tenant_id: tenantId || undefined,
       type: handoverType,
       scheduled_at: scheduledAt,
       participants: activeParticipants,
     });
 
     navigate(`/uebergaben/${result.id}?rooms=${rooms.filter((r) => r.enabled).map((r) => r.name).join(",")}`);
   };
 
   return (
     <MainLayout title="Neue Übergabe">
       <div className="max-w-2xl mx-auto space-y-6">
         <PageHeader
           title="Neue Übergabe"
           subtitle="Wohnungsübergabe planen und durchführen"
           actions={
             <Button variant="outline" onClick={() => navigate("/uebergaben")}>
               <ArrowLeft className="h-4 w-4 mr-2" />
               Zurück
             </Button>
           }
         />
 
         {/* Progress */}
         <div className="flex items-center gap-2">
           {[1, 2, 3].map((s) => (
             <div key={s} className="flex items-center gap-2">
               <div
                 className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                   step >= s
                     ? "bg-primary text-primary-foreground"
                     : "bg-muted text-muted-foreground"
                 }`}
               >
                 {s}
               </div>
               {s < 3 && <div className="w-12 h-0.5 bg-muted" />}
             </div>
           ))}
         </div>
 
         {/* Step 1: Grunddaten */}
         {step === 1 && (
           <Card>
             <CardHeader>
               <CardTitle>Schritt 1: Grunddaten</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               {/* Type Selection */}
               <div className="space-y-2">
                 <Label>Übergabe-Typ</Label>
                 <div className="grid grid-cols-2 gap-4">
                   <button
                     onClick={() => setHandoverType("move_in")}
                     className={`p-6 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                       handoverType === "move_in"
                         ? "border-primary bg-primary/5"
                         : "border-border hover:border-primary/50"
                     }`}
                   >
                     <LogIn className="h-8 w-8 text-green-600" />
                     <span className="font-medium">Einzug</span>
                   </button>
                   <button
                     onClick={() => setHandoverType("move_out")}
                     className={`p-6 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                       handoverType === "move_out"
                         ? "border-primary bg-primary/5"
                         : "border-border hover:border-primary/50"
                     }`}
                   >
                     <LogOut className="h-8 w-8 text-orange-600" />
                     <span className="font-medium">Auszug</span>
                   </button>
                 </div>
               </div>
 
               {/* Unit Selection */}
               <div className="space-y-2">
                 <Label>Einheit</Label>
                 <Select value={unitId} onValueChange={setUnitId}>
                   <SelectTrigger>
                     <SelectValue placeholder="Einheit auswählen..." />
                   </SelectTrigger>
                   <SelectContent>
                     {allUnits.map((u) => (
                       <SelectItem key={u.id} value={u.id}>
                         {u.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
 
               {/* Tenant Selection */}
               <div className="space-y-2">
                 <Label>Mieter</Label>
                 <Select value={tenantId} onValueChange={setTenantId}>
                   <SelectTrigger>
                     <SelectValue placeholder="Mieter auswählen..." />
                   </SelectTrigger>
                   <SelectContent>
                     {tenants.map((t) => (
                       <SelectItem key={t.id} value={t.id}>
                         {t.first_name} {t.last_name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
 
               {/* Date & Time */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Datum</Label>
                   <Input
                     type="date"
                     value={scheduledDate}
                     onChange={(e) => setScheduledDate(e.target.value)}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Uhrzeit</Label>
                   <Input
                     type="time"
                     value={scheduledTime}
                     onChange={(e) => setScheduledTime(e.target.value)}
                   />
                 </div>
               </div>
 
               {/* Participants */}
               <div className="space-y-2">
                 <Label>Teilnehmer</Label>
                 <div className="grid grid-cols-2 gap-2">
                   {participants.map((p) => (
                     <label
                       key={p.type}
                       className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50"
                     >
                       <Checkbox
                         checked={p.checked}
                         onCheckedChange={() => toggleParticipant(p.type)}
                       />
                       <span className="text-sm">{p.label}</span>
                     </label>
                   ))}
                 </div>
               </div>
 
               <div className="flex justify-end">
                 <Button
                   onClick={() => setStep(2)}
                   disabled={!canProceedStep1}
                 >
                   Weiter
                   <ArrowRight className="h-4 w-4 ml-2" />
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Step 2: Räume definieren */}
         {step === 2 && (
           <Card>
             <CardHeader>
               <CardTitle>Schritt 2: Räume definieren</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               <p className="text-sm text-muted-foreground">
                 Wählen Sie die Räume aus, die bei der Übergabe geprüft werden
                 sollen.
               </p>
 
               <div className="space-y-2">
                 {rooms.map((room, index) => (
                   <div
                     key={room.id}
                     className={`flex items-center gap-3 p-3 rounded border ${
                       room.enabled ? "bg-background" : "bg-muted/50 opacity-60"
                     }`}
                   >
                     <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                     <Checkbox
                       checked={room.enabled}
                       onCheckedChange={() => toggleRoom(room.id)}
                     />
                     <span className="flex-1">{room.name}</span>
                     <span className="text-xs text-muted-foreground">
                       #{index + 1}
                     </span>
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => removeRoom(room.id)}
                     >
                       <X className="h-4 w-4" />
                     </Button>
                   </div>
                 ))}
               </div>
 
               <div className="flex gap-2">
                 <Input
                   placeholder="Neuer Raum..."
                   value={newRoomName}
                   onChange={(e) => setNewRoomName(e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && addRoom()}
                 />
                 <Button variant="outline" onClick={addRoom}>
                   <Plus className="h-4 w-4 mr-2" />
                   Hinzufügen
                 </Button>
               </div>
 
               <div className="flex justify-between">
                 <Button variant="outline" onClick={() => setStep(1)}>
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Zurück
                 </Button>
                 <Button onClick={() => setStep(3)}>
                   Weiter
                   <ArrowRight className="h-4 w-4 ml-2" />
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Step 3: Übergabe starten */}
         {step === 3 && (
           <Card>
             <CardHeader>
               <CardTitle>Schritt 3: Übergabe starten</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Typ:</span>
                   <span className="font-medium">
                     {handoverType === "move_in" ? "Einzug" : "Auszug"}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Einheit:</span>
                   <span className="font-medium">
                     {allUnits.find((u) => u.id === unitId)?.label || "—"}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Mieter:</span>
                   <span className="font-medium">
                     {tenants.find((t) => t.id === tenantId)
                       ? `${tenants.find((t) => t.id === tenantId)?.first_name} ${
                           tenants.find((t) => t.id === tenantId)?.last_name
                         }`
                       : "—"}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Termin:</span>
                   <span className="font-medium">
                     {scheduledDate} um {scheduledTime} Uhr
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Räume:</span>
                   <span className="font-medium">
                     {rooms.filter((r) => r.enabled).length} ausgewählt
                   </span>
                 </div>
               </div>
 
               <div className="flex justify-between">
                 <Button variant="outline" onClick={() => setStep(2)}>
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Zurück
                 </Button>
                 <Button
                   size="lg"
                   onClick={handleStartHandover}
                   disabled={createProtocol.isPending}
                 >
                   <Play className="h-4 w-4 mr-2" />
                   Übergabe jetzt durchführen
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}
       </div>
     </MainLayout>
   );
 }