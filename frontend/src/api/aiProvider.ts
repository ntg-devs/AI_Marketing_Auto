import apiClient from '@/lib/axios';
import { APIConfig } from '@/constants/ai-providers';

export interface AIProviderResponse {
  data: APIConfig[];
  message: string;
}

export interface SaveAIProvidersRequest {
  configs: Partial<APIConfig>[];
}

export const aiProviderApi = {
  /**
   * Get configured AI Providers for a team
   */
  async getProviders(teamId: string): Promise<APIConfig[]> {
    const response = await apiClient.get<AIProviderResponse>(`/api/v1/teams/${teamId}/ai-providers`);
    // @ts-ignore - axios response intercepter structure might not perfectly match types, but we return data.data
    return response.data;
  },

  /**
   * Save AI Provider Configurations for a team
   */
  async saveProviders(teamId: string, data: SaveAIProvidersRequest): Promise<void> {
    await apiClient.post(`/api/v1/teams/${teamId}/ai-providers`, data);
  },
};
