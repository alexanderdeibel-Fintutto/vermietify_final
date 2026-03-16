import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';

interface BillingToggleProps {
  value: 'monthly' | 'yearly';
  onChange: (value: 'monthly' | 'yearly') => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(val) => val && onChange(val as 'monthly' | 'yearly')}
        className="bg-muted p-1 rounded-lg"
      >
        <ToggleGroupItem
          value="monthly"
          className="px-4 py-2 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md"
        >
          Monatlich
        </ToggleGroupItem>
        <ToggleGroupItem
          value="yearly"
          className="px-4 py-2 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md"
        >
          Jährlich
        </ToggleGroupItem>
      </ToggleGroup>
      {value === 'yearly' && (
        <Badge variant="secondary" className="bg-accent text-accent-foreground">
          20% sparen
        </Badge>
      )}
    </div>
  );
}
