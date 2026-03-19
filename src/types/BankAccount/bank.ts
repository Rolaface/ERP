type AccountType = "Supplier" | "Customer" | "Company" | "Bank";
export interface BankAccount {
  id: number | string;

  bankName: string;
  accountNo: string;
  accountHolderName: string;

  swiftCode: string;
  sortCode: string;

  currency: string;
  openingBalance: number;

  dateAdded: string;
  branchAddress: string;
  

  isDefault: boolean;
  isDisabled: boolean;
  accountFor: "" | AccountType;
}

export type BankAccountUI = {
  id: string | number;
  bankName: string;
  accountNo: string;
  accountHolderName: string;
  sortCode: string;
  currency: string;
  dateAdded: string;
  branchAddress: string;
  iban: string;
  isDefault: boolean;
  isDisabled: boolean;
  accountType: string;
  partyName: string;
  accountFor:string,
};