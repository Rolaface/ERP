export type PlanProductCode = "ERP" | "LMS" | "LOS";
export type PlanStatus = "Draft" | "Active" | "Archived";
export type PlanBillingFrequency =
  | "Monthly"
  | "Quarterly"
  | "Half-Yearly"
  | "Yearly"
  | "Custom";
export type PlanPricingModel = "Flat" | "PerModule";
export type PlanRenewalMode = "AutoRenew" | "FixedCycles";

export interface PlanDetail {
  id: string;
  name: string;
  description: string;
  status: PlanStatus;
  products: PlanProductCode[];
  moduleIds: string[];
  billingFrequency: PlanBillingFrequency;
  customIntervalMonths: number | null;
  pricingModel: PlanPricingModel;
  currency: string;
  basePrice: number | null;
  setupFee: number | null;
  modulePrices: Record<string, number | null>;
  freeTrial: boolean;
  trialDays: number | null;
  renewalMode: PlanRenewalMode;
  billingCycles: number | null;
  userLimit: number | null;
}

/** What the modal hands to the page on submit. */
export type PlanPayload = PlanDetail;

export interface PlanModuleCount {
  product: PlanProductCode;
  selected: number;
  total: number;
}

// ─── Catalog types ───────────────────────────────────────────────────────────
export interface PlanModuleDef {
  id: string;
  label: string;
  description?: string;
  subModules: string[];
}

export interface PlanProductDef {
  code: PlanProductCode;
  name: string;
  modules: PlanModuleDef[];
}

// ─── Modal form types ────────────────────────────────────────────────────────
export type PlanTab = "basic" | "modules" | "pricing" | "trial";

export interface PlanFormState {
  planCode: string;
  name: string;
  description: string;
  status: PlanStatus;
  products: PlanProductCode[];
  moduleIds: string[];
  billingFrequency: PlanBillingFrequency;
  customIntervalMonths: number | null;
  pricingModel: PlanPricingModel;
  currency: string;
  basePrice: number | null;
  setupFee: number | null;
  modulePrices: Record<string, number | null>;
  freeTrial: boolean;
  trialDays: number | null;
  renewalMode: PlanRenewalMode;
  billingCycles: number | null;
  userLimit: number | null;
}

export interface PlanFormErrors {
  products?: string;
  name?: string;
  planCode?: string;
  modules?: string;
  currency?: string;
  basePrice?: string;
  customIntervalMonths?: string;
  modulePrices?: Record<string, string>;
  trialDays?: string;
  billingCycles?: string;
  userLimit?: string;
}

export type PlanFieldSetter = <K extends keyof PlanFormState>(
  name: K,
  value: PlanFormState[K],
) => void;