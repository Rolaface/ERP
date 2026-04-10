import type { TermSection } from "./termsAndCondition";

export interface CustomerSummary {
  id: string;
  tpin: string;
  name: string;
  customerTaxCategory: string;
  displayName: string;
  type: "" | "Company" | "Individual";
  customerGroup: string;
  accountNumber: string;
  currency: string;
  onboardingBalance: number;
  status: "Active" | "Inactive";

  // ── Legacy flat fields (kept for backwards compatibility with old API responses) ──
  /** @deprecated use contacts[] instead */
  contactPerson?: string;
  /** @deprecated use contacts[] instead */
  mobileCode?: string;
  /** @deprecated use contacts[] instead */
  mobile?: string;
  /** @deprecated use contacts[] instead */
  email?: string;
}

// ── Contact ──────────────────────────────────────────────────────────────────

export interface CustomerContact {
  firstName: string;
  lastName: string;
  fullName:string;
  designation: string;
  department: string;
  email: string;
  mobile: string;
  phone: string;
  isPrimary: boolean;
  isBilling: boolean;
}

// ── Address ──────────────────────────────────────────────────────────────────

export interface CustomerAddress {
  type: "Billing" | "Shipping";
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

// ── Terms ────────────────────────────────────────────────────────────────────

export interface CustomerTermsPhase {
  name: string;
  percentage: number;
  condition: string;
}

export interface CustomerTermsPayment {
  phases: CustomerTermsPhase[];
  dueDates: string;
  lateCharges: string;
  taxes: string;
  notes: string;
}

export interface CustomerTerms {
  selling: TermSection;
}

// ── Main ─────────────────────────────────────────────────────────────────────

export interface CustomerDetail extends CustomerSummary {
  // New structured fields
  contacts?: CustomerContact[];
  addresses?: CustomerAddress[];
  terms?: CustomerTerms;

  // ── Legacy flat address fields (backwards compat with old API responses) ──
  /** @deprecated use addresses[] instead */
  billingAddressLine1?: string;
  /** @deprecated use addresses[] instead */
  billingAddressLine2?: string;
  /** @deprecated use addresses[] instead */
  billingPostalCode?: string;
  /** @deprecated use addresses[] instead */
  billingCity?: string;
  /** @deprecated use addresses[] instead */
  billingState?: string;
  /** @deprecated use addresses[] instead */
  billingCountry?: string;
  /** @deprecated use addresses[] instead */
  shippingAddressLine1?: string;
  /** @deprecated use addresses[] instead */
  shippingAddressLine2?: string;
  /** @deprecated use addresses[] instead */
  shippingPostalCode?: string;
  /** @deprecated use addresses[] instead */
  shippingCity?: string;
  /** @deprecated use addresses[] instead */
  shippingState?: string;
  /** @deprecated use addresses[] instead */
  shippingCountry?: string;
}