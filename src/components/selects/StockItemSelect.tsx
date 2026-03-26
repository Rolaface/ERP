import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { getStockReport } from "../../api/stockApi";
import { Search, Package, ChevronDown, X } from "lucide-react";
import { showApiError } from "../../utils/alert";
import { getItemByItemCode } from "../../api/itemApi";

// ─── Type Definitions ────────────────────────────────────────────────────────

interface StockItem {
  id?: string;
  itemCode: string;
  itemName: string;
  batchNo?: string;
  expiryDate?: string;
  mfgDate?: string;
  description: string;
  sellingPrice?: number;
  purchasePrice?: number;
  taxCategory?: string;
  taxRate?: number;
  taxAmount?: number;
  packingSize: string;
  packingUnit: string;
  valuation_rate: number;
  qty?: number;
  taxCode?: string;
  warehouse?: string;
}

// Flat row represents one line in the dropdown — one item+batch combination
interface FlatRow {
  itemCode: string;
  itemName: string;
  description: string;
  packingSize: string;
  packingUnit: string;
  batchNo?: string;
  expiryDate?: string;
  mfgDate?: string;
  qty?: number;
  valuation_rate: number;
  sellingPrice?: number;
  purchasePrice?: number;
  taxCategory?: string;
  taxRate?: number;
  taxAmount?: number;
  hasBatch: boolean;
  warehouse?: string;
}

interface StockItemSelectProps {
  value?: string;     // currently selected itemCode
  batchNo?: string;   // used to restore the exact batch row after a tab switch
  itemName?: string;  // fallback display label when flatRows haven't loaded yet
  onChange: (item: StockItem) => void;
  onClear?: () => void;
  className?: string;
  disabled?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format an ISO date string "YYYY-MM-DD" → "02 May 26" */
function fmt(date?: string) {
  if (!date) return "—";
  const [y, m, d] = date.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d} ${months[parseInt(m) - 1]} ${y.slice(2)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StockItemSelect({
  value = "",
  batchNo,
  itemName,
  onChange,
  onClear,
  className = "",
  disabled = false,
}: StockItemSelectProps) {

  const [flatRows, setFlatRows] = useState<FlatRow[]>([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<FlatRow | null>(null);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);

  const triggerRef  = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  // ── Fetch stock data and flatten into one row per item-batch ──────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await getStockReport(1, 1000, "");
        const raw = res?.message?.data ?? [];
        const rows: FlatRow[] = [];

        raw.forEach((item: any) => {
          const base = {
            itemCode:    item.item_code,
            itemName:    item.item_name,
            description: item.description,
            packingSize: String(item.packingSize ?? ""),
            packingUnit: String(item.packingUnit ?? ""),
          };

          // If the item has batches, push one row per batch
          if (Array.isArray(item.batches) && item.batches.length > 0) {
            item.batches.forEach((b: any) => {
              rows.push({
                ...base,
                batchNo:     b.batch_no,
                expiryDate:  b.expiry_date,
                mfgDate:     b.manufacturing_date,
                warehouse:   b.warehouse,
                qty:         b.bal_qty,
                valuation_rate: b.valuation_rate,
                sellingPrice:   b.sell_value,
                purchasePrice:  b.buy_value,
                taxCategory:    b.taxCategory,
                taxRate:        b.taxRate,
                taxAmount:      b.taxamount,
                hasBatch: true,
              });
            });
          } else {
            // Non-batched item — single row, qty shown as "—"
            rows.push({
              ...base,
              valuation_rate: item.valuation_rate,
              sellingPrice:   item.sell_value,
              purchasePrice:  item.buy_value,
              taxCategory:    item.taxCategory,
              taxRate:        item.taxRate,
              taxAmount:      item.taxamount,
              hasBatch: false,
            });
          }
        });

        // Drop zero-qty batch rows — no point showing stock that can't be sold
        const filtered = rows.filter((r) => !r.hasBatch || (r.qty ?? 0) > 0);

        // Group by item name, then within each item sort by earliest expiry (FEFO)
        filtered.sort((a, b) => {
          const nameCompare = a.itemName.localeCompare(b.itemName);
          if (nameCompare !== 0) return nameCompare;
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });

        if (!cancelled) setFlatRows(filtered);
      } catch (err) {
        showApiError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Close dropdown when clicking outside trigger or dropdown ─────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || dropdownRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Sync selected row when value/batchNo prop changes externally ─────────
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    if (flatRows.length === 0) return;

    // Already correct — skip unnecessary state update
    if (
      selected?.itemCode === value &&
      selected?.batchNo === (batchNo ?? selected?.batchNo)
    ) return;

    const match =
      flatRows.find((r) => r.itemCode === value && (batchNo ? r.batchNo === batchNo : true)) ??
      flatRows.find((r) => r.itemCode === value) ??
      null;

    setSelected(match);
  }, [value, batchNo, flatRows]);

  // ── Filter rows by search query (name, code, or batch number) ────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return flatRows;
    return flatRows.filter(
      (r) =>
        r.itemName.toLowerCase().includes(q) ||
        r.itemCode.toLowerCase().includes(q) ||
        (r.batchNo ?? "").toLowerCase().includes(q),
    );
  }, [flatRows, search]);

  // ── Open the dropdown and measure trigger position for portal placement ───
  const openDropdown = () => {
    if (disabled) return;
    if (triggerRef.current) setDropRect(triggerRef.current.getBoundingClientRect());
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // ── Select a row: fire onChange immediately, then enrich with tax data ────
  const handleSelect = async (row: FlatRow) => {
    setSelected(row);
    setOpen(false);
    setSearch("");

    // Fire at once with all available stock data so the row updates immediately
    const stockPayload: StockItem = {
      id:            row.itemCode,
      itemCode:      row.itemCode,
      itemName:      row.itemName,
      description:   row.description,
      packingSize:   row.packingSize,
      packingUnit:   row.packingUnit,
      batchNo:       row.batchNo,
      expiryDate:    row.expiryDate,
      mfgDate:       row.mfgDate,
      qty:           row.qty,
      valuation_rate: row.valuation_rate,
      sellingPrice:  row.sellingPrice,
      purchasePrice: row.purchasePrice,
      taxCategory:   row.taxCategory,
      taxRate:       row.taxRate,
      taxAmount:     row.taxAmount,
      warehouse:     row.warehouse,
    };
    onChange(stockPayload);

    // Then fetch the item master for the accurate tax code and rate,
    // and fire a second onChange to patch those fields in
    try {
      const res  = await getItemByItemCode(row.itemCode);
      const item = res?.data;
      if (item?.taxInfo) {
        onChange({
          ...stockPayload,
          taxCode: item.taxInfo.taxCode,
          taxRate: Number(item.taxInfo.taxPerct),
        });
      }
    } catch (err) {
      showApiError(err);
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(null);
    setSearch("");
    onClear?.();
  };

  // ── Compute dropdown position via fixed portal (avoids overflow clipping) ─
  const dropStyle = (() => {
    if (!dropRect) return {};
    // Minimum width 780 px so all columns are comfortably visible
    const w    = Math.max(dropRect.width, 780);
    const left = Math.min(dropRect.left, Math.max(8, window.innerWidth - w - 8));
    const spaceBelow = window.innerHeight - dropRect.bottom - 8;
    const maxH = Math.min(spaceBelow, 360);
    return {
      position: "fixed" as const,
      top:      dropRect.bottom + 3,
      left,
      width:    w,
      zIndex:   9999,
      maxHeight: maxH,
    };
  })();

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={`w-full ${className}`}>

      {/* ── Trigger button ── */}
      <div
        ref={triggerRef}
        onClick={openDropdown}
        className={`
          w-full h-[26px] flex items-center gap-1.5 px-2
          border border-theme rounded text-[11px] bg-card text-main
          cursor-pointer select-none transition-all
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"}
          ${open ? "border-primary/60 ring-1 ring-primary/20" : ""}
        `}
      >
        <Package className="w-3 h-3 text-muted/40 shrink-0" />

        {selected || (value && itemName) ? (
          <div className="flex items-center flex-1 min-w-0">
            <span className="truncate font-medium" title={selected?.itemName ?? itemName}>
              {selected?.itemName ?? itemName}
            </span>
          </div>
        ) : (
          <span className="flex-1 text-muted/40">
            {loading ? "Loading items…" : "Select item"}
          </span>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          {(selected || (value && itemName)) && !disabled && (
            <button
              type="button"
              onClick={clear}
              className="p-0.5 rounded hover:bg-red-500/10 text-muted/40 hover:text-red-400 transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
          <ChevronDown
            className={`w-3 h-3 text-muted/40 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* ── Dropdown portal — rendered at body level to escape overflow clipping ── */}
      {open && dropRect && createPortal(
        <div
          ref={dropdownRef}
          style={dropStyle}
          className="bg-card border border-theme rounded-lg shadow-2xl overflow-hidden flex flex-col"
        >

          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-theme bg-app">
            <Search className="w-3.5 h-3.5 text-muted/50 shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item name, code or batch…"
              className="flex-1 bg-transparent text-[11px] text-main placeholder:text-muted/40 outline-none"
            />
            <span className="text-[9px] text-muted/40 shrink-0 tabular-nums">
              {filtered.length} of {flatRows.length} rows
            </span>
          </div>

          {/*
            Column layout — using px widths that actually fill the 780px minimum:
            Item Name (flex-1) | Batch No (120) | Expiry (90) | Mfg Date (90) | Warehouse (160) | Qty (56)
            This gives every column room to breathe without truncation on typical data.
          */}
          <div
            className="grid px-3 py-1.5 border-b border-theme/40 bg-app/60"
            style={{ gridTemplateColumns: "1fr 120px 90px 90px 160px 56px" }}
          >
            {[
              "Item Name / Code",
              "Batch No",
              "Expiry",
              "Mfg Date",
              "Warehouse",
              "Qty",
            ].map((h) => (
              <span
                key={h}
                className="text-[8.5px] font-semibold uppercase tracking-wider text-muted/50"
              >
                {h}
              </span>
            ))}
          </div>

          {/* Scrollable row list */}
          <ul className="overflow-y-auto flex-1 divide-y divide-theme/20">
            {filtered.map((row, i) => {
              const isSelected =
                selected?.itemCode === row.itemCode &&
                selected?.batchNo  === row.batchNo;
              const qtyOk = (row.qty ?? 0) > 0;

              return (
                <li
                  key={`${row.itemCode}-${row.batchNo ?? i}`}
                  onClick={() => handleSelect(row)}
                  className={`
                    grid items-center px-3 py-[7px] cursor-pointer transition-colors
                    ${isSelected
                      ? "bg-primary/8 border-l-[3px] border-primary"
                      : "hover:bg-row-hover border-l-[3px] border-transparent"
                    }
                  `}
                  style={{ gridTemplateColumns: "1fr 120px 90px 90px 160px 56px" }}
                >
                  {/* Item name + code stacked */}
                  <div className="min-w-0 pr-2">
                    <p
                      className={`text-[11px] font-medium truncate leading-tight ${
                        isSelected ? "text-primary" : "text-main"
                      }`}
                      title={row.itemName}
                    >
                      {row.itemName}
                    </p>
                    <p className="text-[9px] text-muted/50 font-mono leading-tight truncate">
                      {row.itemCode}
                    </p>
                  </div>

                  {/* Batch number — mono for easy scanning */}
                  <span className="text-[10px] font-mono text-muted truncate pr-2" title={row.batchNo}>
                    {row.batchNo ?? (
                      <span className="text-muted/30 italic">no batch</span>
                    )}
                  </span>

                  {/* Expiry date */}
                  <span className="text-[10px] text-muted/80 tabular-nums">
                    {fmt(row.expiryDate)}
                  </span>

                  {/* Manufacturing date */}
                  <span className="text-[10px] text-muted/60 tabular-nums">
                    {fmt(row.mfgDate)}
                  </span>

                  {/* Warehouse — truncated with title tooltip for long names */}
                  <span
                    className="text-[10px] text-muted/70 truncate pr-2"
                    title={row.warehouse}
                  >
                    {row.warehouse ?? (
                      <span className="text-muted/30 italic">—</span>
                    )}
                  </span>

                  {/* Qty badge — green for available, red for zero, dash for non-batched */}
                  <span
                    className={`
                      text-[9.5px] font-bold px-1.5 py-0.5 rounded text-center tabular-nums
                      ${row.hasBatch
                        ? qtyOk
                          ? "text-emerald-400 bg-emerald-400/10"
                          : "text-red-400/60 bg-red-400/8"
                        : "text-muted/50 bg-theme/30"
                      }
                    `}
                  >
                    {row.hasBatch ? (row.qty ?? 0) : "—"}
                  </span>
                </li>
              );
            })}

            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-[11px] text-muted/60">
                No items match your search
              </li>
            )}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}