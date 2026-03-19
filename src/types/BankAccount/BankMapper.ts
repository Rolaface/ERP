import type { BankAccountUI } from "./bank";

export const mapGetBankAccounts = (response: any): BankAccountUI[] => {
  const raw = response?.message?.data?.bank_accounts;

  if (!Array.isArray(raw)) return [];

  return raw.map((item: any, index: number) => {
    const isCompany = item.is_company_account === 1;

    return {
      id: item.id ?? item.name ?? `row-${index}`,

      bankName: item.bankName ?? "",
      accountNo: item.accountNo ?? "",
      accountHolderName: item.accountHolderName ?? "",
      sortCode: item.sortCode ?? "",
      currency: item.currency ?? "",
      dateAdded: item.dateAdded ?? "",
      branchAddress: item.branchAddress ?? "",
      iban: item.iban ?? "",
      accountFor: item.accountFor ?? "",
      isDefault: (item.isDefault ?? item.isDefault) === 1,
      isDisabled: item.isDisabled === 1,

      accountType:
        item.accountFor ??
        (isCompany ? "Company" : "Unknown"),

      partyName:
        item.partyName ??
        (isCompany ? item.company : ""),
    };
  });
};


