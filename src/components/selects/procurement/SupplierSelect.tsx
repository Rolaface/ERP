import React, { useEffect, useRef, useState, useCallback } from "react";
import { getSuppliers } from "../../../api/procurement/supplierApi";
import { Search, ChevronDown, Loader2, X, Building2 } from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Supplier = {
  id: string;
  name: string;
  tpin?: string;
  type?: string;
  currency?: string;
  status?: string;
  taxCategory?: string; // mapped from supplierTaxCategory
  supplierGroup?: string;
};

export interface SupplierSelectValue {
  id: string;
  name: string;
  tpin?: string;
  type?: string;
  currency?: string;
  status?: string;
  taxCategory?: string;
  supplierGroup?: string;
}

interface SupplierSelectProps {
  /** Display value (supplier name) — controlled */
  value?: string;
  /** Selected supplier ID — used to pre-highlight in list */
  selectedId?: string;
  onChange: (supplier: SupplierSelectValue) => void;
  onClear?: () => void;
  className?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Map raw API supplier object → internal Supplier type */
const mapSupplier = (s: any): Supplier => ({
  id: s.id, // ✅ API uses "id" not "supplierId"
  name: s.name, // ✅ API uses "name" not "supplierName"
  tpin: s.tpin,
  type: s.type,
  currency: s.currency,
  status: s.status,
  taxCategory: s.supplierTaxCategory, // ✅ API uses "supplierTaxCategory"
  supplierGroup: s.supplierGroup,
});

const statusColor = (status?: string) => {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s === "active")
    return "bg-emerald-500/10 text-emerald-700 border-emerald-400/30";
  if (s === "inactive") return "bg-red-500/10 text-red-700 border-red-400/30";
  return "bg-amber-500/10 text-amber-700 border-amber-400/30";
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function SupplierSelect({
  value = "",
  selectedId,
  onChange,
  onClear,
  className = "",
  label = "Supplier",
  placeholder = "Search supplier...",
  required = false,
  disabled = false,
  error,
}: SupplierSelectProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false); // false until user opens
  const [fetched, setFetched] = useState(false); // true once API called
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [highlighted, setHighlighted] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // ── Sync display value from parent ────────────────────────────────────────
  useEffect(() => {
    setSearch(value);
  }, [value]);

  // ── Resolve display name from selectedId (after list loaded) ─────────────
  useEffect(() => {
    if (!selectedId || suppliers.length === 0) return;
    const found = suppliers.find((s) => s.id === selectedId);
    if (found && !value) setSearch(found.name);
  }, [selectedId, suppliers, value]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        // If user typed but didn't select, restore last valid value
        if (!suppliers.find((s) => s.name === search)) {
          setSearch(value);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [search, suppliers, value]);

  // ── ON-CLICK API CALL ─────────────────────────────────────────────────────
  // Only fires the first time the dropdown is opened.
  // Subsequent opens reuse the cached list (no extra network calls).
  const loadSuppliers = useCallback(async () => {
    if (fetched) return; // already loaded — use cache
    try {
      setLoading(true);
      const res = await getSuppliers(1, 1000);

      // API shape: { data: [...suppliers] }
      const raw: any[] = Array.isArray(res?.data) ? res.data : [];
      setSuppliers(raw.map(mapSupplier));
      setFetched(true);
    } catch (err) {
      console.error("SupplierSelect: failed to load suppliers", err);
    } finally {
      setLoading(false);
    }
  }, [fetched]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setHighlighted(-1);
    inputRef.current?.select();
    // ✅ API hit happens HERE — only on first open
    loadSuppliers();
  }, [disabled, loadSuppliers]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.tpin ?? "").toLowerCase().includes(q)
    );
  });

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && filtered[highlighted]) {
        handleSelect(filtered[highlighted]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setSearch(value);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  // ── Select a supplier ─────────────────────────────────────────────────────
  const handleSelect = (s: Supplier) => {
    setSearch(s.name);
    setOpen(false);
    onChange({
      id: s.id,
      name: s.name,
      tpin: s.tpin,
      type: s.type,
      currency: s.currency,
      status: s.status,
      taxCategory: s.taxCategory,
      supplierGroup: s.supplierGroup,
    });
  };

  // ── Clear ─────────────────────────────────────────────────────────────────
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearch("");
    setOpen(false);
    onClear?.();
  };

  const hasValue = search.trim().length > 0;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Label */}
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-muted">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div ref={containerRef} className="relative w-full">
        {/* Input wrapper */}
        <div
          className={[
            "flex items-center gap-1.5 px-2.5 py-2 rounded-xl border bg-card transition-all cursor-text",
            disabled
              ? "opacity-50 cursor-not-allowed border-theme"
              : open
                ? "border-primary ring-2 ring-primary/15 shadow-sm"
                : error
                  ? "border-red-400/60 hover:border-red-400"
                  : "border-theme hover:border-primary/40",
          ].join(" ")}
          onClick={handleOpen}
        >
          {/* Search icon */}
          <span className="shrink-0 text-muted">
            {loading ? (
              <Loader2 size={12} className="animate-spin text-primary" />
            ) : (
              <Search size={12} />
            )}
          </span>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-xs text-main placeholder:text-muted/50 focus:outline-none min-w-0"
            placeholder={loading ? "Loading suppliers…" : placeholder}
            value={search}
            disabled={disabled}
            onChange={(e) => {
              setSearch(e.target.value);
              setHighlighted(-1);
              if (!open) setOpen(true);
            }}
            onFocus={handleOpen}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />

          {/* Clear button */}
          {hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 text-muted hover:text-red-500 transition-colors"
              tabIndex={-1}
            >
              <X size={11} />
            </button>
          )}

          {/* Chevron */}
          <span
            className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <ChevronDown size={12} />
          </span>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>
        )}

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1.5 w-full bg-card border border-theme rounded-xl shadow-xl overflow-hidden">
            {/* Loading skeleton */}
            {loading && (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-9 rounded-lg bg-row-hover animate-pulse"
                    style={{ animationDelay: `${i * 60}ms` }}
                  />
                ))}
              </div>
            )}

            {/* List */}
            {!loading && (
              <ul
                ref={listRef}
                className="max-h-64 overflow-y-auto py-1"
                role="listbox"
              >
                {filtered.length === 0 ? (
                  <li className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                    <Building2 size={20} className="text-muted opacity-30" />
                    <span className="text-xs text-muted">
                      {search
                        ? `No supplier matching "${search}"`
                        : "No suppliers found"}
                    </span>
                  </li>
                ) : (
                  filtered.map((s, idx) => {
                    const isActive = s.id === selectedId;
                    const isHighlighted = idx === highlighted;
                    return (
                      <li
                        key={s.id}
                        role="option"
                        aria-selected={isActive}
                        className={[
                          "flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors gap-3",
                          isActive
                            ? "bg-primary text-white"
                            : isHighlighted
                              ? "bg-row-hover"
                              : "hover:bg-row-hover",
                        ].join(" ")}
                        onClick={() => handleSelect(s)}
                        onMouseEnter={() => setHighlighted(idx)}
                      >
                        {/* Left: avatar + name + id */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={[
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-primary/10 text-primary",
                            ].join(" ")}
                          >
                            {(s.name?.[0] ?? "S").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-main"}`}
                            >
                              {s.name}
                            </p>
                            <p
                              className={`text-[10px] font-mono truncate ${isActive ? "text-white/60" : "text-muted"}`}
                            >
                              {s.id}
                            </p>
                          </div>
                        </div>

                        {/* Right: status pill + currency */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {s.currency && (
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${isActive ? "bg-white/10 text-white border-white/20" : "bg-row-hover text-muted border-theme"}`}
                            >
                              {s.currency}
                            </span>
                          )}
                          {s.status && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border capitalize ${isActive ? "bg-white/10 text-white border-white/20" : statusColor(s.status)}`}
                            >
                              {s.status}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            )}

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
              <div className="px-3 py-2 border-t border-theme bg-row-hover/40">
                <p className="text-[10px] text-muted">
                  {filtered.length} supplier{filtered.length !== 1 ? "s" : ""}
                  {search && suppliers.length !== filtered.length
                    ? ` of ${suppliers.length}`
                    : ""}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
