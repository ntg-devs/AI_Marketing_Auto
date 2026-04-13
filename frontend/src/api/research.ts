import apiClient from '@/lib/axios';
import {
  CrawlJob,
  CrawlJobDetailResponse,
  StartResearchRequest,
  StartResearchResponse,
} from '@/types/research';

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
};
