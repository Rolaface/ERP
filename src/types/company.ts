import type { Terms } from "./termsAndCondition";

export interface RegistrationDetails {
  registerNo: string;
  tpin: string;
  companyName: string;
  dateOfIncorporation: string;
  companyType: string;
  companyStatus: string;
  industryType: string;
}

export interface ContactInfo {
  companyEmail?: string;
  companyPhone?: string;
  alternatePhone?: string;
  contactPerson?: string;
  contactEmail?: string;
  website?: string;
  contactPhone?: string;
}
export interface Address {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  timeZone?: string;
}
export interface BankAccount {
  id?: string;
  accountNo: string;
  accountHolderName?: string;
  bankName: string;
  swiftCode: string;
  sortCode?: string;
  branchAddress: string;
  currency: string;
  dateAdded: string;
  openingBalance: number;
  isdefault?: boolean;
}
export interface FinancialConfig {
  baseCurrency?: string;
  financialYearStart?: string;
}
export interface AccountingSetup {
  chartOfAccounts?: string;
  defaultExpenseGL?: string;

  fxGainLossAccount?: string;
  revaluationFrequency?: string;

  roundOffAccount?: string;
  roundOffCostCenter?: string;

  depreciationAccount?: string;
  appreciationAccount?: string;
}
export interface ModuleSubscriptions {
  accounting?: boolean;
  crm?: boolean;
  hr?: boolean;
  inventory?: boolean;
  procurement?: boolean;
  sales?: boolean;
  supplierManagement?: boolean;
}
export interface CompanyDocuments {
  companyLogoUrl?: string;
  authorizedSignatureUrl?: string;
}
export interface CompanyTemplates {
  invoiceTemplate?: string;
  quotationTemplate?: string;
  rfqTemplate?: string;
}
export interface Company {
  id?: string;

  basicDetails?: RegistrationDetails;
  contactInfo?: ContactInfo;
  address?: Address;
  bankAccounts?: BankAccount[];
  financialConfig?: FinancialConfig;
  accountingSetup?: AccountingSetup;
  modules?: ModuleSubscriptions;
  documents?: CompanyDocuments;
  templates?: CompanyTemplates;
  terms?: Terms;
  createdAt?: string;
  updatedAt?: string;
}

export interface BasicDetailsForm {
  registration: RegistrationDetails;
  contact: ContactInfo;
  address: Address;
}

export interface Module {
  key: string;
  name: string;
  tier: string;
  category: string;
  description: string;
}
