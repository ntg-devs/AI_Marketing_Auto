'use client';

import { useState } from 'react';
import {
  AlignLeft,
  LayoutList,
  Sparkles,
  Eye,
  Monitor,
  Smartphone,
  Facebook,
  Linkedin,
  FileText,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code,
  Undo2,
  Redo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

type EditorMode = 'outline' | 'assets';
type PreviewDevice = 'desktop' | 'mobile';
type Platform = 'facebook' | 'linkedin' | 'blog';

const mockOutline = [
  {
    id: '1',
    level: 1,
    text: 'Introduction: The Challenge of Modern Marketing',
    children: [
      { id: '1a', level: 2, text: 'Why traditional methods are failing' },
      { id: '1b', level: 2, text: 'The AI-powered alternative' },
    ],
  },
  {
    id: '2',
    level: 1,
    text: 'Core Problem: Content Production Bottleneck',
    children: [
      { id: '2a', level: 2, text: 'Data: 73% of marketers struggle with scale' },
      { id: '2b', level: 2, text: 'Case study: From 4 posts/week to 20' },
    ],
  },
  {
    id: '3',
    level: 1,
    text: 'Solution Framework: Automated Content Pipeline',
    children: [
      { id: '3a', level: 2, text: 'Step 1: Smart research aggregation' },
      { id: '3b', level: 2, text: 'Step 2: AI-assisted content generation' },
      { id: '3c', level: 2, text: 'Step 3: Multi-platform distribution' },
    ],
  },
  {
    id: '4',
    level: 1,
    text: 'Results & ROI Projection',
    children: [
      { id: '4a', level: 2, text: 'Expected improvement metrics' },
    ],
  },
];

const platformContent: Record<Platform, { title: string; content: string; icon: typeof Facebook }> = {
  facebook: {
    title: 'Facebook Post',
    content:
      '🚀 Tired of spending 8+ hours creating content every week?\n\nWe discovered that AI-powered content pipelines can cut production time by 73% while INCREASING engagement.\n\nHere\'s what we learned from analyzing 500+ SaaS campaigns:\n\n→ Smart research saves 3 hrs/week\n→ AI drafts reduce editing time by 60%\n→ Auto-scheduling at peak hours = +45% reach\n\nFull breakdown in our latest blog 👇\n\n#MarketingAutomation #AIContent #SaaS',
    icon: Facebook,
  },
  linkedin: {
    title: 'LinkedIn Article',
    content:
      'The marketing automation landscape has shifted dramatically in 2026.\n\nI\'ve been working with AI-powered content pipelines for the past 6 months, and the results have been remarkable:\n\n• 73% reduction in content production time\n• 45% increase in organic reach\n• 2.3x improvement in engagement rates\n\nThe key insight? It\'s not about replacing human creativity — it\'s about amplifying it.\n\nHere\'s our framework for building an automated content pipeline that actually works...',
    icon: Linkedin,
  },
  blog: {
    title: 'Blog Post',
    content:
      '# The Complete Guide to AI-Powered Content Automation\n\nMarketing teams are under more pressure than ever. The demand for fresh, relevant content across multiple platforms has reached an all-time high, yet most teams still rely on manual processes that simply can\'t scale.\n\nIn this guide, we\'ll explore how AI-powered content automation is transforming the way modern marketing teams operate...\n\n## The Problem: Content Production at Scale\n\nAccording to our research, 73% of marketers report struggling to maintain consistent content output across all their channels...',
    icon: FileText,
  },
};

export function MultiFormatEditorModule() {
  const [editorMode, setEditorMode] = useState<EditorMode>('outline');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('facebook');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [showPreview, setShowPreview] = useState(false);

  const toolbarButtons = [
    { icon: Bold, label: 'Bold' },
    { icon: Italic, label: 'Italic' },
    { icon: Heading1, label: 'H1' },
    { icon: Heading2, label: 'H2' },
    { icon: List, label: 'Bullet List' },
    { icon: ListOrdered, label: 'Ordered List' },
    { icon: Quote, label: 'Quote' },
    { icon: Code, label: 'Code' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Module Header + Toolbar */}
      <div className="px-4 py-2.5 border-b border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
              Editor
            </h3>
            {/* Mode Toggle */}
            <div className="flex bg-white/[0.03] rounded-md p-0.5">
              <button
                onClick={() => setEditorMode('outline')}
                className={`flex items-center gap-1 px-2 py-1 rounded-[5px] text-[10px] font-medium transition-all ${
                  editorMode === 'outline'
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <LayoutList className="w-3 h-3" />
                Outline
              </button>
              <button
                onClick={() => setEditorMode('assets')}
                className={`flex items-center gap-1 px-2 py-1 rounded-[5px] text-[10px] font-medium transition-all ${
                  editorMode === 'assets'
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <AlignLeft className="w-3 h-3" />
                Assets
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              className="h-6 px-2.5 text-[10px] bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-0"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              AI Rewrite
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-6 px-2.5 text-[10px] ${
                showPreview
                  ? 'bg-white/[0.08] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </Button>
          </div>
        </div>

        {/* Toolbar (only in assets mode) */}
        {editorMode === 'assets' && (
          <div className="flex items-center gap-0.5 pb-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
            >
              <Undo2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
            >
              <Redo2 className="w-3 h-3" />
            </Button>
            <div className="w-px h-4 bg-white/[0.06] mx-1" />
            {toolbarButtons.map((btn) => (
              <Button
                key={btn.label}
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
                title={btn.label}
              >
                <btn.icon className="w-3 h-3" />
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className={`flex-1 flex flex-col ${showPreview ? 'border-r border-white/[0.06]' : ''}`}>
          {editorMode === 'outline' ? (
            /* Master Outline View */
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-1">
                {mockOutline.map((section, idx) => (
                  <div key={section.id} className="group">
                    <div className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-white/[0.03] transition-colors cursor-pointer">
                      <span className="text-[10px] text-slate-600 font-mono mt-0.5 shrink-0">
                        {idx + 1}.
                      </span>
                      <p className="text-xs text-slate-200 font-medium leading-relaxed">
                        {section.text}
                      </p>
                    </div>
                    {section.children.map((child, cIdx) => (
                      <div
                        key={child.id}
                        className="flex items-start gap-2 py-1 px-2 pl-8 rounded-md hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        <span className="text-[10px] text-slate-600 font-mono mt-0.5 shrink-0">
                          {idx + 1}.{cIdx + 1}
                        </span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {child.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            /* Individual Assets View */
            <div className="flex flex-col flex-1">
              {/* Platform Tabs */}
              <div className="flex gap-1 px-3 pt-2">
                {(Object.keys(platformContent) as Platform[]).map((p) => {
                  const PIcon = platformContent[p].icon;
                  return (
                    <button
                      key={p}
                      onClick={() => setSelectedPlatform(p)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                        selectedPlatform === p
                          ? 'bg-indigo-500/15 text-indigo-300'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                      }`}
                    >
                      <PIcon className="w-3 h-3" />
                      {platformContent[p].title}
                    </button>
                  );
                })}
              </div>

              {/* Editable Content */}
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <textarea
                    className="w-full h-full min-h-[280px] bg-transparent text-xs text-slate-300 leading-relaxed resize-none outline-none placeholder:text-slate-600"
                    defaultValue={platformContent[selectedPlatform].content}
                  />
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-[280px] flex flex-col bg-white/[0.01]">
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Preview
              </span>
              <div className="flex bg-white/[0.03] rounded-md p-0.5">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1 rounded-[4px] ${
                    previewDevice === 'desktop'
                      ? 'bg-white/[0.08] text-slate-200'
                      : 'text-slate-500'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1 rounded-[4px] ${
                    previewDevice === 'mobile'
                      ? 'bg-white/[0.08] text-slate-200'
                      : 'text-slate-500'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                </button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3">
                <div
                  className={`mx-auto rounded-lg border border-white/[0.08] bg-white/[0.03] overflow-hidden ${
                    previewDevice === 'mobile' ? 'max-w-[200px]' : 'w-full'
                  }`}
                >
                  {/* Mock Platform Header */}
                  <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
                    {(() => {
                      const PIcon = platformContent[selectedPlatform].icon;
                      return <PIcon className="w-3 h-3 text-slate-400" />;
                    })()}
                    <span className="text-[10px] text-slate-400 font-medium">
                      {platformContent[selectedPlatform].title}
                    </span>
                  </div>
                  {/* Content Preview */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20" />
                      <div>
                        <p className="text-[10px] text-slate-300 font-medium">
                          AetherFlow
                        </p>
                        <p className="text-[8px] text-slate-600">Just now</p>
                      </div>
                    </div>
                    <p
                      className={`text-slate-400 leading-relaxed whitespace-pre-wrap ${
                        previewDevice === 'mobile' ? 'text-[9px]' : 'text-[10px]'
                      }`}
                    >
                      {platformContent[selectedPlatform].content.slice(0, 300)}
                      ...
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
