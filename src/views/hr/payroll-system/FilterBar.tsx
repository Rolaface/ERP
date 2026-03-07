// FilterBar.tsx
import React from "react";
import { Search, Play, ChevronDown } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  selectedDept: string;
  onDeptChange: (v: string) => void;
  departments: string[];
  filterStatus: string;
  onStatusChange: (v: string) => void;
  pendingCount: number;
  onRunPayroll: () => void;
  totalShown: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedDept,
  onDeptChange,
  departments,
  filterStatus,
  onStatusChange,
  pendingCount,
  onRunPayroll,
  totalShown,
}) => (
  <div className="flex items-center gap-3 flex-wrap">
    {/* Search */}
    <div className="relative min-w-[200px] flex-1 max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
      <input
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search name or ID…"
        className="w-full pl-9 pr-3 py-2 bg-card border border-theme rounded-lg text-xs text-main placeholder:text-muted focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition"
      />
    </div>

    {/* Department */}
    <div className="relative">
      <select
        value={selectedDept}
        onChange={(e) => onDeptChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 bg-card border border-theme rounded-lg text-xs text-main focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] cursor-pointer"
      >
        {departments.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
    </div>

    {/* Status */}
    <div className="relative">
      <select
        value={filterStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 bg-card border border-theme rounded-lg text-xs text-main focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] cursor-pointer"
      >
        {["All", "Paid", "Pending", "Processing", "Draft", "Rejected"].map(
          (s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Status" : s}
            </option>
          ),
        )}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
    </div>

    <span className="text-xs text-muted ml-auto">
      {totalShown} record{totalShown !== 1 ? "s" : ""}
    </span>

    {/* Run Payroll CTA */}
    {pendingCount > 0 && (
      <button
        onClick={onRunPayroll}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-extrabold hover:opacity-90 transition shadow-md shadow-primary/20"
      >
        <Play className="w-3.5 h-3.5" />
        Run Payroll
        <span className="bg-white/25 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
          {pendingCount}
        </span>
      </button>
    )}
  </div>
);
