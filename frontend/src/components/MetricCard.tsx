'use client';

import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  trend = 'neutral',
}: MetricCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-violet-400" />
        </div>
        {change && (
          <span
            className={`text-sm ${
              trend === 'up'
                ? 'text-emerald-400'
                : trend === 'down'
                ? 'text-red-400'
                : 'text-slate-400'
            }`}
          >
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-slate-400 mb-1">{label}</p>
        <p className="text-2xl text-white">{value}</p>
      </div>
    </div>
  );
}
