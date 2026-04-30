import type { ModalSubmitHandler } from "./modal";



export type AssetStatus = "Draft" | "Active" | "Disposed";

export type AssetOwnerType = "Company" | "Employee";

export type AssetType = "Physical" | "Digital" | "Other";

export type DepreciationMethod =
  | "Straight Line Method"
  | "Double Declining Balance"
  | "Written Down Value"
  | "Manual"
  | "";

export type DepreciationFrequency =
  | "Monthly"
  | "Quarterly"
  | "Half-Yearly"
  | "Yearly"
  | "";

export interface FinanceBook {
  financeBook: string;
  depreciationMethod: DepreciationMethod;
  totalNumberOfDepreciations: number;
  frequencyOfDepreciation: DepreciationFrequency;
  depreciationStartDate: string;
  expectedValueAfterUsefulLife: number;
  rateOfDepreciation: number;
}

export interface AssetForm {
  // Details
  assetName: string;
  itemCode: string;
  assetCategory: string;
  location: string;
  assetType: AssetType | string;
  maintenanceRequired: boolean;
  calculateDepreciation: boolean;

  // Purchase Details
  purchaseDate: string;          // Existing Asset / Composite Asset
  purchaseReceipt: string;       // Composite Component
  netPurchaseAmount: number;
  purchaseInvoice: string;       // Composite Component
  assetQuantity: number;
  availableForUseDate: string;

  // More Info
  costCenter: string;

  // Ownership
  assetOwner: AssetOwnerType | string;
  assetOwnerCompany: string;

  // Insurance
  policyNumber: string;
  insuranceStartDate: string;
  insurer: string;
  insuranceEndDate: string;
  insuredValue: number;
  comprehensiveInsurance: boolean;

  // Additional Info
  status: AssetStatus | string;
  custodian: string;
  custodianLabel?: string;
  department: string;

  // Depreciation
  depreciationMethod: DepreciationMethod;
  frequencyOfDepreciation: DepreciationFrequency;
  totalNumberOfDepreciations: number;
  depreciationStartDate: string;
  expectedValueAfterUsefulLife: number;
  rateOfDepreciation: number;
  financeBooks: FinanceBook[];
}

/* ────────────────────────────────────────────── */
/* MODAL PROPS */
/* ────────────────────────────────────────────── */

export interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: ModalSubmitHandler;
  initialData?: Partial<AssetForm>;
  mode?: "create" | "edit";
  modalId?: string;
}

/* ────────────────────────────────────────────── */
/* TABS */
/* ────────────────────────────────────────────── */

export type AssetTab = "details" | "depreciation" | "moreInfo";

export const ALL_ASSET_TABS: AssetTab[] = ["details", "depreciation", "moreInfo"];

export const ASSET_TAB_LABELS: Record<AssetTab, string> = {
  details: "Details",
  depreciation: "Depreciation",
  moreInfo: "More Info",
};

/** Returns the active tab list based on whether depreciation is enabled */
export function getAssetTabs(calculateDepreciation: boolean): AssetTab[] {
  if (calculateDepreciation) return ["details", "depreciation", "moreInfo"];
  return ["details", "moreInfo"];
}

// Keep ASSET_TABS for backward compat
export const ASSET_TABS: AssetTab[] = ["details", "moreInfo"];

/* ────────────────────────────────────────────── */
/* DEFAULT FORM */
/* ────────────────────────────────────────────── */

export const DEFAULT_ASSET_FORM: AssetForm = {
  // Details
  assetName: "",
  itemCode: "",
  assetCategory: "",
  location: "",
  assetType: "Physical",
  maintenanceRequired: false,
  calculateDepreciation: false,

  // Purchase Details
  purchaseDate: "",
  purchaseReceipt: "",
  netPurchaseAmount: 0,
  purchaseInvoice: "",
  assetQuantity: 1,
  availableForUseDate: "",

  // More Info
  costCenter: "",

  // Ownership
  assetOwner: "Company",
  assetOwnerCompany: "",

  // Insurance
  policyNumber: "",
  insuranceStartDate: "",
  insurer: "",
  insuranceEndDate: "",
  insuredValue: 0,
  comprehensiveInsurance: false,

  // Additional Info
  status: "Draft",
  custodian: "",
  custodianLabel: "",
  department: "",

  // Depreciation
  depreciationMethod: "Straight Line Method",
  frequencyOfDepreciation: "Yearly",
  totalNumberOfDepreciations: 0,
  depreciationStartDate: "",
  expectedValueAfterUsefulLife: 0,
  rateOfDepreciation: 0,
  financeBooks: [],
};