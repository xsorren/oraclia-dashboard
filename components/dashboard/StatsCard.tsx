'use client';

import { cn } from '@/lib/utils/cn';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  isLoading,
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend.value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-400';
    if (trend.value < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 hover:border-purple-500/50 transition-all">
      {/* Background Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-600/10 to-amber-500/10 rounded-full blur-3xl -z-10" />

      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-slate-400 font-medium truncate">{title}</p>
          {isLoading ? (
            <div className="h-7 sm:h-8 w-24 sm:w-32 bg-slate-800 animate-pulse rounded mt-2" />
          ) : (
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2 break-all">{value}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-600/20 to-amber-500/20 rounded-lg border border-purple-500/30 flex-shrink-0 ml-2">
            {icon}
          </div>
        )}
      </div>

      {trend && !isLoading && (
        <div className={cn('flex items-center gap-2 text-sm', getTrendColor())}>
          {getTrendIcon()}
          <span className="font-medium">
            {trend.value > 0 && '+'}
            {trend.value}%
          </span>
          <span className="text-slate-500">{trend.label}</span>
        </div>
      )}

      {subtitle && !isLoading && (
        <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}
