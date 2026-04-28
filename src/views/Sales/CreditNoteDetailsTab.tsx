/**
 * CreditNoteDetailsTab.tsx
 *
 * "Details" tab for the Credit Note modal.
 * Pure presentational — receives all state + handlers as props from useCreditNoteForm.
 * No local API calls, no business logic.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Search, Trash2, User } from "lucide-react";
import type {
  CreditNoteFormState,
  CreditNoteItem,
  InvoiceOption,
} from "../../hooks/useCreditNoteForm";
import WarehouseSelect from "../../components/selects/WarehouseSelect";

// ─── Invoice Search Select ────────────────────────────────────────────────────

interface InvoiceSearchSelectProps {
  value: string;
  fetchOptions: (q: string) => Promise<InvoiceOption[]>;
  onChange: (opt: InvoiceOption) => void;
  /** true while full invoice details are being fetched after selection */
  detailsLoading: boolean;
}

const InvoiceSearchSelect: React.FC<InvoiceSearchSelectProps> = ({
  value,
  fetchOptions,
  onChange,
  detailsLoading,
}) => {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<InvoiceOption[]>([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doFetch = useCallback(
    async (q: string) => {
      setFetching(true);
      try {
        const result = await fetchOptions(q);
        setOptions(result);
      } finally {
        setFetching(false);
      }
    },
    [fetchOptions],
  );

  // Debounced fetch on query change
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, doFetch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    if (!options.length) doFetch("");
  };

  const handleSelect = (opt: InvoiceOption) => {
    setQuery(opt.label);
    setOpen(false);
    onChange(opt);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label className="text-[11px] font-medium text-muted">
        Invoice Number <span className="text-red-500">*</span>
      </label>

      <div
        className="flex items-center gap-1.5 border border-theme rounded px-2 py-1 bg-card cursor-text"
        onClick={handleOpen}
      >
        <Search className="w-3 h-3 text-muted shrink-0" />
        <input
          className="flex-1 bg-transparent text-[11px] text-main outline-none placeholder:text-muted min-w-0"
          placeholder={value || "Search invoice…"}
          value={open ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={handleOpen}
        />
        <ChevronDown className="w-3 h-3 text-muted shrink-0" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-card border border-theme rounded shadow-lg max-h-48 overflow-y-auto">
          {fetching ? (
            <div className="px-3 py-2 text-[11px] text-muted">Loading…</div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-muted">No invoices found</div>
          ) : (
            options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt)}
                className={`px-3 py-2 text-[11px] cursor-pointer hover:bg-primary/10 transition-colors ${opt.value === value
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-main"
                  }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="ml-2 text-muted">{opt.customerName}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Inline loading hint after selection */}
      {detailsLoading && (
        <span className="flex items-center gap-1.5 text-[10px] text-muted mt-0.5">
          <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary inline-block" />
          Fetching invoice data…
        </span>
      )}
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CreditNoteDetailsTabProps {
  form: CreditNoteFormState;
  invoiceLoading: boolean;
  grandTotal: number;
  fetchInvoiceOptions: (q: string) => Promise<InvoiceOption[]>;
  onInvoiceSelect: (opt: InvoiceOption) => Promise<void>;
  onItemChange: (index: number, field: keyof CreditNoteItem, value: string | number) => void;
  onWarehouseDefault: (index: number, warehouse: string) => void;
  onRemoveItem: (index: number) => void;
  onToggleUpdateStock: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CreditNoteDetailsTab: React.FC<CreditNoteDetailsTabProps> = ({
  form,
  invoiceLoading,
  grandTotal,
  fetchInvoiceOptions,
  onInvoiceSelect,
  onItemChange,
  onWarehouseDefault,
  onRemoveItem,
  onToggleUpdateStock,
}) => {
  return (
    <div className="flex flex-col gap-5 px-8 py-5">

      {/* ── Top controls row ── */}
      <div className="grid grid-cols-3 gap-4 items-end">
        <InvoiceSearchSelect
          value={form.return_against}
          fetchOptions={fetchInvoiceOptions}
          onChange={onInvoiceSelect}
          detailsLoading={invoiceLoading}
        />

        {/* Update stock toggle */}
        <label className="flex items-center gap-2 pb-1">
          <input
            type="checkbox"
            name="updateStock"
            checked={form.update_stock ?? true}
            onChange={onToggleUpdateStock}
            className="w-3.5 h-3.5 accent-primary"
          />
          <span className="text-xs text-main whitespace-nowrap">
            Update Stock
          </span>
        </label>
      </div>

      {/* ── Main grid: items + sidebar ── */}
      <div className="grid grid-cols-[1fr_220px] gap-4 items-start">

        {/* Items table */}
        <div className="bg-card rounded-lg p-3 shadow-sm">
          <h3 className="text-[12px] font-semibold text-main mb-3">Return Items</h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-theme">
                    <th className="px-2 py-2 text-left text-muted font-medium w-6">#</th>
                    <th className="px-2 py-2 text-left text-muted font-medium min-w-[130px]">Item</th>
                    <th className="px-2 py-2 text-left text-muted font-medium w-[80px]">Qty (–)</th>
                    <th className="px-2 py-2 text-left text-muted font-medium w-[80px]">Rate</th>
                    <th className="px-2 py-2 text-left text-muted font-medium w-[110px]">Batch No.</th>
                    <th className="px-2 py-2 text-left text-muted font-medium min-w-[150px]">
                      Warehouse <span className="text-red-500">*</span>
                    </th>
                    <th className="px-2 py-2 text-right text-muted font-medium w-[80px]">Amount</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((it, idx) => {
                    const amount = Math.abs(it.qty) * it.rate;
                    return (
                      <tr
                        key={idx}
                        className="border-b border-theme hover:bg-primary/5 transition-colors"
                      >
                        <td className="px-2 py-1.5 text-center text-muted">{idx + 1}</td>

                        {/* Item — read-only */}
                        <td className="px-2 py-1.5">
                          <div className="text-[11px] text-main font-medium leading-tight">
                            {it.item_name}
                          </div>
                          <div className="text-[10px] text-muted">{it.item_code}</div>
                        </td>

                        {/* Qty — user adjusts magnitude, must stay ≤ 0 */}
                        <td className="px-1 py-1">
                          <input
                            type="number"
                            max={0}
                            value={it.qty}
                            onChange={(e) =>
                              onItemChange(idx, "qty", Number(e.target.value))
                            }
                            className="w-full py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>

                        {/* Rate — read-only from invoice */}
                        <td className="px-1 py-1">
                          <input
                            type="number"
                            value={it.rate}
                            disabled
                            className="w-full py-1 px-2 border border-theme rounded text-[11px] bg-app text-muted cursor-not-allowed"
                          />
                        </td>

                        {/* Batch no — auto from invoice, editable override */}
                        <td className="px-1 py-1">
                          <input
                            type="text"
                            value={it.batch_no}
                            placeholder="Auto / N/A"
                            onChange={(e) =>
                              onItemChange(idx, "batch_no", e.target.value)
                            }
                            className="w-full py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>

                        {/* Warehouse */}
                        <td className="px-1 py-1">
                          <WarehouseSelect
                            compact
                            name={`warehouse_${idx}`}
                            value={it.warehouse}
                            required
                            onChange={(e) =>
                              onItemChange(idx, "warehouse", e.target.value)
                            }
                            onDefaultLoad={(wh) => onWarehouseDefault(idx, wh)}
                          />
                        </td>

                        {/* Amount */}
                        <td className="px-2 py-1.5 text-right font-semibold text-main whitespace-nowrap">
                          {amount.toFixed(2)}
                        </td>

                        {/* Remove */}
                        <td className="px-1 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => onRemoveItem(idx)}
                            title="Remove item"
                            className="p-1 rounded bg-danger/10 text-danger hover:bg-danger/20 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-4 sticky top-0">

          {/* Customer card */}
          <div className="bg-card rounded-lg p-3 shadow-sm">
            <h3 className="text-[12px] font-semibold text-main mb-2">Customer</h3>
            {form.customer ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <User size={12} className="text-muted shrink-0" />
                  <span className="text-[11px] text-main font-medium">
                    {form.customer.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-app px-1.5 py-0.5 rounded text-muted w-fit">
                  {form.customer.id}
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-muted italic">
                Auto-filled on invoice selection
              </p>
            )}
          </div>

          {/* Summary card */}
          <div className="bg-card rounded-lg p-3 shadow-sm">
            <h3 className="text-[12px] font-semibold text-main mb-2">Summary</h3>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Items</span>
                <span className="text-main font-medium">{form.items.length}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Total Qty</span>
                <span className="text-main font-medium">
                  {form.items.reduce((s, it) => s + Math.abs(it.qty), 0)}
                </span>
              </div>
              <div className="mt-1.5 p-2 bg-primary rounded-lg flex justify-between items-center">
                <span className="text-white text-[11px] font-semibold">Credit Total</span>
                <span className="text-white text-[12px] font-bold">
                  {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};