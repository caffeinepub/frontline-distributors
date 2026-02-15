import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ResponsiveTableCardsProps {
  data: any[];
  renderCard: (item: any, index: number) => ReactNode;
  emptyMessage?: string;
}

export default function ResponsiveTableCards({ data, renderCard, emptyMessage = 'No data available' }: ResponsiveTableCardsProps) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => renderCard(item, index))}
    </div>
  );
}

interface CardRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function CardRow({ label, value, className = '' }: CardRowProps) {
  return (
    <div className={`flex justify-between items-start gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}:</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
