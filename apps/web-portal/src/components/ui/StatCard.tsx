import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'gold' | 'green' | 'red' | 'blue';
}

export function StatCard({ title, value, icon: Icon, trend, color = 'gold' }: StatCardProps) {
  const colorClasses = {
    gold: 'from-stc-gold/20 to-stc-gold/5 text-stc-gold',
    green: 'from-emerald-500/20 to-emerald-500/5 text-emerald-500',
    red: 'from-red-500/20 to-red-500/5 text-red-500',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-500',
  };

  return (
    <div className="stat-card p-4">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
        <p className="text-xs text-white/60">{title}</p>
      </div>
    </div>
  );
}
