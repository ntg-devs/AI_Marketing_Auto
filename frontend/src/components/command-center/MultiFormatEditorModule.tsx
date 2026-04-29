"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { useSchedulerStore } from "@/store/useSchedulerStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  AlignLeft,
  LayoutList,
  Sparkles,
  Eye,
  Monitor,
  Smartphone,
  FileText,
  GripVertical,
  ChevronRight,
  ChevronDown,
  Loader2,
  Clock,
  Send,
  CalendarDays,
  Zap,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { researchApi } from "@/api/research";
import { gooeyToast } from "goey-toast";
import { format, isBefore, addHours } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import TipTapEditor from "./editor/TipTapEditor";
import "./editor/tiptap-editor.css";

type EditorMode = "outline" | "assets";
type PreviewDevice = "desktop" | "mobile";
type Platform = "facebook" | "linkedin" | "blog";

interface OutlineItem {
  id: string;
  level: number;
  text: string;
  collapsed?: boolean;
  children: { id: string; level: number; text: string }[];
}

const mockOutline: OutlineItem[] = [
  {
    id: "1",
    level: 1,
    text: "Introduction: The Challenge of Modern Marketing",
    children: [
      { id: "1a", level: 2, text: "Why traditional methods are failing" },
      { id: "1b", level: 2, text: "The AI-powered alternative" },
    ],
  },
  {
    id: "2",
    level: 1,
    text: "Core Problem: Content Production Bottleneck",
    children: [
      {
        id: "2a",
        level: 2,
        text: "Data: 73% of marketers struggle with scale",
      },
      { id: "2b", level: 2, text: "Case study: From 4 posts/week to 20" },
    ],
  },
  {
    id: "3",
    level: 1,
    text: "Solution Framework: Automated Content Pipeline",
    children: [
      { id: "3a", level: 2, text: "Step 1: Smart research aggregation" },
      { id: "3b", level: 2, text: "Step 2: AI-assisted content generation" },
      { id: "3c", level: 2, text: "Step 3: Multi-platform distribution" },
    ],
  },
  {
    id: "4",
    level: 1,
    text: "Results & ROI Projection",
    children: [{ id: "4a", level: 2, text: "Expected improvement metrics" }],
  },
];

const platformConfigs: Record<
  Platform,
  {
    title: string;
    icon: any;
    color: string;
    defaultContent: string;
    placeholder: string;
  }
> = {
  facebook: {
    title: "Facebook Post",
    icon: (props: any) => (
      <svg viewBox="0 0 16 16" width={20} fill="none" {...props}>
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <path
            fill="#1877F2"
            d="M15 8a7 7 0 00-7-7 7 7 0 00-1.094 13.915v-4.892H5.13V8h1.777V6.458c0-1.754 1.045-2.724 2.644-2.724.766 0 1.567.137 1.567.137v1.723h-.883c-.87 0-1.14.54-1.14 1.093V8h1.941l-.31 2.023H9.094v4.892A7.001 7.001 0 0015 8z"
          ></path>
          <path
            fill="#ffffff"
            d="M10.725 10.023L11.035 8H9.094V6.687c0-.553.27-1.093 1.14-1.093h.883V3.87s-.801-.137-1.567-.137c-1.6 0-2.644.97-2.644 2.724V8H5.13v2.023h1.777v4.892a7.037 7.037 0 002.188 0v-4.892h1.63z"
          ></path>
        </g>
      </svg>
    ),
    color: "text-blue-600 dark:text-blue-400",
    placeholder: "Write your Facebook post content...",
    defaultContent: `
      <h2>🚀 AI-Powered Content Automation</h2>
      <p>Tired of spending <strong>8+ hours</strong> creating content every week?</p>
      <p>We discovered that AI-powered content pipelines can cut production time by <strong>73%</strong> while <em>INCREASING</em> engagement.</p>
      <p>Here's what we learned from analyzing 500+ SaaS campaigns:</p>
      <ul>
        <li>Smart research saves <strong>3 hrs/week</strong></li>
        <li>AI drafts reduce editing time by <strong>60%</strong></li>
        <li>Auto-scheduling at peak hours = <strong>+45% reach</strong></li>
      </ul>
      <blockquote><p>Full breakdown in our latest blog 👇</p></blockquote>
      <p>#MarketingAutomation #AIContent #SaaS</p>
    `,
  },
  linkedin: {
    title: "LinkedIn Article",
    icon: (props: any) => (
      <svg viewBox="0 0 16 16" width={20} fill="none" {...props}>
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <path
            fill="#0A66C2"
            d="M12.225 12.225h-1.778V9.44c0-.664-.012-1.519-.925-1.519-.926 0-1.068.724-1.068 1.47v2.834H6.676V6.498h1.707v.783h.024c.348-.594.996-.95 1.684-.925 1.802 0 2.135 1.185 2.135 2.728l-.001 3.14zM4.67 5.715a1.037 1.037 0 01-1.032-1.031c0-.566.466-1.032 1.032-1.032.566 0 1.031.466 1.032 1.032 0 .566-.466 1.032-1.032 1.032zm.889 6.51h-1.78V6.498h1.78v5.727zM13.11 2H2.885A.88.88 0 002 2.866v10.268a.88.88 0 00.885.866h10.226a.882.882 0 00.889-.866V2.865a.88.88 0 00-.889-.864z"
          ></path>
        </g>
      </svg>
    ),
    color: "text-sky-600 dark:text-sky-400",
    placeholder: "Write your LinkedIn article...",
    defaultContent: `
      <h1>The Future of Marketing Automation in 2026</h1>
      <p>The marketing automation landscape has shifted dramatically.</p>
      <p>I've been working with AI-powered content pipelines for the past 6 months, and the results have been remarkable:</p>
      <ul>
        <li><strong>73%</strong> reduction in content production time</li>
        <li><strong>45%</strong> increase in organic reach</li>
        <li><strong>2.3x</strong> improvement in engagement rates</li>
      </ul>
      <h2>The Key Insight</h2>
      <p>It's not about replacing human creativity — it's about <strong>amplifying</strong> it.</p>
      <blockquote><p>"Automation doesn't replace creativity. It frees you to <em>be</em> more creative."</p></blockquote>
      <h2>Our Framework</h2>
      <p>Here's our framework for building an automated content pipeline that actually works:</p>
      <ol>
        <li><strong>Research Aggregation</strong> — Collect insights from Reddit, Quora, and Google Trends</li>
        <li><strong>AI-Assisted Drafting</strong> — Generate initial drafts with context-aware AI</li>
        <li><strong>Multi-Platform Adaptation</strong> — Automatically adjust tone for each channel</li>
      </ol>
    `,
  },
  blog: {
    title: "Blog Post",
    icon: (props: any) => (
      <svg viewBox="0 0 511.999 511.999" width={20} {...props}>
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <path
            className="fill-emerald-600 dark:fill-[#A5EB78]"
            d="M490.459,139.522c-13.413-24.343-32.425-46.06-56.507-64.546 c-47.877-36.752-111.076-56.993-177.951-56.993c-66.876,0-130.073,20.241-177.952,56.993 c-24.082,18.486-43.094,40.203-56.507,64.546C7.248,165.464,0,193.131,0,221.756s7.248,56.293,21.541,82.234 c12.356,22.425,29.475,42.614,50.92,60.109L60.577,477.06c-1.238,11.769,10.762,20.443,21.549,15.576l150.582-67.943l0,0 c7.701,0.548,15.47,0.836,23.291,0.836c66.875,0,130.073-20.241,177.951-56.993c24.082-18.486,43.094-40.203,56.507-64.546 c14.294-25.942,21.541-53.609,21.541-82.234S504.753,165.464,490.459,139.522z"
          ></path>
          <path
            className="fill-white/80 dark:fill-[#FFFFFF]"
            d="M395.901,318.968C358.877,347.389,309.193,363.04,256,363.04s-102.879-15.652-139.902-44.072 c-34.57-26.538-53.609-61.061-53.609-97.211s19.04-70.674,53.61-97.211c37.024-28.421,86.708-44.072,139.902-44.072 c53.192,0,102.877,15.652,139.901,44.072c34.571,26.537,53.61,61.061,53.61,97.211S430.472,292.43,395.901,318.968z"
          ></path>
          <path
            className="fill-emerald-800/10 dark:opacity-10 dark:fill-white"
            d="M85.211,244.48c0-36.15,19.04-70.674,53.61-97.211 c37.024-28.421,86.708-44.072,139.902-44.072c53.192,0,102.877,15.652,139.901,44.072c1.478,1.134,2.915,2.288,4.337,3.451 c-7.529-9.339-16.575-18.126-27.06-26.174c-37.024-28.421-86.708-44.072-139.901-44.072s-102.879,15.652-139.902,44.072 c-34.571,26.537-53.61,61.06-53.61,97.211c0,34.606,17.457,67.715,49.274,93.761C94.464,294.06,85.211,269.666,85.211,244.48z"
          ></path>
          <g>
            <path
              className="fill-emerald-800 dark:fill-[#515262]"
              d="M256,286.413c-16.154,0-31.402-5.514-40.79-14.747c-3.355-3.301-3.4-8.695-0.1-12.05 c3.301-3.357,8.697-3.398,12.049-0.1c6.181,6.08,17.232,9.855,28.841,9.855c11.671,0,22.751-3.806,28.917-9.931 c3.338-3.316,8.735-3.299,12.05,0.039c3.318,3.338,3.299,8.735-0.039,12.05C287.548,280.848,272.247,286.413,256,286.413z"
            ></path>
            <circle
              className="fill-emerald-800 dark:fill-[#515262]"
              cx="212.665"
              cy="195.782"
              r="16.284"
            ></circle>
            <circle
              className="fill-emerald-800 dark:fill-[#515262]"
              cx="299.444"
              cy="195.782"
              r="16.284"
            ></circle>
          </g>
        </g>
      </svg>
    ),
    color: "text-emerald-600 dark:text-emerald-400",
    placeholder: "Write your blog post...",
    defaultContent: `
      <h1>The Complete Guide to AI-Powered Content Automation</h1>
      <p>Marketing teams are under more pressure than ever. The demand for fresh, relevant content across multiple platforms has reached an all-time high, yet most teams still rely on manual processes that simply can't scale.</p>
      <p>In this guide, we'll explore how AI-powered content automation is transforming the way modern marketing teams operate.</p>
      <h2>The Problem: Content Production at Scale</h2>
      <p>According to our research, <strong>73% of marketers</strong> report struggling to maintain consistent content output across all their channels. The average marketing team spends:</p>
      <ul>
        <li><strong>8+ hours/week</strong> on content creation</li>
        <li><strong>4+ hours/week</strong> on research and ideation</li>
        <li><strong>3+ hours/week</strong> on scheduling and distribution</li>
      </ul>
      <blockquote><p>"We were drowning in content requests. Every channel needed different formats, different tones, different schedules. It was unsustainable." — Content Manager at a mid-size SaaS</p></blockquote>
      <h2>The Solution: AI-Powered Pipeline</h2>
      <p>The answer isn't to work harder — it's to work <em>smarter</em>. Here's how:</p>
      <ol>
        <li><strong>Automated Research</strong>: AI crawls Reddit, Quora, and industry forums to identify trending topics and pain points</li>
        <li><strong>Smart Drafting</strong>: Context-aware AI generates first drafts that match your brand voice</li>
        <li><strong>Multi-Format Export</strong>: One piece of content is automatically adapted for blog, social media, and email</li>
      </ol>
      <h3>Real Results</h3>
      <p>Companies using this approach have seen an average of:</p>
      <ul>
        <li><strong>73%</strong> reduction in content production time</li>
        <li><strong>45%</strong> increase in organic reach</li>
        <li><strong>2.3x</strong> improvement in engagement rates</li>
      </ul>
    `,
  },
};

/* ─── Time options ──────────────────────────────────────────────── */
const timeOptions = [
  "06:00",
  "07:00",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "14:30",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

/* ─── Schedule Action Bar ──────────────────────────────────────── */

interface ScheduleActionBarProps {
  selectedPlatform: Platform;
  editorContent: Record<Platform, string>;
  platformConfigs: typeof platformConfigs;
  generatedContent: Record<string, any>;
}

function ScheduleActionBar({
  selectedPlatform,
  editorContent,
  platformConfigs: configs,
  generatedContent,
}: ScheduleActionBarProps) {
  const user = useAuthStore((s) => s.user);
  const activeJob = useResearchStore((s) => s.activeJob);
  const { createSchedule, optimalSlots } = useSchedulerStore();
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"single" | "all">("single");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-platform time overrides for "schedule all" mode
  const [perPlatformTimes, setPerPlatformTimes] = useState<
    Record<Platform, string>
  >({
    facebook: "14:00",
    linkedin: "09:00",
    blog: "10:00",
  });
  const [perPlatformDates, setPerPlatformDates] = useState<
    Record<Platform, Date>
  >({
    facebook: new Date(),
    linkedin: new Date(),
    blog: new Date(),
  });

  // Get platforms that have content
  const platformsWithContent = useMemo(() => {
    return (Object.keys(configs) as Platform[]).filter((p) => {
      const content = editorContent[p]?.trim();
      return content && content !== "" && content !== "<p></p>";
    });
  }, [editorContent, configs]);

  // AI recommended time for current platform
  const aiSlot = useMemo(() => {
    const dayOfWeek =
      selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1;
    return optimalSlots
      .filter(
        (s) => s.platform === selectedPlatform && s.day_of_week === dayOfWeek,
      )
      .sort((a, b) => b.score - a.score)[0];
  }, [selectedDate, selectedPlatform, optimalSlots]);

  const handleScheduleSingle = async () => {
    const content = editorContent[selectedPlatform];
    if (!content?.trim() || content === "<p></p>") {
      gooeyToast.error("Nội dung trống, không thể lên lịch");
      return;
    }

    const scheduledAt = new Date(selectedDate);
    const [h, m] = selectedTime.split(":").map(Number);
    scheduledAt.setHours(h, m, 0, 0);

    if (isBefore(scheduledAt, new Date())) {
      gooeyToast.error("Thời gian phải nằm trong tương lai");
      return;
    }

    const actualTeamId = user?.team_id || activeJob?.job?.team_id;
    const actualUserId = user?.id;
    if (!actualTeamId || !actualUserId) {
      gooeyToast.error("Bạn cần đăng nhập và chọn Workspace để lên lịch");
      return;
    }

    setIsSubmitting(true);
    try {
      const cfg = configs[selectedPlatform];
      await createSchedule({
        teamId: actualTeamId,
        userId: actualUserId,
        platform: selectedPlatform,
        title: `${cfg.title}: ${new Date().toLocaleDateString("vi-VN")}`,
        contentHtml: content,
        scheduledAt: scheduledAt.toISOString(),
      });
      gooeyToast.success(
        `Đã lên lịch ${cfg.title} lúc ${format(scheduledAt, "HH:mm dd/MM", { locale: vi })}`,
      );
      setShowScheduler(false);
    } catch (error: any) {
      gooeyToast.error(error?.message || "Lên lịch thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleAll = async () => {
    if (platformsWithContent.length === 0) {
      gooeyToast.error("Chưa có nội dung nào để lên lịch");
      return;
    }

    const actualTeamId = user?.team_id || activeJob?.job?.team_id;
    const actualUserId = user?.id;
    if (!actualTeamId || !actualUserId) {
      gooeyToast.error("Bạn cần đăng nhập và chọn Workspace để lên lịch");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;

    try {
      for (const platform of platformsWithContent) {
        const content = editorContent[platform];
        const scheduledAt = new Date(perPlatformDates[platform] || new Date());
        const [h, m] = perPlatformTimes[platform].split(":").map(Number);
        scheduledAt.setHours(h, m, 0, 0);

        if (isBefore(scheduledAt, new Date())) continue;

        try {
          const cfg = configs[platform];
          await createSchedule({
            teamId: actualTeamId,
            userId: actualUserId,
            platform,
            title: `${cfg.title}: ${new Date().toLocaleDateString("vi-VN")}`,
            contentHtml: content,
            scheduledAt: scheduledAt.toISOString(),
          });
          successCount++;
        } catch {
          // Continue with next platform
        }
      }

      if (successCount > 0) {
        gooeyToast.success(
          `Đã lên lịch ${successCount}/${platformsWithContent.length} nền tảng`,
        );
        setShowScheduler(false);
      } else {
        gooeyToast.error("Không thể lên lịch cho bất kỳ nền tảng nào");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentContent = editorContent[selectedPlatform]?.trim();
  const hasCurrentContent = currentContent && currentContent !== "<p></p>";

  if (!hasCurrentContent && platformsWithContent.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-default bg-surface-1/50">
      {!showScheduler ? (
        /* Collapsed Bar */
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-primary/70" />
            <span className="text-[10px] text-dim">
              {platformsWithContent.length} nội dung sẵn sàng đăng
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {hasCurrentContent && (
              <Button
                size="sm"
                onClick={() => {
                  setScheduleMode("single");
                  setShowScheduler(true);
                }}
                className="h-6 px-2 text-[9px] bg-primary/15 hover:bg-primary/25 text-primary border border-primary/20"
              >
                <Clock className="w-2.5 h-2.5 mr-1" />
                Lên lịch {configs[selectedPlatform].title}
              </Button>
            )}
            {platformsWithContent.length > 1 && (
              <Button
                size="sm"
                onClick={() => {
                  setScheduleMode("all");
                  setShowScheduler(true);
                }}
                className="h-6 px-2 text-[9px] bg-gradient-to-r from-primary/15 to-purple-500/15 hover:from-primary/25 hover:to-purple-500/25 text-primary border border-primary/20"
              >
                <Send className="w-2.5 h-2.5 mr-1" />
                Lên lịch tất cả ({platformsWithContent.length})
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Expanded Schedule Form */
        <div className="px-3 py-2.5 space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-heading">
                {scheduleMode === "single"
                  ? `Lên lịch ${configs[selectedPlatform].title}`
                  : `Lên lịch ${platformsWithContent.length} nền tảng`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Toggle mode */}
              <button
                onClick={() =>
                  setScheduleMode(scheduleMode === "single" ? "all" : "single")
                }
                className="text-[9px] text-dim hover:text-primary px-1.5 py-0.5 rounded hover:bg-surface-hover transition-colors"
              >
                {scheduleMode === "single"
                  ? "Lên lịch tất cả"
                  : "Chỉ 1 nền tảng"}
              </button>
              <button
                onClick={() => setShowScheduler(false)}
                className="text-[9px] text-dim hover:text-heading px-1 py-0.5"
              >
                ✕
              </button>
            </div>
          </div>

          {scheduleMode === "single" ? (
            /* Single Platform Schedule */
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-[8px] text-faint uppercase tracking-wider block mb-0.5">
                  Ngày
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full text-left bg-surface-hover border border-default rounded px-2 py-1 text-[10px] text-body hover:border-strong transition-colors">
                      {format(selectedDate, "dd/MM/yyyy (EEE)", { locale: vi })}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-surface-1 border-default"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => d && setSelectedDate(d)}
                      disabled={(date) => isBefore(date, new Date())}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-32">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[8px] text-faint uppercase tracking-wider">
                    Giờ
                  </label>
                </div>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-surface-2 border border-default rounded px-2 py-1 text-[10px] text-body outline-none focus:border-primary/40 [color-scheme:dark]"
                />
              </div>
              <Button
                size="sm"
                disabled={isSubmitting}
                onClick={handleScheduleSingle}
                className="h-7 px-3 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3 mr-1" />
                )}
                {isSubmitting ? "..." : "Lên lịch"}
              </Button>
            </div>
          ) : (
            /* All Platforms Schedule */
            <div className="space-y-2">
              {/* Per-platform configurations */}
              <div className="space-y-1.5">
                {platformsWithContent.map((p) => {
                  const cfg = configs[p];

                  return (
                    <div
                      key={p}
                      className="flex items-center gap-2 py-1.5 px-2 rounded bg-surface-hover/50"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span
                        className={`text-[10px] font-medium w-[80px] shrink-0 ${cfg.color} truncate`}
                      >
                        {cfg.title}
                      </span>

                      <div className="flex-1 flex gap-1.5 min-w-0">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex-1 min-w-0 text-left bg-surface-2 border border-default rounded px-2 py-1 text-[10px] text-body hover:border-strong transition-colors truncate">
                              {format(
                                perPlatformDates[p] || new Date(),
                                "dd/MM (EEE)",
                                { locale: vi },
                              )}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0 bg-surface-1 border-default"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={perPlatformDates[p] || new Date()}
                              onSelect={(d) => {
                                if (d)
                                  setPerPlatformDates((prev) => ({
                                    ...prev,
                                    [p]: d,
                                  }));
                              }}
                              disabled={(date) => isBefore(date, new Date())}
                            />
                          </PopoverContent>
                        </Popover>

                        <input
                          type="time"
                          value={perPlatformTimes[p]}
                          onChange={(e) =>
                            setPerPlatformTimes((prev) => ({
                              ...prev,
                              [p]: e.target.value,
                            }))
                          }
                          className="w-28 shrink-0 bg-surface-2 border border-default rounded px-1.5 py-0.5 text-[10px] text-body outline-none focus:border-primary/40 [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                size="sm"
                disabled={isSubmitting}
                onClick={handleScheduleAll}
                className="w-full h-7 text-[10px] bg-gradient-to-r from-primary to-purple-500 text-white hover:from-primary/90 hover:to-purple-500/90"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Send className="w-3 h-3 mr-1" />
                )}
                {isSubmitting
                  ? "Đang lên lịch..."
                  : `Lên lịch ${platformsWithContent.length} nền tảng`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MultiFormatEditorModule() {
  const generatedContent = useResearchStore((s) => s.generatedContent);
  const activeJob = useResearchStore((s) => s.activeJob);
  const setGeneratedContent = useResearchStore((s) => s.setGeneratedContent);

  const [editorMode, setEditorMode] = useState<EditorMode>("assets");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("blog");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );
  const [editorContent, setEditorContent] = useState<Record<Platform, string>>({
    facebook: platformConfigs.facebook.defaultContent,
    linkedin: platformConfigs.linkedin.defaultContent,
    blog: platformConfigs.blog.defaultContent,
  });
  const [aiMeta, setAiMeta] = useState<
    Record<string, { model: string; tokens: number; time: string }>
  >({});

  // Track which generated content we've already applied
  const appliedRef = useRef<Record<string, string>>({});

  // Watch for new AI-generated content from the store
  useEffect(() => {
    for (const [platform, entry] of Object.entries(generatedContent)) {
      const key = `${platform}_${entry.generatedAt}`;
      if (
        appliedRef.current[platform] !== key &&
        (platform as Platform) in platformConfigs
      ) {
        appliedRef.current[platform] = key;
        setEditorContent((prev) => ({
          ...prev,
          [platform as Platform]: entry.html,
        }));
        setSelectedPlatform(platform as Platform);
        setEditorMode("assets");
        setAiMeta((prev) => ({
          ...prev,
          [platform]: {
            model: entry.modelUsed,
            tokens: entry.tokenUsage.total,
            time: new Date(entry.generatedAt).toLocaleTimeString("vi-VN"),
          },
        }));
      }
    }
  }, [generatedContent]);

  const masterOutline = useResearchStore((s) => s.masterOutline);
  const setMasterOutline = useResearchStore((s) => s.setMasterOutline);
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  // Sync with store
  useEffect(() => {
    if (masterOutline && masterOutline.length > 0) {
      setOutline(masterOutline);
    } else {
      setOutline(mockOutline);
    }
  }, [masterOutline]);

  const handleUpdateOutline = (
    id: string,
    text: string,
    isChild = false,
    parentId?: string,
  ) => {
    const newOutline = outline.map((section) => {
      if (!isChild && section.id === id) {
        return { ...section, text };
      }
      if (isChild && section.id === parentId) {
        return {
          ...section,
          children: section.children.map((child) =>
            child.id === id ? { ...child, text } : child,
          ),
        };
      }
      return section;
    });
    setOutline(newOutline);
    setMasterOutline(newOutline); // Sync to store
  };

  const handleDeleteSection = (sectionId: string) => {
    const newOutline = outline.filter((section) => section.id !== sectionId);
    // Re-index IDs is not needed since IDs are stable strings
    setOutline(newOutline);
    setMasterOutline(newOutline);
  };

  const handleDeleteChild = (parentId: string, childId: string) => {
    const newOutline = outline.map((section) => {
      if (section.id === parentId) {
        return {
          ...section,
          children: section.children.filter((child) => child.id !== childId),
        };
      }
      return section;
    });
    setOutline(newOutline);
    setMasterOutline(newOutline);
  };

  const ALL_PLATFORMS: Platform[] = ["facebook", "linkedin", "blog"];
  const [rewritingAllPlatforms, setRewritingAllPlatforms] = useState(false);
  const [rewritingPlatformIdx, setRewritingPlatformIdx] = useState(-1);

  // Platform-specific optimization for rewrite
  const getRewriteContentLength = (platform: Platform): string => {
    switch (platform) {
      case "facebook":
        return "short";
      case "linkedin":
        return "medium";
      case "blog":
        return "long";
    }
  };

  const getRewriteInstructions = (platform: Platform): string => {
    const hints: Record<Platform, string> = {
      facebook:
        "Optimize for Facebook: Hook in first 2 lines, strategic emojis, very short paragraphs, CTA at end, 3-5 hashtags. Mobile-first format.",
      linkedin:
        "Optimize for LinkedIn: Bold insight/stat opener, professional conversational tone, line breaks between paragraphs, data-driven, end with engaging question.",
      blog: "Optimize for Blog/SEO: Proper H1/H2/H3 hierarchy, introduction & conclusion, bullet points for takeaways, blockquotes for emphasis, SEO-friendly headings.",
    };
    return hints[platform];
  };

  const handleAIRewrite = async () => {
    if (!activeJob?.knowledge_source?.content_text) {
      gooeyToast.error("No context source data available to rewrite.");
      return;
    }

    setIsRegenerating(true);
    try {
      // Stringify the structured outline for the backend
      const outlineStr = JSON.stringify(
        outline.map((s) => ({
          section: s.text,
          points: s.children.map((c) => c.text),
        })),
      );

      const result = await researchApi.generateContent({
        team_id: activeJob.job.team_id,
        knowledge_source_id: activeJob.knowledge_source.id,
        knowledge_text: activeJob.knowledge_source.content_text,
        platform: selectedPlatform,
        outline: outlineStr, // Pass the edited outline
        target_audience:
          "Ng\u01b0\u1eddi quan t\u00e2m \u0111\u1ebfn c\u00f4ng ngh\u1ec7 v\u00e0 marketing",
        content_length: getRewriteContentLength(selectedPlatform),
        additional_instructions: getRewriteInstructions(selectedPlatform),
        tone: "professional",
        language: "vi",
      });

      setGeneratedContent(selectedPlatform, {
        platform: selectedPlatform,
        html: result.content_html,
        modelUsed: result.model_used,
        tokenUsage: result.token_usage,
        generatedAt: new Date().toISOString(),
      });

      gooeyToast.success(
        `Updated ${selectedPlatform} content based on your new outline!`,
      );
      setEditorMode("assets");
    } catch (error: any) {
      gooeyToast.error(error?.message || "Rewrite failed");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAIRewriteAll = async () => {
    if (!activeJob?.knowledge_source?.content_text) {
      gooeyToast.error("No context source data available to rewrite.");
      return;
    }

    setRewritingAllPlatforms(true);
    let successCount = 0;

    try {
      const outlineStr = JSON.stringify(
        outline.map((s) => ({
          section: s.text,
          points: s.children.map((c) => c.text),
        })),
      );

      for (let i = 0; i < ALL_PLATFORMS.length; i++) {
        const platform = ALL_PLATFORMS[i];
        setRewritingPlatformIdx(i);

        try {
          const result = await researchApi.generateContent({
            team_id: activeJob.job.team_id,
            knowledge_source_id: activeJob.knowledge_source.id,
            knowledge_text: activeJob.knowledge_source.content_text,
            platform,
            outline: outlineStr,
            target_audience:
              "Ng\u01b0\u1eddi quan t\u00e2m \u0111\u1ebfn c\u00f4ng ngh\u1ec7 v\u00e0 marketing",
            content_length: getRewriteContentLength(platform),
            additional_instructions: getRewriteInstructions(platform),
            tone: "professional",
            language: "vi",
          });

          setGeneratedContent(platform, {
            platform,
            html: result.content_html,
            modelUsed: result.model_used,
            tokenUsage: result.token_usage,
            generatedAt: new Date().toISOString(),
          });
          successCount++;
        } catch (error: any) {
          console.error(`Rewrite failed for ${platform}:`, error);
        }
      }

      if (successCount > 0) {
        gooeyToast.success(
          `\u2705 Rewrote ${successCount}/${ALL_PLATFORMS.length} platforms!`,
        );
        setEditorMode("assets");
      } else {
        gooeyToast.error("All platform rewrites failed.");
      }
    } finally {
      setRewritingAllPlatforms(false);
      setRewritingPlatformIdx(-1);
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const currentConfig = platformConfigs[selectedPlatform];

  const wordCount = useMemo(() => {
    const text = editorContent[selectedPlatform]
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text ? text.split(" ").length : 0;
  }, [editorContent, selectedPlatform]);

  return (
    <div className="flex flex-col h-full">
      {/* Module Header */}
      <div className="px-4 py-2 border-b border-default bg-surface-1/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold text-heading/80 uppercase tracking-wider">
              Editor
            </h3>
            {/* Mode Toggle */}
            <div className="flex bg-surface-hover rounded-md p-0.5">
              <button
                onClick={() => setEditorMode("outline")}
                className={`flex items-center gap-1 px-2 py-1 rounded-[5px] text-[10px] font-medium transition-all ${
                  editorMode === "outline"
                    ? "bg-primary/20 text-primary"
                    : "text-dim hover:text-body"
                }`}
              >
                <LayoutList className="w-3 h-3" />
                Outline
              </button>
              <button
                onClick={() => setEditorMode("assets")}
                className={`flex items-center gap-1 px-2 py-1 rounded-[5px] text-[10px] font-medium transition-all ${
                  editorMode === "assets"
                    ? "bg-primary/20 text-primary"
                    : "text-dim hover:text-body"
                }`}
              >
                <AlignLeft className="w-3 h-3" />
                Assets
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {editorMode === "assets" && (
              <span className="text-[10px] text-faint mr-2 !text-white">
                {wordCount} words
              </span>
            )}
            <Button
              size="sm"
              disabled={isRegenerating || rewritingAllPlatforms}
              onClick={handleAIRewrite}
              className="h-6 px-2.5 text-[10px] bg-primary/15 hover:bg-primary/25 text-primary border-0"
            >
              {isRegenerating ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 mr-1" />
              )}
              AI Rewrite
            </Button>
            <Button
              size="sm"
              disabled={isRegenerating || rewritingAllPlatforms}
              onClick={handleAIRewriteAll}
              className="h-6 px-2.5 text-[10px] bg-gradient-to-r from-primary/15 to-purple-500/15 hover:from-primary/25 hover:to-purple-500/25 text-primary border-0"
            >
              {rewritingAllPlatforms ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />{" "}
                  {rewritingPlatformIdx >= 0
                    ? `${ALL_PLATFORMS[rewritingPlatformIdx]} (${rewritingPlatformIdx + 1}/3)`
                    : "..."}
                </>
              ) : (
                <>
                  <Send className="w-3 h-3 mr-1" /> Rewrite All
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-6 px-2.5 text-[10px] ${
                showPreview
                  ? "bg-surface-active text-heading"
                  : "text-label hover:text-heading"
              }`}
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <ResizablePanelGroup direction="horizontal">
          {/* Editor Panel */}
          <ResizablePanel
            defaultSize="65%"
            minSize="40%"
            className={`flex flex-col min-w-0 ${
              showPreview ? "border-r border-default" : ""
            }`}
          >
            {editorMode === "outline" ? (
              /* Master Outline View */
              <div className="flex-1 overflow-y-auto scrollbar-custom">
                <div className="p-4 space-y-0.5">
                  {outline.map((section, idx) => {
                    const isCollapsed = collapsedSections.has(section.id);
                    return (
                      <div key={section.id} className="group">
                        <div className="flex items-start gap-1.5 py-2 px-2 rounded-lg hover:bg-surface-hover transition-colors">
                          <button
                            className="mt-1 shrink-0 text-faint hover:text-body"
                            onClick={() => toggleCollapse(section.id)}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <GripVertical className="w-3 h-3 mt-1.5 shrink-0 text-ghost opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                          <span className="text-[10px] text-primary/60 font-mono mt-1.5 shrink-0 w-4">
                            {idx + 1}.
                          </span>
                          <input
                            value={section.text}
                            onChange={(e) =>
                              handleUpdateOutline(section.id, e.target.value)
                            }
                            className="flex-1 bg-transparent text-[13px] text-heading font-medium leading-relaxed outline-none focus:bg-surface-active rounded px-1 -ml-1 border-none focus:ring-0"
                            placeholder="Heading title..."
                          />
                          <button
                            onClick={() => handleDeleteSection(section.id)}
                            className="mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-ghost hover:text-red-400"
                            title="Xóa section này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {!isCollapsed &&
                          section.children.map((child, cIdx) => (
                            <div
                              key={child.id}
                              className="flex items-start gap-1.5 py-1.5 px-2 pl-12 rounded-lg hover:bg-surface-hover transition-colors group/child"
                            >
                              <GripVertical className="w-3 h-3 mt-1 shrink-0 text-ghost opacity-0 group-hover/child:opacity-100 transition-opacity cursor-grab" />
                              <span className="text-[10px] text-faint font-mono mt-1 shrink-0">
                                {idx + 1}.{cIdx + 1}
                              </span>
                              <textarea
                                value={child.text}
                                rows={1}
                                onChange={(e) =>
                                  handleUpdateOutline(
                                    child.id,
                                    e.target.value,
                                    true,
                                    section.id,
                                  )
                                }
                                onInput={(e) => {
                                  const target =
                                    e.target as HTMLTextAreaElement;
                                  target.style.height = "auto";
                                  target.style.height =
                                    target.scrollHeight + "px";
                                }}
                                className="flex-1 bg-transparent text-xs text-label leading-relaxed outline-none focus:bg-surface-active rounded px-1 -ml-1 border-none focus:ring-0 resize-none overflow-hidden"
                                placeholder="Detail point..."
                              />
                              <button
                                onClick={() =>
                                  handleDeleteChild(section.id, child.id)
                                }
                                className="mt-0.5 shrink-0 opacity-0 group-hover/child:opacity-100 transition-opacity text-ghost hover:text-red-400"
                                title="Xóa detail point này"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Individual Assets View with TipTap Editor */
              <div className="flex flex-col flex-1 min-h-0">
                {/* Platform Tabs */}
                <div className="flex items-center gap-1 px-3 py-1.5 border-b border-default bg-surface-1/30 shrink-0">
                  {(Object.keys(platformConfigs) as Platform[]).map((p) => {
                    const cfg = platformConfigs[p];
                    const PIcon = cfg.icon;
                    return (
                      <button
                        key={p}
                        onClick={() => setSelectedPlatform(p)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                          selectedPlatform === p
                            ? "bg-primary/15 text-primary shadow-sm"
                            : "text-dim hover:text-body hover:bg-surface-hover"
                        }`}
                      >
                        <PIcon
                          className={`w-3.5 h-3.5 ${selectedPlatform === p ? cfg.color : ""}`}
                        />
                        {cfg.title}
                      </button>
                    );
                  })}
                </div>

                {/* AI Generation Banner */}
                {aiMeta[selectedPlatform] && (
                  <div className="shrink-0 px-3 py-1.5 bg-[#6FCF97]/[0.07] border-b border-[#6FCF97]/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-[#6FCF97]">
                      <Sparkles className="w-3 h-3" />
                      <span>
                        AI Generated — {aiMeta[selectedPlatform].model}
                      </span>
                      <span className="text-[#6FCF97]/60">|</span>
                      <span>
                        {aiMeta[selectedPlatform].tokens.toLocaleString()}{" "}
                        tokens
                      </span>
                      <span className="text-[#6FCF97]/60">|</span>
                      <span>{aiMeta[selectedPlatform].time}</span>
                    </div>
                    <button
                      onClick={() =>
                        setAiMeta((prev) => {
                          const next = { ...prev };
                          delete next[selectedPlatform];
                          return next;
                        })
                      }
                      className="text-[9px] text-[#6FCF97]/60 hover:text-[#6FCF97] transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* TipTap Editor */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <TipTapEditor
                    key={`${selectedPlatform}_${appliedRef.current[selectedPlatform] || "default"}`}
                    content={editorContent[selectedPlatform]}
                    onChange={(html) =>
                      setEditorContent((prev) => ({
                        ...prev,
                        [selectedPlatform]: html,
                      }))
                    }
                    placeholder={currentConfig.placeholder}
                    className="scrollbar-custom"
                  />
                </div>

                {/* ═══ Schedule Action Bar ═══ */}
                <ScheduleActionBar
                  selectedPlatform={selectedPlatform}
                  editorContent={editorContent}
                  platformConfigs={platformConfigs}
                  generatedContent={generatedContent}
                />
              </div>
            )}
          </ResizablePanel>

          {showPreview && (
            <>
              <ResizableHandle
                withHandle
                className="bg-surface-hover w-px hover:bg-primary/30 transition-all"
              />
              <ResizablePanel
                defaultSize="35%"
                minSize="25%"
                maxSize="50%"
                className="min-w-0 flex flex-col bg-surface-1/30"
              >
                <div className="px-3 py-2 border-b border-default flex items-center justify-between shrink-0">
                  <span className="text-[10px] text-dim font-medium uppercase tracking-wider">
                    Live Preview
                  </span>
                  <div className="flex bg-surface-hover rounded-md p-0.5">
                    <button
                      onClick={() => setPreviewDevice("desktop")}
                      className={`p-1 rounded-[4px] transition-colors ${
                        previewDevice === "desktop"
                          ? "bg-surface-active text-heading"
                          : "text-dim hover:text-body"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice("mobile")}
                      className={`p-1 rounded-[4px] transition-colors ${
                        previewDevice === "mobile"
                          ? "bg-surface-active text-heading"
                          : "text-dim hover:text-body"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-custom">
                  <div className="p-3">
                    <div
                      className={`mx-auto rounded-xl border border-strong overflow-hidden shadow-lg transition-all ${
                        previewDevice === "mobile" ? "max-w-[240px]" : "w-full"
                      }`}
                    >
                      {/* Platform Header Bar */}
                      <div className="bg-surface-hover px-3 py-2.5 border-b border-default flex items-center gap-2">
                        {(() => {
                          const PIcon = currentConfig.icon;
                          return (
                            <PIcon
                              className={`w-4 h-4 ${currentConfig.color}`}
                            />
                          );
                        })()}
                        <span className="text-[11px] text-body font-medium">
                          {currentConfig.title}
                        </span>
                        <Badge
                          variant="outline"
                          className="ml-auto text-[8px] px-1.5 py-0 h-4 border-default text-dim"
                        >
                          Draft
                        </Badge>
                      </div>

                      {/* Author Section */}
                      <div className="px-4 pt-3 pb-2 flex items-center gap-2.5 border-b border-subtle">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-primary font-semibold">
                            AF
                          </span>
                        </div>
                        <div>
                          <p className="text-[11px] text-heading font-medium">
                            AetherFlow
                          </p>
                          <p className="text-[9px] text-faint">
                            Just now · Draft Preview
                          </p>
                        </div>
                      </div>

                      {/* Featured Media (from Research Image) */}
                      {activeJob?.job?.source_image_url && (
                        <div className="px-4 pt-1 pb-3">
                          <div className="rounded-lg overflow-hidden border border-default aspect-video bg-surface-hover shadow-sm">
                            <img
                              src={activeJob.job.source_image_url}
                              alt="Reference asset"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          </div>
                          <p className="mt-1.5 text-[9px] text-primary/60 italic font-medium">
                            ✨ Featured asset from combined research
                          </p>
                        </div>
                      )}

                      {/* Content Preview - Rendered HTML */}
                      <div
                        className={`px-4 py-3 tiptap-editor-content ${
                          previewDevice === "mobile"
                            ? "text-[10px]"
                            : "text-[11px]"
                        }`}
                        style={{
                          padding: "12px 16px",
                          fontSize:
                            previewDevice === "mobile" ? "10px" : "11px",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: editorContent[selectedPlatform],
                        }}
                      />

                      {/* Engagement Mockup */}
                      <div className="px-4 py-2.5 border-t border-default flex items-center justify-between text-[9px] text-faint">
                        <span>👍 Like</span>
                        <span>💬 Comment</span>
                        <span>🔄 Share</span>
                        <span>📤 Send</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
