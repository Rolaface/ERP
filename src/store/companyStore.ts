import { create } from "zustand";
import { persist } from "zustand/middleware";

type CompanyState = {
  companyName: string;
  baseCurrency: string;
  companyAddress: string;
  isHydrated: boolean;

  setCompanyInfo: (data: {
    companyName?: string;
    baseCurrency?: string;
    companyAddress?: string;
  }) => void;

  clearCompanyInfo: () => void;
  setHydrated: () => void;
};

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      companyName: "",
      baseCurrency: "",
      companyAddress: "",
      isHydrated: false,

      setCompanyInfo: (data) =>
        set((state) => ({
          companyName: data.companyName || state.companyName,
          baseCurrency: data.baseCurrency || state.baseCurrency,
          companyAddress: data.companyAddress || state.companyAddress,
        })),

      clearCompanyInfo: () =>
        set({
          companyName: "",
          baseCurrency: "",
          companyAddress: "",
        }),

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