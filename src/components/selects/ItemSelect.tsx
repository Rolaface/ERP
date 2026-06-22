import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getAllItems } from "../../api/itemApi";

export interface SelectedStockItem {
  id: string;
  itemCode: string;
  itemName: string;
  description?: string;
  packingSize?: string;
  packingUnit?: string;
  batchNo?: string;
  mfgDate?: string;
  expiryDate?: string;
  qty?: number;
  price?: number;
  warehouse?: string;
  isServiceItem?: boolean;
  vatRate?: number;
  vatCode?: string;
  taxInfo?: any[];
  barcode?: string;
}

interface ItemSelectProps {
  taxCategory?: string | undefined;
  value?: string;
  excludeItemCodes?: string[];
  onChange: (item: SelectedStockItem) => void;
  onAddNew?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function ItemSelect({
  taxCategory = "",
  value = "",
  excludeItemCodes = [],
  onChange,
  onAddNew,
  className = "",
  disabled = false,
}: ItemSelectProps) {
  const [items, setItems] = useState<SelectedStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const res = await getAllItems(
          1,
          1000,
          taxCategory ? { taxCategory } : undefined,
        );

        if (!cancelled && res?.status_code === 200) {
          const rawList = Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data)
              ? res.data
              : [];

          setItems(
            rawList.map((it: any) => ({
              id: it.id,
              itemCode: it.id, // Maps correctly to the expected itemCode structure
              itemName: it.itemName,
              description: it.description,
              packingSize: it.packingSize,
              packingUnit: it.packingUnit,
              batchNo: it.batchNo,
              mfgDate: it.mfgDate,
              expiryDate: it.expiryDate,
              qty: it.qty,
              price: it.price ?? it.sellingPrice ?? 0,
              warehouse: it.warehouse,
              isServiceItem: it.isServiceItem,
              vatRate: it.vatRate,
              vatCode: it.vatCode,
              taxInfo: it.taxInfo,
              barcode: it.barcode,
            })),
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load items", err);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [taxCategory]);

  useEffect(() => {
    if (!value) {
      setSearch("");
    }
    setOpen(false);
  }, [taxCategory, value]);

  useEffect(() => {
    if (!value) {
      setSearch("");
      return;
    }

    const match = items.find((it) => it.itemCode === value);
    if (match) setSearch(match.itemName);
  }, [value, items]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        inputRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const exclude = new Set(
    (excludeItemCodes ?? []).map((c) => String(c ?? "").trim()).filter(Boolean),
  );

  const filtered = items
    .filter((it) => !exclude.has(String(it.itemCode ?? "").trim()))
    .filter((it) => it.itemName.toLowerCase().includes(search.toLowerCase()));

  const openDropdown = () => {
    if (!inputRef.current || disabled) return;

    setRect(inputRef.current.getBoundingClientRect());
    setOpen(true);
  };

return (
    <div className={`w-full ${className}`}>
      <input
        ref={inputRef}
        className="w-full h-[26px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder={loading ? "Loading items..." : "Search item"}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          openDropdown();
        }}
        onFocus={openDropdown}
        disabled={disabled}
      />

      {open &&
        rect &&
        !loading &&
        createPortal(
          (() => {
            // Expand width to accommodate the table layout
            const dropdownWidth = Math.max(rect.width, 850); 
            const maxLeft = Math.max(8, window.innerWidth - dropdownWidth - 8);
            const left = Math.min(rect.left, maxLeft);

            return (
              <div
                ref={dropdownRef}
                style={{
                  position: "fixed",
                  top: rect.bottom + 4, // slight offset
                  left,
                  width: dropdownWidth,
                  zIndex: 9999,
                }}
                className="bg-card border border-theme rounded shadow-lg overflow-hidden"
              >
                <div className="max-h-64 overflow-x-auto overflow-y-auto">
                  <table className="w-full min-w-[760px] border-collapse text-[10px] leading-tight">
                    <thead className="sticky top-0 bg-card z-10 shadow-sm">
                      <InvoiceHeaders />
                    </thead>
                    <tbody>
                      {filtered.map((it, idx) => (
                        <tr
                          key={it.id}
                          onClick={() => {
                            setSearch(it.itemName);
                            setOpen(false);
                            onChange(it);
                          }}
                          className="cursor-pointer border-b border-theme hover:bg-row-hover bg-card transition-colors"
                        >
                          <td className="px-2 py-2 text-center">{idx + 1}</td>
                          
                          {/* Item Name & Code */}
                          <td className="px-2 py-2">
                            <div className="font-medium text-main whitespace-normal break-words">
                              {it.itemName}
                            </div>
                            <div className="text-[9px] text-muted">
                              {it.itemCode}
                            </div>
                          </td>
                          
                          {/* Pkg (U×S) */}
                          <td className="px-2 py-2">
                            {it.packingUnit || "-"}×{it.packingSize || "-"}
                          </td>
                          
                          {/* Box (N/A for selection) */}
                          <td className="px-2 py-2 text-muted">-</td>
                          
                          {/* Batch No */}
                          <td className="px-2 py-2">{it.batchNo || "-"}</td>
                          
                          {/* Qty (Stock) */}
                          <td className="px-2 py-2 font-medium">
                            {it.qty ?? 0}
                          </td>
                          
                          {/* Mfg Date */}
                          <td className="px-2 py-2">{it.mfgDate || "-"}</td>
                          
                          {/* Expiry Date */}
                          <td className="px-2 py-2">{it.expiryDate || "-"}</td>
                          
                          {/* Warehouse */}
                          <td className="px-2 py-2">{it.warehouse || "-"}</td>
                          
                          {/* Unit Price */}
                          <td className="px-2 py-2 text-primary font-medium">
                            {it.price?.toFixed(2) || "0.00"}
                          </td>
                          
                          {/* Dis(%) (N/A for selection) */}
                          <td className="px-2 py-2 text-muted">-</td>
                          
                          {/* Tax(%) */}
                          <td className="px-2 py-2">{it.vatRate ?? "-"}</td>
                          
                          {/* Tax Name */}
                          <td className="px-2 py-2">{it.vatCode || "-"}</td>
                          
                          {/* Barcode */}
                          <td className="px-2 py-2">{it.barcode || "-"}</td>
                          
                          {/* Amount (N/A for selection) */}
                          <td className="px-2 py-2 text-muted">-</td>
                          
                          {/* Action Col matching the empty <th> */}
                          <td className="px-2 py-2 text-center text-primary font-semibold">
                            Select
                          </td>
                        </tr>
                      ))}
                      
                      {/* Empty State / Add New */}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={16} className="px-4 py-8 text-center">
                            <p className="text-muted mb-3 text-sm">
                              No items found
                            </p>
                            {onAddNew && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpen(false);
                                  onAddNew();
                                }}
                                className="px-4 py-1.5 bg-primary text-white rounded text-xs font-medium hover:bg-[var(--primary-600)] transition-colors"
                              >
                                + Add Item
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })(),
          document.body,
        )}
    </div>
  );
}