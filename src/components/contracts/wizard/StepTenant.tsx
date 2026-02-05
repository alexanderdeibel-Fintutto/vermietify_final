 import { useState } from "react";
 import { Label } from "@/components/ui/label";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { useTenants } from "@/hooks/useTenants";
 import { User, UserPlus, Search, Mail, Phone, Calendar } from "lucide-react";
 import type { WizardData } from "../ContractWizard";
 
 interface StepTenantProps {
   data: WizardData;
   updateData: (updates: Partial<WizardData>) => void;
 }
 
 export function StepTenant({ data, updateData }: StepTenantProps) {
   const { useTenantsList } = useTenants();
   const { data: tenants } = useTenantsList();
   const [searchQuery, setSearchQuery] = useState("");
 
   // Filter tenants without active lease
   const availableTenants = tenants?.filter((t: any) => {
     const hasActiveLease = t.leases?.some((l: any) => l.is_active);
     if (hasActiveLease) return false;
     
     if (searchQuery) {
       const query = searchQuery.toLowerCase();
       const fullName = `${t.first_name} ${t.last_name}`.toLowerCase();
       return fullName.includes(query) || t.email?.toLowerCase().includes(query);
     }
     return true;
   }) || [];
 
   const handleTenantSelect = (tenantId: string) => {
     const tenant = tenants?.find((t: any) => t.id === tenantId);
     updateData({ tenantId, selectedTenant: tenant });
   };
 
   const handleNewTenantChange = (field: keyof WizardData["newTenant"], value: string) => {
     updateData({
       newTenant: { ...data.newTenant, [field]: value },
     });
   };
 
   return (
     <div className="space-y-6">
       <div>
         <h2 className="text-xl font-semibold mb-2">Mieter auswählen</h2>
         <p className="text-muted-foreground">
           Wählen Sie einen bestehenden Mieter oder legen Sie einen neuen an.
         </p>
       </div>
 
       <RadioGroup
         value={data.tenantMode}
         onValueChange={(value: "existing" | "new") => updateData({ tenantMode: value })}
         className="grid gap-4 md:grid-cols-2"
       >
         <Card className={`cursor-pointer transition-colors ${data.tenantMode === "existing" ? "border-primary" : ""}`}>
           <CardContent className="pt-6">
             <div className="flex items-center space-x-2">
               <RadioGroupItem value="existing" id="existing" />
               <Label htmlFor="existing" className="cursor-pointer flex items-center gap-2">
                 <User className="h-5 w-5" />
                 Bestehenden Mieter wählen
               </Label>
             </div>
           </CardContent>
         </Card>
         
         <Card className={`cursor-pointer transition-colors ${data.tenantMode === "new" ? "border-primary" : ""}`}>
           <CardContent className="pt-6">
             <div className="flex items-center space-x-2">
               <RadioGroupItem value="new" id="new" />
               <Label htmlFor="new" className="cursor-pointer flex items-center gap-2">
                 <UserPlus className="h-5 w-5" />
                 Neuen Mieter anlegen
               </Label>
             </div>
           </CardContent>
         </Card>
       </RadioGroup>
 
       {data.tenantMode === "existing" ? (
         <Card>
           <CardHeader>
             <CardTitle className="text-base">Mieter suchen</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input
                 placeholder="Nach Name oder E-Mail suchen..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-9"
               />
             </div>
             
             <Select
               value={data.tenantId}
               onValueChange={handleTenantSelect}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Mieter auswählen" />
               </SelectTrigger>
               <SelectContent>
                 {availableTenants.length === 0 ? (
                   <div className="p-2 text-sm text-muted-foreground text-center">
                     Keine verfügbaren Mieter gefunden
                   </div>
                 ) : (
                   availableTenants.map((tenant: any) => (
                     <SelectItem key={tenant.id} value={tenant.id}>
                       <div className="flex items-center gap-2">
                         <User className="h-4 w-4" />
                         {tenant.first_name} {tenant.last_name}
                         {tenant.email && (
                           <span className="text-muted-foreground">({tenant.email})</span>
                         )}
                       </div>
                     </SelectItem>
                   ))
                 )}
               </SelectContent>
             </Select>
 
             {data.selectedTenant && (
               <Card className="bg-muted/50">
                 <CardContent className="pt-4">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                       <span className="text-lg font-semibold text-primary">
                         {data.selectedTenant.first_name[0]}{data.selectedTenant.last_name[0]}
                       </span>
                     </div>
                     <div>
                       <p className="font-medium">
                         {data.selectedTenant.first_name} {data.selectedTenant.last_name}
                       </p>
                       {data.selectedTenant.email && (
                         <p className="text-sm text-muted-foreground flex items-center gap-1">
                           <Mail className="h-3 w-3" /> {data.selectedTenant.email}
                         </p>
                       )}
                       {data.selectedTenant.phone && (
                         <p className="text-sm text-muted-foreground flex items-center gap-1">
                           <Phone className="h-3 w-3" /> {data.selectedTenant.phone}
                         </p>
                       )}
                     </div>
                   </div>
                 </CardContent>
               </Card>
             )}
           </CardContent>
         </Card>
       ) : (
         <Card>
           <CardHeader>
             <CardTitle className="text-base">Neuen Mieter anlegen</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="firstName">Vorname *</Label>
                 <Input
                   id="firstName"
                   value={data.newTenant.firstName}
                   onChange={(e) => handleNewTenantChange("firstName", e.target.value)}
                   placeholder="Max"
                 />
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="lastName">Nachname *</Label>
                 <Input
                   id="lastName"
                   value={data.newTenant.lastName}
                   onChange={(e) => handleNewTenantChange("lastName", e.target.value)}
                   placeholder="Mustermann"
                 />
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="email">E-Mail *</Label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     id="email"
                     type="email"
                     value={data.newTenant.email}
                     onChange={(e) => handleNewTenantChange("email", e.target.value)}
                     placeholder="max@beispiel.de"
                     className="pl-9"
                   />
                 </div>
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="phone">Telefon</Label>
                 <div className="relative">
                   <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     id="phone"
                     type="tel"
                     value={data.newTenant.phone}
                     onChange={(e) => handleNewTenantChange("phone", e.target.value)}
                     placeholder="+49 123 456789"
                     className="pl-9"
                   />
                 </div>
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="birthDate">Geburtsdatum</Label>
                 <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     id="birthDate"
                     type="date"
                     value={data.newTenant.birthDate}
                     onChange={(e) => handleNewTenantChange("birthDate", e.target.value)}
                     className="pl-9"
                   />
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
       )}
     </div>
   );
 }