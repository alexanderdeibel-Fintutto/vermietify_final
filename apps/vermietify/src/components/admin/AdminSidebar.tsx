 import { Link, useLocation } from "react-router-dom";
 import {
   Sidebar,
   SidebarContent,
   SidebarGroup,
   SidebarGroupContent,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarHeader,
 } from "@/components/ui/sidebar";
 import {
   LayoutDashboard,
   Users,
   Building2,
   BarChart3,
   Settings,
   ArrowLeft,
   Shield,
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 const adminMenuItems = [
   { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
   { icon: Users, label: "Benutzer", path: "/admin/benutzer" },
   { icon: Building2, label: "Organisationen", path: "/admin/organisationen" },
   { icon: BarChart3, label: "Analytics", path: "/analytics" },
   { icon: Settings, label: "Einstellungen", path: "/admin/settings" },
 ];
 
 export function AdminSidebar() {
   const location = useLocation();
 
   return (
     <Sidebar>
       <SidebarHeader className="border-b p-4">
         <div className="flex items-center gap-2">
           <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
             <Shield className="h-4 w-4 text-destructive" />
           </div>
           <span className="font-bold">Admin Panel</span>
         </div>
       </SidebarHeader>
       <SidebarContent>
         <SidebarGroup>
           <SidebarGroupLabel>Administration</SidebarGroupLabel>
           <SidebarGroupContent>
             <SidebarMenu>
               {adminMenuItems.map((item) => (
                 <SidebarMenuItem key={item.path}>
                   <SidebarMenuButton
                     asChild
                     isActive={location.pathname === item.path}
                   >
                     <Link to={item.path}>
                       <item.icon className="h-4 w-4" />
                       <span>{item.label}</span>
                     </Link>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
           </SidebarGroupContent>
         </SidebarGroup>
 
         <SidebarGroup className="mt-auto">
           <SidebarGroupContent>
             <SidebarMenu>
               <SidebarMenuItem>
                 <SidebarMenuButton asChild>
                   <Link to="/dashboard">
                     <ArrowLeft className="h-4 w-4" />
                     <span>Zurück zur App</span>
                   </Link>
                 </SidebarMenuButton>
               </SidebarMenuItem>
             </SidebarMenu>
           </SidebarGroupContent>
         </SidebarGroup>
       </SidebarContent>
     </Sidebar>
   );
 }