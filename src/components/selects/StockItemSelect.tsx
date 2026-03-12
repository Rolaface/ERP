import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { getStockReport } from "../../api/stockApi";
import { Search, Package, ChevronDown, X } from "lucide-react";
import { showApiError } from "../../utils/alert";
import { getItemByItemCode } from "../../api/itemApi";

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
}

/** Flat row shown in the dropdown */
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
}

interface StockItemSelectProps {
  value?: string;      // itemCode
  batchNo?: string;    // to restore exact row after tab switch
  itemName?: string;   // fallback display label
  onChange: (item: StockItem) => void;
  onClear?: () => void;
  className?: string;
  disabled?: boolean;
}

function fmt(date?: string) {
  if (!date) return "—";
  // "2026-05-02" → "02 May 26"
  const [y, m, d] = date.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d} ${months[parseInt(m) - 1]} ${y.slice(2)}`;
}

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
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FlatRow | null>(null);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Load & flatten ── */
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
            itemCode: item.item_code,
            itemName: item.item_name,
            description: item.description,
            packingSize: String(item.packingSize ?? ""),
            packingUnit: String(item.packingUnit ?? ""),
          };

          if (Array.isArray(item.batches) && item.batches.length > 0) {
            item.batches.forEach((b: any) => {
              rows.push({
                ...base,
                batchNo: b.batch_no,
                expiryDate: b.expiry_date,
                mfgDate: b.manufacturing_date,
                qty: b.bal_qty,
                valuation_rate: b.valuation_rate,
                sellingPrice: b.sell_value,
                purchasePrice: b.buy_value,
                taxCategory: b.taxCategory,
                taxRate: b.taxRate,
                taxAmount: b.taxamount,
                hasBatch: true,
              });
            });
          } else {
            rows.push({
              ...base,
              valuation_rate: item.valuation_rate,
              sellingPrice: item.sell_value,
              purchasePrice: item.buy_value,
              taxCategory: item.taxCategory,
              taxRate: item.taxRate,
              taxAmount: item.taxamount,
              hasBatch: false,
            });
          }
        });

        // Remove zero-qty batch rows
        const filtered = rows.filter((r) => !r.hasBatch || (r.qty ?? 0) > 0);

        // Sort: group by item, within each item sort by earliest expiry first
        filtered.sort((a, b) => {
          // First sort by item name so same items are grouped
          const nameCompare = a.itemName.localeCompare(b.itemName);
          if (nameCompare !== 0) return nameCompare;
          // Within same item, earliest expiry first
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });

        // Replace rows reference for setState
        rows.length = 0;
        filtered.forEach((r) => rows.push(r));

        if (!cancelled) setFlatRows([...rows]);
      } catch (err) {
        showApiError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Close on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || dropdownRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Restore selected from value+batchNo after tab remount ── */
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    if (flatRows.length === 0) return;
    if (selected?.itemCode === value && selected?.batchNo === (batchNo ?? selected?.batchNo)) return;
    const match =
      flatRows.find((r) => r.itemCode === value && (batchNo ? r.batchNo === batchNo : true)) ??
      flatRows.find((r) => r.itemCode === value) ??
      null;
    setSelected(match);
  }, [value, batchNo, flatRows]);

  /* ── Filtered rows ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return flatRows;
    return flatRows.filter(
      (r) =>
        r.itemName.toLowerCase().includes(q) ||
        r.itemCode.toLowerCase().includes(q) ||
        (r.batchNo ?? "").toLowerCase().includes(q)
    );
  }, [flatRows, search]);

  /* ── Open dropdown ── */
  const openDropdown = () => {
    if (disabled) return;
    if (triggerRef.current) setDropRect(triggerRef.current.getBoundingClientRect());
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  /* ── Select a row ── */
  const handleSelect = async (row: FlatRow) => {
    setSelected(row);
    setOpen(false);
    setSearch("");

    // Step 1: fire immediately with stock data
    onChange({
      id: row.itemCode,
      itemCode: row.itemCode,
      itemName: row.itemName,
      description: row.description,
      packingSize: row.packingSize,
      packingUnit: row.packingUnit,
      batchNo: row.batchNo,
      expiryDate: row.expiryDate,
      mfgDate: row.mfgDate,
      qty: row.qty,
      valuation_rate: row.valuation_rate,
      sellingPrice: row.sellingPrice,
      purchasePrice: row.purchasePrice,
      taxCategory: row.taxCategory,
      taxRate: row.taxRate,
      taxAmount: row.taxAmount,
    });

    // Step 2: fetch tax code + rate from item master
    try {
      const res = await getItemByItemCode(row.itemCode);
      const item = res?.data;
      if (item?.taxInfo) {
        onChange({
          id: row.itemCode,
          itemCode: row.itemCode,
          itemName: row.itemName,
          description: row.description,
          packingSize: row.packingSize,
          packingUnit: row.packingUnit,
          batchNo: row.batchNo,
          expiryDate: row.expiryDate,
          mfgDate: row.mfgDate,
          qty: row.qty,
          valuation_rate: row.valuation_rate,
          sellingPrice: row.sellingPrice,
          purchasePrice: row.purchasePrice,
          taxCategory: row.taxCategory,
          taxCode: item.taxInfo.taxCode,
          taxRate: Number(item.taxInfo.taxPerct),
          taxAmount: row.taxAmount,
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

  /* ── Dropdown position ── */
  const dropStyle = (() => {
    if (!dropRect) return {};
    const w = Math.max(dropRect.width, 580);
    const left = Math.min(dropRect.left, Math.max(8, window.innerWidth - w - 8));
    const spaceBelow = window.innerHeight - dropRect.bottom - 8;
    const maxH = Math.min(spaceBelow, 320);
    return { position: "fixed" as const, top: dropRect.bottom + 3, left, width: w, zIndex: 9999, maxHeight: maxH };
  })();

  return (
    <div className={`w-full ${className}`}>
      {/* ── Trigger ── */}
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
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="truncate font-medium"
              title={selected?.itemName ?? itemName}
            >
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
          <ChevronDown className={`w-3 h-3 text-muted/40 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* ── Dropdown portal ── */}
      {open && dropRect &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropStyle}
            className="bg-card border border-theme rounded-lg shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Search bar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-theme bg-app">
              <Search className="w-3 h-3 text-muted/50 shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by item name, code or batch…"
                className="flex-1 bg-transparent text-[11px] text-main placeholder:text-muted/40 outline-none"
              />
              <span className="text-[9px] text-muted/40 shrink-0">{filtered.length} rows</span>
            </div>

            {/* Column headers */}
            <div className="grid gap-2 px-3 py-1.5 border-b border-theme/40 bg-app/60"
              style={{ gridTemplateColumns: "2fr 1fr 90px 90px 52px" }}>
              {["Item Name", "Batch No", "Expiry", "Manufacture", "Qty"].map((h) => (
                <span key={h} className="text-[8.5px] font-semibold uppercase tracking-wider text-muted/50">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <ul className="overflow-y-auto flex-1 divide-y divide-theme/20">
              {filtered.map((row, i) => {
                const isSelected =
                  selected?.itemCode === row.itemCode && selected?.batchNo === row.batchNo;
                const qtyOk = (row.qty ?? 0) > 0;

                return (
                  <li
                    key={i}
                    onClick={() => handleSelect(row)}
                    className={`
                      grid gap-2 items-center px-3 py-[7px] cursor-pointer transition-colors
                      ${isSelected
                        ? "bg-primary/8 border-l-[3px] border-primary"
                        : "hover:bg-row-hover border-l-[3px] border-transparent"
                      }
                    `}
                    style={{ gridTemplateColumns: "2fr 1fr 90px 90px 52px" }}
                  >
                    {/* Item name */}
                    <div className="min-w-0">
                      <p className={`text-[11px] font-medium truncate leading-tight ${isSelected ? "text-primary" : "text-main"}`}>
                        {row.itemName}
                      </p>
                      <p className="text-[9px] text-muted/50 font-mono leading-tight truncate">{row.itemCode}</p>
                    </div>

                    {/* Batch no */}
                    <span className="text-[10px] font-mono text-muted truncate">
                      {row.batchNo ?? <span className="text-muted/30 italic">no batch</span>}
                    </span>

                    {/* Expiry */}
                    <span className="text-[10px] text-muted/80 tabular-nums">
                      {fmt(row.expiryDate)}
                    </span>

                    {/* Manufacture */}
                    <span className="text-[10px] text-muted/60 tabular-nums">
                      {fmt(row.mfgDate)}
                    </span>

                    {/* Qty */}
                    <span className={`
                      text-[9.5px] font-bold px-1.5 py-0.5 rounded text-center tabular-nums
                      ${row.hasBatch
                        ? qtyOk
                          ? "text-emerald-400 bg-emerald-400/10"
                          : "text-red-400/60 bg-red-400/8"
                        : "text-muted/50 bg-theme/30"
                      }
                    `}>
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
          document.body
        )
      }
    </div>
  );
}