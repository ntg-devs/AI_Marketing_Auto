import { create } from 'zustand';
import { notificationApi, Notification } from '@/api/notification';

interface NotificationState {
  notifications: Notification[];
  total: number;
  isLoading: boolean;
  
  fetchNotifications: (teamId: string) => Promise<void>;
  markRead: (id: string, teamId: string) => Promise<void>;
  markAllRead: (teamId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  total: 0,
  isLoading: false,

  fetchNotifications: async (teamId) => {
    set({ isLoading: true });
    try {
      const res = await notificationApi.list(teamId);
      set({ notifications: res.notifications || [], total: res.total });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  markRead: async (id, teamId) => {
    try {
      await notificationApi.markRead(id);
      await get().fetchNotifications(teamId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllRead: async (teamId) => {
    try {
      await notificationApi.markAllRead(teamId);
      await get().fetchNotifications(teamId);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },
}));
