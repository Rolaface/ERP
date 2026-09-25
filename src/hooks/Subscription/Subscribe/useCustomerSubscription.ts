import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeRecurringTotal } from "../Plan/useplan";
import { showValidationError } from "../../../utils/alert";
import type { PlanDetail } from "../../../types/Subscription/Plan/plan";
import type {
  CustomerOption,
  SubscriptionDetail,
  SubscriptionFormErrors,
  SubscriptionFormState,
  SubscriptionPayload,
} from "../../../types/Subscription/Subscribe/CustomerSubscription";

/* ─── Constants & helpers ─────────────────────────────────────────────────── */

/** GST applied on (subtotal - discount). Fixed until the backend supplies it. */
export const GST_RATE = 0.18;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const toISODate = (d: Date): string => {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

/** "2026-09-24" -> "24 Sep 2026". Returns "—" for empty / invalid values. */
export const formatDate = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!m) return "—";
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${m[3]} ${month} ${m[1]}` : "—";
};

/** Adds whole months, clamping the day (31 Jan + 1 month = 28/29 Feb). */
export const addMonths = (iso: string, months: number): string => {
  const [y, m, d] = (iso ?? "").split("-").map(Number);
  if (!y || !m || !d) return "";
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  return toISODate(target);
};

export const getBillingMonths = (plan: PlanDetail): number => {
  switch (plan.billingFrequency) {
    case "Monthly":
      return 1;
    case "Quarterly":
      return 3;
    case "Yearly":
      return 12;
    default:
      return plan.customIntervalMonths && plan.customIntervalMonths > 0 ? plan.customIntervalMonths : 1;
  }
};

export const getRenewalLabel = (plan: PlanDetail): string => {
  if (plan.renewalMode === "AutoRenew") return "Auto-renew Continuously";
  if (plan.renewalMode === "FixedCycles") return `Fixed ${plan.billingCycles ?? "-"} Cycles`;
  return String(plan.renewalMode);
};

export interface Pricing {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export const computePricing = (plan: PlanDetail | null, discountInput: number | null): Pricing => {
  const subtotal = plan ? computeRecurringTotal(plan) : 0;
  const discount = Math.min(Math.max(discountInput ?? 0, 0), subtotal);
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * GST_RATE * 100) / 100;
  return { subtotal, discount, tax, total: taxable + tax };
};

export const nextSubscriptionNumber = (existing: SubscriptionDetail[]): string => {
  const year = new Date().getFullYear();
  const maxSeq = existing.reduce((max, s) => {
    const m = /^SUB-\d{4}-(\d+)$/.exec(s.id);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  return `SUB-${year}-${String(maxSeq + 1).padStart(4, "0")}`;
};

const buildInitial = (init?: SubscriptionDetail | null): SubscriptionFormState =>
  init
    ? {
        customerId: init.customerId,
        planId: init.planId,
        startDate: init.startDate,
        expiryDate: init.expiryDate,
        discount: init.discount || null,
        notes: init.notes,
      }
    : {
        customerId: "",
        planId: "",
        startDate: toISODate(new Date()),
        expiryDate: "",
        discount: null,
        notes: "",
      };

/* ─── Hook ────────────────────────────────────────────────────────────────── */

interface UseSubscriptionFormArgs {
  isOpen: boolean;
  isEditMode: boolean;
  initialData?: SubscriptionDetail | null;
  plans: PlanDetail[];
  customers: CustomerOption[];
  suggestedNumber: string;
  onSubmit: (data: unknown) => Promise<boolean> | boolean;
  onClose: () => void;
}

export function useSubscriptionForm({
  isOpen,
  isEditMode,
  initialData,
  plans,
  customers,
  suggestedNumber,
  onSubmit,
  onClose,
}: UseSubscriptionFormArgs) {
  const [form, setForm] = useState<SubscriptionFormState>(() => buildInitial(null));
  const [errors, setErrors] = useState<SubscriptionFormErrors>({});
  const [loading, setLoading] = useState(false);

  const baselineRef = useRef(JSON.stringify(buildInitial(null)));
  // Once the user edits Expiry by hand we stop auto-filling it.
  const expiryTouched = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const next = buildInitial(isEditMode ? initialData : null);
    baselineRef.current = JSON.stringify(next);
    expiryTouched.current = isEditMode;
    setForm(next);
    setErrors({});
  }, [isOpen, isEditMode, initialData]);

  const isDirty = JSON.stringify(form) !== baselineRef.current;

  const selectedPlan = useMemo(() => plans.find((p) => p.id === form.planId) ?? null, [plans, form.planId]);
  const pricing = useMemo(() => computePricing(selectedPlan, form.discount), [selectedPlan, form.discount]);

  const setField = useCallback(
    <K extends keyof SubscriptionFormState>(key: K, value: SubscriptionFormState[K]) => {
      if (key === "expiryDate") expiryTouched.current = true;
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if ((key === "planId" || key === "startDate") && !expiryTouched.current) {
          const plan = plans.find((p) => p.id === next.planId);
          if (plan && next.startDate) next.expiryDate = addMonths(next.startDate, getBillingMonths(plan));
        }
        return next;
      });
    },
    [plans],
  );

  const reset = useCallback(() => {
    setForm(buildInitial(null));
    setErrors({});
  }, []);

  const validate = (): boolean => {
    const next: SubscriptionFormErrors = {};
    if (!form.customerId) next.customerId = "Customer is required";
    if (!form.planId) next.planId = "Plan is required";
    if (!form.startDate) next.startDate = "Start date is required";
    if (!form.expiryDate) next.expiryDate = "Expiry date is required";
    else if (form.startDate && form.expiryDate <= form.startDate) {
      next.expiryDate = "Expiry must be after the start date";
    }
    if (form.discount !== null && form.discount < 0) next.discount = "Discount cannot be negative";
    else if (selectedPlan && (form.discount ?? 0) > pricing.subtotal) {
      next.discount = "Discount cannot exceed the plan price";
    }
    setErrors(next);
    const first = Object.values(next).find(Boolean);
    if (first) showValidationError(first);
    return !first;
  };

  const handleSubmitInternal = async (): Promise<boolean> => {
    if (loading) return false;
    if (!validate() || !selectedPlan) return false;
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer) return false;

    const payload: SubscriptionPayload = {
      id: isEditMode && initialData ? initialData.id : suggestedNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerCompany: customer.company,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      startDate: form.startDate,
      expiryDate: form.expiryDate,
      discount: pricing.discount,
      notes: form.notes.trim(),
      status:
        isEditMode && initialData
          ? initialData.status
          : selectedPlan.freeTrial && selectedPlan.trialDays
            ? "Trial"
            : "Active",
    };

    setLoading(true);
    try {
      const ok = await onSubmit(payload);
      if (ok) onClose();
      return ok;
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    errors,
    loading,
    isDirty,
    selectedPlan,
    pricing,
    setField,
    reset,
    handleSubmitInternal,
  };
}