"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Bot,
  KeyRound,
  Globe,
  Save,
  Loader2,
  Check,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  Sparkles,
  CircleDot,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const DEFAULT_TEAM_ID = "123e4567-e89b-12d3-a456-426614174000";
const TEAM_ID_KEY = "research-team-id";

/* ================================================================
   TYPE DEFINITIONS
   ================================================================ */
interface APIConfig {
  provider_name: string;
  model_name: string;
  api_key: string;
  masked_key: string;
  base_url: string;
  is_default: boolean;
}

interface ModelOption {
  value: string;
  label: string;
  description: string;
  tier: "free" | "standard" | "premium";
}

interface ProviderMeta {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  keyPlaceholder: string;
  defaultBaseURL: string;
  docsUrl: string;
  models: ModelOption[];
  defaultModel: string;
}

/* ================================================================
   PROVIDER REGISTRY — Nguồn sống duy nhất cho toàn hệ thống
   ================================================================ */
const PROVIDERS: ProviderMeta[] = [
  {
    id: "openai",
    label: "OpenAI",
    icon: "🤖",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    glowColor: "shadow-emerald-500/10",
    keyPlaceholder: "sk-proj-...",
    defaultBaseURL: "https://api.openai.com/v1",
    docsUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o",
    models: [
      { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Nhanh, tiết kiệm", tier: "free" },
      { value: "gpt-4o", label: "GPT-4o", description: "Đa năng, cân bằng", tier: "standard" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Mạnh mẽ, phức tạp", tier: "premium" },
    ],
  },
  {
    id: "gemini",
    label: "Google Gemini",
    icon: "💎",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    glowColor: "shadow-sky-500/10",
    keyPlaceholder: "AIza...",
    defaultBaseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    docsUrl: "https://aistudio.google.com/apikey",
    defaultModel: "gemini-2.5-flash",
    models: [
      { value: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash-Lite", description: "Tốc độ cao nhất — 15 RPM (Preview)", tier: "free" },
      { value: "gemini-3-flash-preview", label: "Gemini 3 Flash", description: "Cân bằng tốc độ & thông minh — 10 RPM (Preview)", tier: "standard" },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Ổn định, hiệu suất cao — 10 RPM", tier: "standard" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Xử lý sáng tạo phức tạp — 5 RPM", tier: "premium" },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    icon: "🧠",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    glowColor: "shadow-amber-500/10",
    keyPlaceholder: "sk-ant-...",
    defaultBaseURL: "https://api.anthropic.com/v1",
    docsUrl: "https://console.anthropic.com/account/keys",
    defaultModel: "claude-3-5-sonnet",
    models: [
      { value: "claude-3-haiku", label: "Claude 3 Haiku", description: "Nhanh gọn, tiết kiệm", tier: "free" },
      { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", description: "Cân bằng & thông minh", tier: "standard" },
      { value: "claude-3-opus", label: "Claude 3 Opus", description: "Mạnh mẽ nhất", tier: "premium" },
    ],
  },
];

const tierIcons: Record<string, typeof Zap> = {
  free: Zap,
  standard: Sparkles,
  premium: Crown,
};
const tierColors: Record<string, string> = {
  free: "text-emerald-500",
  standard: "text-sky-500",
  premium: "text-amber-500",
};

/* ================================================================
   COMPONENT
   ================================================================ */
interface AIProviderSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIProviderSettings({ open, onOpenChange }: AIProviderSettingsProps) {
  const [providers, setProviders] = useState<APIConfig[]>(
    PROVIDERS.map((p) => ({
      provider_name: p.id,
      model_name: p.defaultModel,
      api_key: "",
      masked_key: "",
      base_url: "",
      is_default: p.id === "openai",
    }))
  );
  const [activeProvider, setActiveProvider] = useState("openai");
  const [isLoading, setIsLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { user } = useAuthStore();

  const currentConfig = providers.find((p) => p.provider_name === activeProvider)!;
  const providerMeta = PROVIDERS.find((p) => p.id === activeProvider)!;

  const resolveTeamId = useCallback(() => {
    if (user?.team_id?.trim()) return user.team_id.trim();
    if (typeof window !== "undefined") {
      const localTeamId = window.localStorage.getItem(TEAM_ID_KEY)?.trim();
      if (localTeamId) return localTeamId;
    }
    return DEFAULT_TEAM_ID;
  }, [user?.team_id]);

  // Load saved configs from server when dialog opens
  useEffect(() => {
    if (!open) return;
    const teamId = resolveTeamId();
    axios
      .get(`http://localhost:8080/api/v1/teams/${teamId}/ai-providers`)
      .then((res) => {
        const saved = res.data?.data;
        if (Array.isArray(saved) && saved.length > 0) {
          setProviders((prev) =>
            prev.map((p) => {
              const match = saved.find((s: any) => s.provider_name === p.provider_name);
              if (match) {
                return {
                  ...p,
                  model_name: match.model_name || p.model_name,
                  api_key: "", // Never pre-fill with real key (server never sends it)
                  masked_key: match.masked_key || "",
                  base_url: match.base_url || "",
                  is_default: match.is_default ?? p.is_default,
                };
              }
              return p;
            })
          );
        }
      })
      .catch(() => {
        // Silent fail — user hasn't saved any config yet
      });
  }, [open, resolveTeamId]);

  const updateConfig = (key: keyof APIConfig, value: string | boolean) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.provider_name === activeProvider ? { ...p, [key]: value } : p
      )
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSaveSuccess(false);
    try {
      const teamId = resolveTeamId();
      // Only send configs where user has typed a new api_key, preserving server-side keys
      const payload = providers.map((p) => ({
        provider_name: p.provider_name,
        model_name: p.model_name,
        api_key: p.api_key, // Empty string = backend will skip updating the key
        base_url: p.base_url,
        is_default: p.is_default,
      }));
      await axios.post(
        `http://localhost:8080/api/v1/teams/${teamId}/ai-providers`,
        { configs: payload }
      );
      setSaveSuccess(true);
      gooeyToast.success("AI Configuration Saved Successfully!");
      setTimeout(() => {
        setSaveSuccess(false);
        onOpenChange(false);
      }, 800);
    } catch (error) {
      console.error(error);
      gooeyToast.error("Failed to save configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  const setAsDefault = () => {
    setProviders((prev) =>
      prev.map((p) => ({
        ...p,
        is_default: p.provider_name === activeProvider,
      }))
    );
  };

  const isConnected = (providerName: string) => {
    const cfg = providers.find((p) => p.provider_name === providerName);
    // Connected if user typed a new key OR server returned a masked key (meaning key exists in DB)
    return cfg && (cfg.api_key.length > 5 || cfg.masked_key.length > 0);
  };

  const defaultProviderName = providers.find((p) => p.is_default)?.provider_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[80vh] flex flex-col bg-backdrop/95 border-default/40 backdrop-blur-xl p-0 overflow-hidden shadow-2xl rounded-xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-default/20 bg-gradient-to-r from-surface-1/80 to-surface-base shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-default text-base font-semibold">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            AI Engine Configuration
          </DialogTitle>
          <p className="text-xs text-dim mt-1.5 leading-relaxed">
            Kết nối API key của bạn để kích hoạt engine phân tích và sáng tạo nội dung.
            Hệ thống sẽ sử dụng <b className="text-default">Default Engine</b> cho mọi tác vụ tự động.
          </p>
        </DialogHeader>

        {/* Provider Tabs — with connection status */}
        <div className="flex px-4 py-3 border-b border-default/10 gap-2 bg-surface-base shrink-0">
          {PROVIDERS.map((p) => {
            const connected = isConnected(p.id);
            const isDefault = defaultProviderName === p.id;
            const isActive = activeProvider === p.id;

            return (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProvider(p.id);
                  setShowKey(false);
                }}
                className={`relative flex-1 px-3 py-2 rounded-lg text-[12px] font-medium transition-all flex flex-col items-center gap-1 ${
                  isActive
                    ? `${p.bgColor} ${p.color} ring-1 ${p.borderColor}`
                    : "hover:bg-surface-1 text-dim"
                }`}
              >
                <span className="text-base">{p.icon}</span>
                <span>{p.label}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {connected ? (
                    <span className="flex items-center gap-0.5 text-[9px] text-emerald-500">
                      <CircleDot className="w-2.5 h-2.5" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[9px] text-faint">
                      <AlertTriangle className="w-2.5 h-2.5" /> No Key
                    </span>
                  )}
                  {isDefault && (
                    <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded font-bold">
                      DEFAULT
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Config Form */}
        <div className="p-5 space-y-4 bg-surface-base flex-1 overflow-y-auto">
          {/* API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-dim uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Secret API Key
              </label>
              <a
                href={providerMeta.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Get API Key →
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                placeholder={
                  currentConfig.masked_key
                    ? `Saved: ${currentConfig.masked_key}`
                    : providerMeta.keyPlaceholder
                }
                value={currentConfig.api_key}
                onChange={(e) => updateConfig("api_key", e.target.value)}
                className="w-full bg-surface-1/50 border border-default/30 rounded-md px-3 py-2.5 pr-10 text-sm text-default placeholder:text-faint focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-default transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {currentConfig.masked_key && !currentConfig.api_key && (
              <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Key saved securely — leave blank to keep current key
              </p>
            )}
            {currentConfig.api_key.length > 5 && (
              <p className="text-[10px] text-amber-500 flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> New key entered — will replace existing key on save
              </p>
            )}
          </div>

          {/* Model Selection — Card-style */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-dim uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              Model Selection
            </label>
            <div className="grid gap-1.5">
              {providerMeta.models.map((m) => {
                const TierIcon = tierIcons[m.tier];
                const isSelected = currentConfig.model_name === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => updateConfig("model_name", m.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? `${providerMeta.bgColor} ${providerMeta.borderColor} ring-1 ${providerMeta.borderColor}`
                        : "border-default/20 hover:border-default/40 hover:bg-surface-1/30"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isSelected ? providerMeta.bgColor : "bg-surface-1/50"
                    }`}>
                      {isSelected ? (
                        <Check className={`w-3 h-3 ${providerMeta.color}`} />
                      ) : (
                        <CircleDot className="w-3 h-3 text-faint" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${isSelected ? "text-default" : "text-body"}`}>
                        {m.label}
                      </p>
                      <p className="text-[10px] text-dim">{m.description}</p>
                    </div>
                    <TierIcon className={`w-3.5 h-3.5 shrink-0 ${tierColors[m.tier]}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Base URL — Advanced */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-dim uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Endpoint URL
              <span className="text-[9px] text-faint font-normal normal-case">(auto-configured)</span>
            </label>
            <input
              type="text"
              placeholder={providerMeta.defaultBaseURL}
              value={currentConfig.base_url}
              onChange={(e) => updateConfig("base_url", e.target.value)}
              className="w-full bg-surface-1/50 border border-default/30 rounded-md px-3 py-2 text-sm text-default placeholder:text-faint/50 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono text-[11px]"
            />
            <p className="text-[10px] text-faint">
              Để trống sẽ sử dụng endpoint mặc định của {providerMeta.label}. Chỉ thay đổi nếu dùng proxy hoặc self-hosted.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-default/15 sticky bottom-0 bg-surface-base p-1">
            {!currentConfig.is_default ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={setAsDefault}
                className="text-xs text-dim hover:text-emerald-500 h-8 gap-1.5"
                disabled={!isConnected(activeProvider)}
              >
                <CircleDot className="w-3.5 h-3.5" />
                Set as Default Engine
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium px-2">
                <Check className="w-4 h-4" /> Default Engine
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={isLoading || saveSuccess}
              className={`h-9 text-xs font-semibold px-6 transition-all ${
                saveSuccess
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Saved!
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
