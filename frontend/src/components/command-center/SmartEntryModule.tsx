'use client';

import { useState, useCallback } from 'react';
import {
  Link2,
  Search,
  Upload,
  X,
  Dna,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type InputMode = 'link' | 'keyword' | 'file';

interface ContextTag {
  id: string;
  label: string;
  type: 'topic' | 'audience' | 'tone' | 'platform';
}

const mockContextTags: ContextTag[] = [
  { id: '1', label: 'SaaS B2B', type: 'audience' },
  { id: '2', label: 'Pain: Churn Rate', type: 'topic' },
  { id: '3', label: 'Tone: Professional', type: 'tone' },
  { id: '4', label: 'SEO Focused', type: 'topic' },
];

const voiceProfiles = [
  'Default — Neutral Pro',
  'Thought Leader',
  'Casual Storyteller',
  'Data-Driven Analyst',
];

const tagColors: Record<ContextTag['type'], string> = {
  topic: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/20',
  audience: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
  tone: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/20',
  platform: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/20',
};

export default function SmartEntryModule() {
  const [inputMode, setInputMode] = useState<InputMode>('link');
  const [inputValue, setInputValue] = useState('');
  const [brandVoiceOn, setBrandVoiceOn] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contextTags, setContextTags] = useState<ContextTag[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(voiceProfiles[0]);

  const modes: { key: InputMode; icon: typeof Link2; label: string }[] = [
    { key: 'link', icon: Link2, label: 'Link' },
    { key: 'keyword', icon: Search, label: 'Keywords' },
    { key: 'file', icon: Upload, label: 'File' },
  ];

  const handleAnalyze = useCallback(() => {
    if (!inputValue.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setContextTags(mockContextTags);
      setIsAnalyzing(false);
    }, 1500);
  }, [inputValue]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setInputMode('file');
    setInputValue('document_uploaded.pdf');
  }, []);

  const removeTag = (id: string) => {
    setContextTags(contextTags.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Module Header */}
      <div className="px-4 py-3 border-b border-default">
        <h3 className="text-xs font-semibold text-heading/80 uppercase tracking-wider">
          Smart Entry
        </h3>
        <p className="text-[10px] text-dim mt-0.5">Input & Context</p>
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
                    ? 'bg-primary/20 text-primary'
                    : 'text-dim hover:text-body'
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
                ? 'border-primary/50 bg-primary/[0.05]'
                : 'border-default bg-surface-hover'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            {inputMode === 'file' ? (
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
                      onClick={() => setInputValue('')}
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
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder={
                    inputMode === 'link'
                      ? 'Paste URL to analyze...'
                      : 'Enter keywords, topics...'
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
                    'Analyze'
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
                  Analyzing context...
                </span>
              </div>
              <div className="mt-2 h-1 bg-surface-hover rounded-full overflow-hidden">
                <div className="h-full bg-primary/40 rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
