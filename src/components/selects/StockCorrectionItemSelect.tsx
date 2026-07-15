import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Package, ChevronDown, X, Loader2 } from "lucide-react";

import { getStockReport } from "../../api/stockApi";
import { showApiError } from "../../utils/alert";
import type {
  StockItemSelectPayload,
  StockItemBatch,
} from "../../hooks/stock correction-movement/Usestockcorrectionform";

interface FlatItem {
  itemCode: string;
  itemName: string;
  sku: string;
  category?: string;
  /** Human-readable unit, e.g. "Vials", "Ampoules", "PCS" — from stock_uom, NOT the numeric packingUnit factor. */
  unit: string;
  totalBalQty: number;
  batches: StockItemBatch[];
}

export interface StockItemNameCodeSelectProps {
  /** Prefill text shown in the trigger, e.g. when editing an existing batch. */
  itemPrefillName?: string;
  onItemPicked: (payload: StockItemSelectPayload) => void;
  onItemClear?: () => void;
  disabled?: boolean;
}

export default function StockItemNameCodeSelect({
  itemPrefillName,
  onItemPicked,
  onItemClear,
  disabled = false,
}: StockItemNameCodeSelectProps) {
  const [items, setItems] = useState<FlatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FlatItem | null>(null);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load once (lazily, on first open) ───────────────────────────────────
  const load = async () => {
    try {
      setLoading(true);
      const res = await getStockReport(1, 1000, "");
      const raw = res?.message?.data ?? [];
      const list: FlatItem[] = raw
        // Product items only — same rule StockItemSelect applies for invoiceType="Product".
        .filter((item: any) => item.is_service_item !== 1)
        .map((item: any) => ({
          itemCode: item.item_code,
          itemName: item.item_name,
          sku: item.item_code,
          category: undefined,
          // stock_uom is the real human-readable unit ("Vials", "Ampoules", ...).
          // packingUnit in this API is a numeric packing factor (e.g. 1.0), not
          // a display unit, so it must not be used here.
          unit: item.stock_uom || "PCS",
          totalBalQty: Number(item.total_bal_qty ?? 0),
          batches: (item.batches ?? []).map(
            (b: any): StockItemBatch => ({
              batchNo: b.batch_no,
              qty: Number(b.bal_qty ?? 0),
              expiryDate: b.expiry_date,
              warehouse: b.warehouse,
            }),
          ),
        }));
      setItems(list);
      setLoaded(true);
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    if (disabled) return;
    setDropRect(triggerRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
    if (!loaded) await load();
  };

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: globalThis.MouseEvent) => {
      const t = e.target as Node;
      if (dropdownRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // Keep the portal positioned under the trigger on scroll/resize.
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

  const filtered = useMemo(() => {
    const tokens = search.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return items;
    return items.filter((it) => {
      const hay = `${it.itemName ?? ""} ${it.itemCode ?? ""}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [items, search]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered]);

  const dropStyle = useMemo((): CSSProperties => {
    if (!dropRect) return {};
    const PADDING = 12;
    const DROP_H = 260;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Match the trigger's own width exactly, only shrinking on very narrow
    // viewports so the dropdown never overflows the screen.
    const width = Math.min(dropRect.width, vw - PADDING * 2);
    let left = dropRect.left;
    if (left + width > vw - PADDING) left = Math.max(PADDING, vw - width - PADDING);
    const spaceBelow = vh - dropRect.bottom - PADDING;
    const spaceAbove = dropRect.top - PADDING;
    const flipUp = spaceBelow < DROP_H && spaceAbove > spaceBelow;
    const vertPos = flipUp
      ? { bottom: vh - dropRect.top + 4, top: "auto" as const }
      : { top: dropRect.bottom + 4, bottom: "auto" as const };
    return { position: "fixed", ...vertPos, left, width, zIndex: 9999 };
  }, [dropRect]);

  const handleSelect = (item: FlatItem) => {
    setSelected(item);
    setOpen(false);
    setSearch("");
    onItemPicked({
      itemCode: item.itemCode,
      itemName: item.itemName,
      sku: item.sku,
      category: item.category,
      packingUnit: item.unit,
      qty: item.totalBalQty,
      // Full per-batch breakdown — this is what makes the "Available Stock
      // For This Item" table show every batch for the selected item.
      batches: item.batches,
    });
  };

  const selectHighlighted = () => {
    const item = filtered[highlightedIndex];
    if (!item || loading) return;
    handleSelect(item);
  };

  const handleClear = (e: MouseEvent) => {
    e.stopPropagation();
    setSelected(null);
    setSearch("");
    onItemClear?.();
  };

  const displayName = selected?.itemName || itemPrefillName;
  const displayCode = selected?.itemCode;

  return (
    <div className="w-full min-w-0" data-nav-ignore={open ? "true" : undefined}>
      {/* TRIGGER */}
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            handleOpen();
          }
        }}
        onClick={handleOpen}
        className={[
          "flex items-center gap-1 px-1.5 py-1 border border-theme rounded-md min-h-[28px]",
          "bg-card text-main text-[11px] cursor-pointer select-none transition-colors duration-150 w-full",
          disabled
            ? "opacity-50 pointer-events-none"
            : "hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
        ].join(" ")}
      >
        {!displayName && <Package className="w-3.5 h-3.5 text-muted shrink-0" />}
        <span className={`flex-1 min-w-0 break-words leading-snug ${displayName ? "text-main" : "text-muted"}`}>
          {loading && !loaded
            ? "Loading…"
            : displayName
              ? (
                <>
                  {displayName}
                  {displayCode ? <span className="text-muted"> — {displayCode}</span> : null}
                </>
              )
              : "Select item"}
        </span>
        {selected && !disabled && (
          <button type="button" onClick={handleClear} className="shrink-0" aria-label="Clear selected item">
            <X className="w-3 h-3 text-muted hover:text-danger transition-colors" />
          </button>
        )}
        <ChevronDown
          className={`w-3 h-3 text-muted shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open &&
        dropRect &&
        createPortal(
          <div
            ref={dropdownRef}
            data-nav-ignore="true"
            role="listbox"
            className="bg-card border border-theme rounded-lg shadow-xl flex flex-col overflow-hidden"
            style={dropStyle}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-theme bg-app">
              <Search className="w-3.5 h-3.5 text-muted shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  switch (e.key) {
                    case "ArrowDown":
                      e.preventDefault();
                      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
                      break;
                    case "ArrowUp":
                      e.preventDefault();
                      setHighlightedIndex((i) => Math.max(i - 1, 0));
                      break;
                    case "Enter":
                      e.preventDefault();
                      selectHighlighted();
                      break;
                    case "Escape":
                      e.preventDefault();
                      setOpen(false);
                      setSearch("");
                      break;
                    case "Tab":
                      setOpen(false);
                      break;
                  }
                }}
                placeholder="Search by name or code…"
                className="flex-1 min-w-0 bg-transparent text-main text-[11px] outline-none placeholder:text-muted"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="shrink-0" aria-label="Clear search">
                  <X className="w-3.5 h-3.5 text-muted hover:text-danger transition-colors" />
                </button>
              )}
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "min(240px, 45vh)" }}>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-muted text-[11px]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading items…
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-6 text-center text-muted text-[11px]">No items found</div>
              ) : (
                <ul>
                  {filtered.map((item, index) => {
                    const isHighlighted = index === highlightedIndex;
                    return (
                      <li
                        key={item.itemCode}
                        role="option"
                        aria-selected={isHighlighted}
                        ref={(el) => {
                          if (isHighlighted) el?.scrollIntoView({ block: "nearest" });
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => handleSelect(item)}
                        className={[
                          "px-3 py-2 border-b border-theme last:border-none cursor-pointer row-interactive flex items-start justify-between gap-2",
                          isHighlighted ? "row-highlighted" : "",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-main text-[11px] leading-snug break-words">{item.itemName}</p>
                          <p className="text-[10px] text-muted mt-0.5">{item.itemCode}</p>
                        </div>
                        <span className="shrink-0 mt-0.5 text-[10px] text-muted bg-row-hover/60 border border-theme rounded-full px-2 py-0.5 whitespace-nowrap">
                          {item.batches.length} batch{item.batches.length !== 1 ? "es" : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-3 py-1.5 border-t border-theme bg-app text-[10px] text-muted">
              {filtered.length} item{filtered.length !== 1 ? "s" : ""}
              {items.length !== filtered.length && ` of ${items.length}`}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}