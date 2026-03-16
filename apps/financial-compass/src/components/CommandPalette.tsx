import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  BookOpen,
  PlusCircle,
  Upload,
  Settings,
  HelpCircle,
  Building2,
  CreditCard,
  BarChart3,
  Calculator,
  Search,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewBooking?: () => void;
  onNewInvoice?: () => void;
  onUploadReceipt?: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette({
  open,
  onOpenChange,
  onNewBooking,
  onNewInvoice,
  onUploadReceipt,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const navigationCommands: CommandItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      shortcut: '⌥D',
      action: () => navigate('/'),
      keywords: ['home', 'übersicht', 'start'],
    },
    {
      id: 'buchungen',
      label: 'Buchungen',
      icon: BookOpen,
      shortcut: '⌥B',
      action: () => navigate('/buchungen'),
      keywords: ['transaktionen', 'journal'],
    },
    {
      id: 'rechnungen',
      label: 'Rechnungen',
      icon: FileText,
      shortcut: '⌥R',
      action: () => navigate('/rechnungen'),
      keywords: ['invoices', 'ausgangsrechnungen'],
    },
    {
      id: 'belege',
      label: 'Belege',
      icon: Receipt,
      shortcut: '⌥E',
      action: () => navigate('/belege'),
      keywords: ['receipts', 'eingangsrechnungen', 'dokumente'],
    },
    {
      id: 'kontakte',
      label: 'Kontakte',
      icon: Users,
      shortcut: '⌥K',
      action: () => navigate('/kontakte'),
      keywords: ['kunden', 'lieferanten', 'adressen'],
    },
    {
      id: 'konten',
      label: 'Kontenplan',
      icon: Calculator,
      action: () => navigate('/konten'),
      keywords: ['chart of accounts', 'skr03', 'buchhaltung'],
    },
    {
      id: 'berichte',
      label: 'Berichte',
      icon: BarChart3,
      action: () => navigate('/berichte'),
      keywords: ['reports', 'bwa', 'bilanz', 'guv'],
    },
    {
      id: 'bank',
      label: 'Bankkonten',
      icon: CreditCard,
      action: () => navigate('/bank'),
      keywords: ['bankverbindung', 'finapi'],
    },
    {
      id: 'firmen',
      label: 'Firmen',
      icon: Building2,
      action: () => navigate('/firmen'),
      keywords: ['companies', 'mandanten', 'unternehmen'],
    },
    {
      id: 'einstellungen',
      label: 'Einstellungen',
      icon: Settings,
      action: () => navigate('/einstellungen'),
      keywords: ['settings', 'konfiguration'],
    },
  ];

  const actionCommands: CommandItem[] = [
    {
      id: 'new-booking',
      label: 'Neue Buchung erstellen',
      icon: PlusCircle,
      shortcut: '⌘N',
      action: () => {
        onOpenChange(false);
        onNewBooking?.();
      },
      keywords: ['create', 'neu', 'hinzufügen'],
    },
    {
      id: 'new-invoice',
      label: 'Neue Rechnung erstellen',
      icon: FileText,
      shortcut: '⌘I',
      action: () => {
        onOpenChange(false);
        onNewInvoice?.();
      },
      keywords: ['create invoice', 'rechnung schreiben'],
    },
    {
      id: 'upload-receipt',
      label: 'Beleg hochladen',
      icon: Upload,
      shortcut: '⌘U',
      action: () => {
        onOpenChange(false);
        onUploadReceipt?.();
      },
      keywords: ['upload', 'scan', 'import'],
    },
  ];

  const themeCommands: CommandItem[] = [
    {
      id: 'theme-light',
      label: 'Heller Modus',
      icon: Sun,
      action: () => setTheme('light'),
      keywords: ['light mode', 'hell', 'tag'],
    },
    {
      id: 'theme-dark',
      label: 'Dunkler Modus',
      icon: Moon,
      action: () => setTheme('dark'),
      keywords: ['dark mode', 'dunkel', 'nacht'],
    },
    {
      id: 'theme-system',
      label: 'System-Theme',
      icon: Monitor,
      action: () => setTheme('system'),
      keywords: ['auto', 'automatisch', 'system'],
    },
  ];

  const helpCommands: CommandItem[] = [
    {
      id: 'help',
      label: 'Hilfe & Support',
      icon: HelpCircle,
      action: () => navigate('/hilfe'),
      keywords: ['support', 'faq', 'anleitung'],
    },
    {
      id: 'shortcuts',
      label: 'Tastaturkürzel anzeigen',
      icon: Search,
      action: () => {
        alert('Tastaturkürzel:\n\n⌘K - Befehlspalette\n⌥D - Dashboard\n⌥B - Buchungen\n⌥R - Rechnungen\n⌥E - Belege\n⌥K - Kontakte\n⌘N - Neue Buchung\n⌘I - Neue Rechnung\n⌘U - Beleg hochladen');
      },
      keywords: ['keyboard', 'hotkeys'],
    },
  ];

  const handleSelect = (command: CommandItem) => {
    command.action();
    onOpenChange(false);
  };

  // Listen for Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Suche nach Seiten, Aktionen..." />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>

        <CommandGroup heading="Schnellaktionen">
          {actionCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => handleSelect(cmd)}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navigationCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => handleSelect(cmd)}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Darstellung">
          {themeCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => handleSelect(cmd)}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
              {((cmd.id === 'theme-light' && theme === 'light') ||
                (cmd.id === 'theme-dark' && theme === 'dark') ||
                (cmd.id === 'theme-system' && theme === 'system')) && (
                <span className="ml-auto text-xs text-primary">Aktiv</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Hilfe">
          {helpCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => handleSelect(cmd)}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
