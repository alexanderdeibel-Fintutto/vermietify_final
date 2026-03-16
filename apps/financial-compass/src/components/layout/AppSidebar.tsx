import { useLocation } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  FolderOpen,
  Users,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  Link2,
  CreditCard,
  Landmark,
  Calendar,
  Mail,
  HelpCircle,
  Repeat,
  FileCheck,
  ClipboardList,
  Zap,
  Euro,
  UserCheck,
  ShoppingCart,
  User,
  Filter,
  Home,
  Briefcase,
  TrendingUp,
  Shield,
  Car,
  Wallet,
  Send,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import fintuttoHorizontalLogo from '@/assets/fintutto-horizontal.svg';
import { useCompany } from '@/contexts/CompanyContext';
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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NewCompanyDialog } from '@/components/company/NewCompanyDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  url: string;
  icon: any;
  businessOnly?: boolean;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Buchungen', url: '/buchungen', icon: Receipt },
  {
    title: 'Rechnungen', url: '/rechnungen', icon: FileText,
    children: [
      { title: 'Angebote', url: '/angebote', icon: FileCheck, businessOnly: true },
      { title: 'Aufträge', url: '/auftraege', icon: ClipboardList, businessOnly: true },
      { title: 'Wiederkehrend', url: '/wiederkehrend', icon: Repeat },
    ],
  },
  { title: 'Belege', url: '/belege', icon: FolderOpen },
  {
    title: 'Finanzen', url: '/bankkonten', icon: Landmark,
    children: [
      { title: 'Bankkonten', url: '/bankkonten', icon: CreditCard },
      { title: 'Bankverbindung', url: '/bankverbindung', icon: Link2 },
      { title: 'SEPA-Zahlungen', url: '/sepa', icon: Euro },
      { title: 'Zuordnungsregeln', url: '/zuordnungsregeln', icon: Filter },
    ],
  },
  {
    title: 'Vermögen', url: '/vermoegen', icon: Wallet,
    children: [
      { title: 'Immobilien', url: '/vermoegen/immobilien', icon: Home },
      { title: 'Gesellschaften', url: '/vermoegen/gesellschaften', icon: Briefcase },
      { title: 'Assets', url: '/vermoegen/assets', icon: TrendingUp },
      { title: 'Versicherungen', url: '/vermoegen/versicherungen', icon: Shield },
      { title: 'Fahrzeuge', url: '/vermoegen/fahrzeuge', icon: Car },
    ],
  },
  { title: 'Kalender', url: '/kalender', icon: Calendar },
  { title: 'Berichte', url: '/berichte', icon: BarChart3 },
  {
    title: 'Einstellungen', url: '/einstellungen', icon: Settings,
    children: [
      { title: 'Firmen', url: '/firmen', icon: Building2 },
      { title: 'Kontakte', url: '/kontakte', icon: Users },
      { title: 'Vorlagen', url: '/vorlagen', icon: Mail, businessOnly: true },
      { title: 'Automatisierung', url: '/automatisierung', icon: Zap, businessOnly: true },
      { title: 'Steuerberater', url: '/steuerberater', icon: UserCheck, businessOnly: true },
      { title: 'ELSTER', url: '/elster', icon: Landmark, businessOnly: true },
      { title: 'Einladungen', url: '/einladungen', icon: Send },
    ],
  },
  { title: 'Hilfe', url: '/hilfe', icon: HelpCircle },
];

const legalFormLabels: Record<string, string> = {
  gmbh: 'GmbH',
  ug: 'UG',
  ag: 'AG',
  kg: 'KG',
  ohg: 'OHG',
  gbr: 'GbR',
  einzelunternehmen: 'EU',
};

const avatarColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-amber-500',
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { companies, currentCompany, setCurrentCompany, personalCompany, businessCompanies } = useCompany();
  const { toast } = useToast();
  const [newCompanyOpen, setNewCompanyOpen] = useState(false);
  const isPersonal = currentCompany?.is_personal ?? false;

  // Filter nav items: hide businessOnly items in personal area
  const filteredNavItems = useMemo(() => {
    if (!isPersonal) return navItems;
    return navItems
      .filter(item => !item.businessOnly)
      .map(item => {
        if (item.children) {
          const filteredChildren = item.children.filter(child => !child.businessOnly);
          return { ...item, children: filteredChildren.length > 0 ? filteredChildren : undefined };
        }
        return item;
      });
  }, [isPersonal]);

  const isActive = (path: string) => location.pathname === path;

  // Auto-open collapsible if a child route is active
  const isChildActive = (item: NavItem) =>
    item.children?.some(child => isActive(child.url)) ?? false;

  const getAvatarColor = (index: number) => {
    return avatarColors[index % avatarColors.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCompanySwitch = (company: typeof currentCompany) => {
    if (!company || company.id === currentCompany?.id) return;
    
    // Trigger fade animation
    document.body.classList.add('animate-fade-out');
    
    setTimeout(() => {
      setCurrentCompany(company);
      document.body.classList.remove('animate-fade-out');
      document.body.classList.add('animate-fade-in');
      
      toast({
        title: company.is_personal ? 'Privatbereich' : 'Firma gewechselt',
        description: company.is_personal ? 'Gewechselt zum Privatbereich' : `Gewechselt zu ${company.name}`,
      });
      
      setTimeout(() => {
        document.body.classList.remove('animate-fade-in');
      }, 300);
    }, 150);
  };

  return (
    <>
      <Sidebar
        className="border-r border-white/10 overflow-hidden bg-black/30 backdrop-blur-sm"
      >
      <SidebarHeader className="p-5 border-b border-white/10">
        <div className="flex items-center justify-center">
          <img src={fintuttoHorizontalLogo} alt="Fintutto" className="h-12" />
        </div>

        {/* Company Selector */}
        {companies.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full mt-4 justify-between text-left h-auto py-2 px-2 bg-sidebar-accent hover:bg-sidebar-accent/80"
              >
                <div className="flex items-center gap-2 truncate flex-1">
                  {currentCompany?.is_personal ? (
                    <Avatar className="h-7 w-7 shrink-0 bg-emerald-500">
                      <AvatarFallback className="text-white text-xs font-bold bg-emerald-500">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className={cn('h-7 w-7 shrink-0', getAvatarColor(companies.findIndex(c => c.id === currentCompany?.id)))}>
                      <AvatarFallback className="text-white text-xs font-bold">
                        {currentCompany ? getInitials(currentCompany.name) : 'F'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="truncate flex-1 min-w-0">
                    <span className="truncate block text-sm">{currentCompany?.name || 'Bereich wählen'}</span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {/* Personal area */}
              {personalCompany && (
                <DropdownMenuItem
                  onClick={() => handleCompanySwitch(personalCompany)}
                  className={currentCompany?.id === personalCompany.id ? 'bg-accent' : ''}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Avatar className="h-6 w-6 shrink-0 bg-emerald-500">
                      <AvatarFallback className="text-white text-xs font-bold bg-emerald-500">
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate flex-1">Privat</span>
                    <Badge variant="outline" className="text-xs shrink-0">Privat</Badge>
                  </div>
                </DropdownMenuItem>
              )}
              {/* Separator between personal and business */}
              {personalCompany && businessCompanies.length > 0 && (
                <Separator className="my-1" />
              )}
              {/* Business companies */}
              {businessCompanies.map((company, index) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => handleCompanySwitch(company)}
                  className={currentCompany?.id === company.id ? 'bg-accent' : ''}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Avatar className={cn('h-6 w-6 shrink-0', getAvatarColor(index))}>
                      <AvatarFallback className="text-white text-xs font-bold">
                        {getInitials(company.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate flex-1">{company.name}</span>
                    {(company as any).legal_form && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {legalFormLabels[(company as any).legal_form] || (company as any).legal_form}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <Separator className="my-1" />
              <DropdownMenuItem onClick={() => setNewCompanyOpen(true)}>
                <div className="flex items-center gap-2 w-full text-muted-foreground">
                  <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                    <Plus className="h-3 w-3" />
                  </div>
                  <span>Neue Firma hinzufügen</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) =>
                item.children ? (
                  <SidebarMenuItem key={item.title}>
                    <Collapsible defaultOpen={isActive(item.url) || isChildActive(item)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton asChild>
                        <NavLink
                            to={item.url}
                            end
                            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-sidebar-accent group"
                            activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                          >
                            <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'text-sidebar-foreground' : 'text-muted-foreground'}`} />
                            <span className="flex-1">{item.title}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                          </NavLink>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenu className="ml-4 mt-1 border-l border-white/10 pl-2">
                          {item.children.map((child) => (
                            <SidebarMenuItem key={child.title}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={child.url}
                                  className="flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-sidebar-accent text-sm"
                                  activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                                >
                                  <child.icon className={`h-4 w-4 ${isActive(child.url) ? 'text-sidebar-foreground' : 'text-muted-foreground'}`} />
                                  <span>{child.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                      >
                        <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'text-sidebar-foreground' : 'text-muted-foreground'}`} />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/20 text-primary">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
      </Sidebar>

      <NewCompanyDialog open={newCompanyOpen} onOpenChange={setNewCompanyOpen} />
    </>
  );
}
