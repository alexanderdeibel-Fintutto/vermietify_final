import { useState } from 'react';
import { Plus, X, FileText, Receipt, BookOpen, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onNewBooking?: () => void;
  onNewInvoice?: () => void;
  onUploadReceipt?: () => void;
  onScanReceipt?: () => void;
}

export function FloatingActionButton({
  onNewBooking,
  onNewInvoice,
  onUploadReceipt,
  onScanReceipt,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: BookOpen,
      label: 'Buchung',
      onClick: onNewBooking,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: FileText,
      label: 'Rechnung',
      onClick: onNewInvoice,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: Receipt,
      label: 'Beleg',
      onClick: onUploadReceipt,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      icon: Camera,
      label: 'Scannen',
      onClick: onScanReceipt,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  const handleActionClick = (action: () => void | undefined) => {
    setIsOpen(false);
    action?.();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 lg:hidden">
      {/* Action buttons */}
      <div
        className={cn(
          'absolute bottom-16 right-0 flex flex-col-reverse gap-3 transition-all duration-300',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {actions.map((action, index) => (
          <div
            key={action.label}
            className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="px-2 py-1 text-sm font-medium bg-background border rounded-md shadow-sm whitespace-nowrap">
              {action.label}
            </span>
            <Button
              size="icon"
              className={cn('h-12 w-12 rounded-full shadow-lg', action.color)}
              onClick={() => handleActionClick(action.onClick!)}
            >
              <action.icon className="h-5 w-5 text-white" />
            </Button>
          </div>
        ))}
      </div>

      {/* Main FAB button */}
      <Button
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-all duration-300',
          isOpen
            ? 'bg-muted-foreground hover:bg-muted-foreground/90 rotate-45'
            : 'bg-primary hover:bg-primary/90'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
