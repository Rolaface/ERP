import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Lock,
  Paperclip,
  Pencil,
  Plus,
  Receipt,
  Save,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { useCurrencySymbols } from "../../../hooks/Usecurrencysymbols";
import { showApiError, showSuccess } from "../../../utils/alert";

// ─── Types ────────────────────────────────────────────────────────────────────

type Opt = { value: string; label: string };
export type ItemStatus = "Pending" | "Approved" | "Rejected";

export interface BudgetItem {
  id: string;
  category: string;
  account: Opt | null; // GL / expense account (optional, drives variance later)
  includes: string;
  amount: number | ""; // total for the whole financial year
  lastYear: number | ""; // reference for the approver (optional)
  periods: number[]; // amount per period; [] when phasing is "Annual"
  justification: string;
  status: ItemStatus;
}

export interface BudgetPayload {
  title: string;
  budget_type: string;
  financial_year: string;
  budget_level: string; // Company | Branch | Department | Cost Center | Project
  scope_id: string;
  scope_name: string;
  parent_budget_id: string; // higher-level budget this one rolls up into
  phasing: string; // Annual | Monthly | Quarterly | Half-Yearly
  currency: string;
  overspend_action: string; // Warn | Stop | Ignore
  notes: string;
  items: BudgetItem[];
  attachments: File[];
  total: number;
  submit: boolean; // false = save as draft
}

interface CreateBudgetProps {
  onBack: () => void;
  onSaved?: (payload: BudgetPayload) => void;
  preparedBy?: string;
  workflowName?: string; // e.g. "Tier 2 Ledger Policy" – from your workflow config
  defaultCurrency?: string;
  /** Month the financial year starts (1-12). April = 4 (India), January = 1. */
  fyStartMonth?: number;
  /** Pass to pre-fill when you later reuse this screen for edit */
  initial?: Partial<BudgetPayload>;
}

// ─── Static options (nothing here is organisation-specific) ───────────────────

const LEVELS = ["Company", "Branch", "Department", "Cost Center", "Project"];
const TYPES = ["Operational", "Capital", "Revenue", "Project"];
const PHASE_ANNUAL = "Annual (no split)";
const PHASING = [PHASE_ANNUAL, "Monthly", "Quarterly", "Half-Yearly"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];
const OVERSPEND = [
  { value: "Warn", label: "Warn and allow" },
  { value: "Stop", label: "Stop the transaction" },
  { value: "Ignore", label: "Ignore" },
];
// TODO: load from chart of accounts / expense heads
const DEFAULT_CATEGORIES = [
  "Salaries & Benefits",
  "Operations",
  "Technology",
  "Marketing",
  "Travel",
  "Training",
  "Utilities",
  "Equipment",
  "Other",
];
const MAX_FILE_MB = 10;

const buildFinancialYears = () => {
  const y = new Date().getFullYear();
  return [y - 1, y, y + 1].map(
    (s) => `${s}-${String((s + 1) % 100).padStart(2, "0")}`,
  );
};

const filterStatic = (list: (string | Opt)[], search: string): Opt[] =>
  list
    .map((o) => (typeof o === "string" ? { value: o, label: o } : o))
    .filter((o) => o.label.toLowerCase().includes((search || "").toLowerCase()));

const uid = () => Math.random().toString(36).slice(2, 10);

// Labels for each period of the financial year, e.g. Apr…Mar, Q1…Q4, H1/H2
const periodLabels = (phasing: string, fyStartMonth: number): string[] => {
  if (phasing === "Monthly")
    return Array.from({ length: 12 }, (_, i) =>
      new Date(2000, (fyStartMonth - 1 + i) % 12, 1).toLocaleString("en", {
        month: "short",
      }),
    );
  if (phasing === "Quarterly") return ["Q1", "Q2", "Q3", "Q4"];
  if (phasing === "Half-Yearly") return ["H1", "H2"];
  return [];
};

// Even split in paise so the parts always add up exactly to the total
const splitEven = (total: number, n: number): number[] => {
  if (!n) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const arr = Array(n).fill(base);
  arr[n - 1] += cents - base * n;
  return arr.map((c) => c / 100);
};

const STATUS_STYLE: Record<ItemStatus, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary";

// ─── Add / edit item modal ────────────────────────────────────────────────────

interface ItemModalProps {
  initial: BudgetItem | null;
  currency: string;
  labels: string[]; // period labels; empty when phasing is Annual
  onClose: () => void;
  onSave: (item: BudgetItem) => void;
}

const ItemModal: React.FC<ItemModalProps> = ({
  initial,
  currency,
  labels,
  onClose,
  onSave,
}) => {
  const n = labels.length;
  const [category, setCategory] = useState(initial?.category ?? "");
  const [account, setAccount] = useState<Opt | null>(initial?.account ?? null);
  const [includes, setIncludes] = useState(initial?.includes ?? "");
  const [amount, setAmount] = useState<number | "">(initial?.amount ?? "");
  const [lastYear, setLastYear] = useState<number | "">(initial?.lastYear ?? "");
  const [justification, setJustification] = useState(initial?.justification ?? "");
  const [periods, setPeriods] = useState<string[]>(() =>
    initial && initial.periods.length === n
      ? initial.periods.map(String)
      : splitEven(Number(initial?.amount || 0), n).map(String),
  );
  // Once the user edits a period by hand, stop auto-splitting on amount change
  const [manual, setManual] = useState(!!initial && n > 0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fetchCategories = useCallback(
    async (search: string) => filterStatic(DEFAULT_CATEGORIES, search),
    [],
  );
  // TODO: replace with API – GL / expense accounts from your chart of accounts
  const fetchAccounts = useCallback(async (_search: string) => [] as Opt[], []);

  const fmt = (x: number) => `${currency} ${x.toLocaleString()}`;
  const allocated = periods.reduce((s, p) => s + Number(p || 0), 0);
  const diff = Math.round((Number(amount || 0) - allocated) * 100) / 100;
  const balanced = Math.abs(diff) < 0.005;

  const onAmountChange = (v: number | "") => {
    setAmount(v);
    setErrors((p) => ({ ...p, amount: "", periods: "" }));
    if (!manual && n) setPeriods(splitEven(Number(v || 0), n).map(String));
  };

  const resplit = () => {
    setManual(false);
    setPeriods(splitEven(Number(amount || 0), n).map(String));
    setErrors((p) => ({ ...p, periods: "" }));
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (!category) e.category = "Select a category";
    if (!includes.trim()) e.includes = "Describe what this line covers";
    if (amount === "" || Number(amount) <= 0)
      e.amount = "Enter an amount greater than 0";
    if (!justification.trim())
      e.justification = "Add a justification for the approver";
    if (n && !e.amount && !balanced)
      e.periods = `Periods add up to ${fmt(allocated)}, but the amount is ${fmt(Number(amount))}`;
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({
      id: initial?.id ?? uid(),
      category,
      account,
      includes: includes.trim(),
      amount,
      lastYear,
      periods: n ? periods.map((p) => Number(p || 0)) : [],
      justification: justification.trim(),
      status: initial?.status ?? "Pending",
    });
  };

  const gridCols = n === 12 ? "grid-cols-4" : n === 4 ? "grid-cols-4" : "grid-cols-2";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-xl bg-[var(--card,#fff)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-base font-semibold text-main">
            {initial ? "Edit budget item" : "Add budget item"}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-main">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-4 items-start">
            <SearchSelect2
              label="Category"
              required
              value={category}
              onChange={(val) => {
                setCategory(val || "");
                setErrors((p) => ({ ...p, category: "" }));
              }}
              fetchOptions={fetchCategories}
              placeholder="Select category"
              error={errors.category}
            />
            <SearchSelect2
              label="Cost Center"
              value={account?.label ?? ""}
              onChange={(v, opt) => setAccount(v ? { value: v, label: opt?.label || v } : null)}
              fetchOptions={fetchAccounts}
              placeholder="Optional"
            />
          </div>

          <ModalInput
            label="What it includes"
            name="includes"
            value={includes}
            onChange={(e) => {
              setIncludes(e.target.value);
              setErrors((p) => ({ ...p, includes: "" }));
            }}
            error={errors.includes}
            required
            placeholder="For example: laptops, licences, annual maintenance"
          />

          <div className="grid grid-cols-2 gap-4 items-start">
            <ModalInput
              label={`${n ? "Amount" : "Amount"} (${currency || "—"})`}
              name="amount"
              type="number"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value === "" ? "" : Number(e.target.value))}
              error={errors.amount}
              required
              placeholder="0.00"
              className="no-spinner"
            />
          </div>

          {n > 0 && (
            <div className="rounded-lg border border-[var(--border)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted">Split across periods</span>
                <button type="button" onClick={resplit} className="text-xs text-primary hover:underline">
                  Split evenly
                </button>
              </div>
              <div className={`grid gap-2 ${gridCols}`}>
                {labels.map((l, i) => (
                  <div key={l} className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-muted">{l}</label>
                    <input
                      type="number"
                      value={periods[i] ?? ""}
                      onChange={(e) => {
                        setManual(true);
                        setPeriods((prev) => prev.map((p, j) => (j === i ? e.target.value : p)));
                        setErrors((p) => ({ ...p, periods: "" }));
                      }}
                      className={`${inputCls} no-spinner px-2 py-1.5`}
                    />
                  </div>
                ))}
              </div>
              <p className={`mt-2 text-xs ${balanced ? "text-muted" : "text-danger"}`}>
                Allocated {fmt(allocated)} of {fmt(Number(amount || 0))}
                {!balanced && ` (${diff > 0 ? "short" : "over"} by ${fmt(Math.abs(diff))})`}
              </p>
              {errors.periods && <p className="text-[10px] text-danger">{errors.periods}</p>}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Justification <span className="text-danger">*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value);
                setErrors((p) => ({ ...p, justification: "" }));
              }}
              rows={3}
              placeholder="Why is this needed? The approver will read this."
              className={`${inputCls} resize-none`}
            />
            {errors.justification && <span className="text-[10px] text-danger">{errors.justification}</span>}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-main hover:bg-[var(--border)]/20"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {initial ? "Save item" : "Add item"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const CreateBudget: React.FC<CreateBudgetProps> = ({
  onBack,
  onSaved,
  preparedBy = "",
  workflowName,
  defaultCurrency = "INR",
  fyStartMonth = 4,
  initial,
}) => {
  // Header fields
  const [title, setTitle] = useState(initial?.title ?? "");
  const [budgetType, setBudgetType] = useState(initial?.budget_type ?? "Operational");
  const [financialYear, setFinancialYear] = useState(
    initial?.financial_year ?? buildFinancialYears()[1],
  );
  const [level, setLevel] = useState(initial?.budget_level ?? "Department");
  const [scope, setScope] = useState<Opt | null>(
    initial?.scope_id
      ? { value: initial.scope_id, label: initial.scope_name ?? initial.scope_id }
      : null,
  );
  const [parent, setParent] = useState<Opt | null>(null);
  const [phasing, setPhasing] = useState(initial?.phasing ?? "Monthly");
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency);
  const [overspend, setOverspend] = useState(initial?.overspend_action ?? "Warn");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // Items + attachments
  const [items, setItems] = useState<BudgetItem[]>(initial?.items ?? []);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [itemModal, setItemModal] = useState<{ open: boolean; item: BudgetItem | null }>({
    open: false,
    item: null,
  });
  const [files, setFiles] = useState<File[]>(initial?.attachments ?? []);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [dirty, setDirty] = useState(false);

  const touch = (key?: string) => {
    setDirty(true);
    if (key) setErrors((p) => ({ ...p, [key]: "" }));
  };

  const labels = useMemo(() => periodLabels(phasing, fyStartMonth), [phasing, fyStartMonth]);

  // Currency formatting (re-uses your existing hook)
  const currencyCodes = useMemo(() => (currency ? [currency] : []), [currency]);
  const { formatAmount } = useCurrencySymbols(currencyCodes);
  const money = (n: number) =>
    currency ? formatAmount(currency, n, { withSymbol: true }) : n.toLocaleString();

  const total = useMemo(
    () => items.reduce((s, i) => s + Number(i.amount || 0), 0),
    [items],
  );
  const sumBy = (st: ItemStatus) =>
    items.filter((i) => i.status === st).reduce((s, i) => s + Number(i.amount || 0), 0);

  // Option fetchers
  const fetchStatic = (list: (string | Opt)[]) => (search: string) =>
    Promise.resolve(filterStatic(list, search));
  const fetchLevels = useCallback(fetchStatic(LEVELS), []);
  const fetchTypes = useCallback(fetchStatic(TYPES), []);
  const fetchYears = useCallback(fetchStatic(buildFinancialYears()), []);
  const fetchPhasing = useCallback(fetchStatic(PHASING), []);
  const fetchCurrencies = useCallback(fetchStatic(CURRENCIES), []);
  const fetchOverspend = useCallback(fetchStatic(OVERSPEND), []);

  // TODO: replace with API – branches / departments / cost centers / projects by `level`
  const fetchScope = useCallback(
    async (_search: string) => {
      try {
        return [] as Opt[];
      } catch (err) {
        showApiError(err);
        return [];
      }
    },
    [level],
  );

  // TODO: replace with API – approved higher-level budgets for the same year
  // (e.g. a Department budget rolls up into a Branch budget)
  const fetchParents = useCallback(
    async (_search: string) => {
      try {
        return [] as Opt[];
      } catch (err) {
        showApiError(err);
        return [];
      }
    },
    [financialYear, level],
  );

  // Changing phasing re-splits every line evenly into the new periods
  const changePhasing = (v: string) => {
    if (!v || v === phasing) return;
    if (items.length && !window.confirm("Changing phasing will re-split every item evenly. Continue?"))
      return;
    const n = periodLabels(v, fyStartMonth).length;
    setPhasing(v);
    setItems((prev) =>
      prev.map((i) => ({ ...i, periods: splitEven(Number(i.amount || 0), n) })),
    );
    touch();
  };

  // Attachments
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const ok: File[] = [];
    let err = "";
    Array.from(list).forEach((f) => {
      if (f.size > MAX_FILE_MB * 1024 * 1024) err = `"${f.name}" is over ${MAX_FILE_MB} MB`;
      else ok.push(f);
    });
    setErrors((p) => ({ ...p, files: err }));
    if (ok.length) {
      setFiles((p) => [...p, ...ok]);
      setDirty(true);
    }
  };

  // Validation + save
  const validate = (forSubmit: boolean) => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Budget title is required";
    if (forSubmit) {
      if (!budgetType) e.budgetType = "Select a budget type";
      if (!financialYear) e.financialYear = "Select a financial year";
      if (!level) e.level = "Select what this budget is for";
      if (level !== "Company" && !scope) e.scope = `Select a ${level.toLowerCase()}`;
      if (!phasing) e.phasing = "Select how the budget is phased";
      if (!currency) e.currency = "Select a currency";
      if (items.length === 0) e.items = "Add at least one budget item";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (submit: boolean) => {
    if (!validate(submit)) return;
    const payload: BudgetPayload = {
      title: title.trim(),
      budget_type: budgetType,
      financial_year: financialYear,
      budget_level: level,
      scope_id: scope?.value ?? "",
      scope_name: scope?.label ?? "",
      parent_budget_id: parent?.value ?? "",
      phasing,
      currency,
      overspend_action: overspend,
      notes,
      items,
      attachments: files,
      total,
      submit,
    };
    setSaving(submit ? "submit" : "draft");
    try {
      // TODO: call create budget API with `payload`, then upload `payload.attachments`.
      //   submit=false → status "Draft", submit=true → status "Pending Approval".
      //   The server assigns the budget number (e.g. BUD-0001).
      showSuccess(submit ? "Budget submitted for approval" : "Budget saved as draft");
      setDirty(false);
      onSaved?.(payload);
      onBack();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(null);
    }
  };

  const handleBack = () => {
    if (dirty && !window.confirm("Discard this budget? Unsaved changes will be lost.")) return;
    onBack();
  };

  const upsertItem = (item: BudgetItem) => {
    setItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.map((i) => (i.id === item.id ? item : i))
        : [...prev, item],
    );
    setItemModal({ open: false, item: null });
    touch("items");
  };

  const toggleExpand = (id: string) =>
    setExpanded((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const sectionCard = "rounded-xl border border-[var(--border)] bg-[var(--card,#fff)]";
  const colCount = 8;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto px-1 pb-4">
        <button
          type="button"
          onClick={handleBack}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={14} /> Back to budgets
        </button>

        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-main">Create budget</h2>
              <span className="rounded-full bg-[var(--border)]/40 px-2 py-0.5 text-xs text-muted">Draft</span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Plan spending for a branch, department, cost center or project.
              Lines are reviewed by the approver before the budget goes live.
            </p>
          </div>
        </div>

        {/* Details */}
        <section className={`${sectionCard} mb-4 p-5`}>
          <div className="mb-4 flex items-center gap-2 border-b border-[var(--border)] pb-3 text-sm font-semibold text-main">
            <Building2 size={16} className="text-primary" /> Budget details
          </div>

          <div className="grid grid-cols-12 items-start gap-4">
            <div className="col-span-12 md:col-span-6">
              <ModalInput
                label="Budget title"
                name="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  touch("title");
                }}
                error={errors.title}
                required
                placeholder="For example: Core infrastructure FY budget"
              />
            </div>
            <div className="col-span-6 md:col-span-3">
              <SearchSelect2
                label="Budget type"
                required
                value={budgetType}
                onChange={(v) => { setBudgetType(v || ""); touch("budgetType"); }}
                fetchOptions={fetchTypes}
                placeholder="Select type"
                error={errors.budgetType}
              />
            </div>
            <div className="col-span-6 md:col-span-3">
              <SearchSelect2
                label="Financial year"
                required
                value={financialYear}
                onChange={(v) => { setFinancialYear(v || ""); touch("financialYear"); }}
                fetchOptions={fetchYears}
                placeholder="Select year"
                error={errors.financialYear}
              />
            </div>

            <div className="col-span-12 md:col-span-3">
              <SearchSelect2
                label="Budget for"
                required
                value={level}
                onChange={(v) => {
                  setLevel(v || "");
                  setScope(null);
                  touch("level");
                }}
                fetchOptions={fetchLevels}
                placeholder="Select level"
                error={errors.level}
              />
            </div>
            <div className="col-span-12 md:col-span-5">
              {level === "Company" ? (
                <ReadOnlyField label="Applies to" value="Entire company" />
              ) : (
                <SearchSelect2
                  key={level /* remount so options reload for the new level */}
                  label={level || "Scope"}
                  required
                  value={scope?.label ?? ""}
                  onChange={(v, opt) => {
                    setScope(v ? { value: v, label: opt?.label || v } : null);
                    touch("scope");
                  }}
                  fetchOptions={fetchScope}
                  placeholder={`Select ${level.toLowerCase() || "scope"}`}
                  error={errors.scope}
                />
              )}
            </div>
            <div className="col-span-12 md:col-span-4">
              <SearchSelect2
                label="Rolls up into"
                value={parent?.label ?? ""}
                onChange={(v, opt) => {
                  setParent(v ? { value: v, label: opt?.label || v } : null);
                  touch();
                }}
                fetchOptions={fetchParents}
                placeholder="Higher-level budget (optional)"
              />
            </div>

            <div className="col-span-6 md:col-span-3">
              <SearchSelect2
                label="Phasing"
                required
                value={phasing}
                onChange={(v) => changePhasing(v || "")}
                fetchOptions={fetchPhasing}
                placeholder="Select phasing"
                error={errors.phasing}
              />
            </div>
            <div className="col-span-6 md:col-span-3">
              <SearchSelect2
                label="Currency"
                required
                value={currency}
                onChange={(v) => { setCurrency(v || ""); touch("currency"); }}
                fetchOptions={fetchCurrencies}
                placeholder="Select currency"
                error={errors.currency}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <SearchSelect2
                label="If spending exceeds budget"
                value={OVERSPEND.find((o) => o.value === overspend)?.label ?? ""}
                onChange={(v) => { setOverspend(v || "Warn"); touch(); }}
                fetchOptions={fetchOverspend}
                placeholder="Select action"
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <ReadOnlyField label="Prepared by" value={preparedBy || "You"} locked />
            </div>

            <div className="col-span-12">
              <label className="mb-1 block text-xs font-medium text-muted">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); touch(); }}
                rows={2}
                placeholder="Assumptions or context for the approver"
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        </section>

        {/* Items */}
        <section className={`${sectionCard} mb-4`}>
          <div className="flex items-center justify-between gap-3 p-5 pb-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-main">
                <ClipboardList size={16} className="text-primary" /> Budget items
              </div>
            </div>
            <button
              type="button"
              onClick={() => setItemModal({ open: true, item: null })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus size={14} /> Add item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="bg-[var(--border)]/15 text-left text-xs font-medium text-muted">
                  <th className="px-5 py-2.5">Category</th>
                  <th className="px-3 py-2.5">What it includes</th>
                  <th className="px-3 py-2.5 text-right">Amount ({currency || "—"})</th>
                  <th className="px-3 py-2.5 text-right">Change</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5">Justification</th>
                  <th className="px-5 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const ly = Number(it.lastYear || 0);
                  const amt = Number(it.amount || 0);
                  const pct = ly > 0 ? ((amt - ly) / ly) * 100 : null;
                  const isOpen = expanded.includes(it.id);
                  return (
                    <React.Fragment key={it.id}>
                      <tr className="border-t border-[var(--border)] text-main">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {it.periods.length > 0 ? (
                              <button
                                type="button"
                                aria-label={isOpen ? "Hide period split" : "Show period split"}
                                onClick={() => toggleExpand(it.id)}
                                className="text-muted hover:text-primary"
                              >
                                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            ) : (
                              <span className="w-[14px]" />
                            )}
                            <div>
                              <div className="font-medium">{it.category}</div>
                              {it.account && <div className="text-xs text-muted">{it.account.label}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-2.5" title={it.includes}>
                          {it.includes}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right text-muted">
                          {ly > 0 ? money(ly) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium">{money(amt)}</td>
                        <td
                          className={`whitespace-nowrap px-3 py-2.5 text-right text-xs ${
                            pct !== null && pct > 20 ? "text-amber-600" : "text-muted"
                          }`}
                        >
                          {pct === null ? "—" : `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[it.status]}`}>
                            {it.status}
                          </span>
                        </td>
                        <td className="max-w-[220px] truncate px-3 py-2.5 text-muted" title={it.justification}>
                          {it.justification}
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              aria-label="Edit item"
                              onClick={() => setItemModal({ open: true, item: it })}
                              className="text-muted hover:text-primary"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              aria-label="Remove item"
                              onClick={() => {
                                setItems((p) => p.filter((i) => i.id !== it.id));
                                touch();
                              }}
                              className="text-muted hover:text-danger"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isOpen && it.periods.length > 0 && (
                        <tr className="bg-[var(--border)]/10">
                          <td colSpan={colCount} className="px-5 py-3">
                            <div className="flex flex-wrap gap-x-6 gap-y-2 pl-5 text-xs">
                              {labels.map((l, i) => (
                                <div key={l}>
                                  <div className="text-muted">{l}</div>
                                  <div className="font-medium text-main">{money(it.periods[i] ?? 0)}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {items.length === 0 && (
              <div className="flex flex-col items-center gap-1 border-t border-[var(--border)] py-12 text-center">
                <p className="mt-1 text-sm font-medium text-main">No budget items yet</p>
                <p className="text-xs text-muted">
                  Select Add item to start listing what this budget will cover.
                </p>
              </div>
            )}
          </div>
          {errors.items && (
            <p className="border-t border-[var(--border)] px-5 py-2 text-xs text-danger">{errors.items}</p>
          )}
        </section>

        {/* Attachments */}
        <section className={`${sectionCard} p-5`}>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-main">
            <Paperclip size={16} className="text-primary" /> Supporting documents
          </div>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed py-4 transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-[var(--border)] bg-[var(--border)]/10 hover:border-primary/50"
            }`}
          >
            <Upload size={20} className="text-muted" />
            <p className="text-sm text-muted">
              Drag and drop files, or <span className="font-medium text-primary">Browse</span>
            </p>
            <p className="text-xs text-muted">Quotes, last year's report, approvals. Max {MAX_FILE_MB} MB per file</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.xlsx,.xls,.csv,.doc,.docx"
            className="hidden"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
          {errors.files && <p className="mt-1 text-xs text-danger">{errors.files}</p>}
          {files.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--border)]/10 px-3 py-2"
                >
                  <FileText size={16} className="shrink-0 text-primary" />
                  <span className="flex-1 truncate text-sm text-main">{f.name}</span>
                  <span className="shrink-0 text-xs text-muted">{(f.size / 1024).toFixed(0)} KB</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => { setFiles((p) => p.filter((_, j) => j !== i)); setDirty(true); }}
                    className="ml-1 text-muted hover:text-danger"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sticky summary + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--card,#fff)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="text-sm text-muted">
            Items <span className="font-semibold text-main">{items.length}</span>
          </div>
          <div className="text-sm text-muted">
            Total budget <span className="text-lg font-semibold text-main">{money(total)}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(["Approved", "Pending", "Rejected"] as ItemStatus[]).map((s) => (
              <span key={s} className={`rounded-full px-2 py-0.5 ${STATUS_STYLE[s]}`}>
                {s}: {money(sumBy(s))}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!!saving}
            onClick={() => save(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-main hover:bg-[var(--border)]/20 disabled:opacity-50"
          >
            <Save size={14} /> {saving === "draft" ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            disabled={!!saving}
            onClick={() => save(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Send size={14} /> {saving === "submit" ? "Submitting…" : "Submit for approval"}
          </button>
        </div>
      </div>

      {itemModal.open && (
        <ItemModal
          initial={itemModal.item}
          currency={currency}
          labels={labels}
          onClose={() => setItemModal({ open: false, item: null })}
          onSave={upsertItem}
        />
      )}
    </div>
  );
};

// Small read-only field that matches the inputs' look
const ReadOnlyField: React.FC<{ label: string; value: string; locked?: boolean }> = ({
  label,
  value,
  locked,
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-muted">{label}</label>
    <div className="flex h-[38px] items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--border)]/15 px-3 text-sm text-main">
      <span className="truncate">{value}</span>
      {locked && <Lock size={14} className="shrink-0 text-muted" />}
    </div>
  </div>
);

export default CreateBudget;