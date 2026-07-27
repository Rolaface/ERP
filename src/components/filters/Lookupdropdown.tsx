import React from "react";
import { FaCheck } from "react-icons/fa";
import type { LookupOption } from "../../api/utils/Usedebouncedlookup";

export const popoverInputClass =
  "h-7 px-2.5 text-[11px] border border-[var(--border)] rounded-md bg-app text-main " +
  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary " +
  "placeholder:text-muted disabled:opacity-70 disabled:cursor-not-allowed w-full";

// ── Dropdown trigger button, same visual language as Receivables/Payables filter bars ──
export const FilterDropdownButton: React.FC<{
  label: string;
  active: boolean;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
  width?: string;
}> = ({
  label,
  active,
  isOpen,
  onToggle,
  disabled,
  title,
  children,
  width = "w-56",
}) => (
  <div className="relative">
    <button
      onClick={onToggle}
      disabled={disabled}
      title={title}
      className={`h-7 px-2.5 text-[11px] font-semibold border rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-[var(--border)] bg-card text-muted hover:text-main hover:border-primary/40"
      }`}
    >
      {label}
    </button>
    {isOpen && (
      <div
        className={`absolute top-full left-0 mt-1.5 bg-card border border-[var(--border)] rounded-lg z-30 ${width} shadow-xl p-2.5`}
      >
        {children}
      </div>
    )}
  </div>
);

// ── List-style option row for API-backed dropdowns (Warehouse, Item, Batch) ──
export const DropdownItem: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex justify-between items-center transition-colors ${
      active
        ? "bg-primary/10 text-primary font-semibold"
        : "text-main hover:bg-row-hover"
    }`}
  >
    <span className="truncate pr-2">{children}</span>
    {active && <FaCheck className="text-[9px] shrink-0" />}
  </button>
);

interface LookupDropdownProps {
  /** Fallback label shown on the trigger button when nothing is selected */
  label: string;
  selectedLabel: string;
  selectedValue: string;
  options: LookupOption[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  /** Pass null to represent "All" / clear */
  onSelect: (opt: LookupOption | null) => void;
  placeholder?: string;
  allLabel?: string;
  emptyLabel?: string;
  disabled?: boolean;
  disabledHint?: string;
  width?: string;
}

// ── Shared Warehouse/Item/Batch-style searchable dropdown ──
export const LookupDropdown: React.FC<LookupDropdownProps> = ({
  label,
  selectedLabel,
  selectedValue,
  options,
  isLoading,
  search,
  onSearchChange,
  isOpen,
  onToggle,
  onSelect,
  placeholder = "Search…",
  allLabel = "All",
  emptyLabel = "No results found",
  disabled,
  disabledHint,
  width = "w-64",
}) => (
  <FilterDropdownButton
    label={selectedLabel || label}
    active={!!selectedValue}
    isOpen={isOpen}
    onToggle={onToggle}
    disabled={disabled}
    title={disabled ? disabledHint : undefined}
    width={width}
  >
    <input
      autoFocus
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder={placeholder}
      className={`${popoverInputClass} mb-1.5`}
    />
    <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
      <DropdownItem active={!selectedValue} onClick={() => onSelect(null)}>
        {allLabel}
      </DropdownItem>
      {isLoading ? (
        <div className="px-2.5 py-2 text-xs text-muted text-center">
          Searching…
        </div>
      ) : options.length === 0 ? (
        <div className="px-2.5 py-2 text-xs text-muted text-center">
          {emptyLabel}
        </div>
      ) : (
        options.map((opt) => (
          <DropdownItem
            key={opt.value}
            active={selectedValue === opt.value}
            onClick={() => onSelect(opt)}
          >
            {opt.label}
          </DropdownItem>
        ))
      )}
    </div>
  </FilterDropdownButton>
);