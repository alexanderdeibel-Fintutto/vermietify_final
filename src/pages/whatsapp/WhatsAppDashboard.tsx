 import { useState } from "react";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Card, CardContent } from "@/components/ui/card";
 import { MessageSquare, Users, FileText, Settings } from "lucide-react";
 import { useWhatsApp } from "@/hooks/useWhatsApp";
 import { LoadingState } from "@/components/shared/LoadingState";
 import { WhatsAppChats } from "@/components/whatsapp/WhatsAppChats";
 import { WhatsAppBroadcasts } from "@/components/whatsapp/WhatsAppBroadcasts";
 import { WhatsAppTemplates } from "@/components/whatsapp/WhatsAppTemplates";
 import { WhatsAppSettings } from "@/components/whatsapp/WhatsAppSettings";
 
 export default function WhatsAppDashboard() {
   const { stats, isLoading } = useWhatsApp();
   const [activeTab, setActiveTab] = useState("chats");
 
   if (isLoading) return <MainLayout title="WhatsApp"><LoadingState /></MainLayout>;
 
   return (
     <MainLayout 
       title="WhatsApp Business"
       breadcrumbs={[{ label: "WhatsApp" }]}
     >
       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">WhatsApp Business</h1>
           <p className="text-muted-foreground">Kommunizieren Sie direkt mit Ihren Mietern</p>
         </div>
 
         <div className="grid gap-4 md:grid-cols-3">
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-primary/10 p-2">
                   <MessageSquare className="h-5 w-5 text-primary" />
                 </div>
               </div>
               <div className="mt-4">
                 <p className="text-3xl font-bold">{stats.messagesToday}</p>
                 <p className="text-sm text-muted-foreground mt-1">Nachrichten heute</p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-accent p-2">
                   <Users className="h-5 w-5 text-accent-foreground" />
                 </div>
               </div>
               <div className="mt-4">
                 <p className="text-3xl font-bold">{stats.activeChats}</p>
                 <p className="text-sm text-muted-foreground mt-1">Aktive Chats</p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-start justify-between">
                 <div className="rounded-lg bg-secondary p-2">
                   <FileText className="h-5 w-5 text-secondary-foreground" />
                 </div>
               </div>
               <div className="mt-4">
                 <p className="text-3xl font-bold">{stats.templatesCount}</p>
                 <p className="text-sm text-muted-foreground mt-1">Genehmigte Vorlagen</p>
               </div>
             </CardContent>
           </Card>
         </div>
 
         <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList>
             <TabsTrigger value="chats" className="flex items-center gap-2">
               <MessageSquare className="h-4 w-4" />
               Chats
             </TabsTrigger>
             <TabsTrigger value="broadcasts" className="flex items-center gap-2">
               <Users className="h-4 w-4" />
               Broadcasts
             </TabsTrigger>
             <TabsTrigger value="templates" className="flex items-center gap-2">
               <FileText className="h-4 w-4" />
               Vorlagen
             </TabsTrigger>
             <TabsTrigger value="settings" className="flex items-center gap-2">
               <Settings className="h-4 w-4" />
               Einstellungen
             </TabsTrigger>
           </TabsList>
 
           <TabsContent value="chats" className="mt-4">
             <WhatsAppChats />
           </TabsContent>
 
           <TabsContent value="broadcasts" className="mt-4">
             <WhatsAppBroadcasts />
           </TabsContent>
 
           <TabsContent value="templates" className="mt-4">
             <WhatsAppTemplates />
           </TabsContent>
 
           <TabsContent value="settings" className="mt-4">
             <WhatsAppSettings />
           </TabsContent>
         </Tabs>
       </div>
     </MainLayout>
   );
 }