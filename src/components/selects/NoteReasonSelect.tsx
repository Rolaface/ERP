import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";

export interface NoteReasonOption {
  code: string;
  reason: string;
}

interface NoteReasonSelectProps {
  label: string;
  value: string;
  code?: string;
  options: NoteReasonOption[];
  loading?: boolean;
  required?: boolean;
  onChange: (reason: string, code: string) => void;
  placeholder?: string;
}

export const NoteReasonSelect: React.FC<NoteReasonSelectProps> = ({
  label,
  value,
  code,
  options,
  loading = false,
  required = false,
  onChange,
  placeholder = "Select reason…",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && options.length > 5) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, options.length]);

  const filteredOptions = options.filter(
    (opt) =>
      opt.reason.toLowerCase().includes(search.toLowerCase()) ||
      opt.code.includes(search),
  );

  const selectedOption =
    options.find(
      (opt) =>
        opt.reason.toLowerCase() === (value || "").toLowerCase() ||
        (code && opt.code === code),
    ) || (value ? { reason: value, code: code || "" } : null);

  const handleSelect = (opt: NoteReasonOption) => {
    onChange(opt.reason, opt.code);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", "");
    setSearch("");
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1 w-full relative">
      <label className="text-xs font-medium text-main flex items-center justify-between">
        <span>
          {label} {required && <span className="text-danger">*</span>}
        </span>
        {loading && (
          <span className="text-[10px] text-muted animate-pulse">Loading…</span>
        )}
      </label>

      {/* Trigger button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        className={[
          "h-8 border rounded-md px-2.5 bg-card text-xs flex items-center justify-between cursor-pointer transition-all shadow-2xs select-none",
          isOpen
            ? "border-primary ring-1 ring-primary"
            : "border-theme hover:border-primary/40",
          !selectedOption?.reason ? "text-muted" : "text-main font-medium",
        ].join(" ")}
      >
        <span className="truncate">
          {selectedOption?.reason || placeholder}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 ml-1.5 text-muted">
          {selectedOption?.reason && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 hover:text-danger rounded transition-colors"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isOpen ? "rotate-180 text-primary" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-theme rounded-lg shadow-xl overflow-hidden animate-in fade-in-50 duration-100 min-w-[220px]">
          {options.length > 5 && (
            <div className="p-1.5 border-b border-theme bg-app/50">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-card border border-theme rounded-md">
                <Search className="w-3 h-3 text-muted shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter reasons…"
                  className="w-full bg-transparent text-xs text-main outline-none placeholder:text-muted"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto p-1 divide-y divide-theme/20">
            {filteredOptions.length === 0 ? (
              <div className="py-3 px-2 text-center text-xs text-muted">
                No matching reasons
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected =
                  selectedOption?.reason.toLowerCase() ===
                    opt.reason.toLowerCase() ||
                  (selectedOption?.code && selectedOption.code === opt.code);

                return (
                  <div
                    key={opt.code || opt.reason}
                    onClick={() => handleSelect(opt)}
                    className={[
                      "px-2.5 py-1.5 rounded-md text-xs cursor-pointer flex items-center justify-between transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-main hover:bg-app",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.code && (
                        <span className="text-[10px] font-mono text-muted bg-app px-1.5 py-0.5 rounded border border-theme shrink-0">
                          {opt.code}
                        </span>
                      )}
                      <span className="truncate">{opt.reason}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteReasonSelect;
