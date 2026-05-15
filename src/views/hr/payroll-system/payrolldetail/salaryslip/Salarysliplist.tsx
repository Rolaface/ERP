import React, { useMemo, useState } from "react";
import { Search, X, Clock, Download, Eye, Sparkles, Filter } from "lucide-react";
import type { SalarySlip } from "../../../../../api/payroll/payrollEntryApi";
import {
  SlipListItem,
  STATUS_COLORS,
  fmtINR,
  parseMonthYear,
  formatDisplayDate,
} from "./Salarysliphelpers ";

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`relative overflow-hidden rounded-lg ${className}`}
    style={{ background: "var(--skeleton-base, #e5e7eb)" }}
  >
    <div className="absolute inset-0 skeleton-shimmer" />
  </div>
);

export const ListSkeleton: React.FC = () => (
  <div className="p-3 space-y-1.5">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
        style={{ border: "1px solid var(--border)" }}
      >
        <Skeleton className="w-8 h-8 rounded-md shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-4 w-14 rounded-full" />
        <Skeleton className="w-5 h-5 rounded" />
      </div>
    ))}
  </div>
);

const NoFilterResults: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <div className="flex flex-col items-center justify-center py-10 px-4 gap-3">
    <Filter className="w-7 h-7" style={{ color: "var(--muted)", opacity: 0.3 }} />
    <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
      No results
    </p>
    <button
      onClick={onClear}
      className="text-[11px] underline"
      style={{ color: "var(--primary)" }}
    >
      Clear filters
    </button>
  </div>
);

interface SlipRowProps {
  slip: SlipListItem;
  isSelected: boolean;
  isLatest: boolean;
  cachedDetail: SalarySlip | null;
  onSelect: (name: string) => void;
  onDownload: (name: string, detail?: SalarySlip) => void;
}

const SlipRow: React.FC<SlipRowProps> = ({
  slip,
  isSelected,
  isLatest,
  cachedDetail,
  onSelect,
  onDownload,
}) => {
  const { month, year } = parseMonthYear(slip.posting_date);
  const statusStyle = STATUS_COLORS[slip.status] ?? STATUS_COLORS["Draft"];
  const net = cachedDetail ? Number(cachedDetail.net_pay) || 0 : null;

  return (
    <div
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all group"
      style={{
        border: isSelected ? "1px solid var(--primary)" : "1px solid transparent",
        background: isSelected ? "rgba(192,132,61,0.05)" : "transparent",
      }}
      onClick={() => onSelect(slip.name)}
    >
      <div
        className="flex flex-col items-center justify-center w-9 h-9 rounded-md shrink-0"
        style={{
          background: isSelected ? "rgba(192,132,61,0.12)" : "var(--bg)",
          border: "1px solid var(--border)",
        }}
      >
        <span
          className="text-[8px] font-semibold uppercase leading-none"
          style={{ color: "var(--muted)" }}
        >
          {month}
        </span>
        <span
          className="text-[10px] font-bold leading-none mt-0.5"
          style={{ color: isSelected ? "var(--primary)" : "var(--text)" }}
        >
          {year.slice(2)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[11px] font-medium truncate"
            style={{ color: "var(--text)" }}
          >
            {formatDisplayDate(slip.posting_date)}
          </span>
          {isLatest && (
            <span
              className="inline-flex items-center gap-0.5 text-[8px] font-semibold px-1 py-0.5 rounded-full shrink-0"
              style={{
                color: "var(--primary)",
                background: "rgba(192,132,61,0.1)",
              }}
            >
              <Sparkles className="w-2 h-2" />
              Latest
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {net !== null ? (
            <span className="text-[11px] font-semibold" style={{ color: "var(--success)" }}>
              {fmtINR(net)}
            </span>
          ) : (
            <Skeleton className="h-3 w-16" />
          )}
          <span
            className="text-[8px] font-mono"
            style={{ color: "var(--muted)" }}
          >
            #{slip.name.split("/").pop()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className="inline-flex items-center gap-1 text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{
            color: statusStyle.text,
            background: statusStyle.bg,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: statusStyle.dot }}
          />
          {slip.status}
        </span>

        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
          style={{ color: "var(--muted)" }}
          onClick={(e) => {
            e.stopPropagation();
            onDownload(slip.name, cachedDetail ?? undefined);
          }}
          disabled={!cachedDetail}
          title="Download"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

interface SalarySlipListProps {
  slips: SlipListItem[];
  detailCache: Record<string, SalarySlip>;
  selectedSlipName: string | null;
  latestSlipName: string | null;
  onSelect: (name: string) => void;
  onDownload: (name: string, detail?: SalarySlip) => void;
}

export const SalarySlipList: React.FC<SalarySlipListProps> = ({
  slips,
  detailCache,
  selectedSlipName,
  latestSlipName,
  onSelect,
  onDownload,
}) => {
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const availableYears = useMemo(() => {
    const years = [...new Set(slips.map((s) => new Date(s.posting_date).getFullYear().toString()))];
    return ["All", ...years.sort((a, b) => Number(b) - Number(a))];
  }, [slips]);

  const availableStatuses = useMemo(() => {
    const statuses = [...new Set(slips.map((s) => s.status))];
    return ["All", ...statuses];
  }, [slips]);

  const filtered = useMemo(() => {
    return slips.filter((s) => {
      const matchYear =
        yearFilter === "All" ||
        new Date(s.posting_date).getFullYear().toString() === yearFilter;
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      const matchSearch =
        !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.posting_date.includes(search);
      return matchYear && matchStatus && matchSearch;
    });
  }, [slips, yearFilter, statusFilter, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, SlipListItem[]> = {};
    filtered.forEach((s) => {
      const year = new Date(s.posting_date).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(s);
    });
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  }, [filtered]);

  const clearFilters = () => {
    setSearch("");
    setYearFilter("All");
    setStatusFilter("All");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="px-3 pt-3 pb-2 shrink-0 space-y-2"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            Salary Slips
          </p>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ color: "var(--primary)", background: "rgba(192,132,61,0.1)" }}
          >
            {slips.length}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
          style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
        >
          <Search className="w-3 h-3 shrink-0" style={{ color: "var(--muted)" }} />
          <input
            type="text"
            placeholder="Search by month or date…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-xs bg-transparent outline-none"
            style={{ color: "var(--text)" }}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="w-3 h-3" style={{ color: "var(--muted)" }} />
            </button>
          )}
        </div>

        {(availableYears.length > 2 || availableStatuses.length > 2) && (
          <div className="flex gap-1.5">
            {availableYears.length > 2 && (
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="flex-1 text-[10px] rounded-lg px-2 py-1 outline-none"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)",
                }}
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y === "All" ? "All Years" : y}
                  </option>
                ))}
              </select>
            )}
            {availableStatuses.length > 2 && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 text-[10px] rounded-lg px-2 py-1 outline-none"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)",
                }}
              >
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All Status" : s}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filtered.length === 0 ? (
          <NoFilterResults onClear={clearFilters} />
        ) : (
          grouped.map(([year, yearSlips]) => (
            <div key={year} className="mb-3">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <Clock className="w-3 h-3" style={{ color: "var(--muted)", opacity: 0.4 }} />
                <span
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--muted)" }}
                >
                  {year}
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <span className="text-[9px] font-semibold" style={{ color: "var(--muted)" }}>
                  {yearSlips.length}
                </span>
              </div>

              <div className="space-y-0.5">
                {yearSlips.map((slip) => (
                  <SlipRow
                    key={slip.name}
                    slip={slip}
                    isSelected={selectedSlipName === slip.name}
                    isLatest={slip.name === latestSlipName}
                    cachedDetail={detailCache[slip.name] ?? null}
                    onSelect={onSelect}
                    onDownload={onDownload}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};