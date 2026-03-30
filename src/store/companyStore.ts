import { create } from "zustand";
import { persist } from "zustand/middleware";

type CompanyState = {
  companyName: string;
  baseCurrency: string;
  setCompanyInfo: (name: string, currency: string) => void;
  clearCompanyInfo: () => void;
};

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      companyName: "",
      baseCurrency: "",
      setCompanyInfo: (name, currency) =>
        set({ companyName: name, baseCurrency: currency }),
      clearCompanyInfo: () =>
        set({ companyName: "", baseCurrency: "" }),
    }),
    { name: "company-info" } // localStorage key
  )
);