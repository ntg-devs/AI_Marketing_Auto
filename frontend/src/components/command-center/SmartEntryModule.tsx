"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  History,
  Link2,
  ListRestart,
  Search,
  Upload,
  X,
  Dna,
  ChevronDown,
  Loader2,
  CircleDot,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { researchApi } from "@/api/research";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/store/useAuthStore";
import { useResearchStore } from "@/store/useResearchStore";
import type {
  CrawlJob,
  CrawlJobDetailResponse,
  StartResearchRequest,
} from "@/types/research";

type InputMode = "link" | "keyword" | "file";

interface ContextTag {
  id: string;
  label: string;
  type: "topic" | "audience" | "tone" | "platform";
}

const voiceProfiles = [
  "Default — Neutral Pro",
  "Thought Leader",
  "Casual Storyteller",
  "Data-Driven Analyst",
];

const DEFAULT_TEAM_ID = "123e4567-e89b-12d3-a456-426614174000";
const TEAM_ID_KEY = "research-team-id";

const tagColors: Record<ContextTag["type"], string> = {
  topic:
    "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/20",
  audience:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
  tone: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/20",
  platform: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/20",
};

export default function SmartEntryModule() {
  const { user } = useAuthStore();
  const recentJobs = useResearchStore((state) => state.recentJobs);
  const activeJobId = useResearchStore((state) => state.activeJobId);
  const activeJob = useResearchStore((state) => state.activeJob);
  const isPolling = useResearchStore((state) => state.isPolling);
  const setActiveJobId = useResearchStore((state) => state.setActiveJobId);
  const setActiveJob = useResearchStore((state) => state.setActiveJob);
  const setPolling = useResearchStore((state) => state.setPolling);

  const [inputMode, setInputMode] = useState<InputMode>("link");
  const [inputValue, setInputValue] = useState("");
  const [brandVoiceOn, setBrandVoiceOn] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contextTags, setContextTags] = useState<ContextTag[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedVoice] = useState(voiceProfiles[0]);
  const [jobPanelOpen, setJobPanelOpen] = useState(false);

  const modes: { key: InputMode; icon: typeof Link2; label: string }[] = [
    { key: "link", icon: Link2, label: "Link" },
    { key: "keyword", icon: Search, label: "Keywords" },
    { key: "file", icon: Upload, label: "File" },
  ];

  const currentJob = activeJob?.job;
  const crawlProgress = useMemo(
    () => getProgressByStatus(currentJob?.status),
    [currentJob?.status],
  );

  const resolveTeamId = useCallback(() => {
    if (user?.team_id?.trim()) {
      return user.team_id.trim();
    }
    if (typeof window !== "undefined") {
      const localTeamId = window.localStorage.getItem(TEAM_ID_KEY)?.trim();
      if (localTeamId) {
        return localTeamId;
      }
    }
    return DEFAULT_TEAM_ID;
  }, [user?.team_id]);

  const loadJobDetail = useCallback(
    async (jobId: string, showErrorToast = false) => {
      try {
        const detail = await researchApi.getResearchJob(jobId);
        setActiveJob(detail);

        const status = detail.job.status.toLowerCase();
        const shouldKeepPolling = status === "pending" || status === "running";
        setPolling(shouldKeepPolling);
      } catch (error: any) {
        setPolling(false);
        if (showErrorToast) {
          gooeyToast.error(error?.message || "Cannot load crawl job");
        }
      }
    },
    [setActiveJob, setPolling],
  );

  useEffect(() => {
    if (!activeJobId) {
      return;
    }

    let isCancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      if (isCancelled) {
        return;
      }
      await loadJobDetail(activeJobId);
      const status = useResearchStore.getState().activeJob?.job.status.toLowerCase();
      if (status !== "pending" && status !== "running" && timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    tick();
    timer = setInterval(tick, 4000);

    return () => {
      isCancelled = true;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [activeJobId, loadJobDetail]);

  useEffect(() => {
    if (activeJob?.job) {
      setContextTags(buildTagsFromJob(activeJob.job, activeJob.pages?.[0]?.title));
    }
  }, [activeJob]);

  const handleAnalyze = useCallback(async () => {
    if (!inputValue.trim()) return;

    if (inputMode !== "link") {
      if (inputMode === "keyword") {
        const keywords = inputValue
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean)
          .slice(0, 4);

        if (keywords.length > 0) {
          setContextTags(
            keywords.map((keyword, index) => ({
              id: `keyword-${index}`,
              label: keyword,
              type: "topic" as const,
            })),
          );
        }
      }
      return;
    }

    setIsAnalyzing(true);
    try {
      const payload: StartResearchRequest = {
        team_id: resolveTeamId(),
        user_id: user?.id,
        url: inputValue.trim(),
        strategy: "auto",
        max_pages: 3,
        use_stealth: false,
      };

      const response = await researchApi.startURLResearch(payload);
      setActiveJobId(response.job_id);
      setPolling(true);
      setJobPanelOpen(true);
      gooeyToast.success("Crawl job created");
    } catch (error: any) {
      gooeyToast.error(error?.message || "Cannot create crawl job");
    } finally {
      setIsAnalyzing(false);
    }
  }, [inputMode, inputValue, resolveTeamId, setActiveJobId, setPolling, user?.id]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setInputMode("file");
    setInputValue("document_uploaded.pdf");
  }, []);

  const removeTag = useCallback((id: string) => {
    setContextTags((current) => current.filter((tag) => tag.id !== id));
  }, []);

  const handleRefreshActiveJob = async () => {
    if (!activeJobId) {
      return;
    }
    await loadJobDetail(activeJobId, true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Module Header */}
      <div className="px-4 py-3 border-b border-default">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold text-heading/80 uppercase tracking-wider">
              Smart Entry
            </h3>
            <p className="text-[10px] text-dim mt-0.5">Input & Context</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[10px] text-label hover:text-body"
            onClick={() => setJobPanelOpen(true)}
          >
            <History className="w-3 h-3 mr-1" />
            Jobs
            {recentJobs.length > 0 && (
              <Badge className="ml-1 h-4 min-w-4 px-1 text-[9px] bg-primary/20 text-primary border-0">
                {recentJobs.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Input Mode Tabs */}
          <div className="flex bg-surface-hover rounded-lg p-0.5">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => setInputMode(m.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                  inputMode === m.key
                    ? "bg-primary/20 text-primary"
                    : "text-dim hover:text-body"
                }`}
              >
                <m.icon className="w-3 h-3" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Smart Input Bar */}
          <div
            className={`relative rounded-lg border transition-all ${
              isDragOver
                ? "border-primary/50 bg-primary/[0.05]"
                : "border-default bg-surface-hover"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            {inputMode === "file" ? (
              <div className="p-4 text-center">
                <Upload className="w-5 h-5 text-dim mx-auto mb-1.5" />
                <p className="text-[10px] text-label">
                  Drop file or click to upload
                </p>
                {inputValue && (
                  <Badge
                    variant="secondary"
                    className="mt-2 text-[10px] bg-surface-active border-default text-body"
                  >
                    {inputValue}
                    <X
                      className="w-2.5 h-2.5 ml-1 cursor-pointer"
                      onClick={() => setInputValue("")}
                    />
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  placeholder={
                    inputMode === "link"
                      ? "Paste URL to crawl..."
                      : "Enter keywords, topics..."
                  }
                  className="flex-1 bg-transparent text-xs text-body placeholder:text-faint px-3 py-2.5 outline-none"
                />
                <Button
                  size="sm"
                  className="h-6 px-2 mr-1.5 text-[10px] bg-primary/20 hover:bg-primary/30 text-primary border-0"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !inputValue.trim()}
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    inputMode === "link" ? "Crawl" : "Analyze"
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Brand Voice DNA Toggle */}
          <div className="rounded-lg border border-default bg-surface-hover p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Dna className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-medium text-body">
                  Brand Voice DNA
                </span>
              </div>
              <Switch
                checked={brandVoiceOn}
                onCheckedChange={setBrandVoiceOn}
                className="scale-75"
              />
            </div>
            {brandVoiceOn && (
              <div className="mt-1">
                <button className="w-full flex items-center justify-between text-[10px] text-label bg-surface-hover rounded-md px-2.5 py-1.5 hover:bg-surface-active transition-colors">
                  <span>{selectedVoice}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </div>
            )}
          </div>

          {/* Context Window Master - Tags */}
          {contextTags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-medium text-dim uppercase tracking-wider">
                Context Window
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {contextTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className={`text-[10px] px-2 py-0.5 cursor-default border ${tagColors[tag.type]}`}
                  >
                    {tag.label}
                    <X
                      className="w-2.5 h-2.5 ml-1 cursor-pointer opacity-60 hover:opacity-100"
                      onClick={() => removeTag(tag.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Analyzing State */}
          {isAnalyzing && (
            <div className="rounded-lg border border-primary/20 bg-primary/[0.05] p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                <span className="text-[11px] text-primary">
                  Creating crawl job...
                </span>
              </div>
              <div className="mt-2 h-1 bg-surface-hover rounded-full overflow-hidden">
                <div className="h-full bg-primary/40 rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          )}

          {/* Active Crawl Status */}
          {currentJob && (
            <div className="rounded-lg border border-default bg-surface-hover p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-wider text-dim">
                  Active Crawl
                </p>
                <StatusBadge status={currentJob.status} />
              </div>
              <p className="text-[11px] text-body line-clamp-2 break-all">
                {currentJob.title || currentJob.source_url}
              </p>
              <Progress value={crawlProgress} className="h-1.5" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-dim">
                  {currentJob.pages_crawled} page(s)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] text-primary hover:text-primary"
                  onClick={() => setJobPanelOpen(true)}
                >
                  Manage
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <Sheet open={jobPanelOpen} onOpenChange={setJobPanelOpen}>
        <SheetContent className="border-default bg-surface-1">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-sm text-heading">Crawl Jobs</SheetTitle>
            <SheetDescription className="text-xs text-dim">
              Theo dõi tiến trình cào dữ liệu và mở nhanh nguồn kết quả.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-4 space-y-3 overflow-y-auto">
            {currentJob ? (
              <div className="rounded-lg border border-default bg-surface-hover p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-dim">
                    Current
                  </span>
                  <StatusBadge status={currentJob.status} compact />
                </div>
                <p className="text-xs text-body break-all">{currentJob.source_url}</p>
                <Progress value={crawlProgress} className="h-1.5" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] border-default bg-transparent"
                    onClick={handleRefreshActiveJob}
                  >
                    <ListRestart className={`w-3 h-3 mr-1 ${isPolling ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  {currentJob.final_url && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] border-default bg-transparent"
                    >
                      <a href={currentJob.final_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Open
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-default bg-surface-hover p-3">
                <p className="text-[11px] text-dim">Chưa có job nào đang hoạt động.</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-dim">Recent</p>
              {recentJobs.length === 0 && (
                <div className="rounded-lg border border-dashed border-default bg-surface-hover p-3">
                  <p className="text-[11px] text-dim">
                    Danh sách job sẽ xuất hiện sau lần crawl đầu tiên.
                  </p>
                </div>
              )}
              {recentJobs.map((job) => (
                <button
                  key={job.jobId}
                  onClick={() => setActiveJobId(job.jobId)}
                  className={`w-full rounded-lg border p-2 text-left transition-colors ${
                    activeJobId === job.jobId
                      ? "border-primary/40 bg-primary/[0.07]"
                      : "border-default bg-surface-hover hover:bg-surface-active"
                  }`}
                >
                  <p className="text-[11px] text-body line-clamp-1 break-all">
                    {job.title || job.url}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <StatusBadge status={job.status} compact />
                    <span className="text-[10px] text-dim">
                      {formatTime(job.createdAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <Button asChild className="w-full h-8 text-[11px]">
              <a href="/research" target="_blank" rel="noreferrer">
                Open full research workspace
              </a>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const normalized = status.toLowerCase();
  const classes =
    normalized === "completed"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
      : normalized === "failed"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : normalized === "running"
      ? "border-primary/30 bg-primary/10 text-primary"
      : normalized === "pending"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-500"
      : "border-default bg-surface-hover text-dim";

  const icon =
    normalized === "completed" ? (
      <CheckCircle2 className="w-3 h-3 mr-1" />
    ) : normalized === "failed" ? (
      <AlertTriangle className="w-3 h-3 mr-1" />
    ) : normalized === "running" ? (
      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
    ) : normalized === "pending" ? (
      <Clock3 className="w-3 h-3 mr-1" />
    ) : (
      <CircleDot className="w-3 h-3 mr-1" />
    );

  return (
    <Badge
      variant="outline"
      className={`border ${classes} ${compact ? "h-5 px-1.5 text-[10px]" : "text-[10px]"}`}
    >
      {icon}
      {capitalize(normalized)}
    </Badge>
  );
}

function buildTagsFromJob(job: CrawlJob, title?: string): ContextTag[] {
  const tags: ContextTag[] = [
    {
      id: "status",
      label: `Status: ${capitalize(job.status)}`,
      type: "platform",
    },
    {
      id: "strategy",
      label: `Strategy: ${job.strategy.toUpperCase()}`,
      type: "topic",
    },
    {
      id: "pages",
      label: `Pages: ${job.pages_crawled}`,
      type: "audience",
    },
  ];

  if (title) {
    tags.unshift({
      id: "title",
      label: `Title: ${title}`,
      type: "tone",
    });
  }

  return tags;
}

function getProgressByStatus(status?: string) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "completed") return 100;
  if (normalized === "failed") return 100;
  if (normalized === "running") return 65;
  if (normalized === "pending") return 20;
  return 0;
}

function capitalize(value: string) {
  if (!value) {
    return "Unknown";
  }
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatTime(raw: string) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return "n/a";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
