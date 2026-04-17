import { create } from 'zustand';
import { schedulerApi, SocialAccountAPI } from '@/api/scheduler';

interface SaveAccountData {
  team_id: string;
  user_id?: string;
  platform: string;
  profile_name: string;
  access_token: string;
  page_id?: string;
}

interface SocialState {
  accounts: SocialAccountAPI[];
  isLoading: boolean;
  
  fetchAccounts: (teamId: string) => Promise<void>;
  saveAccount: (data: SaveAccountData) => Promise<void>;
  deleteAccount: (id: string, teamId: string) => Promise<void>;
}

export const useSocialStore = create<SocialState>((set) => ({
  accounts: [],
  isLoading: false,

  fetchAccounts: async (teamId) => {
    set({ isLoading: true });
    try {
      const res = await schedulerApi.listSocialAccounts(teamId);
      set({ accounts: res });
    } catch (error) {
      console.error('Failed to fetch social accounts:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveAccount: async (data) => {
    set({ isLoading: true });
    try {
      await schedulerApi.saveSocialAccount(data);
      if (data.team_id) {
        const res = await schedulerApi.listSocialAccounts(data.team_id);
        set({ accounts: res });
      }
    } catch (error) {
      console.error('Failed to save social account:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAccount: async (id, teamId) => {
    try {
      await schedulerApi.deleteSocialAccount(id);
      const res = await schedulerApi.listSocialAccounts(teamId);
      set({ accounts: res });
    } catch (error) {
      console.error('Failed to delete social account:', error);
      throw error;
    }
  },
}));
