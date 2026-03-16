import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  FolderOpen,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const mainNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Buchungen', url: '/buchungen', icon: Receipt },
  { title: 'Rechnungen', url: '/rechnungen', icon: FileText },
  { title: 'Belege', url: '/belege', icon: FolderOpen },
];

const moreNavItems = [
  { title: 'Wiederkehrend', url: '/wiederkehrend' },
  { title: 'Angebote', url: '/angebote' },
  { title: 'Aufträge', url: '/auftraege' },
  { title: 'Kontakte', url: '/kontakte' },
  { title: 'Bankkonten', url: '/bankkonten' },
  { title: 'Bankverbindung', url: '/bankverbindung' },
  { title: 'SEPA-Zahlungen', url: '/sepa' },
  
  { title: 'Kalender', url: '/kalender' },
  { title: 'ELSTER', url: '/elster' },
  { title: 'Berichte', url: '/berichte' },
  { title: 'Automatisierung', url: '/automatisierung' },
  { title: 'Steuerberater', url: '/steuerberater' },
  { title: 'E-Commerce', url: '/ecommerce' },
  { title: 'Firmen', url: '/firmen' },
  { title: 'Vorlagen', url: '/vorlagen' },
  { title: 'Einstellungen', url: '/einstellungen' },
  { title: 'Hilfe', url: '/hilfe' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (url: string) => {
    navigate(url);
    setMoreOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/30 backdrop-blur-xl border-t border-white/10 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {mainNavItems.map((item) => (
          <button
            key={item.url}
            onClick={() => navigate(item.url)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
              isActive(item.url)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.title}</span>
          </button>
        ))}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                moreOpen
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">Mehr</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Weitere Menüpunkte</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 overflow-y-auto pb-safe">
              {moreNavItems.map((item) => (
                <Button
                  key={item.url}
                  variant={isActive(item.url) ? 'default' : 'outline'}
                  className="h-auto py-4 flex-col gap-1"
                  onClick={() => handleNavigate(item.url)}
                >
                  <span className="text-xs font-medium truncate w-full text-center">
                    {item.title}
                  </span>
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
