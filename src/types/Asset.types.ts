import type { ModalSubmitHandler } from "./modal";

export interface AssetForm {
  // Details
  assetName: string;
  itemCode: string;
  assetCategory: string;
  location: string;
  assetType: string;
  maintenanceRequired: boolean;
  calculateDepreciation: boolean;
  // Purchase Details
  purchaseReceipt: string;
  netPurchaseAmount: string;
  purchaseInvoice: string;
  assetQuantity: string;
  availableForUseDate: string;
  // More Info
  costCenter: string;
  // Ownership
  assetOwner: string;
  assetOwnerCompany: string;
  // Insurance
  policyNumber: string;
  insuranceStartDate: string;
  insurer: string;
  insuranceEndDate: string;
  insuredValue: string;
  comprehensiveInsurance: string;
  // Additional Info
  status: string;
  custodian: string;
  department: string;
}

export interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: ModalSubmitHandler;
  initialData?: Partial<AssetForm>;
  mode?: "create" | "edit";
  modalId?: string;
}

export type AssetTab = "details" | "moreInfo";

export const ASSET_TABS: AssetTab[] = ["details", "moreInfo"];

export const ASSET_TAB_LABELS: Record<AssetTab, string> = {
  details: "Details",
  moreInfo: "More Info",
};

export const DEFAULT_ASSET_FORM: AssetForm = {
  assetName: "",
  itemCode: "",
  assetCategory: "",
  location: "",
  assetType: "",
  maintenanceRequired: false,
  calculateDepreciation: false,
  purchaseReceipt: "",
  netPurchaseAmount: "",
  purchaseInvoice: "",
  assetQuantity: "1",
  availableForUseDate: "",
  costCenter: "",
  assetOwner: "Company",
  assetOwnerCompany: "Rolaface Private Limited",
  policyNumber: "",
  insuranceStartDate: "",
  insurer: "",
  insuranceEndDate: "",
  insuredValue: "",
  comprehensiveInsurance: "",
  status: "Draft",
  custodian: "",
  department: "",
};