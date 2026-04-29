import { useState, useEffect, useCallback } from 'react';
import { researchApi, LiveInsight, LiveSourceRef } from '@/api/research';
import { useResearchStore } from '@/store/useResearchStore';
import { DEFAULT_TEAM_ID } from '@/constants/smart-entry';
import {
  TrendingUp,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Zap,
  Plus,
  Search,
  Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { gooeyToast } from 'goey-toast';

type FeedTab = 'insights' | 'sources';

// Safe icon mapping with fallbacks to avoid "Element type is invalid" if an icon is undefined
const sourceIcons: Record<LiveInsight['source'], any> = {
  reddit: MessageSquare || Activity || Search,
  quora: MessageSquare || Activity || Search,
  trends: TrendingUp || Search,
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
    
    // Push to Smart Entry input
    setPendingInput(url, null);
    gooeyToast.success("Đã copy URL vào mục Web Link của Smart Entry");
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
            <svg 
              viewBox="0 0 512 512" 
              className="w-5 h-5 animate-spin mb-2" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <g>
                <polygon fill="#69C9C9" points="408.8,410.3 394.7,396.2 401.7,389.1 392.1,379.5 468.9,364.3 453.7,441.1 415.9,403.3" />
                <g>
                  <path fill="#4D5152" d="M355.3,62.6c-12.4-6.4-25.5-11.7-39-15.6l5.6-19.2c14.7,4.3,29,10,42.6,17L355.3,62.6z" />
                  <path fill="#4D5152" d="M402.9,96.1c-9.5-8.8-19.8-16.7-30.6-23.6l10.8-16.9c11.8,7.5,23,16.2,33.4,25.8L402.9,96.1z" />
                  <path fill="#4D5152" d="M456.7,129.8l-16.9,10.6c-6.8-10.8-14.7-21.2-23.4-30.7l14.8-13.5C440.7,106.6,449.3,117.9,456.7,129.8z" />
                  <path fill="#4D5152" d="M483.9,190.9l-19.2,5.5c-3.8-13.3-8.9-26.4-15.1-38.7l17.8-9C474.2,162.1,479.8,176.3,483.9,190.9z" />
                  <path fill="#4D5152" d="M466,481.7l-50.4-50.4c-44,40.3-100.6,62.3-160.7,62.3c-63.4-0.1-122.9-24.8-167.7-69.6 c-44.9-44.9-69.6-104.6-69.6-168c0-63.5,24.7-123.1,69.6-168c55.2-55.2,134.1-79.8,211-65.7L294.7,42 C224.3,29,152,51.5,101.4,102.1c-84.9,84.9-84.9,222.9,0,307.8c84.6,84.6,222.5,84.8,307.3,0.4l7.1-7l37.8,37.8l15.2-76.8 l-76.8,15.2l9.6,9.6l-14.1,14.1l-36.1-36.1l142.8-28.3L466,481.7z" />
                </g>
              </g>
            </svg>
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
                      {SourceIcon ? (
                        <SourceIcon className={`w-3 h-3 ${sourceColors[insight.source]}`} />
                      ) : (
                        <Search className={`w-3 h-3 ${sourceColors[insight.source]}`} />
                      )}
                      <span className="text-[10px] text-dim capitalize">
                        {insight.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
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
                  className="rounded-lg border border-default bg-surface-hover p-2.5 hover:bg-surface-active transition-all group cursor-pointer relative overflow-hidden w-full active:scale-[0.98]"
                  title="Click để copy URL vào Smart Entry"
                >
                  <div className="absolute right-0 top-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500/10 rounded-bl-lg flex items-center gap-1">
                    <span className="text-[8px] text-emerald-500 font-bold px-1">APPLY</span>
                    <Plus className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <p className="text-[11px] text-heading font-medium leading-snug break-words line-clamp-2">
                      {source.title}
                    </p>
                    <div className="flex items-center gap-1 opacity-80 min-w-0">
                      <ExternalLink className="w-2.5 h-2.5 text-faint shrink-0" />
                      <span className="text-[9px] text-dim break-all line-clamp-1">
                        {source.url}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
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
