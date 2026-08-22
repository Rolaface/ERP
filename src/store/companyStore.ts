import { create } from "zustand";
import { persist } from "zustand/middleware";

type CompanyState = {
  companyName: string;
  baseCurrency: string;
  currencySymbol: string;
  companyPhone?: string;
  domain: "Service" | "Product" | "";
  industryType: string;
  companyAddress: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
  isZraEnabled: boolean;
  isHydrated: boolean;

  setCompanyInfo: (data: {
    companyName?: string;
    baseCurrency?: string;
    currencySymbol?: string;
    domain?: "Service" | "Product" | "";
    companyPhone?: string;
    industryType?: string;
    companyAddress?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      district?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
  }) => void;

  setCurrencySymbol: (symbol: string) => void;
   setZraEnabled: (value: boolean) => void; 

  clearCompanyInfo: () => void;

  setHydrated: () => void;
};

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      companyName: "",
      baseCurrency: "",
      currencySymbol: "",
      domain: "",
      industryType: "",
companyPhone: "",
      companyAddress: {},
      isHydrated: false,
      isZraEnabled: false,

      setCompanyInfo: (data) =>
        set((state) => ({
          companyName: data.companyName ?? state.companyName,
          companyPhone: data.companyPhone ?? state.companyPhone,

          baseCurrency: data.baseCurrency ?? state.baseCurrency,

          currencySymbol: data.currencySymbol ?? state.currencySymbol,

          companyAddress: data.companyAddress ?? state.companyAddress,
          domain: data.domain ?? state.domain,
          industryType: data.industryType ?? state.industryType,
        })),

      setCurrencySymbol: (symbol) =>
        set({
          currencySymbol: symbol,
        }),

       setZraEnabled: (value) => set({ isZraEnabled: value }),

      clearCompanyInfo: () =>
        set({
          companyName: "",
          baseCurrency: "",
          companyPhone: "",
          currencySymbol: "",
          domain: "",
          industryType: "",
          companyAddress: {},
          isZraEnabled: false,
        }),

      setHydrated: () =>
        set({
          isHydrated: true,
        }),
    }),
    {
      name: "company-info",

      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
