import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CrawlJobDetailResponse, RecentResearchJob } from '@/types/research';

interface ResearchState {
  recentJobs: RecentResearchJob[];
  activeJobId: string;
  activeJob: CrawlJobDetailResponse | null;
  isPolling: boolean;
  setActiveJobId: (jobId: string) => void;
  setActiveJob: (detail: CrawlJobDetailResponse | null) => void;
  setPolling: (value: boolean) => void;
  upsertRecentJob: (job: RecentResearchJob) => void;
  clearRecentJobs: () => void;
}

export const useResearchStore = create<ResearchState>()(
  persist(
    (set, get) => ({
      recentJobs: [],
      activeJobId: '',
      activeJob: null,
      isPolling: false,

      setActiveJobId: (jobId) => set({ activeJobId: jobId }),

      setActiveJob: (detail) => {
        set({ activeJob: detail });
        if (detail?.job) {
          get().upsertRecentJob({
            jobId: detail.job.id,
            url: detail.job.source_url,
            teamId: detail.job.team_id,
            status: detail.job.status,
            title: detail.job.title,
            createdAt: detail.job.created_at,
          });
        }
      },

      setPolling: (value) => set({ isPolling: value }),

      upsertRecentJob: (job) =>
        set((state) => ({
          recentJobs: [job, ...state.recentJobs.filter((item) => item.jobId !== job.jobId)].slice(0, 10),
        })),

      clearRecentJobs: () => set({ recentJobs: [] }),
    }),
    {
      name: 'research-shared-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        recentJobs: state.recentJobs,
        activeJobId: state.activeJobId,
      }),
    },
  ),
);
