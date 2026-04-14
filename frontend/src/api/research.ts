import apiClient from '@/lib/axios';
import {
  CrawlJob,
  CrawlJobDetailResponse,
  StartResearchRequest,
  StartResearchResponse,
} from '@/types/research';

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

  async generateContent(data: GenerateContentRequest): Promise<GenerateContentResponse> {
    const response = await apiClient.post<GenerateContentResponse>('/api/v1/content/generate', data);
    return response as unknown as GenerateContentResponse;
  },

  async generateOutline(data: GenerateOutlineRequest): Promise<GenerateOutlineResponse> {
    const response = await apiClient.post<GenerateOutlineResponse>('/api/v1/content/outline', data);
    return response as unknown as GenerateOutlineResponse;
  },
};
