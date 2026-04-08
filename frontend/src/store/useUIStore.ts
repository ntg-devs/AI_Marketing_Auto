import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  
  // Actions
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  theme: 'system',

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  setSidebar: (open) => set({ isSidebarOpen: open }),
  
  setTheme: (theme) => set({ theme }),
}));
