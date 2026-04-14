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
  Send,
  PenLine,
  Wand2,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { researchApi, type GenerateContentRequest, type GenerateOutlineRequest } from "@/api/research";
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
import { AIProviderSettings } from "./AIProviderSettings";

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
  const setGeneratedContent = useResearchStore((state) => state.setGeneratedContent);

  const [inputMode, setInputMode] = useState<InputMode>("link");
  const [inputValue, setInputValue] = useState("");
  const [brandVoiceOn, setBrandVoiceOn] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contextTags, setContextTags] = useState<ContextTag[]>([]);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedVoice] = useState(voiceProfiles[0]);
  const [jobPanelOpen, setJobPanelOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Content Generation state
  const [generatePanelOpen, setGeneratePanelOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [outlineJSON, setOutlineJSON] = useState("");
  const [outlineEditable, setOutlineEditable] = useState("");
  const [briefForm, setBriefForm] = useState({
    platform: "blog",
    tone: "professional",
    target_audience: "",
    content_length: "medium",
    additional_instructions: "",
    language: "vi",
    brand_name: "",
    brand_persona: "",
    brand_guidelines: "",
  });

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

  // Step 3+4: Context Injection → Master Outline
  const handleGenerateOutline = async () => {
    const knowledgeText = activeJob?.knowledge_source?.content_text;
    if (!knowledgeText) {
      gooeyToast.error("No knowledge source data available. Please crawl a URL first.");
      return;
    }

    setIsGenerating(true);
    try {
      const payload: GenerateOutlineRequest = {
        team_id: resolveTeamId(),
        knowledge_source_id: activeJob?.knowledge_source?.id,
        knowledge_text: knowledgeText,
        platform: briefForm.platform,
        tone: briefForm.tone,
        target_audience: briefForm.target_audience || "Người quan tâm đến công nghệ và marketing",
        additional_instructions: briefForm.additional_instructions,
        language: briefForm.language,
        brand_name: briefForm.brand_name,
        brand_persona: briefForm.brand_persona,
        brand_guidelines: briefForm.brand_guidelines,
      };

      const result = await researchApi.generateOutline(payload);
      setOutlineJSON(result.outline_json);
      setOutlineEditable(result.outline_json);
      setWizardStep(2);
      gooeyToast.success("Outline generated! Review and edit before generating content.");
    } catch (error: any) {
      gooeyToast.error(error?.message || "Failed to generate outline");
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 5: Generate content from approved outline
  const handleGenerateFromOutline = async () => {
    const knowledgeText = activeJob?.knowledge_source?.content_text;
    if (!knowledgeText) return;

    setIsGenerating(true);
    try {
      const payload: GenerateContentRequest = {
        team_id: resolveTeamId(),
        knowledge_source_id: activeJob?.knowledge_source?.id,
        knowledge_text: knowledgeText,
        platform: briefForm.platform,
        tone: briefForm.tone,
        target_audience: briefForm.target_audience || "Người quan tâm đến công nghệ và marketing",
        content_length: briefForm.content_length,
        additional_instructions: briefForm.additional_instructions,
        language: briefForm.language,
        brand_name: briefForm.brand_name,
        brand_persona: briefForm.brand_persona,
        brand_guidelines: briefForm.brand_guidelines,
        outline: outlineEditable,
      };

      const result = await researchApi.generateContent(payload);

      setGeneratedContent(briefForm.platform, {
        platform: briefForm.platform,
        html: result.content_html,
        modelUsed: result.model_used,
        tokenUsage: result.token_usage,
        generatedAt: new Date().toISOString(),
      });

      gooeyToast.success(`Content generated for ${briefForm.platform}! Check the Editor panel.`);
      setGeneratePanelOpen(false);
      setPreviewOpen(false);
      setWizardStep(1);
      setOutlineJSON("");
      setOutlineEditable("");
    } catch (error: any) {
      gooeyToast.error(error?.message || "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenWizard = () => {
    setWizardStep(1);
    setOutlineJSON("");
    setOutlineEditable("");
    setGeneratePanelOpen(true);
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] text-label hover:text-indigo-400"
              onClick={() => setIsAiSettingsOpen(true)}
            >
              <Bot className="w-3.5 h-3.5 mr-1 text-indigo-500" />
              AI Engines
            </Button>
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
      </div>

      <AIProviderSettings open={isAiSettingsOpen} onOpenChange={setIsAiSettingsOpen} />

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
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-medium text-dim uppercase tracking-wider">
                  Context Window
                </h4>
                {activePreviewItem?.content && (
                  <span className="text-[9px] text-faint">
                    ~{Math.round(activePreviewItem.content.length / 4).toLocaleString()} Tokens
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                {contextTags.find((t) => t.id === "title") && (
                  <div className="relative group w-full rounded-md border border-amber-500/30 bg-amber-500/[0.03] p-2 pr-7">
                    <p className="text-[11px] font-semibold text-amber-500/90 leading-snug break-words">
                      {contextTags.find((t) => t.id === "title")?.label}
                    </p>
                    <X
                      className="absolute top-2 right-2 w-3.5 h-3.5 cursor-pointer opacity-50 hover:opacity-100 text-amber-500 hover:bg-amber-500/10 rounded-sm p-0.5 transition-colors"
                      onClick={() => removeTag("title")}
                    />
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1.5">
                  {contextTags
                    .filter((t) => t.id !== "title")
                    .map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 cursor-default border border-indigo-500/20 bg-indigo-500/[0.03] text-indigo-400 hover:bg-indigo-500/10 max-w-full font-medium"
                      >
                        <span className="truncate">{tag.label}</span>
                        <X
                          className="w-2.5 h-2.5 ml-1.5 shrink-0 cursor-pointer opacity-60 hover:opacity-100"
                          onClick={() => removeTag(tag.id)}
                        />
                      </Badge>
                    ))}
                </div>
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
        <DialogContent className="!max-w-5xl max-h-[85vh] h-[85vh] flex flex-col bg-surface-1 border-default p-0 [&>button]:right-5 [&>button]:top-5 overflow-hidden">
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
          
          <div className="flex flex-1 min-h-0">
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
            <div className="flex-1 flex flex-col min-w-0 bg-surface-0 relative overflow-hidden">
              {activePreviewItem ? (
                <>
                  {/* Workspace Toolbar */}
                  <div className="shrink-0 border-b border-default bg-surface-1 px-4 md:px-5 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <h2 className="text-sm font-semibold text-heading truncate">
                        {activePreviewItem.title}
                      </h2>
                      <Badge variant="secondary" className="text-[10px] bg-surface-active h-5 border-default whitespace-nowrap text-dim shrink-0">
                        ~{Math.round(activePreviewItem.content.length / 4)} tokens
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar max-w-full">
                       <Button
                         variant="outline"
                         size="sm"
                         className="h-7 text-[11px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 font-semibold"
                         onClick={() => handleOpenWizard()}
                         disabled={!activeJob?.knowledge_source?.content_text}
                       >
                         <Wand2 className="w-3 h-3 mr-1.5" />
                         Generate Content
                       </Button>
                       <Button variant="outline" size="sm" className="h-7 text-[11px] bg-surface-0 text-primary border-primary/20 hover:bg-primary/10">
                         <Sparkles className="w-3 h-3 mr-1.5" />
                         AI Summarize
                       </Button>
                       <div className="w-px h-4 bg-default mx-1" />
                       <Button variant="ghost" size="sm" className="h-7 text-[11px] text-dim hover:text-body">
                         <Save className="w-3.5 h-3.5 mr-1" />
                         Save to KB
                       </Button>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 flex flex-col p-4 md:p-6 w-full min-w-0 min-h-0 overflow-hidden bg-surface-0">
                    <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col min-h-0">
                      
                      <div className="shrink-0 mb-4 md:mb-5 pb-4 md:pb-5 border-b border-default/50 space-y-2 md:space-y-3 min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold text-heading leading-tight tracking-tight break-words">
                          {activePreviewItem.title}
                        </h1>
                        {activePreviewItem.url && (
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-[11px] text-dim min-w-0">
                            <a 
                              href={activePreviewItem.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center text-primary/80 hover:text-primary transition-colors min-w-0 max-w-full"
                            >
                              <Link2 className="w-3 h-3 mr-1 shrink-0" />
                              <span className="truncate break-all">{activePreviewItem.url}</span>
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
                      
                      <div className="flex-1 bg-surface-1/40 rounded-xl border border-default/40 shadow-sm flex flex-col min-h-0 overflow-hidden relative">
                        <ScrollArea className="flex-1 w-full h-full relative">
                          <div className="p-5 md:p-7 absolute inset-0 text-left overflow-auto">
                            <FormattedText text={activePreviewItem.content} />
                          </div>
                        </ScrollArea>
                      </div>

                    </div>
                  </div>
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

      {/* Multi-step Generate Wizard */}
      <Dialog open={generatePanelOpen} onOpenChange={(open) => {
        if (!isGenerating) {
          setGeneratePanelOpen(open);
        }
      }}>
        <DialogContent className="!max-w-xl bg-surface-1 border-default p-0 flex flex-col max-h-[85vh] overflow-hidden">
          <DialogHeader className="shrink-0 px-5 py-4 border-b border-default bg-surface-0 flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-sm font-medium text-heading flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-emerald-500" />
                AI Content Pipeline
              </DialogTitle>
              {activeJob?.knowledge_source?.title && (
                <p className="text-[11px] text-faint mt-1 truncate max-w-sm">
                  Source: {activeJob.knowledge_source.title}
                </p>
              )}
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${wizardStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-surface-active text-dim'}`}>1</span>
              <span className="w-4 h-px bg-default"></span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${wizardStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-surface-active text-dim'}`}>2</span>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-5 space-y-6">
              {wizardStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  {/* --- BRIEF SETUP --- */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-heading uppercase tracking-wider">1. Content Brief</h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-label">Platform</label>
                      <div className="flex gap-2">
                        {[
                          { value: "blog", label: "📝 Blog" },
                          { value: "facebook", label: "📘 Facebook" },
                          { value: "linkedin", label: "💼 LinkedIn" },
                        ].map((p) => (
                          <button
                            key={p.value}
                            onClick={() => setBriefForm((f) => ({ ...f, platform: p.value }))}
                            className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-medium border transition-all ${
                              briefForm.platform === p.value
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
                                : "bg-surface-hover border-default text-dim hover:text-body"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-label">Tone of Voice</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "professional", label: "🏢 Professional" },
                          { value: "casual", label: "😊 Casual" },
                          { value: "storyteller", label: "📖 Storyteller" },
                          { value: "data-driven", label: "📊 Data-Driven" },
                        ].map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setBriefForm((f) => ({ ...f, tone: t.value }))}
                            className={`px-3 py-2 rounded-lg text-[11px] font-medium border transition-all ${
                              briefForm.tone === t.value
                                ? "bg-primary/15 border-primary/30 text-primary"
                                : "bg-surface-hover border-default text-dim hover:text-body"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-label">Content Length</label>
                        <select 
                          value={briefForm.content_length}
                          onChange={(e) => setBriefForm(f => ({ ...f, content_length: e.target.value }))}
                          className="w-full bg-surface-hover text-xs text-body px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40"
                        >
                          <option value="short">Short (~200 words)</option>
                          <option value="medium">Medium (~500 words)</option>
                          <option value="long">Long (~1000 words)</option>
                        </select>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-label">Language</label>
                        <select 
                          value={briefForm.language}
                          onChange={(e) => setBriefForm(f => ({ ...f, language: e.target.value }))}
                          className="w-full bg-surface-hover text-xs text-body px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40"
                        >
                          <option value="vi">🇻🇳 Tiếng Việt</option>
                          <option value="en">🇺🇸 English</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-label">
                        Target Audience <span className="text-faint">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={briefForm.target_audience}
                        onChange={(e) => setBriefForm((f) => ({ ...f, target_audience: e.target.value }))}
                        placeholder="e.g. Marketers, startup founders..."
                        className="w-full bg-surface-hover text-xs text-body placeholder:text-faint px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40"
                      />
                    </div>
                  </div>

                  {/* --- BRAND DNA (Context Injection) --- */}
                  <div className="space-y-4 pt-4 border-t border-default/50">
                    <h3 className="text-xs font-semibold text-heading uppercase tracking-wider flex items-center gap-2">
                      <Dna className="w-3.5 h-3.5 text-indigo-500" />
                      2. Context Injection (Brand DNA)
                    </h3>
                    <p className="text-[11px] text-dim">
                      Inject brand identity into the synthesized knowledge so the AI writes like your brand.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-label">Brand Name</label>
                        <input
                          type="text"
                          value={briefForm.brand_name}
                          onChange={(e) => setBriefForm(f => ({ ...f, brand_name: e.target.value }))}
                          placeholder="e.g. Acme Corp"
                          className="w-full bg-surface-hover text-xs text-body placeholder:text-faint px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-label">Brand Persona</label>
                        <input
                          type="text"
                          value={briefForm.brand_persona}
                          onChange={(e) => setBriefForm(f => ({ ...f, brand_persona: e.target.value }))}
                          placeholder="e.g. Expert, friendly, data-driven"
                          className="w-full bg-surface-hover text-xs text-body placeholder:text-faint px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-label">Brand Voice Guidelines</label>
                      <textarea
                        value={briefForm.brand_guidelines}
                        onChange={(e) => setBriefForm(f => ({ ...f, brand_guidelines: e.target.value }))}
                        placeholder="e.g. Always use inclusive language. Avoid jargon. Mention product benefits."
                        rows={2}
                        className="w-full bg-surface-hover text-xs text-body placeholder:text-faint px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-heading uppercase tracking-wider flex items-center gap-2">
                      <ListRestart className="w-3.5 h-3.5 text-blue-500" />
                      Master Outline Review
                    </h3>
                    <Badge variant="secondary" className="text-[9px] bg-blue-500/10 text-blue-500 border-blue-500/20">
                      AIDA / PAS Framework
                    </Badge>
                  </div>
                  <p className="text-[11px] text-dim">
                    The AI has structured the synthesized knowledge and injected your Brand DNA. Review and adjust this master structure before generating the final multi-format content.
                  </p>
                  
                  <textarea
                    value={outlineEditable}
                    onChange={(e) => setOutlineEditable(e.target.value)}
                    className="w-full h-[400px] bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[11px] p-4 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500/50 resize-y"
                    spellCheck={false}
                  />
                  <div className="flex items-center gap-2 text-[10px] text-faint">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    Edit the JSON above to tweak section headings, key points, or add specific dataset references.
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="shrink-0 px-5 py-3 border-t border-default bg-surface-0 flex items-center justify-between">
            {wizardStep === 1 ? (
              <>
                <p className="text-[10px] text-faint">
                  {activeJob?.knowledge_source?.content_text
                    ? `~${Math.round(activeJob.knowledge_source.content_text.length / 4).toLocaleString()} tokens source data`
                    : "No source data"}
                </p>
                <div className="flex space-x-2">
                  <Button variant="ghost" className="h-8 px-4 text-[11px]" onClick={() => setGeneratePanelOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="h-8 px-4 text-[11px] bg-indigo-500 hover:bg-indigo-600 text-white border-0 font-semibold"
                    onClick={handleGenerateOutline}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Digesting Context...</>
                    ) : (
                      <>Next: Generate Outline <Wand2 className="w-3 h-3 ml-1.5" /></>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" className="h-8 px-4 text-[11px]" onClick={() => setWizardStep(1)} disabled={isGenerating}>
                  Back to Config
                </Button>
                <Button
                  className="h-8 px-4 text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-semibold shadow-sm shadow-emerald-500/20"
                  onClick={handleGenerateFromOutline}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Crafting Content...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Produce Marketing Content</>
                  )}
                </Button>
              </>
            )}
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

  const formatBold = (str: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    return str.split(boldRegex).map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="font-semibold text-heading">{part}</strong> : part
    );
  };

  // A very basic markdown tokenizer for professional rendering without heavy dependencies
  return (
    <div className="space-y-4 text-body pb-10">
      {text.split('\n\n').map((block, idx) => {
        const content = block.trim();
        if (!content) return null;
        
        if (content.startsWith('# ')) return <h1 key={idx} className="text-xl font-semibold text-heading tracking-tight mt-6 mb-3">{content.replace(/^#\s+/, '')}</h1>;
        if (content.startsWith('## ')) return <h2 key={idx} className="text-lg font-semibold text-heading tracking-tight mt-5 mb-2">{content.replace(/^##\s+/, '')}</h2>;
        if (content.startsWith('### ')) return <h3 key={idx} className="text-base font-semibold text-heading mt-4 mb-2">{content.replace(/^###\s+/, '')}</h3>;
        
        // Render lists
        if (content.startsWith('- ') || content.startsWith('* ')) {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1 my-3">
              {content.split('\n').map((item, i) => (
                <li key={i} className="text-[13px] text-body">{formatBold(item.replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        // Render images: support markdown images like ![alt](src) and isolate them or put them inline
        const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
        if (imgRegex.test(content)) {
            // Split text by markdown images to render them interchangeably
            const parts = content.split(imgRegex);
            const elements: React.ReactNode[] = [];
            for (let i = 0; i < parts.length; i += 3) {
                if (parts[i]) {
                    elements.push(<span key={`t-${i}`}>{formatBold(parts[i])}</span>);
                }
                if (i + 1 < parts.length) {
                    const alt = parts[i+1];
                    const url = parts[i+2];
                    elements.push(
                        <span key={`img-${i}`} className="block my-5 text-center">
                            <img src={url} alt={alt} loading="lazy" className="mx-auto max-h-[400px] object-contain rounded-lg shadow-sm border border-default/20 bg-surface-1" />
                            {alt && <span className="block text-[11px] text-dim mt-2 italic">{alt}</span>}
                        </span>
                    );
                }
            }
            return <div key={idx} className="text-[13px] leading-relaxed text-dim">{elements}</div>;
        }

        return (
          <p key={idx} className="text-[13px] leading-relaxed text-dim">
            {formatBold(content)}
          </p>
        );
      })}
    </div>
  );
}
