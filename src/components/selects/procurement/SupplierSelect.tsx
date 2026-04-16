import React, { useEffect, useRef, useState, useCallback } from "react";
import { getSuppliers } from "../../../api/procurement/supplierApi";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Supplier = {
  id: string;
  name: string;
  tpin?: string;
  type?: string;
  currency?: string;
  status?: string;
  taxCategory?: string;
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
  value?: string;
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

const mapSupplier = (s: any): Supplier => ({
  id: s.id,
  name: s.name,
  tpin: s.tpin,
  type: s.type,
  currency: s.currency,
  status: s.status,
  taxCategory: s.supplierTaxCategory,
  supplierGroup: s.supplierGroup,
});

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function SupplierSelect({
  value = "",
  selectedId,
  onChange,
  onClear,
  className = "",
  label = "Supplier",
  placeholder = "Select",
  required = false,
  disabled = false,
  error,
}: SupplierSelectProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Sync display value from parent ───────────────────────────────────────
  useEffect(() => {
    setSearch(value);
  }, [value]);

  // ── Resolve name from selectedId after list loads ─────────────────────────
 useEffect(() => {
  if (value) {
    setSearch(value);
    return;
  }

  if (selectedId && suppliers.length > 0) {
    const found = suppliers.find((s) => s.id === selectedId);
    if (found) setSearch(found.name);
  }
}, [value, selectedId, suppliers]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (!suppliers.find((s) => s.name === search)) {
          setSearch(value);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [search, suppliers, value]);

  // ── Load suppliers once on first open ────────────────────────────────────
  const loadSuppliers = useCallback(async () => {
    if (fetched) return;
    try {
      setLoading(true);
      const res = await getSuppliers(1, 1000);
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
    inputRef.current?.select();
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

  // ── Select ────────────────────────────────────────────────────────────────
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

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className={`w-full min-w-0 flex flex-col ${className}`}>
      {label && (
        <span className="block text-[10px] font-medium text-main mb-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      )}

      <div ref={containerRef} className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          disabled={disabled}
          className={[
            "py-1 px-2 border rounded text-[11px] text-main bg-card w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
            disabled
              ? "opacity-50 cursor-not-allowed border-[var(--border)]"
              : error
                ? "border-red-400/60"
                : "border-[var(--border)] hover:border-primary/40",
          ].join(" ")}
          placeholder={loading ? "Loading..." : placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={handleOpen}
        />

        {error && (
          <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>
        )}

        {open && !loading && (
          <div className="absolute left-0 top-full mt-1 w-full max-w-full bg-card border border-[var(--border)] shadow rounded z-30">
            <ul className="max-h-56 overflow-y-auto text-[13px]">
              {filtered.length === 0 ? (
                <li className="px-2 py-1 text-muted text-[11px]">
                  {search ? `No match for "${search}"` : "No suppliers found"}
                </li>
              ) : (
                filtered.map((s) => (
                  <li
                    key={s.id}
                    className={[
                      "px-2 py-1 cursor-pointer text-[11px]",
                      s.id === selectedId
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-primary/5 text-main",
                    ].join(" ")}
                    onClick={() => handleSelect(s)}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="truncate">{s.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {s.currency && (
                          <span className="text-[10px] text-muted">{s.currency}</span>
                        )}
                        <span className="text-[10px] text-muted font-mono">{s.id}</span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}