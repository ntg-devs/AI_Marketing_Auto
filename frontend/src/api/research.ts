import apiClient from '@/lib/axios';
import {
  CrawlJob,
  CrawlJobDetailResponse,
  StartResearchRequest,
  StartResearchResponse,
} from '@/types/research';

export interface LiveInsight {
  id: string;
  source: 'reddit' | 'quora' | 'trends';
  title: string;
  snippet: string;
  score: number;
  timestamp: string;
}

export interface LiveSourceRef {
  id: string;
  url: string;
  title: string;
  relevance: number;
  verified: boolean;
}

export interface LiveResearchResponse {
  insights: LiveInsight[];
  sources: LiveSourceRef[];
}

export interface GenerateContentRequest {
  team_id: string;
  knowledge_source_id?: string;
  knowledge_text?: string;
  platform: string;
  tone: string;
  target_audience: string;
  content_length: string;
  additional_instructions?: string;
  language: string;
  brand_name?: string;
  brand_persona?: string;
  brand_guidelines?: string;
  outline?: string;
  image_url?: string;
  image_emotion?: string;
  image_context?: string;
}

export interface GenerateContentResponse {
  content_html: string;
  content_text: string;
  model_used: string;
  token_usage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface GenerateOutlineRequest {
  team_id: string;
  knowledge_source_id?: string;
  knowledge_text?: string;
  platform: string;
  tone: string;
  target_audience: string;
  additional_instructions?: string;
  language: string;
  brand_name?: string;
  brand_persona?: string;
  brand_guidelines?: string;
}

export interface GenerateOutlineResponse {
  outline_json: string;
  outline_text: string;
  model_used: string;
  token_usage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface AutoSuggestRequest {
  knowledge_text?: string;
  knowledge_source_id?: string;
  language?: string;
}

export interface AutoSuggestResponse {
  tone: string;
  target_audience: string;
  framework_suggestion: string;
  key_insights: string[];
  content_type: string;
  ai_suggested: boolean;
  error?: string;
}

export const researchApi = {
  async startURLResearch(data: StartResearchRequest): Promise<StartResearchResponse> {
    const response = await apiClient.post<StartResearchResponse>('/api/v1/research/url', data);
    return response as unknown as StartResearchResponse;
  },

  async getResearchJob(jobId: string): Promise<CrawlJobDetailResponse> {
    const response = await apiClient.get<CrawlJobDetailResponse>(`/api/v1/research/jobs/${jobId}`);
    return response as unknown as CrawlJobDetailResponse;
  },

  async listResearchJobs(teamId: string): Promise<{ jobs: CrawlJob[]; total: number }> {
    const response = await apiClient.get<{ jobs: CrawlJob[]; total: number }>(`/api/v1/research/jobs`, {
      params: { team_id: teamId },
    });
    return response as unknown as { jobs: CrawlJob[]; total: number };
  },

  async deleteResearchJob(jobId: string): Promise<void> {
    await apiClient.delete(`/api/v1/research/jobs/${jobId}`);
  },

  async generateContent(data: GenerateContentRequest, signal?: AbortSignal): Promise<GenerateContentResponse> {
    const response = await apiClient.post<GenerateContentResponse>('/api/v1/content/generate', data, { signal });
    return response as unknown as GenerateContentResponse;
  },

  async generateOutline(data: GenerateOutlineRequest, signal?: AbortSignal): Promise<GenerateOutlineResponse> {
    const response = await apiClient.post<GenerateOutlineResponse>('/api/v1/content/outline', data, { signal });
    return response as unknown as GenerateOutlineResponse;
  },

  async autoSuggest(data: AutoSuggestRequest): Promise<AutoSuggestResponse> {
    const response = await apiClient.post<AutoSuggestResponse>('/api/v1/content/auto-suggest', data);
    return response as unknown as AutoSuggestResponse;
  },

  /**
   * Fetch Live Research feeds.
   * This handles the mock fetching logic directly but is structured to accept backend data later.
   * In Production, this will call: await apiClient.get<LiveResearchResponse>('/api/v1/research/live');
   */
  async getLiveResearch(): Promise<LiveResearchResponse> {
    try {
      // 1. Try to fetch from real Backend endpoint first
      const response = await apiClient.get<LiveResearchResponse>('/api/v1/research/live');
      const data = response as any;
      if (data && (data.insights?.length > 0 || data.sources?.length > 0)) {
        return data;
      }
    } catch (error) {
      console.warn("Backend Live Research fetch failed, falling back to RSS...", error);
    }
    
    // 2. Fallback to RSS if Backend is unavailable
    try {
      const urls = [
        'https://api.rss2json.com/v1/api.json?rss_url=https://www.reddit.com/r/marketing/hot/.rss',
        'https://api.rss2json.com/v1/api.json?rss_url=https://www.reddit.com/r/SaaS/hot/.rss'
      ];
      
      let allItems: any[] = [];
      for (const url of urls) {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.items) allItems = [...allItems, ...data.items];
        }
      }

      if (allItems.length > 0) {
        const shuffled = allItems.sort(() => 0.5 - Math.random()).slice(0, 10);
        
        const liveInsights: LiveInsight[] = shuffled.map((item, i) => ({
          id: `live-in-${Date.now()}-${i}`,
          source: 'reddit',
          title: item.title?.substring(0, 70) + (item.title?.length > 70 ? '...' : ''),
          snippet: (item.description || item.content || '').replace(/<[^>]*>?/gm, '').substring(0, 100) + '...',
          score: Math.floor(Math.random() * 15) + 85,
          timestamp: 'Vừa xong',
        }));
        
        const liveSources: LiveSourceRef[] = shuffled.map((item, i) => ({
          id: `live-src-${Date.now()}-${i}`,
          url: item.link.replace('https://www.', '').substring(0, 40) + '...',
          title: item.title,
          relevance: Math.floor(Math.random() * 10) + 90,
          verified: true,
        }));

        return { insights: liveInsights, sources: liveSources };
      }
    } catch (error) {
      console.warn("Live fallback fetch error", error);
    }
    
    return { insights: [], sources: [] };
  },
};
