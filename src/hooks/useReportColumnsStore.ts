import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomColumnDef } from "../hooks/report/useCustomColumns";

const TTL_MS = 24 * 60 * 60 * 1000;

interface Entry {
  defs: CustomColumnDef[];
  order: string[];
  savedAt: number;
}

interface ReportColumnsState {
  reports: Record<string, Entry>;
  addDefs: (key: string, next: CustomColumnDef[]) => void;
  setOrder: (key: string, order: string[]) => void;
  reset: (key: string) => void;
  clearAll: () => void;
}

const isFresh = (e: Entry) => Date.now() - e.savedAt <= TTL_MS;

export const useReportColumnsStore = create<ReportColumnsState>()(
  persist(
    (set) => ({
      reports: {},

      addDefs: (key, next) =>
        set((s) => {
          const cur = s.reports[key];
          const defs = cur?.defs ?? [];
          const known = new Set(defs.map((d) => d.key));
          const added = next.filter((d) => !known.has(d.key));
          if (added.length === 0) return s;
          return {
            reports: {
              ...s.reports,
              [key]: {
                defs: [...defs, ...added],
                order: cur?.order ?? [],
                savedAt: Date.now(),
              },
            },
          };
        }),

      setOrder: (key, order) =>
        set((s) => ({
          reports: {
            ...s.reports,
            [key]: {
              defs: s.reports[key]?.defs ?? [],
              order,
              savedAt: Date.now(),
            },
          },
        })),

      reset: (key) =>
        set((s) => {
          const reports = { ...s.reports };
          delete reports[key];
          return { reports };
        }),

      clearAll: () => set({ reports: {} }),
    }),
    {
      name: "report-columns",
      partialize: (s) => ({ reports: s.reports }),
      merge: (persisted, current) => {
        const stored =
          (persisted as Partial<ReportColumnsState> | undefined)?.reports ?? {};
        const reports = Object.fromEntries(
          Object.entries(stored).filter(([, e]) => isFresh(e)),
        );
        return { ...current, reports };
      },
    },
  ),
);