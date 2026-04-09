'use client';

import { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertTriangle,
  Activity,
  Server,
  Cpu,
  Database,
  Wifi,
  WifiOff,
  Sparkles,
  TrendingUp,
  Image,
  FileText,
  Bug,
  RefreshCw,
  Trash2,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

/* ─── Types ────────────────────────────────────────────────────────── */

type JobAlertType = 'crawl' | 'llm' | 'image' | 'publish';
type JobAlertStatus = 'completed' | 'processing' | 'failed' | 'queued';
type HealthStatus = 'healthy' | 'degraded' | 'down';

interface JobAlert {
  id: string;
  type: JobAlertType;
  title: string;
  description: string;
  status: JobAlertStatus;
  timestamp: string;
  progress?: number;
}

interface SystemService {
  id: string;
  name: string;
  status: HealthStatus;
  latency?: string;
  uptime?: string;
  lastCheck: string;
}

interface FeedbackTrigger {
  id: string;
  title: string;
  description: string;
  triggerDate: string;
  daysRange: string;
  status: 'ready' | 'pending' | 'completed';
  improvement?: string;
}

/* ─── Mock Data ────────────────────────────────────────────────────── */

const mockJobAlerts: JobAlert[] = [
  {
    id: '1',
    type: 'crawl',
    title: 'Web Crawl Complete',
    description: 'Scraped 24 competitor articles from 6 domains',
    status: 'completed',
    timestamp: '2 min ago',
  },
  {
    id: '2',
    type: 'llm',
    title: 'LLM Content Generation',
    description: 'Generating LinkedIn post variant B — GPT-4o',
    status: 'processing',
    timestamp: '1 min ago',
    progress: 72,
  },
  {
    id: '3',
    type: 'image',
    title: 'Image Processing',
    description: 'Resizing & optimizing 3 visuals for multi-platform',
    status: 'processing',
    timestamp: '30s ago',
    progress: 45,
  },
  {
    id: '4',
    type: 'publish',
    title: 'LinkedIn Publish Failed',
    description: 'Rate limit exceeded — retry scheduled at 10:30 AM',
    status: 'failed',
    timestamp: '15 min ago',
  },
  {
    id: '5',
    type: 'crawl',
    title: 'Keyword Research',
    description: 'Queued: Analyze trending keywords for Q2 campaign',
    status: 'queued',
    timestamp: '20 min ago',
  },
];

const mockServices: SystemService[] = [
  {
    id: '1',
    name: 'Redis Cache',
    status: 'healthy',
    latency: '0.8ms',
    uptime: '99.98%',
    lastCheck: '10s ago',
  },
  {
    id: '2',
    name: 'BullMQ Workers',
    status: 'healthy',
    latency: '12ms',
    uptime: '99.95%',
    lastCheck: '10s ago',
  },
  {
    id: '3',
    name: 'Meta Graph API',
    status: 'healthy',
    latency: '145ms',
    uptime: '99.90%',
    lastCheck: '30s ago',
  },
  {
    id: '4',
    name: 'LinkedIn API',
    status: 'degraded',
    latency: '890ms',
    uptime: '98.50%',
    lastCheck: '30s ago',
  },
  {
    id: '5',
    name: 'OpenAI API',
    status: 'healthy',
    latency: '320ms',
    uptime: '99.70%',
    lastCheck: '1 min ago',
  },
  {
    id: '6',
    name: 'TikTok API',
    status: 'down',
    latency: '—',
    uptime: '95.20%',
    lastCheck: '2 min ago',
  },
];

const mockFeedbackTriggers: FeedbackTrigger[] = [
  {
    id: '1',
    title: 'Weekly Performance Report',
    description: 'AI Agent analyzed 7-day engagement across LinkedIn & Facebook',
    triggerDate: 'Apr 08, 2026',
    daysRange: '7 days',
    status: 'completed',
    improvement: '+12% CTR vs previous cycle',
  },
  {
    id: '2',
    title: 'Bi-weekly Optimization',
    description: 'Full content strategy recalibration based on 14-day data',
    triggerDate: 'Apr 15, 2026',
    daysRange: '14 days',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Content A/B Test Results',
    description: 'Variant analysis for LinkedIn post formats — carousel vs article',
    triggerDate: 'Apr 10, 2026',
    daysRange: '7 days',
    status: 'ready',
    improvement: 'Carousel +34% engagement',
  },
];

/* ─── Config Maps ──────────────────────────────────────────────────── */

const jobTypeConfig: Record<
  JobAlertType,
  { icon: typeof FileText; color: string }
> = {
  crawl: { icon: Database, color: 'text-cyan-400' },
  llm: { icon: Sparkles, color: 'text-indigo-400' },
  image: { icon: Image, color: 'text-amber-400' },
  publish: { icon: TrendingUp, color: 'text-emerald-400' },
};

const jobStatusConfig: Record<
  JobAlertStatus,
  { color: string; bgColor: string; label: string }
> = {
  completed: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/15',
    label: 'Done',
  },
  processing: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/15',
    label: 'Running',
  },
  failed: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/15',
    label: 'Failed',
  },
  queued: {
    color: 'text-slate-400',
    bgColor: 'bg-white/[0.03] border-white/[0.06]',
    label: 'Queued',
  },
};

const healthConfig: Record<
  HealthStatus,
  { color: string; dotColor: string; label: string }
> = {
  healthy: {
    color: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    label: 'Healthy',
  },
  degraded: {
    color: 'text-amber-400',
    dotColor: 'bg-amber-400',
    label: 'Degraded',
  },
  down: {
    color: 'text-red-400',
    dotColor: 'bg-red-400',
    label: 'Down',
  },
};

const feedbackStatusConfig: Record<
  FeedbackTrigger['status'],
  { color: string; bgColor: string; label: string }
> = {
  completed: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/15',
    label: 'Completed',
  },
  pending: {
    color: 'text-slate-400',
    bgColor: 'bg-white/[0.03] border-white/[0.06]',
    label: 'Scheduled',
  },
  ready: {
    color: 'text-indigo-300',
    bgColor: 'bg-indigo-500/10 border-indigo-500/15',
    label: 'Ready',
  },
};

/* ─── Component ────────────────────────────────────────────────────── */

export default function NotificationCenterPanel() {
  const [alerts, setAlerts] = useState(mockJobAlerts);

  const unreadCount = alerts.filter(
    (a) => a.status === 'processing' || a.status === 'failed'
  ).length;

  const clearCompleted = () => {
    setAlerts((prev) => prev.filter((a) => a.status !== 'completed'));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[7px] text-white font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white/90 tracking-tight">
              Notification Center
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Real-time Operations Status
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="jobs" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 shrink-0">
          <TabsList className="w-full bg-white/[0.03] h-8 rounded-lg p-0.5">
            <TabsTrigger
              value="jobs"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-300 data-[state=active]:border-transparent text-slate-500"
            >
              <Activity className="w-3 h-3 mr-1" />
              Jobs
            </TabsTrigger>
            <TabsTrigger
              value="health"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-300 data-[state=active]:border-transparent text-slate-500"
            >
              <Server className="w-3 h-3 mr-1" />
              Health
            </TabsTrigger>
            <TabsTrigger
              value="feedback"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-300 data-[state=active]:border-transparent text-slate-500"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Feedback
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ══════════ Tab 1: Job Status Alerts ══════════ */}
        <TabsContent value="jobs" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {/* Controls */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-slate-500">
                  {alerts.length} background jobs
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                  className="h-5 px-1.5 text-[9px] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
                >
                  Clear done
                </Button>
              </div>

              {/* Job Alerts */}
              {alerts.map((alert) => {
                const typeConfig = jobTypeConfig[alert.type];
                const stConfig = jobStatusConfig[alert.status];
                const TypeIcon = typeConfig.icon;
                return (
                  <div
                    key={alert.id}
                    className={`rounded-lg border p-3 transition-colors ${stConfig.bgColor}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        <TypeIcon
                          className={`w-3.5 h-3.5 ${typeConfig.color} ${
                            alert.status === 'processing' ? 'animate-pulse' : ''
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-medium text-slate-200 truncate">
                            {alert.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[7px] px-1 py-0 h-3.5 border-white/[0.08] ${stConfig.color} shrink-0 ml-2`}
                          >
                            {stConfig.label}
                          </Badge>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">
                          {alert.description}
                        </p>

                        {/* Progress bar for processing jobs */}
                        {alert.status === 'processing' && alert.progress && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[8px] text-slate-600">
                                Progress
                              </span>
                              <span className="text-[8px] text-amber-400 tabular-nums font-medium">
                                {alert.progress}%
                              </span>
                            </div>
                            <div className="h-0.5 bg-white/[0.04] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400/60 rounded-full transition-all duration-700"
                                style={{ width: `${alert.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Retry button for failed jobs */}
                        {alert.status === 'failed' && (
                          <Button
                            size="sm"
                            className="h-5 px-2 mt-2 text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                          >
                            <RefreshCw className="w-2.5 h-2.5 mr-0.5" />
                            Retry
                          </Button>
                        )}

                        <span className="text-[8px] text-slate-600 block mt-1.5">
                          {alert.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ══════════ Tab 2: System Health ══════════ */}
        <TabsContent value="health" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {/* Overall Status */}
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-medium text-slate-300">
                      System Overview
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[8px] px-1.5 py-0 h-3.5 bg-amber-500/10 border-amber-500/20 text-amber-300"
                  >
                    <AlertTriangle className="w-2 h-2 mr-0.5" />
                    1 Issue
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['healthy', 'degraded', 'down'] as const).map((status) => {
                    const count = mockServices.filter(
                      (s) => s.status === status
                    ).length;
                    const cfg = healthConfig[status];
                    return (
                      <div
                        key={status}
                        className="text-center py-1.5 rounded-md bg-white/[0.03]"
                      >
                        <span
                          className={`text-sm font-semibold tabular-nums ${cfg.color}`}
                        >
                          {count}
                        </span>
                        <p className="text-[8px] text-slate-500 mt-0.5">
                          {cfg.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Services List */}
              <div className="space-y-1.5">
                {mockServices.map((service) => {
                  const cfg = healthConfig[service.status];
                  return (
                    <div
                      key={service.id}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} ${
                              service.status === 'degraded'
                                ? 'animate-pulse'
                                : ''
                            }`}
                          />
                          <span className="text-[11px] font-medium text-slate-200">
                            {service.name}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[7px] px-1 py-0 h-3 border-white/[0.08] ${cfg.color}`}
                        >
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-600">
                        <span>
                          Latency:{' '}
                          <span
                            className={
                              service.latency === '—'
                                ? 'text-red-400'
                                : 'text-slate-400'
                            }
                          >
                            {service.latency}
                          </span>
                        </span>
                        <span>•</span>
                        <span>
                          Uptime:{' '}
                          <span className="text-slate-400">
                            {service.uptime}
                          </span>
                        </span>
                        <span className="ml-auto">{service.lastCheck}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ══════════ Tab 3: Feedback Loop Triggers ══════════ */}
        <TabsContent value="feedback" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {/* Info Banner */}
              <div className="rounded-lg border border-indigo-500/15 bg-indigo-500/[0.04] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] font-medium text-indigo-300">
                    AI Optimization Loop
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 leading-relaxed">
                  AI Agent automatically generates optimization reports every{' '}
                  <span className="text-indigo-300 font-medium">7–14 days</span>,
                  analyzing content performance and recommending strategy adjustments.
                </p>
              </div>

              {/* Triggers */}
              <div className="space-y-2">
                {mockFeedbackTriggers.map((trigger) => {
                  const stConfig = feedbackStatusConfig[trigger.status];
                  return (
                    <div
                      key={trigger.id}
                      className={`rounded-lg border p-3 transition-colors ${stConfig.bgColor}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-medium text-slate-200">
                          {trigger.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[7px] px-1 py-0 h-3.5 border-white/[0.08] ${stConfig.color}`}
                        >
                          {stConfig.label}
                        </Badge>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-relaxed">
                        {trigger.description}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
                        <div className="flex items-center gap-2 text-[9px] text-slate-600">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{trigger.triggerDate}</span>
                          <span>•</span>
                          <span>{trigger.daysRange} cycle</span>
                        </div>
                        {trigger.status === 'ready' && (
                          <Button
                            size="sm"
                            className="h-5 px-2 text-[9px] bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/20"
                          >
                            View Report
                          </Button>
                        )}
                      </div>
                      {trigger.improvement && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-[9px] text-emerald-400 font-medium">
                            {trigger.improvement}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
