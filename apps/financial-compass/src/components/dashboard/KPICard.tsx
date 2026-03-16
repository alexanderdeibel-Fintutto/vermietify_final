import { LucideIcon } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  iconColor?: string;
  sparklineData?: number[];
}

export function KPICard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  sparklineData 
}: KPICardProps) {
  const changeColors = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  const sparklineColor = changeType === 'negative' ? 'hsl(var(--destructive))' : 'hsl(var(--success))';

  const chartData = sparklineData?.map((value, index) => ({ value, index })) || [];

  return (
    <div className="kpi-card-mobile sm:kpi-card group relative overflow-hidden">
      {/* Sparkline in background - hidden on mobile */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="absolute top-2 right-2 w-16 sm:w-20 h-8 sm:h-10 opacity-60 hidden sm:block">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={sparklineColor}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">{title}</p>
        <p className="text-xl sm:text-3xl font-bold tracking-tight mb-1">{value}</p>
        {change && (
          <span className={`inline-block mt-1 text-xs font-semibold px-3 py-1 rounded-full ${
            changeType === 'negative' 
              ? 'bg-destructive text-destructive-foreground' 
              : changeType === 'positive' 
                ? 'bg-success text-success-foreground' 
                : 'bg-muted text-muted-foreground'
          }`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
