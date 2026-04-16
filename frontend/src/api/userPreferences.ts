import apiClient from '@/lib/axios';

export interface UserPreferences {
  id?: string;
  user_id: string;
  team_id?: string;

  // Content Generation Defaults
  default_tone: string;
  default_language: string;
  default_content_length: string;
  default_target_audience: string;

  // UI Preferences
  default_editor_mode: string;
  default_platform: string;
}

export const userPreferencesApi = {
  /**
   * Get user preferences from the backend.
   * Returns null if user hasn't saved any preferences yet.
   */
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const response = await apiClient.get<{ data: UserPreferences }>(
        `/api/v1/users/${userId}/preferences`
      );
      // @ts-ignore - axios response interceptor structure
      return response.data;
    } catch (error) {
      console.warn('[UserPreferences] Failed to load preferences:', error);
      return null;
    }
  },

  /**
   * Save (upsert) user preferences to the backend.
   */
  async savePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<void> {
    await apiClient.put(`/api/v1/users/${userId}/preferences`, prefs);
  },
};
