export type AccountType = "Supplier" | "Customer" | "Company" | "Bank"  | "Employee";
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
  partyName?: string;         
  isCompanyAccount?: boolean; 
}

