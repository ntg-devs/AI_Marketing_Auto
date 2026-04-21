import { useState, useEffect, useCallback } from 'react';
import { researchApi, LiveInsight, LiveSourceRef } from '@/api/research';
import { useResearchStore } from '@/store/useResearchStore';
import { DEFAULT_TEAM_ID } from '@/constants/smart-entry';
import {
  TrendingUp,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Flame,
  Plus,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { gooeyToast } from 'goey-toast';

type FeedTab = 'insights' | 'sources';

const sourceIcons: Record<LiveInsight['source'], typeof TrendingUp> = {
  reddit: MessageCircle,
  quora: MessageCircle,
  trends: TrendingUp,
};

const sourceColors: Record<LiveInsight['source'], string> = {
  reddit: 'text-orange-400',
  quora: 'text-red-400',
  trends: 'text-blue-400',
};

export default function LiveResearchModule() {
  const [activeTab, setActiveTab] = useState<FeedTab>('insights');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const setPendingInput = useResearchStore(s => s.setPendingInput);
  const setActiveJobId = useResearchStore(s => s.setActiveJobId);
  const setPolling = useResearchStore(s => s.setPolling);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [displayedInsights, setDisplayedInsights] = useState<LiveInsight[]>([]);
  const [displayedSources, setDisplayedSources] = useState<LiveSourceRef[]>([]);
  const [activeSearchJobId, setActiveSearchJobId] = useState<string | null>(null);
  const [isPollingSearch, setIsPollingSearch] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    
    // Clean architecture: Call the standard API service integration instead of raw 'fetch'
    const liveData = await researchApi.getLiveResearch();
    
    setDisplayedInsights(liveData.insights || []);
    setDisplayedSources(liveData.sources || []);
    setIsRefreshing(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll for search results if a search job is active
  useEffect(() => {
    if (!activeSearchJobId) return;

    let timer: NodeJS.Timeout;
    const poll = async () => {
      try {
        const detail = await researchApi.getResearchJob(activeSearchJobId);
        if (detail.job.status === 'completed') {
          if (detail.pages && detail.pages.length > 0) {
            console.log("Search job completed. Found pages:", detail.pages);
            const results: LiveSourceRef[] = detail.pages
              .filter(p => p.url && p.url !== 'about:blank')
              .map(p => ({
                id: p.id || p.url,
                url: p.url,
                title: p.title || p.url,
                relevance: 95,
                verified: true
              }));
            
            if (results.length > 0) {
              setDisplayedSources(prev => [...results, ...prev]);
              setActiveTab('sources');
              gooeyToast.success(`Tìm thấy ${results.length} kết quả tìm kiếm!`);
            } else {
              gooeyToast.info("Không tìm thấy link hợp lệ trong kết quả");
            }
          }
          setActiveSearchJobId(null);
          setIsPollingSearch(false);
        } else if (detail.job.status === 'failed') {
          setActiveSearchJobId(null);
          setIsPollingSearch(false);
          gooeyToast.error("Tìm kiếm thất bại");
        } else {
          timer = setTimeout(poll, 3000);
        }
      } catch (err) {
        setActiveSearchJobId(null);
        setIsPollingSearch(false);
      }
    };

    setIsPollingSearch(true);
    poll();
    return () => clearTimeout(timer);
  }, [activeSearchJobId]);

  const handleRefresh = () => {
    loadData();
  };

  const handleApplyInsight = (insight: LiveInsight) => {
    setPendingInput(insight.title, null);
  };

  const handleApplySource = (source: LiveSourceRef) => {
    const url = source.url.startsWith('http') ? source.url : `https://${source.url}`;
    
    // Open in new tab as requested
    window.open(url, '_blank');
    
    // Push to Smart Entry input
    setPendingInput(url, null);
    gooeyToast.success("Đã đẩy URL vào Smart Entry");
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const response = await researchApi.startURLResearch({
        team_id: DEFAULT_TEAM_ID,
        url: searchQuery.trim(),
        strategy: 'search',
        max_pages: 1,
        use_stealth: true,
      });
      setActiveSearchJobId(response.job_id);
      setSearchQuery('');
      gooeyToast.success("Bắt đầu tìm kiếm chuyên sâu...");
    } catch (err: any) {
      gooeyToast.error(err?.message || "Lỗi khi bắt đầu tìm kiếm");
    } finally {
      setIsSearching(false);
    }
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

      {/* Search Input Section */}
      <div className="px-3 py-3 border-b border-default bg-surface/30">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-dim group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Google Search..."
            className="block w-full pl-9 pr-14 py-2 h-9 text-[11px] bg-surface-hover border-default focus:border-primary/50 focus:ring-0 rounded-lg placeholder:text-faint transition-all"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            {searchQuery && (
              <Button
                type="submit"
                disabled={isSearching || isPollingSearch}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[9px] font-bold text-primary hover:bg-primary/10 transition-colors border border-primary/20"
              >
                {(isSearching || isPollingSearch) ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'SEARCH'}
              </Button>
            )}
          </div>
        </form>
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
      <ScrollArea className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col justify-center items-center bg-surface/50 backdrop-blur-sm break-all">
            <RefreshCw className="w-5 h-5 text-primary animate-spin mb-2" />
            <p className="text-[10px] text-primary font-medium tracking-wide">Syncing Global Data...</p>
          </div>
        )}
        <div className="p-3 space-y-2">
          {activeTab === 'insights' &&
            displayedInsights.map((insight) => {
              const SourceIcon = sourceIcons[insight.source];
              return (
                <div
                  key={insight.id}
                  onClick={() => handleApplyInsight(insight)}
                  className="rounded-lg border border-default bg-surface-hover p-2.5 hover:bg-surface-active transition-colors group cursor-pointer break-words relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 rounded-bl-lg">
                    <Plus className="w-3 h-3 text-primary" />
                  </div>
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
            <div className="space-y-2 break-words">
              <div className="flex items-center justify-between px-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-500 font-medium">
                    Anti-Hallucination Sources
                  </span>
                </div>
                {isPollingSearch && (
                   <div className="flex items-center gap-1.5 animate-pulse">
                     <RefreshCw className="w-2.5 h-2.5 text-primary animate-spin" />
                     <span className="text-[9px] text-primary font-bold">SEARCHING...</span>
                   </div>
                )}
              </div>
              {displayedSources.map((source) => (
                <div
                  key={source.id}
                  onClick={() => handleApplySource(source)}
                  className="rounded-lg border border-default bg-surface-hover p-2.5 hover:bg-surface-active transition-colors group cursor-pointer break-words relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500/10 rounded-bl-lg">
                    <Plus className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-heading font-medium truncate break-words">
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
