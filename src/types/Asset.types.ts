import type { ModalSubmitHandler } from "./modal";



export type AssetStatus = "Draft" | "Active" | "Disposed";

export type AssetOwnerType = "Company" | "Employee";

export type AssetType = "Physical" | "Digital" | "Other";



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
  purchaseReceipt: string;
  netPurchaseAmount: number;  
    purchaseInvoice: string;
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
  department: string;
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

export type AssetTab = "details" | "moreInfo";

export const ASSET_TABS: AssetTab[] = ["details", "moreInfo"];

export const ASSET_TAB_LABELS: Record<AssetTab, string> = {
  details: "Details",
  moreInfo: "More Info",
};

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
  purchaseReceipt: "",
  netPurchaseAmount: 0,
  purchaseInvoice: "",
  assetQuantity: 1,
  availableForUseDate: "",

  // More Info
  costCenter: "",

  // Ownership
  assetOwner: "Company",
  assetOwnerCompany: "Rolaface Private Limited",

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
  department: "",
};