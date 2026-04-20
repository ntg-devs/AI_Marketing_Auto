'use client';

import { useEffect, useMemo } from 'react';
import {
  History,
  Search,
  X,
  Filter,
  BarChart3,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCampaignHistoryStore } from '@/store/useCampaignHistoryStore';
// import { campaignHistoryData } from '@/constants/campaignHistoryData';
import CampaignHistoryRow from './CampaignHistoryRow';
import type { CampaignHistoryItem } from '@/types/campaignHistory';

const statusFilterOptions = [
  { value: 'all' as const, label: 'All', icon: <Filter className="w-3 h-3" /> },
  { value: 'success' as const, label: 'Success', icon: <CheckCircle className="w-3 h-3" /> },
  { value: 'scheduled' as const, label: 'Scheduled', icon: <Clock className="w-3 h-3" /> },
  { value: 'failed' as const, label: 'Failed', icon: <XCircle className="w-3 h-3" /> },
];

const channelFilterOptions = [
  { value: 'all' as const, label: 'All Channels' },
  { value: 'facebook' as const, label: 'Facebook' },
  { value: 'linkedin' as const, label: 'LinkedIn' },
  { value: 'blog' as const, label: 'Blog' },
];

export default function CampaignHistoryOverlay() {
  const {
    isOpen,
    closeHistory,
    expandedRowId,
    toggleExpandedRow,
    filterStatus,
    setFilterStatus,
    filterChannel,
    setFilterChannel,
    searchQuery,
    setSearchQuery,
    data,
    isLoading,
    fetchHistory,
  } = useCampaignHistoryStore();

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter((item: CampaignHistoryItem) => {
      const matchesStatus =
        filterStatus === 'all' || item.status === filterStatus;
      const matchesChannel =
        filterChannel === 'all' || item.channel === filterChannel;
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.campaignName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesChannel && matchesSearch;
    });
  }, [filterStatus, filterChannel, searchQuery]);

  // Summary stats
  const stats = useMemo(() => {
    const total = data.length;
    const success = data.filter((i) => i.status === 'success').length;
    const failed = data.filter((i) => i.status === 'failed').length;
    const scheduled = data.filter((i) => i.status === 'scheduled').length;
    const avgEngagement =
      data
        .filter((i) => i.engagementRate > 0)
        .reduce((sum, i) => sum + i.engagementRate, 0) /
        (data.filter((i) => i.engagementRate > 0).length || 1);

    return { total, success, failed, scheduled, avgEngagement };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={closeHistory}
      />

      {/* Dialog */}
      <div className="relative w-[94vw] h-[90vh] max-w-[1400px] bg-surface-1 border border-default rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-[0.97] duration-300">
        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-default bg-surface-1 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <History className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-heading tracking-tight">
                Campaign Memory & History
              </h2>
              <p className="text-[11px] text-dim mt-0.5">
                Track performance, review AI analysis, and verify content sources
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim" />
              <input
                id="campaign-history-search"
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-[220px] pl-8 pr-3 text-[11px] text-body bg-surface-hover border border-default rounded-lg placeholder:text-dim focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={closeHistory}
              className="h-8 w-8 text-dim hover:text-heading hover:bg-surface-hover rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ═══ Stats Bar ═══ */}
        <div className="flex items-center gap-6 px-5 py-2.5 border-b border-subtle bg-surface-0/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-dim" />
              <span className="text-[11px] text-dim">Total:</span>
              <span className="text-[11px] text-heading font-semibold">{stats.total}</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span className="text-[11px] text-dim">Success:</span>
              <span className="text-[11px] text-emerald-400 font-semibold">{stats.success}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3 h-3 text-red-400" />
              <span className="text-[11px] text-dim">Failed:</span>
              <span className="text-[11px] text-red-400 font-semibold">{stats.failed}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="text-[11px] text-dim">Scheduled:</span>
              <span className="text-[11px] text-amber-400 font-semibold">{stats.scheduled}</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-[11px] text-dim">Avg Engagement:</span>
              <span className="text-[11px] text-primary font-semibold">
                {stats.avgEngagement.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* ═══ Filter Bar ═══ */}
        <div className="flex items-center gap-3 px-5 py-2 border-b border-subtle shrink-0">
          {/* Status Filters */}
          <div className="flex items-center gap-1">
            {statusFilterOptions.map((opt) => (
              <button
                key={opt.value}
                id={`filter-status-${opt.value}`}
                onClick={() => setFilterStatus(opt.value)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
                  filterStatus === opt.value
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'text-dim hover:text-label hover:bg-surface-hover border border-transparent'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-border" />

          {/* Channel Filters */}
          <div className="flex items-center gap-1">
            {channelFilterOptions.map((opt) => (
              <button
                key={opt.value}
                id={`filter-channel-${opt.value}`}
                onClick={() => setFilterChannel(opt.value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
                  filterChannel === opt.value
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'text-dim hover:text-label hover:bg-surface-hover border border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Result count */}
          <div className="ml-auto">
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0 h-5 bg-surface-hover border-default text-dim font-normal"
            >
              {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* ═══ List Area ═══ */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 py-3 space-y-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3"></div>
                <p className="text-sm text-label">Loading history...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-dim" />
                </div>
                <p className="text-sm text-label">No campaigns found</p>
                <p className="text-[11px] text-dim mt-1">
                  Try adjusting your filters or search query
                </p>
              </div>
            ) : (
              filteredData.map((item) => (
                <CampaignHistoryRow
                  key={item.id}
                  item={item}
                  isExpanded={expandedRowId === item.id}
                  onToggle={() => toggleExpandedRow(item.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* ═══ Footer ═══ */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-default bg-surface-0/50 shrink-0">
          <span className="text-[10px] text-dim">
            Data synced with Golang Workers pipeline • Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-dim">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live sync active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
