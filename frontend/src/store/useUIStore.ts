import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system' | 'quite-light';

interface UIState {
  isSidebarOpen: boolean;
  theme: Theme;
  language: 'vi' | 'en';
  
  // Actions
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: 'vi' | 'en') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      theme: 'dark', // default to dark
      language: 'vi', // default to Vietnamese

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      
      setSidebar: (open) => set({ isSidebarOpen: open }),
      
      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
