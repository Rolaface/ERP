import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ColumnState {
  // tableId -> array of visible column keys
  columnPrefs: Record<string, string[]>;
  getVisibleKeys: (tableId: string, allKeys: string[]) => string[];
  setVisibleKeys: (tableId: string, keys: string[]) => void;
  resetVisibleKeys: (tableId: string, allKeys: string[]) => void;
}

export const useColumnStore = create<ColumnState>()(
  persist(
    (set, get) => ({
      columnPrefs: {},

      getVisibleKeys: (tableId, allKeys) => {
        const saved = get().columnPrefs[tableId];
        return saved ?? allKeys;
      },

      setVisibleKeys: (tableId, keys) => {
        set((state) => ({
          columnPrefs: {
            ...state.columnPrefs,
            [tableId]: keys,
          },
        }));
      },

      resetVisibleKeys: (tableId, allKeys) => {
        set((state) => ({
          columnPrefs: {
            ...state.columnPrefs,
            [tableId]: allKeys,
          },
        }));
      },
    }),
    {
      name: "table-column-prefs", 
    }
  )
);