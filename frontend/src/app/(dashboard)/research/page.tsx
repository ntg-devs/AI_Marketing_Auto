'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  FileSearch,
  Link as LinkIcon,
  Search,
  Upload,
  Loader2,
  Orbit,
  RefreshCw,
} from 'lucide-react';
import { gooeyToast } from 'goey-toast';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import { researchApi } from '@/api/research';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  CrawlJobDetailResponse,
  CrawlStrategy,
  RecentResearchJob,
  StartResearchRequest,
} from '@/types/research';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const RECENT_JOBS_KEY = 'research-recent-jobs';
const TEAM_ID_KEY = 'research-team-id';
const BRIEF_ID_KEY = 'research-brief-id';

const STRATEGIES: Array<{ value: CrawlStrategy; label: string; hint: string }> = [
  {
    value: 'auto',
    label: 'Auto',
    hint: 'Try HTTP first, fallback to browser for dynamic targets.',
  },
  {
    value: 'http',
    label: 'HTTP Fast',
    hint: 'Best for docs/blog/news pages with static rendering.',
  },
  {
    value: 'browser',
    label: 'Browser',
    hint: 'Use Playwright for JS-heavy pages and interactions.',
  },
  {
    value: 'browserless',
    label: 'Stealth Browser',
    hint: 'For stronger anti-bot targets with external browser infra.',
  },
];

export default function ResearchPage() {
  const { user } = useAuthStore();

  const [teamId, setTeamId] = useState('123e4567-e89b-12d3-a456-426614174000');
  const [briefId, setBriefId] = useState('');
  const [url, setUrl] = useState('');
  const [strategy, setStrategy] = useState<CrawlStrategy>('auto');
  const [maxPages, setMaxPages] = useState('1');
  const [proxyRegion, setProxyRegion] = useState('sg');
  const [useStealth, setUseStealth] = useState(false);

  const [recentJobs, setRecentJobs] = useState<RecentResearchJob[]>([]);
  const [activeJobId, setActiveJobId] = useState('');
  const [jobDetail, setJobDetail] = useState<CrawlJobDetailResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    const storedTeamId = window.localStorage.getItem(TEAM_ID_KEY);
    const storedBriefId = window.localStorage.getItem(BRIEF_ID_KEY);
    const storedJobs = window.localStorage.getItem(RECENT_JOBS_KEY);

    if (storedTeamId) {
      setTeamId(storedTeamId);
    }
    if (storedBriefId) {
      setBriefId(storedBriefId);
    }
    if (storedJobs) {
      try {
        const parsed = JSON.parse(storedJobs) as RecentResearchJob[];
        setRecentJobs(parsed);
        if (parsed.length > 0) {
          setActiveJobId(parsed[0].jobId);
        }
      } catch {
        setRecentJobs([]);
      }
    }
  }, []);

  useEffect(() => {
    if (teamId.trim()) {
      window.localStorage.setItem(TEAM_ID_KEY, teamId.trim());
    }
  }, [teamId]);

  useEffect(() => {
    if (briefId.trim()) {
      window.localStorage.setItem(BRIEF_ID_KEY, briefId.trim());
    }
  }, [briefId]);

  useEffect(() => {
    if (!activeJobId) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const loadJob = async () => {
      if (cancelled) {
        return;
      }

      try {
        const detail = await researchApi.getResearchJob(activeJobId);
        if (cancelled) {
          return;
        }

        setJobDetail(detail);
        updateRecent(detail.job.id, detail.job.source_url, detail.job.team_id, detail.job.status, detail.job.title, detail.job.created_at);

        const currentStatus = detail.job.status.toLowerCase();
        const keepPolling = currentStatus === 'pending' || currentStatus === 'running';
        setIsPolling(keepPolling);

        if (!keepPolling && timer) {
          clearInterval(timer);
          timer = null;
        }
      } catch (error: any) {
        setIsPolling(false);
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        gooeyToast.error(error?.message || 'Cannot load crawl job');
      }
    };

    loadJob();
    timer = setInterval(loadJob, 4000);

    return () => {
      cancelled = true;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [activeJobId]);

  const activeStrategy = useMemo(
    () => STRATEGIES.find((item) => item.value === strategy) || STRATEGIES[0],
    [strategy],
  );

  const job = jobDetail?.job;
  const pages = jobDetail?.pages || [];
  const firstPage = pages[0];
  const extractedText =
    jobDetail?.knowledge_source?.content_text || firstPage?.extracted_text || '';

  const submit = async () => {
    if (!teamId.trim()) {
      gooeyToast.error('Team ID is required');
      return;
    }
    if (!url.trim()) {
      gooeyToast.error('URL is required');
      return;
    }

    const payload: StartResearchRequest = {
      team_id: teamId.trim(),
      brief_id: briefId.trim() || undefined,
      user_id: user?.id,
      url: url.trim(),
      strategy,
      max_pages: clampPages(maxPages),
      use_stealth: useStealth,
      proxy_region: proxyRegion.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      const response = await researchApi.startURLResearch(payload);
      const now = new Date().toISOString();
      updateRecent(response.job_id, payload.url, payload.team_id, response.status, undefined, now);
      setActiveJobId(response.job_id);
      setJobDetail(null);
      setIsPolling(true);
      gooeyToast.success('Crawl job created successfully');
    } catch (error: any) {
      gooeyToast.error(error?.message || 'Failed to create crawl job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshCurrentJob = async () => {
    if (!activeJobId) {
      return;
    }

    try {
      const detail = await researchApi.getResearchJob(activeJobId);
      setJobDetail(detail);
      updateRecent(detail.job.id, detail.job.source_url, detail.job.team_id, detail.job.status, detail.job.title, detail.job.created_at);
      gooeyToast.success('Latest job data loaded');
    } catch (error: any) {
      gooeyToast.error(error?.message || 'Failed to refresh');
    }
  };

  const copyText = async (value: string, label: string) => {
    if (!value?.trim()) {
      gooeyToast.error(`No ${label} to copy`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      gooeyToast.success(`${label} copied`);
    } catch {
      gooeyToast.error(`Cannot copy ${label}`);
    }
  };

  const updateRecent = (
    jobId: string,
    jobUrl: string,
    jobTeamId: string,
    status: string,
    title?: string,
    createdAt?: string,
  ) => {
    setRecentJobs((current) => {
      const next = [
        {
          jobId,
          url: jobUrl,
          teamId: jobTeamId,
          status,
          title,
          createdAt: createdAt || new Date().toISOString(),
        },
        ...current.filter((item) => item.jobId !== jobId),
      ].slice(0, 10);

      window.localStorage.setItem(RECENT_JOBS_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-auto p-6 lg:p-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        
        {/* Minimalist Ingestion UI */}
        <div className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-4">
          <div className="mb-6 text-center">
             <h1 className="text-3xl font-semibold text-heading">Research Assistant</h1>
             <p className="mt-2 text-dim">Feed links, keywords, or documents to train your AI.</p>
          </div>

          <div className="flex gap-2 rounded-2xl border border-default bg-surface-1 p-2">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-medium text-primary">
              <LinkIcon className="h-4 w-4" /> Link
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-dim hover:bg-surface-hover hover:text-body">
              <Search className="h-4 w-4" /> Keywords
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-dim hover:bg-surface-hover hover:text-body">
              <Upload className="h-4 w-4" /> File
            </button>
          </div>

          <div className="flex items-center rounded-2xl border border-default bg-surface-1 p-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste URL to analyze..."
              className="flex-1 bg-transparent px-4 py-2 text-sm text-body outline-none placeholder:text-dim"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
            <Button
              variant="ghost"
              disabled={isSubmitting}
              onClick={submit}
              className="px-6 font-medium text-primary hover:bg-primary/10 hover:text-primary"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze'}
            </Button>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-default bg-surface-1 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Orbit className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-heading">Brand Voice DNA</span>
              </div>
              <Switch checked={useStealth} onCheckedChange={setUseStealth} />
            </div>
            <Select defaultValue="default">
              <SelectTrigger className="border-default bg-surface-2 text-sm text-body">
                <SelectValue placeholder="Default — Neutral Pro" />
              </SelectTrigger>
              <SelectContent className="border-default bg-surface-2">
                <SelectItem value="default">Default — Neutral Pro</SelectItem>
                <SelectItem value="creative">Creative — GenZ Trend</SelectItem>
                <SelectItem value="formal">Formal — Business Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dynamic Results Display */}
        {(job || recentJobs.length > 0) ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-6">
              <Card className="border-default bg-surface-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-heading">Extracted Output</CardTitle>
                      <CardDescription className="text-dim">Normalized text ready for pipeline generation.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={job?.status || 'idle'} />
                      <Button variant="ghost" size="sm" onClick={refreshCurrentJob} disabled={!activeJobId} className="text-dim hover:text-body">
                        <RefreshCw className={`mr-2 h-4 w-4 ${isPolling ? 'animate-spin' : ''}`} /> Update
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="text" className="space-y-4">
                    <TabsList className="border border-default bg-surface-hover">
                      <TabsTrigger value="text">Content Text</TabsTrigger>
                      <TabsTrigger value="source">Source Info</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text" className="space-y-3">
                      {extractedText ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="border-default bg-transparent text-body hover:bg-surface-hover" onClick={() => copyText(extractedText, 'extracted text')}>
                              <Copy className="mr-2 h-4 w-4" /> Copy text
                            </Button>
                            {job?.final_url ? (
                               <Button asChild variant="outline" size="sm" className="border-default bg-transparent text-body hover:bg-surface-hover">
                                 <a href={job.final_url} target="_blank" rel="noreferrer">
                                   <ExternalLink className="mr-2 h-4 w-4" /> Open source
                                 </a>
                               </Button>
                            ) : null}
                          </div>
                          <Textarea readOnly value={extractedText} className="min-h-[400px] border-default bg-surface-2 text-body" />
                        </div>
                      ) : (
                        <EmptyState title="Waiting for data" description="The output text will appear here once the URL is parsed." />
                      )}
                    </TabsContent>
                    
                    <TabsContent value="source">
                       <div className="space-y-4 rounded-xl border border-default bg-surface-2 p-4 text-sm">
                         {job ? (
                           <>
                             <MetaRow label="Job ID" value={job.id} />
                             <MetaRow label="Title" value={job.title || firstPage?.title || 'Resolving...'} />
                             <MetaRow label="Target" value={job.source_url} asLink />
                             <MetaRow label="Strategy" value={job.strategy} />
                             <MetaRow label="Status" value={job.status} />
                           </>
                         ) : (
                           <span className="text-dim">No job info found.</span>
                         )}
                       </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <Card className="h-fit border-default bg-surface-1">
              <CardHeader>
                <CardTitle className="text-heading">Recent Jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentJobs.map((item) => {
                  const selected = item.jobId === activeJobId;
                  return (
                    <button
                      key={item.jobId}
                      onClick={() => {
                        setActiveJobId(item.jobId);
                        setTeamId(item.teamId);
                      }}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        selected ? 'border-primary/40 bg-primary/10' : 'border-default bg-surface-2 hover:bg-surface-hover'
                      }`}
                    >
                      <p className="line-clamp-1 text-sm text-heading">{item.title || item.url}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <StatusBadge status={item.status} compact />
                        <span className="text-[11px] text-dim">{formatTime(item.createdAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-body">{label}</Label>
      {children}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-default bg-surface-2 p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-dim">{label}</p>
      <p className="mt-1 text-sm text-heading">{value}</p>
    </div>
  );
}

function MetaRow({
  label,
  value,
  asLink = false,
}: {
  label: string;
  value: string;
  asLink?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.14em] text-dim">{label}</p>
      {asLink ? (
        <a href={value} target="_blank" rel="noreferrer" className="break-all text-sm text-primary hover:underline">
          {value}
        </a>
      ) : (
        <p className="break-words text-sm text-body">{value}</p>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-default bg-surface-2 p-6 text-center">
      <p className="text-sm text-heading">{title}</p>
      <p className="mt-2 text-xs text-dim">{description}</p>
    </div>
  );
}

function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const normalized = status.toLowerCase();
  const base = compact ? 'px-2 py-0 text-[11px]' : '';
  const classes =
    normalized === 'completed'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
      : normalized === 'failed'
        ? 'border-destructive/30 bg-destructive/10 text-destructive'
        : normalized === 'running'
          ? 'border-primary/30 bg-primary/10 text-primary'
          : normalized === 'idle'
            ? 'border-default bg-surface-hover text-dim'
            : 'border-amber-500/25 bg-amber-500/10 text-amber-300';

  const icon =
    normalized === 'completed' ? (
      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
    ) : normalized === 'failed' ? (
      <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
    ) : normalized === 'running' ? (
      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
    ) : normalized === 'idle' ? (
      <Bot className="mr-1.5 h-3.5 w-3.5" />
    ) : (
      <Clock3 className="mr-1.5 h-3.5 w-3.5" />
    );

  return (
    <Badge className={`${classes} ${base}`}>
      {icon}
      {capitalize(normalized)}
    </Badge>
  );
}

function clampPages(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return 1;
  }
  return Math.max(1, Math.min(parsed, 10));
}

function shorten(value: string) {
  if (!value) {
    return 'n/a';
  }
  if (value.length < 14) {
    return value;
  }
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatTime(raw: string) {
  const date = new Date(raw);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
