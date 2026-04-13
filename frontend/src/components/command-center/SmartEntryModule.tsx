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
  FileText,
  BookOpen,
  Database,
  Trash2,
  Sparkles,
  BrainCircuit,
  Save,
  Clock,
  Bot,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const fetchRecentJobs = useResearchStore((state) => state.fetchRecentJobs);
  const deleteJob = useResearchStore((state) => state.deleteJob);
  const isLoadingJobs = useResearchStore((state) => state.isLoadingJobs);

  const [inputMode, setInputMode] = useState<InputMode>("link");
  const [inputValue, setInputValue] = useState("");
  const [brandVoiceOn, setBrandVoiceOn] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contextTags, setContextTags] = useState<ContextTag[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedVoice] = useState(voiceProfiles[0]);
  const [jobPanelOpen, setJobPanelOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);

  const previewItems = useMemo(() => {
    const items = [];
    if (activeJob?.knowledge_source) {
      items.push({
        id: 'ks',
        title: activeJob.knowledge_source.title || 'Synthesized Knowledge',
        type: 'Knowledge Source',
        content: activeJob.knowledge_source.content_text,
        icon: Database,
        url: activeJob.knowledge_source.url,
      });
    }
    
    if (activeJob?.pages) {
      activeJob.pages.forEach((page, i) => {
        items.push({
          id: page.id || `page-${i}`,
          title: page.title || page.url,
          type: `Page ${page.depth > 0 ? `(Depth ${page.depth})` : '(Entry)'}`,
          content: page.markdown_text || page.extracted_text || 'No content extracted',
          url: page.url,
          icon: page.depth === 0 ? BookOpen : FileText
        });
      });
    }
    
    return items;
  }, [activeJob]);

  useEffect(() => {
    if (previewOpen && previewItems.length > 0) {
      if (!selectedPreviewId || !previewItems.find(i => i.id === selectedPreviewId)) {
        setSelectedPreviewId(previewItems[0].id);
      }
    }
  }, [previewOpen, previewItems, selectedPreviewId]);

  const activePreviewItem = previewItems.find(i => i.id === selectedPreviewId) || previewItems[0];

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
    if (jobPanelOpen) {
      fetchRecentJobs(resolveTeamId());
    }
  }, [jobPanelOpen, fetchRecentJobs, resolveTeamId]);

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
      const status = useResearchStore
        .getState()
        .activeJob?.job.status.toLowerCase();
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
      setContextTags(
        buildTagsFromJob(activeJob.job, activeJob.pages?.[0]?.title),
      );
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
  }, [
    inputMode,
    inputValue,
    resolveTeamId,
    setActiveJobId,
    setPolling,
    user?.id,
  ]);

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

  const handleDeleteJob = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    try {
      await deleteJob(jobId);
      gooeyToast.success("Job deleted successfully");
    } catch (error) {
      gooeyToast.error("Failed to delete job");
    }
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
                  ) : inputMode === "link" ? (
                    "Crawl"
                  ) : (
                    "Analyze"
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
                    className={`text-[10px] px-2 py-0.5 cursor-default border ${tagColors[tag.type]} max-w-full whitespace-normal h-auto text-left`}
                  >
                    <span className="flex-1 min-w-0 break-words">{tag.label}</span>
                    <X
                      className="w-2.5 h-2.5 ml-1 shrink-0 cursor-pointer opacity-60 hover:opacity-100"
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
            <div className="rounded-lg border border-default bg-surface-hover p-3 space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-dim shrink-0">
                  Active Crawl
                </p>
                <div className="min-w-0 shrink">
                  <StatusBadge status={currentJob.status} />
                </div>
              </div>
              <p className="text-[11px] text-body line-clamp-3 break-words">
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
              <div className="rounded-lg border border-default bg-surface-hover p-3 space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-dim shrink-0">
                    Current
                  </span>
                  <div className="min-w-0 shrink">
                    <StatusBadge status={currentJob.status} compact />
                  </div>
                </div>
                <p className="text-xs text-body break-words line-clamp-2">
                  {currentJob.source_url}
                </p>
                <Progress value={crawlProgress} className="h-1.5" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] border-default bg-transparent"
                    onClick={handleRefreshActiveJob}
                  >
                    <ListRestart
                      className={`w-3 h-3 mr-1 ${isPolling ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>

                  {currentJob.status.toLowerCase() === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] border-default bg-transparent text-primary hover:text-primary"
                      onClick={() => setPreviewOpen(true)}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                  )}

                  {currentJob.final_url && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] border-default bg-transparent"
                    >
                      <a
                        href={currentJob.final_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Open
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-default bg-surface-hover p-3">
                <p className="text-[11px] text-dim">
                  Chưa có job nào đang hoạt động.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-dim">
                Recent
              </p>
              {recentJobs.length === 0 && (
                <div className="rounded-lg border border-dashed border-default bg-surface-hover p-3">
                  <p className="text-[11px] text-dim">
                    Danh sách job sẽ xuất hiện sau lần crawl đầu tiên.
                  </p>
                </div>
              )}
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className={`group w-full rounded-lg border p-2 text-left transition-colors relative flex flex-col ${
                    activeJobId === job.id
                      ? "border-primary/40 bg-primary/[0.07]"
                      : "border-default bg-surface-hover hover:bg-surface-active"
                  }`}
                >
                  <button
                    onClick={() => setActiveJobId(job.id)}
                    className="flex-1 text-left"
                  >
                    <p className="text-[11px] text-body line-clamp-1 break-all pr-6">
                      {job.title || job.source_url}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <StatusBadge status={job.status} compact />
                      <span className="text-[10px] text-dim">
                        {formatTime(job.created_at)}
                      </span>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteJob(e, job.id)}
                    className="absolute top-2 right-2 h-5 w-5 p-0 text-dim opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
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

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] h-[85vh] flex flex-col bg-surface-1 border-default p-0 [&>button]:right-5 [&>button]:top-5 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b border-default bg-surface-0 shrink-0">
            <DialogTitle className="text-sm font-medium text-heading">
              Crawled Content Preview
            </DialogTitle>
            {activeJob?.job?.source_url && (
              <p className="text-[11px] text-faint mt-1 truncate max-w-[80%]">
                Source: {activeJob.job.source_url}
              </p>
            )}
          </DialogHeader>
          
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Sidebar */}
            <div className="w-[280px] border-r border-default bg-surface-hover/30 flex flex-col shrink-0 overflow-y-auto p-3 space-y-1">
              {previewItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedPreviewId(item.id)}
                  className={`w-full text-left p-2.5 rounded-lg flex flex-col gap-1 transition-colors ${
                    selectedPreviewId === item.id 
                      ? "bg-surface-active border border-default ring-1 ring-primary/20" 
                      : "hover:bg-surface-hover border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <item.icon className={`w-3.5 h-3.5 shrink-0 ${selectedPreviewId === item.id ? "text-primary" : "text-dim"}`} />
                    <span className={`text-xs font-medium truncate ${selectedPreviewId === item.id ? "text-heading" : "text-body"}`}>
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-faint ml-5">{item.type}</span>
                </button>
              ))}
            </div>

            {/* Main Content Workspace */}
            <div className="flex-1 w-full flex flex-col min-w-0 bg-surface-0 relative">
              {activePreviewItem ? (
                <>
                  {/* Workspace Toolbar */}
                  <div className="shrink-0 border-b border-default bg-surface-1 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <h2 className="text-sm font-semibold text-heading truncate max-w-sm">
                        {activePreviewItem.title}
                      </h2>
                      <Badge variant="secondary" className="text-[10px] bg-surface-active h-5 border-default whitespace-nowrap text-dim">
                        ~{Math.round(activePreviewItem.content.length / 4)} tokens
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0 pl-4">
                       <Button variant="outline" size="sm" className="h-7 text-[11px] bg-surface-0 text-primary border-primary/20 hover:bg-primary/10">
                         <Sparkles className="w-3 h-3 mr-1.5" />
                         AI Summarize
                       </Button>
                       <Button variant="outline" size="sm" className="h-7 text-[11px] bg-surface-0 text-indigo-500 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10">
                         <BrainCircuit className="w-3 h-3 mr-1.5" />
                         Extract Entities
                       </Button>
                       <div className="w-px h-4 bg-default mx-1" />
                       <Button variant="ghost" size="sm" className="h-7 text-[11px] text-dim hover:text-body">
                         <Save className="w-3.5 h-3.5 mr-1" />
                         Save to KB
                       </Button>
                    </div>
                  </div>

                  {/* Content Area */}
                  <ScrollArea className="flex-1 bg-surface-0">
                    <div className="p-6 md:p-8 max-w-4xl mx-auto">
                      <div className="mb-6 pb-6 border-b border-default/50 space-y-3">
                        <h1 className="text-2xl font-bold text-heading leading-tight tracking-tight">
                          {activePreviewItem.title}
                        </h1>
                        {activePreviewItem.url && (
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-[11px] text-dim">
                            <a 
                              href={activePreviewItem.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center text-primary/80 hover:text-primary transition-colors"
                            >
                              <Link2 className="w-3 h-3 mr-1 shrink-0" />
                              <span className="truncate max-w-md">{activePreviewItem.url}</span>
                            </a>
                            <span className="flex items-center">
                              <BookOpen className="w-3 h-3 mr-1 opacity-50 shrink-0" />
                              {activePreviewItem.content.split(/\\s+/).length} words
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1 opacity-50 shrink-0" />
                              {Math.max(1, Math.ceil(activePreviewItem.content.split(/\\s+/).length / 250))} min read
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-surface-1/40 rounded-xl border border-default/40 p-6 shadow-sm">
                        <FormattedText text={activePreviewItem.content} />
                      </div>
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-dim">
                  <Bot className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium">Select a document to preview</p>
                  <p className="text-xs text-faint mt-1">Ready for knowledge extraction and AI processing</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
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
      className={`border ${classes} max-w-full whitespace-normal h-auto text-left ${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[10px]"}`}
    >
      <div className="flex-shrink-0 flex items-center pr-1.5">
        {icon}
      </div>
      <span className="flex-1 min-w-0 break-words">{capitalize(normalized)}</span>
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

function FormattedText({ text }: { text?: string }) {
  if (!text) return <p className="text-dim text-xs italic">No content available.</p>;

  // A very basic markdown tokenizer for professional rendering without heavy dependencies
  return (
    <div className="space-y-4 text-body pb-10">
      {text.split('\n\n').map((block, idx) => {
        const content = block.trim();
        if (!content) return null;
        
        if (content.startsWith('# ')) return <h1 key={idx} className="text-xl font-semibold text-heading tracking-tight mt-6 mb-3">{content.replace(/^#\s+/, '')}</h1>;
        if (content.startsWith('## ')) return <h2 key={idx} className="text-lg font-medium text-heading mt-5 mb-2">{content.replace(/^##\s+/, '')}</h2>;
        if (content.startsWith('### ')) return <h3 key={idx} className="text-base font-medium text-heading mt-4 mb-2">{content.replace(/^###\s+/, '')}</h3>;
        
        if (content.split('\n').every(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5 my-3 text-[13px] leading-relaxed text-dim">
              {content.split('\n').map((line, i) => (
                <li key={i}>{line.trim().replace(/^[-*]\s+/, '')}</li>
              ))}
            </ul>
          );
        }

        const boldRegex = /\*\*(.*?)\*\*/g;
        const formattedParagraph = content.split(boldRegex).map((part, i) => 
          i % 2 === 1 ? <strong key={i} className="font-semibold text-heading">{part}</strong> : part
        );

        return (
          <p key={idx} className="text-[13px] leading-relaxed text-dim">
            {formattedParagraph}
          </p>
        );
      })}
    </div>
  );
}
