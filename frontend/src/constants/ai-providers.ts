export interface APIConfig {
  provider_name: string;
  model_name: string;
  api_key: string;
  masked_key: string;
  base_url: string;
  is_default: boolean;
}

export interface ModelOption {
  value: string;
  label: string;
  description: string;
  tier: "free" | "standard" | "premium";
}

export interface ProviderMeta {
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

export const PROVIDERS: ProviderMeta[] = [
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
  {
    id: "ollama",
    label: "Ollama (Local)",
    icon: "🦙",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    glowColor: "shadow-purple-500/10",
    keyPlaceholder: "Không bắt buộc (có thể nhập 'ollama')",
    defaultBaseURL: "http://127.0.0.1:11434/v1",
    docsUrl: "https://ollama.com",
    defaultModel: "qwen2.5:3b",
    models: [
      { value: "qwen2.5:3b", label: "Qwen 2.5 (3B)", description: "Local model nhẹ, xử lý nhanh", tier: "free" },
      { value: "qwen2.5:7b", label: "Qwen 2.5 (7B)", description: "Local model mạnh mẽ hơn", tier: "standard" },
      { value: "llama3", label: "Llama 3", description: "Meta Llama", tier: "standard" },
    ],
  },
];
