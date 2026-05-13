import { create } from "zustand";
import { persist } from "zustand/middleware";

type CompanyState = {
  companyName: string;
  baseCurrency: string;
  currencySymbol: string;
  isHydrated: boolean;

  setCompanyInfo: (data: {
    companyName?: string;
    baseCurrency?: string;
    currencySymbol?: string;
  }) => void;

  setCurrencySymbol: (
    symbol: string,
  ) => void;

  clearCompanyInfo: () => void;

  setHydrated: () => void;
};

export const useCompanyStore =
  create<CompanyState>()(
    persist(
      (set) => ({
        companyName: "",
        baseCurrency: "",
        currencySymbol: "",
        isHydrated: false,

        setCompanyInfo: (data) =>
          set((state) => ({
            companyName:
              data.companyName ??
              state.companyName,

            baseCurrency:
              data.baseCurrency ??
              state.baseCurrency,

            currencySymbol:
              data.currencySymbol ??
              state.currencySymbol,
          })),

        setCurrencySymbol: (
          symbol,
        ) =>
          set({
            currencySymbol:
              symbol,
          }),

        clearCompanyInfo: () =>
          set({
            companyName: "",
            baseCurrency: "",
            currencySymbol: "",
          }),

        setHydrated: () =>
          set({
            isHydrated: true,
          }),
      }),
      {
        name: "company-info",

        onRehydrateStorage:
          () => (state) => {
            state?.setHydrated();
          },
      },
    ),
  );