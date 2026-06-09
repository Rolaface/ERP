import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { getAllItems } from "../../../api/itemApi";
import { showApiError } from "../../../utils/alert";
import { Package, ChevronDown, Search, X, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Item = {
  id: string;
  itemName: string;
  unitOfMeasureCd?: string;
  sellingPrice?: number;
  taxPerct?: number;
  vatRate?: number;
  vatCd?: string;
  taxCode?: string;
};

interface POItemSelectProps {
  value?: string;
  selectedId?: string;
  taxCategory?: string;
  className?: string;
  onChange: (item: Item) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DROPDOWN_OFFSET = 4;
const DROP_H = 260;
const DEBOUNCE_MS = 350;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDropStyle(
  dropRect: DOMRect,
  vw: number,
  vh: number,
): React.CSSProperties {
  const PADDING = 8;
  const minW = dropRect.width;
  const maxW = vw <= 480 ? vw - PADDING * 2 : Math.min(420, vw - PADDING * 2);
  const width = Math.max(minW, maxW);

  let left = dropRect.left;
  if (left + width > vw - PADDING) left = Math.max(PADDING, vw - width - PADDING);

  const spaceBelow = vh - dropRect.bottom - PADDING;
  const spaceAbove = dropRect.top - PADDING;
  const flipUp = spaceBelow < DROP_H && spaceAbove > spaceBelow;

  const vertPos = flipUp
    ? { bottom: vh - dropRect.top + DROPDOWN_OFFSET, top: "auto" as const }
    : { top: dropRect.bottom + DROPDOWN_OFFSET, bottom: "auto" as const };

  return { position: "fixed", ...vertPos, left, width, zIndex: 9999 };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function POItemSelect({
  value = "",
  selectedId,
  taxCategory,
  onChange,
  className = "",
}: POItemSelectProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);
  const [displayName, setDisplayName] = useState(value);

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const loadedRef = useRef(false);

  // ── API fetch ────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async (q: string) => {
    const id = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await getAllItems(1, 50, taxCategory ?? undefined, q || undefined);
      if (id !== requestIdRef.current) return;
      const rawList = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setItems(rawList);
    } catch (err) {
      if (id !== requestIdRef.current) return;
      setItems([]);
      showApiError(err);
    } finally {
      if (id === requestIdRef.current) setLoading(false);
    }
  }, [taxCategory]);

  // ── Debounced search ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchItems(search);
    }, search ? DEBOUNCE_MS : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, open, fetchItems]);

  // ── Sync display name ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedId || items.length === 0) return;
    const match = items.find((x) => x.id === selectedId);
    if (match) setDisplayName(match.itemName);
  }, [selectedId, items]);

  // ── Reset ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!value) {
      setDisplayName("");
    } else {
      setDisplayName(value);
    }
    setOpen(false);
    loadedRef.current = false;
  }, [taxCategory, value]);

  // ── Outside click ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dropdownRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Reposition on scroll/resize ──────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const update = () => setDropRect(triggerRef.current?.getBoundingClientRect() ?? null);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // ── Open ─────────────────────────────────────────────────────────────────────

  const handleOpen = useCallback(() => {
    setDropRect(triggerRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
    if (!loadedRef.current) {
      loadedRef.current = true;
      fetchItems("");
    }
  }, [fetchItems]);

  // ── Dropdown style ───────────────────────────────────────────────────────────

  const dropStyle = useMemo((): React.CSSProperties => {
    if (!dropRect) return {};
    return getDropStyle(dropRect, window.innerWidth, window.innerHeight);
  }, [dropRect]);

  // ── Select ───────────────────────────────────────────────────────────────────

  const handleSelect = useCallback((item: Item) => {
    setDisplayName(item.itemName);
    setOpen(false);
    setSearch("");
    onChange(item);
  }, [onChange]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={`w-full ${className}`}>

      {/* ── TRIGGER — matches PO style: flat, wraps naturally ── */}
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleOpen(); }}
        className="flex items-center gap-1.5 px-2 py-1 border border-theme rounded
          bg-card text-main text-[11px] cursor-pointer select-none w-full
          hover:border-primary focus:outline-none focus:border-primary
          transition-colors duration-150"
      >
        <Package className="w-3 h-3 text-muted shrink-0" />
        <span
          className={`flex-1 min-w-0 break-words leading-snug ${displayName ? "text-main" : "text-muted"}`}
        >
          {loading ? "Loading…" : displayName || "Select item…"}
        </span>
        {loading
          ? <Loader2 className="w-3 h-3 text-muted shrink-0 animate-spin" />
          : <ChevronDown className={`w-3 h-3 text-muted shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        }
      </div>

      {/* ── DROPDOWN PORTAL ── */}
      {open && dropRect && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          style={dropStyle}
          className="bg-card border border-theme rounded-lg shadow-xl flex flex-col overflow-hidden"
        >

          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-theme bg-app">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setOpen(false); setSearch(""); }
              }}
              placeholder="Search by name or code…"
              className="flex-1 min-w-0 bg-transparent text-main text-[11px] outline-none placeholder:text-muted"
            />
            {loading && <Loader2 className="w-3.5 h-3.5 text-muted shrink-0 animate-spin" />}
            {search && !loading && (
              <button type="button" onClick={() => setSearch("")} className="shrink-0">
                <X className="w-3.5 h-3.5 text-muted hover:text-danger transition-colors" />
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-y-auto" style={{ maxHeight: "min(200px, 45vh)" }}>
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-muted text-[11px]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading items…
              </div>
            ) : items.length === 0 ? (
              <div className="py-6 text-center text-muted text-[11px]">No items found</div>
            ) : (
              <table className="w-full table-fixed border-collapse text-[11px]">
                <colgroup>
                  <col style={{ width: "65%" }} />
                  <col style={{ width: "35%" }} />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-app">
                  <tr className="border-b border-theme">
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted tracking-wide uppercase">
                      Item Name
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted tracking-wide uppercase">
                      Code
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      role="option"
                      aria-selected={item.id === selectedId}
                      onClick={() => handleSelect(item)}
                      className={[
                        "border-b border-theme last:border-none cursor-pointer transition-colors duration-100",
                        item.id === selectedId
                          ? "bg-primary/10"
                          : "hover:bg-primary/5 active:bg-primary/10",
                      ].join(" ")}
                    >
                      <td className="px-3 py-2 align-middle">
                        <p className="font-medium text-main text-[11px] leading-snug break-words whitespace-normal">
                          {item.itemName}
                        </p>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <p className="text-[10px] text-muted break-all">
                          {item.id}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-theme bg-app text-[10px] text-muted">
            <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
            {search && (
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => setSearch("")}
              >
                Clear
              </button>
            )}
          </div>

        </div>,
        document.body,
      )}
    </div>
  );
}