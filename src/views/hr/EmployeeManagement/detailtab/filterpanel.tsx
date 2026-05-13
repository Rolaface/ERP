import React, { useCallback } from "react";
import { Filter, X } from "lucide-react";
import type { SlipFilters, QuickFilter } from "./salarytypes";
import { MONTHS, STATUSES } from "../detailtab/salarysliphelper"

// ─── Quick Filter Pills ───────────────────────────────────────────────────────

interface QuickFilterOption {
  id: QuickFilter;
  label: string;
}

const QUICK_FILTERS: QuickFilterOption[] = [
  { id: "latest", label: "Latest Payslip" },
  { id: "this_year", label: "This Year" },
  { id: "last_6_months", label: "Last 6 Months" },
  { id: "paid", label: "Paid Slips" },
  { id: "pending", label: "Pending Slips" },
];

interface QuickFiltersProps {
  active: QuickFilter;
  onSelect: (qf: QuickFilter) => void;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({ active, onSelect }) => (
  <div className="flex flex-wrap gap-2">
    {QUICK_FILTERS.map(({ id, label }) => (
      <button
        key={id}
        onClick={() => onSelect(id)}
        className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-all ${
          active === id
            ? "bg-primary text-white border-primary shadow-sm"
            : "border-theme bg-card text-muted hover:text-main hover:border-primary/40"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

// ─── Advanced Filter Panel ────────────────────────────────────────────────────

interface FilterPanelProps {
  filters: SlipFilters;
  availableYears: number[];
  onUpdateFilter: <K extends keyof SlipFilters>(key: K, value: SlipFilters[K]) => void;
  onClear: () => void;
  onApply: () => void;
}

export const AdvancedFilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  availableYears,
  onUpdateFilter,
  onClear,
  onApply,
}) => {
  const inputCls =
    "w-full px-2 py-1.5 text-xs rounded-lg border border-theme bg-card text-main placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary transition-shadow";
  const labelCls =
    "text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1";

  return (
    <div className="rounded-xl border border-theme bg-card p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Month */}
        <div>
          <label className={labelCls}>Month</label>
          <select
            value={filters.month}
            onChange={(e) => onUpdateFilter("month", e.target.value)}
            className={inputCls}
          >
            <option value="">All Months</option>
            {MONTHS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label className={labelCls}>Year</label>
          <select
            value={filters.year}
            onChange={(e) => onUpdateFilter("year", e.target.value)}
            className={inputCls}
          >
            <option value="">All Years</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div>
          <label className={labelCls}>From Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onUpdateFilter("startDate", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* To Date */}
        <div>
          <label className={labelCls}>To Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onUpdateFilter("endDate", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Slip ID */}
        <div>
          <label className={labelCls}>Slip ID</label>
          <input
            type="text"
            placeholder="Search by ID…"
            value={filters.slipId}
            onChange={(e) => onUpdateFilter("slipId", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Status */}
        <div>
          <label className={labelCls}>Status</label>
          <select
            value={filters.status}
            onChange={(e) =>
              onUpdateFilter("status", e.target.value as SlipFilters["status"])
            }
            className={inputCls}
          >
            <option value="">All Status</option>
            {STATUSES.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-theme hover:bg-app transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
        <button
          onClick={onApply}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

// ─── Filter Toggle Button ─────────────────────────────────────────────────────

interface FilterToggleProps {
  showFilters: boolean;
  hasActiveFilters: boolean;
  onToggle: () => void;
}

export const FilterToggleButton: React.FC<FilterToggleProps> = ({
  showFilters,
  hasActiveFilters,
  onToggle,
}) => (
  <button
    onClick={onToggle}
    className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
      showFilters
        ? "bg-primary text-white border-primary"
        : "border-theme hover:bg-app"
    }`}
  >
    <Filter className="w-3.5 h-3.5" />
    {showFilters ? "Hide Filters" : "Filters"}
    {hasActiveFilters && !showFilters && (
      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
    )}
  </button>
);