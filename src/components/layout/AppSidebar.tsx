import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  MessageSquare, 
  Settings,
  LogOut,
  ChevronDown,
  CreditCard,
  FileSignature,
  Receipt,
  Gauge,
  CheckSquare,
  DoorOpen,
   ChevronRight,
   Mail,
   Calculator,
   PenTool,
   MessageCircle,
   CalendarDays
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Kalender", url: "/kalender", icon: CalendarDays },
  { 
    title: "Immobilien", 
    icon: Building2,
    subItems: [
      { title: "Gebäude", url: "/properties" },
      { title: "Einheiten", url: "/properties#einheiten" },
    ]
  },
  { title: "Mieter", url: "/tenants", icon: Users },
  { title: "Verträge", url: "/vertraege", icon: FileSignature },
  { title: "Zahlungen", url: "/zahlungen", icon: CreditCard },
  { title: "Betriebskosten", url: "/betriebskosten", icon: Receipt },
  { title: "Zähler", url: "/zaehler", icon: Gauge },
  { title: "Aufgaben", url: "/aufgaben", icon: CheckSquare },
   { title: "Briefversand", url: "/briefe", icon: Mail },
   { title: "Unterschriften", url: "/unterschriften", icon: PenTool },
   { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle },
  { title: "Dokumente", url: "/documents", icon: FileText },
   { title: "Steuern", url: "/taxes", icon: Calculator },
  { title: "Kommunikation", url: "/communication", icon: MessageSquare },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'V';
  };

  const getUserName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || 'Benutzer';
  };

  const isActive = (url: string) => location.pathname === url;
  const isSubmenuActive = (subItems: { url: string }[]) => 
    subItems.some(item => location.pathname === item.url || location.pathname.startsWith(item.url.split('#')[0]));

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-sidebar-foreground">Vermietify</span>
            <span className="text-xs text-sidebar-foreground/60">Immobilienverwaltung</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                if (item.subItems) {
                  const submenuActive = isSubmenuActive(item.subItems);
                  return (
                    <Collapsible
                      key={item.title}
                      open={openSubmenu === item.title || submenuActive}
                      onOpenChange={(open) => setOpenSubmenu(open ? item.title : null)}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full justify-between">
                            <div className="flex items-center gap-3">
                              <item.icon className="h-5 w-5" />
                              <span>{item.title}</span>
                            </div>
                            <ChevronRight className={`h-4 w-4 transition-transform ${openSubmenu === item.title || submenuActive ? 'rotate-90' : ''}`} />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={isActive(subItem.url.split('#')[0])}>
                                  <NavLink to={subItem.url}>
                                    {subItem.title}
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3"
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/settings'}>
              <NavLink to="/settings" className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span>Einstellungen</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-sidebar-accent">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {getUserName()}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {user?.email}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
