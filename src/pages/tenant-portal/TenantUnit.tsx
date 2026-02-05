 import { TenantLayout } from "@/components/tenant-portal/TenantLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Separator } from "@/components/ui/separator";
 import { useTenantPortal } from "@/hooks/useTenantPortal";
 import { LoadingState } from "@/components/shared";
 import {
   Building2,
   Home,
   Ruler,
   DoorClosed,
   Layers,
   Calendar,
   Euro,
   Phone,
   Mail,
   User,
   Wrench,
   AlertTriangle,
   FileText,
 } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 const emergencyContacts = [
   { name: "Feuerwehr", phone: "112", description: "Feuer, Unfall, Notarzt" },
   { name: "Polizei", phone: "110", description: "Einbruch, Diebstahl" },
   { name: "Gas-Notdienst", phone: "0800-111-0600", description: "Gasgeruch" },
   { name: "Wasser-Notdienst", phone: "0800-111-0600", description: "Rohrbruch" },
 ];
 
 export default function TenantUnit() {
   const { useTenantAccess } = useTenantPortal();
   const { data: access, isLoading } = useTenantAccess();
 
   if (isLoading) {
     return (
       <TenantLayout>
         <LoadingState />
       </TenantLayout>
     );
   }
 
   const tenant = access?.tenant as any;
   const unit = access?.unit as any;
   const building = unit?.building as any;
   const lease = access?.lease as any;
 
   const rentAmount = lease?.rent_amount ? Number(lease.rent_amount) / 100 : 0;
   const utilityAdvance = lease?.utility_advance ? Number(lease.utility_advance) / 100 : 0;
 
   return (
     <TenantLayout>
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl font-bold">Meine Wohnung</h1>
           <p className="text-muted-foreground">
             Alle Informationen zu Ihrer Wohnung auf einen Blick.
           </p>
         </div>
 
         {/* Unit Details */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Home className="h-5 w-5" />
               Wohnungsdetails
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               {building && (
                 <div className="flex items-start gap-3">
                   <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                   <div>
                     <p className="font-medium">{building.name}</p>
                     <p className="text-sm text-muted-foreground">
                       {building.address}, {building.postal_code} {building.city}
                     </p>
                   </div>
                 </div>
               )}
 
               <Separator />
 
               <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                     <DoorClosed className="h-5 w-5 text-blue-500" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Einheit</p>
                     <p className="font-medium">{unit?.unit_number || "-"}</p>
                   </div>
                 </div>
 
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                     <Ruler className="h-5 w-5 text-green-500" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Größe</p>
                     <p className="font-medium">{unit?.area || "-"} m²</p>
                   </div>
                 </div>
 
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                     <Home className="h-5 w-5 text-purple-500" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Zimmer</p>
                     <p className="font-medium">{unit?.rooms || "-"}</p>
                   </div>
                 </div>
 
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                     <Layers className="h-5 w-5 text-orange-500" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Etage</p>
                     <p className="font-medium">{unit?.floor !== null ? unit.floor : "-"}</p>
                   </div>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Lease Info */}
         {lease && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <FileText className="h-5 w-5" />
                 Mietvertrag
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                     <Calendar className="h-5 w-5 text-blue-500" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Mietbeginn</p>
                     <p className="font-medium">
                       {format(new Date(lease.start_date), "dd. MMMM yyyy", { locale: de })}
                     </p>
                   </div>
                 </div>
 
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                     <Euro className="h-5 w-5 text-green-500" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Kaltmiete</p>
                     <p className="font-medium">{rentAmount.toFixed(2)} €</p>
                   </div>
                 </div>
 
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                     <Euro className="h-5 w-5 text-orange-500" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Nebenkosten</p>
                     <p className="font-medium">{utilityAdvance.toFixed(2)} €</p>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Contacts */}
         <div className="grid gap-6 md:grid-cols-2">
           {/* Landlord Contact */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <User className="h-5 w-5" />
                 Vermieter-Kontakt
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
               <p className="text-muted-foreground text-sm">
                 Kontaktdaten nicht hinterlegt.
               </p>
               <div className="flex items-center gap-2 text-sm">
                 <Phone className="h-4 w-4 text-muted-foreground" />
                 <span className="text-muted-foreground">-</span>
               </div>
               <div className="flex items-center gap-2 text-sm">
                 <Mail className="h-4 w-4 text-muted-foreground" />
                 <span className="text-muted-foreground">-</span>
               </div>
             </CardContent>
           </Card>
 
           {/* Caretaker Contact */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Wrench className="h-5 w-5" />
                 Hausmeister
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
               <p className="text-muted-foreground text-sm">
                 Kein Hausmeister zugewiesen.
               </p>
               <div className="flex items-center gap-2 text-sm">
                 <Phone className="h-4 w-4 text-muted-foreground" />
                 <span className="text-muted-foreground">-</span>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Emergency Contacts */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <AlertTriangle className="h-5 w-5 text-red-500" />
               Notfallkontakte
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid gap-3 sm:grid-cols-2">
               {emergencyContacts.map((contact) => (
                 <div
                   key={contact.name}
                   className="flex items-center justify-between p-3 rounded-lg border"
                 >
                   <div>
                     <p className="font-medium">{contact.name}</p>
                     <p className="text-sm text-muted-foreground">{contact.description}</p>
                   </div>
                   <Button variant="outline" size="sm" asChild>
                     <a href={`tel:${contact.phone}`}>
                       <Phone className="h-4 w-4 mr-2" />
                       {contact.phone}
                     </a>
                   </Button>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
       </div>
     </TenantLayout>
   );
 }