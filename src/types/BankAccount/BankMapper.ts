import type { BankAccount } from "./bank";

const validAccountTypes = ["Supplier", "Customer", "Company", "Bank"] as const;

export const mapGetBankAccounts = (data: any): BankAccount[] => {
  const raw = data?.bank_accounts ?? [];

  if (!Array.isArray(raw)) return [];

  return raw.map((item: any, index: number) => ({
    id: item.id || item.name || `row-${index}`,
    bankName: item.bankName || "",
    accountNo: item.accountNo || "",
    accountHolderName: item.accountHolderName || "",

    swiftCode: item.swiftCode || "",
    sortCode: item.sortCode || "",

    currency: item.currency || "",
    openingBalance: 0,

    dateAdded: item.dateAdded || "",
    branchAddress: item.branchAddress || "",

    isDefault: Number(item.isDefault) === 1,
    isDisabled: Number(item.isDisabled) === 1,

    accountFor: validAccountTypes.includes(item.accountFor as any)
      ? (item.accountFor as BankAccount["accountFor"])
      : "",

    partyName: item.partyName || item.party_name || "",

    isCompanyAccount: Number(item.is_company_account) === 1,
  }));
  
};