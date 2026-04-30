/* ─────────────────────────────────────────────
   ASSET MOVEMENT — TYPE DEFINITIONS
───────────────────────────────────────────── */

export interface AssetMovementRow {
  id: string;
  asset: string;
  sourceLocation: string;
  fromEmployee: string;
  fromEmployeeLabel?: string;
toEmployeeLabel?: string;
  targetLocation: string;
  toEmployee: string;
}

export type AssetMovementPurpose = "Transfer" | "Issue" | "Receipt" | "Transfer and Issue" | "";

export interface AssetMovementForm {
  company: string;
  transactionDate: string;
  purpose: AssetMovementPurpose;
  referenceNumber: string;
  referenceDate: string;
  assets: AssetMovementRow[];
}

export interface AssetMovementRecord extends AssetMovementForm {
  id: string;
  status: AssetMovementStatus;
  createdAt: string;
  updatedAt: string;
}

export type AssetMovementStatus =
  | "Draft"
  | "Submitted"
  | "Cancelled";

export interface AddAssetMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (form: AssetMovementForm) => Promise<boolean> | boolean | void;
  initialData?: Partial<AssetMovementForm>;
  mode?: "create" | "edit";
  modalId?: string;
}

/* ── Default form values ── */
export const DEFAULT_ASSET_MOVEMENT_ROW: AssetMovementRow = {
  id: "",
  asset: "",
  sourceLocation: "",
  fromEmployee: "",
  targetLocation: "",
  toEmployee: "",
};

export const DEFAULT_ASSET_MOVEMENT_FORM: AssetMovementForm = {
  company: "",
  transactionDate: "",
  purpose: "",
  referenceNumber: "",
  referenceDate: "",
  assets: [],
};

/* ── Purpose options ── */
export const PURPOSE_OPTIONS: { value: AssetMovementPurpose; label: string }[] =
  [
    { value: "", label: "Select purpose" },
    { value: "Transfer", label: "Transfer" },
    { value: "Issue", label: "Issue" },
    { value: "Receipt", label: "Receipt" },
    { value: "Transfer and Issue", label: "Transfer and Issue" },
  
  ];

/* ── Status badge colour map ── */
export const STATUS_CLASS_MAP: Record<AssetMovementStatus, string> = {
  Draft: "bg-draft",
  Submitted: "bg-success",
  Cancelled: "bg-danger",
};