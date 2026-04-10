'use client';

import { ChevronDown } from 'lucide-react';
import type { CampaignHistoryItem } from '@/types/campaignHistory';
import ChannelIcon from './ChannelIcon';
import StatusBadge from './StatusBadge';
import SparklineChart from './SparklineChart';
import ExpandedDetailPanel from './ExpandedDetailPanel';
import { Badge } from '@/components/ui/badge';

interface CampaignHistoryRowProps {
  item: CampaignHistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function CampaignHistoryRow({
  item,
  isExpanded,
  onToggle,
}: CampaignHistoryRowProps) {
  const formattedDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : item.scheduledAt
      ? new Date(item.scheduledAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  return (
    <div
      className={`border border-transparent rounded-lg transition-all duration-200 ${
        isExpanded
          ? 'bg-surface-hover border-default shadow-sm'
          : 'hover:bg-surface-hover/60'
      }`}
    >
      {/* Main Row */}
      <button
        id={`campaign-row-${item.id}`}
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left group cursor-pointer"
      >
        {/* Channel Icon */}
        <ChannelIcon channel={item.channel} size="md" />

        {/* Title & Campaign Tag */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[12px] font-medium text-heading truncate max-w-[400px]">
              {item.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 h-4 bg-primary/8 border-primary/15 text-primary font-normal"
            >
              {item.campaignName}
            </Badge>
            <span className="text-[10px] text-dim">{formattedDate}</span>
          </div>
        </div>

        {/* Status Badge */}
        <StatusBadge status={item.status} />

        {/* Sparkline */}
        <div className="w-[100px] shrink-0 flex items-center justify-center">
          <SparklineChart
            data={item.sparklineData}
            width={90}
            height={26}
            color={
              item.status === 'failed'
                ? '#ef4444'
                : item.status === 'scheduled'
                  ? '#f59e0b'
                  : 'var(--primary)'
            }
            gradientId={`spark-${item.id}`}
          />
        </div>

        {/* Engagement Rate */}
        <div className="w-[60px] shrink-0 text-right">
          {item.engagementRate > 0 ? (
            <div>
              <div className="text-xs font-semibold text-heading">
                {item.engagementRate}%
              </div>
              <div className="text-[9px] text-dim">Eng. Rate</div>
            </div>
          ) : (
            <div className="text-[10px] text-dim">—</div>
          )}
        </div>

        {/* Expand chevron */}
        <ChevronDown
          className={`w-4 h-4 text-dim transition-transform duration-200 shrink-0 ${
            isExpanded ? 'rotate-180' : ''
          } group-hover:text-label`}
        />
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="border-t border-default">
          <ExpandedDetailPanel item={item} />
        </div>
      )}
    </div>
  );
}
