import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Pre-defined shortcuts for the app
export function useAppShortcuts(callbacks: {
  onOpenCommandPalette?: () => void;
  onNewBooking?: () => void;
  onNewInvoice?: () => void;
  onUploadReceipt?: () => void;
  onSearch?: () => void;
}) {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'k',
      ctrl: true,
      action: () => callbacks.onOpenCommandPalette?.(),
      description: 'Befehlspalette öffnen',
    },
    {
      key: 'd',
      alt: true,
      action: () => navigate('/'),
      description: 'Zum Dashboard',
    },
    {
      key: 'b',
      alt: true,
      action: () => navigate('/buchungen'),
      description: 'Zu Buchungen',
    },
    {
      key: 'r',
      alt: true,
      action: () => navigate('/rechnungen'),
      description: 'Zu Rechnungen',
    },
    {
      key: 'e',
      alt: true,
      action: () => navigate('/belege'),
      description: 'Zu Belegen',
    },
    {
      key: 'k',
      alt: true,
      action: () => navigate('/kontakte'),
      description: 'Zu Kontakten',
    },
    // Action shortcuts
    {
      key: 'n',
      ctrl: true,
      action: () => callbacks.onNewBooking?.(),
      description: 'Neue Buchung',
    },
    {
      key: 'i',
      ctrl: true,
      action: () => callbacks.onNewInvoice?.(),
      description: 'Neue Rechnung',
    },
    {
      key: 'u',
      ctrl: true,
      action: () => callbacks.onUploadReceipt?.(),
      description: 'Beleg hochladen',
    },
    {
      key: '/',
      action: () => callbacks.onSearch?.(),
      description: 'Suche öffnen',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
