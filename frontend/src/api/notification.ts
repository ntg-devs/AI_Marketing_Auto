import apiClient from '@/lib/axios';

export interface Notification {
  id: string;
  team_id: string;
  user_id?: string;
  type: 'crawl' | 'llm' | 'image' | 'publish' | 'system';
  title: string;
  message: string;
  status: 'unread' | 'read';
  link_url?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
}

export const notificationApi = {
  list: async (teamId: string, limit = 50, offset = 0): Promise<NotificationListResponse> => {
    const res = await apiClient.get<NotificationListResponse>('/api/v1/notifications', {
      params: { team_id: teamId, limit, offset },
    });
    return res as unknown as NotificationListResponse;
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.put(`/api/v1/notifications/${id}/read`);
  },

  markAllRead: async (teamId: string): Promise<void> => {
    await apiClient.post('/api/v1/notifications/mark-all-read', {}, {
      params: { team_id: teamId },
    });
  },
};
