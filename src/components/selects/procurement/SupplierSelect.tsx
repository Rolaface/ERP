import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────

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

function getDropStyle(
  rect: DOMRect,
  vw: number,
  vh: number,
): React.CSSProperties {
  const PADDING = 8;
  const DROP_H = 230;
  const width = rect.width;

  let left = rect.left;
  if (left + width > vw - PADDING)
    left = Math.max(PADDING, vw - width - PADDING);

  const spaceBelow = vh - rect.bottom - PADDING;
  const spaceAbove = rect.top - PADDING;
  const flipUp = spaceBelow < DROP_H && spaceAbove > spaceBelow;

  const vertPos = flipUp
    ? { bottom: vh - rect.top + 4, top: "auto" as const }
    : { top: rect.bottom + 4, bottom: "auto" as const };

  return { position: "fixed", ...vertPos, left, width, zIndex: 9999 };
}

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
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Sync display value ────────────────────────────────────────────────────
  useEffect(() => {
    setSearch(value);
  }, [value]);

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

  // ── Outside click ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dropdownRef.current?.contains(t) || containerRef.current?.contains(t))
        return;
      setOpen(false);
      // restore last valid value if search doesn't match
      if (!suppliers.find((s) => s.name === search)) setSearch(value);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, search, suppliers, value]);

  // ── Reposition on scroll/resize ───────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const update = () =>
      setDropRect(containerRef.current?.getBoundingClientRect() ?? null);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // ── Load suppliers once ───────────────────────────────────────────────────
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
    setDropRect(containerRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
    inputRef.current?.select();
    loadSuppliers();
  }, [disabled, loadSuppliers]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.tpin ?? "").toLowerCase().includes(q),
    );
  }, [suppliers, search]);

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

  // ── Dropdown style ────────────────────────────────────────────────────────
  const dropStyle = useMemo((): React.CSSProperties => {
    if (!dropRect) return {};
    return getDropStyle(dropRect, window.innerWidth, window.innerHeight);
  }, [dropRect]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className={`w-full min-w-0 flex flex-col ${className}`}>
      {label && (
        <span className="block text-[10px] font-medium text-main mb-1">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
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
              ? "opacity-50 cursor-not-allowed border-theme"
              : error
                ? "border-red-400/60"
                : "border-theme hover:border-primary/40 focus:outline-none focus:border-primary",
          ].join(" ")}
          placeholder={loading ? "Loading..." : placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) {
              setDropRect(
                containerRef.current?.getBoundingClientRect() ?? null,
              );
              setOpen(true);
              loadSuppliers();
            }
          }}
          onFocus={handleOpen}
        />

        {error && (
          <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>
        )}
      </div>

      {/* ── PORTAL DROPDOWN — always on top, never clipped ── */}
      {open &&
        dropRect &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropStyle}
            className="bg-card border border-theme rounded-lg shadow-xl overflow-hidden"
          >
            <ul className="max-h-56 overflow-y-auto text-[11px]">
              {loading ? (
                <li className="px-3 py-2 text-muted text-[11px]">Loading…</li>
              ) : filtered.length === 0 ? (
                <li className="px-3 py-2 text-muted text-[11px]">
                  {search ? `No match for "${search}"` : "No suppliers found"}
                </li>
              ) : (
                filtered.map((s) => (
                  <li
                    key={s.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(s);
                    }}
                    onClick={() => {}}
                    className={[
                      "px-3 py-1.5 cursor-pointer border-b border-theme last:border-none transition-colors",
                      s.id === selectedId
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-primary/5 text-main",
                    ].join(" ")}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="truncate">{s.name}</span>
                      {s.currency && (
                        <span className="text-[10px] text-muted shrink-0">
                          {s.currency}
                        </span>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
