import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  Receipt,
  Users,
  Landmark,
  Link2,
  FileBarChart,
  Settings,
  Building2,
  
  CalendarDays,
  Mail,
  Bell,
  HelpCircle,
  Repeat,
  FileCheck,
  FileSignature,
  Bot,
  CreditCard,
  Briefcase,
  ShoppingCart,
  Send,
} from 'lucide-react';

const routeMap: Record<string, { label: string; icon?: React.ElementType }> = {
  '/': { label: 'Dashboard', icon: LayoutDashboard },
  '/buchungen': { label: 'Buchungen', icon: ArrowLeftRight },
  '/wiederkehrend': { label: 'Wiederkehrend', icon: Repeat },
  '/angebote': { label: 'Angebote', icon: FileSignature },
  '/auftraege': { label: 'Aufträge', icon: FileCheck },
  '/rechnungen': { label: 'Rechnungen', icon: FileText },
  '/belege': { label: 'Belege', icon: Receipt },
  '/kontakte': { label: 'Kontakte', icon: Users },
  '/finanzen': { label: 'Finanzen', icon: Landmark },
  '/bankkonten': { label: 'Bankkonten', icon: Landmark },
  '/bankverbindung': { label: 'Bankverbindung', icon: Link2 },
  '/elster': { label: 'ELSTER', icon: Send },
  '/berichte': { label: 'Berichte', icon: FileBarChart },
  '/automatisierung': { label: 'Automatisierung', icon: Bot },
  '/sepa': { label: 'SEPA-Zahlungen', icon: CreditCard },
  '/steuerberater': { label: 'Steuerberater', icon: Briefcase },
  '/ecommerce': { label: 'E-Commerce', icon: ShoppingCart },
  '/einstellungen': { label: 'Einstellungen', icon: Settings },
  '/firmen': { label: 'Firmen', icon: Building2 },
  
  '/kalender': { label: 'Kalender', icon: CalendarDays },
  '/vorlagen': { label: 'E-Mail-Vorlagen', icon: Mail },
  '/benachrichtigungen': { label: 'Benachrichtigungen', icon: Bell },
  '/hilfe': { label: 'Hilfe', icon: HelpCircle },
};

// Parent groupings for certain routes
const routeParents: Record<string, string> = {
  '/angebote': '/rechnungen',
  '/auftraege': '/rechnungen',
  '/wiederkehrend': '/rechnungen',
  '/bankkonten': '/finanzen',
  '/bankverbindung': '/finanzen',
  '/sepa': '/finanzen',
  '/firmen': '/einstellungen',
  '/kontakte': '/einstellungen',
  '/vorlagen': '/einstellungen',
  '/automatisierung': '/einstellungen',
  '/steuerberater': '/einstellungen',
  '/elster': '/einstellungen',
};

export function HeaderBreadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;

  const current = routeMap[pathname];
  if (!current) return null;

  // Build breadcrumb chain
  const crumbs: { path: string; label: string; icon?: React.ElementType }[] = [];

  // Always start with Dashboard if not on dashboard
  if (pathname !== '/') {
    crumbs.push({ path: '/', ...routeMap['/'] });
  }

  // Add parent if exists
  const parentPath = routeParents[pathname];
  if (parentPath && routeMap[parentPath]) {
    crumbs.push({ path: parentPath, ...routeMap[parentPath] });
  }

  // Current page
  crumbs.push({ path: pathname, ...current });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const Icon = crumb.icon;

          return (
            <BreadcrumbItem key={crumb.path}>
              {index > 0 && <BreadcrumbSeparator />}
              {isLast ? (
                <BreadcrumbPage className="flex items-center gap-1.5 text-foreground font-medium">
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    to={crumb.path}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
