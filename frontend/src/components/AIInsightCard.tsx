'use client';

import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from './ui/badge';

interface AIInsightCardProps {
  title: string;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  value?: string;
  impact?: 'high' | 'medium' | 'low';
}

export function AIInsightCard({
  title,
  description,
  trend = 'neutral',
  value,
  impact = 'medium',
}: AIInsightCardProps) {
  const impactColors = {
    high: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 hover:border-violet-500/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <Badge className={impactColors[impact]}>{impact} impact</Badge>
        </div>
        {value && (
          <div className="flex items-center gap-1">
            <TrendIcon
              className={`w-4 h-4 ${
                trend === 'up'
                  ? 'text-emerald-400'
                  : trend === 'down'
                  ? 'text-red-400'
                  : 'text-slate-400'
              }`}
            />
            <span
              className={`text-sm ${
                trend === 'up'
                  ? 'text-emerald-400'
                  : trend === 'down'
                  ? 'text-red-400'
                  : 'text-slate-400'
              }`}
            >
              {value}
            </span>
          </div>
        )}
      </div>
      <h4 className="text-white mb-2">{title}</h4>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}
