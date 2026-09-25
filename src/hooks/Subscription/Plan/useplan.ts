import { useEffect, useMemo, useRef, useState } from "react";
import { showApiError, showSuccess, showValidationError } from "../../../utils/alert";
import type { ModalSubmitHandler } from "../../../types/modal";
import type {
  PlanBillingFrequency,
  PlanDetail,
  PlanFieldSetter,
  PlanFormErrors,
  PlanFormState,
  PlanModuleCount,
  PlanModuleDef,
  PlanPayload,
  PlanPricingModel,
  PlanProductCode,
  PlanProductDef,
  PlanRenewalMode,
  PlanStatus,
  PlanTab,
} from "../../../types/Subscription/Plan/plan";

/* ════════════════════════════════════════════════════════════════════════════
   CATALOG — hardcoded product → module → sub-module list
   - "Settings" and each module's "Dashboard" tab are NOT listed.
   - ERP's "Lending" / "Loan Origination" are entry points to LMS / LOS, not ERP modules.
   - `subModules: []` = list not provided yet; fill in later, nothing else changes.
   ════════════════════════════════════════════════════════════════════════════ */

export const PLAN_CATALOG: PlanProductDef[] = [
  {
    code: "ERP",
    name: "Enterprise Resource Planning",
    modules: [
      {
        id: "ERP.sales",
        label: "Sales",
        subModules: ["Sales Order", "Quotations", "Proforma Invoice", "Invoices", "Credit Notes", "Sales Debit Notes", "Reports", "Sales Analytics", "PDC"],
      },
      {
        id: "ERP.customer",
        label: "Customer",
        subModules: ["Customer", "Customer Payment", "Customer Group", "Reports"],
      },
      {
        id: "ERP.procurement",
        label: "Procurement",
        subModules: ["Supplier", "Supplier Payment", "RFQs", "Purchase Orders", "Purchase Invoice", "Import PI", "Debit Notes", "Purchase Analytics", "PI BarCode"],
      },
      {
        id: "ERP.inventory",
        label: "Inventory",
        subModules: ["Items", "Imported Items", "Item Group", "Warehouse", "Stock"],
      },
      {
        id: "ERP.accounting",
        label: "Accounting",
        subModules: ["General Ledger", "Trial Balance", "Receivables", "Payables", "Profit & Loss", "Balance Sheet", "Cash Flow"],
      },
      {
        id: "ERP.assets",
        label: "Assets",
        subModules: ["Asset Category", "Asset", "Asset Movement"],
      },
      {
        id: "ERP.hr",
        label: "Human Resources",
        subModules: ["Employee Management", "Leave Management", "Timesheet & Attendance", "Performance & Growth", "Payroll", "HR Setup"],
      },
      {
        id: "ERP.expense",
        label: "Expense Management",
        subModules: ["Expense Type", "Expense Claim", "Employee Advance", "Expense Payment"],
      },
    ],
  },
  {
    code: "LMS",
    name: "Loan Management System",
    modules: [
      { id: "LMS.customer", label: "Customer", subModules: ["Customer"] },
      { id: "LMS.collateral", label: "Collateral", subModules: ["Collateral Type", "Collateral"] },
      {
        id: "LMS.lendingSetup",
        label: "Lending Setup",
        subModules: [
          "Loan Category",
          "Loan Classification",
          "Collection Sequence",
          "Fee and Charges",
          "Loan Product",
          "Contract Templates",
          "Map Loan Products",
          "Lending Configuration",
        ],
      },
      {
        id: "LMS.lendingOperations",
        label: "Lending Operations",
        subModules: [
          "Loan Booking",
          "Loan Disbursement",
          "Loan Repayment",
          "Loan Waiver",
          "Loan Capitalization",
          "Loan Restructure",
          "Loan Write-Off",
          "Loan Transfer",
        ],
      },
      {
        id: "LMS.accounting",
        label: "Accounting",
        subModules: ["General Ledger", "Trial Balance", "Receivable", "Payable", "Profit & Loss", "Balance Sheet", "Cash Flow"],
      },
      {
        id: "LMS.lendingReports",
        label: "Lending Reports",
        subModules: ["Loan Statement", "Arrear Reports", "Repayment Schedule"],
      },
    ],
  },
  {
    code: "LOS",
    name: "Loan Origination System",
    modules: [
      { id: "LOS.customer", label: "Customer", subModules: ["Customer"] },
      { id: "LOS.collateral", label: "Collateral", subModules: ["Collateral Type", "Collateral"] },
      {
        id: "LOS.originationSetup",
        label: "Origination Setup",
        subModules: ["Workflow Configuration", "Pre-Screening", "Eligibility Rules & Formula", "Loan Product Assignment"],
      },
      {
        id: "LOS.origination",
        label: "Origination",
        subModules: ["Loan Application", "Prescreening", "Loan Appraisal", "Underwriting", "Offer Issuance"],
      },
      {
        id: "LOS.accounting",
        label: "Accounting",
        subModules: ["General Ledger", "Trial Balance", "Receivable", "Payable", "Profit & Loss", "Balance Sheet", "Cash Flow"],
      },
    ],
  },
];

export const PLAN_PRODUCT_CODES: PlanProductCode[] = PLAN_CATALOG.map((p) => p.code);

const MODULE_INDEX = new Map<string, { product: PlanProductCode; def: PlanModuleDef; order: number }>();
(() => {
  let order = 0;
  PLAN_CATALOG.forEach((p) =>
    p.modules.forEach((def) => MODULE_INDEX.set(def.id, { product: p.code, def, order: order++ })),
  );
})();

export const getProductDef = (code: PlanProductCode): PlanProductDef =>
  PLAN_CATALOG.find((p) => p.code === code) as PlanProductDef;
export const getModuleDef = (id: string): PlanModuleDef | undefined => MODULE_INDEX.get(id)?.def;
export const getProductOfModule = (id: string): PlanProductCode | undefined =>
  MODULE_INDEX.get(id)?.product;
export const getProductModuleIds = (code: PlanProductCode): string[] =>
  getProductDef(code).modules.map((m) => m.id);
const getModuleOrder = (id: string): number =>
  MODULE_INDEX.get(id)?.order ?? Number.MAX_SAFE_INTEGER;



export const BILLING_FREQUENCY_OPTIONS: { label: string; value: PlanBillingFrequency }[] = [
  { label: "Monthly", value: "Monthly" },
  { label: "Quarterly", value: "Quarterly" },
  { label: "Half-Yearly", value: "Half-Yearly" },
  { label: "Yearly", value: "Yearly" },
  { label: "Custom", value: "Custom" },
];

export const RENEWAL_MODE_OPTIONS: { label: string; value: PlanRenewalMode }[] = [
  { label: "Auto-renew", value: "AutoRenew" },
  { label: "Fixed cycles", value: "FixedCycles" },
];

export const PRICING_MODEL_LABEL: Record<PlanPricingModel, string> = {
  Flat: "Flat Pricing",
  PerModule: "Per Module Pricing",
};

export const formatMoney = (amount: number, currency?: string): string => {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(safe);
    } catch {
      // unknown currency code → plain number + code below
    }
  }
  const plain = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(safe);
  return currency ? `${currency} ${plain}` : plain;
};

export const getBillingSuffix = (f: PlanBillingFrequency, customMonths?: number | null): string => {
  switch (f) {
    case "Monthly": return "/mo";
    case "Quarterly": return "/qtr";
    case "Half-Yearly": return "/6mo";
    case "Yearly": return "/yr";
    default: return customMonths ? `/${customMonths}mo` : "/cycle";
  }
};

export const getBillingLabel = (f: PlanBillingFrequency, customMonths?: number | null): string =>
  f === "Custom" && customMonths ? `Every ${customMonths} months` : f;

export const computeRecurringTotal = (
  plan: Pick<PlanDetail, "pricingModel" | "basePrice" | "moduleIds" | "modulePrices">,
): number => {
  const total =
    plan.pricingModel === "PerModule"
      ? plan.moduleIds.reduce((sum, id) => sum + (plan.modulePrices[id] ?? 0), 0)
      : (plan.basePrice ?? 0);
  return Math.round(total * 100) / 100;
};

export const countModulesByProduct = (
  products: PlanProductCode[],
  moduleIds: string[],
): PlanModuleCount[] =>
  PLAN_CATALOG.filter((p) => products.includes(p.code)).map((p) => ({
    product: p.code,
    selected: moduleIds.filter((id) => getProductOfModule(id) === p.code).length,
    total: p.modules.length,
  }));

export const suggestPlanCode = (
  products: PlanProductCode[],
  year: number = new Date().getFullYear(),
): string => (products.length ? `${products.join("-")}-${year}` : "");

export const describeTrial = (freeTrial: boolean, days: number | null): string =>
  freeTrial && days ? `${days} Days Free Trial` : "No Trial";

export const describeRenewal = (mode: PlanRenewalMode, cycles: number | null): string =>
  mode === "AutoRenew" ? "Auto-renew" : `Fixed (${cycles ?? "—"} Cycles)`;



export const PLAN_TABS: PlanTab[] = ["basic", "modules", "pricing", "trial"];

export const DEFAULT_PLAN_STATUS: PlanStatus = "Draft";

const PLAN_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,39}$/;

export const createEmptyForm = (): PlanFormState => ({
  planCode: "",
  name: "",
  description: "",
  status: DEFAULT_PLAN_STATUS,
  products: [],
  moduleIds: [],
  billingFrequency: "Monthly",
  customIntervalMonths: null,
  pricingModel: "Flat",
  currency: "",
  basePrice: null,
  setupFee: null,
  modulePrices: {},
  freeTrial: false,
  trialDays: null,
  renewalMode: "AutoRenew",
  billingCycles: null,
  userLimit: null,
});

const mapPlanToFormState = (plan: PlanDetail): PlanFormState => ({
  planCode: plan.id,
  name: plan.name ?? "",
  description: plan.description ?? "",
  status: plan.status,
  products: [...plan.products],
  moduleIds: [...plan.moduleIds],
  billingFrequency: plan.billingFrequency,
  customIntervalMonths: plan.customIntervalMonths ?? null,
  pricingModel: plan.pricingModel,
  currency: plan.currency ?? "",
  basePrice: plan.basePrice ?? null,
  setupFee: plan.setupFee ?? null,
  modulePrices: { ...(plan.modulePrices ?? {}) },
  freeTrial: !!plan.freeTrial,
  trialDays: plan.trialDays ?? null,
  renewalMode: plan.renewalMode,
  billingCycles: plan.billingCycles ?? null,
  userLimit: plan.userLimit ?? null,
});


export const getActiveModuleIds = (form: PlanFormState): string[] =>
  Array.from(new Set(form.moduleIds))
    .filter((id) => {
      const p = getProductOfModule(id);
      return !!p && form.products.includes(p);
    })
    .sort((a, b) => getModuleOrder(a) - getModuleOrder(b));


const buildPlanPayload = (form: PlanFormState): PlanPayload => {
  const products = PLAN_PRODUCT_CODES.filter((c) => form.products.includes(c));
  const moduleIds = getActiveModuleIds(form);
  const perModule = form.pricingModel === "PerModule";

  const modulePrices: Record<string, number | null> = {};
  if (perModule) moduleIds.forEach((id) => (modulePrices[id] = form.modulePrices[id] ?? null));

  return {
    id: form.planCode.trim().toUpperCase() || suggestPlanCode(products),
    name: form.name.trim(),
    description: form.description.trim(),
    status: form.status,
    products,
    moduleIds,
    billingFrequency: form.billingFrequency,
    customIntervalMonths: form.billingFrequency === "Custom" ? form.customIntervalMonths : null,
    pricingModel: form.pricingModel,
    currency: form.currency,
    basePrice: perModule ? null : form.basePrice,
    setupFee: form.setupFee ?? 0,
    modulePrices,
    freeTrial: form.freeTrial,
    trialDays: form.freeTrial ? form.trialDays : null,
    renewalMode: form.renewalMode,
    billingCycles: form.renewalMode === "FixedCycles" ? form.billingCycles : null,
    userLimit: form.userLimit,
  };
};

/** Module selection for a tab reset: baseline modules for known products, all for newly added ones. */
const reconcileModules = (products: PlanProductCode[], baseline: PlanFormState): string[] =>
  products.flatMap((code) =>
    baseline.products.includes(code)
      ? baseline.moduleIds.filter((id) => getProductOfModule(id) === code)
      : getProductModuleIds(code),
  );

const isWhole = (n: number | null): n is number => n !== null && Number.isInteger(n);

const validatePlanTab = (tab: PlanTab, form: PlanFormState): PlanFormErrors => {
  const errors: PlanFormErrors = {};

  if (tab === "basic") {
    if (form.products.length === 0) errors.products = "Select at least one product";
    const name = form.name.trim();
    if (!name) errors.name = "Plan name is required";
    else if (name.length > 100) errors.name = "Plan name must be 100 characters or fewer";
    const code = form.planCode.trim().toUpperCase();
    if (code && !PLAN_CODE_PATTERN.test(code)) {
      errors.planCode = "Use 3–40 letters, numbers, hyphens or underscores";
    }
  }

  if (tab === "modules") {
    if (form.products.length === 0) {
      errors.modules = "Select a product in Basic Information first";
    } else {
      const active = getActiveModuleIds(form);
      const missing = PLAN_CATALOG.filter(
        (p) => form.products.includes(p.code) && !active.some((id) => getProductOfModule(id) === p.code),
      ).map((p) => p.code);
      if (missing.length) errors.modules = `Select at least one module for ${missing.join(", ")}`;
    }
  }

  if (tab === "pricing") {
    if (!form.currency) errors.currency = "Currency is required";
    if (form.billingFrequency === "Custom") {
      const n = form.customIntervalMonths;
      if (!isWhole(n) || n < 1 || n > 120) errors.customIntervalMonths = "Enter whole months between 1 and 120";
    }
    if (form.pricingModel === "Flat") {
      if (form.basePrice === null) errors.basePrice = "Base price is required";
    } else {
      const missing: Record<string, string> = {};
      getActiveModuleIds(form).forEach((id) => {
        if (form.modulePrices[id] === null || form.modulePrices[id] === undefined) missing[id] = "Required";
      });
      if (Object.keys(missing).length) errors.modulePrices = missing;
    }
  }

  if (tab === "trial") {
    if (form.freeTrial) {
      const d = form.trialDays;
      if (!isWhole(d) || d < 1 || d > 365) errors.trialDays = "Enter trial days between 1 and 365";
    }
    if (form.renewalMode === "FixedCycles") {
      const c = form.billingCycles;
      if (!isWhole(c) || c < 1) errors.billingCycles = "Enter a whole number of cycles (min 1)";
    }
  }
  return errors;
};

const collectMessages = (errors: PlanFormErrors): string[] => {
  const out: string[] = [];
  (Object.keys(errors) as (keyof PlanFormErrors)[]).forEach((key) => {
    const v = errors[key];
    if (!v) return;
    if (key === "modulePrices") {
      if (Object.keys(v as object).length) out.push("Enter a price for every module");
    } else if (typeof v === "string") out.push(v);
  });
  return out;
};
const hasPlanErrors = (e: PlanFormErrors) => collectMessages(e).length > 0;
const getPlanErrorSummary = (e: PlanFormErrors) => {
  const m = collectMessages(e);
  return m.length ? `Please fix: ${m.join("; ")}` : "Please fix the highlighted fields";
};



export interface UsePlanFormOptions {
  isOpen: boolean;
  isEditMode: boolean;
  initialData?: PlanDetail | null;
  onSubmit?: ModalSubmitHandler;
  onClose: () => void;
}

const FIELD_ERROR_KEY: Partial<Record<keyof PlanFormState, keyof PlanFormErrors>> = {
  name: "name",
  planCode: "planCode",
  currency: "currency",
  basePrice: "basePrice",
  customIntervalMonths: "customIntervalMonths",
  trialDays: "trialDays",
  billingCycles: "billingCycles",
  userLimit: "userLimit",
};

export function usePlanForm({ isOpen, isEditMode, initialData, onSubmit, onClose }: UsePlanFormOptions) {
  const [form, setForm] = useState<PlanFormState>(createEmptyForm);
  const [baseline, setBaseline] = useState<PlanFormState>(createEmptyForm);
  const [errors, setErrors] = useState<PlanFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<PlanTab>("basic");
  const submitRef = useRef(false);

  // (Re)initialise when the modal opens or a different plan is passed in.
  useEffect(() => {
    if (!isOpen) return;
    const base = initialData ? mapPlanToFormState(initialData) : createEmptyForm();
    setForm(base);
    setBaseline(base);
    setErrors({});
    setActiveTab("basic");
    setLoading(false);
  }, [isOpen, initialData]);

  const isDirty = useMemo(
    () => JSON.stringify(buildPlanPayload(form)) !== JSON.stringify(buildPlanPayload(baseline)),
    [form, baseline],
  );

  const suggestedCode = useMemo(() => suggestPlanCode(form.products), [form.products]);
  const effectiveCode = form.planCode.trim().toUpperCase() || suggestedCode;
  const recurringTotal = useMemo(
    () =>
      computeRecurringTotal({
        pricingModel: form.pricingModel,
        basePrice: form.basePrice,
        moduleIds: getActiveModuleIds(form),
        modulePrices: form.modulePrices,
      }),
    [form],
  );

  const clearError = (key: keyof PlanFormErrors) =>
    setErrors((prev) => (prev[key] === undefined ? prev : { ...prev, [key]: undefined }));

  // ── Field handlers ─────────────────────────────────────────────────────────
  const setField: PlanFieldSetter = (name, value) => {
    setForm((prev) => (Object.is(prev[name], value) ? prev : { ...prev, [name]: value }));
    const errKey = FIELD_ERROR_KEY[name];
    if (errKey) clearError(errKey);
  };

  const toggleProduct = (code: PlanProductCode, checked: boolean) => {
    setForm((prev) => {
      if (prev.products.includes(code) === checked) return prev;
      const products = PLAN_PRODUCT_CODES.filter((c) => (c === code ? checked : prev.products.includes(c)));
      const moduleIds = checked
        ? Array.from(new Set([...prev.moduleIds, ...getProductModuleIds(code)]))
        : prev.moduleIds.filter((id) => getProductOfModule(id) !== code);
      return { ...prev, products, moduleIds };
    });
    clearError("products");
    clearError("modules");
  };

  const toggleModule = (id: string) => {
    setForm((prev) => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(id) ? prev.moduleIds.filter((m) => m !== id) : [...prev.moduleIds, id],
    }));
    clearError("modules");
  };

  const selectAllModules = () => {
    setForm((prev) => ({ ...prev, moduleIds: prev.products.flatMap((c) => getProductModuleIds(c)) }));
    clearError("modules");
  };

  const clearAllModules = () => setForm((prev) => ({ ...prev, moduleIds: [] }));

  const setModulePrice = (id: string, value: number | null) => {
    setForm((prev) =>
      Object.is(prev.modulePrices[id], value)
        ? prev
        : { ...prev, modulePrices: { ...prev.modulePrices, [id]: value } },
    );
    setErrors((prev) => {
      if (!prev.modulePrices?.[id]) return prev;
      const { [id]: _removed, ...rest } = prev.modulePrices;
      return { ...prev, modulePrices: Object.keys(rest).length ? rest : undefined };
    });
  };

  // ── Navigation / validation ────────────────────────────────────────────────
  const handleNext = () => {
    const next = validatePlanTab(activeTab, form);
    setErrors(next);
    if (hasPlanErrors(next)) {
      showValidationError(getPlanErrorSummary(next));
      return;
    }
    const idx = PLAN_TABS.indexOf(activeTab);
    if (idx < PLAN_TABS.length - 1) setActiveTab(PLAN_TABS[idx + 1]);
  };

  const validateAllTabs = (): boolean => {
    for (const tab of PLAN_TABS) {
      const tabErrors = validatePlanTab(tab, form);
      if (hasPlanErrors(tabErrors)) {
        setErrors(tabErrors);
        setActiveTab(tab);
        showValidationError(getPlanErrorSummary(tabErrors));
        return false;
      }
    }
    return true;
  };

  const handleSubmitInternal = async (): Promise<boolean> => {
    if (submitRef.current || loading) return false;
    if (!validateAllTabs()) return false;

    if (isEditMode && !isDirty) {
      showSuccess("No changes detected");
      return false;
    }

    submitRef.current = true;
    setLoading(true);
    try {
      const canClose = await onSubmit?.(buildPlanPayload(form));
      if (canClose === false) return false; // parent rejected (e.g. duplicate code) → stay open
      onClose();
      return true;
    } catch (error) {
      showApiError(error);
      return false;
    } finally {
      setLoading(false);
      submitRef.current = false;
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setForm(baseline);
    setErrors({});
    setActiveTab("basic");
  };

  const resetCurrentTab = () => {
    setErrors({});
    setForm((prev) => {
      switch (activeTab) {
        case "basic":
          // modules depend on the product selection, so they are restored together
          return {
            ...prev,
            planCode: baseline.planCode,
            name: baseline.name,
            description: baseline.description,
            status: baseline.status,
            products: baseline.products,
            moduleIds: baseline.moduleIds,
          };
        case "modules":
          return { ...prev, moduleIds: reconcileModules(prev.products, baseline) };
        case "pricing":
          return {
            ...prev,
            billingFrequency: baseline.billingFrequency,
            customIntervalMonths: baseline.customIntervalMonths,
            pricingModel: baseline.pricingModel,
            currency: baseline.currency,
            basePrice: baseline.basePrice,
            setupFee: baseline.setupFee,
            modulePrices: baseline.modulePrices,
          };
        default:
          return {
            ...prev,
            freeTrial: baseline.freeTrial,
            trialDays: baseline.trialDays,
            renewalMode: baseline.renewalMode,
            billingCycles: baseline.billingCycles,
          };
      }
    });
  };

  return {
    form, errors, loading, activeTab, setActiveTab, isDirty,
    suggestedCode, effectiveCode, recurringTotal,
    setField, toggleProduct, toggleModule, selectAllModules, clearAllModules, setModulePrice,
    handleNext, handleSubmitInternal, reset, resetCurrentTab,
  };
}