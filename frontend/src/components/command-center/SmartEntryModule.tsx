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
  ImageIcon,
  Eye,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { researchApi, type GenerateContentRequest, type GenerateOutlineRequest, type AutoSuggestResponse } from "@/api/research";
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
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";
import type {
  CrawlJob,
  CrawlJobDetailResponse,
  StartResearchRequest,
} from "@/types/research";
import type { InputMode, ContextTag } from "@/types/smart-entry";
import { AIProviderSettings } from "./AIProviderSettings";
import { 
  isImageURL, 
  voiceProfiles, 
  DEFAULT_TEAM_ID, 
  TEAM_ID_KEY, 
  tagColors, 
  DICTIONARY 
} from "@/constants/smart-entry";

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
  const setMasterOutline = useResearchStore((state) => state.setMasterOutline);

  // User Preferences — persist content brief settings across sessions
  const userPrefs = useUserPreferencesStore((s) => s.preferences);
  const updatePreferences = useUserPreferencesStore((s) => s.updatePreferences);
  const savePreferences = useUserPreferencesStore((s) => s.savePreferences);

  const [inputMode, setInputMode] = useState<InputMode>("link");
  const [inputValue, setInputValue] = useState("");
  const [imageUrlValue, setImageUrlValue] = useState("");
  const [brandVoiceOn, setBrandVoiceOn] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contextTags, setContextTags] = useState<ContextTag[]>([]);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const detectedImageURL = useMemo(() => inputMode === 'link' && inputValue.trim() && isImageURL(inputValue.trim()) ? inputValue.trim() : null, [inputMode, inputValue]);
  const [selectedVoice] = useState(voiceProfiles[0]);
  const [jobPanelOpen, setJobPanelOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // AI Auto-Suggest state (Step 2: AI-Powered Auto-Configuration)
  const [aiSuggestions, setAiSuggestions] = useState<AutoSuggestResponse | null>(null);
  const [isAutoSuggesting, setIsAutoSuggesting] = useState(false);
  const [suggestionsApplied, setSuggestionsApplied] = useState(false);

  // Multi-stage progress for content generation
  const [generationStage, setGenerationStage] = useState("");

  // Content Generation state — inline within Preview dialog (no extra popup)
  type PreviewMode = "preview" | "configure" | "outline";
  const [previewMode, setPreviewMode] = useState<PreviewMode>("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [outlineJSON, setOutlineJSON] = useState("");
  const [outlineEditable, setOutlineEditable] = useState("");
  const [briefForm, setBriefForm] = useState({
    platform: userPrefs?.default_platform || "blog",
    tone: userPrefs?.default_tone || "professional",
    target_audience: userPrefs?.default_target_audience || "",
    content_length: userPrefs?.default_content_length || "medium",
    additional_instructions: "",
    language: userPrefs?.default_language || "vi",
    point_of_view: "third_person",
    expertise_level: "expert",
    framework: "standard",
  });

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleCancelGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsGenerating(false);
      setGenerationStage("");
      setGeneratingPlatformIdx(-1);
      gooeyToast.info("Đã hủy quá trình tạo");
    }
  }, [abortController]);

  // Sync briefForm when preferences are loaded from server (only once)
  const [prefsApplied, setPrefsApplied] = useState(false);
  useEffect(() => {
    if (userPrefs && !prefsApplied) {
      setBriefForm((prev) => ({
        ...prev,
        platform: userPrefs.default_platform || prev.platform,
        tone: userPrefs.default_tone || prev.tone,
        target_audience: userPrefs.default_target_audience || prev.target_audience,
        content_length: userPrefs.default_content_length || prev.content_length,
        language: userPrefs.default_language || prev.language,
      }));
      setPrefsApplied(true);
    }
  }, [userPrefs, prefsApplied]);

  // Save preferences back to server when user completes content generation
  const persistBriefToPreferences = useCallback(() => {
    if (!user?.id) return;
    updatePreferences({
      default_tone: briefForm.tone,
      default_language: briefForm.language,
      default_content_length: briefForm.content_length,
      default_target_audience: briefForm.target_audience,
      default_platform: briefForm.platform,
    });
    // Fire-and-forget save to server
    savePreferences(user.id).catch(() => {});
  }, [user?.id, user?.team_id, briefForm, updatePreferences, savePreferences]);

  const modes: { key: InputMode; icon: any; label: string }[] = [
    { key: "link", icon: Link2, label: "Web Link" },
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

  // Auto-suggest trigger: when crawl job completes and has knowledge source, run AI analysis
  useEffect(() => {
    if (
      activeJob?.job?.status?.toLowerCase() === 'completed' &&
      activeJob?.knowledge_source?.content_text &&
      !aiSuggestions &&
      !isAutoSuggesting &&
      !suggestionsApplied
    ) {
      const runAutoSuggest = async () => {
        setIsAutoSuggesting(true);
        try {
          const result = await researchApi.autoSuggest({
            knowledge_text: activeJob.knowledge_source!.content_text,
            language: briefForm.language,
          });
          
          setSuggestionsApplied(true); // Mark as attempted regardless of success to stop loop

          if (result.ai_suggested) {
            setAiSuggestions(result);
            // Auto-apply suggestions to brief form
            setBriefForm((prev) => ({
              ...prev,
              tone: result.tone || prev.tone,
              target_audience: result.target_audience || prev.target_audience,
              framework: result.framework_suggestion || prev.framework,
            }));
          }
        } catch (err) {
          console.warn('Auto-suggest failed (non-critical):', err);
        } finally {
          setIsAutoSuggesting(false);
        }
      };
      runAutoSuggest();
    }
  }, [activeJob, aiSuggestions, isAutoSuggesting, suggestionsApplied]);

  const handleAnalyze = useCallback(async (forcedStrategy?: "auto" | "image", isCombined?: boolean) => {
    const isVisionOnly = forcedStrategy === "image" && !isCombined;
    const valueToUse = isVisionOnly ? imageUrlValue : inputValue;
    
    if (!valueToUse.trim() && !isCombined) return;
    if (isCombined && (!inputValue.trim() || !imageUrlValue.trim())) return;

    if (!isVisionOnly && !isCombined && inputMode === "keyword") {
      const keywords = valueToUse
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
      gooeyToast.success("Keywords added to context");
      return;
    }

    if (!isVisionOnly && !isCombined && inputMode === "file") {
      gooeyToast.info("File analysis coming soon!");
      return;
    }

    setIsAnalyzing(true);
    try {
      const strategy = forcedStrategy || "auto";
      const isVision = strategy === "image";

      const payload: StartResearchRequest = {
        team_id: resolveTeamId(),
        user_id: user?.id,
        url: inputValue.trim() || (isVisionOnly ? imageUrlValue.trim() : ""),
        image_url: isCombined || isVisionOnly ? imageUrlValue.trim() : undefined,
        strategy: strategy,
        max_pages: isVision ? 1 : 3,
        use_stealth: false,
      };

      const response = await researchApi.startURLResearch(payload);
      setActiveJobId(response.job_id);
      setPolling(true);
      setJobPanelOpen(true);
      
      if (isCombined) {
        gooeyToast.success("Combined Research started — Crawling web + analyzing image");
      } else {
        gooeyToast.success(isVision ? "Image analysis job created — analyzing with LLaVA" : "Crawl job created");
      }
    } catch (error: any) {
      gooeyToast.error(error?.message || "Cannot create crawl job");
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    inputMode,
    inputValue,
    imageUrlValue,
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
      // If no active job but panel is open, refresh recent list anyway
      setIsRefreshing(true);
      await fetchRecentJobs(resolveTeamId());
      setIsRefreshing(false);
      return;
    }
    
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadJobDetail(activeJobId, true),
        fetchRecentJobs(resolveTeamId())
      ]);
      gooeyToast.success("Data refreshed");
    } finally {
      setIsRefreshing(false);
    }
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

  // Step 3+4: Context Injection â†’ Master Outline
  const handleGenerateOutline = async () => {
    const knowledgeText = activeJob?.knowledge_source?.content_text;
    if (!knowledgeText) {
      gooeyToast.error("No knowledge source data available. Please crawl a URL first.");
      return;
    }

    setIsGenerating(true);
    setGenerationStage("Đang hợp nhất Brand DNA...");
    try {
      await new Promise(r => setTimeout(r, 600));
      setGenerationStage("Đang áp dụng Framework " + (briefForm.framework || 'AIDA').toUpperCase() + "...");
      
      const payload: GenerateOutlineRequest = {
        team_id: resolveTeamId(),
        knowledge_source_id: activeJob?.knowledge_source?.id,
        knowledge_text: knowledgeText,
        platform: 'blog', // Use blog for the most comprehensive outline — will be adapted per-platform during content generation
        tone: briefForm.tone,
        target_audience: briefForm.target_audience || "Người quan tâm đến công nghệ và marketing",
        additional_instructions: briefForm.additional_instructions ? `${briefForm.additional_instructions}\n\nNote: This outline will be used to generate content for Facebook, LinkedIn, and Blog simultaneously.` : 'This outline will be used to generate content for Facebook, LinkedIn, and Blog simultaneously.',
        language: briefForm.language,
      };

      const controller = new AbortController();
      setAbortController(controller);

      const result = await researchApi.generateOutline(payload, controller.signal);
      setGenerationStage("Hoàn thiện dàn ý...");
      await new Promise(r => setTimeout(r, 400));
      
      setOutlineJSON(result.outline_json);
      setOutlineEditable(result.outline_json);
      
      // Sync to shared store for editor
      try {
        const parsed = JSON.parse(result.outline_json);
        const sectionsArray = parsed.sections || (Array.isArray(parsed) ? parsed : []);
        if (Array.isArray(sectionsArray)) {
          // Flatten/Transform to matching OutlineItem format if needed
          const transformed = sectionsArray.map((item: any, idx: number) => ({
            id: item.id || `sec-${idx}`,
            level: 1,
            text: item.heading || item.section || item.title || "Untitled Section",
            children: (item.key_points || item.points || []).map((p: string, pIdx: number) => ({
              id: `sec-${idx}-p-${pIdx}`,
              level: 2,
              text: p
            }))
          }));
          setMasterOutline(transformed);
        }
      } catch (e) {
        console.error("Failed to parse outline JSON", e);
      }

      setPreviewMode("outline");
      gooeyToast.success("Outline generated! Review and edit before generating content.");
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
      gooeyToast.error(error?.message || "Failed to generate outline");
    } finally {
      setIsGenerating(false);
      setGenerationStage("");
      setAbortController(null);
    }
  };

  // Step 5: Generate content for ALL platforms from approved outline
  const ALL_PLATFORMS = ['blog', 'linkedin', 'facebook'] as const;
  const [generatingPlatformIdx, setGeneratingPlatformIdx] = useState(-1);

  // Platform-specific content length mapping for optimal output
  const getPlatformContentLength = (platform: string, userChoice: string): string => {
    // Facebook posts should always be shorter, LinkedIn medium, Blog respects user choice
    switch (platform) {
      case 'facebook': return 'short';
      case 'linkedin': return userChoice === 'long' ? 'medium' : userChoice;
      case 'blog': return userChoice;
      default: return userChoice;
    }
  };

  // Platform-specific additional instructions for optimization
  const getPlatformInstructions = (platform: string, userInstructions: string): string => {
    const platformHints: Record<string, string> = {
      facebook: 'Optimize for Facebook: Use hook in first 2 lines, add emojis strategically, keep paragraphs very short (2-3 sentences), end with hashtags (3-5). Format for mobile-first reading.',
      linkedin: 'Optimize for LinkedIn: Lead with a bold insight or stat, use professional but conversational tone, add line breaks between paragraphs, include data points, end with an engaging question.',
      blog: 'Optimize for Blog/SEO: Use proper H1/H2/H3 hierarchy, include introduction and conclusion sections, use bullet points for key takeaways, add blockquotes for emphasis.',
    };
    const hint = platformHints[platform] || '';
    return userInstructions ? `${hint}\n\nUser instructions: ${userInstructions}` : hint;
  };

  // Resolve image URL for content generation from either the image input field or the crawl job
  const resolveImageURL = useCallback((): string => {
    // Priority: explicit image URL field > source_image_url from job > detected image URL from main input
    if (imageUrlValue.trim()) return imageUrlValue.trim();
    if (activeJob?.job?.source_image_url) return activeJob.job.source_image_url;
    if (detectedImageURL) return detectedImageURL;
    return '';
  }, [imageUrlValue, activeJob, detectedImageURL]);

  // Extract image emotion/context from knowledge source metadata (if vision analysis was done)
  const resolveImageMetadata = useCallback((): { emotion: string; context: string } => {
    const meta = activeJob?.knowledge_source?.metadata as any;
    if (meta?.image_analysis) {
      return {
        emotion: (meta.image_analysis.emotions || []).join(', ') || '',
        context: meta.image_analysis.description || '',
      };
    }
    return { emotion: '', context: '' };
  }, [activeJob]);

  const handleGenerateFromOutline = async () => {
    const knowledgeText = activeJob?.knowledge_source?.content_text;
    if (!knowledgeText) return;

    setIsGenerating(true);
    let successCount = 0;
    const totalPlatforms = ALL_PLATFORMS.length;
    const imageURL = resolveImageURL();
    const imageMeta = resolveImageMetadata();

    try {
      const controller = new AbortController();
      setAbortController(controller);
      for (let i = 0; i < ALL_PLATFORMS.length; i++) {
        const platform = ALL_PLATFORMS[i];
        setGeneratingPlatformIdx(i);
        setGenerationStage(`Đang tạo nội dung ${platform === 'blog' ? 'Blog' : platform === 'facebook' ? 'Facebook' : 'LinkedIn'}...`);

        const stylePrompt = [
          briefForm.additional_instructions,
          `- Point of View: ${briefForm.point_of_view.replace('_', ' ')}`,
          `- Target Expertise Level: ${briefForm.expertise_level}`,
          `- Writing Framework to apply: ${briefForm.framework.toUpperCase()}`,
        ].filter(Boolean).join('\n');

        try {
          const payload: GenerateContentRequest = {
            team_id: resolveTeamId(),
            knowledge_source_id: activeJob?.knowledge_source?.id,
            knowledge_text: knowledgeText,
            platform,
            tone: briefForm.tone,
            target_audience: briefForm.target_audience || "Người quan tâm đến công nghệ và marketing",
            content_length: getPlatformContentLength(platform, briefForm.content_length),
            additional_instructions: getPlatformInstructions(platform, stylePrompt),
            language: briefForm.language,
            outline: outlineEditable,
            image_url: imageURL,
            image_emotion: imageMeta.emotion,
            image_context: imageMeta.context,
          };

          const result = await researchApi.generateContent(payload, controller.signal);

          setGeneratedContent(platform, {
            platform,
            html: result.content_html,
            modelUsed: result.model_used,
            tokenUsage: result.token_usage,
            generatedAt: new Date().toISOString(),
          });
          successCount++;
        } catch (error: any) {
          if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
          console.error(`Failed to generate for ${platform}:`, error);
          gooeyToast.error(`⚠️ ${platform} generation failed: ${error?.message || 'Unknown error'}`);
        }
      }

      if (successCount > 0) {
        gooeyToast.success(`✅ Generated content for ${successCount}/${totalPlatforms} platforms! Check the Editor panel.`);
        persistBriefToPreferences();
        setPreviewMode("preview");
        setPreviewOpen(false);
        setOutlineJSON("");
        setOutlineEditable("");
      } else {
        gooeyToast.error('All platform generations failed.');
      }
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
         // Canceled successfully
      }
    } finally {
      setIsGenerating(false);
      setGeneratingPlatformIdx(-1);
      setGenerationStage("");
      setAbortController(null);
    }
  };

  const handleOpenWizard = () => {
    setOutlineJSON("");
    setOutlineEditable("");
    setSuggestionsApplied(false);
    setAiSuggestions(null);
    setPreviewMode("configure");
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
              <History className="w-3 h-3" />
              Jobs
              {recentJobs.length > 0 && (
                <Badge className="h-4 min-w-4 px-1 text-[9px] bg-primary/20 text-primary border-0">
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
                    className="mt-2 text-[10px] bg-surface-active border-default text-body max-w-[220px]"
                  >
                    <span className="truncate">{inputValue}</span>
                    <X
                      className="w-2.5 h-2.5 ml-1 shrink-0 cursor-pointer"
                      onClick={() => setInputValue("")}
                    />
                  </Badge>
                )}
              </div>
             ) : (
              <div className="flex flex-col">
                {/* Mode: link (Crawl URL) or Keywords */}
                <div className="flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    placeholder={
                      inputMode === "link"
                        ? "Paste article URL to crawl..."
                        : "Enter keywords, topics..."
                    }
                    className="flex-1 bg-transparent text-xs text-body placeholder:text-faint px-3 py-2.5 outline-none"
                  />
                  <Button
                    size="sm"
                    className={`h-6 px-2 mr-1.5 text-[10px] border-0 ${
                      detectedImageURL 
                        ? 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-400'
                        : 'bg-primary/20 hover:bg-primary/30 text-primary'
                    }`}
                    onClick={() => handleAnalyze()}
                    disabled={isAnalyzing || !inputValue.trim()}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Analyze"
                    )}
                  </Button>
                </div>

                {/* Sub-field: Image URL (Only in link mode) */}
                {inputMode === "link" && (
                  <>
                    <div className="h-px bg-default/40 mx-3" />
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={imageUrlValue}
                        onChange={(e) => setImageUrlValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAnalyze("image")}
                        placeholder="Paste image URL for Vision analysis..."
                        className="flex-1 bg-transparent text-xs text-body placeholder:text-faint px-3 py-2.5 outline-none"
                      />
                      <Button
                        size="sm"
                        className="h-6 px-2 mr-1.5 text-[10px] border-0 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400"
                        onClick={() => handleAnalyze("image")}
                        disabled={isAnalyzing || !imageUrlValue.trim()}
                      >
                        {isAnalyzing ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <><ImageIcon className="w-3 h-3 mr-1" />Analyze</>
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {/* Image URL Preview Thumbnail (shared) */}
                {(detectedImageURL || (inputMode === "link" && imageUrlValue.trim() && isImageURL(imageUrlValue.trim()))) && (
                  <div className="mx-2 mb-2 p-2 rounded-lg border border-violet-500/20 bg-violet-500/[0.05] flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-md overflow-hidden border border-default/50 bg-surface-hover shrink-0">
                      <img 
                        src={imageUrlValue.trim() || (detectedImageURL as string)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3 text-violet-400 shrink-0" />
                        <span className="text-[10px] font-medium text-violet-400">
                          {imageUrlValue.trim() ? "Vision Target" : "Image URL Detected"}
                        </span>
                      </div>
                      <p className="text-[10px] text-dim mt-0.5 truncate">
                        Will analyze using local Ollama LLaVA vision model
                      </p>
                    </div>
                  </div>
                )}

                {/* Combined Action Button */}
                {inputMode === "link" && inputValue.trim() && imageUrlValue.trim() && (
                  <div className="px-1.5 pb-1.5">
                    <Button
                      className="w-full h-8 text-[10px] bg-indigo-500 hover:bg-indigo-600 text-white border-0 shadow-lg shadow-indigo-500/20"
                      onClick={() => handleAnalyze("auto", true)}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                      ) : (
                        <Sparkles className="w-3 h-3 mr-1.5" />
                      )}
                      Analyze Combined (Web + Image)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>





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
            <div className={`rounded-lg border p-3 space-y-2 min-w-0 ${
              currentJob.strategy === 'image' 
                ? 'border-violet-500/20 bg-violet-500/[0.03]'
                : (currentJob.source_image_url && (currentJob.strategy === 'auto' || currentJob.strategy === 'browser'))
                ? 'border-indigo-500/20 bg-indigo-500/[0.03]'
                : 'border-default bg-surface-hover'
            }`}>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  {currentJob.strategy === 'image' ? (
                    <ImageIcon className="w-3 h-3 text-violet-400" />
                  ) : currentJob.source_image_url ? (
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                  ) : null}
                  <p className="text-[10px] uppercase tracking-wider text-dim">
                    {currentJob.strategy === 'image' ? 'Image Analysis' : currentJob.source_image_url ? 'Combined Research' : 'Active Crawl'}
                  </p>
                </div>
                <div className="min-w-0 shrink">
                  <StatusBadge status={currentJob.status} />
                </div>
              </div>
              {/* Image preview thumbnail for image or combined jobs */}
              {(currentJob.strategy === 'image' || currentJob.source_image_url) && currentJob.source_image_url && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded-md overflow-hidden border border-default/50 bg-surface-hover shrink-0">
                    <img 
                      src={currentJob.source_image_url} 
                      alt="Analyzing" 
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-body line-clamp-1 font-medium">
                      {currentJob.strategy === 'image' ? (currentJob.title || 'Analyzing image...') : 'Web + Image Synthesis'}
                    </p>
                    <p className="text-[10px] text-dim truncate w-[224px]">
                      {currentJob.source_url}
                    </p>
                  </div>
                </div>
              )}
              {currentJob.strategy !== 'image' && !currentJob.source_image_url && (
                <p className="text-[11px] text-body line-clamp-3 break-all">
                  {currentJob.title || currentJob.source_url}
                </p>
              )}
              <Progress value={crawlProgress} className="h-1.5" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-dim">
                  {currentJob.strategy === 'image' ? 'Vision AI' : `${currentJob.pages_crawled} page(s) ${currentJob.source_image_url ? '+ Vision' : ''}`}
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
                <p className="text-xs text-body break-all line-clamp-2">
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
                    <svg
                      viewBox="0 0 512 512"
                      className={`w-3 h-3 mr-1 ${(isPolling || isRefreshing) ? "animate-spin" : ""}`}
                      fill="#000000"
                    >
                      <path style={{ fill: "#CFF09E" }} d="M256,137.646L256,137.646c-17.513,0-31.71-14.197-31.71-31.71V46.237 c0-17.513,14.197-31.71,31.71-31.71l0,0c17.513,0,31.71,14.197,31.71,31.71v59.699C287.71,123.449,273.513,137.646,256,137.646z"></path>
                      <g>
                        <path style={{ fill: "#507C5C" }} d="M256,152.172c-25.496,0-46.237-20.741-46.237-46.237V46.237C209.763,20.741,230.504,0,256,0 s46.237,20.741,46.237,46.237v59.699C302.237,131.431,281.496,152.172,256,152.172z M256,29.053 c-9.474,0-17.184,7.709-17.184,17.184v59.699c0,9.474,7.709,17.184,17.184,17.184c9.474,0,17.184-7.709,17.184-17.184V46.237 C273.184,36.763,265.474,29.053,256,29.053z"></path>
                        <path style={{ fill: "#507C5C" }} d="M256,512c-25.496,0-46.237-20.741-46.237-46.237c0-8.022,6.504-14.527,14.527-14.527 c8.023,0,14.527,6.505,14.527,14.527c0,9.474,7.709,17.184,17.184,17.184c9.474,0,17.184-7.709,17.184-17.184v-59.699 c0-9.474-7.709-17.184-17.184-17.184c-9.474,0-17.184,7.709-17.184,17.184c0,8.022-6.504,14.527-14.527,14.527 c-8.023,0-14.527-6.505-14.527-14.527c0-25.496,20.741-46.237,46.237-46.237s46.237,20.741,46.237,46.237v59.699 C302.237,491.259,281.496,512,256,512z"></path>
                        <path style={{ fill: "#507C5C" }} d="M465.763,302.237c-8.023,0-14.527-6.505-14.527-14.527s6.504-14.527,14.527-14.527 c9.474,0,17.184-7.708,17.184-17.182s-7.709-17.184-17.184-17.184h-59.699c-9.474,0-17.184,7.708-17.184,17.182 c0,9.474,7.708,17.184,17.184,17.184c8.023,0,14.527,6.505,14.527,14.527s-6.504,14.527-14.527,14.527 c-25.494,0-46.237-20.741-46.237-46.235c0-25.496,20.741-46.237,46.237-46.237h59.699C491.259,209.765,512,230.506,512,256 C512,281.494,491.259,302.237,465.763,302.237z"></path>
                      </g>
                      <path style={{ fill: "#CFF09E" }} d="M14.527,256L14.527,256c0-17.513,14.197-31.71,31.71-31.71h59.699c17.513,0,31.71,14.197,31.71,31.71 l0,0c0,17.513-14.197,31.71-31.71,31.71H46.237C28.724,287.71,14.527,273.513,14.527,256z"></path>
                      <g>
                        <path style={{ fill: "#507C5C" }} d="M105.936,302.237H46.237C20.741,302.237,0,281.494,0,256.001c0-25.496,20.741-46.237,46.237-46.237 h59.699c25.494,0,46.237,20.741,46.237,46.235C152.172,281.494,131.431,302.237,105.936,302.237z M46.237,238.816 c-9.474,0-17.184,7.708-17.184,17.182V256c0,9.474,7.709,17.182,17.184,17.182h59.699c9.474,0,17.184-7.708,17.184-17.182 c0-9.474-7.708-17.184-17.184-17.184L46.237,238.816L46.237,238.816z"></path>
                        <path style={{ fill: "#507C5C" }} d="M362.111,196.102c-11.842,0.001-23.678-4.506-32.694-13.52 c-8.732-8.733-13.542-20.345-13.542-32.695c0-12.349,4.81-23.96,13.542-32.695l42.214-42.213 c8.732-8.733,20.343-13.543,32.694-13.543c12.351,0,23.962,4.811,32.695,13.543c18.028,18.028,18.028,47.361,0,65.389 l-42.214,42.214C385.793,191.596,373.949,196.102,362.111,196.102z M404.324,90.491c-4.59,0-8.905,1.788-12.15,5.035 l-42.214,42.213c-3.245,3.245-5.032,7.561-5.032,12.15c0,4.59,1.787,8.905,5.032,12.15l0,0c6.7,6.701,17.6,6.701,24.302,0 l42.213-42.214c3.245-3.244,5.033-7.56,5.033-12.15c0-4.589-1.787-8.905-5.033-12.149 C413.229,92.279,408.915,90.491,404.324,90.491z"></path>
                      </g>
                      <path style={{ fill: "#CFF09E" }} d="M85.252,426.748L85.252,426.748c-12.384-12.384-12.384-32.461,0-44.845l42.213-42.213 c12.384-12.384,32.461-12.384,44.845,0l0,0c12.384,12.384,12.384,32.461,0,44.845l-42.213,42.213 C117.714,439.132,97.636,439.132,85.252,426.748z"></path>
                      <g>
                        <path style={{ fill: "#507C5C" }} d="M107.676,450.561c-12.351,0-23.962-4.81-32.695-13.542c-8.732-8.733-13.542-20.345-13.542-32.694 c0-12.351,4.81-23.962,13.542-32.695l42.214-42.214c18.029-18.026,47.361-18.025,65.389,0c8.732,8.733,13.542,20.345,13.542,32.695 c0,12.349-4.81,23.96-13.542,32.695l-42.214,42.213C131.637,445.753,120.026,450.561,107.676,450.561z M149.889,344.936 c-4.402,0-8.8,1.673-12.152,5.025l-42.213,42.214c-3.245,3.244-5.033,7.56-5.033,12.15c0,4.589,1.787,8.905,5.033,12.149l0,0 c3.245,3.245,7.561,5.033,12.15,5.033s8.905-1.787,12.15-5.033l42.214-42.213c3.245-3.245,5.032-7.561,5.032-12.15 c0-4.59-1.787-8.905-5.032-12.15C158.69,346.611,154.289,344.936,149.889,344.936z"></path>
                        <path style={{ fill: "#507C5C" }} d="M404.324,450.561c-12.351,0-23.962-4.81-32.695-13.542l-42.213-42.213 c-8.733-8.735-13.543-20.346-13.543-32.695c0-12.351,4.81-23.962,13.543-32.695l0,0l0,0c18.026-18.03,47.36-18.028,65.387,0 l42.214,42.214c8.732,8.733,13.542,20.345,13.542,32.695c0,12.349-4.81,23.96-13.542,32.694 C428.287,445.753,416.675,450.561,404.324,450.561z M362.111,344.936c-4.4,0-8.8,1.673-12.15,5.025l0,0 c-3.245,3.245-5.032,7.56-5.032,12.15c0,4.589,1.787,8.905,5.033,12.15l42.213,42.213c3.247,3.245,7.561,5.033,12.152,5.033 s8.905-1.787,12.15-5.033c3.245-3.244,5.033-7.56,5.033-12.149c0-4.59-1.787-8.906-5.033-12.15l-42.214-42.214 C370.913,346.611,366.511,344.936,362.111,344.936z M339.689,339.689h0.015H339.689z"></path>
                      </g>
                      <path style={{ fill: "#CFF09E" }} d="M85.252,85.252L85.252,85.252c12.384-12.384,32.461-12.384,44.845,0l42.213,42.213 c12.384,12.384,12.384,32.461,0,44.845l0,0c-12.384,12.384-32.461,12.384-44.845,0l-42.213-42.213 C72.869,117.714,72.869,97.636,85.252,85.252z"></path>
                      <path style={{ fill: "#507C5C" }} d="M149.889,196.104c-11.839,0-23.68-4.508-32.694-13.521l-42.214-42.214 c-8.732-8.733-13.542-20.345-13.542-32.695c0-12.349,4.81-23.96,13.542-32.694l0,0l0,0c8.733-8.733,20.345-13.543,32.695-13.543 s23.962,4.811,32.695,13.543l42.213,42.213c8.733,8.735,13.543,20.346,13.543,32.695c0,12.351-4.81,23.962-13.543,32.695 C173.569,191.598,161.729,196.102,149.889,196.104z M107.676,90.491c-4.59,0-8.905,1.788-12.15,5.035l0,0 c-6.7,6.698-6.7,17.6,0,24.3l42.214,42.214c6.698,6.697,17.602,6.703,24.3,0c3.245-3.245,5.033-7.56,5.033-12.15 c0-4.589-1.787-8.905-5.033-12.15l-42.214-42.214C116.579,92.279,112.265,90.491,107.676,90.491z M85.252,85.254h0.015H85.252z"></path>
                    </svg>
                    Refresh
                  </Button>

                  {currentJob.status.toLowerCase() === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] border-default bg-transparent text-primary hover:text-primary"
                      onClick={() => setPreviewOpen(true)}
                    >
                    <svg
                      viewBox="0 0 512 512"
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                    >
                      <rect x="125.735" y="89.163" className="fill-emerald-500 dark:fill-[#CFF09E]" width="150.948" height="57.367"></rect>
                      <path className="fill-emerald-700 dark:fill-[#507C5C]" d="M276.677,160.868H125.729c-7.921,0-14.342-6.421-14.342-14.342V89.159 c0-7.921,6.421-14.342,14.342-14.342h150.948c7.921,0,14.342,6.421,14.342,14.342v57.367 C291.018,154.446,284.596,160.868,276.677,160.868z M140.071,132.184h122.264v-28.684H140.071V132.184z"></path>
                      <rect x="125.735" y="227.318" className="fill-emerald-500 dark:fill-[#CFF09E]" width="260.548" height="57.367"></rect>
                      <g>
                        <path className="fill-emerald-700 dark:fill-[#507C5C]" d="M386.272,299.025H125.729c-7.921,0-14.342-6.421-14.342-14.342v-57.367 c0-7.921,6.421-14.342,14.342-14.342h260.544c7.921,0,14.342,6.421,14.342,14.342v57.367 C400.614,292.605,394.192,299.025,386.272,299.025z M140.071,270.342h231.86v-28.684h-231.86V270.342z"></path>
                        <path className="fill-emerald-700 dark:fill-[#507C5C]" d="M386.272,437.185H125.729c-7.921,0-14.342-6.421-14.342-14.342v-57.367 c0-7.921,6.421-14.342,14.342-14.342h260.544c7.921,0,14.342,6.421,14.342,14.342c0,7.921-6.421,14.342-14.342,14.342H140.071 v28.684h246.202c7.921,0,14.342,6.421,14.342,14.342C400.614,430.764,394.192,437.185,386.272,437.185z"></path>
                      </g>
                      <polygon className="fill-emerald-500 dark:fill-[#CFF09E]" points="337.748,14.342 333.923,14.342 333.923,120.949 452.067,120.949 "></polygon>
                      <path className="fill-emerald-700 dark:fill-[#507C5C]" d="M454.638,204.371c-7.921,0-14.342,6.421-14.342,14.342v264.604H71.703V28.684h247.878v92.265 c0,7.921,6.421,14.342,14.342,14.342h118.144c5.892,0,11.184-3.604,13.344-9.086s0.747-11.727-3.563-15.746L347.529,3.852 c-0.109-0.102-0.228-0.191-0.34-0.288c-0.169-0.148-0.337-0.295-0.513-0.435c-0.176-0.141-0.357-0.272-0.539-0.403 c-0.191-0.138-0.38-0.274-0.578-0.403c-0.175-0.113-0.354-0.218-0.534-0.324c-0.217-0.129-0.435-0.255-0.658-0.373 c-0.168-0.087-0.34-0.165-0.511-0.247c-0.242-0.115-0.485-0.229-0.736-0.33c-0.166-0.067-0.337-0.123-0.506-0.185 c-0.26-0.093-0.518-0.188-0.783-0.267c-0.182-0.054-0.367-0.095-0.551-0.142c-0.257-0.065-0.511-0.135-0.773-0.185 c-0.235-0.046-0.473-0.075-0.71-0.109c-0.217-0.032-0.43-0.072-0.65-0.092c-0.462-0.044-0.929-0.07-1.4-0.07h-3.825H57.362 C49.441,0,43.02,6.421,43.02,14.342v483.316c0,7.921,6.421,14.342,14.342,14.342h397.277c7.921,0,14.342-6.421,14.342-14.342 V218.713C468.98,210.792,462.559,204.371,454.638,204.371z M348.265,106.607V43.76l67.394,62.847H348.265z"></path>
                    </svg>
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
                      : job.strategy === 'image'
                      ? "border-violet-500/10 bg-violet-500/[0.02] hover:bg-violet-500/[0.05]"
                      : job.source_image_url
                      ? "border-indigo-500/10 bg-indigo-500/[0.02] hover:bg-indigo-500/[0.05]"
                      : "border-default bg-surface-hover hover:bg-surface-active"
                  }`}
                >
                  <button
                    onClick={() => setActiveJobId(job.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {job.strategy === 'image' ? (
                        <ImageIcon className="w-2.5 h-2.5 text-violet-400" />
                      ) : job.source_image_url ? (
                        <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                      ) : (
                        <Link2 className="w-2.5 h-2.5 text-dim" />
                      )}
                      <span className="text-[9px] uppercase tracking-tighter text-dim font-medium">
                        {job.strategy === 'image' ? 'Vision' : job.source_image_url ? 'Combined' : 'Crawl'}
                      </span>
                    </div>
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
            <DialogTitle className="text-sm font-medium text-heading flex items-center gap-2">
              {activeJob?.job?.strategy === 'image' && <ImageIcon className="w-4 h-4 text-violet-400" />}
              {activeJob?.job?.strategy === 'image' ? 'Image Analysis Preview' : 'Crawled Content Preview'}
            </DialogTitle>
            {activeJob?.job?.source_url && (
              <div className="flex items-center gap-2 mt-1">
                {activeJob.job.strategy === 'image' && (
                  <div className="w-8 h-8 rounded-md overflow-hidden border border-default/50 bg-surface-hover shrink-0">
                    <img 
                      src={activeJob.job.source_url} 
                      alt="Source" 
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <p className="text-[11px] text-faint truncate max-w-[80%]">
                  Source: {activeJob.job.source_url}
                </p>
              </div>
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
                  {/* Workspace Toolbar — mode-aware */}
                  <div className="shrink-0 border-b border-default bg-surface-1 px-4 md:px-5 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {previewMode !== "preview" && (
                        <button
                          onClick={() => { if (!isGenerating) setPreviewMode("preview"); }}
                          className="shrink-0 p-1 rounded hover:bg-surface-hover text-dim hover:text-body transition-colors"
                          title="Back to preview"
                        >
                          <ChevronDown className="w-4 h-4 rotate-90" />
                        </button>
                      )}
                      <h2 className="text-sm font-semibold text-heading truncate">
                        {previewMode === "preview" && activePreviewItem.title}
                        {previewMode === "configure" && "AI Content Pipeline — Configure Brief"}
                        {previewMode === "outline" && "AI Content Pipeline — Master Outline"}
                      </h2>
                      {previewMode === "preview" && (
                        <Badge variant="secondary" className="text-[10px] bg-surface-active h-5 border-default whitespace-nowrap text-dim shrink-0">
                          ~{Math.round(activePreviewItem.content.length / 4)} tokens
                        </Badge>
                      )}
                      {previewMode !== "preview" && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${previewMode === "configure" ? 'bg-indigo-500 text-white ring-2 ring-indigo-500/30' : 'bg-emerald-500 text-white'}`}>1</span>
                          <span className="w-3 h-px bg-default"></span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${previewMode === "outline" ? 'bg-emerald-500 text-white ring-2 ring-emerald-500/30' : 'bg-surface-active text-dim'}`}>2</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      {previewMode === "preview" && (
                        <>
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
                        </>
                      )}
                      {previewMode === "configure" && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-[11px] bg-indigo-500 hover:bg-indigo-600 text-white border-0 font-semibold"
                            onClick={handleGenerateOutline}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> {generationStage || 'Digesting Context...'}</>
                            ) : (
                              <><Wand2 className="w-3 h-3 mr-1.5" /> Generate Outline</>
                            )}
                          </Button>
                          {isGenerating && (
                            <Button size="sm" variant="ghost" className="h-7 text-[11px] text-red-400 hover:text-red-500 hover:bg-red-400/10" onClick={handleCancelGeneration}>
                              Hủy
                            </Button>
                          )}
                        </div>
                      )}
                      {previewMode === "outline" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={() => setPreviewMode("configure")}
                            disabled={isGenerating}
                          >
                            Back
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-[11px] bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white border-0 font-semibold shadow-sm shadow-emerald-500/20"
                            onClick={handleGenerateFromOutline}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> {generatingPlatformIdx >= 0 ? `Generating ${ALL_PLATFORMS[generatingPlatformIdx]} (${generatingPlatformIdx + 1}/${ALL_PLATFORMS.length})...` : 'Preparing...'}</>
                            ) : (
                              <><Sparkles className="w-3 h-3 mr-1.5" /> Produce All Platforms</>
                            )}
                          </Button>
                          {isGenerating && (
                            <Button size="sm" variant="ghost" className="h-7 text-[11px] text-red-400 hover:text-red-500 hover:bg-red-400/10" onClick={handleCancelGeneration}>
                              Hủy
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Area — mode-aware */}
                  <div className="flex-1 flex flex-col w-full min-w-0 min-h-0 overflow-hidden bg-surface-0">
                    {/* === PREVIEW MODE === */}
                    {previewMode === "preview" && (
                      <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0 overflow-hidden">
                        <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col min-h-0">
                          <div className="shrink-0 mb-4 md:mb-5 pb-4 md:pb-5 border-b border-default/50 space-y-2 md:space-y-3 min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold text-heading leading-tight tracking-tight break-words">
                              {activePreviewItem.title}
                            </h1>
                            {activePreviewItem.url && (
                              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-[11px] text-dim min-w-0">
                                <a href={activePreviewItem.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary/80 hover:text-primary transition-colors min-w-0 max-w-full">
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
                    )}

                    {/* === CONFIGURE MODE (Brief + Brand DNA) === */}
                    {previewMode === "configure" && (
                      <div className="flex-1 overflow-y-auto">
                        <div className="max-w-xl mx-auto p-6 space-y-6">
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-1 border border-default/50">
                            <Database className="w-4 h-4 text-primary shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-heading truncate">{activePreviewItem.title}</p>
                              <p className="text-[10px] text-faint">~{Math.round((activeJob?.knowledge_source?.content_text?.length || 0) / 4).toLocaleString()} tokens source data</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-heading uppercase tracking-wider flex items-center gap-2">
                              <PenLine className="w-3.5 h-3.5 text-primary" />
                              {(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.contentBrief || DICTIONARY.en.contentBrief)}
                            </h3>

                            {/* Generation Stage Progress Bar */}
                            {isGenerating && generationStage && (
                              <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                                  <span className="text-[11px] font-medium text-primary">{generationStage}</span>
                                </div>
                                <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-blue-500 rounded-full animate-pulse" style={{ width: '66%' }} />
                                </div>
                              </div>
                            )}

                            {/* Image Reference Preview (if user provided an image) */}
                            {(imageUrlValue.trim() || activeJob?.job?.source_image_url || detectedImageURL) && (
                              <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.04] p-3 flex items-center gap-3">
                                <div className="w-14 h-14 rounded-lg overflow-hidden border border-default/50 bg-surface-hover shrink-0">
                                  <img 
                                    src={imageUrlValue.trim() || activeJob?.job?.source_image_url || detectedImageURL || ''} 
                                    alt="Reference" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <ImageIcon className="w-3 h-3 text-violet-400 shrink-0" />
                                    <span className="text-[10px] font-semibold text-violet-400">{(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.visualAnchor || DICTIONARY.en.visualAnchor)}</span>
                                  </div>
                                  <p className="text-[10px] text-dim leading-relaxed">{(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.visualHint || DICTIONARY.en.visualHint)}</p>
                                </div>
                              </div>
                            )}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-medium text-label">{(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.targetPlatforms || DICTIONARY.en.targetPlatforms)}</label>
                              <div className="rounded-lg bg-gradient-to-r from-emerald-500/[0.07] to-blue-500/[0.07] border border-emerald-500/20 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-[11px] font-medium text-emerald-400">Multi-Platform Generation</span>
                                </div>
                                <p className="text-[10px] text-dim leading-relaxed mb-2.5">
                                  {(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.platformHint || DICTIONARY.en.platformHint)}
                                </p>
                                <div className="flex gap-2">
                                  {([
                                    { label: "Blog", hint: briefForm.language === 'en' ? "SEO-optimized article" : "Bài viết chuẩn SEO", icon: <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 shrink-0"><path fill="#F59E0B" d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/><path fill="#FFF" d="M16 14H8v-2h8v2zm0-4H8V8h8v2z"/></svg>, color: "text-amber-400" },
                                    { label: "Facebook", hint: briefForm.language === 'en' ? "Engaging post" : "Bài đăng thu hút", icon: <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 shrink-0"><g><path fill="#1877F2" d="M15 8a7 7 0 00-7-7 7 7 0 00-1.094 13.915v-4.892H5.13V8h1.777V6.458c0-1.754 1.045-2.724 2.644-2.724.766 0 1.567.137 1.567.137v1.723h-.883c-.87 0-1.14 1.093V8h1.941l-.31 2.023H9.094v4.892A7.001 7.001 0 0015 8z"></path><path fill="#ffffff" d="M10.725 10.023L11.035 8H9.094V6.687c0-.553.27-1.093 1.14-1.093h.883V3.87s-.801-.137-1.567-.137c-1.6 0-2.644.97-2.644 2.724V8H5.13v2.023h1.777v4.892a7.037 7.037 0 002.188 0v-4.892h1.63z"></path></g></svg>, color: "text-blue-400" },
                                    { label: "LinkedIn", hint: briefForm.language === 'en' ? "Professional article" : "Bài viết chuyên nghiệp", icon: <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 shrink-0"><path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9H12.76v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, color: "text-sky-400" },
                                  ]).map((p) => (
                                    <div key={p.label} className="flex-1 px-2.5 py-2 rounded-lg bg-surface-hover/60 border border-default/50 flex flex-col items-center gap-1">
                                      <div className="flex items-center gap-1.5">
                                        {p.icon}
                                        <span className={`text-[10px] font-semibold ${p.color}`}>{p.label}</span>
                                      </div>
                                      <span className="text-[9px] text-faint">{p.hint}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-medium text-label flex items-center gap-2">
                                {(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.toneOfVoice || DICTIONARY.en.toneOfVoice)}
                              </label>
                              <select value={briefForm.tone} onChange={(e) => setBriefForm(f => ({ ...f, tone: e.target.value }))} className="w-full bg-surface-hover text-xs text-body px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40 [color-scheme:dark]">
                                {(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.tones || DICTIONARY.en.tones).map(t => (
                                  <option className="bg-surface-2" key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-label">{(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.contentLength || DICTIONARY.en.contentLength)}</label>
                                <select value={briefForm.content_length} onChange={(e) => setBriefForm(f => ({ ...f, content_length: e.target.value }))} className="w-full bg-surface-hover text-xs text-body px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40 [color-scheme:dark]">
                                  {(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.lengths || DICTIONARY.en.lengths).map(l => (
                                    <option className="bg-surface-2" key={l.value} value={l.value}>{l.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-label">{(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.language || DICTIONARY.en.language)}</label>
                                <select value={briefForm.language} onChange={(e) => setBriefForm(f => ({ ...f, language: e.target.value }))} className="w-full bg-surface-hover text-xs text-body px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40 [color-scheme:dark]">
                                  <option className="bg-surface-2" value="vi">🇻🇳 Tiếng Việt</option>
                                  <option className="bg-surface-2" value="en">🇺🇸 English</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-medium text-label flex items-center gap-2">
                                {(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.targetAudience || DICTIONARY.en.targetAudience)} <span className="text-faint">{(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.optional || DICTIONARY.en.optional)}</span>
                              </label>
                              <input type="text" value={briefForm.target_audience} onChange={(e) => setBriefForm((f) => ({ ...f, target_audience: e.target.value }))} placeholder={(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.audiencePlaceholder || DICTIONARY.en.audiencePlaceholder)} className="w-full bg-surface-hover text-xs text-body placeholder:text-faint px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-medium text-label">{(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.additionalInstructions || DICTIONARY.en.additionalInstructions)} <span className="text-faint">{(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.optional || DICTIONARY.en.optional)}</span></label>
                              <textarea value={briefForm.additional_instructions} onChange={(e) => setBriefForm((f) => ({ ...f, additional_instructions: e.target.value }))} placeholder={(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.instructionsPlaceholder || DICTIONARY.en.instructionsPlaceholder)} rows={2} className="w-full bg-surface-hover text-xs text-body placeholder:text-faint px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40 resize-none" />
                            </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-default/50">
                            <h3 className="text-xs font-semibold text-heading uppercase tracking-wider flex items-center gap-2">
                              <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />
                              {(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.advancedWriting || DICTIONARY.en.advancedWriting)}
                            </h3>
                            <p className="text-[10px] text-dim leading-relaxed">{(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.expertiseHint || DICTIONARY.en.expertiseHint)}</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-label flex items-center h-4">{(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.pointOfView || DICTIONARY.en.pointOfView)}</label>
                                <select value={briefForm.point_of_view} onChange={(e) => setBriefForm(f => ({ ...f, point_of_view: e.target.value }))} className="w-full bg-surface-hover text-xs text-body px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40 [color-scheme:dark]">
                                  {(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.povs || DICTIONARY.en.povs).map(p => (
                                    <option className="bg-surface-2" key={p.value} value={p.value}>{p.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-label flex items-center h-4">{(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.expertiseLevel || DICTIONARY.en.expertiseLevel)}</label>
                                <select value={briefForm.expertise_level} onChange={(e) => setBriefForm(f => ({ ...f, expertise_level: e.target.value }))} className="w-full bg-surface-hover text-xs text-body px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40 [color-scheme:dark]">
                                  {(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.expertise || DICTIONARY.en.expertise).map(ex => (
                                    <option className="bg-surface-2" key={ex.value} value={ex.value}>{ex.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1.5 md:col-span-1 col-span-2">
                                <label className="text-[11px] font-medium text-label flex items-center gap-2 h-4">
                                  {(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.copywritingFramework || DICTIONARY.en.copywritingFramework)}
                                </label>
                                <select value={briefForm.framework} onChange={(e) => setBriefForm(f => ({ ...f, framework: e.target.value }))} className="w-full bg-surface-hover text-xs text-body px-3 py-2 rounded-lg border border-default outline-none focus:border-primary/40 [color-scheme:dark]">
                                  {(DICTIONARY[briefForm.language as keyof typeof DICTIONARY]?.frameworks || DICTIONARY.en.frameworks).map(fr => (
                                    <option className="bg-surface-2" key={fr.value} value={fr.value}>{fr.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* === OUTLINE REVIEW MODE === */}
                    {previewMode === "outline" && (
                      <div className="flex-1 overflow-y-auto">
                        <div className="max-w-2xl mx-auto p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-semibold text-heading flex items-center gap-2">
                                <ListRestart className="w-4 h-4 text-blue-500" />
                                Master Outline
                              </h3>
                              <p className="text-[10px] text-dim mt-1">Review and adjust. The AI will follow this outline precisely.</p>
                            </div>
                            <Badge variant="secondary" className="text-[9px] bg-blue-500/10 text-blue-500 border-blue-500/20 shrink-0">
                              AIDA / PAS Framework
                            </Badge>
                          </div>
                          <textarea
                            value={outlineEditable}
                            onChange={(e) => setOutlineEditable(e.target.value)}
                            className="w-full h-[500px] bg-[#1a1a2e] text-[#e0e0e0] font-mono text-[11px] p-4 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500/40 resize-y border border-default/30"
                            spellCheck={false}
                          />
                          <div className="flex items-center gap-2 text-[10px] text-faint">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            Edit the JSON to tweak headings, key points, or data references before generating.
                          </div>
                        </div>
                      </div>
                    )}
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
