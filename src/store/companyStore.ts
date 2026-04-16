import { create } from "zustand";
import { persist } from "zustand/middleware";

type CompanyState = {
  companyName: string;
  baseCurrency: string;
  isHydrated: boolean;

  setCompanyInfo: (data: {
    companyName?: string;
    baseCurrency?: string;
  }) => void;

  clearCompanyInfo: () => void;
  setHydrated: () => void;
};

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      companyName: "",
      baseCurrency: "",
      isHydrated: false,

      setCompanyInfo: (data) =>
        set((state) => ({
          companyName: data.companyName || state.companyName,
          baseCurrency: data.baseCurrency || state.baseCurrency,
        })),

      clearCompanyInfo: () =>
        set({ companyName: "", baseCurrency: "" }),

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "company-info",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);