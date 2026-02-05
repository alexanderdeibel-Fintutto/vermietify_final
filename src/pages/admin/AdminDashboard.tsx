 import { AdminLayout } from "@/components/admin/AdminLayout";
 import { StatCard } from "@/components/shared/StatCard";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { useAdminData } from "@/hooks/useAdminData";
 import { LoadingState } from "@/components/shared";
 import {
   Users,
   Building2,
   Home,
   CreditCard,
   Activity,
   Server,
   Database,
   HardDrive,
   CheckCircle,
 } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
 } from "recharts";
 
 // Mock login activity data
 const loginActivity = Array.from({ length: 30 }, (_, i) => ({
   date: format(new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000), "dd.MM"),
   logins: Math.floor(Math.random() * 50) + 10,
 }));
 
 export default function AdminDashboard() {
   const { useSystemStats, useRecentUsers, useRecentBuildings } = useAdminData();
   const { data: stats, isLoading: statsLoading } = useSystemStats();
   const { data: recentUsers = [], isLoading: usersLoading } = useRecentUsers();
   const { data: recentBuildings = [], isLoading: buildingsLoading } = useRecentBuildings();
 
   const isLoading = statsLoading || usersLoading || buildingsLoading;
 
   if (isLoading) {
     return (
       <AdminLayout title="Admin Dashboard">
         <LoadingState />
       </AdminLayout>
     );
   }
 
   return (
     <AdminLayout title="Admin Dashboard">
       <div className="space-y-6">
         {/* System Stats */}
         <div className="grid gap-4 md:grid-cols-5">
           <StatCard
             title="Benutzer"
             value={stats?.totalUsers || 0}
             icon={Users}
           />
           <StatCard
             title="Organisationen"
             value={stats?.totalOrgs || 0}
             icon={Building2}
           />
           <StatCard
             title="Gebäude"
             value={stats?.totalBuildings || 0}
             icon={Building2}
           />
           <StatCard
             title="Einheiten"
             value={stats?.totalUnits || 0}
             icon={Home}
           />
           <StatCard
             title="Aktive Abos"
             value={stats?.activeSubscriptions || 0}
             icon={CreditCard}
           />
         </div>
 
         {/* Activity Chart */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Activity className="h-5 w-5" />
               Login-Aktivität (30 Tage)
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={loginActivity}>
                   <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                   <XAxis dataKey="date" className="text-xs" />
                   <YAxis className="text-xs" />
                   <Tooltip />
                   <Line
                     type="monotone"
                     dataKey="logins"
                     stroke="hsl(var(--primary))"
                     strokeWidth={2}
                   />
                 </LineChart>
               </ResponsiveContainer>
             </div>
           </CardContent>
         </Card>
 
         <div className="grid gap-6 md:grid-cols-2">
           {/* Recent Users */}
           <Card>
             <CardHeader>
               <CardTitle>Neueste Benutzer</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-3">
                 {recentUsers.map((user: any) => (
                   <div
                     key={user.id}
                     className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                   >
                     <div>
                       <p className="font-medium">
                         {user.first_name} {user.last_name}
                       </p>
                       <p className="text-sm text-muted-foreground">
                         {user.organizations?.name || "Keine Org"}
                       </p>
                     </div>
                     <span className="text-xs text-muted-foreground">
                       {format(new Date(user.created_at), "dd.MM.yyyy", { locale: de })}
                     </span>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
 
           {/* Recent Buildings */}
           <Card>
             <CardHeader>
               <CardTitle>Neueste Gebäude</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-3">
                 {recentBuildings.map((building: any) => (
                   <div
                     key={building.id}
                     className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                   >
                     <div>
                       <p className="font-medium">{building.name}</p>
                       <p className="text-sm text-muted-foreground">
                         {building.city} - {building.organizations?.name}
                       </p>
                     </div>
                     <span className="text-xs text-muted-foreground">
                       {format(new Date(building.created_at), "dd.MM.yyyy", { locale: de })}
                     </span>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* System Health */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Server className="h-5 w-5" />
               System Health
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid gap-4 md:grid-cols-3">
               <div className="flex items-center gap-3 p-4 border rounded-lg">
                 <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                   <CheckCircle className="h-5 w-5 text-green-600" />
                 </div>
                 <div>
                   <p className="font-medium">API Status</p>
                   <p className="text-sm text-green-600">Operational</p>
                 </div>
               </div>
               <div className="flex items-center gap-3 p-4 border rounded-lg">
                 <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                   <Database className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                   <p className="font-medium">Datenbank</p>
                   <p className="text-sm text-muted-foreground">~50 MB</p>
                 </div>
               </div>
               <div className="flex items-center gap-3 p-4 border rounded-lg">
                 <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                   <HardDrive className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                   <p className="font-medium">Storage</p>
                   <p className="text-sm text-muted-foreground">~100 MB</p>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
     </AdminLayout>
   );
 }