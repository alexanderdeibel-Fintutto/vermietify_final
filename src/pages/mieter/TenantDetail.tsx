import { useParams, Link } from "react-router-dom";
import { MieterAppPromoWidget } from "@/components/tenants/MieterAppPromoWidget";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader, StatCard, EmptyState, LoadingState } from "@/components/shared";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Card, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    User,
    Edit,
    MessageSquare,
    Home,
    FileText,
    CreditCard,
    FolderOpen,
    Clock,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Building2,
    AlertCircle,
  } from "lucide-react";
 import { useTenants } from "@/hooks/useTenants";
 import { TenantOverviewTab } from "@/components/tenants/TenantOverviewTab";
 import { TenantContractTab } from "@/components/tenants/TenantContractTab";
 import { TenantPaymentsTab } from "@/components/tenants/TenantPaymentsTab";
 import { TenantDocumentsTab } from "@/components/tenants/TenantDocumentsTab";
 import { TenantCommunicationTab } from "@/components/tenants/TenantCommunicationTab";
 import { TenantActivitiesTab } from "@/components/tenants/TenantActivitiesTab";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 const STATUS_CONFIG = {
   active: { label: "Aktiv", variant: "default" as const, className: "bg-green-500" },
   terminated: { label: "Gekündigt", variant: "secondary" as const, className: "bg-orange-500" },
   former: { label: "Ehemalig", variant: "outline" as const, className: "" },
 };
 
 export default function TenantDetail() {
    const { id } = useParams<{ id: string }>();
    const { useTenant } = useTenants();
   const { data: tenant, isLoading, error } = useTenant(id);
 
   if (isLoading) {
     return (
       <MainLayout title="Mieter laden...">
         <LoadingState />
       </MainLayout>
     );
   }
 
   if (error || !tenant) {
     return (
       <MainLayout title="Fehler">
         <EmptyState
           icon={AlertCircle}
           title="Mieter nicht gefunden"
           description="Der angeforderte Mieter konnte nicht gefunden werden."
           action={
             <Button asChild>
               <Link to="/tenants">Zurück zur Mieterliste</Link>
             </Button>
           }
         />
       </MainLayout>
     );
   }
 
   const statusConfig = STATUS_CONFIG[tenant.status] || STATUS_CONFIG.former;
   const initials = `${tenant.first_name.charAt(0)}${tenant.last_name.charAt(0)}`.toUpperCase();
   const fullName = `${tenant.first_name} ${tenant.last_name}`;
 
   return (
     <MainLayout
       title={fullName}
       breadcrumbs={[
         { label: "Dashboard", href: "/" },
         { label: "Mieter", href: "/tenants" },
         { label: fullName },
       ]}
     >
       <div className="space-y-6">
         <PageHeader
           title={fullName}
           subtitle={tenant.email || "Keine E-Mail hinterlegt"}
             actions={
               <div className="flex gap-2">
                 <Button variant="outline">
                   <Edit className="h-4 w-4 mr-2" />
                   Bearbeiten
                 </Button>
                 <Button>
                   <MessageSquare className="h-4 w-4 mr-2" />
                   Nachricht senden
                 </Button>
               </div>
             }
         />
 
          <MieterAppPromoWidget
            tenantId={id!}
            tenantName={fullName}
            tenantEmail={tenant.email || null}
          />

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
               <Avatar className="h-24 w-24">
                 <AvatarImage src={undefined} alt={fullName} />
                 <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                   {initials}
                 </AvatarFallback>
               </Avatar>
 
               <div className="flex-1 space-y-4">
                 <div className="flex flex-wrap items-center gap-3">
                   <h2 className="text-2xl font-bold">{fullName}</h2>
                   <Badge variant={statusConfig.variant} className={statusConfig.className}>
                     {statusConfig.label}
                   </Badge>
                 </div>
 
                 <div className="grid gap-3 md:grid-cols-3">
                   {tenant.email && (
                     <div className="flex items-center gap-2 text-sm">
                       <Mail className="h-4 w-4 text-muted-foreground" />
                       <a href={`mailto:${tenant.email}`} className="hover:text-primary">
                         {tenant.email}
                       </a>
                     </div>
                   )}
                   {tenant.phone && (
                     <div className="flex items-center gap-2 text-sm">
                       <Phone className="h-4 w-4 text-muted-foreground" />
                       <a href={`tel:${tenant.phone}`} className="hover:text-primary">
                         {tenant.phone}
                       </a>
                     </div>
                   )}
                   {(tenant.address || tenant.city) && (
                     <div className="flex items-center gap-2 text-sm">
                       <MapPin className="h-4 w-4 text-muted-foreground" />
                       <span>
                         {tenant.address}
                         {tenant.postal_code && `, ${tenant.postal_code}`}
                         {tenant.city && ` ${tenant.city}`}
                       </span>
                     </div>
                   )}
                 </div>
 
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Calendar className="h-4 w-4" />
                   Mieter seit {format(new Date(tenant.created_at), "MMMM yyyy", { locale: de })}
                 </div>
               </div>
 
               {tenant.activeLease && tenant.activeLease.units && (
                 <Card className="md:w-64">
                   <CardContent className="pt-4">
                     <div className="flex items-center gap-2 mb-2">
                       <Building2 className="h-4 w-4 text-muted-foreground" />
                       <span className="text-sm font-medium">Aktuelle Wohnung</span>
                     </div>
                     <Link
                       to={`/einheiten/${tenant.activeLease.units.id}`}
                       className="text-primary hover:underline font-medium"
                     >
                       {tenant.activeLease.units.unit_number}
                     </Link>
                     <p className="text-sm text-muted-foreground">
                       {tenant.activeLease.units.buildings?.name}
                     </p>
                   </CardContent>
                 </Card>
               )}
             </div>
           </CardContent>
         </Card>
 
         <Tabs defaultValue="overview" className="space-y-4">
           <TabsList className="flex-wrap">
             <TabsTrigger value="overview">
               <Home className="h-4 w-4 mr-2" />
               Übersicht
             </TabsTrigger>
             <TabsTrigger value="contract">
               <FileText className="h-4 w-4 mr-2" />
               Mietvertrag
             </TabsTrigger>
             <TabsTrigger value="payments">
               <CreditCard className="h-4 w-4 mr-2" />
               Zahlungen
             </TabsTrigger>
             <TabsTrigger value="documents">
               <FolderOpen className="h-4 w-4 mr-2" />
               Dokumente
             </TabsTrigger>
             <TabsTrigger value="communication">
               <MessageSquare className="h-4 w-4 mr-2" />
               Kommunikation
             </TabsTrigger>
             <TabsTrigger value="activities">
               <Clock className="h-4 w-4 mr-2" />
               Aktivitäten
             </TabsTrigger>
           </TabsList>
 
           <TabsContent value="overview">
             <TenantOverviewTab tenant={tenant} />
           </TabsContent>
 
           <TabsContent value="contract">
             <TenantContractTab tenant={tenant} />
           </TabsContent>
 
           <TabsContent value="payments">
             <TenantPaymentsTab tenantId={id!} leaseId={tenant.activeLease?.id} />
           </TabsContent>
 
           <TabsContent value="documents">
             <TenantDocumentsTab tenantId={id!} documents={tenant.documents} />
           </TabsContent>
 
           <TabsContent value="communication">
             <TenantCommunicationTab tenantId={id!} tenantName={fullName} />
           </TabsContent>
 
           <TabsContent value="activities">
             <TenantActivitiesTab tenant={tenant} />
           </TabsContent>
          </Tabs>
        </div>

       </MainLayout>
    );
  }