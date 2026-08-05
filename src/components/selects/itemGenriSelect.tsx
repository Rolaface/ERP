// src/components/selects/itemGenriSelect.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { getAllItems } from "../../api/itemApi";
import { showApiError } from "../../utils/alert";
import { Package, Search, X, Loader2 } from "lucide-react";
import SelectShell from "../../components/ui/select/SelectShell";

export interface SelectedStockItem {
  id: string;
  itemCode: string;
  itemName: string;
  itemClassCode?: string;
  packingSize?: string;
  packingUnit?: string;
  batchNo?: string;
  expiryDate?: string;
  qty?: number;
  price?: number;
  warehouse?: string;
  vatRate?: number;
  is_stock_item?: number;
}

interface ItemSelectProps {
  value?: string;
  selectedId?: string;
  taxCategory?: string;
  excludeItemCodes?: string[];
  invoiceType?: "Product" | "Service";
  onChange: (item: SelectedStockItem) => void;
  onAddNew?: () => void;
  className?: string;
  disabled?: boolean;
}

const DROPDOWN_OFFSET = 4;
const DROP_MAX_H = 260;
const DEBOUNCE_MS = 300;
const PADDING = 8;
const EMPTY_EXCLUDE: string[] = [];

function getDropStyle(
  triggerRect: DOMRect,
  vw: number,
  vh: number,
): React.CSSProperties {
  const minW = triggerRect.width;
  const maxW = vw <= 480 ? vw - PADDING * 2 : Math.min(360, vw - PADDING * 2);
  const width = Math.max(minW, maxW);

  let left = triggerRect.left;
  if (left + width > vw - PADDING) left = Math.max(PADDING, vw - width - PADDING);

  const spaceBelow = vh - triggerRect.bottom - PADDING;
  const spaceAbove = triggerRect.top - PADDING;
  const flipUp = spaceBelow < DROP_MAX_H && spaceAbove > spaceBelow;

  const vertical = flipUp
    ? { bottom: vh - triggerRect.top + DROPDOWN_OFFSET, top: "auto" as const }
    : { top: triggerRect.bottom + DROPDOWN_OFFSET, bottom: "auto" as const };

  return { position: "fixed", ...vertical, left, width, zIndex: 9999 };
}

export default function ItemSelect({
  value = "",
  selectedId,
  taxCategory,
  excludeItemCodes = EMPTY_EXCLUDE,
  invoiceType,
  onChange,
  onAddNew,
  className = "",
  disabled = false,
}: ItemSelectProps) {
  const [rawItems, setRawItems] = useState<SelectedStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedStockItem | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const loadedRef = useRef(false);

  const exclude = useMemo(
    () => new Set(excludeItemCodes.map((c) => String(c ?? "").trim()).filter(Boolean)),
    [excludeItemCodes],
  );

  const items = useMemo(
    () => rawItems.filter((it) => !exclude.has(String(it.itemCode).trim())),
    [rawItems, exclude],
  );

  const fetchItems = useCallback(
    async (q: string) => {
      const id = ++requestIdRef.current;
      setLoading(true);
      try {
        const res = await getAllItems(1, 50, taxCategory ?? undefined, q || undefined);
        if (id !== requestIdRef.current) return;

        let rawList = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : [];

        if (invoiceType === "Product") {
          rawList = rawList.filter((it: any) => it.is_stock_item === 1);
        } else if (invoiceType === "Service") {
          rawList = rawList.filter((it: any) => it.is_stock_item === 0);
        }

        const mapped: SelectedStockItem[] = rawList.map((it: any) => ({
          id: it.id,
          itemCode: it.id,
          itemName: it.itemName,
          itemClassCode: it.itemClassCode,
          packingSize: it.packingSize,
          packingUnit: it.packingUnit,
          batchNo: it.batchNo,
          expiryDate: it.expiryDate,
          qty: it.qty,
          price: it.price ?? it.sellingPrice ?? 0,
          warehouse: it.warehouse,
          vatRate: it.vatRate,
          is_stock_item: it.is_stock_item,
        }));

        setRawItems(mapped);
      } catch (err) {
        if (id !== requestIdRef.current) return;
        setRawItems([]);
        showApiError(err);
      } finally {
        if (id === requestIdRef.current) setLoading(false);
      }
    },
    [taxCategory, invoiceType],
  );

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchItems(search), search ? DEBOUNCE_MS : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, open, fetchItems]);

  useEffect(() => {
    if (!selectedId || items.length === 0) return;
    const match = items.find((x) => x.id === selectedId);
    if (match) setSelectedItem(match);
  }, [selectedId, items]);

  useEffect(() => {
    setOpen(false);
    loadedRef.current = false;
    if (!value) setSelectedItem(null);
  }, [taxCategory, value, invoiceType]);

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

  useEffect(() => {
    setHighlightedIndex(0);
  }, [items.length]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setDropRect(triggerRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
    if (!loadedRef.current) {
      loadedRef.current = true;
      fetchItems("");
    }
  }, [fetchItems, disabled]);

  const dropStyle = useMemo((): React.CSSProperties => {
    if (!dropRect) return {};
    return getDropStyle(dropRect, window.innerWidth, window.innerHeight);
  }, [dropRect]);

  const handleSelect = useCallback(
    (item: SelectedStockItem) => {
      setSelectedItem(item);
      setOpen(false);
      setSearch("");
      onChange(item);
    },
    [onChange],
  );

  const selectHighlighted = () => {
    const item = items[highlightedIndex];
    if (item) handleSelect(item);
  };

  return (
    <>
      <SelectShell
        icon={!selectedItem ? <Package /> : undefined}
        chevronOpen={open}
        disabled={disabled}
        className={className}
      >
        <div
          ref={triggerRef}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onClick={handleOpen}
          onKeyDown={(e) => {
            if (!disabled && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
              e.preventDefault();
              handleOpen();
            }
          }}
          data-nav-ignore={open ? "true" : undefined}
          className={`select-none ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`flex-1 min-w-0 truncate leading-tight ${
              selectedItem ? "text-main" : "text-muted"
            }`}
          >
            {selectedItem ? selectedItem.itemName : "Search item…"}
          </span>
        </div>
      </SelectShell>

      {/* ── Dropdown — compact name + code list ── */}
      {open &&
        dropRect &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            style={dropStyle}
            data-nav-ignore="true"
            className="bg-card border border-theme rounded-lg shadow-xl flex flex-col overflow-hidden"
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
                      setHighlightedIndex((i) => Math.min(i + 1, items.length - 1));
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
              {loading && <Loader2 className="w-3.5 h-3.5 text-muted shrink-0 animate-spin" />}
              {search && !loading && (
                <button type="button" onClick={() => setSearch("")} className="shrink-0">
                  <X className="w-3.5 h-3.5 text-muted hover:text-danger transition-colors" />
                </button>
              )}
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: DROP_MAX_H }}>
              {loading && items.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted text-[11px]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading items…
                </div>
              ) : items.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted text-[11px] mb-3">No items found</p>
                  {onAddNew && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(false);
                        onAddNew();
                      }}
                      className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-[11px] font-medium hover:opacity-90 transition-opacity"
                    >
                      + Add Item
                    </button>
                  )}
                </div>
              ) : (
                <ul>
                  {items.map((item, index) => {
                    const isHighlighted = index === highlightedIndex;
                    const isSelected = item.id === selectedId;
                    return (
                      <li
                        key={item.id}
                        role="option"
                        aria-selected={isSelected}
                        ref={(el) => {
                          if (isHighlighted) el?.scrollIntoView({ block: "nearest" });
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => handleSelect(item)}
                        className={`px-3 py-2 border-b border-theme last:border-none cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/10"
                            : isHighlighted
                              ? "bg-app"
                              : "hover:bg-app"
                        }`}
                      >
                        <div className="font-medium text-main text-[11px] truncate">
                          {item.itemName}
                        </div>
                        <div className="text-[9px] text-muted">{item.itemCode}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between px-3 py-1.5 border-t border-theme bg-app text-[10px] text-muted">
              <span>
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
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
    </>
  );
}