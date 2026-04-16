import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { userPreferencesApi, type UserPreferences } from '@/api/userPreferences';

interface UserPreferencesState {
  // Preferences data
  preferences: UserPreferences | null;
  isLoaded: boolean;
  isSaving: boolean;
  lastSyncedAt: string | null;

  // Actions
  loadPreferences: (userId: string) => Promise<void>;
  savePreferences: (userId: string) => Promise<void>;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  clearPreferences: () => void;
}

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'user_id'> = {
  default_tone: 'professional',
  default_language: 'vi',
  default_content_length: 'medium',
  default_target_audience: '',
  default_editor_mode: 'assets',
  default_platform: 'blog',
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: null,
      isLoaded: false,
      isSaving: false,
      lastSyncedAt: null,

      loadPreferences: async (userId: string) => {
        try {
          const serverPrefs = await userPreferencesApi.getPreferences(userId);
          if (serverPrefs) {
            set({
              preferences: serverPrefs,
              isLoaded: true,
              lastSyncedAt: new Date().toISOString(),
            });
          } else {
            // No server prefs — use defaults but mark as loaded
            const local = get().preferences;
            set({
              preferences: local || { user_id: userId, ...DEFAULT_PREFERENCES },
              isLoaded: true,
            });
          }
        } catch (error) {
          console.warn('[UserPreferences] Failed to load from server, using local:', error);
          const local = get().preferences;
          set({
            preferences: local || { user_id: userId, ...DEFAULT_PREFERENCES },
            isLoaded: true,
          });
        }
      },

      savePreferences: async (userId: string) => {
        const prefs = get().preferences;
        if (!prefs) return;

        set({ isSaving: true });
        try {
          await userPreferencesApi.savePreferences(userId, {
            ...prefs,
            user_id: userId,
          });
          set({
            isSaving: false,
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('[UserPreferences] Failed to save:', error);
          set({ isSaving: false });
          throw error;
        }
      },

      updatePreference: (key, value) => {
        set((state) => ({
          preferences: state.preferences
            ? { ...state.preferences, [key]: value }
            : null,
        }));
      },

      updatePreferences: (partial) => {
        set((state) => ({
          preferences: state.preferences
            ? { ...state.preferences, ...partial }
            : null,
        }));
      },

      clearPreferences: () => {
        set({
          preferences: null,
          isLoaded: false,
          lastSyncedAt: null,
        });
      },
    }),
    {
      name: 'user-preferences-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
