import type { BankAccount } from "./bank";

export const mapBankAccounts = (response: any): BankAccount[] => {
  const raw = response?.message?.data?.data ?? [];

  return raw.map((item: any, index: number) => ({
    id: index, 
    bankName: item.value ?? "",
    swiftCode: item.description ?? "",
    accountNo: "",
    accountHolderName: "",
    sortCode: "",
    currency: "",
    openingBalance: "",
    dateAdded: "",
    branchAddress: "",
    isdefault: false,
  }));
};