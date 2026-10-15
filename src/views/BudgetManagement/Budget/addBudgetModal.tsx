import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { showApiError, showSuccess } from "../../../utils/alert";

// ─── Types ────────────────────────────────────────────────────────────────────

type Opt = { value: string; label: string };
export type ControlLevel = "Free" | "Capped" | "Fixed";
export type ScopeCode = "single" | "selected" | "all";
export type AllocationMethod = "manual" | "equal" | "last_year";

/** An organization unit that takes part in the plan (branch, school, plant, department...) */
export interface Branch {
  code: string;
  name: string;
  zone: string;
  region: string;
  manager: string;
  /** Last year's actual spend, used to suggest targets */
  lastYearActual: number;
}

/** A budget head line, as set up under a budget head group in Setup */
export interface HeadRef {
  id: string;
  name: string;
  glCode: string;
  costCentre: string;
  programme: string;
  group: string; // id of the budget head group it belongs to
  control: ControlLevel;
  cap: number;
}

export interface UnitTarget {
  unit_code: string;
  amount: number;
  /** Optional deadline for this unit only. Empty = plan deadline applies. */
  deadline: string;
}

export interface HeadRule {
  head_id: string;
  control: ControlLevel;
  cap: number;
}

export interface BudgetPlanPayload {
  name: string;
  financial_year: string;
  budget_type: string;
  budget_period: string;
  currency: string;
  planning_basis: string;
  growth_pct: number;
  budget_head_ids: string[]; // budget head groups chosen from Setup
  budget_head_names: string[];
  /** Extra heads added for one unit only (on top of the heads under the chosen groups) */
  branch_heads: { branch_code: string; head_ids: string[] }[];
  scope: ScopeCode;
  branch_codes: string[]; // empty when scope is "all" (server resolves)
  custom_dates: boolean;
  start_date: string;
  end_date: string;
  submission_deadline: string;
  workflow: string;
  total_envelope: number; // 0 = no envelope set
  allocation_method: AllocationMethod;
  targets: UnitTarget[];
  head_rules: HeadRule[];
  instructions: string;
  description: string;
  owner: string;
  /** draft = save only, create = create as draft, publish = create and send to units for input */
  action: "draft" | "create" | "publish";
}

interface CreateBudgetPlanProps {
  onBack: () => void;
  onSaved?: (payload: BudgetPlanPayload) => void;
  currentUser?: string;
  /** Only the budget office (MIS) or similar may create plans */
  canCreate?: boolean;
  /** Only users with this right can change the budget owner */
  canChangeOwner?: boolean;
  /** Month the financial year starts (1-12). April = 4 for India. */
  fyStartMonth?: number;
  /** Companies call their units different things: Branch, School, Plant, Store... */
  unitLabel?: string;
  unitLabelPlural?: string;
  defaultCurrency?: string;
  initial?: Partial<BudgetPlanPayload>;
}

// ─── Static options and illustrative data ─────────────────────────────────────

const BUDGET_TYPES = ["Operating", "Capital Expenditure", "Project", "Special"];
const PERIODS = ["Annual", "Quarterly", "Monthly"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];
const PLANNING_BASIS = ["Last year actuals", "Last year budget", "Zero-based"];
// TODO: replace with API – approval workflows from Setup
const WORKFLOWS = ["Standard (Zone → Department → Finance → Board)", "Fast track (Department → Finance)", "Capital (Finance → CFO → Board)"];

// TODO: replace with master-data APIs. Illustrative only.
const BRANCHES: Branch[] = [
  { code: "BR-0101", name: "Meerut Main", zone: "Zone North", region: "Western UP", manager: "Rohit Verma", lastYearActual: 2400000 },
  { code: "BR-0102", name: "Meerut Cantt", zone: "Zone North", region: "Western UP", manager: "Sneha Gupta", lastYearActual: 1500000 },
  { code: "BR-0201", name: "Dehradun Central", zone: "Zone Hills", region: "Uttarakhand", manager: "Amit Rawat", lastYearActual: 2900000 },
  { code: "BR-0202", name: "Dehradun Rajpur Road", zone: "Zone Hills", region: "Uttarakhand", manager: "Neha Bisht", lastYearActual: 1800000 },
  { code: "BR-0301", name: "Haridwar", zone: "Zone Hills", region: "Uttarakhand", manager: "Pankaj Joshi", lastYearActual: 1600000 },
  { code: "BR-0302", name: "Roorkee", zone: "Zone Hills", region: "Uttarakhand", manager: "Kavita Negi", lastYearActual: 1200000 },
  { code: "BR-0401", name: "Agra Sadar", zone: "Zone Central", region: "Braj", manager: "Vikas Sharma", lastYearActual: 2200000 },
  { code: "BR-0402", name: "Mathura", zone: "Zone Central", region: "Braj", manager: "Pooja Yadav", lastYearActual: 1400000 },
];

// TODO: replace with API that returns active budget head groups from Setup → Budget heads
const BUDGET_HEAD_NAMES: Opt[] = [
  { value: "BH-001", label: "Operating Expenses" },
  { value: "BH-002", label: "Capital Expenditure Items" },
  { value: "BH-003", label: "Staff Costs" },
];

// TODO: replace with API – heads under each group (Setup → Budget heads). Dummy data.
const BUDGET_HEADS_DATA: HeadRef[] = [
  { id: "H-101", name: "Office Rent", glCode: "5101001", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-001", control: "Fixed", cap: 0 },
  { id: "H-102", name: "Electricity", glCode: "5101002", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-001", control: "Capped", cap: 120000 },
  { id: "H-103", name: "Housekeeping & Security", glCode: "5101003", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-001", control: "Capped", cap: 90000 },
  { id: "H-104", name: "Stationery & Printing", glCode: "5101004", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-001", control: "Free", cap: 0 },
  { id: "H-201", name: "IT Equipment", glCode: "1201001", costCentre: "CC-201 Information Technology", programme: "PRG-02 Digital Banking", group: "BH-002", control: "Capped", cap: 500000 },
  { id: "H-202", name: "Furniture & Fixtures", glCode: "1201002", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-002", control: "Free", cap: 0 },
  { id: "H-203", name: "Cash Handling Machines", glCode: "1201003", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-002", control: "Fixed", cap: 0 },
  { id: "H-301", name: "Staff Training", glCode: "5201001", costCentre: "CC-301 Human Resources", programme: "PRG-03 People Development", group: "BH-003", control: "Capped", cap: 200000 },
  { id: "H-302", name: "Travel Expenses", glCode: "5201002", costCentre: "CC-301 Human Resources", programme: "PRG-03 People Development", group: "BH-003", control: "Capped", cap: 150000 },
  { id: "H-303", name: "Overtime", glCode: "5201003", costCentre: "CC-301 Human Resources", programme: "PRG-03 People Development", group: "BH-003", control: "Free", cap: 0 },
];
const HEAD_BY_ID: Record<string, HeadRef> = Object.fromEntries(BUDGET_HEADS_DATA.map((h) => [h.id, h]));
const GROUP_LABEL: Record<string, string> = Object.fromEntries(BUDGET_HEAD_NAMES.map((g) => [g.value, g.label]));

const CONTROL_LEVELS: ControlLevel[] = ["Free", "Capped", "Fixed"];
const STEPS = ["Basics", "Participants", "Targets and rules", "Review"];
const PAGE_SIZE = 8;

const filterStatic = (list: string[], search: string): Opt[] =>
  list
    .filter((o) => o.toLowerCase().includes((search || "").toLowerCase()))
    .map((o) => ({ value: o, label: o }));
const staticFetcher = (list: string[]) => (search: string) => Promise.resolve(filterStatic(list, search));

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fyLabel = (startYear: number) => `FY ${startYear}–${pad((startYear + 1) % 100)}`;
const fyStartYear = (label: string) => parseInt(label.slice(3, 7), 10);
const fyRange = (label: string, startMonth: number) => {
  const y = fyStartYear(label);
  return {
    start: ymd(new Date(y, startMonth - 1, 1)),
    end: ymd(new Date(y + 1, startMonth - 1, 0)), // day before next FY starts
  };
};
const currentFyStartYear = (startMonth: number) => {
  const now = new Date();
  return now.getMonth() + 1 >= startMonth ? now.getFullYear() : now.getFullYear() - 1;
};
const fmt = (n: number) => n.toLocaleString();
const defaultRule = (h: HeadRef) => ({ control: h.control, cap: h.cap ? String(h.cap) : "" });

const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary";
const sectionCard = "rounded-xl border border-[var(--border)] bg-[var(--card,#fff)]";
const btnGhost =
  "rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-main hover:bg-[var(--border)]/20 disabled:opacity-50";
const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50";

// ─── Small shared pieces ──────────────────────────────────────────────────────

const ReadOnlyField: React.FC<{ label: string; value: string; locked?: boolean }> = ({ label, value, locked }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-muted">{label}</label>
    <div className="flex h-[38px] items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--border)]/15 px-3 text-sm text-main">
      <span className="truncate">{value}</span>
      {locked && <Lock size={14} className="shrink-0 text-muted" />}
    </div>
  </div>
);

const ConfirmDialog: React.FC<{
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, children, confirmLabel, busy, onConfirm, onCancel }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div role="alertdialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-xl bg-[var(--card,#fff)] p-5 shadow-xl">
        <h3 className="text-base font-semibold text-main">{title}</h3>
        <div className="mt-2 text-sm text-muted">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={btnGhost}>
            Cancel
          </button>
          <button type="button" disabled={busy} onClick={onConfirm} className={btnPrimary}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const Stepper: React.FC<{ step: number; maxStep: number; onGo: (i: number) => void }> = ({ step, maxStep, onGo }) => (
  <ol className="mb-4 flex flex-wrap items-center gap-2" aria-label="Plan steps">
    {STEPS.map((label, i) => {
      const done = i < step;
      const current = i === step;
      const reachable = i <= maxStep;
      return (
        <li key={label} className="flex items-center gap-2">
          <button
            type="button"
            disabled={!reachable}
            onClick={() => onGo(i)}
            aria-current={current ? "step" : undefined}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
              current
                ? "border-primary bg-primary/10 font-medium text-primary"
                : done
                  ? "border-[var(--border)] text-main hover:bg-[var(--border)]/15"
                  : "border-[var(--border)] text-muted"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                current || done ? "bg-primary text-white" : "bg-[var(--border)]/40 text-muted"
              }`}
            >
              {done ? <Check size={12} /> : i + 1}
            </span>
            {label}
          </button>
          {i < STEPS.length - 1 && <span className="h-px w-6 bg-[var(--border)]" aria-hidden />}
        </li>
      );
    })}
  </ol>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const CreateBudgetPlan: React.FC<CreateBudgetPlanProps> = ({
  onBack,
  onSaved,
  currentUser = "",
  canCreate = true,
  canChangeOwner = false,
  fyStartMonth = 4,
  unitLabel = "Branch",
  unitLabelPlural = "Branches",
  defaultCurrency = "INR",
  initial,
}) => {
  const unitLower = unitLabel.toLowerCase();
  const pluralLower = unitLabelPlural.toLowerCase();
  const scopeOptions = [`Single ${unitLabel}`, `Selected ${unitLabelPlural}`, `All ${unitLabelPlural}`];
  const scopeFromCode = (c: ScopeCode | undefined) => scopeOptions[c === "single" ? 0 : c === "all" ? 2 : 1];
  const scopeCode = (label: string): ScopeCode => (label === scopeOptions[0] ? "single" : label === scopeOptions[2] ? "all" : "selected");

  const fyOptions = useMemo(() => {
    const y = currentFyStartYear(fyStartMonth);
    return [y - 1, y, y + 1, y + 2].map(fyLabel);
  }, [fyStartMonth]);

  // Option fetchers
  const fetchYears = useMemo(() => staticFetcher(fyOptions), [fyOptions]);
  const fetchTypes = useMemo(() => staticFetcher(BUDGET_TYPES), []);
  const fetchPeriods = useMemo(() => staticFetcher(PERIODS), []);
  const fetchCurrencies = useMemo(() => staticFetcher(CURRENCIES), []);
  const fetchBasis = useMemo(() => staticFetcher(PLANNING_BASIS), []);
  const fetchWorkflows = useMemo(() => staticFetcher(WORKFLOWS), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchScopes = useMemo(() => staticFetcher(scopeOptions), [unitLabel, unitLabelPlural]);

  // Steps
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);

  // Step 1 – Basics
  const [name, setName] = useState(initial?.name ?? "");
  const [financialYear, setFinancialYear] = useState(initial?.financial_year ?? fyOptions[1]);
  const [budgetType, setBudgetType] = useState(initial?.budget_type ?? "Operating");
  const [period, setPeriod] = useState(initial?.budget_period ?? "Annual");
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency);
  const [planningBasis, setPlanningBasis] = useState(initial?.planning_basis ?? "Last year actuals");
  const [growthPct, setGrowthPct] = useState(initial?.growth_pct != null ? String(initial.growth_pct) : "");
  const [groupIds, setGroupIds] = useState<string[]>(initial?.budget_head_ids ?? []);
  const [customDates, setCustomDates] = useState(initial?.custom_dates ?? false);
  const [startDate, setStartDate] = useState(initial?.start_date ?? fyRange(financialYear, fyStartMonth).start);
  const [endDate, setEndDate] = useState(initial?.end_date ?? fyRange(financialYear, fyStartMonth).end);
  const [deadline, setDeadline] = useState(initial?.submission_deadline ?? "");
  const [workflow, setWorkflow] = useState(initial?.workflow ?? WORKFLOWS[0]);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [owner, setOwner] = useState(initial?.owner ?? currentUser);

  // Step 2 – Participants
  const [scope, setScope] = useState(scopeFromCode(initial?.scope));
  const [selected, setSelected] = useState<string[]>(initial?.branch_codes ?? []);
  const [branchSearch, setBranchSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandedBranches, setExpandedBranches] = useState<string[]>([]);
  // Unit-specific heads: unit code → ids of extra heads added for that unit only
  const [branchHeads, setBranchHeads] = useState<Record<string, string[]>>(
    Object.fromEntries((initial?.branch_heads ?? []).map((b) => [b.branch_code, b.head_ids])),
  );

  // Step 3 – Targets and rules
  const [envelope, setEnvelope] = useState(initial?.total_envelope ? String(initial.total_envelope) : "");
  const [method, setMethod] = useState<AllocationMethod>(initial?.allocation_method ?? "last_year");
  const [targets, setTargets] = useState<Record<string, string>>(
    Object.fromEntries((initial?.targets ?? []).map((t) => [t.unit_code, String(t.amount)])),
  );
  const [unitDeadlines, setUnitDeadlines] = useState<Record<string, string>>(
    Object.fromEntries((initial?.targets ?? []).filter((t) => t.deadline).map((t) => [t.unit_code, t.deadline])),
  );
  const [rules, setRules] = useState<Record<string, { control: ControlLevel; cap: string }>>(
    Object.fromEntries((initial?.head_rules ?? []).map((r) => [r.head_id, { control: r.control, cap: r.cap ? String(r.cap) : "" }])),
  );
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");

  // Page state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState<"draft" | "create" | "publish" | null>(null);
  const [confirm, setConfirm] = useState<null | "create" | "publish" | "discard">(null);

  const touch = (key?: string) => {
    setDirty(true);
    if (key) setErrors((p) => ({ ...p, [key]: "" }));
  };

  // ── Derived ──
  const isSingle = scope === scopeOptions[0];
  const isAll = scope === scopeOptions[2];
  const range = customDates ? { start: startDate, end: endDate } : fyRange(financialYear, fyStartMonth);

  const allocatedHeads = useMemo(() => BUDGET_HEADS_DATA.filter((h) => groupIds.includes(h.group)), [groupIds]);
  const groupNames = groupIds.map((id) => GROUP_LABEL[id]).filter(Boolean).join(", ");
  const ruleOf = (h: HeadRef) => rules[h.id] ?? defaultRule(h);

  const zones = useMemo(() => Array.from(new Set(BRANCHES.map((b) => b.zone))).sort(), []);
  const regions = useMemo(
    () => Array.from(new Set(BRANCHES.filter((b) => !zoneFilter || b.zone === zoneFilter).map((b) => b.region))).sort(),
    [zoneFilter],
  );
  const filtered = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    return BRANCHES.filter(
      (b) =>
        (!zoneFilter || b.zone === zoneFilter) &&
        (!regionFilter || b.region === regionFilter) &&
        (!selectedOnly || selected.includes(b.code)) &&
        (!q || b.code.toLowerCase().includes(q) || b.name.toLowerCase().includes(q)),
    );
  }, [branchSearch, zoneFilter, regionFilter, selectedOnly, selected]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [branchSearch, zoneFilter, regionFilter, selectedOnly]);

  const covered: Branch[] = useMemo(
    () => (isAll ? BRANCHES : BRANCHES.filter((b) => selected.includes(b.code))),
    [isAll, selected],
  );
  const coveredCodes = covered.map((b) => b.code);
  const isCovered = (code: string) => isAll || selected.includes(code);
  const extraTotal = coveredCodes.reduce((n, c) => n + (branchHeads[c]?.length ?? 0), 0);

  const envelopeNum = Number(envelope) || 0;
  const allocated = covered.reduce((n, b) => n + (Number(targets[b.code]) || 0), 0);
  const unallocated = envelopeNum - allocated;

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((b) => selected.includes(b.code));

  // ── Validation (pure, so the review step can list issues) ──
  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!name.trim()) e.name = "Budget name is required";
      if (!financialYear) e.financialYear = "Select a financial year";
      if (!budgetType) e.budgetType = "Select a budget type";
      if (!period) e.period = "Select a budget period";
      if (!currency) e.currency = "Select a currency";
      if (groupIds.length === 0) e.groups = "Select at least one budget head group";
      if (customDates) {
        if (!startDate) e.startDate = "Select a start date";
        if (!endDate) e.endDate = "Select an end date";
        if (startDate && endDate && endDate < startDate) e.endDate = "End date must be after the start date";
      }
      if (!deadline) e.deadline = `Set a deadline for ${pluralLower} to submit`;
      else if (range.end && deadline > range.end) e.deadline = "Deadline can't be after the plan ends";
      if (!workflow) e.workflow = "Select an approval workflow";
    }
    if (s === 1) {
      if (!isAll && selected.length === 0) e.units = isSingle ? `Select a ${unitLower}` : `Select at least one ${unitLower}`;
    }
    if (s === 2) {
      if (envelopeNum > 0 && allocated > envelopeNum) e.targets = "Targets add up to more than the total envelope";
      if (covered.some((b) => Number(targets[b.code]) < 0)) e.targets = "Targets can't be negative";
      if (allocatedHeads.some((h) => ruleOf(h).control === "Capped" && !(Number(ruleOf(h).cap) > 0)))
        e.rules = "Enter a cap for every capped head";
    }
    return e;
  };

  const issues = useMemo(
    () =>
      [0, 1, 2].flatMap((s) =>
        Object.values(validateStep(s))
          .filter(Boolean)
          .map((msg) => ({ step: s, msg })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, financialYear, budgetType, period, currency, groupIds, customDates, startDate, endDate, deadline, workflow, scope, selected, envelope, targets, rules],
  );
  const warnings = [
    ...(envelopeNum === 0 ? [`No total envelope set. ${unitLabelPlural} will plan without a ceiling.`] : []),
    ...(envelopeNum > 0 && unallocated > 0 ? [`${fmt(unallocated)} ${currency} of the envelope is not allocated to any ${unitLower}.`] : []),
    ...(covered.some((b) => !(Number(targets[b.code]) > 0)) && envelopeNum > 0
      ? [`Some ${pluralLower} have no target and can submit freely.`]
      : []),
  ];

  // ── Handlers ──
  const goNext = () => {
    // No checks here: the user can move through the steps freely.
    // Required fields are listed on the Review step instead.
    setErrors({});
    const next = Math.min(step + 1, STEPS.length - 1);
    setStep(next);
    setMaxStep((m) => Math.max(m, next));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));
  const goTo = (i: number) => {
    if (i <= maxStep) {
      setErrors({});
      setStep(i);
    }
  };

  const changeFY = (v: string) => {
    setFinancialYear(v);
    if (v && !customDates) {
      const r = fyRange(v, fyStartMonth);
      setStartDate(r.start);
      setEndDate(r.end);
    }
    touch("financialYear");
  };
  const toggleCustomDates = (on: boolean) => {
    if (on) {
      const r = fyRange(financialYear, fyStartMonth);
      setStartDate(r.start);
      setEndDate(r.end);
    }
    setCustomDates(on);
    touch();
  };

  const toggleGroup = (id: string) => {
    const next = groupIds.includes(id) ? groupIds.filter((g) => g !== id) : [...groupIds, id];
    setGroupIds(next);
    // Heads that now belong to a chosen group no longer need to be unit-specific
    setBranchHeads((p) =>
      Object.fromEntries(Object.entries(p).map(([code, ids]) => [code, ids.filter((i) => !next.includes(HEAD_BY_ID[i]?.group))])),
    );
    touch("groups");
  };

  const changeScope = (v: string) => {
    if (!v) return;
    setScope(v);
    if (v === scopeOptions[0]) setSelected((p) => p.slice(0, 1));
    touch("scope");
    setErrors((p) => ({ ...p, units: "" }));
  };

  const toggleBranch = (code: string) => {
    touch("units");
    setSelected((p) => (isSingle ? [code] : p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));
  };
  const togglePage = () => {
    touch("units");
    const codes = pageRows.map((b) => b.code);
    setSelected((p) => (allOnPageSelected ? p.filter((c) => !codes.includes(c)) : Array.from(new Set([...p, ...codes]))));
  };
  const selectAllFiltered = () => {
    touch("units");
    setSelected((p) => Array.from(new Set([...p, ...filtered.map((b) => b.code)])));
  };
  const zoneCodes = (z: string) => BRANCHES.filter((b) => b.zone === z).map((b) => b.code);
  const zoneFullySelected = (z: string) => zoneCodes(z).every((c) => selected.includes(c));
  const toggleZone = (z: string) => {
    touch("units");
    const codes = zoneCodes(z);
    setSelected((p) => (zoneFullySelected(z) ? p.filter((c) => !codes.includes(c)) : Array.from(new Set([...p, ...codes]))));
  };

  const toggleExpand = (code: string) =>
    setExpandedBranches((p) => (p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));
  const addBranchHead = (code: string, headId: string) => {
    setBranchHeads((p) => ({ ...p, [code]: [...(p[code] ?? []), headId] }));
    setDirty(true);
  };
  const removeBranchHead = (code: string, headId: string) => {
    setBranchHeads((p) => ({ ...p, [code]: (p[code] ?? []).filter((id) => id !== headId) }));
    setDirty(true);
  };

  const applySplit = (m: AllocationMethod) => {
    if (m === "manual" || envelopeNum <= 0 || covered.length === 0) return;
    const out: Record<string, number> = {};
    const lastTotal = covered.reduce((n, b) => n + b.lastYearActual, 0);
    if (m === "last_year" && lastTotal > 0) {
      covered.forEach((b) => (out[b.code] = Math.floor((envelopeNum * b.lastYearActual) / lastTotal)));
    } else {
      const each = Math.floor(envelopeNum / covered.length);
      covered.forEach((b) => (out[b.code] = each));
    }
    // put any rounding remainder on the first unit so the total matches the envelope
    const used = Object.values(out).reduce((n, v) => n + v, 0);
    out[covered[0].code] += envelopeNum - used;
    setTargets(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, String(v)])));
    setMethod(m);
    touch("targets");
  };

  const setRule = (h: HeadRef, patch: Partial<{ control: ControlLevel; cap: string }>) => {
    setRules((p) => ({ ...p, [h.id]: { ...ruleOf(h), ...patch } }));
    touch("rules");
  };

  const buildPayload = (action: BudgetPlanPayload["action"]): BudgetPlanPayload => ({
    name: name.trim(),
    financial_year: financialYear,
    budget_type: budgetType,
    budget_period: period,
    currency,
    planning_basis: planningBasis,
    growth_pct: Number(growthPct) || 0,
    budget_head_ids: groupIds,
    budget_head_names: groupIds.map((id) => GROUP_LABEL[id]).filter(Boolean),
    scope: scopeCode(scope),
    branch_codes: isAll ? [] : selected,
    branch_heads: coveredCodes
      .filter((c) => (branchHeads[c]?.length ?? 0) > 0)
      .map((c) => ({ branch_code: c, head_ids: branchHeads[c] })),
    custom_dates: customDates,
    start_date: range.start,
    end_date: range.end,
    submission_deadline: deadline,
    workflow,
    total_envelope: envelopeNum,
    allocation_method: method,
    targets: covered
      .filter((b) => targets[b.code] !== undefined && targets[b.code] !== "")
      .map((b) => ({ unit_code: b.code, amount: Number(targets[b.code]) || 0, deadline: unitDeadlines[b.code] ?? "" })),
    head_rules: allocatedHeads.map((h) => ({ head_id: h.id, control: ruleOf(h).control, cap: Number(ruleOf(h).cap) || 0 })),
    instructions,
    description,
    owner,
    action,
  });

  const save = async (action: BudgetPlanPayload["action"]) => {
    const payload = buildPayload(action);
    setSaving(action);
    try {
      // TODO: call create-plan API with `payload`.
      //   The server assigns the plan ID (e.g. BUD-2027-001) and sets the status:
      //   draft/create -> "Draft", publish -> "Published" (units are notified and can start submitting).
      //   For scope "all" the server resolves the unit list, including units opened later in the year.
      //   Reject a duplicate active plan for the same year / type / scope where company rules require it.
      showSuccess(
        action === "publish"
          ? `Plan published. ${unitLabelPlural} have been notified`
          : action === "create"
            ? "Budget plan created"
            : "Budget plan saved as draft",
      );
      setDirty(false);
      onSaved?.(payload);
      onBack();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(null);
      setConfirm(null);
    }
  };

  const onDraft = () => {
    if (!name.trim()) {
      setStep(0);
      setErrors({ name: "Budget name is required" });
      return;
    }
    save("draft");
  };
  const onFinish = (action: "create" | "publish") => {
    if (issues.length > 0) {
      setStep(issues[0].step);
      setErrors(validateStep(issues[0].step));
      return;
    }
    setConfirm(action);
  };
  const handleBack = () => (dirty ? setConfirm("discard") : onBack());

  if (!canCreate) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <Lock size={22} className="text-muted" />
        <p className="text-sm font-medium text-main">You don't have permission to create budget plans</p>
        <button type="button" onClick={onBack} className={`${btnGhost} mt-2`}>
          Back to budget plans
        </button>
      </div>
    );
  }

  // ── Branch table shared props ──
  const renderBranchDetail = (b: Branch) => {
    const ids = branchHeads[b.code] ?? [];
    return (
      <BranchHeadsPanel
        unitName={b.name}
        groupName={groupNames}
        allocated={allocatedHeads}
        extras={ids.map((id) => HEAD_BY_ID[id]).filter(Boolean)}
        available={BUDGET_HEADS_DATA.filter((h) => !groupIds.includes(h.group) && !ids.includes(h.id))}
        onAdd={(id) => addBranchHead(b.code, id)}
        onRemove={(id) => removeBranchHead(b.code, id)}
      />
    );
  };
  const branchTableProps = {
    unitLabel,
    isCovered,
    expanded: expandedBranches,
    onToggleExpand: toggleExpand,
    counts: (code: string) => ({ allocated: allocatedHeads.length, extra: branchHeads[code]?.length ?? 0 }),
    renderDetail: renderBranchDetail,
  };

  // ── Step renderers ──
  const stepBasics = (
    <section className={`${sectionCard} p-5`}>
      <div className="mb-4 border-b border-[var(--border)] pb-3 text-sm font-semibold text-main">Basic information</div>
      <div className="grid grid-cols-12 items-start gap-4">
        <div className="col-span-12 md:col-span-6">
          <ModalInput
            label="Budget name"
            name="name"
            value={name}
            onChange={(e) => { setName(e.target.value); touch("name"); }}
            error={errors.name}
            required
            placeholder="For example: Annual Operating Budget"
          />
        </div>
        <div className="col-span-6 md:col-span-3">
          <SearchSelect2
            label="Financial year"
            required
            value={financialYear}
            onChange={(v) => changeFY(v || "")}
            fetchOptions={fetchYears}
            placeholder="Select year"
            error={errors.financialYear}
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
            label="Budget period"
            required
            value={period}
            onChange={(v) => { setPeriod(v || ""); touch("period"); }}
            fetchOptions={fetchPeriods}
            placeholder="Select period"
            error={errors.period}
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
        
       

        <div className="col-span-12">
          <label className="mb-1 block text-xs font-medium text-muted">
            Budget head groups <span className="text-danger">*</span>
          </label>
          <div className="grid gap-2 md:grid-cols-3">
            {BUDGET_HEAD_NAMES.map((g) => {
              const on = groupIds.includes(g.value);
              const count = BUDGET_HEADS_DATA.filter((h) => h.group === g.value).length;
              return (
                <label
                  key={g.value}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                    on ? "border-primary bg-primary/5" : "border-[var(--border)] hover:bg-[var(--border)]/10"
                  }`}
                >
                  <input type="checkbox" checked={on} onChange={() => toggleGroup(g.value)} className="mt-0.5" />
                  <span>
                    <span className="block font-medium text-main">{g.label}</span>
                    <span className="block text-xs text-muted">{count} budget heads from Setup</span>
                  </span>
                </label>
              );
            })}
          </div>
          {errors.groups && <p role="alert" className="mt-1 text-xs text-danger">{errors.groups}</p>}
        </div>

        <div className="col-span-12 md:col-span-6">
          {customDates ? (
            <div className="grid grid-cols-2 gap-4">
              <ModalInput
                label="Start date"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); touch("startDate"); }}
                error={errors.startDate}
                required
              />
              <ModalInput
                label="End date"
                name="endDate"
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); touch("endDate"); }}
                error={errors.endDate}
                required
              />
            </div>
          ) : (
            <ReadOnlyField label="Plan period" value={`${range.start} to ${range.end}`} locked />
          )}
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={customDates} onChange={(e) => toggleCustomDates(e.target.checked)} />
            Use custom dates instead of the financial year
          </label>
        </div>
        <div className="col-span-12 md:col-span-3">
          <ModalInput
            label={`Submission deadline for ${pluralLower}`}
            name="deadline"
            type="date"
            value={deadline}
            onChange={(e) => { setDeadline(e.target.value); touch("deadline"); }}
            error={errors.deadline}
            required
          />
        </div>
        <div className="col-span-12 md:col-span-3">
          {canChangeOwner ? (
            <ModalInput label="Budget owner" name="owner" value={owner} onChange={(e) => { setOwner(e.target.value); touch(); }} />
          ) : (
            <ReadOnlyField label="Budget owner" value={owner || "You"} locked />
          )}
        </div>

        

        <div className="col-span-12">
          <label className="mb-1 block text-xs font-medium text-muted">Description and planning notes</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); touch(); }}
            rows={2}
            placeholder="Context or planning assumptions for this cycle"
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>
    </section>
  );

  const stepParticipants = (
    <section className={sectionCard}>
      <div className="flex flex-wrap items-end justify-between gap-3 p-5 pb-3">
        <div className="w-full max-w-xs">
          <SearchSelect2
            label="Who takes part?"
            required
            value={scope}
            onChange={(v) => changeScope(v || "")}
            fetchOptions={fetchScopes}
            placeholder="Select scope"
            error={errors.scope}
          />
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary" aria-live="polite">
          {isAll ? `All ${BRANCHES.length} ${pluralLower}` : `${selected.length} of ${BRANCHES.length} selected`}
        </span>
      </div>

      {isAll ? (
        <div className="px-5 pb-5">
          <p className="text-sm text-muted">
            This plan covers every active {unitLower}, including {pluralLower} opened later in the year. You don't need to select them one by one.
          </p>
          <button
            type="button"
            aria-expanded={allExpanded}
            onClick={() => setAllExpanded((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {allExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {allExpanded ? `Hide ${unitLower} list` : `View all ${BRANCHES.length} ${pluralLower}`}
          </button>
          {allExpanded && (
            <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-[var(--border)]">
              <BranchTable rows={BRANCHES} {...branchTableProps} />
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 pb-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                placeholder={`Search by ${unitLower} code or name`}
                aria-label={`Search ${pluralLower}`}
                className={`${inputCls} pl-8`}
              />
            </div>
            <select
              value={zoneFilter}
              onChange={(e) => { setZoneFilter(e.target.value); setRegionFilter(""); }}
              aria-label="Filter by zone"
              className={`${inputCls} w-auto`}
            >
              <option value="">All zones</option>
              {zones.map((z) => <option key={z}>{z}</option>)}
            </select>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              aria-label="Filter by region"
              className={`${inputCls} w-auto`}
            >
              <option value="">All regions</option>
              {regions.map((r) => <option key={r}>{r}</option>)}
            </select>
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-main">
              <input type="checkbox" checked={selectedOnly} onChange={(e) => setSelectedOnly(e.target.checked)} />
              Show selected only
            </label>
          </div>

          {!isSingle && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-xs text-muted">Quick select:</span>
              {zones.map((z) => {
                const on = zoneFullySelected(z);
                return (
                  <button
                    key={z}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleZone(z)}
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${
                      on ? "border-primary bg-primary/10 text-primary" : "border-[var(--border)] text-main hover:bg-[var(--border)]/15"
                    }`}
                  >
                    {on && <Check size={11} className="mr-1 inline" />}
                    {z} ({zoneCodes(z).length})
                  </button>
                );
              })}
              {filtered.length > 0 && (
                <button type="button" onClick={selectAllFiltered} className="ml-1 text-xs text-primary hover:underline">
                  Select all {filtered.length} shown
                </button>
              )}
              {selected.length > 0 && (
                <button type="button" onClick={() => { setSelected([]); touch("units"); }} className="text-xs text-muted hover:text-main hover:underline">
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="max-h-[360px] overflow-auto rounded-lg border border-[var(--border)]">
            <BranchTable
              rows={pageRows}
              selectable
              selected={selected}
              single={isSingle}
              onToggle={toggleBranch}
              allOnPageSelected={allOnPageSelected}
              onTogglePage={togglePage}
              {...branchTableProps}
            />
            {pageRows.length === 0 && (
              <p className="py-10 text-center text-sm text-muted">No {pluralLower} match these filters.</p>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <span>
              {filtered.length} {filtered.length === 1 ? unitLower : pluralLower} · Page {page} of {pageCount}
            </span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-[var(--border)] px-2 py-1 disabled:opacity-40">
                Previous
              </button>
              <button type="button" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} className="rounded border border-[var(--border)] px-2 py-1 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
          {errors.units && <p role="alert" className="mt-2 text-xs text-danger">{errors.units}</p>}
          {/* TODO: replace BRANCHES with the organization-unit master data API */}
        </div>
      )}
    </section>
  );

  const stepTargets = (
    <div className="flex flex-col gap-4">
      {/* Envelope and targets */}
      <section className={`${sectionCard} p-5`}>
        

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <ModalInput
              label={`Total amount (${currency})`}
              name="envelope"
              type="number"
              value={envelope}
              onChange={(e) => { setEnvelope(e.target.value); touch("targets"); }}
              placeholder="Optional"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">Split method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as AllocationMethod)}
              aria-label="Split method"
              className={`${inputCls} w-auto`}
            >
              <option value="last_year">In proportion to last year's actual</option>
              <option value="equal">Equal split</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <button
            type="button"
            disabled={method === "manual" || envelopeNum <= 0 || covered.length === 0}
            onClick={() => applySplit(method)}
            className={btnGhost}
          >
            Apply split
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-[var(--border)]/15 text-left text-xs font-medium text-muted">
                <th className="px-3 py-2">{unitLabel}</th>
                <th className="px-3 py-2 text-right">Last year actual</th>
                <th className="w-44 px-3 py-2">Target ({currency})</th>
                <th className="px-3 py-2 text-right">Change</th>
                <th className="px-3 py-2 text-right">Share</th>
                <th className="w-40 px-3 py-2">Own deadline</th>
              </tr>
            </thead>
            <tbody>
              {covered.map((b) => {
                const t = Number(targets[b.code]) || 0;
                const change = b.lastYearActual > 0 && targets[b.code] ? ((t - b.lastYearActual) / b.lastYearActual) * 100 : null;
                return (
                  <tr key={b.code} className="border-t border-[var(--border)] text-main">
                    <td className="px-3 py-2">
                      <span className="block font-medium">{b.name}</span>
                      <span className="block text-xs text-muted">{b.code} · {b.zone}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-muted">{fmt(b.lastYearActual)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={targets[b.code] ?? ""}
                        onChange={(e) => { setTargets((p) => ({ ...p, [b.code]: e.target.value })); setMethod("manual"); touch("targets"); }}
                        aria-label={`Target for ${b.name}`}
                        className={`${inputCls} py-1.5 text-right`}
                      />
                    </td>
                    <td className={`px-3 py-2 text-right text-xs ${change == null ? "text-muted" : change > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      {change == null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-muted">
                      {allocated > 0 && t > 0 ? `${((t / allocated) * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={unitDeadlines[b.code] ?? ""}
                        max={range.end}
                        onChange={(e) => { setUnitDeadlines((p) => ({ ...p, [b.code]: e.target.value })); touch(); }}
                        aria-label={`Own deadline for ${b.name}`}
                        className={`${inputCls} py-1.5 text-xs`}
                      />
                    </td>
                  </tr>
                );
              })}
              {covered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted">Select {pluralLower} in the previous step first.</td>
                </tr>
              )}
            </tbody>
            {covered.length > 0 && (
              <tfoot>
                <tr className="border-t border-[var(--border)] bg-[var(--border)]/10 text-sm font-semibold text-main">
                  <td className="px-3 py-2">Total allocated</td>
                  <td className="px-3 py-2 text-right text-muted">{fmt(covered.reduce((n, b) => n + b.lastYearActual, 0))}</td>
                  <td className="px-3 py-2 text-right">{fmt(allocated)}</td>
                  <td colSpan={3} className={`px-3 py-2 text-right text-xs ${envelopeNum > 0 ? (unallocated < 0 ? "text-danger" : "text-muted") : "text-muted"}`}>
                    {envelopeNum > 0
                      ? unallocated < 0
                        ? `${fmt(Math.abs(unallocated))} over the envelope`
                        : `${fmt(unallocated)} unallocated`
                      : "No envelope set"}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {errors.targets && <p role="alert" className="mt-2 text-xs text-danger">{errors.targets}</p>}
      </section>

      {/* Head rules */}
      <section className={`${sectionCard} p-5`}>
        <div className="mb-4 border-b border-[var(--border)] pb-3">
          <div className="text-sm font-semibold text-main">Rules for budget heads</div>
          <p className="mt-1 text-xs text-muted">
            Free: {pluralLower} decide the amount. Capped: {pluralLower} decide, up to the cap. Fixed: the amount is set from above and locked. Defaults come from Setup and can be changed for this plan.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-[var(--border)]/15 text-left text-xs font-medium text-muted">
                <th className="px-3 py-2">Budget head</th>
                <th className="px-3 py-2">Group</th>
                <th className="px-3 py-2">GL code</th>
                <th className="w-36 px-3 py-2">Control</th>
                <th className="w-44 px-3 py-2">Cap per {unitLower} ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {allocatedHeads.map((h) => {
                const r = ruleOf(h);
                return (
                  <tr key={h.id} className="border-t border-[var(--border)] text-main">
                    <td className="px-3 py-2 font-medium">{h.name}</td>
                    <td className="px-3 py-2 text-muted">{GROUP_LABEL[h.group]}</td>
                    <td className="whitespace-nowrap px-3 py-2">{h.glCode}</td>
                    <td className="px-3 py-2">
                      <select
                        value={r.control}
                        onChange={(e) => setRule(h, { control: e.target.value as ControlLevel })}
                        aria-label={`Control for ${h.name}`}
                        className={`${inputCls} py-1.5 text-xs`}
                      >
                        {CONTROL_LEVELS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        disabled={r.control !== "Capped"}
                        value={r.control === "Capped" ? r.cap : ""}
                        onChange={(e) => setRule(h, { cap: e.target.value })}
                        aria-label={`Cap for ${h.name}`}
                        placeholder={r.control === "Capped" ? "Required" : "—"}
                        className={`${inputCls} py-1.5 text-right disabled:opacity-50`}
                      />
                    </td>
                  </tr>
                );
              })}
              {allocatedHeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted">Select budget head groups in the first step.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {errors.rules && <p role="alert" className="mt-2 text-xs text-danger">{errors.rules}</p>}

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-muted">Instructions for {pluralLower}</label>
          <textarea
            value={instructions}
            onChange={(e) => { setInstructions(e.target.value); touch(); }}
            rows={3}
            placeholder="What to prepare, how to justify increases, what to attach"
            className={`${inputCls} resize-none`}
          />
        </div>
      </section>
    </div>
  );

  const stepReview = (
    <div className="flex flex-col gap-4">
      <section className={`${sectionCard} p-5`}>
        <div className="mb-4 border-b border-[var(--border)] pb-3 text-sm font-semibold text-main">Review</div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4">
          {[
            ["Plan", name || "—"],
            ["Financial year", financialYear],
            ["Type", budgetType],
            ["Period", `${range.start} to ${range.end}`],
            ["Budget head groups", groupNames || "—"],
            [unitLabelPlural, isAll ? `All (${BRANCHES.length})` : `${selected.length} selected`],
            ["Extra heads", String(extraTotal)],
            ["Submission deadline", deadline || "—"],
            ["Total amount", envelopeNum > 0 ? `${fmt(envelopeNum)} ${currency}` : "Not set"],
            ["Allocated", `${fmt(allocated)} ${currency}`],
            ["Owner", owner || "You"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-medium text-main">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {issues.length > 0 && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertTriangle size={15} /> Fix these before creating the plan
          </div>
          <ul className="flex flex-col gap-1 text-sm text-red-700">
            {issues.map((i, idx) => (
              <li key={idx} className="flex items-center justify-between gap-3">
                <span>{i.msg}</span>
                <button type="button" onClick={() => { setStep(i.step); setErrors(validateStep(i.step)); }} className="shrink-0 text-xs underline">
                  Go to {STEPS[i.step]}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {warnings.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 text-sm font-semibold text-amber-800">Worth a look</div>
          <ul className="list-inside list-disc text-sm text-amber-800">
            {warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted">
        “Create plan” saves it as a draft that only you can see. “Create and publish” also notifies the selected {pluralLower}, and they can start submitting until the deadline.
      </p>
    </div>
  );

  // ── Render ──
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-4">
        <button type="button" onClick={handleBack} className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft size={14} /> Back to budget plans
        </button>

        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-main">Create budget plan</h2>
            <span className="rounded-full bg-[var(--border)]/40 px-2 py-0.5 text-xs text-muted">Draft</span>
          </div>
          
        </div>

        <Stepper step={step} maxStep={maxStep} onGo={goTo} />

        {step === 0 && stepBasics}
        {step === 1 && stepParticipants}
        {step === 2 && stepTargets}
        {step === 3 && stepReview}
      </div>

      {/* Sticky summary + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--card,#fff)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted">
          <span>
            {unitLabelPlural} <span className="font-semibold text-main">{isAll ? BRANCHES.length : selected.length}</span>
          </span>
          <span>
            Head groups <span className="font-semibold text-main">{groupIds.length}</span>
          </span>
          <span>
            Envelope{" "}
            <span className="font-semibold text-main">
              {envelopeNum > 0 ? `${fmt(allocated)} of ${fmt(envelopeNum)}` : "Not set"}
            </span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleBack} disabled={!!saving} className={btnGhost}>
            Cancel
          </button>
          <button type="button" onClick={onDraft} disabled={!!saving} className={`${btnGhost} inline-flex items-center gap-1.5`}>
            <Save size={14} /> {saving === "draft" ? "Saving…" : "Save as draft"}
          </button>
          {step > 0 && (
            <button type="button" onClick={goBack} disabled={!!saving} className={btnGhost}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} disabled={!!saving} className={btnPrimary}>
              Next
            </button>
          ) : (
            <>
              <button type="button" onClick={() => onFinish("create")} disabled={!!saving} className={btnGhost}>
                Create plan
              </button>
              <button type="button" onClick={() => onFinish("publish")} disabled={!!saving} className={btnPrimary}>
                Create and publish
              </button>
            </>
          )}
        </div>
      </div>

      {confirm === "create" && (
        <ConfirmDialog title="Create this budget plan?" confirmLabel="Create plan" busy={saving === "create"} onConfirm={() => save("create")} onCancel={() => setConfirm(null)}>
          “{name.trim()}” for {financialYear} will be created as a draft. {unitLabelPlural} can't see it until you publish it.
        </ConfirmDialog>
      )}
      {confirm === "publish" && (
        <ConfirmDialog title="Create and publish this plan?" confirmLabel="Create and publish" busy={saving === "publish"} onConfirm={() => save("publish")} onCancel={() => setConfirm(null)}>
          “{name.trim()}” will be sent to {isAll ? `all ${pluralLower}` : `${selected.length} ${selected.length === 1 ? unitLower : pluralLower}`}. They will be notified and can submit until {deadline}.
        </ConfirmDialog>
      )}
      {confirm === "discard" && (
        <ConfirmDialog title="Discard this plan?" confirmLabel="Discard" onConfirm={onBack} onCancel={() => setConfirm(null)}>
          Unsaved changes will be lost.
        </ConfirmDialog>
      )}
    </div>
  );
};

// ─── Unit table (selection + expandable budget heads) ─────────────────────────

interface BranchTableProps {
  rows: Branch[];
  unitLabel: string;
  selectable?: boolean;
  selected?: string[];
  single?: boolean;
  allOnPageSelected?: boolean;
  onToggle?: (code: string) => void;
  onTogglePage?: () => void;
  /** Whether the unit is part of this plan (only these rows can be expanded) */
  isCovered: (code: string) => boolean;
  expanded: string[];
  onToggleExpand: (code: string) => void;
  counts: (code: string) => { allocated: number; extra: number };
  renderDetail: (b: Branch) => React.ReactNode;
}

const BranchTable: React.FC<BranchTableProps> = ({
  rows,
  unitLabel,
  selectable,
  selected = [],
  single,
  allOnPageSelected,
  onToggle,
  onTogglePage,
  isCovered,
  expanded,
  onToggleExpand,
  counts,
  renderDetail,
}) => {
  const colSpan = (selectable ? 1 : 0) + 7;
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-[1] bg-[var(--card,#fff)]">
        <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-muted">
          {selectable && (
            <th className="w-10 px-3 py-2">
              {!single && (
                <input type="checkbox" aria-label="Select all on this page" checked={!!allOnPageSelected} onChange={onTogglePage} />
              )}
            </th>
          )}
          <th className="px-3 py-2">{unitLabel} code</th>
          <th className="px-3 py-2">{unitLabel} name</th>
          <th className="px-3 py-2">Zone</th>
          <th className="px-3 py-2">Region</th>
          <th className="px-3 py-2">Manager</th>
          <th className="px-3 py-2">Budget heads</th>
          <th className="w-24 px-3 py-2">
            <span className="sr-only">Show budget heads</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((b) => {
          const checked = selected.includes(b.code);
          const covered = isCovered(b.code);
          const open = covered && expanded.includes(b.code);
          const c = counts(b.code);
          return (
            <React.Fragment key={b.code}>
              <tr
                onClick={selectable ? () => onToggle?.(b.code) : undefined}
                className={`border-t border-[var(--border)] text-main ${selectable ? "cursor-pointer hover:bg-[var(--border)]/10" : ""} ${checked ? "bg-primary/5" : ""}`}
              >
                {selectable && (
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type={single ? "radio" : "checkbox"}
                      name="unit-select"
                      aria-label={`Select ${b.name}`}
                      checked={checked}
                      onChange={() => onToggle?.(b.code)}
                    />
                  </td>
                )}
                <td className="whitespace-nowrap px-3 py-2">{b.code}</td>
                <td className="px-3 py-2 font-medium">{b.name}</td>
                <td className="px-3 py-2 text-muted">{b.zone}</td>
                <td className="px-3 py-2 text-muted">{b.region}</td>
                <td className="px-3 py-2 text-muted">{b.manager}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted">
                  {covered ? (
                    <>
                      {c.allocated} allocated
                      {c.extra > 0 && <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-primary">+{c.extra} extra</span>}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  {covered && (
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-label={`${open ? "Hide" : "Show"} budget heads for ${b.name}`}
                      onClick={() => onToggleExpand(b.code)}
                      className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
                    >
                      Heads {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </td>
              </tr>
              {open && (
                <tr className="bg-[var(--border)]/10">
                  <td colSpan={colSpan} className="px-5 py-3">
                    {renderDetail(b)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
};

// ─── Expanded panel: allocated + unit-specific budget heads ──────────────────

const HeadsTable: React.FC<{ rows: HeadRef[]; onRemove?: (id: string) => void }> = ({ rows, onRemove }) => (
  <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card,#fff)]">
    <table className="w-full min-w-[560px] text-xs">
      <thead>
        <tr className="bg-[var(--border)]/15 text-left font-medium text-muted">
          <th className="px-3 py-1.5">Budget head</th>
          <th className="px-3 py-1.5">GL code</th>
          <th className="px-3 py-1.5">Cost centre</th>
          <th className="px-3 py-1.5">Programme</th>
          {onRemove && <th className="w-10 px-3 py-1.5" />}
        </tr>
      </thead>
      <tbody>
        {rows.map((h) => (
          <tr key={h.id} className="border-t border-[var(--border)] text-main">
            <td className="px-3 py-1.5 font-medium">{h.name}</td>
            <td className="whitespace-nowrap px-3 py-1.5">{h.glCode}</td>
            <td className="px-3 py-1.5">{h.costCentre}</td>
            <td className="px-3 py-1.5">{h.programme}</td>
            {onRemove && (
              <td className="px-3 py-1.5 text-center">
                <button type="button" aria-label={`Remove ${h.name}`} onClick={() => onRemove(h.id)} className="text-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const BranchHeadsPanel: React.FC<{
  unitName: string;
  groupName: string;
  allocated: HeadRef[];
  extras: HeadRef[];
  available: HeadRef[];
  onAdd: (headId: string) => void;
  onRemove: (headId: string) => void;
}> = ({ unitName, groupName, allocated, extras, available, onAdd, onRemove }) => {
  const [pick, setPick] = useState("");

  // Group the heads that can still be added by the group they come from
  const groups = useMemo(() => {
    const byGroup: Record<string, HeadRef[]> = {};
    available.forEach((h) => (byGroup[h.group] ??= []).push(h));
    return Object.entries(byGroup).map(([id, list]) => ({ id, label: GROUP_LABEL[id] ?? id, list }));
  }, [available]);

  return (
    <div className="flex flex-col gap-4 pl-1">
      <div>
        <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
          <h4 className="text-xs font-semibold text-main">Allocated budget heads</h4>
          {groupName && <span className="text-[11px] text-muted">From {groupName}, same for everyone in this plan</span>}
        </div>
        {allocated.length > 0 ? (
          <HeadsTable rows={allocated} />
        ) : (
          <p className="text-xs text-muted">Choose budget head groups in the first step to see the heads allocated here.</p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
          <h4 className="text-xs font-semibold text-main">Extra budget heads</h4>
          <span className="text-[11px] text-muted">Only for {unitName}</span>
        </div>
        {extras.length > 0 ? (
          <HeadsTable rows={extras} onRemove={onRemove} />
        ) : (
          <p className="text-xs text-muted">No extra heads yet.</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            aria-label={`Add a budget head for ${unitName}`}
            className={`${inputCls} w-auto min-w-[260px] py-1.5 text-xs`}
          >
            <option value="">Select a budget head to add</option>
            {groups.map((g) => (
              <optgroup key={g.id} label={g.label}>
                {g.list.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.glCode})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            disabled={!pick}
            onClick={() => {
              onAdd(pick);
              setPick("");
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={13} /> Add head
          </button>
          {groups.length === 0 && <span className="text-[11px] text-muted">No other budget heads available.</span>}
        </div>
      </div>
    </div>
  );
};

export default CreateBudgetPlan;