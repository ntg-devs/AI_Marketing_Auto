import { create } from 'zustand';

interface CampaignHistoryState {
  isOpen: boolean;
  expandedRowId: string | null;
  filterStatus: 'all' | 'scheduled' | 'success' | 'failed';
  filterChannel: 'all' | 'facebook' | 'linkedin' | 'blog';
  searchQuery: string;

  // Actions
  openHistory: () => void;
  closeHistory: () => void;
  toggleHistory: () => void;
  setExpandedRow: (id: string | null) => void;
  toggleExpandedRow: (id: string) => void;
  setFilterStatus: (status: CampaignHistoryState['filterStatus']) => void;
  setFilterChannel: (channel: CampaignHistoryState['filterChannel']) => void;
  setSearchQuery: (query: string) => void;
}

export const useCampaignHistoryStore = create<CampaignHistoryState>((set, get) => ({
  isOpen: false,
  expandedRowId: null,
  filterStatus: 'all',
  filterChannel: 'all',
  searchQuery: '',

  openHistory: () => set({ isOpen: true }),
  closeHistory: () => set({ isOpen: false, expandedRowId: null }),
  toggleHistory: () =>
    set((state) => ({
      isOpen: !state.isOpen,
      expandedRowId: state.isOpen ? null : state.expandedRowId,
    })),
  setExpandedRow: (id) => set({ expandedRowId: id }),
  toggleExpandedRow: (id) =>
    set((state) => ({
      expandedRowId: state.expandedRowId === id ? null : id,
    })),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterChannel: (channel) => set({ filterChannel: channel }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
