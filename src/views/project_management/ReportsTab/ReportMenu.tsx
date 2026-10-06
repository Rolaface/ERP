import React, { useEffect, useRef, useState } from "react";
import { FileText, ChevronDown } from "lucide-react";
import type { PROJECT_REPORT_OPTIONS } from "../reportOptions";

interface ReportMenuProps {
  options: typeof PROJECT_REPORT_OPTIONS;
  onSelect: (option: typeof PROJECT_REPORT_OPTIONS[0]) => void;
}

const ReportMenu: React.FC<ReportMenuProps> = ({ options, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border)] text-xs font-semibold text-main hover:bg-black/5"
      >
        <FileText size={14} />
        Reports
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] app-surface rounded-md border border-[var(--border)] shadow-lg py-1">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setOpen(false);
                onSelect(opt);
              }}
              className="w-full text-left px-3 py-2 text-xs text-main hover:bg-black/5"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportMenu;