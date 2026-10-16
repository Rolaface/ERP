import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import type { ActivityTypeOption } from "../../../types/Project_Management/project_modal/Projectformmodal";
import {
  POPOVER_Z_INDEX,
  formatRate,
} from "../../../utils/project_management/project/Projectformmodal.utils";
import { usePopoverPosition } from "../../../hooks/project_management/project/modal/form/usePopoverPosition";

const MAX_VISIBLE_CHIPS = 2;

interface ActivityMultiSelectProps {
  value: string[];
  options: ActivityTypeOption[];
  hasError?: boolean;
  onChange: (value: string[]) => void;
}

const ActivityMultiSelect: React.FC<ActivityMultiSelectProps> = ({
  value,
  options,
  hasError = false,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const popoverStyle = usePopoverPosition(open, triggerRef, popoverRef);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      close();
    };
    const handleScroll = (e: Event) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      close();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, close]);

  const toggleOption = (name: string) =>
    onChange(
      value.includes(name) ? value.filter((v) => v !== name) : [...value, name],
    );

  const hiddenCount = value.length - MAX_VISIBLE_CHIPS;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        title={value.join(", ")}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-8 w-full items-center justify-between gap-2 rounded-lg border bg-card px-2 text-left text-[11px] transition-colors ${
          hasError
            ? "border-danger"
            : open
              ? "border-primary"
              : "border-[var(--border)] hover:border-primary/40"
        }`}
      >
        <span className="flex min-w-0 items-center gap-1">
          {value.length === 0 ? (
            <span className="text-muted">Select activity types</span>
          ) : (
            <>
              {value.slice(0, MAX_VISIBLE_CHIPS).map((name) => (
                <span
                  key={name}
                  className="max-w-[88px] truncate rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
                >
                  {name}
                </span>
              ))}
              {hiddenCount > 0 && (
                <span className="shrink-0 rounded-md bg-app px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                  +{hiddenCount}
                </span>
              )}
            </>
          )}
        </span>
        <ChevronDown size={14} className="shrink-0 text-muted" />
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="overflow-hidden rounded-xl border border-[var(--border)] bg-card shadow-xl"
            style={{ position: "fixed", zIndex: POPOVER_Z_INDEX, ...popoverStyle }}
          >
            <div className="flex h-10 items-center justify-between border-b border-theme bg-app px-3">
              <span className="text-xs font-bold text-main">Activity types</span>
              <span className="text-[11px] font-semibold text-muted">
                {value.length} selected
              </span>
            </div>
            <div className="max-h-60 overflow-y-auto p-1.5">
              {options.map((option) => (
                <label
                  key={option.name}
                  className="flex h-10 cursor-pointer items-center gap-3 rounded-lg px-3 hover:bg-app"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-primary"
                    checked={value.includes(option.name)}
                    onChange={() => toggleOption(option.name)}
                  />
                  <span className="flex-1 text-xs font-semibold text-main">
                    {option.name}
                  </span>
                  <span className="text-[11px] text-muted">
                    {formatRate(option.billingRate)}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex h-11 items-center justify-between border-t border-theme px-3">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-semibold text-muted hover:text-danger"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default ActivityMultiSelect;