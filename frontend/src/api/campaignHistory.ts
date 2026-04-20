import apiClient from '@/lib/axios';

export const campaignHistoryApi = {
  getHistory: async () => {
    // The apiClient un-wraps the backend response structure automatically via interceptors
    return apiClient.get('/api/v1/posts/history');
  },
};
