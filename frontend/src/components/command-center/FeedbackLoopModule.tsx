'use client';

import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const TypedResponsiveContainer = ResponsiveContainer as any;
const TypedAreaChart = AreaChart as any;

const performanceData = [
  { name: 'W1', ctr: 2.1, likes: 120, shares: 34, score: 62 },
  { name: 'W2', ctr: 2.4, likes: 145, shares: 42, score: 68 },
  { name: 'W3', ctr: 2.2, likes: 132, shares: 38, score: 65 },
  { name: 'W4', ctr: 3.1, likes: 198, shares: 67, score: 74 },
  { name: 'W5', ctr: 3.5, likes: 234, shares: 89, score: 81 },
  { name: 'W6', ctr: 3.8, likes: 267, shares: 102, score: 85 },
  { name: 'W7', ctr: 4.2, likes: 312, shares: 128, score: 91 },
  { name: 'W8', ctr: 4.5, likes: 345, shares: 145, score: 94 },
];

const metrics = [
  { label: 'Avg CTR', value: '3.5%', change: '+67%', trend: 'up' as const },
  { label: 'Engagement', value: '2.4K', change: '+188%', trend: 'up' as const },
  { label: 'Shares', value: '645', change: '+326%', trend: 'up' as const },
  { label: 'AI Score', value: '94', change: '+52%', trend: 'up' as const },
];

export default function FeedbackLoopModule() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-heading/80 uppercase tracking-wider">
            Feedback Loop
          </h3>
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 border-primary/20 text-primary"
          >
            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
            Self-optimizing
          </Badge>
        </div>

        {/* Inline Metrics */}
        <div className="flex items-center gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <span className="text-[10px] text-dim">{m.label}</span>
              <span className="text-xs text-heading font-semibold">{m.value}</span>
              <span className="text-[10px] text-emerald-500 font-medium">
                {m.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-2 pb-2 min-h-0">
        <TypedResponsiveContainer width="100%" height="100%">
          <TypedAreaChart
            data={performanceData}
            margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCtr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--grid-stroke)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="var(--axis-stroke)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--axis-stroke)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg)',
                border: '1px solid var(--tooltip-border)',
                borderRadius: '8px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}
              labelStyle={{ color: 'var(--text-tertiary)', fontSize: '10px' }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#10b981"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorScore)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="ctr"
              stroke="var(--primary)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCtr)"
              dot={false}
              activeDot={{
                r: 3,
                fill: 'var(--primary)',
                stroke: 'var(--background)',
                strokeWidth: 2,
              }}
            />
          </TypedAreaChart>
        </TypedResponsiveContainer>
      </div>
    </div>
  );
}
