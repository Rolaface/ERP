import type { TermSection } from "./termsAndCondition";

// ─── API RESPONSE SHAPES ──────────────────────────────────────────────────────

export interface CustomerContact {
  id?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  salutation?: string;
  gender?: string;
  companyName?: string;
  status?: string;           // "Active" | "Passive"
  email: string;
  mobile: string;
  phone?: string;
  designation?: string;
  department?: string;
  isPrimary: boolean;
  isBilling: boolean;
}

export interface CustomerAddress {
  id?: string;
  type: "Billing" | "Shipping" | string;
  line1: string;
  line2?: string;
  city?: string;
  county?: string | null;    // district / county — may be null
  state?: string;
  postalCode?: string;
  country?: string;
  isPrimary?: boolean;
  isShipping?: boolean;
}

export interface CustomerTermsPhase {
  id?: string;
  name: string;
  percentage: number | string;
  condition?: string;
  credit_days?: number | string;
}

export interface CustomerTermsPayment {
  phases: CustomerTermsPhase[];
  dueDates?: string;
  lateCharges?: string;
  taxes?: string;
  notes?: string;
}

export interface SellingTerms {
  general?: string;
  delivery?: string;
  cancellation?: string;
  warranty?: string;
  liability?: string;
  payment: CustomerTermsPayment;
}

// ─── SUMMARY (used in list views / sidebar) ───────────────────────────────────

export interface CustomerSummary {
  id: string;
  name: string;                    // API sends `name` (not displayName)
  tpin?: string;
  customerTaxCategory?: string;    // API field name (not taxCategory)
  displayName?: string;            // legacy / form field
  type?: "" | "Company" | "Individual";
  customerGroup?: string;
  accountNumber?: string;
  currency?: string;
  onboardingBalance?: number;
  status?: "Active" | "Inactive" | string;
  createdAt?: string;              // API timestamp

  /** @deprecated use contacts[] instead */
  contactPerson?: string;
  /** @deprecated use contacts[] instead */
  mobileCode?: string;
  /** @deprecated use contacts[] instead */
  mobile?: string;
  /** @deprecated use contacts[] instead */
  email?: string;
  /** @deprecated */
  dateOfAddition?: string;
}

// ─── DETAIL (from GET /customer/:id) ─────────────────────────────────────────

export interface CustomerDetail extends CustomerSummary {
  // Structured arrays (new API shape)
  contacts?: CustomerContact[];
  addresses?: CustomerAddress[];

  // terms — API sends terms.Selling (capital S)
  terms?: {
    Selling?: SellingTerms;   // capital S — what API actually sends
    selling?: SellingTerms;   // lowercase — kept for legacy compat
  };

  // Legacy flat address fields (old API / form compat)
  /** @deprecated use addresses[] */
  billingAddressLine1?: string;
  /** @deprecated use addresses[] */
  billingAddressLine2?: string;
  /** @deprecated use addresses[] */
  billingPostalCode?: string;
  /** @deprecated use addresses[] */
  billingCity?: string;
  /** @deprecated use addresses[] */
  billingState?: string;
  /** @deprecated use addresses[] */
  billingCountry?: string;
  /** @deprecated use addresses[] */
  shippingAddressLine1?: string;
  /** @deprecated use addresses[] */
  shippingAddressLine2?: string;
  /** @deprecated use addresses[] */
  shippingPostalCode?: string;
  /** @deprecated use addresses[] */
  shippingCity?: string;
  /** @deprecated use addresses[] */
  shippingState?: string;
  /** @deprecated use addresses[] */
  shippingCountry?: string;
}