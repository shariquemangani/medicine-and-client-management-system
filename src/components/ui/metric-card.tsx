import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  subtitle?: string
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  subtitle,
  trend 
}: MetricCardProps) {
  return (
    <Card className="border-none shadow-[0_8px_32px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_40px_rgba(15,23,42,0.12)] transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 truncate">{subtitle}</p>
            )}
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-2xl font-bold text-foreground">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend && (
                <span className={`text-xs font-medium ${
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? '+' : '-'}{trend.value}% {trend.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
