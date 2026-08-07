import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { getStockReport } from "../../api/stockApi";
import { useCompanyStore } from "../../store/companyStore";
import {
  Search,
  Package,
  ChevronDown,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { showApiError } from "../../utils/alert";

function fmt(date?: string) {
  if (!date) return "-";
  const [year, month, day] = date.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day} ${months[parseInt(month) - 1]} ${year}`;
}

function daysUntilExpiry(dateStr?: string): number | null {
  if (!dateStr) return null;
  const exp = new Date(dateStr);
  if (isNaN(exp.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((exp.getTime() - today.getTime()) / 86_400_000);
}

type ExpiryStatus = "expired" | "soon" | "ok" | "none";

function getExpiryStatus(dateStr?: string): ExpiryStatus {
  const days = daysUntilExpiry(dateStr);
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  return "ok";
}

type StockFilter = "all" | "instock" | "expired";

function ExpiryCell({ date }: { date?: string }) {
  const status = getExpiryStatus(date);
  const label = fmt(date);
  if (status === "expired")
    return (
      <span className="inline-flex items-center gap-1 text-danger text-[11px] font-semibold whitespace-nowrap">
        {label}
      </span>
    );
  if (status === "soon")
    return (
      <span className="inline-flex items-center gap-1 text-warning text-[11px] font-semibold whitespace-nowrap">
        <AlertTriangle className="w-3 h-3 shrink-0" />
        {label}
      </span>
    );
  return (
    <span className="text-[11px] text-main whitespace-nowrap">{label}</span>
  );
}

function StockCell({ qty, isService }: { qty: number; isService?: boolean }) {
  if (isService) return <span className="text-muted text-[11px]">—</span>;
  const isOut = qty <= 0;
  return (
    <span
      className={`tabular-nums font-semibold text-[11px] ${isOut ? "text-danger" : "text-success"}`}
    >
      {qty}
    </span>
  );
}

function FilterPill({
  value,
  active,
  onClick,
}: {
  value: StockFilter;
  active: boolean;
  onClick: () => void;
}) {
  const labels: Record<StockFilter, string> = {
    all: "All",
    instock: "In Stock",
    expired: "Expired",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium transition-all duration-150 whitespace-nowrap ${
        active
          ? "bg-primary text-white border-primary shadow-sm"
          : "border-theme text-muted hover:border-primary hover:text-primary"
      }`}
    >
      {labels[value]}
    </button>
  );
}

export default function StockItemSelect({
  value = "",
  batchNo,
  itemName,
  onChange,
  onClear,
  invoiceType = "Product",
  taxCategory,
  disabled = false,
  isQuotation = false,
}: any) {
  const [flatRows, setFlatRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);
  // Defaults to hiding zero-stock items on open.
  const [stockFilter, setStockFilter] = useState<StockFilter>("instock");
  const isZraEnabled = useCompanyStore((s) => s.isZraEnabled);

  const showStockFilter = invoiceType !== "Service" && invoiceType !== "RVAT";

  // Tracks which row in the open list is currently keyboard-highlighted.
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getStockReport(1, 1000, "", taxCategory);
      const raw = res?.message?.data ?? [];
      const rows: any[] = [];
      raw.forEach((item: any) => {
        const isService = item.is_service_item === 1;
        const wantsServiceItems =
          invoiceType === "Service" || invoiceType === "RVAT";
        if (wantsServiceItems && !isService) return;
        if (!wantsServiceItems && isService) return;
        const base = {
          itemCode: item.item_code,
          itemName: item.item_name,
          price_list: item.price_list,
          description: item.description,
          packingSize: item.packingSize,
          packingUnit: item.packingUnit,
          stockUom: item.stock_uom,
          piecesPerBox: item.piecesPerBox,
          taxInfo: item.taxInfo || [],
          isServiceItem: item.is_service_item,
          is_mtv_item: item.is_mtv_item,
          rrp_rate: item.rrp_rate,
        };
        if (item.batches?.length) {
          item.batches.forEach((b: any) => {
            rows.push({
              ...base,
              batchNo: b.batch_no,
              expiryDate: b.expiry_date,
              mfgDate: b.manufacturing_date,
              warehouse: b.warehouse,
              qty: b.bal_qty,
              valuation_rate: b.valuation_rate,
              sellingPrice: b.sell_value,
              purchasePrice: b.buy_value,
            });
          });
        } else {
          rows.push({
            ...base,
            valuation_rate: item.valuation_rate,
            sellingPrice: item.sell_value,
            purchasePrice: item.buy_value,
          });
        }
      });
      setFlatRows(rows);
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (flatRows.length > 0) {
      load();
    }
  }, [invoiceType]);

  const handleSelect = (row: any) => {
    setSelected(row);
    setOpen(false);
    setSearch("");
    const selectedTax = row.taxInfo?.[0] || {};
    const totalTaxRate = Number(selectedTax.totalTaxRate || 0);
    const useRrpPrice = isZraEnabled && Number(row?.is_mtv_item) === 1;
    const resolvedPrice = useRrpPrice
      ? Number(row?.rrp_rate ?? 0)
      : (row.price_list ?? 0);

    onChange({
      itemCode: row.itemCode,
      itemName: row.itemName,
      description: row.description,
      batchNo: row.batchNo,
      expiryDate: row.expiryDate,
      mfgDate: row.mfgDate,
      qty: row.qty,
      price_list: row.price_list,
      price: resolvedPrice,
      packingSize: row.packingSize,
      packingUnit: row.packingUnit,
      stockUom: row.stockUom,
      piecesPerBox: row.piecesPerBox,
      valuation_rate: row.valuation_rate,
      sellingPrice: row.sellingPrice,
      purchasePrice: row.purchasePrice,
      warehouse: row.warehouse,
      vatRate: totalTaxRate,
      vatCode: selectedTax.taxName || "",
      taxInfo: row.taxInfo,
      isServiceItem: row.isServiceItem,
    });
  };

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dropdownRef.current?.contains(t) || triggerRef.current?.contains(t))
        return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
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

  const filtered = useMemo(() => {
    const tokens = search.toLowerCase().split(/\s+/).filter(Boolean);
    return flatRows
      .filter((r) => {
        const hay =
          `${r.itemName ?? ""} ${r.itemCode ?? ""} ${r.batchNo ?? ""}`.toLowerCase();
        if (tokens.length && !tokens.every((t) => hay.includes(t)))
          return false;
        // Stock filter never applies to service items/invoices.
        if (!showStockFilter) return true;
        if (stockFilter === "instock")
          return r.isServiceItem || Number(r.qty ?? 0) > 0;
        if (stockFilter === "expired")
          return getExpiryStatus(r.expiryDate) === "expired";
        return true;
      })
      .sort((a, b) => Number(b.qty ?? 0) - Number(a.qty ?? 0));
  }, [flatRows, search, stockFilter, showStockFilter]);

  // Whenever the visible list changes (typing, filter pill, opening), jump
  // the keyboard highlight back to the top row.
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered]);

  const dropStyle = useMemo((): React.CSSProperties => {
    if (!dropRect) return {};
    const PADDING = 12,
      MAX_W = 680,
      DROP_H = 260;
    const vw = window.innerWidth,
      vh = window.innerHeight;
    const width =
      vw <= 640 ? vw - PADDING * 2 : Math.min(MAX_W, vw - PADDING * 2);
    let left = dropRect.left;
    if (left + width > vw - PADDING)
      left = Math.max(PADDING, vw - width - PADDING);
    const spaceBelow = vh - dropRect.bottom - PADDING;
    const spaceAbove = dropRect.top - PADDING;
    const flipUp = spaceBelow < DROP_H && spaceAbove > spaceBelow;
    const vertPos = flipUp
      ? { bottom: vh - dropRect.top + 4, top: "auto" as const }
      : { top: dropRect.bottom + 4, bottom: "auto" as const };
    return { position: "fixed", ...vertPos, left, width, zIndex: 9999 };
  }, [dropRect]);

  const handleOpen = async () => {
    if (disabled) return;
    setDropRect(triggerRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
    if (!flatRows.length) await load();
  };

  // Selects whichever row is currently keyboard-highlighted, if it's usable.
  const selectHighlighted = () => {
    const row = filtered[highlightedIndex];
    if (!row) return;
    const isDisabled =
      !isQuotation && Number(row.qty ?? 0) <= 0 && !row.isServiceItem;
    if (isDisabled || loading) return;
    handleSelect(row);
  };

  const displayName = selected?.itemName || itemName;

  return (
    // data-nav-ignore stops the parent spreadsheet grid's arrow-key handler
    // from hijacking keys while this dropdown is open.
    <div className="w-full min-w-0" data-nav-ignore={open ? "true" : undefined}>
      {/* TRIGGER — text wraps so full item name is always visible */}
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          // ArrowDown also opens the dropdown, like a native <select>.
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
        {!displayName && (
          <Package className="w-3.5 h-3.5 text-muted shrink-0" />
        )}
        {/* break-words + no truncate so the full item name always shows */}
        <span
          className={`flex-1 min-w-0 break-words leading-snug ${displayName ? "text-main" : "text-muted"}`}
        >
          {loading ? "Loading…" : displayName || "Select item"}
        </span>
        {loading ? (
          <Loader2 className="w-3 h-3 text-muted shrink-0 animate-spin mt-0.5" />
        ) : (
          <ChevronDown
            className={`w-3 h-3 text-muted shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        )}
      </div>

      {open &&
        dropRect &&
        createPortal(
          <div
            ref={dropdownRef}
            // Portal content renders outside this DOM subtree, so it needs
            // its own nav-ignore flag too.
            data-nav-ignore="true"
            role="listbox"
            className="bg-card border border-theme rounded-lg shadow-xl flex flex-col overflow-hidden"
            style={dropStyle}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-theme bg-app">
              {showStockFilter && (
                <>
                  <div className="flex items-center gap-1 shrink-0">
                    {(["all", "instock", "expired"] as StockFilter[]).map(
                      (f) => (
                        <FilterPill
                          key={f}
                          value={f}
                          active={stockFilter === f}
                          onClick={() => setStockFilter(f)}
                        />
                      ),
                    )}
                  </div>
                  <div className="w-px h-4 bg-theme shrink-0" />
                </>
              )}
              <Search className="w-3.5 h-3.5 text-muted shrink-0" />
              {showStockFilter && stockFilter !== "all" && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium shrink-0">
                  {stockFilter === "instock" ? "In Stock" : "Expired"}
                  <button
                    type="button"
                    onClick={() => setStockFilter("all")}
                    className="hover:opacity-70"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                // Full keyboard navigation inside the open list.
                onKeyDown={(e) => {
                  switch (e.key) {
                    case "ArrowDown":
                      e.preventDefault();
                      setHighlightedIndex((i) =>
                        Math.min(i + 1, filtered.length - 1),
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
                placeholder="Search by name, code or batch…"
                className="flex-1 min-w-0 bg-transparent text-main text-[11px] outline-none placeholder:text-muted"
              />
              {search && (
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
              style={{ maxHeight: "min(192px, 45vh)" }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-muted text-[11px]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading items…
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-6 text-center text-muted text-[11px]">
                  No items found
                </div>
              ) : (
                <table className="w-full table-fixed border-collapse text-[11px]">
                  <colgroup>
                    <col style={{ width: "38%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "17%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-app">
                    <tr className="border-b border-theme">
                      {[
                        { label: "Item / Code", cls: "text-left" },
                        { label: "Batch", cls: "text-left" },
                        { label: "MFG", cls: "text-left" },
                        { label: "EXP", cls: "text-left" },
                        { label: "Stock", cls: "text-right" },
                      ].map(({ label, cls }) => (
                        <th
                          key={label}
                          className={`px-3 py-2 ${cls} text-[10px] font-semibold text-muted tracking-wide uppercase`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, index) => {
                      const qty = Number(row.qty ?? 0);
                      const isDisabled =
                        !isQuotation && qty <= 0 && !row.isServiceItem;
                      const exStatus = getExpiryStatus(row.expiryDate);
                      const isHighlighted = index === highlightedIndex;
                      const accentCls =
                        exStatus === "expired"
                          ? "border-l-2 border-l-danger"
                          : exStatus === "soon"
                            ? "border-l-2 border-l-warning"
                            : "";
                      return (
                        <tr
                          key={`${row.itemCode}-${row.batchNo || "no-batch"}`}
                          role="option"
                          aria-selected={isHighlighted}
                          // Keep the keyboard-highlighted row scrolled into view.
                          ref={(el) => {
                            if (isHighlighted) {
                              el?.scrollIntoView({ block: "nearest" });
                            }
                          }}
                          // Hovering syncs the mouse and keyboard highlight.
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={() => {
                            if (!isDisabled && !loading) handleSelect(row);
                          }}
                          className={[
                            "border-b border-theme last:border-none",
                            "row-interactive",
                            accentCls,
                            isHighlighted ? "row-highlighted" : "",
                            isDisabled ? "row-disabled" : "",
                          ].join(" ")}
                        >
                          <td className="px-3 py-2.5 align-middle">
                            <p className="font-medium text-main text-[11px] leading-snug break-words">
                              {row.itemName}
                            </p>
                            <p className="text-[10px] text-muted mt-0.5 truncate">
                              {row.itemCode}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 align-middle">
                            <span
                              className="block truncate text-[11px] text-main"
                              title={row.batchNo || "-"}
                            >
                              {row.batchNo || "-"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 align-middle text-[11px] text-main whitespace-nowrap">
                            {fmt(row.mfgDate)}
                          </td>
                          <td className="px-3 py-2.5 align-middle">
                            <ExpiryCell date={row.expiryDate} />
                          </td>
                          <td className="px-3 py-2.5 align-middle text-right">
                            <StockCell
                              qty={qty}
                              isService={row.isServiceItem}
                            />
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
                {filtered.length} item{filtered.length !== 1 ? "s" : ""}
                {flatRows.length !== filtered.length &&
                  ` of ${flatRows.length}`}
              </span>
              {((showStockFilter && stockFilter !== "all") || search) && (
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => {
                    setStockFilter("all");
                    setSearch("");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
