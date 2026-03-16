import { Plus, Upload, FileText, Receipt, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QuickActionsProps {
  onNewBooking?: () => void;
  onNewInvoice?: () => void;
  onUploadReceipt?: () => void;
  onExport?: () => void;
  onOpenCommandPalette?: () => void;
  variant?: 'full' | 'compact';
}

export function QuickActions({
  onNewBooking,
  onNewInvoice,
  onUploadReceipt,
  onExport,
  onOpenCommandPalette,
  variant = 'full',
}: QuickActionsProps) {
  const actions = [
    {
      icon: Plus,
      label: 'Buchung',
      shortcut: '⌘N',
      onClick: onNewBooking,
      color: 'hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-600',
    },
    {
      icon: FileText,
      label: 'Rechnung',
      shortcut: '⌘I',
      onClick: onNewInvoice,
      color: 'hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-600',
    },
    {
      icon: Upload,
      label: 'Beleg',
      shortcut: '⌘U',
      onClick: onUploadReceipt,
      color: 'hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-orange-600',
    },
    {
      icon: Receipt,
      label: 'Export',
      onClick: onExport,
      color: 'hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-600',
    },
  ];

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <Tooltip key={action.label}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={action.color}
                  onClick={action.onClick}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {action.label}
                  {action.shortcut && (
                    <span className="ml-2 text-muted-foreground">{action.shortcut}</span>
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenCommandPalette}
              >
                <Command className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Befehlspalette
                <span className="ml-2 text-muted-foreground">⌘K</span>
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Schnellaktionen</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onOpenCommandPalette}
        >
          <Command className="h-4 w-4 mr-1" />
          <span className="text-xs">⌘K</span>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className={`h-auto py-4 flex-col gap-2 transition-colors ${action.color}`}
            onClick={action.onClick}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs">{action.label}</span>
            {action.shortcut && (
              <span className="text-[10px] text-muted-foreground">{action.shortcut}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        Drücke <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd> für alle Befehle
      </p>
    </div>
  );
}
