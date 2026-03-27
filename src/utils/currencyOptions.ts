import { getBankAccounts } from "../api/BankAccountApi";

export const fetchCurrencyOptions = async (search: string) => {
  return await getBankAccounts("Currency", undefined, search || undefined);
};