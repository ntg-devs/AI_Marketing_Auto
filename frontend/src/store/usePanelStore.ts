import { create } from 'zustand';

type PanelType = 'settings' | 'account' | 'notifications' | null;

interface PanelState {
  activePanel: PanelType;
  openPanel: (panel: PanelType) => void;
  closePanel: () => void;
  togglePanel: (panel: PanelType) => void;
}

export const usePanelStore = create<PanelState>((set, get) => ({
  activePanel: null,

  openPanel: (panel) => set({ activePanel: panel }),

  closePanel: () => set({ activePanel: null }),

  togglePanel: (panel) =>
    set((state) => ({
      activePanel: state.activePanel === panel ? null : panel,
    })),
}));
