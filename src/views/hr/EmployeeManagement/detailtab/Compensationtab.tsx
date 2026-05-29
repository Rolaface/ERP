import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown, ChevronUp, Calendar, Layers,
  Clock, AlertCircle, Loader2, Search, X,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

import { fmtMoney }                              from "./Employeehelpers";
import { getSalaryStructureAssignmentsByEmployee, type SalaryStructureAssignment } from "../../../../api/payroll/payrollEntryApi";
import { getSalaryStructure }                    from "../../../../api/payrollConfigApi";
import { calculateSalary, structureToComponents, type ComponentResult } from "../../../../components/Hr/employeedirectorymodal/salaryengine";
import Pagination                                from "../../../../components/Pagination";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 7;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  emp: any;
  currency: string;
}

interface ColDef {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  hideBelow?: "sm" | "md" | "lg";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: ColDef[] = [
  { key: "expand",           label: "",               align: "center"              },
  { key: "salary_structure", label: "Structure",      align: "left"                },
  { key: "name",             label: "Reference",      align: "left",  hideBelow: "md" },
  { key: "from_date",        label: "Effective From", align: "left",  hideBelow: "sm" },
  { key: "base",             label: "Base",           align: "right"               },
];

const HIDE_CLS: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtNum = (n: number, cur: string) =>
  fmtMoney(n, cur) ??
  `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function useCssVar(name: string, fallback: string): string {
  const [val, setVal] = useState(fallback);
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (v) setVal(v);
  }, [name]);
  return val;
}

function useToday() {
  return useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SkeletonTr: React.FC<{ cols: number }> = ({ cols }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3 border-b border-[var(--border)]">
        <div className="h-3 rounded-full bg-[var(--border)]" style={{ width: `${55 + (i * 17) % 35}%` }} />
      </td>
    ))}
  </tr>
);

const BarTip = ({ active, payload, currency }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const colorMap: Record<string, string> = {
    Gross:      "var(--success, #22c55e)",
    Deductions: "var(--danger,  #dc2626)",
    Net:        "var(--primary)",
  };
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card px-3 py-2 min-w-[130px]">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1">{name}</p>
      <p className="text-[17px] font-extrabold tabular-nums leading-tight" style={{ color: colorMap[name] ?? "var(--primary)" }}>
        {fmtNum(value, currency)}
      </p>
      <p className="text-[9px] text-muted mt-0.5 tabular-nums">{fmtNum(value * 12, currency)} p.a.</p>
    </div>
  );
};

// ─── Expanded Panel ───────────────────────────────────────────────────────────

const ExpandedPanel: React.FC<{
  assignment: SalaryStructureAssignment;
  currency: string;
  colSpan: number;
}> = ({ assignment, currency, colSpan }) => {
  const primaryColor              = useCssVar("--primary", "#c0843d");
  const [structure, setStructure] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const contentRef                = useRef<HTMLDivElement>(null);
  const [height, setHeight]       = useState(0);

  useEffect(() => {
    if (contentRef.current) setHeight(contentRef.current.scrollHeight);
  }, [structure, error]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getSalaryStructure(assignment.salary_structure)
      .then(setStructure)
      .catch(() => setError("Failed to load salary structure details."))
      .finally(() => setLoading(false));
  }, [assignment.salary_structure]);

  const salaryResult = useMemo(() => {
    if (!structure) return null;
    return calculateSalary(assignment.base, structureToComponents(structure));
  }, [structure, assignment.base]);

  const cur = assignment.currency || currency;

  const renderBody = () => {
    if (loading)
      return (
        <div className="px-6 py-8 flex items-center justify-center gap-2 text-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading structure breakdown…
        </div>
      );

    if (error || !salaryResult)
      return (
        <div className="px-6 py-6 flex items-center gap-2 text-danger text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error ?? "No salary data available."}
        </div>
      );

    const { gross, deductionsTotal, net } = salaryResult;
    const earnings   = salaryResult.components.filter((c) => c.type === "Earning");
    const deductions = salaryResult.components.filter((c) => c.type === "Deduction");
    const maxLen     = Math.max(earnings.length, deductions.length);

    const pad = <T,>(arr: T[], len: number): (T | null)[] => [
      ...arr,
      ...Array(Math.max(0, len - arr.length)).fill(null),
    ];

    const earnPad = pad<ComponentResult>(earnings,   maxLen);
    const dedPad  = pad<ComponentResult>(deductions, maxLen);

    const barData   = [
      { name: "Gross",      value: gross           },
      { name: "Deductions", value: deductionsTotal  },
      { name: "Net",        value: net              },
    ];
    const barColors = [
      "var(--success, #22c55e)",
      "var(--danger,  #dc2626)",
      primaryColor,
    ];

    const netPct = gross > 0 ? Math.round((net            / gross) * 100) : 0;
    const dedPct = gross > 0 ? Math.round((deductionsTotal / gross) * 100) : 0;

    return (
      <div className="px-5 py-4 flex flex-col gap-4">

        {/* KPI strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { label: "Gross earnings",   value: gross,           cls: "text-success", bg: "rgba(34,197,94,0.07)",  bd: "rgba(34,197,94,0.18)"  },
            { label: "Total deductions", value: deductionsTotal, cls: "text-danger",  bg: "rgba(220,38,38,0.07)",  bd: "rgba(220,38,38,0.18)"  },
            { label: "Net salary",       value: net,             cls: "text-primary", bg: `color-mix(in srgb,${primaryColor} 7%,transparent)`, bd: `color-mix(in srgb,${primaryColor} 22%,transparent)` },
          ].map((k) => (
            <div key={k.label} className="rounded-xl px-4 py-3" style={{ background: k.bg, border: `1px solid ${k.bd}` }}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1.5">{k.label}</p>
              <p className={`text-[18px] font-extrabold tabular-nums leading-none ${k.cls}`}>{fmtNum(k.value, cur)}</p>
              <p className="text-[9px] text-muted tabular-nums mt-1">{fmtNum(k.value * 12, cur)} p.a.</p>
            </div>
          ))}
        </div>

        {/* Breakdown + chart */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 200px" }}>

          {/* Earnings vs Deductions table */}
          <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
            <div className="grid grid-cols-2 bg-app border-b border-[var(--border)]">
              <div className="flex items-center justify-between px-3 py-2 border-r border-[var(--border)]">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-success">Earnings</span>
                <span className="text-[9px] text-muted">Monthly</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-danger">Deductions</span>
                <span className="text-[9px] text-muted">Monthly</span>
              </div>
            </div>

            {maxLen === 0 ? (
              <p className="text-center text-[11px] text-muted py-5">No components defined.</p>
            ) : (
              earnPad.map((e, i) => {
                const d = dedPad[i];
                return (
                  <div key={i} className={`grid grid-cols-2 ${i < maxLen - 1 ? "border-b border-[var(--border)]" : ""}`}>
                    <div className="flex items-center justify-between px-3 py-1.5 border-r border-[var(--border)] hover:bg-[var(--row-hover)] min-w-0">
                      {e ? (
                        <>
                          <span className="text-[11px] font-medium text-main truncate pr-2">{e.name}</span>
                          <span className="text-[11px] font-semibold tabular-nums shrink-0 text-success">{fmtNum(e.amount, cur)}</span>
                        </>
                      ) : <span className="opacity-0">—</span>}
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5 hover:bg-[var(--row-hover)] min-w-0">
                      {d ? (
                        <>
                          <span className="text-[11px] font-medium text-main truncate pr-2">{d.name}</span>
                          <span className="text-[11px] font-semibold tabular-nums shrink-0 text-danger">−{fmtNum(d.amount, cur)}</span>
                        </>
                      ) : <span className="opacity-0">—</span>}
                    </div>
                  </div>
                );
              })
            )}

            <div className="grid grid-cols-3 border-t-2 border-[var(--border)]">
              {[
                { label: "Gross",      value: gross,           prefix: "",  cls: "text-success", bg: "bg-app" },
                { label: "Deductions", value: deductionsTotal, prefix: "−", cls: "text-danger",  bg: "bg-app" },
                { label: "Net salary", value: net,             prefix: "",  cls: "text-primary", bg: ""       },
              ].map((f, i) => (
                <div
                  key={f.label}
                  className={`px-3 py-2 ${i < 2 ? "border-r border-[var(--border)]" : ""} ${f.bg}`}
                  style={!f.bg ? { background: `color-mix(in srgb,${primaryColor} 6%,transparent)` } : undefined}
                >
                  <p className="text-[8px] font-bold uppercase tracking-wider text-muted mb-0.5">{f.label}</p>
                  <p className={`text-[12px] font-extrabold tabular-nums ${f.cls}`}>{f.prefix}{fmtNum(f.value, cur)}</p>
                  <p className="text-[9px] font-mono text-muted tabular-nums">{f.prefix}{fmtNum(f.value * 12, cur)} p.a.</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bar chart */}
          <div className="rounded-xl border border-[var(--border)] bg-card px-3 pt-4 pb-3 flex flex-col gap-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Composition</p>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={barData} barSize={24} margin={{ top: 2, right: 2, bottom: 0, left: -24 }}>
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: "var(--muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<BarTip currency={cur} />} cursor={{ fill: "var(--row-hover)" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={barColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-[var(--border)]">
              {[
                { label: "Take-home",  pct: netPct, cls: "text-primary" },
                { label: "Deductions", pct: dedPct, cls: "text-danger"  },
              ].map((b) => (
                <div key={b.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-muted">{b.label}</span>
                  <span className={`text-[11px] font-bold tabular-nums ${b.cls}`}>{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <tr>
      <td
        colSpan={colSpan}
        className="p-0 border-b border-[var(--border)]"
        style={{ borderTop: "2px solid color-mix(in srgb, var(--primary) 25%, transparent)" }}
      >
        <div
          style={{
            height:     loading ? "80px" : height ? `${height}px` : "auto",
            overflow:   "hidden",
            transition: "height 220ms cubic-bezier(0.4,0,0.2,1)",
            background: "var(--app-bg, var(--app))",
          }}
        >
          <div ref={contentRef}>{renderBody()}</div>
        </div>
      </td>
    </tr>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const SalaryStructureAssignmentsSection: React.FC<Props> = ({ emp, currency }) => {
  const today = useToday();

  const [assignments,  setAssignments]  = useState<SalaryStructureAssignment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [search,       setSearch]       = useState("");
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [page,         setPage]         = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);
  const [totalPages,   setTotalPages]   = useState(0);
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [autoExpanded, setAutoExpanded] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!emp.employee) return;
    setLoading(true);
    setError(null);

    getSalaryStructureAssignmentsByEmployee(emp.employee, page, PAGE_SIZE, search, fromDate, toDate)
      .then((result) => {
        setAssignments(result.data);
        const knownTotal = result.total;
        const knownPages = (result as any).totalPages
                        ?? (result as any).total_pages
                        ?? Math.ceil(knownTotal / PAGE_SIZE);
        setTotalCount(knownTotal);
        setTotalPages(knownPages);
      })
      .catch(() => setError("Failed to load salary structure assignments."))
      .finally(() => setLoading(false));
  }, [emp.employee, page, search, fromDate, toDate]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeAssignmentName = useMemo(() => {
    const past = assignments.filter((a) => new Date(a.from_date) <= today);
    if (!past.length) return null;
    return [...past].sort(
      (a, b) => new Date(b.from_date).getTime() - new Date(a.from_date).getTime(),
    )[0].name;
  }, [assignments, today]);

  // Auto-expand active row once on first load
  useEffect(() => {
    if (!autoExpanded && activeAssignmentName) {
      setExpandedName(activeAssignmentName);
      setAutoExpanded(true);
    }
  }, [activeAssignmentName, autoExpanded]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearch   = (v: string) => { setPage(1); setSearch(v);   };
  const handleFromDate = (v: string) => { setPage(1); setFromDate(v); };
  const handleToDate   = (v: string) => { setPage(1); setToDate(v);   };

  const clearFilters = () => {
    setPage(1);
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  const toggleRow = (name: string) =>
    setExpandedName((prev) => (prev === name ? null : name));

  const hasFilters  = !!(search || fromDate || toDate);
  const visibleCols = COLUMNS.length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-muted" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
            Salary Structure Assignments
          </span>
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {totalCount}
          </span>
        </div>
        <span className="text-[10px] text-muted">Click any row to expand breakdown</span>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-card">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search structure or reference…"
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-app border border-[var(--border)] rounded-lg
                text-main placeholder:text-muted outline-none
                hover:border-[var(--primary)] focus:border-[var(--primary)] transition-colors"
            />
          </div>

          <div className="w-px h-5 bg-[var(--border)] shrink-0 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-muted shrink-0" />
            <span className="text-[11px] text-muted whitespace-nowrap">From</span>
            <input type="date" value={fromDate} onChange={(e) => handleFromDate(e.target.value)}
              className="text-[12px] bg-app border border-[var(--border)] rounded-lg px-2 py-1.5 text-main outline-none hover:border-[var(--primary)] focus:border-[var(--primary)] transition-colors cursor-pointer" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted">To</span>
            <input type="date" value={toDate} onChange={(e) => handleToDate(e.target.value)}
              className="text-[12px] bg-app border border-[var(--border)] rounded-lg px-2 py-1.5 text-main outline-none hover:border-[var(--primary)] focus:border-[var(--primary)] transition-colors cursor-pointer" />
          </div>

          {hasFilters && (
            <>
              <div className="w-px h-5 bg-[var(--border)] shrink-0" />
              <button onClick={clearFilters}
                className="flex items-center gap-1 text-[11px] font-medium text-muted border border-[var(--border)] rounded-lg px-2.5 py-1.5 hover:text-main hover:bg-[var(--row-hover)] transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-6 flex items-center gap-3 text-danger text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        {/* Table */}
        {!error && (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--border)]/10">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={[
                        "px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted whitespace-nowrap border-b border-[var(--border)]",
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                        col.hideBelow ? HIDE_CLS[col.hideBelow] : "",
                      ].join(" ")}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonTr key={i} cols={visibleCols} />
                ))}

                {!loading && assignments.length === 0 && (
                  <tr>
                    <td colSpan={visibleCols} className="px-5 py-12 text-center">
                      <Search className="w-6 h-6 text-muted mx-auto mb-2 opacity-40" />
                      <p className="text-[13px] text-muted">No assignments match your filters.</p>
                      {hasFilters && (
                        <button onClick={clearFilters} className="mt-3 text-[11px] text-primary underline underline-offset-2">
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}

                {!loading && assignments.map((a, i) => {
                  const isOpen     = expandedName === a.name;
                  const cur        = a.currency || currency;
                  const globalIdx  = (page - 1) * PAGE_SIZE + i + 1;
                  const isActive   = activeAssignmentName === a.name;
                  const isUpcoming = new Date(a.from_date) > today;

                  return (
                    <React.Fragment key={a.name}>
                      <tr
                        onClick={() => toggleRow(a.name)}
                        className={[
                          "cursor-pointer transition-colors duration-100 group",
                          isOpen
                            ? "bg-primary/5"
                            : i % 2 === 0
                              ? "bg-transparent hover:bg-[var(--row-hover)]"
                              : "bg-[var(--row-hover)]/40 hover:bg-[var(--row-hover)]",
                        ].join(" ")}
                      >
                        <td className="px-4 py-3 text-center w-10 border-b border-[var(--border)]/40">
                          <div className={`inline-flex w-6 h-6 rounded-md items-center justify-center transition-colors
                            ${isOpen ? "bg-primary/10 text-primary" : "bg-[var(--row-hover)] text-muted group-hover:text-main"}`}>
                            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        </td>

                        <td className="px-4 py-3 border-b border-[var(--border)]/40">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-extrabold shrink-0
                              ${isActive ? "bg-primary/10 text-primary" : "bg-[var(--border)] text-muted"}`}>
                              {globalIdx}
                            </span>
                            <span className="text-[13px] font-semibold text-main leading-tight">{a.salary_structure}</span>
                            {isActive && (
                              <span className="text-[9px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                                Active
                              </span>
                            )}
                            {isUpcoming && (
                              <span className="text-[9px] font-bold uppercase tracking-wide bg-warning/10 text-warning px-2 py-0.5 rounded-full border border-warning/20">
                                Upcoming
                              </span>
                            )}
                          </div>
                        </td>

                        <td className={`px-4 py-3 border-b border-[var(--border)]/40 ${HIDE_CLS.md}`}>
                          <span className="text-[11px] text-muted flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 shrink-0" /> {a.name}
                          </span>
                        </td>

                        <td className={`px-4 py-3 border-b border-[var(--border)]/40 ${HIDE_CLS.sm}`}>
                          <span className="text-[12px] text-main flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 text-muted shrink-0" /> {fmtDate(a.from_date)}
                          </span>
                        </td>

                        <td className="px-4 py-3 border-b border-[var(--border)]/40 text-right">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">Base</p>
                          <p className="text-[13px] font-bold tabular-nums text-main">{fmtNum(a.base, cur)}</p>
                        </td>
                      </tr>

                      {isOpen && (
                        <ExpandedPanel assignment={a} currency={currency} colSpan={visibleCols} />
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!error && (
          <div className="px-4 py-2.5 border-t border-[var(--border)] bg-card">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              totalItems={totalCount}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};