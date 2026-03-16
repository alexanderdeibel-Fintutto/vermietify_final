import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

// Responsive table wrapper for horizontal scrolling on mobile
export function ResponsiveTable({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0',
        'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
        className
      )}
      {...props}
    >
      <div className="min-w-[640px] sm:min-w-0">
        {children}
      </div>
    </div>
  );
}

// Mobile card view for table data
interface MobileCardListProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export function MobileCardList<T>({
  data,
  renderCard,
  className,
  emptyMessage = 'Keine Daten vorhanden',
}: MobileCardListProps<T>) {
  if (data.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="p-8 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {data.map((item, index) => renderCard(item, index))}
    </div>
  );
}

// Adaptive container that shows table on desktop, cards on mobile
interface AdaptiveDataViewProps<T> {
  data: T[];
  tableContent: React.ReactNode;
  renderMobileCard: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
}

export function AdaptiveDataView<T>({
  data,
  tableContent,
  renderMobileCard,
  emptyMessage,
}: AdaptiveDataViewProps<T>) {
  return (
    <>
      {/* Desktop table view */}
      <div className="hidden md:block">
        <ResponsiveTable>
          {tableContent}
        </ResponsiveTable>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden">
        <MobileCardList
          data={data}
          renderCard={renderMobileCard}
          emptyMessage={emptyMessage}
        />
      </div>
    </>
  );
}

// Common table components re-exported for convenience
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
