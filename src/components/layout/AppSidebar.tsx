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
  CalendarDays,
  TrendingUp,
  Leaf,
  Home,
  Zap,
  HelpCircle,
  History,
  Shield,
  Sparkles,
  BarChart3,
  Database,
  ShieldCheck,
  UserCog,
  BookOpen,
  FileBarChart,
  ClipboardCheck,
  Wallet,
  Scale,
  Send,
  FileCheck,
  Wrench,
  PiggyBank,
  DoorClosed,
  Handshake,
  TrendingDown,
  Sun,
  Globe,
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
import vermietifyLogo from "@/assets/vermietify-logo.svg";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Immobilien",
    icon: Building2,
    subItems: [
      { title: "Gebäude", url: "/properties" },
      { title: "Einheiten", url: "/einheiten" },
      { title: "Eigentümer", url: "/eigentuemer" },
      { title: "Betriebskosten", url: "/betriebskosten" },
      { title: "Zähler", url: "/zaehler" },
    ]
  },
  {
    title: "Mieter",
    icon: Users,
    subItems: [
      { title: "Übersicht", url: "/tenants" },
      { title: "Mietangebote", url: "/angebote" },
      { title: "Verträge", url: "/vertraege" },
      { title: "Kündigungen", url: "/kuendigungen" },
      { title: "Unterschriften", url: "/unterschriften" },
      { title: "Mietanpassungen", url: "/miete/anpassungen" },
      { title: "Inserate", url: "/inserate" },
      { title: "KdU-Richtwerte", url: "/kdu-richtwerte" },
    ]
  },
  {
    title: "Finanzen",
    icon: CreditCard,
    subItems: [
      { title: "Übersicht", url: "/finanzen" },
      { title: "Zahlungen", url: "/zahlungen" },
      { title: "Rechnungen", url: "/rechnungen" },
      { title: "Budget", url: "/budget" },
      { title: "Banking", url: "/banking" },
      { title: "Portfolio", url: "/portfolio" },
      { title: "Vermögen", url: "/vermoegen" },
    ]
  },
  {
    title: "Steuern",
    icon: Receipt,
    subItems: [
      { title: "Dashboard", url: "/steuern" },
      { title: "Erklärungen", url: "/steuern/erklaerungen" },
      { title: "Absetzungen", url: "/steuern/absetzungen" },
      { title: "Fristen", url: "/steuern/fristen" },
      { title: "Szenarien", url: "/steuern/szenarien" },
      { title: "Optimierung", url: "/steuern/optimierung" },
      { title: "Formulare", url: "/steuern/formulare" },
      { title: "ELSTER", url: "/steuern/elster" },
      { title: "DATEV", url: "/steuern/datev" },
      { title: "Compliance", url: "/steuern/compliance" },
      { title: "Export", url: "/steuern/export" },
      { title: "Österreich", url: "/steuern/oesterreich" },
      { title: "Schweiz", url: "/steuern/schweiz" },
      { title: "Grenzüberschreitend", url: "/steuern/grenzueberschreitend" },
    ]
  },
  {
    title: "Rechner",
    icon: Calculator,
    subItems: [
      { title: "Alle Rechner", url: "/rechner" },
      { title: "AfA-Rechner", url: "/rechner/afa" },
      { title: "Kaufpreis", url: "/rechner/kaufpreis" },
      { title: "Rendite", url: "/rechner/rendite" },
      { title: "Tilgung", url: "/rechner/tilgung" },
      { title: "Cashflow", url: "/rechner/cashflow" },
      { title: "Wertentwicklung", url: "/rechner/wertentwicklung" },
      { title: "CO₂-Kosten", url: "/co2" },
      { title: "Monte-Carlo", url: "/rechner/monte-carlo" },
      { title: "Szenarien", url: "/rechner/szenarien" },
      { title: "Objektvergleich", url: "/rechner/vergleich" },
      { title: "Indexmieten", url: "/rechner/indexmieten" },
    ]
  },
  { title: "Kalender", url: "/kalender", icon: CalendarDays },
  { title: "Aufgaben", url: "/aufgaben", icon: CheckSquare },
  { title: "Automatisierung", url: "/automatisierung", icon: Zap },
  { title: "Dokumente", url: "/documents", icon: FileText },
  {
    title: "Formulare",
    icon: FileCheck,
    subItems: [
      { title: "Alle Formulare", url: "/formulare" },
      { title: "Mietvertrag", url: "/formulare/mietvertrag" },
      { title: "Gewerbemietvertrag", url: "/formulare/gewerbemietvertrag" },
      { title: "Staffelmietvertrag", url: "/formulare/staffelmietvertrag" },
      { title: "Kündigung", url: "/formulare/kuendigung" },
      { title: "Eigenbedarf", url: "/formulare/eigenbedarf" },
      { title: "Abmahnung", url: "/formulare/abmahnung" },
      { title: "Mahnung", url: "/formulare/mahnung" },
      { title: "Mieterhöhung", url: "/formulare/mieterhoehung" },
      { title: "Mietaufhebung", url: "/formulare/mietaufhebung" },
      { title: "Nachtragsvereinbarung", url: "/formulare/nachtrag" },
      { title: "Untermieterlaubnis", url: "/formulare/untermieterlaubnis" },
      { title: "Hausordnung", url: "/formulare/hausordnung" },
      { title: "Mieterselbstauskunft", url: "/formulare/selbstauskunft" },
      { title: "Wohnungsgeberbestätigung", url: "/formulare/wohnungsgeberbestaetigung" },
      { title: "Mietminderung-Reaktion", url: "/formulare/mietminderung" },
      { title: "NK-Widerspruch", url: "/formulare/nebenkostenwiderspruch" },
      { title: "Mietschuldenfreiheit", url: "/formulare/mietschuldenfreiheit" },
      { title: "SEPA-Lastschrift", url: "/formulare/sepa" },
      { title: "Kautionsabrechnung", url: "/formulare/kautionsabrechnung" },
      { title: "Zahlungsplan", url: "/formulare/zahlungsplan" },
      { title: "Mietpreisbremse", url: "/formulare/mietpreisbremse" },
    ]
  },
  {
    title: "Kommunikation",
    icon: MessageSquare,
    subItems: [
      { title: "E-Mail verfassen", url: "/kommunikation/senden" },
      { title: "E-Mail-Vorlagen", url: "/kommunikation/vorlagen" },
      { title: "E-Mail-Verlauf", url: "/kommunikation/verlauf" },
      { title: "E-Mail-Eingang", url: "/kommunikation/eingang" },
      { title: "Empfangsadresse", url: "/kommunikation/empfang" },
      { title: "WhatsApp", url: "/whatsapp" },
      { title: "Massen-Nachrichten", url: "/kommunikation/bulk" },
      { title: "Analytics", url: "/kommunikation/analytics" },
    ]
  },
  {
    title: "Berichte",
    icon: BarChart3,
    subItems: [
      { title: "Report-Center", url: "/berichte" },
      { title: "Report-Builder", url: "/berichte/builder" },
      { title: "Analytics", url: "/berichte/analytics" },
    ]
  },
  {
    title: "Compliance",
    icon: ShieldCheck,
    subItems: [
      { title: "Dashboard", url: "/compliance" },
      { title: "Checkliste", url: "/compliance/checkliste" },
      { title: "Audit-Bereitschaft", url: "/compliance/audit" },
    ]
  },
  {
    title: "Daten",
    icon: Database,
    subItems: [
      { title: "Import/Export", url: "/daten" },
      { title: "Universal-Import", url: "/daten/import" },
    ]
  },
  {
    title: "Versicherungen",
    url: "/versicherungen",
    icon: Shield,
  },
  {
    title: "Wartung",
    icon: Wrench,
    subItems: [
      { title: "Dashboard", url: "/wartung" },
      { title: "Planung", url: "/wartung/planung" },
    ]
  },
  { title: "Kautionen", url: "/kautionen", icon: PiggyBank },
  { title: "Leerstand", url: "/leerstand", icon: DoorClosed },
  { title: "Dienstleister", url: "/dienstleister", icon: Handshake },
  { title: "Bewertung", url: "/bewertung", icon: TrendingDown },
  {
    title: "Energie",
    icon: Leaf,
    subItems: [
      { title: "Dashboard", url: "/energie" },
      { title: "Solar / PV", url: "/energie/solar" },
      { title: "Wärmepumpe", url: "/energie/waermepumpe" },
      { title: "Tarifmanager", url: "/energie/tarife" },
      { title: "Anbietervergleich", url: "/energie/anbieter" },
      { title: "Smart-Alerts", url: "/energie/alerts" },
      { title: "Verbrauchs-Heatmap", url: "/energie/heatmap" },
      { title: "Nebenkostenabrechnung", url: "/energie/abrechnung" },
      { title: "Zähler-OCR", url: "/energie/ocr" },
      { title: "Energie-Chat", url: "/energie/chat" },
      { title: "Mieterstrom", url: "/energie/mieterstrom" },
    ]
  },
  { title: "Wissen", url: "/wissen", icon: BookOpen },
  { title: "Empfehlungen", url: "/empfehlungen", icon: Sparkles },
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
    <Sidebar className="border-r-0 [&_[data-sidebar=sidebar]]:!bg-[linear-gradient(180deg,hsl(250_50%_18%)_0%,hsl(280_55%_38%)_55%,hsl(20_80%_55%)_100%)] dark:[&_[data-sidebar=sidebar]]:!bg-[linear-gradient(180deg,hsl(260_45%_10%)_0%,hsl(270_40%_20%)_55%,hsl(20_60%_30%)_100%)]">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={vermietifyLogo} alt="Vermietify Logo" className="h-10 w-10 rounded-lg" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">Vermietify</span>
            <span className="text-xs text-white/70">Immobilienverwaltung</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="bg-white/20" />

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

      <SidebarSeparator className="bg-white/20" />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/hilfe'}>
              <NavLink to="/hilfe" className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5" />
                <span>Hilfe</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/briefe' || location.pathname.startsWith('/briefe')}>
              <NavLink to="/briefe" className="flex items-center gap-3">
                <Mail className="h-5 w-5" />
                <span>Briefversand</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/settings'}>
              <NavLink to="/settings" className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span>Einstellungen</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-2 bg-white/20" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white/10">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-white/20 text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">
                  {getUserName()}
                </p>
                <p className="truncate text-xs text-white/60">
                  {user?.email}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-white/60" />
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
