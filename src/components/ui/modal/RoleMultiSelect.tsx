import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface RoleMultiSelectProps {
  selected: string[];
  selectedLabels: Record<string, string>;
  fetchRoles: (q: string) => Promise<Option[]>;
  onAdd: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  onDirty: () => void;
  disabled?: boolean;
}

const RoleMultiSelect: React.FC<RoleMultiSelectProps> = ({
  selected,
  selectedLabels,
  fetchRoles,
  onAdd,
  onRemove,
  onDirty,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch options when dropdown opens or search changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetchRoles(search)
      .then((opts) => { if (!cancelled) setOptions(opts); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, search, fetchRoles]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (opt: Option) => {
    if (disabled) return;

    if (selected.includes(opt.value)) {
      onRemove(opt.value);
    } else {
      onAdd(opt.value, opt.label);
    }

    onDirty();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
         className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg,white)] text-sm text-main hover:border-primary/50 transition-colors min-h-[36px]"
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-muted text-xs">Selected roles...</span>
          ) : (
            selected.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20"
              >
                {selectedLabels[id] ?? id}
                <span
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onRemove(id); onDirty(); } }}
                  onClick={(e) => {
                    e.stopPropagation();

                    if (disabled) return;

                    onRemove(id);
                    onDirty();
                  }}
                  className="hover:text-[var(--danger)] transition-colors cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--border)] bg-card shadow-lg">
          {/* Search */}
          <div className="p-2 border-b border-[var(--border)]">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles..."
              className="w-full px-2 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--input-bg,white)] text-main placeholder:text-muted focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-48 overflow-y-auto py-1">
            {loading && (
              <li className="px-3 py-2 text-xs text-muted text-center">Loading...</li>
            )}
            {!loading && options.length === 0 && (
              <li className="px-3 py-2 text-xs text-muted text-center">No roles found</li>
            )}
            {!loading && options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <li
                  key={opt.value}
                  onClick={() => toggle(opt)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-[var(--row-hover)] transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={isSelected}
                    className="accent-primary w-3.5 h-3.5 shrink-0"
                  />
                  <span className="text-main">{opt.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RoleMultiSelect;