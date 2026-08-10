import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { Truck } from "lucide-react";
import { getSuppliers } from "../../../api/procurement/supplierApi";
import SelectShell from "../../../components/ui/select/SelectShell";

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

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

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

// getSuppliers() returns resp.data directly (the whole backend body), which
// looks like: { status, message, data: { data: Supplier[], pagination: {...} } }
// This pulls the actual array out regardless of which shape shows up.
function extractSupplierList(res: any): any[] {
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // guards against a slow, stale request overwriting a newer one
  const requestIdRef = useRef(0);

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

if (!search.trim()) {
  requestIdRef.current += 1;
  setSuppliers([]);
  onClear?.();
  return;
}

if (!suppliers.find((s) => s.name === search)) {
  setSearch(value);
}
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

  // ── Server-side search (backend supports page, page_size, search) ──────────
  const fetchSuppliers = useCallback(async (searchTerm: string) => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      const res = await getSuppliers(1, PAGE_SIZE, { search: searchTerm });
      const raw = extractSupplierList(res);
      // ignore stale responses if a newer search fired in the meantime
      if (requestId !== requestIdRef.current) return;
      setSuppliers(raw.map(mapSupplier));
    } catch (err) {
      console.error("SupplierSelect: failed to load suppliers", err);
      if (requestId === requestIdRef.current) setSuppliers([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Debounced trigger whenever the search text changes while the dropdown is open
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuppliers(search);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, open, fetchSuppliers]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setDropRect(containerRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
    inputRef.current?.select();
    fetchSuppliers(search);
  }, [disabled, fetchSuppliers, search]);

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
        <SelectShell
          icon={!search ? <Truck /> : undefined}
          showChevron
          error={Boolean(error)}
          disabled={disabled}
        >
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            disabled={disabled}
            placeholder={loading ? "Loading..." : placeholder}
            value={search}
            onChange={(e) => {
  const nextValue = e.target.value;

  setSearch(nextValue);

  if (!nextValue.trim()) {
    requestIdRef.current += 1;
    setOpen(false);
    setSuppliers([]);
    onClear?.();
    return;
  }

  if (!open) {
    setDropRect(
      containerRef.current?.getBoundingClientRect() ?? null,
    );
    setOpen(true);
  }
}}
            onFocus={handleOpen}
            className="overflow-hidden text-ellipsis whitespace-nowrap"
          />
        </SelectShell>

        {error && (
          <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>
        )}
      </div>

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
              ) : suppliers.length === 0 ? (
                <li className="px-3 py-2 text-muted text-[11px]">
                  {search ? `No match for "${search}"` : "No suppliers found"}
                </li>
              ) : (
                suppliers.map((s) => (
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