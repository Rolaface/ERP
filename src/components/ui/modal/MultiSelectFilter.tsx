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
}

// ─── Main component ───────────────────────────────────────────────────────────

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  options,
  values,
  onChange,
  placeholder = "Filter",
  panelTitle = "Filter",
}) => {
  const [open, setOpen] = useState(false);

  // Portal positioning
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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

  // Recalculate position on open / scroll / resize
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

  // ── Live toggle — applies immediately, no Done button needed ──
  const toggleValue = (value: string) => {
    const next = values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value];
    onChange(next);
  };

  const clearAll = () => {
    onChange([]);
  };

  const hasValue = values.length > 0;

  // ─── Dropdown portal content ────────────────────────────────────────────────

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
          {/* Header */}
          <div className="flex items-center justify-between border-b-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5">
            <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-muted">
              {panelTitle}
            </p>
            {hasValue && (
              <button
                onClick={clearAll}
                className="border-none bg-transparent p-0 text-[11px] font-bold text-primary cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto py-1.5">
            {options.map((opt) => {
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
          </div>

          {/* Footer — just closes the panel, filter is already applied */}
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
      {/* Trigger button */}
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