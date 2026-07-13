import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { getAllItems } from "../../../api/itemApi";
import { showApiError } from "../../../utils/alert";
import { Package, ChevronDown, Search, X, Loader2 } from "lucide-react";

type Item = {
  id: string;
  itemName: string;
  unitOfMeasureCd?: string;
  sellingPrice?: number;
  taxPerct?: number;
  vatRate?: number;
  vatCd?: string;
  taxCode?: string;
  is_stock_item?: number;
};

interface POItemSelectProps {
  value?: string;
  selectedId?: string;
  taxCategory?: string;
  className?: string;
  invoiceType?: "Product" | "Service";
  onChange: (item: Item) => void;
}

const DROPDOWN_OFFSET = 4;
const DROP_H = 260;
const DEBOUNCE_MS = 350;

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
  if (left + width > vw - PADDING)
    left = Math.max(PADDING, vw - width - PADDING);
  const spaceBelow = vh - dropRect.bottom - PADDING;
  const spaceAbove = dropRect.top - PADDING;
  const flipUp = spaceBelow < DROP_H && spaceAbove > spaceBelow;
  const vertPos = flipUp
    ? { bottom: vh - dropRect.top + DROPDOWN_OFFSET, top: "auto" as const }
    : { top: dropRect.bottom + DROPDOWN_OFFSET, bottom: "auto" as const };
  return { position: "fixed", ...vertPos, left, width, zIndex: 9999 };
}

export default function POItemSelect({
  value = "",
  selectedId,
  taxCategory,
  onChange,
  className = "",
  invoiceType,
}: POItemSelectProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);
  const [displayName, setDisplayName] = useState(value);

  // NEW: tracks which row in the open list is keyboard-highlighted.
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const loadedRef = useRef(false);

  const fetchItems = useCallback(
    async (q: string) => {
      const id = ++requestIdRef.current;
      setLoading(true);
      try {
        const res = await getAllItems(
          1,
          50,
          taxCategory ?? undefined,
          q || undefined,
        );
        if (id !== requestIdRef.current) return;
        // const rawList = Array.isArray(res?.data?.data)
        let rawList = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : [];
        if (invoiceType === "Product") {
          rawList = rawList.filter((item: any) => item.is_stock_item === 1);
        } else if (invoiceType === "Service") {
          rawList = rawList.filter((item: any) => item.is_stock_item === 0);
        }
        setItems(rawList);
      } catch (err) {
        if (id !== requestIdRef.current) return;
        setItems([]);
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
    debounceRef.current = setTimeout(
      () => {
        fetchItems(search);
      },
      search ? DEBOUNCE_MS : 0,
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, open, fetchItems]);

  useEffect(() => {
    if (!selectedId || items.length === 0) return;
    const match = items.find((x) => x.id === selectedId);
    if (match) setDisplayName(match.itemName);
  }, [selectedId, items]);

  useEffect(() => {
    setDisplayName(value || "");
    setOpen(false);
    loadedRef.current = false;
  }, [taxCategory, value, invoiceType]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dropdownRef.current?.contains(t) || triggerRef.current?.contains(t))
        return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const update = () =>
      setDropRect(triggerRef.current?.getBoundingClientRect() ?? null);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // NEW: whenever the visible list changes, reset the keyboard highlight to the top.
  useEffect(() => {
    setHighlightedIndex(0);
  }, [items]);

  const handleOpen = useCallback(() => {
    setDropRect(triggerRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
    if (!loadedRef.current) {
      loadedRef.current = true;
      fetchItems("");
    }
  }, [fetchItems]);

  const dropStyle = useMemo((): React.CSSProperties => {
    if (!dropRect) return {};
    return getDropStyle(dropRect, window.innerWidth, window.innerHeight);
  }, [dropRect]);

  const handleSelect = useCallback(
    (item: Item) => {
      setDisplayName(item.itemName);
      setOpen(false);
      setSearch("");
      onChange(item);
    },
    [onChange],
  );

  // NEW: selects whichever row is currently keyboard-highlighted.
  const selectHighlighted = () => {
    const item = items[highlightedIndex];
    if (!item) return;
    handleSelect(item);
  };

  return (
    // NEW: data-nav-ignore stops a parent spreadsheet grid's arrow-key
    // handler from hijacking keys while this dropdown is open.
    <div
      className={`w-full min-w-0 ${className}`}
      data-nav-ignore={open ? "true" : undefined}
    >
      {/* TRIGGER — items-start so icon stays top-aligned when name wraps */}
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          // NEW: ArrowDown also opens the dropdown, like a native <select>.
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            handleOpen();
          }
        }}
        className="flex items-center gap-1 px-1.5 py-1 border border-theme rounded min-h-[28px]
  bg-card text-main text-[11px] cursor-pointer select-none w-full
  hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary
  transition-colors duration-150"
      >
        {!displayName && <Package className="w-3 h-3 text-muted shrink-0" />}
        {/* ── KEY FIX: break-words + no truncate so full name always shows ── */}
        <span
          className={`flex-1 min-w-0 break-words leading-tight text-[10px] ${displayName ? "text-main" : "text-muted"}`}
        >
          {loading ? "Loading…" : displayName || "Select item…"}
        </span>
        {loading ? (
          <Loader2 className="w-3 h-3 text-muted shrink-0 animate-spin" />
        ) : (
          <ChevronDown
            className={`w-3 h-3 text-muted shrink-0 transition-transform duration-150 mt-0.5 ${open ? "rotate-180" : ""}`}
          />
        )}
      </div>

      {open &&
        dropRect &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            style={dropStyle}
            // NEW: portal content renders outside this DOM subtree, so it
            // needs its own nav-ignore flag too.
            data-nav-ignore="true"
            className="bg-card border border-theme rounded-lg shadow-xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-theme bg-app">
              <Search className="w-3.5 h-3.5 text-muted shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                // NEW: full keyboard navigation inside the open list.
                onKeyDown={(e) => {
                  switch (e.key) {
                    case "ArrowDown":
                      e.preventDefault();
                      setHighlightedIndex((i) =>
                        Math.min(i + 1, items.length - 1),
                      );
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
              {loading && (
                <Loader2 className="w-3.5 h-3.5 text-muted shrink-0 animate-spin" />
              )}
              {search && !loading && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-muted hover:text-danger transition-colors" />
                </button>
              )}
            </div>

            <div
              className="overflow-y-auto"
              style={{ maxHeight: "min(200px, 45vh)" }}
            >
              {loading && items.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-6 text-muted text-[11px]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading items…
                </div>
              ) : items.length === 0 ? (
                <div className="py-6 text-center text-muted text-[11px]">
                  No items found
                </div>
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
                    {items.map((item, index) => {
                      // NEW: is this the keyboard-highlighted row?
                      const isHighlighted = index === highlightedIndex;
                      return (
                        <tr
                          key={item.id}
                          role="option"
                          aria-selected={item.id === selectedId}
                          // NEW: keep the highlighted row scrolled into view.
                          ref={(el) => {
                            if (isHighlighted) {
                              el?.scrollIntoView({ block: "nearest" });
                            }
                          }}
                          // NEW: hovering syncs mouse and keyboard highlight.
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={() => handleSelect(item)}
                          className={[
                            "border-b border-theme last:border-none row-interactive",
                            item.id === selectedId ? "bg-primary/10" : "",
                            isHighlighted ? "row-highlighted" : "",
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
                      );
                    })}
                  </tbody>
                </table>
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
    </div>
  );
}