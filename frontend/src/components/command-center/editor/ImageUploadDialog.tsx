'use client';

import { useState, useRef, useCallback } from 'react';
import { ImagePlus, Link2, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (src: string, alt?: string) => void;
}

type Tab = 'url' | 'upload';

export default function ImageUploadDialog({
  open,
  onClose,
  onInsert,
}: ImageUploadDialogProps) {
  const [tab, setTab] = useState<Tab>('upload');
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setUrl('');
    setAlt('');
    setPreview(null);
    setIsDragging(false);
    setIsLoading(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      setUrl(result);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInsert = () => {
    if (!url.trim()) return;
    onInsert(url, alt);
    reset();
  };

  const handleUrlPreview = () => {
    if (url.trim()) {
      setPreview(url);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative w-[480px] bg-[#12121a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Insert Image</h3>
          </div>
          <button
            onClick={handleClose}
            className="h-6 w-6 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06]">
          <button
            onClick={() => { setTab('upload'); setPreview(null); setUrl(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              tab === 'upload'
                ? 'text-indigo-300 border-b-2 border-indigo-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
          <button
            onClick={() => { setTab('url'); setPreview(null); setUrl(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              tab === 'url'
                ? 'text-indigo-300 border-b-2 border-indigo-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Image URL
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {tab === 'upload' && (
            <>
              {/* Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-indigo-500/50 bg-indigo-500/[0.05]'
                    : 'border-white/[0.1] hover:border-white/[0.2] bg-white/[0.02]'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                {isLoading ? (
                  <Loader2 className="w-8 h-8 text-indigo-400 mx-auto animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                    <p className="text-xs text-slate-300 mb-1">
                      Drop image here or click to browse
                    </p>
                    <p className="text-[10px] text-slate-600">
                      PNG, JPG, GIF, WebP up to 10MB
                    </p>
                  </>
                )}
              </div>
            </>
          )}

          {tab === 'url' && (
            <>
              {/* URL Input */}
              <div>
                <label className="text-[11px] text-slate-400 font-medium mb-1.5 block">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-indigo-500/40 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlPreview()}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-auto text-[10px] px-3 border-white/[0.08] hover:bg-white/[0.06] text-slate-300"
                    onClick={handleUrlPreview}
                    disabled={!url.trim()}
                  >
                    Preview
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Alt Text (always visible) */}
          <div>
            <label className="text-[11px] text-slate-400 font-medium mb-1.5 block">
              Alt Text <span className="text-slate-600">(optional)</span>
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image for accessibility"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-indigo-500/40 transition-colors"
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="rounded-lg border border-white/[0.08] overflow-hidden bg-white/[0.02]">
              <div className="px-3 py-1.5 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">Preview</span>
                <button
                  onClick={() => { setPreview(null); if (tab === 'upload') setUrl(''); }}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 flex items-center justify-center bg-[#0a0a0f]/50">
                <img
                  src={preview}
                  alt={alt || 'Preview'}
                  className="max-h-[200px] max-w-full object-contain rounded"
                  onError={() => {
                    setPreview(null);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.01]">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-400 hover:text-slate-200"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white"
            onClick={handleInsert}
            disabled={!url.trim()}
          >
            <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
            Insert Image
          </Button>
        </div>
      </div>
    </div>
  );
}
