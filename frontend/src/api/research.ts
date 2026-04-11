import apiClient from '@/lib/axios';
import {
  CrawlJobDetailResponse,
  StartResearchRequest,
  StartResearchResponse,
} from '@/types/research';

export const researchApi = {
  async startURLResearch(data: StartResearchRequest): Promise<StartResearchResponse> {
    const response = await apiClient.post<StartResearchResponse>('/api/v1/research/url', data);
    return response as StartResearchResponse;
  },

  async getResearchJob(jobId: string): Promise<CrawlJobDetailResponse> {
    const response = await apiClient.get<CrawlJobDetailResponse>(`/api/v1/research/jobs/${jobId}`);
    return response as CrawlJobDetailResponse;
  },
};
