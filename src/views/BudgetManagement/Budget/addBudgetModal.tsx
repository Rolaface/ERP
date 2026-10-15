import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, Lock, Plus, Save, Search, Trash2 } from "lucide-react";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { showApiError, showSuccess } from "../../../utils/alert";

// ─── Types ────────────────────────────────────────────────────────────────────

type Opt = { value: string; label: string };

export interface Branch {
  code: string;
  name: string;
  zone: string;
  region: string;
}

/** A budget head line, as set up under a budget head name in Setup */
export interface HeadRef {
  id: string;
  name: string;
  glCode: string;
  costCentre: string;
  programme: string;
  group: string; // id of the budget head name it belongs to
}

export interface BudgetPlanPayload {
  name: string;
  financial_year: string;
  budget_type: string;
  budget_period: string;
  budget_head_id: string; // the budget head name chosen from Setup
  budget_head_name: string;
  /** Extra heads added for one branch only (on top of the heads under budget_head_id) */
  branch_heads: { branch_code: string; head_ids: string[] }[];
  scope: string; // Single Branch | Selected Branches | All Branches
  branch_codes: string[]; // empty when scope is All Branches (server resolves)
  start_date: string;
  end_date: string;
  description: string;
  owner: string;
  action: "draft" | "create"; // publishing for branch inputs is a separate step
}

interface CreateBudgetPlanProps {
  onBack: () => void;
  onSaved?: (payload: BudgetPlanPayload) => void;
  currentUser?: string;
  /** Only MIS officers (or similar) may create plans */
  canCreate?: boolean;
  /** Only users with this right can change the budget owner */
  canChangeOwner?: boolean;
  /** Month the financial year starts (1-12). April = 4 for India. */
  fyStartMonth?: number;
  initial?: Partial<BudgetPlanPayload>;
}

// ─── Static options and illustrative data ─────────────────────────────────────

const BUDGET_TYPES = ["Operating", "Capital Expenditure", "Project", "Special"];
const PERIODS = ["Annual", "Quarterly", "Monthly"];
const SCOPES = ["Single Branch", "Selected Branches", "All Branches"];

// TODO: replace with master-data APIs. Illustrative only.
const BRANCHES: Branch[] = [
  { code: "BR-0101", name: "Meerut Main", zone: "Zone North", region: "Western UP" },
  { code: "BR-0102", name: "Meerut Cantt", zone: "Zone North", region: "Western UP" },
  { code: "BR-0201", name: "Dehradun Central", zone: "Zone Hills", region: "Uttarakhand" },
  { code: "BR-0202", name: "Dehradun Rajpur Road", zone: "Zone Hills", region: "Uttarakhand" },
  { code: "BR-0301", name: "Haridwar", zone: "Zone Hills", region: "Uttarakhand" },
  { code: "BR-0302", name: "Roorkee", zone: "Zone Hills", region: "Uttarakhand" },
  { code: "BR-0401", name: "Agra Sadar", zone: "Zone Central", region: "Braj" },
  { code: "BR-0402", name: "Mathura", zone: "Zone Central", region: "Braj" },
];
// TODO: replace with API that returns active budget head names from Setup → Budget heads
const BUDGET_HEAD_NAMES: Opt[] = [
  { value: "BH-001", label: "Operating Expenses" },
  { value: "BH-002", label: "Capital Expenditure Items" },
  { value: "BH-003", label: "Staff Costs" },
];

// TODO: replace with API – heads under each budget head name (Setup → Budget heads). Dummy data.
const BUDGET_HEADS_DATA: HeadRef[] = [
  { id: "H-101", name: "Office Rent", glCode: "5101001", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-001" },
  { id: "H-102", name: "Electricity", glCode: "5101002", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-001" },
  { id: "H-103", name: "Housekeeping & Security", glCode: "5101003", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-001" },
  { id: "H-104", name: "Stationery & Printing", glCode: "5101004", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-001" },
  { id: "H-201", name: "IT Equipment", glCode: "1201001", costCentre: "CC-201 Information Technology", programme: "PRG-02 Digital Banking", group: "BH-002" },
  { id: "H-202", name: "Furniture & Fixtures", glCode: "1201002", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-002" },
  { id: "H-203", name: "Cash Handling Machines", glCode: "1201003", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-002" },
  { id: "H-301", name: "Staff Training", glCode: "5201001", costCentre: "CC-301 Human Resources", programme: "PRG-03 People Development", group: "BH-003" },
  { id: "H-302", name: "Travel Expenses", glCode: "5201002", costCentre: "CC-301 Human Resources", programme: "PRG-03 People Development", group: "BH-003" },
  { id: "H-303", name: "Overtime", glCode: "5201003", costCentre: "CC-301 Human Resources", programme: "PRG-03 People Development", group: "BH-003" },
];
const HEAD_BY_ID: Record<string, HeadRef> = Object.fromEntries(BUDGET_HEADS_DATA.map((h) => [h.id, h]));

const PAGE_SIZE = 8;

const filterStatic = (list: (string | Opt)[], search: string): Opt[] =>
  list
    .map((o) => (typeof o === "string" ? { value: o, label: o } : o))
    .filter((o) => o.label.toLowerCase().includes((search || "").toLowerCase()));
const staticFetcher = (list: (string | Opt)[]) => (search: string) =>
  Promise.resolve(filterStatic(list, search));

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

const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary";
const sectionCard = "rounded-xl border border-[var(--border)] bg-[var(--card,#fff)]";
const btnGhost =
  "rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-main hover:bg-[var(--border)]/20 disabled:opacity-50";
const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50";

// ─── Small shared pieces ──────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

const CreateBudgetPlan: React.FC<CreateBudgetPlanProps> = ({
  onBack,
  onSaved,
  currentUser = "",
  canCreate = true,
  canChangeOwner = false,
  fyStartMonth = 4,
  initial,
}) => {
  const fyOptions = useMemo(() => {
    const y = currentFyStartYear(fyStartMonth);
    return [y - 1, y, y + 1, y + 2].map(fyLabel);
  }, [fyStartMonth]);

  // Option fetchers
  const fetchYears = useMemo(() => staticFetcher(fyOptions), [fyOptions]);
  const fetchTypes = useMemo(() => staticFetcher(BUDGET_TYPES), []);
  const fetchPeriods = useMemo(() => staticFetcher(PERIODS), []);
  const fetchScopes = useMemo(() => staticFetcher(SCOPES), []);
  // TODO: replace with API – active budget head names
  const fetchBudgetHeads = useMemo(() => staticFetcher(BUDGET_HEAD_NAMES), []);

  // Details
  const [name, setName] = useState(initial?.name ?? "");
  const [financialYear, setFinancialYear] = useState(initial?.financial_year ?? fyOptions[1]);
  const [budgetType, setBudgetType] = useState(initial?.budget_type ?? "Operating");
  const [period, setPeriod] = useState(initial?.budget_period ?? "Annual");
  const [budgetHead, setBudgetHead] = useState<Opt | null>(
    initial?.budget_head_id
      ? { value: initial.budget_head_id, label: initial.budget_head_name ?? initial.budget_head_id }
      : null,
  );
  const [scope, setScope] = useState(initial?.scope ?? "Selected Branches");
  const initialRange = fyRange(financialYear, fyStartMonth);
  const [startDate, setStartDate] = useState(initial?.start_date ?? initialRange.start);
  const [endDate, setEndDate] = useState(initial?.end_date ?? initialRange.end);
  const datesEdited = useRef(!!initial?.start_date);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [owner, setOwner] = useState(initial?.owner ?? currentUser);

  // Branch selection
  const [selected, setSelected] = useState<string[]>(initial?.branch_codes ?? []);
  const [branchSearch, setBranchSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandedBranches, setExpandedBranches] = useState<string[]>([]);
  // Branch-specific heads: branch code → ids of extra heads added for that branch only
  const [branchHeads, setBranchHeads] = useState<Record<string, string[]>>(
    Object.fromEntries((initial?.branch_heads ?? []).map((b) => [b.branch_code, b.head_ids])),
  );

  // Page state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState<"draft" | "create" | null>(null);
  const [confirm, setConfirm] = useState<null | "create" | "discard">(null);

  const touch = (key?: string) => {
    setDirty(true);
    if (key) setErrors((p) => ({ ...p, [key]: "" }));
  };

  // ── Derived ──
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
        (!q || b.code.toLowerCase().includes(q) || b.name.toLowerCase().includes(q)),
    );
  }, [branchSearch, zoneFilter, regionFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [branchSearch, zoneFilter, regionFilter]);

  const single = scope === "Single Branch";

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((b) => selected.includes(b.code));
  const toggleBranch = (code: string) => {
    touch("branches");
    setSelected((p) => (single ? [code] : p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));
  };
  const togglePage = () => {
    touch("branches");
    const codes = pageRows.map((b) => b.code);
    setSelected((p) => (allOnPageSelected ? p.filter((c) => !codes.includes(c)) : Array.from(new Set([...p, ...codes]))));
  };
  const selectAllFiltered = () => {
    touch("branches");
    setSelected((p) => Array.from(new Set([...p, ...filtered.map((b) => b.code)])));
  };

  const allocatedHeads = useMemo(
    () => (budgetHead ? BUDGET_HEADS_DATA.filter((h) => h.group === budgetHead.value) : []),
    [budgetHead],
  );
  const isCovered = (code: string) => scope === "All Branches" || selected.includes(code);
  const coveredCodes = scope === "All Branches" ? BRANCHES.map((b) => b.code) : selected;
  const extraTotal = coveredCodes.reduce((n, c) => n + (branchHeads[c]?.length ?? 0), 0);

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
  const changeBudgetHead = (opt: Opt | null) => {
    setBudgetHead(opt);
    // Heads that now belong to the chosen name no longer need to be branch-specific
    if (opt) {
      setBranchHeads((p) =>
        Object.fromEntries(
          Object.entries(p).map(([code, ids]) => [code, ids.filter((id) => HEAD_BY_ID[id]?.group !== opt.value)]),
        ),
      );
    }
    touch("budgetHead");
  };

  const renderBranchDetail = (b: Branch) => {
    const ids = branchHeads[b.code] ?? [];
    return (
      <BranchHeadsPanel
        branch={b}
        groupName={budgetHead?.label ?? ""}
        allocated={allocatedHeads}
        extras={ids.map((id) => HEAD_BY_ID[id]).filter(Boolean)}
        available={BUDGET_HEADS_DATA.filter((h) => h.group !== budgetHead?.value && !ids.includes(h.id))}
        onAdd={(id) => addBranchHead(b.code, id)}
        onRemove={(id) => removeBranchHead(b.code, id)}
      />
    );
  };
  const branchTableProps = {
    isCovered,
    expanded: expandedBranches,
    onToggleExpand: toggleExpand,
    counts: (code: string) => ({ allocated: allocatedHeads.length, extra: branchHeads[code]?.length ?? 0 }),
    renderDetail: renderBranchDetail,
  };

  // ── Handlers ──
  const changeFY = (v: string) => {
    setFinancialYear(v);
    if (v && !datesEdited.current) {
      const r = fyRange(v, fyStartMonth);
      setStartDate(r.start);
      setEndDate(r.end);
    }
    touch("financialYear");
  };

  const changeScope = (v: string) => {
    if (!v) return;
    setScope(v);
    if (v === "Single Branch") setSelected((p) => p.slice(0, 1));
    touch("scope");
    setErrors((p) => ({ ...p, branches: "" }));
  };

  const validate = (forCreate: boolean) => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Budget name is required";
    if (forCreate) {
      if (!financialYear) e.financialYear = "Select a financial year";
      if (!budgetType) e.budgetType = "Select a budget type";
      if (!budgetHead) e.budgetHead = "Select a budget head";
      if (!period) e.period = "Select a budget period";
      if (!scope) e.scope = "Select a scope";
      if (!startDate) e.startDate = "Select a start date";
      if (!endDate) e.endDate = "Select an end date";
      if (startDate && endDate && endDate < startDate) e.endDate = "End date must be after the start date";
      if (scope !== "All Branches" && selected.length === 0)
        e.branches = single ? "Select a branch" : "Select at least one branch";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (action: "draft" | "create") => {
    const payload: BudgetPlanPayload = {
      name: name.trim(),
      financial_year: financialYear,
      budget_type: budgetType,
      budget_period: period,
      budget_head_id: budgetHead?.value ?? "",
      budget_head_name: budgetHead?.label ?? "",
      scope,
      branch_codes: scope === "All Branches" ? [] : selected,
      branch_heads: coveredCodes
        .filter((c) => (branchHeads[c]?.length ?? 0) > 0)
        .map((c) => ({ branch_code: c, head_ids: branchHeads[c] })),
      start_date: startDate,
      end_date: endDate,
      description,
      owner,
      action,
    };
    setSaving(action);
    try {
      // TODO: call create-plan API with `payload`.
      //   The server should reject a duplicate active plan for the same
      //   financial year / type / scope where bank rules require it, assign the
      //   plan ID (e.g. BUD-2027-001) and set status "Draft".
      //   The plan picks up every budget head under `budget_head_id`.
      //   Publishing for branch inputs happens on the next screen.
      showSuccess(action === "create" ? "Budget plan created" : "Budget plan saved as draft");
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

  const onDraft = () => validate(false) && save("draft");
  const onCreate = () => validate(true) && setConfirm("create");
  const handleBack = () => (dirty ? setConfirm("discard") : onBack());

  if (!canCreate) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <Lock size={22} className="text-muted" />
        <p className="text-sm font-medium text-main">You don't have permission to create budget plans</p>
        <p className="max-w-sm text-xs text-muted">Budget plans are created by the MIS office. Ask your administrator to grant access.</p>
        <button type="button" onClick={onBack} className={`${btnGhost} mt-2`}>
          Back to budget plans
        </button>
      </div>
    );
  }

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
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Set up the plan for the year. Branches submit their requirements after you publish the plan, and nothing is allocated until final approval.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Basic information */}
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

              <div className="col-span-12 md:col-span-6">
                <SearchSelect2
                  label="Budget head"
                  required
                  value={budgetHead?.label ?? ""}
                  onChange={(v, opt) => changeBudgetHead(v ? { value: v, label: opt?.label || v } : null)}
                  fetchOptions={fetchBudgetHeads}
                  placeholder="Select budget head"
                  error={errors.budgetHead}
                />
                <p className="mt-1 text-[11px] text-muted">
                  The plan includes every budget head set up under this name in Setup.
                </p>
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
                  label="Scope"
                  required
                  value={scope}
                  onChange={(v) => changeScope(v || "")}
                  fetchOptions={fetchScopes}
                  placeholder="Select scope"
                  error={errors.scope}
                />
              </div>

              <div className="col-span-6 md:col-span-3">
                <ModalInput
                  label="Start date"
                  name="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => { datesEdited.current = true; setStartDate(e.target.value); touch("startDate"); }}
                  error={errors.startDate}
                  required
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <ModalInput
                  label="End date"
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => { datesEdited.current = true; setEndDate(e.target.value); touch("endDate"); }}
                  error={errors.endDate}
                  required
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                {canChangeOwner ? (
                  <ModalInput
                    label="Budget owner"
                    name="owner"
                    value={owner}
                    onChange={(e) => { setOwner(e.target.value); touch(); }}
                  />
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

          {/* Branch selection */}
          <section className={sectionCard}>
            <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
              <div className="text-sm font-semibold text-main">Participating branches</div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary" aria-live="polite">
                {scope === "All Branches"
                  ? `All ${BRANCHES.length} branches`
                  : `${selected.length} of ${BRANCHES.length} selected`}
              </span>
            </div>

            {scope === "All Branches" ? (
              <div className="px-5 pb-5">
                <p className="text-sm text-muted">
                  This plan covers every active branch, including branches opened later in the year. You don't need to select them one by one.
                </p>
                <button
                  type="button"
                  aria-expanded={allExpanded}
                  onClick={() => setAllExpanded((v) => !v)}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {allExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {allExpanded ? "Hide branch list" : `View all ${BRANCHES.length} branches`}
                </button>
                {allExpanded && (
                  <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-[var(--border)]">
                    <BranchTable rows={BRANCHES} {...branchTableProps} />
                  </div>
                )}
              </div>
            ) : (
              <div className="px-5 pb-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[220px] flex-1">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      value={branchSearch}
                      onChange={(e) => setBranchSearch(e.target.value)}
                      placeholder="Search by branch code or name"
                      aria-label="Search branches"
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
                  {!single && filtered.length > 0 && (
                    <button type="button" onClick={selectAllFiltered} className="text-sm text-primary hover:underline">
                      Select all {filtered.length} shown
                    </button>
                  )}
                  {selected.length > 0 && (
                    <button type="button" onClick={() => { setSelected([]); touch("branches"); }} className="text-sm text-muted hover:text-main hover:underline">
                      Clear
                    </button>
                  )}
                </div>

                <div className="max-h-[360px] overflow-auto rounded-lg border border-[var(--border)]">
                  <BranchTable
                    rows={pageRows}
                    selectable
                    selected={selected}
                    single={single}
                    onToggle={toggleBranch}
                    allOnPageSelected={allOnPageSelected}
                    onTogglePage={togglePage}
                    {...branchTableProps}
                  />
                  {pageRows.length === 0 && (
                    <p className="py-10 text-center text-sm text-muted">No branches match these filters.</p>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <span>
                    {filtered.length} branch{filtered.length === 1 ? "" : "es"} · Page {page} of {pageCount}
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
                {errors.branches && <p role="alert" className="mt-2 text-xs text-danger">{errors.branches}</p>}
                <p className="mt-2 text-[11px] text-muted">
                  Select a branch, then use the arrow on its right to see its budget heads or add branch-specific ones. Branch list and heads are dummy data until connected to master data.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Sticky summary + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--card,#fff)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted">
          <span>
            Branches <span className="font-semibold text-main">{scope === "All Branches" ? BRANCHES.length : selected.length}</span>
          </span>
          <span>
            Budget head <span className="font-semibold text-main">{budgetHead?.label ?? "Not selected"}</span>
          </span>
          <span>
            Branch-specific heads <span className="font-semibold text-main">{extraTotal}</span>
          </span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleBack} disabled={!!saving} className={btnGhost}>
            Cancel
          </button>
          <button type="button" onClick={onDraft} disabled={!!saving} className={`${btnGhost} inline-flex items-center gap-1.5`}>
            <Save size={14} /> {saving === "draft" ? "Saving…" : "Save as draft"}
          </button>
          <button type="button" onClick={onCreate} disabled={!!saving} className={btnPrimary}>
            Create plan
          </button>
        </div>
      </div>

      {confirm === "create" && (
        <ConfirmDialog title="Create this budget plan?" confirmLabel="Create plan" busy={saving === "create"} onConfirm={() => save("create")} onCancel={() => setConfirm(null)}>
          “{name.trim()}” for {financialYear} will be created as a draft. Branches can't see it until you publish it for inputs.
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

// ─── Branch table (selection + expandable budget heads) ───────────────────────

interface BranchTableProps {
  rows: Branch[];
  selectable?: boolean;
  selected?: string[];
  single?: boolean;
  allOnPageSelected?: boolean;
  onToggle?: (code: string) => void;
  onTogglePage?: () => void;
  /** Whether the branch is part of this plan (only these rows can be expanded) */
  isCovered: (code: string) => boolean;
  expanded: string[];
  onToggleExpand: (code: string) => void;
  counts: (code: string) => { allocated: number; extra: number };
  renderDetail: (b: Branch) => React.ReactNode;
}

const BranchTable: React.FC<BranchTableProps> = ({
  rows,
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
  const colSpan = (selectable ? 1 : 0) + 6;
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-[1] bg-[var(--card,#fff)]">
        <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-muted">
          {selectable && (
            <th className="w-10 px-3 py-2">
              {!single && (
                <input type="checkbox" aria-label="Select all branches on this page" checked={!!allOnPageSelected} onChange={onTogglePage} />
              )}
            </th>
          )}
          <th className="px-3 py-2">Branch code</th>
          <th className="px-3 py-2">Branch name</th>
          <th className="px-3 py-2">Zone</th>
          <th className="px-3 py-2">Region</th>
          <th className="px-3 py-2">Budget heads</th>
          <th className="w-12 px-3 py-2">
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
                      name="branch-select"
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
                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted">
                  {covered ? (
                    <>
                      {c.allocated} allocated
                      {c.extra > 0 && <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-primary">+{c.extra} branch-specific</span>}
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
                      className="rounded p-1 text-muted hover:bg-[var(--border)]/30 hover:text-primary"
                    >
                      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
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

// ─── Expanded panel: allocated + branch-specific budget heads ────────────────

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
  branch: Branch;
  groupName: string;
  allocated: HeadRef[];
  extras: HeadRef[];
  available: HeadRef[];
  onAdd: (headId: string) => void;
  onRemove: (headId: string) => void;
}> = ({ branch, groupName, allocated, extras, available, onAdd, onRemove }) => {
  const [pick, setPick] = useState("");

  // Group the heads that can still be added by the budget head name they come from
  const groups = useMemo(() => {
    const names: Record<string, string> = Object.fromEntries(BUDGET_HEAD_NAMES.map((g) => [g.value, g.label]));
    const byGroup: Record<string, HeadRef[]> = {};
    available.forEach((h) => (byGroup[h.group] ??= []).push(h));
    return Object.entries(byGroup).map(([id, list]) => ({ id, label: names[id] ?? id, list }));
  }, [available]);

  return (
    <div className="flex flex-col gap-4 pl-1">
      <div>
        <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
          <h4 className="text-xs font-semibold text-main">Allocated budget heads</h4>
          {groupName && <span className="text-[11px] text-muted">From {groupName}, same for every branch in this plan</span>}
        </div>
        {allocated.length > 0 ? (
          <HeadsTable rows={allocated} />
        ) : (
          <p className="text-xs text-muted">Choose a budget head above to see the heads allocated to this branch.</p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
          <h4 className="text-xs font-semibold text-main">Branch-specific budget heads</h4>
          <span className="text-[11px] text-muted">Only for {branch.name}</span>
        </div>
        {extras.length > 0 ? (
          <HeadsTable rows={extras} onRemove={onRemove} />
        ) : (
          <p className="text-xs text-muted">No extra heads for this branch yet.</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            aria-label={`Add a budget head for ${branch.name}`}
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