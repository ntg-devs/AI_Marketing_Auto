import apiClient from '@/lib/axios';
import type {
  ScheduleJob,
  SchedulePlatform,
} from '@/types/scheduler';

// ─── Request/Response DTOs (aligned with backend) ────────────────

export interface CreateScheduleAPIRequest {
  team_id: string;
  user_id: string;
  platform: string;
  title: string;
  topic?: string;
  content_html?: string;
  scheduled_at: string; // ISO 8601
  social_account_id?: string;
}

export interface UpdateScheduleAPIRequest {
  scheduled_at?: string;
  status?: string;
}

export interface PublishScheduleAPI {
  id: string;
  post_id: string;
  social_account_id: string;
  scheduled_at: string;
  published_at?: string;
  status: string;
  external_post_id?: string;
  external_post_url?: string;
  engagement_metrics?: Record<string, unknown>;
  retry_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  post?: PostAPI;
  social_account?: SocialAccountAPI;
}

export interface PostAPI {
  id: string;
  team_id: string;
  user_id: string;
  title: string;
  slug?: string;
  topic: string;
  excerpt?: string;
  content_html?: string;
  language: string;
  status: string;
  published_at?: string;
  ai_model_used?: string;
  created_at: string;
  updated_at: string;
}

export interface SocialAccountAPI {
  id: string;
  team_id: string;
  platform: string;
  profile_name?: string;
  profile_url?: string;
  avatar_url?: string;
  is_active: boolean;
  last_sync_at?: string;
}

export interface ScheduleListAPIResponse {
  schedules: PublishScheduleAPI[];
  total: number;
}

export interface ScheduleDetailAPIResponse {
  schedule: PublishScheduleAPI;
  post?: PostAPI;
}

// ─── Transform API → Frontend types ──────────────────────────────

function mapAPIToScheduleJob(item: PublishScheduleAPI): ScheduleJob {
  const post = item.post;
  const account = item.social_account;
  return {
    id: item.id,
    team_id: post?.team_id || '',
    title: post?.title || 'Untitled',
    platform: (account?.platform || 'blog') as SchedulePlatform,
    status: item.status as ScheduleJob['status'],
    content_html: post?.content_html,
    content_text: post?.excerpt,
    scheduled_at: item.scheduled_at,
    published_at: item.published_at,
    error_log: item.error_message,
    created_at: item.created_at,
    updated_at: item.updated_at,
    // Additional fields from domain
    post_id: item.post_id,
    social_account_id: item.social_account_id,
    external_post_url: item.external_post_url,
    retry_count: item.retry_count,
  };
}

// ─── API Client ──────────────────────────────────────────────────

export const schedulerApi = {
  /**
   * Create a new scheduled post.
   * Backend creates both the `post` and `publish_schedule` records.
   */
  async createSchedule(data: CreateScheduleAPIRequest): Promise<ScheduleJob> {
    const response = await apiClient.post<ScheduleDetailAPIResponse>('/api/v1/schedules', data);
    const res = response as unknown as ScheduleDetailAPIResponse;
    return mapAPIToScheduleJob(res.schedule);
  },

  /**
   * List all schedules for a team.
   */
  async listSchedules(teamId: string, limit = 50, offset = 0): Promise<{ schedules: ScheduleJob[]; total: number }> {
    const response = await apiClient.get<ScheduleListAPIResponse>('/api/v1/schedules', {
      params: { team_id: teamId, limit, offset },
    });
    const res = response as unknown as ScheduleListAPIResponse;
    return {
      schedules: (res.schedules || []).map(mapAPIToScheduleJob),
      total: res.total,
    };
  },

  /**
   * Get a specific schedule detail.
   */
  async getSchedule(scheduleId: string): Promise<ScheduleJob> {
    const response = await apiClient.get<ScheduleDetailAPIResponse>(`/api/v1/schedules/${scheduleId}`);
    const res = response as unknown as ScheduleDetailAPIResponse;
    return mapAPIToScheduleJob(res.schedule);
  },

  /**
   * Update a schedule (reschedule time or change status).
   */
  async updateSchedule(scheduleId: string, data: UpdateScheduleAPIRequest): Promise<void> {
    await apiClient.put(`/api/v1/schedules/${scheduleId}`, data);
  },

  /**
   * Delete a schedule.
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    await apiClient.delete(`/api/v1/schedules/${scheduleId}`);
  },

  /**
   * Trigger publishing of all due schedules.
   */
  async publishDue(): Promise<{ published_count: number }> {
    const response = await apiClient.post<{ published_count: number }>('/api/v1/schedules/publish-due');
    return response as unknown as { published_count: number };
  },

  /**
   * Social Account Management
   */
  async listSocialAccounts(teamId: string): Promise<SocialAccountAPI[]> {
    const response = await apiClient.get<SocialAccountAPI[]>('/api/v1/social-accounts', {
      params: { team_id: teamId },
    });
    return response as unknown as SocialAccountAPI[];
  },

  async saveSocialAccount(data: {
    team_id: string;
    user_id?: string;
    platform: string;
    profile_name: string;
    access_token: string;
    page_id?: string;
  }): Promise<SocialAccountAPI> {
    const response = await apiClient.post<SocialAccountAPI>('/api/v1/social-accounts', data);
    return response as unknown as SocialAccountAPI;
  },

  async deleteSocialAccount(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/social-accounts/${id}`);
  },
};
