import { ReactNode, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationCenter } from '@/components/NotificationCenter';
import { CommandPalette } from '@/components/CommandPalette';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAppShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderBreadcrumb } from './HeaderBreadcrumb';
import fintuttoLogo from '@/assets/fintutto-logo.svg';
import fintuttoHorizontal from '@/assets/fintutto-horizontal.svg';
import { useCompany } from '@/contexts/CompanyContext';
import { getCompanyGradient, getCompanyShortName } from '@/lib/companyGradients';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { currentCompany } = useCompany();
  const companyGradient = getCompanyGradient(currentCompany?.theme_index ?? 0);
  const companyShortName = currentCompany?.is_personal
    ? 'Privat'
    : getCompanyShortName(currentCompany?.name || '');

  const handleNewBooking = useCallback(() => {
    navigate('/buchungen?action=new');
  }, [navigate]);

  const handleNewInvoice = useCallback(() => {
    navigate('/rechnungen?action=new');
  }, [navigate]);

  const handleUploadReceipt = useCallback(() => {
    navigate('/belege?action=upload');
  }, [navigate]);

  const handleScanReceipt = useCallback(() => {
    navigate('/belege?action=scan');
  }, [navigate]);

  // Register keyboard shortcuts
  useAppShortcuts({
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    onNewBooking: handleNewBooking,
    onNewInvoice: handleNewInvoice,
    onUploadReceipt: handleUploadReceipt,
    onSearch: () => setCommandPaletteOpen(true),
  });

  return (
    <SidebarProvider>
      <div
        className="min-h-screen flex w-full relative"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 100%, #e8a040 0%, #d08030 10%, #b06040 22%, #8a4060 36%, #5a2878 52%, #3d2060 70%, #1a1535 100%)',
        }}
      >
        <AppSidebar />
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <header className="relative z-10 h-14 border-b border-white/10 flex items-center px-4 bg-black/20 backdrop-blur-xl">
            {/* Left: Logo (desktop) / Mobile menu + logo */}
            <div className="flex items-center lg:hidden">
              <SidebarTrigger>
                <Menu className="h-6 w-6" />
              </SidebarTrigger>
              <img src={fintuttoLogo} alt="Fintutto" className="ml-3 h-8 w-8 rounded-lg" />
              <span className="ml-2 font-semibold gradient-text">Fintutto</span>
            </div>
            <div className="hidden lg:flex items-center shrink-0">
              <img src={fintuttoHorizontal} alt="Fintutto" className="h-9" />
            </div>

            {/* Company Short Name */}
            <div className="hidden lg:flex items-center ml-4">
              <div className="w-px h-5 bg-white/15 mr-4" />
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border backdrop-blur-sm"
                style={{
                  borderColor: companyGradient.borderColor,
                  color: companyGradient.accent,
                }}
              >
                {currentCompany?.is_personal ? '👤' : '🏢'}
                <span>{companyShortName}</span>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="hidden lg:flex items-center ml-4 mr-4">
              <div className="w-px h-5 bg-white/15 mr-5" />
              <HeaderBreadcrumb />
            </div>

            {/* Center: Search */}
            <div className="hidden lg:flex flex-1 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground gap-2 w-64 justify-start"
                onClick={() => setCommandPaletteOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span>Suche...</span>
                <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 ml-auto lg:ml-0 shrink-0">
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </header>
          {/* Mobile Breadcrumb + Company indicator */}
          <div
            className="relative z-10 lg:hidden px-4 py-2 backdrop-blur-sm border-b flex items-center gap-2"
            style={{
              background: companyGradient.gradient,
              borderBottomColor: companyGradient.borderColor,
            }}
          >
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full border shrink-0"
              style={{ borderColor: companyGradient.borderColor, color: companyGradient.accent }}
            >
              {currentCompany?.is_personal ? '👤 Privat' : `🏢 ${companyShortName}`}
            </span>
            <HeaderBreadcrumb />
          </div>
          <div className="relative z-10 flex-1 p-4 sm:p-6 lg:p-8 overflow-auto pb-24 lg:pb-8 bg-black/10">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNewBooking={handleNewBooking}
        onNewInvoice={handleNewInvoice}
        onUploadReceipt={handleUploadReceipt}
      />

      {/* Floating Action Button (mobile only) */}
      <FloatingActionButton
        onNewBooking={handleNewBooking}
        onNewInvoice={handleNewInvoice}
        onUploadReceipt={handleUploadReceipt}
        onScanReceipt={handleScanReceipt}
      />
    </SidebarProvider>
  );
}
