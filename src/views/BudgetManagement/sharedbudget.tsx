import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

// ─── Styles ───────────────────────────────────────────────────────────────────

export const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary";
export const sectionCard = "rounded-xl border border-[var(--border)] bg-[var(--card,#fff)]";
export const btnGhost =
  "rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-main hover:bg-[var(--border)]/20 disabled:opacity-50";
export const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export type Opt = { value: string; label: string };

export const staticFetcher = (list: string[]) => (search: string): Promise<Opt[]> =>
  Promise.resolve(
    list
      .filter((o) => o.toLowerCase().includes((search || "").toLowerCase()))
      .map((o) => ({ value: o, label: o })),
  );

export const fmt = (n: number) => n.toLocaleString("en-IN");
export const inr = (n: number) => `₹${fmt(n)}`;

export const formatDate = (date: string) => {
  if (!date) return "—";
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const [y, m, d] = date.split(/[T ]/)[0].split("-").map(Number);
  return `${String(d).padStart(2, "0")}-${months[m - 1]}-${y}`;
};

export const today = () => new Date().toISOString().slice(0, 10);

const PILL: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  "Open for input": "bg-blue-50 text-blue-700",
  "In approval": "bg-amber-50 text-amber-700",
  Active: "bg-emerald-50 text-emerald-700",
  Closed: "bg-gray-100 text-gray-600",
  Inactive: "bg-gray-100 text-gray-600",
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
  "On track": "bg-emerald-50 text-emerald-700",
  Watch: "bg-amber-50 text-amber-700",
  Over: "bg-red-50 text-red-700",
  Free: "bg-gray-100 text-gray-700",
  Capped: "bg-amber-50 text-amber-700",
  Fixed: "bg-blue-50 text-blue-700",
  Allow: "bg-gray-100 text-gray-700",
  Warn: "bg-amber-50 text-amber-700",
  Block: "bg-red-50 text-red-700",
};

export const StatusPill: React.FC<{ value: string }> = ({ value }) => (
  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${PILL[value] ?? "bg-gray-100 text-gray-700"}`}>{value}</span>
);

// ─── Small UI pieces ──────────────────────────────────────────────────────────

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-muted">{label}</label>
    {children}
  </div>
);

export const ReadOnly: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Field label={label}>
    <div className="flex h-[38px] items-center rounded-lg border border-[var(--border)] bg-[var(--border)]/15 px-3 text-sm text-main">{value}</div>
  </Field>
);

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              on ? "border-primary bg-primary/5 font-medium text-primary" : "border-[var(--border)] text-main hover:bg-[var(--border)]/15"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export const FormModal: React.FC<{
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: () => void;
  wide?: boolean;
  children: React.ReactNode;
}> = ({ title, submitLabel, onClose, onSubmit, wide, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col rounded-xl bg-[var(--card,#fff)] shadow-xl ${wide ? "max-w-2xl" : "max-w-xl"}`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-base font-semibold text-main">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-main">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button type="button" onClick={onSubmit} className={btnPrimary}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Local table state (search, filter, sort, paging in the browser) ──────────

export function useLocalTable<T extends Record<string, any>>(
  rows: T[],
  o: {
    searchKeys: string[];
    sortBy: string;
    sortOrder?: "asc" | "desc";
    filters?: { key: string; label: string; options: { label: string; value: string }[] }[];
  },
) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState(o.sortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(o.sortOrder ?? "desc");
  const [fv, setFv] = useState<Record<string, string[]>>({});

  const processed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter(
      (r) =>
        Object.entries(fv).every(([k, v]) => !v.length || v.includes(String(r[k]))) &&
        (!q || o.searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q))),
    );
    const dir = sortOrder === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[sortBy] ?? "";
      const bv = b[sortBy] ?? "";
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  }, [rows, search, fv, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const tableProps = {
    data: processed.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    searchValue: search,
    onSearch: (q: string) => {
      setSearch(q);
      setPage(1);
    },
    currentPage,
    totalPages,
    pageSize,
    totalItems: processed.length,
    pageSizeOptions: [20, 35, 45, 55, 100],
    onPageSizeChange: (s: number) => {
      setPageSize(s);
      setPage(1);
    },
    onPageChange: setPage,
    sortBy,
    sortOrder,
    onSortChange: ({ sortBy: k, sortOrder: d }: { sortBy: string; sortOrder: "asc" | "desc" }) => {
      setSortBy(k);
      setSortOrder(d);
      setPage(1);
    },
    multiSelectFilters: (o.filters ?? []).map((f) => ({
      key: f.key,
      label: f.label,
      options: f.options,
      values: fv[f.key] ?? [],
      onChange: (vals: string[]) => {
        setFv((p) => ({ ...p, [f.key]: vals }));
        setPage(1);
      },
    })),
  };

  return { processed, tableProps };
}

// ─── Dummy master data ────────────────────────────────────────────────────────

export type ControlLevel = "Free" | "Capped" | "Fixed";
export type Overspend = "Allow" | "Warn" | "Block";

export const COST_CENTRES = ["CC-101 Branch Operations", "CC-201 Information Technology", "CC-301 Human Resources"];
export const PROGRAMMES = ["PRG-01 Branch Operations", "PRG-02 Digital Banking", "PRG-03 People Development"];
export const ROLES = ["Branch Manager", "Zonal Manager", "Head of Department", "Head of Finance", "Chief Officer", "CFO", "Board"];

export interface HeadGroup {
  id: string;
  label: string;
  type: "Operating" | "Capital";
}
export const GROUPS: HeadGroup[] = [
  { id: "BH-001", label: "Operating Expenses", type: "Operating" },
  { id: "BH-002", label: "Capital Expenditure Items", type: "Capital" },
  { id: "BH-003", label: "Staff Costs", type: "Operating" },
];
export const GROUP_LABEL: Record<string, string> = Object.fromEntries(GROUPS.map((g) => [g.id, g.label]));

export interface HeadRef {
  id: string;
  code: string;
  name: string;
  glCode: string;
  costCentre: string;
  programme: string;
  group: string;
  type: "Operating" | "Capital";
  control: ControlLevel;
  cap: number;
  overspend: Overspend;
}
export const HEADS: HeadRef[] = [
  { id: "H-101", code: "OPX-001", name: "Office Rent", glCode: "5101001", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-001", type: "Operating", control: "Fixed", cap: 0, overspend: "Block" },
  { id: "H-102", code: "OPX-002", name: "Electricity", glCode: "5101002", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-001", type: "Operating", control: "Capped", cap: 120000, overspend: "Warn" },
  { id: "H-103", code: "OPX-003", name: "Housekeeping & Security", glCode: "5101003", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-001", type: "Operating", control: "Capped", cap: 90000, overspend: "Warn" },
  { id: "H-104", code: "OPX-004", name: "Stationery & Printing", glCode: "5101004", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-001", type: "Operating", control: "Free", cap: 0, overspend: "Warn" },
  { id: "H-201", code: "CPX-001", name: "IT Equipment", glCode: "1201001", costCentre: "CC-201 Information Technology", programme: "PRG-02 Digital Banking", group: "BH-002", type: "Capital", control: "Capped", cap: 500000, overspend: "Block" },
  { id: "H-202", code: "CPX-002", name: "Furniture & Fixtures", glCode: "1201002", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-002", type: "Capital", control: "Free", cap: 0, overspend: "Block" },
  { id: "H-203", code: "CPX-003", name: "Cash Handling Machines", glCode: "1201003", costCentre: "CC-101 Branch Operations", programme: "PRG-01 Branch Operations", group: "BH-002", type: "Capital", control: "Fixed", cap: 0, overspend: "Block" },
  { id: "H-301", code: "STF-001", name: "Staff Training", glCode: "5201001", costCentre: "CC-301 Human Resources", programme: "PRG-03 People Development", group: "BH-003", type: "Operating", control: "Capped", cap: 200000, overspend: "Warn" },
  { id: "H-302", code: "STF-002", name: "Travel Expenses", glCode: "5201002", costCentre: "CC-301 Human Resources", programme: "PRG-03 People Development", group: "BH-003", type: "Operating", control: "Capped", cap: 150000, overspend: "Warn" },
  { id: "H-303", code: "STF-003", name: "Overtime", glCode: "5201003", costCentre: "CC-301 Human Resources", programme: "PRG-03 People Development", group: "BH-003", type: "Operating", control: "Free", cap: 0, overspend: "Allow" },
];

export interface Participant {
  code: string;
  name: string;
  type: "Branch" | "Department";
  cluster: string; // zone / division
  place: string; // region / cost centre
  owner: string;
  lastYearBudget: number;
  lastYearActual: number;
}
export const PARTICIPANTS: Participant[] = [
  { code: "BR-0101", name: "Meerut Main", type: "Branch", cluster: "Zone North", place: "Western UP", owner: "Rohit Verma", lastYearBudget: 2500000, lastYearActual: 2400000 },
  { code: "BR-0102", name: "Meerut Cantt", type: "Branch", cluster: "Zone North", place: "Western UP", owner: "Sneha Gupta", lastYearBudget: 1450000, lastYearActual: 1500000 },
  { code: "BR-0201", name: "Dehradun Central", type: "Branch", cluster: "Zone Hills", place: "Uttarakhand", owner: "Amit Rawat", lastYearBudget: 3000000, lastYearActual: 2900000 },
  { code: "BR-0202", name: "Dehradun Rajpur Road", type: "Branch", cluster: "Zone Hills", place: "Uttarakhand", owner: "Neha Bisht", lastYearBudget: 1800000, lastYearActual: 1800000 },
  { code: "BR-0301", name: "Haridwar", type: "Branch", cluster: "Zone Hills", place: "Uttarakhand", owner: "Pankaj Joshi", lastYearBudget: 1650000, lastYearActual: 1600000 },
  { code: "BR-0302", name: "Roorkee", type: "Branch", cluster: "Zone Hills", place: "Uttarakhand", owner: "Kavita Negi", lastYearBudget: 1150000, lastYearActual: 1200000 },
  { code: "BR-0401", name: "Agra Sadar", type: "Branch", cluster: "Zone Central", place: "Braj", owner: "Vikas Sharma", lastYearBudget: 2300000, lastYearActual: 2200000 },
  { code: "BR-0402", name: "Mathura", type: "Branch", cluster: "Zone Central", place: "Braj", owner: "Pooja Yadav", lastYearBudget: 1400000, lastYearActual: 1400000 },
  { code: "DP-01", name: "Information Technology", type: "Department", cluster: "Corporate Functions", place: "CC-201", owner: "Anil Kapoor", lastYearBudget: 4200000, lastYearActual: 3900000 },
  { code: "DP-02", name: "Human Resources", type: "Department", cluster: "Corporate Functions", place: "CC-301", owner: "Ritu Malhotra", lastYearBudget: 2100000, lastYearActual: 2000000 },
  { code: "DP-03", name: "Operations", type: "Department", cluster: "Business Functions", place: "CC-101", owner: "Sandeep Arora", lastYearBudget: 3100000, lastYearActual: 3200000 },
  { code: "DP-04", name: "Finance & Accounts", type: "Department", cluster: "Corporate Functions", place: "CC-401", owner: "Manish Tyagi", lastYearBudget: 1700000, lastYearActual: 1600000 },
];

export interface WorkflowStep {
  role: string;
  above: number; // step applies when the amount is above this (0 = always)
}
export interface Workflow {
  id: string;
  name: string;
  appliesTo: "Budget plan" | "Transfer" | "Supplementary";
  steps: WorkflowStep[];
  updatedAt: string;
}
export const WORKFLOWS: Workflow[] = [
  { id: "WF-01", name: "Standard plan approval", appliesTo: "Budget plan", steps: [{ role: "Zonal Manager", above: 0 }, { role: "Head of Finance", above: 0 }, { role: "Chief Officer", above: 0 }, { role: "Board", above: 5000000 }], updatedAt: "2026-09-18" },
  { id: "WF-02", name: "Capital plan approval", appliesTo: "Budget plan", steps: [{ role: "Head of Finance", above: 0 }, { role: "CFO", above: 0 }, { role: "Board", above: 0 }], updatedAt: "2026-09-18" },
  { id: "WF-03", name: "Transfer approval", appliesTo: "Transfer", steps: [{ role: "Head of Department", above: 0 }, { role: "Head of Finance", above: 500000 }], updatedAt: "2026-09-21" },
  { id: "WF-04", name: "Supplementary approval", appliesTo: "Supplementary", steps: [{ role: "Head of Finance", above: 0 }, { role: "Chief Officer", above: 0 }, { role: "Board", above: 1000000 }], updatedAt: "2026-09-21" },
];

export interface PlanRef {
  code: string;
  name: string;
  financialYear: string;
  type: string;
  version: string;
  participants: number;
  submitted: number;
  envelope: number;
  allocated: number;
  deadline: string;
  workflow: string;
  status: string;
}
export const PLANS: PlanRef[] = [
  { code: "BUD-2627-001", name: "Annual Operating Budget", financialYear: "FY 2026–27", type: "Operating", version: "v1 Original", participants: 12, submitted: 12, envelope: 52000000, allocated: 51400000, deadline: "2026-02-28", workflow: "Standard plan approval", status: "Active" },
  { code: "BUD-2627-002", name: "Capital Expenditure Plan", financialYear: "FY 2026–27", type: "Capital", version: "v1 Original", participants: 6, submitted: 6, envelope: 12000000, allocated: 11200000, deadline: "2026-03-10", workflow: "Capital plan approval", status: "In approval" },
  { code: "BUD-2728-001", name: "Annual Operating Budget", financialYear: "FY 2027–28", type: "Operating", version: "v1 Original", participants: 12, submitted: 5, envelope: 56000000, allocated: 55200000, deadline: "2026-11-30", workflow: "Standard plan approval", status: "Open for input" },
  { code: "BUD-2728-002", name: "Staff Cost Plan", financialYear: "FY 2027–28", type: "Operating", version: "v1 Original", participants: 4, submitted: 0, envelope: 0, allocated: 0, deadline: "2026-12-15", workflow: "Standard plan approval", status: "Draft" },
  { code: "BUD-2526-001", name: "Annual Operating Budget", financialYear: "FY 2025–26", type: "Operating", version: "v3 Revised", participants: 12, submitted: 12, envelope: 47500000, allocated: 47500000, deadline: "2025-02-28", workflow: "Standard plan approval", status: "Closed" },
];
export const LIVE_PLANS = PLANS.filter((p) => p.status === "Active").map((p) => `${p.code} · ${p.name} (${p.financialYear})`);