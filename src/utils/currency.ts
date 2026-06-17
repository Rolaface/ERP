import { useCompanyStore } from "../store/companyStore";


export const getCurrencySymbol = (): string => {
  return useCompanyStore.getState().currencySymbol || "FAA";
};