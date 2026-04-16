import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ScheduleJob,
  ScheduleJobStatus,
  SchedulePlatform,
  OptimalTimeSlot,
} from '@/types/scheduler';
import { schedulerApi } from '@/api/scheduler';

/* ─── Helpers ──────────────────────────────────────────────────── */

const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/** Generate AI-recommended optimal time slots based on platform best practices */
function generateOptimalSlots(): OptimalTimeSlot[] {
  return [
    { id: 'opt-1', day_of_week: 0, hour: '09:00', platform: 'linkedin', score: 95, reason: 'Peak B2B engagement window' },
    { id: 'opt-2', day_of_week: 0, hour: '14:00', platform: 'facebook', score: 82, reason: 'Afternoon social browsing peak' },
    { id: 'opt-3', day_of_week: 1, hour: '10:00', platform: 'blog', score: 88, reason: 'Highest organic search traffic' },
    { id: 'opt-4', day_of_week: 2, hour: '08:30', platform: 'linkedin', score: 91, reason: 'Pre-work professional browsing' },
    { id: 'opt-5', day_of_week: 2, hour: '15:00', platform: 'facebook', score: 78, reason: 'Mid-week social activity' },
    { id: 'opt-6', day_of_week: 3, hour: '11:00', platform: 'blog', score: 85, reason: 'Thursday content discovery' },
    { id: 'opt-7', day_of_week: 4, hour: '09:30', platform: 'linkedin', score: 89, reason: 'End-of-week planning reads' },
    { id: 'opt-8', day_of_week: 4, hour: '13:00', platform: 'facebook', score: 76, reason: 'Friday lunch browsing' },
    { id: 'opt-9', day_of_week: 5, hour: '10:00', platform: 'blog', score: 72, reason: 'Weekend long-form reading' },
    { id: 'opt-10', day_of_week: 6, hour: '11:00', platform: 'facebook', score: 80, reason: 'Sunday engagement spike' },
  ];
}

/* ─── Store ────────────────────────────────────────────────────── */

interface SchedulerState {
  jobs: ScheduleJob[];
  optimalSlots: OptimalTimeSlot[];
  selectedJobId: string | null;
  currentWeekOffset: number;
  isLoadingJobs: boolean;
  filterPlatform: SchedulePlatform | 'all';

  // Actions — Local state
  setSelectedJobId: (id: string | null) => void;
  setCurrentWeekOffset: (offset: number) => void;
  setFilterPlatform: (platform: SchedulePlatform | 'all') => void;

  // Actions — API-backed CRUD
  fetchSchedules: (teamId: string) => Promise<void>;
  createSchedule: (params: {
    teamId: string;
    userId: string;
    platform: SchedulePlatform;
    title: string;
    contentHtml?: string;
    scheduledAt: string;
  }) => Promise<ScheduleJob>;
  updateScheduleTime: (id: string, scheduledAt: string) => Promise<void>;
  updateScheduleStatus: (id: string, status: ScheduleJobStatus) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  publishAllDue: () => Promise<number>;

  // Computed helpers
  getStats: () => { total: number; scheduled: number; published: number; failed: number };
  getUpcomingJobs: () => ScheduleJob[];
  getSlotsForDay: (dayOfWeek: number) => OptimalTimeSlot[];
}

export const useSchedulerStore = create<SchedulerState>()(
  persist(
    (set, get) => ({
      jobs: [],
      optimalSlots: generateOptimalSlots(),
      selectedJobId: null,
      currentWeekOffset: 0,
      isLoadingJobs: false,
      filterPlatform: 'all',

      setSelectedJobId: (id) => set({ selectedJobId: id }),
      setCurrentWeekOffset: (offset) => set({ currentWeekOffset: offset }),
      setFilterPlatform: (platform) => set({ filterPlatform: platform }),

      // ─── Fetch all schedules from backend ────────────────
      fetchSchedules: async (teamId: string) => {
        set({ isLoadingJobs: true });
        try {
          const res = await schedulerApi.listSchedules(teamId);
          // Assign AI scores based on optimal slots
          const slots = get().optimalSlots;
          const enriched = res.schedules.map((job) => {
            const d = new Date(job.scheduled_at);
            const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
            const hour = d.toTimeString().slice(0, 5);
            const matchingSlot = slots.find(
              (s) => s.day_of_week === dayOfWeek && s.hour === hour && s.platform === job.platform
            );
            return { ...job, ai_score: matchingSlot?.score };
          });
          set({ jobs: enriched });
        } catch (error) {
          console.error('Failed to fetch schedules:', error);
        } finally {
          set({ isLoadingJobs: false });
        }
      },

      // ─── Create schedule via backend ─────────────────────
      createSchedule: async ({ teamId, userId, platform, title, contentHtml, scheduledAt }) => {
        // Optimistic: add a temporary local job
        const tempId = generateLocalId();
        const tempJob: ScheduleJob = {
          id: tempId,
          team_id: teamId,
          title,
          platform,
          status: 'scheduled',
          content_html: contentHtml,
          scheduled_at: scheduledAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ jobs: [...state.jobs, tempJob] }));

        try {
          const realJob = await schedulerApi.createSchedule({
            team_id: teamId,
            user_id: userId,
            platform,
            title,
            content_html: contentHtml || '',
            scheduled_at: scheduledAt,
          });

          // Replace temp with real
          set((state) => ({
            jobs: state.jobs.map((j) => (j.id === tempId ? realJob : j)),
          }));
          return realJob;
        } catch (error) {
          // Remove temp on failure
          set((state) => ({ jobs: state.jobs.filter((j) => j.id !== tempId) }));
          throw error;
        }
      },

      // ─── Update schedule time ────────────────────────────
      updateScheduleTime: async (id: string, scheduledAt: string) => {
        // Optimistic update
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id ? { ...j, scheduled_at: scheduledAt, updated_at: new Date().toISOString() } : j
          ),
        }));
        try {
          await schedulerApi.updateSchedule(id, { scheduled_at: scheduledAt });
        } catch (error) {
          console.error('Failed to update schedule:', error);
          // Could rollback here if needed
          throw error;
        }
      },

      // ─── Update status ──────────────────────────────────
      updateScheduleStatus: async (id: string, status: ScheduleJobStatus) => {
        // Optimistic
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id
              ? {
                  ...j,
                  status,
                  updated_at: new Date().toISOString(),
                  ...(status === 'published' ? { published_at: new Date().toISOString() } : {}),
                }
              : j
          ),
        }));
        try {
          await schedulerApi.updateSchedule(id, { status });
        } catch (error) {
          console.error('Failed to update status:', error);
          throw error;
        }
      },

      // ─── Delete ─────────────────────────────────────────
      deleteSchedule: async (id: string) => {
        const prev = get().jobs;
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== id),
          selectedJobId: state.selectedJobId === id ? null : state.selectedJobId,
        }));
        try {
          await schedulerApi.deleteSchedule(id);
        } catch (error) {
          // Rollback
          set({ jobs: prev });
          throw error;
        }
      },

      // ─── Publish all due ────────────────────────────────
      publishAllDue: async () => {
        try {
          const res = await schedulerApi.publishDue();
          // Refresh list after publishing
          const teamId = get().jobs[0]?.team_id;
          if (teamId) {
            await get().fetchSchedules(teamId);
          }
          return res.published_count;
        } catch (error) {
          console.error('Failed to publish due:', error);
          throw error;
        }
      },

      // ─── Computed ───────────────────────────────────────
      getStats: () => {
        const jobs = get().jobs;
        return {
          total: jobs.length,
          scheduled: jobs.filter((j) => j.status === 'scheduled').length,
          published: jobs.filter((j) => j.status === 'published').length,
          failed: jobs.filter((j) => j.status === 'failed').length,
        };
      },

      getUpcomingJobs: () => {
        const now = new Date();
        return get()
          .jobs
          .filter((j) => j.status === 'scheduled' && new Date(j.scheduled_at) >= now)
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
      },

      getSlotsForDay: (dayOfWeek) => {
        return get().optimalSlots.filter((s) => s.day_of_week === dayOfWeek);
      },
    }),
    {
      name: 'scheduler-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist UI preferences, not data (that comes from API)
        currentWeekOffset: state.currentWeekOffset,
        filterPlatform: state.filterPlatform,
      }),
    }
  )
);
