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
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { Notification, HealthStats } from '@/api/notification';
import { useTranslation } from '@/lib/i18n';

/* ─── Types ────────────────────────────────────────────────────────── */

type JobAlertType = 'crawl' | 'llm' | 'image' | 'publish';
type HealthStatus = 'healthy' | 'degraded' | 'down';

interface SystemService {
  id: string;
  name: string;
  status: HealthStatus;
  latency?: string;
  uptime?: string;
  lastCheck: string;
}


/* ─── Mock Data ────────────────────────────────────────────────────── */
const mockServices: SystemService[] = [
  { id: '1', name: 'Redis Cache', status: 'healthy', latency: '0.8ms', uptime: '99.98%', lastCheck: '10s ago' },
  { id: '2', name: 'BullMQ Workers', status: 'healthy', latency: '12ms', uptime: '99.95%', lastCheck: '10s ago' },
  { id: '3', name: 'Meta Graph API', status: 'healthy', latency: '145ms', uptime: '99.90%', lastCheck: '30s ago' },
  { id: '4', name: 'LinkedIn API', status: 'degraded', latency: '890ms', uptime: '98.50%', lastCheck: '30s ago' },
  { id: '5', name: 'OpenAI API', status: 'healthy', latency: '320ms', uptime: '99.70%', lastCheck: '1 min ago' },
  { id: '6', name: 'TikTok API', status: 'down', latency: '—', uptime: '95.20%', lastCheck: '2 min ago' },
];


/* ─── Config Maps ──────────────────────────────────────────────────── */

const jobTypeConfig: Record<JobAlertType, { icon: typeof FileText; color: string }> = {
  crawl: { icon: Database, color: 'text-cyan-500' },
  llm: { icon: Sparkles, color: 'text-primary' },
  image: { icon: Image, color: 'text-amber-500' },
  publish: { icon: TrendingUp, color: 'text-emerald-500' },
};

const jobStatusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  unread: { color: 'text-amber-500', bgColor: 'bg-amber-500/10 border-amber-500/15', label: 'New' },
  read: { color: 'text-dim', bgColor: 'bg-surface-hover/30 border-default', label: 'Read' },
};

const healthConfig: Record<HealthStatus, { color: string; dotColor: string; label: string }> = {
  healthy: { color: 'text-emerald-500', dotColor: 'bg-emerald-400', label: 'Healthy' },
  degraded: { color: 'text-amber-500', dotColor: 'bg-amber-400', label: 'Degraded' },
  down: { color: 'text-red-500', dotColor: 'bg-red-400', label: 'Down' },
};


/* ─── Component ────────────────────────────────────────────────────── */

export default function NotificationCenterPanel() {
  const { notifications, isLoading, healthStats, fetchNotifications, fetchHealthStats, markRead, markAllRead } = useNotificationStore();
  const user = useAuthStore((s) => s.user);
  const { t, language } = useTranslation();

  useEffect(() => {
    if (user?.team_id) {
      fetchNotifications(user.team_id);
      fetchHealthStats();
    }
  }, [user?.team_id, fetchNotifications, fetchHealthStats]);

  const unreadCount = notifications.filter((a: any) => a.status === 'unread').length;

  const handleClearAll = () => {
    if (user?.team_id) {
      markAllRead(user.team_id);
    }
  };

  const services = healthStats?.services || [];
  const usage = healthStats?.usage || { total_tokens: 0, cost: 0 };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-default shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[7px] text-white font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-heading tracking-tight">
              {t('notifications.title')}
            </h2>
            <p className="text-[10px] text-dim mt-0.5">
              {t('notifications.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="jobs" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 shrink-0">
          <TabsList className="w-full bg-surface-hover h-8 rounded-lg p-0.5">
            <TabsTrigger
              value="jobs"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-300 data-[state=active]:border-transparent text-dim"
            >
              <Activity className="w-3 h-3 mr-1" />
              {t('notifications.tabs.jobs')}
            </TabsTrigger>
            <TabsTrigger
              value="health"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-300 data-[state=active]:border-transparent text-dim"
            >
              <Server className="w-3 h-3 mr-1" />
              {t('notifications.tabs.health')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ══════════ Tab 1: Notification Alerts ══════════ */}
        <TabsContent value="jobs" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-dim">
                  {notifications.length} {t('notifications.count')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-5 px-1.5 text-[9px] text-dim hover:text-body hover:bg-surface-hover"
                >
                  {t('notifications.mark_all')}
                </Button>
              </div>

              {notifications.map((notif: Notification) => {
                const typeConfig = jobTypeConfig[notif.type as JobAlertType] || jobTypeConfig.crawl;
                const stConfig = jobStatusConfig[notif.status];
                const TypeIcon = typeConfig.icon;
                
                return (
                  <div
                    key={notif.id}
                    onClick={() => user?.team_id && markRead(notif.id, user.team_id)}
                    className={`rounded-lg border p-3 transition-colors cursor-pointer ${stConfig.bgColor}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        <TypeIcon
                          className={`w-3.5 h-3.5 ${typeConfig.color}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-[11px] font-medium truncate ${notif.status === 'unread' ? 'text-heading' : 'text-dim'}`}>
                            {notif.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[7px] px-1 py-0 h-3.5 border-default ${stConfig.color} shrink-0 ml-2`}
                          >
                            {stConfig.label}
                          </Badge>
                        </div>
                        <p className="text-[9px] text-dim mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>

                        <span className="text-[8px] text-faint block mt-1.5">
                          {formatDistanceToNow(new Date(notif.created_at), { 
                            addSuffix: true, 
                            locale: language === 'vi' ? vi : enUS 
                          })}
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
              <div className="rounded-lg border border-default bg-surface-hover p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-medium text-body">{t('notifications.health.usage_title')}</span>
                  </div>
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-3.5 bg-primary/10 border-primary/20 text-primary">
                    <TrendingUp className="w-2 h-2 mr-0.5" />
                    Real-time
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center py-1.5 rounded-md bg-surface-hover border border-default">
                    <span className="text-sm font-semibold tabular-nums text-heading">
                      {(usage.total_tokens / 1000).toFixed(1)}k
                    </span>
                    <p className="text-[8px] text-dim mt-0.5">{t('notifications.health.tokens')}</p>
                  </div>
                  <div className="text-center py-1.5 rounded-md bg-surface-hover border border-default">
                    <span className="text-sm font-semibold tabular-nums text-emerald-500">
                      ${usage.cost.toFixed(4)}
                    </span>
                    <p className="text-[8px] text-dim mt-0.5">{t('notifications.health.cost')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[9px] font-medium text-dim uppercase tracking-wider px-1">{t('notifications.health.service_status')}</h4>
                {services.map((service: HealthStats['services'][0]) => {
                  const cfg = healthConfig[service.status as HealthStatus];
                  return (
                    <div key={service.id} className="rounded-lg border border-default bg-surface-hover p-2.5 hover:bg-surface-active transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} ${service.status === 'degraded' ? 'animate-pulse' : ''}`} />
                          <span className="text-[11px] font-medium text-heading truncate max-w-[140px] inline-block">{service.name}</span>
                        </div>
                        <Badge variant="outline" className={`text-[7px] px-1 py-0 h-3 border-default ${cfg.color}`}>{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-faint">
                        <span>{t('notifications.health.latency')}: <span className={service.latency === '—' || service.latency === 'N/A' ? 'text-dim' : 'text-label'}>{service.latency}</span></span>
                        <span>•</span>
                        <span>{t('notifications.health.uptime')}: <span className="text-label">{service.uptime}</span></span>
                        <span className="ml-auto">{service.lastCheck}</span>
                      </div>
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
