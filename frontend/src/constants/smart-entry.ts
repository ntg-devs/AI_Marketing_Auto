export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.avif'];

export function isImageURL(url: string): boolean {
  if (url.startsWith('data:image/')) return true;
  const lower = url.toLowerCase().split('?')[0].split('#')[0];
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export const voiceProfiles = [
  "Default — Neutral Pro",
  "Thought Leader",
  "Casual Storyteller",
  "Data-Driven Analyst",
];

export const DEFAULT_TEAM_ID = "123e4567-e89b-12d3-a456-426614174000";
export const TEAM_ID_KEY = "research-team-id";

export const tagColors: Record<string, string> = {
  topic: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/20",
  audience: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
  tone: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/20",
  platform: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/20",
};

export const DICTIONARY = {
  vi: {
    configureTitle: "AI Content Pipeline — Cấu hình Brief",
    outlineTitle: "AI Content Pipeline — Dàn ý Master",
    generateOutline: "Tạo Dàn ý",
    produceAll: "Sản xuất Đa nền tảng",
    contentBrief: "Brief nội dung",
    targetPlatforms: "Nền tảng mục tiêu",
    platformHint: "Nội dung sẽ được tạo và tối ưu hóa cho cả 3 nền tảng cùng lúc. Mỗi phiên bản được tùy chỉnh theo thực tiễn tốt nhất của nền tảng đó.",
    toneOfVoice: "Tông giọng & Phong cách",
    contentLength: "Độ dài nội dung",
    language: "Ngôn ngữ",
    targetAudience: "Đối tượng mục tiêu",
    audiencePlaceholder: "VD: Người làm Marketing, nhà sáng lập startup...",
    optional: "(tùy chọn)",
    additionalInstructions: "Hướng dẫn bổ sung",
    instructionsPlaceholder: "VD: Tập trung vào lợi ích sản phẩm, thêm CTA ở cuối...",
    advancedWriting: "Cấu hình Viết Chuyên sâu",
    expertiseHint: "Nâng cao chất lượng nội dung bằng cách hướng dẫn AI sử dụng các khung kỹ thuật viết và góc nhìn chuyên nghiệp.",
    pointOfView: "Góc nhìn (POV)",
    expertiseLevel: "Trình độ chuyên môn",
    copywritingFramework: "Khung viết quảng cáo",
    aiSuggested: "AI gợi ý",
    aiAnalyzing: "AI đang phân tích...",
    aiConfigured: "AI đã cấu hình",
    keyInsights: "Thông tin chủ chốt (AI phát hiện)",
    visualAnchor: "Đã đính kèm ảnh tham chiếu",
    visualHint: "Hình ảnh này sẽ được nhúng vào nội dung được tạo dưới dạng mỏ neo trực quan.",
    tones: [
      { value: "professional", label: "Chuyên nghiệp" },
      { value: "casual", label: "Thân thiện" },
      { value: "storyteller", label: "Kể chuyện" },
      { value: "data-driven", label: "Dựa trên dữ liệu" }
    ],
    lengths: [
      { value: "short", label: "Ngắn (~200 từ)" },
      { value: "medium", label: "Vừa (~500 từ)" },
      { value: "long", label: "Dài (~1000 từ)" }
    ],
    povs: [
      { value: "first_person_singular", label: "Ngôi thứ nhất số ít (Tôi)" },
      { value: "first_person_plural", label: "Ngôi thứ nhất số nhiều (Chúng tôi)" },
      { value: "second_person", label: "Ngôi thứ hai (Bạn)" },
      { value: "third_person", label: "Ngôi thứ ba (Họ/Nó)" }
    ],
    expertise: [
      { value: "accessible", label: "Dễ hiểu & Thân thiện" },
      { value: "professional", label: "Tiêu chuẩn Chuyên nghiệp" },
      { value: "expert", label: "Chuyên gia & Kỹ thuật" }
    ],
    frameworks: [
      { value: "standard", label: "Bài viết Tiêu chuẩn" },
      { value: "aida", label: "AIDA (Gây chú ý, Quan tâm, Khao khát, Hành động)" },
      { value: "pas", label: "PAS (Vấn đề, Xát muối, Giải pháp)" },
      { value: "storytelling", label: "Storytelling (Mở đầu, Mâu thuẫn, Giải quyết)" },
      { value: "analytical", label: "Phân tích (Dữ liệu, Insight, Kết luận)" },
      { value: "4c", label: "4C (Rõ ràng, Súc tích, Thuyết phục, Đáng tin)" },
      { value: "bab", label: "BAB (Trước, Sau, Cầu nối)" },
      { value: "fab", label: "FAB (Đặc điểm, Lợi thế, Lợi ích)" }
    ]
  },
  en: {
    configureTitle: "AI Content Pipeline — Configure Brief",
    outlineTitle: "AI Content Pipeline — Master Outline",
    generateOutline: "Generate Outline",
    produceAll: "Produce All Platforms",
    contentBrief: "Content Brief",
    targetPlatforms: "Target Platforms",
    platformHint: "Content will be generated and optimized for all 3 platforms simultaneously. Each version is tailored to the platform's best practices.",
    toneOfVoice: "Tone of Voice",
    contentLength: "Content Length",
    language: "Language",
    targetAudience: "Target Audience",
    audiencePlaceholder: "e.g. Marketers, startup founders...",
    optional: "(optional)",
    additionalInstructions: "Additional Instructions",
    instructionsPlaceholder: "e.g. Focus on product benefits, add CTA at end...",
    advancedWriting: "Advanced Writing Configuration",
    expertiseHint: "Elevate content quality by directing the AI to use professional copywriting frameworks and perspectives.",
    pointOfView: "Point of View",
    expertiseLevel: "Expertise Level",
    copywritingFramework: "Copywriting Framework",
    aiSuggested: "AI Suggested",
    aiAnalyzing: "AI analyzing...",
    aiConfigured: "AI Configured",
    keyInsights: "Key Insights (AI Detected)",
    visualAnchor: "Reference Image Attached",
    visualHint: "This image will be embedded in the generated content as a visual anchor.",
    tones: [
      { value: "professional", label: "Professional" },
      { value: "casual", label: "Casual" },
      { value: "storyteller", label: "Storyteller" },
      { value: "data-driven", label: "Data-Driven" }
    ],
    lengths: [
      { value: "short", label: "Short (~200 words)" },
      { value: "medium", label: "Medium (~500 words)" },
      { value: "long", label: "Long (~1000 words)" }
    ],
    povs: [
      { value: "first_person_singular", label: "First Person (I/Me)" },
      { value: "first_person_plural", label: "First Person (We/Us)" },
      { value: "second_person", label: "Second Person (You)" },
      { value: "third_person", label: "Third Person (They/It)" }
    ],
    expertise: [
      { value: "accessible", label: "Accessible & Friendly" },
      { value: "professional", label: "Professional Standard" },
      { value: "expert", label: "Expert & Technical" }
    ],
    frameworks: [
      { value: "standard", label: "Standard Article" },
      { value: "aida", label: "AIDA (Attention, Interest, Desire, Action)" },
      { value: "pas", label: "PAS (Problem, Agitate, Solution)" },
      { value: "storytelling", label: "Storytelling (Hook, Conflict, Resolution)" },
      { value: "analytical", label: "Analytical (Data, Insights, Conclusion)" },
      { value: "4c", label: "4C (Clear, Concise, Compelling, Credible)" },
      { value: "bab", label: "BAB (Before, After, Bridge)" },
      { value: "fab", label: "FAB (Features, Advantages, Benefits)" }
    ]
  }
};
