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
import { useAuthStore } from "@/store/useAuthStore";
import { aiProviderApi } from "@/api/aiProvider";

const DEFAULT_TEAM_ID = "123e4567-e89b-12d3-a456-426614174000";
const TEAM_ID_KEY = "research-team-id";

import { APIConfig, PROVIDERS } from "@/constants/ai-providers";

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
    aiProviderApi
      .getProviders(teamId)
      .then((saved) => {
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
                  is_default: match.is_default,
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
        // Send dummy key for ollama if empty to ensure row creation in DB 
        api_key: (p.provider_name === "ollama" && !p.api_key && !p.masked_key) ? "ollama" : p.api_key,
        base_url: p.base_url,
        is_default: p.is_default,
      }));
      await aiProviderApi.saveProviders(teamId, { configs: payload });
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

  const setAsDefault = async () => {
    // 1. Cập nhật state UI nhanh (Optimistic UI)
    setProviders((prev) =>
      prev.map((p) => ({
        ...p,
        is_default: p.provider_name === activeProvider,
      }))
    );

    // 2. Chạy luồng lưu thẳng lên DB
    setIsLoading(true);
    setSaveSuccess(false);
    try {
      const teamId = resolveTeamId();
      const payload = providers.map((p) => ({
        provider_name: p.provider_name,
        model_name: p.model_name,
        // Send dummy key for ollama if empty to ensure row creation in DB
        api_key: (p.provider_name === "ollama" && !p.api_key && !p.masked_key) ? "ollama" : p.api_key,
        base_url: p.base_url,
        is_default: p.provider_name === activeProvider,
      }));
      await aiProviderApi.saveProviders(teamId, { configs: payload });
      setSaveSuccess(true);
      gooeyToast.success("Set as default engine successfully!");
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error(error);
      gooeyToast.error("Failed to set default engine.");
    } finally {
      setIsLoading(false);
    }
  };

  const isConnected = (providerName: string) => {
    // Ollama chạy local nên không bắt buộc apiKey 
    if (providerName === "ollama") return true;
    const cfg = providers.find((p) => p.provider_name === providerName);
    // Connected if user typed a new key OR server returned a masked key (meaning key exists in DB)
    return cfg && (cfg.api_key.length > 5 || cfg.masked_key.length > 0);
  };

  const defaultProviderName = providers.find((p) => p.is_default)?.provider_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[960px] max-h-[85vh] flex flex-col bg-backdrop/95 border-default/40 backdrop-blur-xl p-0 overflow-hidden shadow-2xl rounded-xl">
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

        {/* Split View Container */}
        <div className="flex flex-1 overflow-hidden min-h-[420px]">
          {/* Sidebar — Provider Tabs */}
          <div className="w-[35%] border-r border-default/10 bg-surface-1/20 py-3 px-2.5 space-y-1 overflow-y-auto shrink-0 flex flex-col items-stretch">
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
                  className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                    isActive
                      ? `${p.bgColor} ring-1 ${p.borderColor} shadow-sm`
                      : "hover:bg-surface-1/60"
                  }`}
                >
                  <span className="text-2xl shrink-0">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold truncate ${isActive ? p.color : "text-body"}`}>
                      {p.label}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 max-w-full flex-wrap">
                      {connected ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium whitespace-nowrap">
                          <CircleDot className="w-2.5 h-2.5" /> Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-faint font-medium whitespace-nowrap">
                          <AlertTriangle className="w-2.5 h-2.5" /> No Key
                        </span>
                      )}
                      {isDefault && (
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-500 px-1.5 py-[1px] rounded-sm font-bold uppercase tracking-wider whitespace-nowrap">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Form Content */}
          <div className="w-[65%] flex flex-col bg-surface-base">
            <div className="flex-1 p-5 space-y-5 overflow-y-auto">
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
                    className="w-full bg-surface-1/50 border border-default/30 rounded-md px-3 py-2.5 pr-10 text-sm text-default placeholder:text-faint/60 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-default transition-colors p-1"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {currentConfig.masked_key && !currentConfig.api_key && (
                  <p className="text-[10px] text-emerald-500 flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-3 h-3" /> Key saved securely (leave blank to keep)
                  </p>
                )}
                {currentConfig.api_key.length > 5 && (
                  <p className="text-[10px] text-amber-500 flex items-center gap-1.5 mt-1">
                    <KeyRound className="w-3 h-3" /> New key entered — will replace on save
                  </p>
                )}
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-dim uppercase tracking-wider flex items-center gap-1.5 mb-1">
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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? `${providerMeta.bgColor} ${providerMeta.borderColor} ring-1 ${providerMeta.borderColor}`
                            : "border-default/20 hover:border-default/40 hover:bg-surface-1/30"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? providerMeta.bgColor : "bg-surface-1/50"
                        }`}>
                          {isSelected ? (
                            <Check className={`w-2.5 h-2.5 ${providerMeta.color}`} />
                          ) : (
                            <CircleDot className="w-2.5 h-2.5 text-faint" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[12.5px] font-medium ${isSelected ? "text-default" : "text-body"}`}>
                            {m.label}
                          </p>
                          <p className="text-[10px] text-dim truncate">{m.description}</p>
                        </div>
                        <TierIcon className={`w-3.5 h-3.5 shrink-0 ml-2 ${tierColors[m.tier]}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Base URL */}
              <div className="space-y-1.5 pt-2 border-t border-default/10">
                <label className="text-[11px] font-medium text-dim uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Endpoint URL
                  <span className="text-[9px] text-faint font-normal normal-case ml-1">(Advanced)</span>
                </label>
                <input
                  type="text"
                  placeholder={providerMeta.defaultBaseURL}
                  value={currentConfig.base_url}
                  onChange={(e) => updateConfig("base_url", e.target.value)}
                  className="w-full bg-surface-1/50 border border-default/20 rounded-md px-3 py-2 text-default placeholder:text-faint/50 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono text-[11px]"
                />
                <p className="text-[10px] text-dim mt-1.5">
                  Để trống để dùng endpoint mặc định. Chỉ cần cấu hình URL nếu bạn self-host hoặc chạy qua Reverse Proxy.
                </p>
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-default/15 bg-surface-base shrink-0">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
