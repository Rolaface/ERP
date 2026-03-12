import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getBalanceSheet } from "../../api/Accounting/AccountApi";
import {
  RefreshCw,
  Download,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  ChevronDown,
  Calendar,
  CalendarDays,
} from "lucide-react";
import { FaFilePdf } from "react-icons/fa";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import type { Column } from "../../components/ui/Table/type";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PeriodMap {
  [key: string]: number;
  total: number;
}

interface AccountNode {
  account: string;
  account_name: string;
  parent_account: string;
  indent: number;
  is_group: number;
  has_value: boolean;
  currency: string;
  opening_balance: number;
  periods: PeriodMap;
  children: AccountNode[];
}

interface SummaryItem {
  label: string;
  value: number;
  datatype: string;
  currency: string;
  indicator?: string;
}

interface BalanceSheetData {
  summary: SummaryItem[];
  assets: AccountNode[];
  liabilities: AccountNode[];
  equity: AccountNode[];
}

interface BalanceSheetMeta {
  year_start_date?: string;
  year_end_date?: string;
}

type Periodicity = "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly";

// ─── Custom Select ────────────────────────────────────────────────────────────

interface SelectOption { label: string; value: string; }

const CustomSelect: React.FC<{
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  prefix?: string;
  disabled?: boolean;
}> = ({ value, options, onChange, prefix, disabled }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex items-center gap-2 px-3 py-2 bg-card border border-[var(--border)] rounded-xl",
          "text-xs font-semibold text-main hover:border-primary/50 hover:bg-row-hover",
          "transition-all duration-150 shadow-sm min-w-[90px] disabled:opacity-40",
          open ? "border-primary/60 ring-1 ring-primary/20" : "",
        ].join(" ")}
      >
        {prefix && <span className="text-[9px] font-black uppercase tracking-widest text-muted">{prefix}</span>}
        <span className="flex-1 text-left">{selected?.label ?? value}</span>
        <ChevronDown size={12} className={`text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1.5 left-0 z-30 bg-card border border-[var(--border)] rounded-xl shadow-xl overflow-hidden py-1 min-w-full">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={[
                  "w-full text-left px-3.5 py-2 text-xs font-medium transition-colors",
                  opt.value === value
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-main hover:bg-row-hover",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(value: number | undefined | null): string {
  if (value === null || value === undefined) return "—";
  const abs = Math.abs(value);
  let formatted: string;
  if (abs >= 1_00_00_000) {
    formatted = (abs / 1_00_00_000).toFixed(2) + " Cr";
  } else if (abs >= 1_00_000) {
    formatted = (abs / 1_00_000).toFixed(2) + " L";
  } else {
    formatted = abs.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  return value < 0 ? `(${formatted})` : formatted;
}

function getActivePeriodKeys(nodes: AccountNode[]): string[] {
  const allKeys = new Set<string>();
  const walk = (n: AccountNode) => {
    Object.entries(n.periods ?? {}).forEach(([k, v]) => {
      if (k !== "total" && v !== 0) allKeys.add(k);
    });
    (n.children ?? []).forEach(walk);
  };
  nodes.forEach(walk);

  const monthOrder = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  return [...allKeys].sort((a, b) => {
    const partsA = a.split("_");
    const partsB = b.split("_");
    const yA = partsA[partsA.length - 1];
    const yB = partsB[partsB.length - 1];
    const mA = partsA[0];
    const mB = partsB[0];
    if (yA !== yB) return parseInt(yA) - parseInt(yB);
    const idxA = monthOrder.indexOf(mA);
    const idxB = monthOrder.indexOf(mB);
    // If not a month key (e.g. yearly uses "dec_2026" as year label), keep order
    if (idxA === -1 && idxB === -1) return 0;
    return idxA - idxB;
  });
}

function periodLabel(key: string, periodicity: Periodicity): string {
  const monthNames: Record<string, string> = {
    jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr",
    may: "May", jun: "Jun", jul: "Jul", aug: "Aug",
    sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",
  };
  const parts = key.split("_");
  const year = parts[parts.length - 1];
  const mon = parts[0];

  if (periodicity === "Yearly") return `FY ${year}`;
  if (periodicity === "Quarterly") {
    const qMap: Record<string, string> = {
      mar: "Q1", jun: "Q2", sep: "Q3", dec: "Q4",
    };
    return `${qMap[mon] ?? mon.toUpperCase()} '${year?.slice(-2)}`;
  }
  if (periodicity === "Half-Yearly") {
    return `H${mon === "sep" ? "1" : "2"} '${year?.slice(-2)}`;
  }
  return `${monthNames[mon] ?? mon.toUpperCase()} '${year?.slice(-2)}`;
}

// ─── Period Value Cell ────────────────────────────────────────────────────────

const PeriodCell: React.FC<{ value: number | undefined; isGroup: boolean }> = ({ value, isGroup }) => {
  const isNeg = (value ?? 0) < 0;
  const isEmpty = !value || value === 0;
  return (
    <span className={[
      "font-mono text-xs tabular-nums",
      isEmpty ? "text-muted opacity-40" : isNeg ? "text-danger" : isGroup ? "text-main font-semibold" : "text-main",
    ].join(" ")}>
      ₹ {isEmpty ? "0.00" : formatINR(value)}
    </span>
  );
};

// ─── Build Columns ────────────────────────────────────────────────────────────

function buildColumns(nodes: AccountNode[], periodicity: Periodicity): Column<AccountNode>[] {
  const periodKeys = getActivePeriodKeys(nodes);

  const periodCols: Column<AccountNode>[] = periodKeys.map((key) => ({
    key,
    header: periodLabel(key, periodicity),
    align: "right" as const,
    render: (node: AccountNode) => (
      <PeriodCell value={node.periods?.[key]} isGroup={node.is_group === 1} />
    ),
  }));

  return [
    {
      key: "account_name",
      header: "Account",
      align: "left" as const,
      render: (node: AccountNode) => (
        <span className={
          node.is_group === 1
            ? "font-semibold text-main text-xs"
            : "text-main text-xs"
        }>
          {node.account_name}
        </span>
      ),
    },
    ...periodCols,
    {
      key: "total",
      header: "Total",
      align: "right" as const,
      render: (node: AccountNode) => {
        const val = node.periods?.total ?? (node as any).total;
        if (!val || val === 0) return <span className="text-muted opacity-30 font-mono text-xs tabular-nums">₹ 0.00</span>;
        const isNeg = val < 0;
        const isGroup = node.is_group === 1;
        return (
          <span className={[
            "font-mono text-xs tabular-nums",
            isNeg ? "text-danger font-semibold" : isGroup ? "text-main font-semibold" : "text-main",
          ].join(" ")}>
            ₹ {formatINR(val)}
          </span>
        );
      },
    },
  ];
}



// ─── Filter Section ──────────────────────────────────────────────────────────

type FilterMode = "fiscal_year" | "date_range";

interface FilterBarProps {
  periodicity: Periodicity;
  fromYear: string;
  toYear: string;
  fromDate: string;
  toDate: string;
  filterMode: FilterMode;
  loading: boolean;
  availableYears: SelectOption[];
  onPeriodicityChange: (v: Periodicity) => void;
  onApplyYearRange: (from: string, to: string) => void;
  onApplyDateRange: (from: string, to: string) => void;
  onFilterModeChange: (mode: FilterMode) => void;
  onRefresh: () => void;
}

const PERIODICITY_OPTIONS: { value: Periodicity; label: string }[] = [
  { value: "Monthly", label: "Monthly" },
  { value: "Quarterly", label: "Quarterly" },
  { value: "Half-Yearly", label: "Half-Yearly" },
  { value: "Yearly", label: "Yearly" },
];

const FILTER_MODE_OPTIONS: { value: FilterMode; label: string; icon: string }[] = [
  { value: "fiscal_year", label: "Fiscal Year", icon: "FY" },
  { value: "date_range", label: "Date Range", icon: "DR" },
];

// ── Fiscal Year Range Picker ──────────────────────────────────────────────────

const FYRangePicker: React.FC<{
  fromYear: string;
  toYear: string;
  availableYears: SelectOption[];
  loading: boolean;
  onApply: (from: string, to: string) => void;
}> = ({ fromYear, toYear, availableYears, loading, onApply }) => {
  const [open, setOpen] = React.useState(false);
  const [draftFrom, setDraftFrom] = React.useState(fromYear);
  const [draftTo, setDraftTo] = React.useState(toYear);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { setDraftFrom(fromYear); setDraftTo(toYear); }, [fromYear, toYear]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isValid = parseInt(draftFrom) <= parseInt(draftTo);
  const label = fromYear === toYear ? `FY ${fromYear}` : `FY ${fromYear} – ${toYear}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex items-center gap-2 px-3.5 py-[7px] bg-card border rounded-xl",
          "text-xs font-semibold text-main transition-all duration-150 shadow-sm",
          "hover:border-primary/40 hover:bg-row-hover disabled:opacity-40",
          open ? "border-primary/60 ring-1 ring-primary/20" : "border-[var(--border)]",
        ].join(" ")}
      >
        <CalendarDays size={13} className="text-muted" />
        <span className="text-xs">{label}</span>
        <ChevronDown size={11} className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 left-0 z-30 bg-card border border-[var(--border)] rounded-2xl shadow-2xl w-[260px] overflow-hidden">

            {/* Header */}
            <div className="px-4 pt-3.5 pb-2.5 border-b border-[var(--border)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Select Fiscal Year Range</p>
            </div>

            <div className="p-3.5 flex flex-col gap-3">
              {/* FROM grid */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3 rounded-full bg-primary inline-block" />
                  From
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {availableYears.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setDraftFrom(opt.value);
                        if (parseInt(opt.value) > parseInt(draftTo)) setDraftTo(opt.value);
                      }}
                      className={[
                        "py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-100 text-center",
                        draftFrom === opt.value
                          ? "bg-primary text-white shadow-sm"
                          : "bg-[var(--border)]/40 text-main hover:bg-primary/10 hover:text-primary",
                      ].join(" ")}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Separator */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-[9px] font-black tracking-widest text-muted uppercase">to</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              {/* TO grid */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3 rounded-full bg-primary/40 inline-block" />
                  To
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {availableYears.map((opt) => {
                    const isDisabled = parseInt(opt.value) < parseInt(draftFrom);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setDraftTo(opt.value)}
                        className={[
                          "py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-100 text-center",
                          draftTo === opt.value
                            ? "bg-primary text-white shadow-sm"
                            : isDisabled
                            ? "opacity-20 cursor-not-allowed text-muted"
                            : "bg-[var(--border)]/40 text-main hover:bg-primary/10 hover:text-primary",
                        ].join(" ")}
                      >
                        {opt.value}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <span className="text-[10px] text-muted font-medium tabular-nums">
                  {draftFrom === draftTo ? `FY ${draftFrom}` : `FY ${draftFrom} → ${draftTo}`}
                </span>
                <button
                  type="button"
                  onClick={() => { if (isValid) { onApply(draftFrom, draftTo); setOpen(false); } }}
                  disabled={!isValid}
                  className="px-3 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Date Range Picker ─────────────────────────────────────────────────────────

const DateRangePicker: React.FC<{
  fromDate: string;
  toDate: string;
  loading: boolean;
  onApply: (from: string, to: string) => void;
}> = ({ fromDate, toDate, loading, onApply }) => {
  const [open, setOpen] = React.useState(false);
  const [draftFrom, setDraftFrom] = React.useState(fromDate);
  const [draftTo, setDraftTo] = React.useState(toDate);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { setDraftFrom(fromDate); setDraftTo(toDate); }, [fromDate, toDate]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isValid = draftFrom && draftTo && draftFrom <= draftTo;

  const formatDisplay = (d: string) => {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const label = fromDate && toDate
    ? `${formatDisplay(fromDate)} – ${formatDisplay(toDate)}`
    : "Select dates";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex items-center gap-2 px-3.5 py-[7px] bg-card border rounded-xl",
          "text-xs font-semibold text-main transition-all duration-150 shadow-sm",
          "hover:border-primary/40 hover:bg-row-hover disabled:opacity-40",
          open ? "border-primary/60 ring-1 ring-primary/20" : "border-[var(--border)]",
        ].join(" ")}
      >
        <Calendar size={13} className="text-muted" />
        <span className="text-xs">{label}</span>
        <ChevronDown size={11} className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 left-0 z-30 bg-card border border-[var(--border)] rounded-2xl shadow-2xl w-[280px] overflow-hidden">

            <div className="px-4 pt-3.5 pb-2.5 border-b border-[var(--border)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Select Date Range</p>
            </div>

            <div className="p-3.5 flex flex-col gap-3">
              {/* From date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                  <span className="w-1 h-3 rounded-full bg-primary inline-block" />
                  From Date
                </label>
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => {
                    setDraftFrom(e.target.value);
                    if (e.target.value > draftTo) setDraftTo(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-[var(--border)]/30 border border-[var(--border)] rounded-xl text-xs font-medium text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* To date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                  <span className="w-1 h-3 rounded-full bg-primary/40 inline-block" />
                  To Date
                </label>
                <input
                  type="date"
                  value={draftTo}
                  min={draftFrom}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--border)]/30 border border-[var(--border)] rounded-xl text-xs font-medium text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <span className="text-[10px] text-muted font-medium">
                  {draftFrom && draftTo ? `${formatDisplay(draftFrom)} → ${formatDisplay(draftTo)}` : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => { if (isValid) { onApply(draftFrom, draftTo); setOpen(false); } }}
                  disabled={!isValid}
                  className="px-3 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Filter Bar ────────────────────────────────────────────────────────────────

const FilterBar: React.FC<FilterBarProps> = ({
  periodicity, fromYear, toYear, fromDate, toDate,
  filterMode, loading, availableYears,
  onPeriodicityChange, onApplyYearRange, onApplyDateRange,
  onFilterModeChange, onRefresh,
}) => (
  <div className="flex flex-wrap items-center gap-2">

    {/* Periodicity */}
    <CustomSelect
      value={periodicity}
      options={PERIODICITY_OPTIONS.map((p) => ({ value: p.value, label: p.label }))}
      onChange={(v) => onPeriodicityChange(v as Periodicity)}
      disabled={loading}
    />

    {/* Thin divider */}
    <div className="w-px h-5 bg-[var(--border)] opacity-50" />

    {/* Filter mode toggle — pill style */}
    <div className="flex items-center bg-[var(--border)]/30 rounded-xl p-0.5 gap-0.5">
      {FILTER_MODE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onFilterModeChange(opt.value)}
          className={[
            "px-3 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all duration-200",
            filterMode === opt.value
              ? "bg-card text-main shadow-sm border border-[var(--border)]"
              : "text-muted hover:text-main",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>

    {/* Conditional date picker — smooth swap */}
    <div className="flex items-center">
      {filterMode === "fiscal_year" ? (
        <FYRangePicker
          fromYear={fromYear}
          toYear={toYear}
          availableYears={availableYears}
          loading={loading}
          onApply={onApplyYearRange}
        />
      ) : (
        <DateRangePicker
          fromDate={fromDate}
          toDate={toDate}
          loading={loading}
          onApply={onApplyDateRange}
        />
      )}
    </div>

    {/* Refresh */}
    <button
      onClick={onRefresh}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-[7px] bg-card border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-muted rounded-xl hover:text-main hover:bg-row-hover hover:border-primary/30 transition-all shadow-sm disabled:opacity-40"
    >
      <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
      Refresh
    </button>
  </div>
);


// ─── Export Menu ──────────────────────────────────────────────────────────────

const ExportMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const items = [
    { icon: <FaFilePdf size={11} />, label: "Export as PDF", action: () => window.print?.() },
    { icon: <FileSpreadsheet size={11} />, label: "Export as Excel", action: () => {} },
    { icon: <Printer size={11} />, label: "Print", action: () => window.print?.() },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-sm"
      >
        <Download size={12} />
        Export
        <ChevronDown size={10} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-card border border-[var(--border)] rounded-2xl shadow-xl z-20 overflow-hidden py-1">
            {items.map(({ icon, label, action }) => (
              <button
                key={label}
                onClick={() => { setOpen(false); action(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-main hover:bg-row-hover transition-colors"
              >
                <span className="text-muted">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


// ─── Main Component ───────────────────────────────────────────────────────────

const BalanceSheetPage: React.FC = () => {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [periodicity, setPeriodicity] = useState<Periodicity>("Monthly");
  const [fromYear, setFromYear] = useState("2026");
  const [toYear, setToYear] = useState("2026");
  const [filterMode, setFilterMode] = useState<FilterMode>("fiscal_year");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Derive available years from API response year_start_date / year_end_date
  const availableYears = useMemo<SelectOption[]>(() => {
    const years = new Set<string>();
    const addFromNode = (nodes: AccountNode[]) => {
      nodes.forEach((n) => {
        if ((n as any).year_start_date) years.add(new Date((n as any).year_start_date).getFullYear().toString());
        if ((n as any).year_end_date) years.add(new Date((n as any).year_end_date).getFullYear().toString());
        if (n.children?.length) addFromNode(n.children);
      });
    };
    if (data) {
      addFromNode(data.assets ?? []);
      addFromNode(data.liabilities ?? []);
    }
    // Always include a sensible default range so the picker is never sparse
    ["2022","2023","2024","2025","2026","2027","2028"].forEach((y) => years.add(y));
    years.add(fromYear);
    years.add(toYear);
    return [...years]
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((y) => ({ value: y, label: `FY ${y}` }));
  }, [data, fromYear, toYear]);

  const [assetSearch, setAssetSearch] = useState("");
  const [liabilitySearch, setLiabilitySearch] = useState("");

  const fetchData = useCallback(async (from = fromYear, to = toYear, period = periodicity) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const resp = await getBalanceSheet({
        periodicity: period,
        from_fiscal_year: from,
        to_fiscal_year: to,
      });
      setData(resp?.message?.data ?? null);
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fromYear, toYear, periodicity]);

  // Only auto-fetch on mount and periodicity change (year range requires explicit Apply)
  useEffect(() => { fetchData(); }, [periodicity]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyYearRange = useCallback((from: string, to: string) => {
    setFromYear(from);
    setToYear(to);
    fetchData(from, to, periodicity);
  }, [fetchData, periodicity]);

  const handleApplyDateRange = useCallback((from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
    // Pass dates as fiscal years (year extracted) — or adapt API call as needed
    const fromY = new Date(from).getFullYear().toString();
    const toY = new Date(to).getFullYear().toString();
    setFromYear(fromY);
    setToYear(toY);
    fetchData(fromY, toY, periodicity);
  }, [fetchData, periodicity]);

  const handlePeriodicityChange = useCallback((p: Periodicity) => {
    setPeriodicity(p);
    // fetchData will be called by the periodicity useEffect
  }, []);

  // Columns are rebuilt whenever data OR periodicity changes — perfectly in sync
  const assetColumns = useMemo(
    () => buildColumns(data?.assets ?? [], periodicity),
    [data, periodicity]
  );
  const liabilityColumns = useMemo(
    () => buildColumns(data?.liabilities ?? [], periodicity),
    [data, periodicity]
  );

  const summary = data?.summary ?? [];
  const totalAssets = summary.find((s) => s.label === "Total Asset")?.value ?? 0;
  const totalLiabilities = summary.find((s) => s.label === "Total Liability")?.value ?? 0;
  const totalEquity = summary.find((s) => s.label === "Total Equity")?.value ?? 0;
  const pnl = summary.find((s) => s.label?.includes("Profit"))?.value ?? 0;
  const liabilityPlusEquity = totalLiabilities + totalEquity + pnl;
  const diff = Math.abs(totalAssets - liabilityPlusEquity);
  const isBalanced = diff < 1;


  return (
    <div className="flex flex-col min-h-screen bg-app">

      {/* ── Title Bar ── */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] bg-card">
        <h1 className="text-base font-bold text-main tracking-tight">Balance Sheet</h1>
        <div className="flex items-center gap-2">
          <button className="text-[10px] font-semibold text-muted hover:text-main px-3 py-1.5 rounded-lg hover:bg-row-hover transition-colors">
            Financial Statements
          </button>
          <ExportMenu />
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-row-hover text-muted hover:text-main transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="px-6 py-2.5 border-b border-[var(--border)] bg-card">
        <FilterBar
          periodicity={periodicity}
          fromYear={fromYear}
          toYear={toYear}
          fromDate={fromDate}
          toDate={toDate}
          filterMode={filterMode}
          loading={loading}
          availableYears={availableYears}
          onPeriodicityChange={handlePeriodicityChange}
          onApplyYearRange={handleApplyYearRange}
          onApplyDateRange={handleApplyDateRange}
          onFilterModeChange={setFilterMode}
          onRefresh={() => fetchData()}
        />
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mx-6 mt-3 flex items-center gap-3 px-4 py-3 bg-danger/8 border border-danger/25 rounded-xl text-danger text-xs font-semibold">
          <AlertTriangle size={14} />
          Failed to load: {error}
        </div>
      )}

      {/* ── Summary Row (like ERPNext) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-[var(--border)]">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`px-6 py-4 ${i < 3 ? "border-r border-[var(--border)]" : ""}`}>
                <div className="h-3 w-24 bg-[var(--border)] rounded animate-pulse mb-2" />
                <div className="h-5 w-32 bg-[var(--border)] rounded animate-pulse" />
              </div>
            ))
          : [
              { label: "Total Asset", value: totalAssets, color: "text-main" },
              { label: "Total Liability", value: totalLiabilities, color: "text-danger" },
              { label: "Total Equity", value: totalEquity, color: "text-main" },
              { label: "Provisional Profit / Loss (Credit)", value: pnl, color: "text-success" },
            ].map((item, i) => (
              <div key={item.label} className={`px-6 py-4 ${i < 3 ? "border-r border-[var(--border)]" : ""}`}>
                <p className="text-[11px] text-muted font-medium mb-1">{item.label}</p>
                <p className={`text-sm font-bold font-mono ${item.color}`}>₹ {formatINR(item.value)}</p>
              </div>
            ))
        }
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-auto px-6 py-4 flex flex-col gap-6">

        {/* Assets Table */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-4 rounded-full bg-[var(--primary)] inline-block" />
            <span className="text-xs font-bold text-main uppercase tracking-widest">Application of Funds (Assets)</span>
            <span className="ml-auto text-xs font-mono font-bold text-[var(--primary)]">₹ {formatINR(totalAssets)}</span>
          </div>
          <ExpandableTreeTable<AccountNode>
            columns={assetColumns}
            data={data?.assets ?? []}
            childrenKey="children"
            nodeKey={(n) => n.account}
            showToolbar
            showSearch
            searchValue={assetSearch}
            onSearch={setAssetSearch}
            toolbarPlaceholder="Search assets…"
            showExpandControls
            defaultExpandDepth={2}
            indentSize={20}
            loading={loading}
            emptyMessage="No asset accounts found."
            rowClassName={(node) => node.is_group === 1 ? "font-semibold" : ""}
          />
        </div>

        {/* Liabilities Table */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-4 rounded-full bg-danger inline-block" />
            <span className="text-xs font-bold text-main uppercase tracking-widest">Source of Funds (Liabilities)</span>
            <span className="ml-auto text-xs font-mono font-bold text-danger">₹ {formatINR(totalLiabilities)}</span>
          </div>
          <ExpandableTreeTable<AccountNode>
            columns={liabilityColumns}
            data={data?.liabilities ?? []}
            childrenKey="children"
            nodeKey={(n) => n.account}
            showToolbar
            showSearch
            searchValue={liabilitySearch}
            onSearch={setLiabilitySearch}
            toolbarPlaceholder="Search liabilities…"
            showExpandControls
            defaultExpandDepth={2}
            indentSize={20}
            loading={loading}
            emptyMessage="No liability accounts found."
            rowClassName={(node) => node.is_group === 1 ? "font-semibold" : ""}
          />
        </div>

      </div>
    </div>
  );
};

export default BalanceSheetPage;