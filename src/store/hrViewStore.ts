import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HRViewMode = "employee" | "professional";

interface HRViewState {
  // Per-username view mode map
  viewModes: Record<string, HRViewMode>;

  // Get current view mode for a user
  // Default is always "employee" — production safe
  getViewMode: (username: string) => HRViewMode;

  // Toggle between employee and professional
  setViewMode: (username: string, mode: HRViewMode) => void;

  // Clear on logout
  clearViewMode: (username: string) => void;
}

export const useHRViewStore = create<HRViewState>()(
  persist(
    (set, get) => ({
      viewModes: {},

      getViewMode: (username) => {
        return get().viewModes[username] ?? "employee";
      },

      setViewMode: (username, mode) => {
        set((state) => ({
          viewModes: {
            ...state.viewModes,
            [username]: mode,
          },
        }));
      },

      clearViewMode: (username) => {
        set((state) => {
          const next = { ...state.viewModes };
          delete next[username];
          return { viewModes: next };
        });
      },
    }),
    {
      name: "hr-view-store", // localStorage key
      // Only persist viewModes, not functions
      partialize: (state) => ({ viewModes: state.viewModes }),
    }
  )
);