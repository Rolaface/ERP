export interface BankAccount {
  id: number | string;

  bankName: string;
  accountNo: string;
  accountHolderName: string;

  swiftCode: string;
  sortCode: string;

  currency: string;
  openingBalance: number | string;

  dateAdded: string;
  branchAddress: string;

  isdefault: boolean;
}