"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    color: "text-blue-400",
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
    color: "text-sky-400",
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
    icon: FileText,
    color: "text-emerald-400",
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

export default function MultiFormatEditorModule() {
  const [editorMode, setEditorMode] = useState<EditorMode>("assets");
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
              className="h-6 px-2.5 text-[10px] bg-primary/15 hover:bg-primary/25 text-primary border-0"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              AI Rewrite
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
                  {mockOutline.map((section, idx) => {
                    const isCollapsed = collapsedSections.has(section.id);
                    return (
                      <div key={section.id} className="group">
                        <div
                          className="flex items-start gap-1.5 py-2 px-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
                          onClick={() => toggleCollapse(section.id)}
                        >
                          <button className="mt-0.5 shrink-0 text-faint hover:text-body">
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <GripVertical className="w-3 h-3 mt-0.5 shrink-0 text-ghost opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                          <span className="text-[10px] text-primary/60 font-mono mt-0.5 shrink-0 w-4">
                            {idx + 1}.
                          </span>
                          <p className="text-[13px] text-heading font-medium leading-relaxed">
                            {section.text}
                          </p>
                        </div>
                        {!isCollapsed &&
                          section.children.map((child, cIdx) => (
                            <div
                              key={child.id}
                              className="flex items-start gap-1.5 py-1.5 px-2 pl-12 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer group/child"
                            >
                              <GripVertical className="w-3 h-3 mt-0.5 shrink-0 text-ghost opacity-0 group-hover/child:opacity-100 transition-opacity cursor-grab" />
                              <span className="text-[10px] text-faint font-mono mt-0.5 shrink-0">
                                {idx + 1}.{cIdx + 1}
                              </span>
                              <p className="text-xs text-label leading-relaxed">
                                {child.text}
                              </p>
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

                {/* TipTap Editor */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <TipTapEditor
                    key={selectedPlatform}
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
                            <PIcon className={`w-4 h-4 ${currentConfig.color}`} />
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

                      {/* Content Preview - Rendered HTML */}
                      <div
                        className={`px-4 py-3 tiptap-editor-content ${
                          previewDevice === "mobile" ? "text-[10px]" : "text-[11px]"
                        }`}
                        style={{
                          padding: "12px 16px",
                          fontSize: previewDevice === "mobile" ? "10px" : "11px",
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
