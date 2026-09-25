export type SubscriptionStatus = "Active" | "Trial" | "Expired" | "Cancelled";

export interface CustomerOption {
  id: string;
  name: string;
  company: string;
}

/** A customer subscription. `id` is the subscription number (e.g. SUB-2026-0007). */
export interface SubscriptionDetail {
  id: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  planId: string;
  planName: string;
  /** ISO date, YYYY-MM-DD */
  startDate: string;
  /** ISO date, YYYY-MM-DD */
  expiryDate: string;
  /** Flat discount amount in the plan's currency */
  discount: number;
  notes: string;
  status: SubscriptionStatus;
}

export type SubscriptionPayload = SubscriptionDetail;

export interface SubscriptionFormState {
  customerId: string;
  planId: string;
  startDate: string;
  expiryDate: string;
  discount: number | null;
  notes: string;
}

export type SubscriptionFormErrors = Partial<Record<keyof SubscriptionFormState, string>>;