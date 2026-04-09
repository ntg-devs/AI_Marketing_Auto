'use client';

import { useState } from 'react';
import {
  TrendingUp,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Flame,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

type FeedTab = 'insights' | 'sources';

interface Insight {
  id: string;
  source: 'reddit' | 'quora' | 'trends';
  title: string;
  snippet: string;
  score: number;
  timestamp: string;
}

interface SourceRef {
  id: string;
  url: string;
  title: string;
  relevance: number;
  verified: boolean;
}

const mockInsights: Insight[] = [
  {
    id: '1',
    source: 'reddit',
    title: 'Users frustrated with onboarding complexity',
    snippet:
      '"We lost 40% of trial users in the first 3 days because the setup was too confusing..."',
    score: 92,
    timestamp: '2m ago',
  },
  {
    id: '2',
    source: 'trends',
    title: '"AI automation" search volume +340%',
    snippet:
      'Google Trends shows massive spike in "AI marketing automation" queries across SEA region.',
    score: 88,
    timestamp: '5m ago',
  },
  {
    id: '3',
    source: 'quora',
    title: 'How to reduce SaaS churn with content?',
    snippet:
      '"Educational content that addresses Day-1 confusion reduces churn by 25%..."',
    score: 76,
    timestamp: '8m ago',
  },
  {
    id: '4',
    source: 'reddit',
    title: 'Pricing page best practices discussion',
    snippet:
      '"Transparent pricing with a comparison table converts 2x better than hidden pricing..."',
    score: 71,
    timestamp: '12m ago',
  },
];

const mockSources: SourceRef[] = [
  {
    id: '1',
    url: 'hubspot.com/blog/marketing-automation',
    title: 'Marketing Automation Guide 2026',
    relevance: 95,
    verified: true,
  },
  {
    id: '2',
    url: 'neil-patel.com/content-strategy',
    title: 'Content Strategy Framework',
    relevance: 88,
    verified: true,
  },
  {
    id: '3',
    url: 'semrush.com/blog/saas-seo',
    title: 'SaaS SEO Playbook',
    relevance: 82,
    verified: true,
  },
  {
    id: '4',
    url: 'reddit.com/r/SaaS/comments/...',
    title: 'Community Discussion: Churn',
    relevance: 74,
    verified: false,
  },
];

const sourceIcons: Record<Insight['source'], typeof TrendingUp> = {
  reddit: MessageCircle,
  quora: MessageCircle,
  trends: TrendingUp,
};

const sourceColors: Record<Insight['source'], string> = {
  reddit: 'text-orange-400',
  quora: 'text-red-400',
  trends: 'text-blue-400',
};

export default function LiveResearchModule() {
  const [activeTab, setActiveTab] = useState<FeedTab>('insights');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Module Header */}
      <div className="px-4 py-3 border-b border-default">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-heading/80 uppercase tracking-wider">
              Live Research
            </h3>
            <p className="text-[10px] text-dim mt-0.5">Real-time Feed</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-dim hover:text-body hover:bg-surface-hover"
            onClick={handleRefresh}
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-default">
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-2 text-[10px] font-medium transition-colors ${
            activeTab === 'insights'
              ? 'text-primary border-b border-primary'
              : 'text-dim hover:text-body'
          }`}
        >
          Insights
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`flex-1 py-2 text-[10px] font-medium transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'sources'
              ? 'text-emerald-500 border-b border-emerald-500'
              : 'text-dim hover:text-body'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          Sources
        </button>
      </div>

      {/* Feed Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {activeTab === 'insights' &&
            mockInsights.map((insight) => {
              const SourceIcon = sourceIcons[insight.source];
              return (
                <div
                  key={insight.id}
                  className="rounded-lg border border-default bg-surface-hover p-2.5 hover:bg-surface-active transition-colors group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <SourceIcon
                        className={`w-3 h-3 ${sourceColors[insight.source]}`}
                      />
                      <span className="text-[10px] text-dim capitalize">
                        {insight.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] text-amber-500 font-medium">
                        {insight.score}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-heading font-medium leading-snug mb-1">
                    {insight.title}
                  </p>
                  <p className="text-[10px] text-dim leading-relaxed line-clamp-2">
                    {insight.snippet}
                  </p>
                  <span className="text-[9px] text-faint mt-1 block">
                    {insight.timestamp}
                  </span>
                </div>
              );
            })}

          {activeTab === 'sources' && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 px-1 mb-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-500 font-medium">
                  Anti-Hallucination Sources
                </span>
              </div>
              {mockSources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-lg border border-default bg-surface-hover p-2.5 hover:bg-surface-active transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-heading font-medium truncate">
                        {source.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <ExternalLink className="w-2.5 h-2.5 text-faint" />
                        <span className="text-[9px] text-dim truncate">
                          {source.url}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      {source.verified && (
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      )}
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 bg-surface-hover border-default text-label"
                      >
                        {source.relevance}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Live Indicator */}
      <div className="px-3 py-2 border-t border-default flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] text-dim">
          Live · Updating every 30s
        </span>
      </div>
    </div>
  );
}
