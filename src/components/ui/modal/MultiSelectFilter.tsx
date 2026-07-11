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
            style={{
              position: "absolute",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 99999,
              background: "var(--card)",
              border: "1.5px solid var(--border)",
              borderRadius: 14,
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: "1.5px solid var(--border)",
                background: "var(--bg)",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  margin: 0,
                }}
              >
                {panelTitle}
              </p>
              {hasValue && (
                <button
                  onClick={clearAll}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--primary)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Options list */}
            <div
              style={{
                maxHeight: 256,
                overflowY: "auto",
                padding: "6px 0",
              }}
            >
              {options.map((opt) => {
                const checked = values.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 14px",
                      fontSize: 13,
                      cursor: "pointer",
                      background: checked ? "var(--row-hover)" : "transparent",
                      color: checked ? "var(--primary)" : "var(--text)",
                      fontWeight: checked ? 600 : 500,
                      transition: "background .12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!checked)
                        e.currentTarget.style.background = "var(--row-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!checked) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleValue(opt.value)}
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: 4,
                        accentColor: "var(--primary)",
                        cursor: "pointer",
                      }}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>

            {/* Footer — just closes the panel, filter is already applied */}
            <div
              style={{
                borderTop: "1.5px solid var(--border)",
                padding: "10px 14px",
              }}
            >
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: "100%",
                  padding: "7px 0",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: "var(--primary)",
                  color: "#fff",
                  transition: "all .15s",
                }}
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={triggerRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          height: 32,
          padding: "0 10px",
          borderRadius: 8,
          border: `1.5px solid ${hasValue ? "var(--primary)" : "var(--border)"}`,
          background: hasValue ? "var(--row-hover)" : "var(--card)",
          color: hasValue ? "var(--primary)" : "var(--muted)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          transition: "all .15s",
        }}
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
        {placeholder}

        {hasValue && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 999,
              background: "var(--primary)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {values.length}
          </span>
        )}

        {hasValue && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
            style={{
              marginLeft: 2,
              opacity: 0.6,
              fontSize: 14,
              lineHeight: 1,
              cursor: "pointer",
            }}
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