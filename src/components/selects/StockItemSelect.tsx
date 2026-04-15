import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { getStockReport } from "../../api/stockApi";
import { Search, Package, ChevronDown, X } from "lucide-react";
import { showApiError } from "../../utils/alert";

function fmt(date?: string) {
  if (!date) return "-";
  const [y, m, d] = date.split("-");
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
  return `${d} ${months[parseInt(m) - 1]}`;
}

export default function StockItemSelect({
  value = "",
  batchNo,
  itemName,
  onChange,
  onClonChanear,
  taxCategory,
  disabled = false,
}: any) {
  const [flatRows, setFlatRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);

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
        const base = {
          itemCode: item.item_code,
          itemName: item.item_name,
          description: item.description,
          packingSize: item.packingSize,
          packingUnit: item.packingUnit,
          taxInfo: item.taxInfo || [],
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

  const handleSelect = (row: any) => {
    setSelected(row);
    setOpen(false);
    setSearch("");

    const selectedTax = row.taxInfo?.[0] || {};

    const totalTaxRate = Number(selectedTax.totalTaxRate || 0);

    onChange({
      itemCode: row.itemCode,
      itemName: row.itemName,
      description: row.description,
      batchNo: row.batchNo,
      expiryDate: row.expiryDate,
      mfgDate: row.mfgDate,
      qty: row.qty,
      packingSize: row.packingSize,
      packingUnit: row.packingUnit,
      valuation_rate: row.valuation_rate,
      sellingPrice: row.sellingPrice,
      purchasePrice: row.purchasePrice,
      warehouse: row.warehouse,

      vatRate: totalTaxRate,
      vatCode: selectedTax.taxName || "",
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return flatRows.filter(
      (r) =>
        r.itemName?.toLowerCase().includes(q) ||
        r.itemCode?.toLowerCase().includes(q) ||
        (r.batchNo || "").toLowerCase().includes(q),
    );
  }, [flatRows, search]);

  return (
    <div className="w-full">
      {/* TRIGGER */}
      <div
        ref={triggerRef}
        onClick={async () => {
          if (disabled) return;

          setDropRect(triggerRef.current?.getBoundingClientRect() || null);

          await load();

          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={`flex items-center gap-2 px-2 py-1 border border-theme rounded bg-card text-main text-[11px] cursor-pointer ${
          disabled ? "opacity-50" : "hover:border-primary"
        }`}
      >
        <Package className="w-3 h-3 text-muted" />
        <span className="flex-1 truncate">
          {selected?.itemCode ||
            itemName ||
            (loading ? "Loading..." : "Select item")}
        </span>

        {(selected || value) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelected(null);
              onClear?.();
            }}
          >
            <X className="w-3 h-3 text-muted hover:text-danger" />
          </button>
        )}

        <ChevronDown className="w-3 h-3 text-muted" />
      </div>

      {/* DROPDOWN */}
      {open &&
        dropRect &&
        createPortal(
          <div
            ref={dropdownRef}
            className="bg-card border border-theme rounded shadow-lg flex flex-col"
            style={{
              position: "fixed",
              top: dropRect.bottom + 4,
              left: dropRect.left,
              width: 700,
              zIndex: 9999,
            }}
          >
            {/* HEADER */}
            <div className="grid grid-cols-6 gap-3 px-3 py-2 text-[10px] font-semibold text-muted border-b border-theme bg-app">
              <div>Item Code</div>
              <div>Batch</div>
              <div>MFG</div>
              <div>EXP</div>
              <div>Warehouse</div>
              <div className="text-right">Stock</div>
            </div>

            {/* SEARCH */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-theme">
              <Search className="w-3 h-3 text-muted" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-main text-[11px] outline-none"
              />
            </div>

            {/* LIST */}
            <div className="max-h-60 overflow-y-auto">
              {filtered.map((row, i) => (
                <div
                  key={i}
                  onClick={() => handleSelect(row)}
                  className="grid grid-cols-6 gap-3 px-3 py-2 text-[11px] cursor-pointer row-hover border-b border-theme last:border-none"
                >
                  <div className="font-medium">{row.itemCode}</div>
                  <div>{row.batchNo || "-"}</div>
                  <div>{fmt(row.mfgDate)}</div>
                  <div>{fmt(row.expiryDate)}</div>
                  <div className="truncate">{row.warehouse || "-"}</div>
                  <div className="text-right font-medium text-success">
                    {row.qty ?? 0}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="p-3 text-center text-muted text-[11px]">
                  No items found
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
