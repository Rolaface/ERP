import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export const TaskSearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "Search tasks by subject, ID..." }) => (
  <div className="relative min-w-[200px] flex-1 basis-full sm:basis-64">
    <Search
      size={15}
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
    />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-8 w-full rounded-lg border border-[var(--border)] bg-card pl-9 pr-3 text-xs text-main placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  </div>
);

export const MultiSelectFilter: React.FC<{
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  values: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}> = ({
  label,
  icon,
  options,
  values,
  onChange,
  searchable,
  searchPlaceholder = "Search...",
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const shown = q.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()))
    : options;

  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-8 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs transition-colors hover:bg-row-hover ${
          values.length
            ? "border-primary bg-primary/10 text-primary"
            : "border-[var(--border)] text-main"
        }`}
      >
        {icon}
        {label}
        {values.length > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-4 text-white">
            {values.length}
          </span>
        )}
        <ChevronDown size={14} className="text-muted" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-60 rounded-xl border border-[var(--border)] bg-card py-1 shadow-xl">
          {searchable && (
            <div className="px-2 pb-1 pt-1">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 w-full rounded-md border border-[var(--border)] px-2 text-xs focus:border-primary focus:outline-none"
              />
            </div>
          )}
          <div role="listbox" aria-multiselectable className="max-h-64 overflow-auto">
            {shown.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted">No options</p>
            )}
            {shown.map((o) => {
              const on = values.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(o.value)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-main hover:bg-row-hover"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      on
                        ? "border-primary bg-primary text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {on && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 break-words">{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const ClearFiltersButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
}> = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="h-8 rounded-lg border border-[var(--border)] bg-card px-3 text-xs text-main transition-colors hover:bg-row-hover disabled:cursor-not-allowed disabled:opacity-50"
  >
    Clear
  </button>
);