 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { EmptyState } from "@/components/shared";
 import {
   Clock,
   MessageSquare,
   Home,
   Upload,
 } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 interface TenantActivitiesTabProps {
   tenant: any;
 }
 
 interface Activity {
   id: string;
   type: "payment" | "document" | "message" | "contract" | "move_in" | "move_out";
   title: string;
   description: string;
   date: string;
   icon: typeof Clock;
   iconColor: string;
 }
 
 export function TenantActivitiesTab({ tenant }: TenantActivitiesTabProps) {
   const activities: Activity[] = [];
 
   if (tenant.activeLease) {
     activities.push({
       id: `lease-start-${tenant.activeLease.id}`,
       type: "move_in",
       title: "Einzug",
       description: `Mietvertrag für ${tenant.activeLease.units?.unit_number} gestartet`,
       date: tenant.activeLease.start_date,
       icon: Home,
       iconColor: "text-green-500",
     });
   }
 
   tenant.messages?.forEach((msg: any) => {
     activities.push({
       id: `message-${msg.id}`,
       type: "message",
       title: msg.subject || "Nachricht",
       description: msg.content.substring(0, 100) + (msg.content.length > 100 ? "..." : ""),
       date: msg.created_at,
       icon: MessageSquare,
       iconColor: "text-blue-500",
     });
   });
 
   tenant.documents?.forEach((doc: any) => {
     activities.push({
       id: `document-${doc.id}`,
       type: "document",
       title: doc.title,
       description: `Dokument hochgeladen`,
       date: doc.created_at,
       icon: Upload,
       iconColor: "text-purple-500",
     });
   });
 
   tenant.allLeases
     ?.filter((lease: any) => !lease.is_active && lease.end_date)
     .forEach((lease: any) => {
       activities.push({
         id: `lease-end-${lease.id}`,
         type: "move_out",
         title: "Auszug",
         description: `Mietvertrag für ${lease.units?.unit_number} beendet`,
         date: lease.end_date,
         icon: Home,
         iconColor: "text-orange-500",
       });
     });
 
   activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
 
   const groupedActivities: Record<string, Activity[]> = {};
   activities.forEach((activity) => {
     const key = format(new Date(activity.date), "MMMM yyyy", { locale: de });
     if (!groupedActivities[key]) {
       groupedActivities[key] = [];
     }
     groupedActivities[key].push(activity);
   });
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <Clock className="h-5 w-5" />
           Aktivitäten
         </CardTitle>
       </CardHeader>
       <CardContent>
         {activities.length === 0 ? (
           <EmptyState
             icon={Clock}
             title="Keine Aktivitäten"
             description="Es wurden noch keine Aktivitäten für diesen Mieter erfasst."
           />
         ) : (
           <div className="space-y-8">
             {Object.entries(groupedActivities).map(([month, monthActivities]) => (
               <div key={month}>
                 <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                   {month}
                 </h3>
                 <div className="relative">
                   <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
 
                   <div className="space-y-4">
                     {monthActivities.map((activity) => {
                       const Icon = activity.icon;
                       return (
                         <div key={activity.id} className="relative flex gap-4">
                           <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border">
                             <Icon className={`h-4 w-4 ${activity.iconColor}`} />
                           </div>
 
                           <div className="flex-1 pb-4">
                             <div className="flex items-center justify-between">
                               <p className="font-medium">{activity.title}</p>
                               <span className="text-xs text-muted-foreground">
                                 {format(new Date(activity.date), "dd.MM.yyyy", { locale: de })}
                               </span>
                             </div>
                             <p className="text-sm text-muted-foreground mt-1">
                               {activity.description}
                             </p>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               </div>
             ))}
           </div>
         )}
       </CardContent>
     </Card>
   );
 }