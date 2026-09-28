import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type Option = {
  label: string;
  value: string;
  swiftCode?: string;
  subLabel?: string;
  meta?: Record<string, any>;
};

interface MultiSearchSelectProps {
  label?: string;
  values: string[];
  onChange: (values: string[], options: Option[]) => void;
  fetchOptions: (q: string) => Promise<Option[]>;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  maxVisibleChips?: number;
  autoFocus?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DEBOUNCE_DELAY = 400;

const MultiSearchSelect: React.FC<MultiSearchSelectProps> = React.memo(
  ({
    label,
    values,
    onChange,
    fetchOptions,
    placeholder = "Search...",
    disabled,
    error,
    required,
    maxVisibleChips = 2,
    autoFocus = false,
    onOpenChange,
  }) => {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [options, setOptions] = useState<Option[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
    const [open, setOpen] = useState(autoFocus);
    const [isLoading, setIsLoading] = useState(false);
    const [dropdownPos, setDropdownPos] = useState<{
      top?: number;
      bottom?: number;
      left: number;
      width: number;
    }>({ top: 0, left: 0, width: 0 });

    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);
    const fetchOptionsRef = useRef(fetchOptions);
    const onOpenChangeRef = useRef(onOpenChange);
    const hasMountedRef = useRef(false);

    useEffect(() => {
      fetchOptionsRef.current = fetchOptions;
    }, [fetchOptions]);

    useEffect(() => {
      onOpenChangeRef.current = onOpenChange;
    }, [onOpenChange]);

    useEffect(() => {
      setSelectedOptions((prev) => {
        const known = new Map(prev.map((o) => [o.value, o]));
        options.forEach((o) => known.set(o.value, o));
        return values.map((v) => known.get(v) || { label: v, value: v });
      });
    }, [values, options]);

    useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_DELAY);
      return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
      if (!open) return;
      const id = ++requestIdRef.current;
      setIsLoading(true);
      fetchOptionsRef.current(debouncedSearch).then((data) => {
        if (id !== requestIdRef.current) return;
        setOptions(data);
        setIsLoading(false);
      });
    }, [debouncedSearch, open]);

    useEffect(() => {
      if (open && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const width = Math.min(Math.max(rect.width, 220), vw - 16);
        const left = Math.min(Math.max(rect.left, 8), vw - width - 8);

        const estimatedHeight = 240;
        const spaceBelow = vh - rect.bottom - 8;
        const spaceAbove = rect.top - 8;

        if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
          setDropdownPos({ bottom: vh - rect.top + 4, left, width });
        } else {
          setDropdownPos({ top: rect.bottom + 4, left, width });
        }
      }
    }, [open]);

    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          !wrapperRef.current?.contains(target) &&
          !dropdownRef.current?.contains(target)
        ) {
          setOpen(false);
          setSearch("");
        }
      };
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }, []);

    useEffect(() => {
      if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    useEffect(() => {
      if (!hasMountedRef.current) {
        hasMountedRef.current = true;
        return;
      }
      onOpenChangeRef.current?.(open);
    }, [open]);

    const toggleOption = (opt: Option) => {
      const exists = values.includes(opt.value);
      const nextValues = exists
        ? values.filter((v) => v !== opt.value)
        : [...values, opt.value];

      const nextOptions = exists
        ? selectedOptions.filter((o) => o.value !== opt.value)
        : [...selectedOptions, opt];

      onChange(nextValues, nextOptions);
    };

    const removeChip = (value: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const nextValues = values.filter((v) => v !== value);
      const nextOptions = selectedOptions.filter((o) => o.value !== value);
      onChange(nextValues, nextOptions);
    };

    const visibleChips = selectedOptions.slice(0, maxVisibleChips);
    const overflowCount = selectedOptions.length - visibleChips.length;

    return (
      <>
        <div ref={wrapperRef} className="flex flex-col w-full">
          {label && (
            <label className="text-[10px] font-medium mb-1 text-main">
              {label}
              {required && <span className="text-danger"> *</span>}
            </label>
          )}
          <div
            onClick={() => !disabled && setOpen(true)}
            className={[
              "flex flex-wrap items-center gap-1 py-1 px-2 border rounded text-[11px] w-full min-h-[28px] transition-colors duration-150 cursor-text",
              "bg-card text-main",
              disabled
                ? "opacity-50 cursor-not-allowed border-theme"
                : error
                  ? "border-[var(--input-border-error)] bg-[var(--input-bg-error)]"
                  : "border-theme hover:border-[var(--input-border-hover)] focus-within:border-[var(--input-border-focus)] focus-within:shadow-[0_0_0_3px_var(--input-focus-ring)]",
            ].join(" ")}
          >
            {visibleChips.map((opt) => (
              <span
                key={opt.value}
                className="flex items-center gap-1 bg-[var(--chip-bg,theme(colors.gray.100))] text-main rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap"
              >
                {opt.label}
                {!disabled && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => removeChip(opt.value, e)}
                    className="text-muted hover:text-danger leading-none"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
            {overflowCount > 0 && (
              <span className="text-[10px] text-muted">+{overflowCount}</span>
            )}
            <input
              ref={inputRef}
              value={search}
              disabled={disabled}
              placeholder={selectedOptions.length === 0 ? placeholder : ""}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setOpen(true)}
              className="flex-1 min-w-[60px] bg-transparent outline-none placeholder:text-muted"
            />
          </div>
          {error && <span className="text-danger text-[10px] mt-1">{error}</span>}
        </div>

        {open &&
          createPortal(
            <div
              ref={dropdownRef}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                position: "fixed",
                ...(dropdownPos.top !== undefined ? { top: dropdownPos.top } : {}),
                ...(dropdownPos.bottom !== undefined ? { bottom: dropdownPos.bottom } : {}),
                left: dropdownPos.left,
                width: dropdownPos.width,
                zIndex: 99999,
              }}
              className="bg-card border border-theme rounded shadow-lg max-h-60 overflow-auto"
            >
              {isLoading && (
                <div className="px-3 py-2 text-[12px] text-muted">Loading...</div>
              )}
              {!isLoading &&
                options.map((opt) => {
                  const checked = values.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => toggleOption(opt)}
                      className={[
                        "flex items-center gap-2 px-3 py-2 cursor-pointer row-hover transition-colors",
                        checked ? "bg-primary/5" : "",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={checked}
                        className="pointer-events-none"
                      />
                      <div className="flex flex-col">
                        <span className="text-[13px] text-main">{opt.label}</span>
                        {opt.subLabel && (
                          <span className="text-[11px] text-muted leading-tight">
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              {!isLoading && options.length === 0 && (
                <div className="px-3 py-2 text-[12px] text-muted">No records found</div>
              )}
            </div>,
            document.body,
          )}
      </>
    );
  },
);

export default MultiSearchSelect;