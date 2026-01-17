/**
 * Zustand store для Command Center (Cmd+K).
 */

import { create } from 'zustand';

interface CommandCenterState {
  isOpen: boolean;
  searchQuery: string;
}

interface CommandCenterActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

type CommandCenterStore = CommandCenterState & CommandCenterActions;

export const useCommandCenterStore = create<CommandCenterStore>((set) => ({
  // State
  isOpen: false,
  searchQuery: '',

  // Actions
  open: () => set({ isOpen: true, searchQuery: '' }),
  close: () => set({ isOpen: false, searchQuery: '' }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen, searchQuery: '' })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  reset: () => set({ isOpen: false, searchQuery: '' }),
}));
