import { useCallback, useEffect, useState } from "react";
import {
  getFixedAssetAccounts,
  getAccumulatedDepreciationAccounts,
  getDepreciationExpenseAccounts,
  getCWIPAccounts,
  getFinanceBooks,
  createAssetCategory,
  type AccountOption,
  type FinanceBookOption,
} from "../api/faapi";
import { showApiError, showValidationError, showSuccess } from "../utils/alert";
import { useCompanyStore } from "../store/companyStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinanceBookRow {
  id: string;
  financeBook: string;
  depreciationMethod: string;
  frequencyOfDepreciation: string;
  totalNumberOfDepreciations: string;
  depreciationPostingDate: string;
}

export interface AccountRow {
  id: string;
  company: string; // from Zustand, stored for submission
  fixedAssetAccount: string;
  accumulatedDepreciationAccount: string;
  depreciationExpenseAccount: string;
  capitalWorkInProgressAccount: string;
}

export interface AssetCategoryForm {
  assetCategoryName: string;
  enableCapitalWorkInProgress: boolean;
  nonDepreciableCategory: boolean;
  financeBooks: FinanceBookRow[];
  accounts: AccountRow[];
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const makeFinanceBookRow = (): FinanceBookRow => ({
  id: crypto.randomUUID(),
  financeBook: "",
  depreciationMethod: "",
  frequencyOfDepreciation: "",
  totalNumberOfDepreciations: "",
  depreciationPostingDate: "",
});

export const makeAccountRow = (company: string): AccountRow => ({
  id: crypto.randomUUID(),
  company,
  fixedAssetAccount: "",
  accumulatedDepreciationAccount: "",
  depreciationExpenseAccount: "",
  capitalWorkInProgressAccount: "",
});

const makeDefaultForm = (company: string): AssetCategoryForm => ({
  assetCategoryName: "",
  enableCapitalWorkInProgress: false,
  nonDepreciableCategory: false,
  financeBooks: [makeFinanceBookRow()],
  accounts: [makeAccountRow(company)],
});

// ─── Option type (matches SearchSelect2) ─────────────────────────────────────

export type SelectOption = { label: string; value: string };

// ─── Static options (no API needed) ──────────────────────────────────────────

const DEPRECIATION_METHOD_OPTIONS: SelectOption[] = [
  { label: "Straight Line Method", value: "Straight Line Method" },
  { label: "Double Declining Balance", value: "Double Declining Balance" },
  { label: "Written Down Value", value: "Written Down Value" },
  { label: "Manual", value: "Manual" },
];

const FREQUENCY_OPTIONS: SelectOption[] = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "6", value: "6" },
  { label: "12", value: "12" },
];

const POSTING_DATE_OPTIONS: SelectOption[] = [
  { label: "1", value: "1" },
  { label: "15", value: "15" },
  { label: "Last Day of Month", value: "Last Day of Month" },
];

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: AssetCategoryForm): string | null {
  if (!form.assetCategoryName.trim())
    return "Asset Category Name is required.";
  return null;
}

// ─── fetchOptions helpers (called on-demand by SearchSelect2) ─────────────────
// Each fn accepts a search string and filters the API result client-side.
// The actual API call happens once per open (no search param sent to server).

function makeFetcher(
  apiFn: () => Promise<SelectOption[]>
): (q: string) => Promise<SelectOption[]> {
  return async (q: string) => {
    const all = await apiFn();
    if (!q) return all;
    const lower = q.toLowerCase();
    return all.filter((o) => o.label.toLowerCase().includes(lower));
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFALogic(
  isOpen: boolean,
  onSubmit?: (data: AssetCategoryForm) => Promise<void>,
  onClose?: () => void
) {
  // ── Company from Zustand ───────────────────────────────────────────────────
  const companyName = useCompanyStore((s) => s.companyName);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<AssetCategoryForm>(() =>
    makeDefaultForm(companyName)
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Reset form when modal opens ────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setForm(makeDefaultForm(companyName));
    setIsDirty(false);
  }, [isOpen]);

  // ── fetchOptions — called by SearchSelect2 on focus/click ─────────────────
  // These are stable references so SearchSelect2 doesn't re-render on every form change.
  const fetchFinanceBooks = useCallback(
    makeFetcher(getFinanceBooks),
    []
  );

  const fetchFixedAssetAccounts = useCallback(
    makeFetcher(getFixedAssetAccounts),
    []
  );

  const fetchAccumulatedDepAccounts = useCallback(
    makeFetcher(getAccumulatedDepreciationAccounts),
    []
  );

  const fetchDepExpenseAccounts = useCallback(
    makeFetcher(getDepreciationExpenseAccounts),
    []
  );

  const fetchCWIPAccounts = useCallback(
    makeFetcher(getCWIPAccounts),
    []
  );

  // Static options fetchers (no API)
  const fetchDepreciationMethods = useCallback(
    async (q: string) => {
      if (!q) return DEPRECIATION_METHOD_OPTIONS;
      const lower = q.toLowerCase();
      return DEPRECIATION_METHOD_OPTIONS.filter((o) =>
        o.label.toLowerCase().includes(lower)
      );
    },
    []
  );

  const fetchFrequencyOptions = useCallback(
    async (q: string) => {
      if (!q) return FREQUENCY_OPTIONS;
      return FREQUENCY_OPTIONS.filter((o) => o.label.includes(q));
    },
    []
  );

  const fetchPostingDateOptions = useCallback(
    async (q: string) => {
      if (!q) return POSTING_DATE_OPTIONS;
      const lower = q.toLowerCase();
      return POSTING_DATE_OPTIONS.filter((o) =>
        o.label.toLowerCase().includes(lower)
      );
    },
    []
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  const markDirty = () => setIsDirty(true);

  const patch = useCallback((p: Partial<AssetCategoryForm>) => {
    setForm((prev) => ({ ...prev, ...p }));
    markDirty();
  }, []);

  const reset = useCallback(() => {
    setForm(makeDefaultForm(companyName));
    setIsDirty(false);
  }, [companyName]);

  // ── Finance book row ops ───────────────────────────────────────────────────
  const addFinanceRow = useCallback(() => {
    setForm((p) => ({
      ...p,
      financeBooks: [...p.financeBooks, makeFinanceBookRow()],
    }));
    markDirty();
  }, []);

  const removeFinanceRow = useCallback((id: string) => {
    setForm((p) => ({
      ...p,
      financeBooks: p.financeBooks.filter((r) => r.id !== id),
    }));
    markDirty();
  }, []);

  const changeFinanceRow = useCallback(
    (id: string, field: keyof FinanceBookRow, value: string) => {
      setForm((p) => ({
        ...p,
        financeBooks: p.financeBooks.map((r) =>
          r.id === id ? { ...r, [field]: value } : r
        ),
      }));
      markDirty();
    },
    []
  );

  // ── Account row ops ────────────────────────────────────────────────────────
  const addAccountRow = useCallback(() => {
    setForm((p) => ({
      ...p,
      accounts: [...p.accounts, makeAccountRow(companyName)],
    }));
    markDirty();
  }, [companyName]);

  const removeAccountRow = useCallback((id: string) => {
    setForm((p) => ({
      ...p,
      accounts: p.accounts.filter((r) => r.id !== id),
    }));
    markDirty();
  }, []);

  const changeAccountRow = useCallback(
    (id: string, field: keyof AccountRow, value: string) => {
      setForm((p) => ({
        ...p,
        accounts: p.accounts.map((r) =>
          r.id === id ? { ...r, [field]: value } : r
        ),
      }));
      markDirty();
    },
    []
  );

  // ── Payload builder ───────────────────────────────────────────────────────
  // Maps internal form shape → API payload shape
  function buildPayload(f: AssetCategoryForm) {
    // Finance book fields are top-level in the API — take from first row
    const fb = f.financeBooks[0];

    return {
      asset_category_name: f.assetCategoryName,
      depreciation_method: fb?.depreciationMethod ?? "",
      total_number_of_depreciations: Number(fb?.totalNumberOfDepreciations ?? 0),
      frequency_of_depreciation: Number(fb?.frequencyOfDepreciation ?? 0),
      is_intangible: f.nonDepreciableCategory ? (1 as const) : (0 as const),
      accounts: f.accounts.map((row) => ({
        company_name: row.company,
        fixed_asset_account: row.fixedAssetAccount,
        accumulated_depreciation_account: row.accumulatedDepreciationAccount,
        depreciation_expense_account: row.depreciationExpenseAccount,
        capital_work_in_progress_account: row.capitalWorkInProgressAccount,
      })),
    };
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (isSaving) return;

    const error = validate(form);
    if (error) {
      showValidationError(error);
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload(form);
      await createAssetCategory(payload);
      // Also call optional parent onSubmit (e.g. to refresh a list)
      await onSubmit?.(form);
      showSuccess("Asset Category saved successfully.");
      setIsDirty(false);
      onClose?.();
    } catch (err: any) {
      showApiError(err);
    } finally {
      setIsSaving(false);
    }
  }, [form, isSaving, onSubmit, onClose]);

  return {
    // State
    form,
    isDirty,
    isSaving,

    // Form ops
    patch,
    reset,

    // Finance book ops
    addFinanceRow,
    removeFinanceRow,
    changeFinanceRow,

    // Account ops
    addAccountRow,
    removeAccountRow,
    changeAccountRow,

    // Submit
    handleSubmit,

    // fetchOptions — pass directly to SearchSelect2
    fetchFinanceBooks,
    fetchFixedAssetAccounts,
    fetchAccumulatedDepAccounts,
    fetchDepExpenseAccounts,
    fetchCWIPAccounts,
    fetchDepreciationMethods,
    fetchFrequencyOptions,
    fetchPostingDateOptions,
  };
}