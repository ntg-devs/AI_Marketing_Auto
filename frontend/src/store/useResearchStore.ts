import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CrawlJob, CrawlJobDetailResponse, RecentResearchJob } from '@/types/research';
import { researchApi } from '@/api/research';

interface GeneratedContentEntry {
  platform: string;
  html: string;
  modelUsed: string;
  tokenUsage: { prompt: number; completion: number; total: number };
  generatedAt: string;
}

interface ResearchState {
  recentJobs: CrawlJob[];
  activeJobId: string;
  activeJob: CrawlJobDetailResponse | null;
  isPolling: boolean;
  isLoadingJobs: boolean;
  
  // Content Generation
  generatedContent: Record<string, GeneratedContentEntry>; // keyed by platform
  
  setActiveJobId: (jobId: string) => void;
  setActiveJob: (detail: CrawlJobDetailResponse | null) => void;
  setPolling: (value: boolean) => void;
  setGeneratedContent: (platform: string, entry: GeneratedContentEntry) => void;
  clearGeneratedContent: () => void;
  
  fetchRecentJobs: (teamId: string) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
}

export const useResearchStore = create<ResearchState>()(
  persist(
    (set, get) => ({
      recentJobs: [],
      activeJobId: '',
      activeJob: null,
      isPolling: false,
      isLoadingJobs: false,
      generatedContent: {},

      setActiveJobId: (jobId) => set({ activeJobId: jobId }),

      setActiveJob: (detail) => {
        set({ activeJob: detail });
      },

      setPolling: (value) => set({ isPolling: value }),

      setGeneratedContent: (platform, entry) => {
        set((state) => ({
          generatedContent: {
            ...state.generatedContent,
            [platform]: entry,
          },
        }));
      },

      clearGeneratedContent: () => set({ generatedContent: {} }),

      fetchRecentJobs: async (teamId: string) => {
        set({ isLoadingJobs: true });
        try {
          const res = await researchApi.listResearchJobs(teamId);
          set({ recentJobs: res.jobs || [] });
        } catch (error) {
          console.error('Failed to fetch recent jobs:', error);
        } finally {
          set({ isLoadingJobs: false });
        }
      },

      deleteJob: async (jobId: string) => {
        try {
          await researchApi.deleteResearchJob(jobId);
          set((state) => ({
            recentJobs: state.recentJobs.filter((j) => j.id !== jobId),
            activeJobId: state.activeJobId === jobId ? '' : state.activeJobId,
            activeJob: state.activeJobId === jobId ? null : state.activeJob,
          }));
        } catch (error) {
          console.error('Failed to delete job:', error);
          throw error;
        }
      },
    }),
    {
      name: 'research-shared-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeJobId: state.activeJobId,
      }),
    },
  ),
);
