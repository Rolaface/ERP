// ─── Stock Correction — Constants ────────────────────────────────────────────
import type { CorrectionFormState, ReasonCode } from "../../src/types/Stockcorrection.types";

export const EMPTY_FORM: CorrectionFormState = {
  id:              "",
  itemName:        "",
  itemClassCode:   "",
  unitOfMeasureCd: "",
  currentQty:      null,
  correctionType:  "add",
  adjustmentQty:   "",
  reason:          "",
  notes:           "",
};

// ERP-standard reason codes — maps to audit log entries
export const REASON_CODES: ReasonCode[] = [
  { id: "DAMAGED",          label: "Damaged / Spoiled"         },
  { id: "EXPIRED",          label: "Expired Stock"             },
  { id: "THEFT",            label: "Theft / Loss"              },
  { id: "COUNT_ERROR",      label: "Counting Error"            },
  { id: "RETURN_SUPPLIER",  label: "Supplier Return"           },
  { id: "RETURN_CUSTOMER",  label: "Customer Return"           },
  { id: "TRANSFER_IN",      label: "Inter-branch Transfer In"  },
  { id: "TRANSFER_OUT",     label: "Inter-branch Transfer Out" },
  { id: "AUDIT",            label: "Physical Audit Adjustment" },
  { id: "SYSTEM_ERROR",     label: "System / Data Error"       },
  { id: "OTHER",            label: "Other"                     },
];

export const REASON_MAP = Object.fromEntries(
  REASON_CODES.map((r) => [r.id, r.label])
);

// CSV template definition
export const CSV_HEADERS = [
  "item_code",
  "item_name",
  "item_group",
  "uom",
  "warehouse",
  "opening_qty",
  "valuation_rate",
  "description",
  "brand",
];

export const CSV_SAMPLE_ROWS = [
  "ITEM-001,Paracetamol 500mg,Products,Nos,Main Store - RC,100,2.5,,",
  "ITEM-002,Amoxicillin 250mg,Products,Nos,Main Store - RC,50,5.75,,",
];

export const VALID_CORRECTION_TYPES = ["add", "remove", "set"] as const;

export const CORRECTION_TYPE_META = {
  add: {
    label:       "Add Stock",
    icon:        "+",
    color:       "emerald",
    description: "Increase stock — e.g. found missing units, received return",
  },
  remove: {
    label:       "Remove Stock",
    icon:        "−",
    color:       "red",
    description: "Decrease stock — e.g. damaged, expired, theft, write-off",
  },
  set: {
    label:       "Set Exact",
    icon:        "=",
    color:       "blue",
    description: "Override stock to an exact count — use after physical audit",
  },
} as const;