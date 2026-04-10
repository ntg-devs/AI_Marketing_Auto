'use client';

import { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  Sparkles,
  ChevronRight,
  FileText,
  Globe,
  Share2,
  Database,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CampaignHistoryItem } from '@/types/campaignHistory';

interface ExpandedDetailPanelProps {
  item: CampaignHistoryItem;
}

const sourceTypeIcons: Record<string, React.ReactNode> = {
  article: <FileText className="w-3 h-3" />,
  report: <BookOpen className="w-3 h-3" />,
  social: <Share2 className="w-3 h-3" />,
  internal: <Database className="w-3 h-3" />,
};

const sentimentConfig = {
  positive: {
    icon: <ThumbsUp className="w-3.5 h-3.5" />,
    label: 'Positive',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  neutral: {
    icon: <Minus className="w-3.5 h-3.5" />,
    label: 'Neutral',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  negative: {
    icon: <ThumbsDown className="w-3.5 h-3.5" />,
    label: 'Negative',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
};

export default function ExpandedDetailPanel({ item }: ExpandedDetailPanelProps) {
  const [showSources, setShowSources] = useState(false);
  const sentiment = sentimentConfig[item.aiAnalysis.sentiment];

  return (
    <div className="grid grid-cols-3 gap-4 px-4 pb-4 pt-1 animate-in fade-in-0 slide-in-from-top-2 duration-300">
      {/* Column 1: Research Knowledge Base */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <h4 className="text-[11px] font-semibold text-heading uppercase tracking-wider">
            Knowledge Base
          </h4>
        </div>
        <div className="space-y-1.5">
          {item.researchKnowledgeBase.map((kb, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-2.5 py-2 rounded-md bg-surface-hover border border-transparent hover:border-default transition-colors"
            >
              <Database className="w-3 h-3 text-dim mt-0.5 shrink-0" />
              <span className="text-[11px] text-body leading-relaxed">{kb}</span>
            </div>
          ))}
        </div>

        {/* Show Sources */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSources(!showSources)}
            className="h-7 px-2.5 text-[11px] text-primary hover:bg-primary/10 hover:text-primary gap-1.5"
          >
            <Globe className="w-3 h-3" />
            {showSources ? 'Hide Sources' : 'Show Sources'}
            <ChevronRight
              className={`w-3 h-3 transition-transform duration-200 ${
                showSources ? 'rotate-90' : ''
              }`}
            />
          </Button>

          {showSources && (
            <div className="mt-2 space-y-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              {item.sources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-surface-hover transition-colors group"
                >
                  <span className="text-dim group-hover:text-primary transition-colors">
                    {sourceTypeIcons[source.type]}
                  </span>
                  <span className="text-[11px] text-body group-hover:text-heading transition-colors truncate flex-1">
                    {source.title}
                  </span>
                  <ExternalLink className="w-3 h-3 text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Column 2: AI Analysis Summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-[11px] font-semibold text-heading uppercase tracking-wider">
              AI Analysis
            </h4>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${sentiment.bg} ${sentiment.border} ${sentiment.color}`}
          >
            {sentiment.icon}
            {sentiment.label}
          </span>
        </div>

        <p className="text-[11px] text-body leading-relaxed">
          {item.aiAnalysis.summary}
        </p>

        <div className="space-y-1">
          {item.aiAnalysis.keyFactors.map((factor, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[11px] text-label"
            >
              <span className="w-1 h-1 rounded-full bg-primary/60 mt-1.5 shrink-0" />
              <span className="leading-relaxed">{factor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Recommendation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <h4 className="text-[11px] font-semibold text-heading uppercase tracking-wider">
            Recommendation
          </h4>
        </div>

        <div className="px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <p className="text-[11px] text-body leading-relaxed">
            {item.aiAnalysis.recommendation}
          </p>
        </div>

        {/* Quick Metrics Summary */}
        {item.status !== 'scheduled' && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="px-2.5 py-2 rounded-md bg-surface-hover text-center">
              <div className="text-[10px] text-dim">Impressions</div>
              <div className="text-xs text-heading font-semibold mt-0.5">
                {item.impressions.toLocaleString()}
              </div>
            </div>
            <div className="px-2.5 py-2 rounded-md bg-surface-hover text-center">
              <div className="text-[10px] text-dim">Clicks</div>
              <div className="text-xs text-heading font-semibold mt-0.5">
                {item.clicks.toLocaleString()}
              </div>
            </div>
            <div className="px-2.5 py-2 rounded-md bg-surface-hover text-center">
              <div className="text-[10px] text-dim">Eng. Rate</div>
              <div className="text-xs text-heading font-semibold mt-0.5">
                {item.engagementRate}%
              </div>
            </div>
          </div>
        )}

        {item.status === 'scheduled' && item.scheduledAt && (
          <div className="px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <div className="text-[10px] text-dim mb-1">Scheduled for</div>
            <div className="text-xs text-heading font-medium">
              {new Date(item.scheduledAt).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
