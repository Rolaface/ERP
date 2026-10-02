import { ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface MultiSelectOption {
  label: string;
  value: string;
}
interface MultiSelectFilterProps {
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  panelTitle?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (q: string) => Promise<MultiSelectOption[]>;
}

const SEARCH_DEBOUNCE_MS = 300;

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  options,
  values,
  onChange,
  placeholder = "Filter",
  panelTitle = "Filter",
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteOptions, setRemoteOptions] = useState<MultiSelectOption[]>([]);
  const [searching, setSearching] = useState(false);

  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const onSearchRef = useRef(onSearch);
  const labelCacheRef = useRef<Map<string, string>>(new Map());

  const remote = !!onSearch;
  const showSearch = searchable || remote;

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    options.forEach((o) => labelCacheRef.current.set(o.value, o.label));
  }, [options]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const dropdown = document.getElementById("multi-select-portal");
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdown &&
        !dropdown.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open || !onSearchRef.current) return;

    const id = ++requestIdRef.current;
    const run = () => {
      const search = onSearchRef.current;
      if (!search) return;
      setSearching(true);
      search(query.trim())
        .then((list) => {
          if (id !== requestIdRef.current) return;
          list.forEach((o) => labelCacheRef.current.set(o.value, o.label));
          setRemoteOptions(list);
        })
        .catch(() => {
          if (id === requestIdRef.current) setRemoteOptions([]);
        })
        .finally(() => {
          if (id === requestIdRef.current) setSearching(false);
        });
    };

    const timer = setTimeout(run, query ? SEARCH_DEBOUNCE_MS : 0);
    return () => clearTimeout(timer);
  }, [open, query]);

  useEffect(() => {
    if (!open) return;

    const update = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const mobile = window.innerWidth < 540;
      setIsMobile(mobile);

      const dropW = mobile ? Math.min(window.innerWidth - 16, 280) : 240;
      let left = rect.left + window.scrollX;

      if (left + dropW > window.innerWidth + window.scrollX - 8) {
        left = window.innerWidth + window.scrollX - dropW - 8;
      }
      left = Math.max(left, 8);

      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        left,
        width: dropW,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const toggleValue = (value: string) => {
    const next = values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value];
    onChange(next);
  };

  const toggleSelectAll = () => {
    const allSelected =
      options.length > 0 && values.length === options.length;

    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((option) => option.value));
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const hasValue = values.length > 0;

  const q = query.trim().toLowerCase();
  let visibleOptions: MultiSelectOption[];
  if (remote) {
    const pinned: MultiSelectOption[] = q
      ? []
      : values
        .filter((v) => !remoteOptions.some((o) => o.value === v))
        .map((v) => ({ value: v, label: labelCacheRef.current.get(v) ?? v }));
    visibleOptions = [...pinned, ...remoteOptions];
  } else if (searchable && q) {
    visibleOptions = options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q),
    );
  } else {
    visibleOptions = options;
  }

  const dropdown =
    open && dropdownPos
      ? createPortal(
        <div
          id="multi-select-portal"
          className="absolute z-[99999] flex flex-col overflow-hidden rounded-2xl border-[1.5px] border-[var(--border)] bg-card shadow-lg"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
          }}
        >
          <div className="border-b-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5">
            <div className="flex items-center justify-between">
              <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-muted">
                {panelTitle}
              </p>
            </div>

            <div className="mt-2 flex items-center justify-between gap-4">
              <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] font-semibold text-main">
                <input
                  type="checkbox"
                  checked={options.length > 0 && values.length === options.length}
                  onChange={toggleSelectAll}
                  className="h-[14px] w-[14px] cursor-pointer"
                  style={{ accentColor: "var(--primary)" }}
                />
                Select All
              </label>

              <button
                type="button"
                onClick={clearAll}
                disabled={!hasValue}
                className="text-[11px] font-semibold text-primary transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear All
              </button>
            </div>
          </div>

          {showSearch && (
            <div className="border-b-[1.5px] border-[var(--border)] px-3 py-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-[var(--border)] bg-card px-2.5 py-1.5 text-xs text-main outline-none placeholder:text-muted focus:border-primary"
              />
            </div>
          )}

          <div className="max-h-64 overflow-y-auto py-1.5">
            {visibleOptions.map((opt) => {
              const checked = values.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={[
                    "flex items-center gap-2.5 px-3.5 py-2 text-[13px] cursor-pointer transition-colors duration-150",
                    checked
                      ? "bg-row-hover text-primary font-semibold"
                      : "text-main font-medium hover:bg-row-hover",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleValue(opt.value)}
                    className="h-[15px] w-[15px] cursor-pointer rounded"
                    style={{ accentColor: "var(--primary)" }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
            {visibleOptions.length === 0 && (
              <p className="m-0 px-3.5 py-3 text-xs text-muted">
                {searching ? "Searching..." : "No results found"}
              </p>
            )}
          </div>

          <div className="border-t-[1.5px] border-[var(--border)] px-3.5 py-2.5">
            <button
              onClick={() => setOpen(false)}
              className="w-full rounded-lg bg-primary py-[7px] text-center text-xs font-bold text-white transition-opacity hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>,
        document.body,
      )
      : null;

  return (
    <div ref={triggerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border-[1.5px] px-2.5 text-xs font-semibold transition-all duration-150",
          hasValue
            ? "border-primary bg-row-hover text-primary"
            : "border-[var(--border)] bg-card text-muted",
        ].join(" ")}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span className="font-semibold cursor-pointer">{placeholder}</span>
        {hasValue && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {values.length}
          </span>
        )}

        <ChevronDown
          size={14}
          className={hasValue ? "text-primary" : "text-muted"}
        />

        {hasValue && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
            className="ml-0.5 cursor-pointer text-sm leading-none opacity-60"
          >
            ×
          </span>
        )}
      </button>

      {dropdown}
    </div>
  );
};

export default MultiSelectFilter;