 import { useState } from "react";
 import { NavLink, useLocation } from "react-router-dom";
 import { cn } from "@/lib/utils";
 import { Button } from "@/components/ui/button";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { useAuth } from "@/hooks/useAuth";
 import { useTenantPortal } from "@/hooks/useTenantPortal";
 import {
   LayoutDashboard,
   Home,
   Wallet,
   FileText,
   AlertTriangle,
   Gauge,
   MessageSquare,
   Settings,
   ChevronLeft,
   ChevronRight,
   LogOut,
 } from "lucide-react";
 
 const navItems = [
   { href: "/mieter-portal", icon: LayoutDashboard, label: "Dashboard" },
   { href: "/mieter-portal/wohnung", icon: Home, label: "Meine Wohnung" },
   { href: "/mieter-portal/finanzen", icon: Wallet, label: "Finanzen" },
   { href: "/mieter-portal/dokumente", icon: FileText, label: "Dokumente" },
   { href: "/mieter-portal/mangel-melden", icon: AlertTriangle, label: "Mangel melden" },
   { href: "/mieter-portal/zaehler", icon: Gauge, label: "Zähler" },
   { href: "/mieter-portal/nachrichten", icon: MessageSquare, label: "Nachrichten" },
   { href: "/mieter-portal/einstellungen", icon: Settings, label: "Einstellungen" },
 ];
 
 export function TenantSidebar() {
   const [collapsed, setCollapsed] = useState(false);
   const location = useLocation();
   const { profile, signOut } = useAuth();
   const { useTenantAccess } = useTenantPortal();
   const { data: access } = useTenantAccess();
 
   const tenantName = access?.tenant 
     ? `${(access.tenant as any).first_name} ${(access.tenant as any).last_name}`
     : profile?.first_name || "Mieter";
 
   return (
     <aside
       className={cn(
         "flex flex-col h-screen bg-card border-r transition-all duration-300",
         collapsed ? "w-16" : "w-64"
       )}
     >
       {/* Header */}
       <div className="h-16 flex items-center justify-between px-4 border-b">
         {!collapsed && (
           <div className="flex items-center gap-2">
             <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
               {tenantName.charAt(0)}
             </div>
             <div className="flex flex-col">
               <span className="text-sm font-medium truncate max-w-[140px]">
                 {tenantName}
               </span>
               <span className="text-xs text-muted-foreground">Mieter</span>
             </div>
           </div>
         )}
         <Button
           variant="ghost"
           size="icon"
           className="h-8 w-8"
           onClick={() => setCollapsed(!collapsed)}
         >
           {collapsed ? (
             <ChevronRight className="h-4 w-4" />
           ) : (
             <ChevronLeft className="h-4 w-4" />
           )}
         </Button>
       </div>
 
       {/* Navigation */}
       <ScrollArea className="flex-1 py-4">
         <nav className="space-y-1 px-2">
           {navItems.map((item) => {
             const isActive = location.pathname === item.href;
             return (
               <NavLink
                 key={item.href}
                 to={item.href}
                 className={cn(
                   "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                   isActive
                     ? "bg-primary text-primary-foreground"
                     : "text-muted-foreground hover:bg-muted hover:text-foreground"
                 )}
               >
                 <item.icon className="h-5 w-5 flex-shrink-0" />
                 {!collapsed && <span>{item.label}</span>}
               </NavLink>
             );
           })}
         </nav>
       </ScrollArea>
 
       {/* Footer */}
       <div className="border-t p-2">
         <Button
           variant="ghost"
           className={cn(
             "w-full justify-start gap-3 text-muted-foreground hover:text-destructive",
             collapsed && "justify-center"
           )}
           onClick={signOut}
         >
           <LogOut className="h-5 w-5" />
           {!collapsed && <span>Abmelden</span>}
         </Button>
       </div>
     </aside>
   );
 }