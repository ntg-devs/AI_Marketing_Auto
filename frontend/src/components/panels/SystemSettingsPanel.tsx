'use client';

import { useState } from 'react';
import {
  Settings,
  Link2,
  Dna,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Plus,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  Zap,
  Shield,
  Globe,
  Ban,
  BrainCircuit,
  CalendarClock,
  BarChart3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

/* ─── Types ────────────────────────────────────────────────────────── */

type ConnectionStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

interface ApiConnection {
  id: string;
  platform: string;
  icon: string;
  status: ConnectionStatus;
  lastSync?: string;
  accountName?: string;
}

interface BannedWord {
  id: string;
  word: string;
}

interface ScheduleRule {
  id: string;
  platform: string;
  days: string[];
  timeSlot: string;
  enabled: boolean;
  scoreAvg: number;
}

/* ─── Mock Data ────────────────────────────────────────────────────── */

const mockConnections: ApiConnection[] = [
  {
    id: '1',
    platform: 'Meta (Facebook & Instagram)',
    icon: '🔵',
    status: 'connected',
    lastSync: '2 min ago',
    accountName: 'AetherFlow Marketing',
  },
  {
    id: '2',
    platform: 'LinkedIn',
    icon: '🔷',
    status: 'connected',
    lastSync: '5 min ago',
    accountName: 'AetherFlow Inc.',
  },
  {
    id: '3',
    platform: 'TikTok Business',
    icon: '⬛',
    status: 'disconnected',
  },
  {
    id: '4',
    platform: 'X (Twitter)',
    icon: '✖️',
    status: 'error',
    lastSync: 'Failed 15 min ago',
    accountName: '@aetherflow_ai',
  },
];

const mockBannedWords: BannedWord[] = [
  { id: '1', word: 'free' },
  { id: '2', word: 'guaranteed' },
  { id: '3', word: 'best ever' },
  { id: '4', word: 'no risk' },
];

const mockScheduleRules: ScheduleRule[] = [
  {
    id: '1',
    platform: 'LinkedIn',
    days: ['Mon', 'Wed', 'Fri'],
    timeSlot: '09:00 – 10:00',
    enabled: true,
    scoreAvg: 92,
  },
  {
    id: '2',
    platform: 'Facebook',
    days: ['Mon', 'Thu'],
    timeSlot: '14:00 – 15:00',
    enabled: true,
    scoreAvg: 85,
  },
  {
    id: '3',
    platform: 'Blog',
    days: ['Tue', 'Fri'],
    timeSlot: '10:00 – 11:00',
    enabled: false,
    scoreAvg: 78,
  },
  {
    id: '4',
    platform: 'TikTok',
    days: ['Sat', 'Sun'],
    timeSlot: '18:00 – 20:00',
    enabled: false,
    scoreAvg: 71,
  },
];

const voiceProfiles = [
  { id: '1', name: 'Default — Neutral Pro', active: true },
  { id: '2', name: 'Thought Leader', active: false },
  { id: '3', name: 'Casual Storyteller', active: false },
];

const personaSegments = [
  { id: '1', label: 'SaaS B2B Decision Maker', count: 1240 },
  { id: '2', label: 'Tech-Savvy Marketer', count: 890 },
  { id: '3', label: 'Startup Founder', count: 456 },
];

/* ─── Status Config ────────────────────────────────────────────────── */

const statusConfig: Record<
  ConnectionStatus,
  { color: string; bgColor: string; label: string; icon: typeof CheckCircle2 }
> = {
  connected: {
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    label: 'Connected',
    icon: CheckCircle2,
  },
  disconnected: {
    color: 'text-gray-400',
    bgColor: 'bg-surface-hover border-default',
    label: 'Disconnected',
    icon: XCircle,
  },
  syncing: {
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    label: 'Syncing',
    icon: Loader2,
  },
  error: {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 border-red-500/20',
    label: 'Error',
    icon: XCircle,
  },
};

/* ─── Component ────────────────────────────────────────────────────── */

export default function SystemSettingsPanel() {
  const [bannedWords, setBannedWords] = useState(mockBannedWords);
  const [newBannedWord, setNewBannedWord] = useState('');
  const [scheduleRules, setScheduleRules] = useState(mockScheduleRules);

  const removeBannedWord = (id: string) => {
    setBannedWords((prev) => prev.filter((w) => w.id !== id));
  };

  const addBannedWord = () => {
    if (!newBannedWord.trim()) return;
    setBannedWords((prev) => [
      ...prev,
      { id: Date.now().toString(), word: newBannedWord.trim() },
    ]);
    setNewBannedWord('');
  };

  const toggleScheduleRule = (id: string) => {
    setScheduleRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-default shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Settings className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-heading tracking-tight">
              System Settings
            </h2>
            <p className="text-[10px] text-dim mt-0.5">
              Core Configuration — AI Brain
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="api" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 shrink-0">
          <TabsList className="w-full bg-surface-hover h-8 rounded-lg p-0.5">
            <TabsTrigger
              value="api"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-transparent text-dim"
            >
              <Link2 className="w-3 h-3 mr-1" />
              API
            </TabsTrigger>
            <TabsTrigger
              value="brand"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-transparent text-dim"
            >
              <Dna className="w-3 h-3 mr-1" />
              Brand DNA
            </TabsTrigger>
            <TabsTrigger
              value="automation"
              className="flex-1 text-[10px] h-full rounded-md data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-transparent text-dim"
            >
              <CalendarClock className="w-3 h-3 mr-1" />
              Automation
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ══════════ Tab 1: API & Integrations ══════════ */}
        <TabsContent value="api" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {mockConnections.map((conn) => {
                const config = statusConfig[conn.status];
                const StatusIcon = config.icon;
                return (
                  <div
                    key={conn.id}
                    className={`rounded-lg border p-3 transition-colors ${config.bgColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base leading-none">
                          {conn.icon}
                        </span>
                        <div>
                          <p className="text-[11px] font-medium text-heading">
                            {conn.platform}
                          </p>
                          {conn.accountName && (
                            <p className="text-[9px] text-dim mt-0.5">
                              {conn.accountName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon
                          className={`w-3 h-3 ${config.color} ${
                            conn.status === 'syncing' ? 'animate-spin' : ''
                          }`}
                        />
                        <Badge
                          variant="outline"
                          className={`text-[8px] px-1.5 py-0 h-4 border-default ${config.color}`}
                        >
                          {config.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-subtle">
                      {conn.lastSync && (
                        <span className="text-[9px] text-faint">
                          Last sync: {conn.lastSync}
                        </span>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        {conn.status === 'connected' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1.5 text-[9px] text-label hover:text-heading hover:bg-surface-hover"
                          >
                            <RefreshCw className="w-2.5 h-2.5 mr-0.5" />
                            Sync
                          </Button>
                        )}
                        {conn.status === 'disconnected' && (
                          <Button
                            size="sm"
                            className="h-5 px-2 text-[9px] bg-primary/15 hover:bg-primary/25 text-primary border border-primary/20"
                          >
                            Connect
                          </Button>
                        )}
                        {conn.status === 'error' && (
                          <Button
                            size="sm"
                            className="h-5 px-2 text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <Button className="w-full h-7 text-[10px] mt-2 bg-surface-hover hover:bg-surface-active text-label border border-default">
                <Plus className="w-3 h-3 mr-1" />
                Add Integration
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ══════════ Tab 2: Brand DNA Profile ══════════ */}
        <TabsContent value="brand" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Brand Voice Profiles */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <BrainCircuit className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium text-label uppercase tracking-wider">
                    Voice Profiles
                  </span>
                </div>
                <div className="space-y-1.5">
                  {voiceProfiles.map((vp) => (
                    <div
                      key={vp.id}
                      className={`flex items-center justify-between rounded-lg border p-2.5 transition-colors ${
                        vp.active
                          ? 'bg-primary/[0.08] border-primary/20'
                          : 'bg-surface-hover border-default hover:bg-surface-active'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            vp.active ? 'bg-primary' : 'bg-gray-400'
                          }`}
                        />
                        <span
                          className={`text-[11px] font-medium ${
                            vp.active ? 'text-primary' : 'text-label'
                          }`}
                        >
                          {vp.name}
                        </span>
                      </div>
                      {vp.active && (
                        <Badge
                          variant="outline"
                          className="text-[8px] px-1.5 py-0 h-3.5 bg-primary/10 border-primary/20 text-primary"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Customer Personas */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Globe className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-medium text-label uppercase tracking-wider">
                    Persona Segments
                  </span>
                </div>
                <div className="space-y-1.5">
                  {personaSegments.map((ps) => (
                    <div
                      key={ps.id}
                      className="flex items-center justify-between rounded-lg border border-default bg-surface-hover p-2.5 hover:bg-surface-active transition-colors"
                    >
                      <span className="text-[11px] text-body">
                        {ps.label}
                      </span>
                      <span className="text-[9px] text-dim tabular-nums">
                        {ps.count.toLocaleString()} records
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Banned Words */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Ban className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] font-medium text-label uppercase tracking-wider">
                    Banned Words
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[8px] px-1 py-0 h-3.5 border-default text-dim ml-auto"
                  >
                    {bannedWords.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {bannedWords.map((bw) => (
                    <Badge
                      key={bw.id}
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 bg-red-500/[0.06] border-red-500/15 text-red-500 cursor-default group"
                    >
                      {bw.word}
                      <button
                        onClick={() => removeBannedWord(bw.id)}
                        className="ml-1 opacity-40 hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newBannedWord}
                    onChange={(e) => setNewBannedWord(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addBannedWord()}
                    placeholder="Add word..."
                    className="flex-1 bg-surface-hover border border-default rounded-md px-2.5 py-1 text-[10px] text-body placeholder:text-faint outline-none focus:border-primary/30"
                  />
                  <Button
                    size="sm"
                    onClick={addBannedWord}
                    className="h-6 px-2 text-[10px] bg-surface-hover hover:bg-surface-active text-label border border-default"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Save to Vector DB */}
              <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium text-primary">
                    Vector DB Status
                  </span>
                </div>
                <p className="text-[9px] text-dim mb-2">
                  Brand DNA synced to vector database. AI will not repeat patterns.
                </p>
                <Button
                  size="sm"
                  className="w-full h-6 text-[10px] bg-primary/15 hover:bg-primary/25 text-primary border border-primary/20"
                >
                  <Save className="w-2.5 h-2.5 mr-1" />
                  Sync to Vector DB
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ══════════ Tab 3: Automation Logic ══════════ */}
        <TabsContent value="automation" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {/* Smart Scheduling Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-medium text-label uppercase tracking-wider">
                    Smart Scheduling Rules
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[8px] px-1.5 py-0 h-3.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                >
                  <BarChart3 className="w-2 h-2 mr-0.5" />
                  Data-driven
                </Badge>
              </div>

              {/* Schedule Rules */}
              <div className="space-y-2">
                {scheduleRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      rule.enabled
                        ? 'bg-surface-hover border-strong'
                        : 'bg-surface-0 border-subtle opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-heading">
                          {rule.platform}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[8px] px-1 py-0 h-3.5 border-default text-dim"
                        >
                          {rule.timeSlot}
                        </Badge>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleScheduleRule(rule.id)}
                        className="scale-75"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {rule.days.map((day) => (
                          <span
                            key={day}
                            className="text-[8px] bg-surface-active rounded px-1.5 py-0.5 text-label"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-dim">
                          Avg score:
                        </span>
                        <span
                          className={`text-[9px] font-medium tabular-nums ${
                            rule.scoreAvg >= 85
                              ? 'text-emerald-500'
                              : rule.scoreAvg >= 75
                              ? 'text-amber-500'
                              : 'text-gray-400'
                          }`}
                        >
                          {rule.scoreAvg}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full h-7 text-[10px] bg-surface-hover hover:bg-surface-active text-label border border-default">
                <Plus className="w-3 h-3 mr-1" />
                Add Schedule Rule
              </Button>

              {/* Historical Insight */}
              <div className="rounded-lg border border-default bg-surface-hover p-3 mt-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium text-body">
                    Historical Insight
                  </span>
                </div>
                <p className="text-[9px] text-dim leading-relaxed">
                  Based on 90 days of engagement data, your best posting window is{' '}
                  <span className="text-primary font-medium">
                    Mon–Wed 09:00–11:00
                  </span>{' '}
                  for LinkedIn and{' '}
                  <span className="text-primary font-medium">
                    Thu 14:00–16:00
                  </span>{' '}
                  for Facebook. Recommend enabling TikTok weekend slots.
                </p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
