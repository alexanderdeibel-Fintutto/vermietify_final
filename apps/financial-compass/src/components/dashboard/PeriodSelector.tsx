import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type PeriodKey = 'month' | 'quarter' | 'year' | 'last_month' | 'last_quarter' | 'last_year' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

interface PeriodSelectorProps {
  selectedPeriod: PeriodKey;
  onPeriodChange: (period: PeriodKey, range: DateRange) => void;
}

const periodLabels: Record<PeriodKey, string> = {
  month: 'Dieser Monat',
  quarter: 'Dieses Quartal',
  year: 'Dieses Jahr',
  last_month: 'Letzter Monat',
  last_quarter: 'Letztes Quartal',
  last_year: 'Letztes Jahr',
  custom: 'Benutzerdefiniert',
};

export function getDateRange(period: PeriodKey, customFrom?: Date, customTo?: Date): DateRange {
  const now = new Date();
  switch (period) {
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      return { from: new Date(now.getFullYear(), q * 3, 1), to: now };
    }
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    case 'last_month':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    case 'last_quarter': {
      const q = Math.floor(now.getMonth() / 3) - 1;
      const year = q < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjQ = q < 0 ? 3 : q;
      return {
        from: new Date(year, adjQ * 3, 1),
        to: new Date(year, adjQ * 3 + 3, 0),
      };
    }
    case 'last_year':
      return {
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear() - 1, 11, 31),
      };
    case 'custom':
      return { from: customFrom || now, to: customTo || now };
    default:
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
}

export function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [showCustom, setShowCustom] = useState(false);

  const presets: PeriodKey[] = ['month', 'last_month', 'quarter', 'last_quarter', 'year', 'last_year'];

  const handlePreset = (period: PeriodKey) => {
    setShowCustom(false);
    onPeriodChange(period, getDateRange(period));
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onPeriodChange('custom', { from: customFrom, to: customTo });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <Button
          key={p}
          variant={selectedPeriod === p ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'text-xs h-8',
            selectedPeriod === p
              ? ''
              : 'bg-white/5 border-white/15 hover:bg-white/10'
          )}
          onClick={() => handlePreset(p)}
        >
          {periodLabels[p]}
        </Button>
      ))}

      <Popover open={showCustom} onOpenChange={setShowCustom}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'text-xs h-8 gap-1.5',
              selectedPeriod === 'custom'
                ? ''
                : 'bg-white/5 border-white/15 hover:bg-white/10'
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {selectedPeriod === 'custom' && customFrom && customTo
              ? `${format(customFrom, 'dd.MM.yy')} – ${format(customTo, 'dd.MM.yy')}`
              : periodLabels.custom}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="space-y-3">
            <p className="text-sm font-medium">Zeitraum wählen</p>
            <div className="flex gap-4">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Von</p>
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  locale={de}
                  className="p-2 pointer-events-auto"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Bis</p>
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  locale={de}
                  disabled={(date) => customFrom ? date < customFrom : false}
                  className="p-2 pointer-events-auto"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="w-full"
              disabled={!customFrom || !customTo}
              onClick={handleCustomApply}
            >
              Anwenden
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
