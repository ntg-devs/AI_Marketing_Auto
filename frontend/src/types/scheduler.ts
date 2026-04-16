export type ScheduleJobStatus = 'scheduled' | 'processing' | 'published' | 'failed' | 'cancelled';
export type SchedulePlatform = 'facebook' | 'linkedin' | 'blog';

/**
 * Frontend representation of a scheduled post.
 * Maps from backend PublishSchedule + Post + SocialAccount.
 */
export interface ScheduleJob {
  id: string;                        // publish_schedules.id
  team_id: string;                   // posts.team_id
  title: string;                     // posts.title
  platform: SchedulePlatform;        // social_accounts.platform
  status: ScheduleJobStatus;         // publish_schedules.status
  content_html?: string;             // posts.content_html
  content_text?: string;             // posts.excerpt
  scheduled_at: string;              // publish_schedules.scheduled_at (ISO)
  published_at?: string;             // publish_schedules.published_at
  error_log?: string;                // publish_schedules.error_message
  created_at: string;
  updated_at: string;

  // Relations (from backend joins)
  post_id?: string;                  // publish_schedules.post_id
  social_account_id?: string;        // publish_schedules.social_account_id
  external_post_url?: string;        // publish_schedules.external_post_url
  retry_count?: number;              // publish_schedules.retry_count

  // Frontend-only (computed)
  ai_score?: number;                 // AI-recommended time score (0-100)
}

export interface OptimalTimeSlot {
  id: string;
  day_of_week: number; // 0=Mon, 6=Sun
  hour: string;        // "09:00"
  platform: SchedulePlatform;
  score: number;       // 0-100
  reason?: string;
}
