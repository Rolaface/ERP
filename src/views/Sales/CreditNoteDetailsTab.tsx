import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Search, Trash2, User } from "lucide-react";
import type {
  CreditNoteFormState,
  CreditNoteItem,
  InvoiceOption,
} from "../../hooks/useCreditNoteForm";
import WarehouseSelect from "../../components/selects/WarehouseSelect";
import ItemTable from "../../components/common/ItemTable";

// ─── Invoice Search Select ────────────────────────────────────────────────────

interface InvoiceSearchSelectProps {
  value: string;
  fetchOptions: (q: string) => Promise<InvoiceOption[]>;
  onChange: (opt: InvoiceOption) => void;
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

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, doFetch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
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

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-card border border-theme rounded shadow-lg max-h-48 overflow-y-auto">
          {fetching ? (
            <div className="px-3 py-2 text-[11px] text-muted">Loading…</div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-muted">
              No invoices found
            </div>
          ) : (
            options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt)}
                className={`px-3 py-2 text-[11px] cursor-pointer hover:bg-primary/10 transition-colors ${
                  opt.value === value
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
  onItemChange: (
    index: number,
    field: keyof CreditNoteItem,
    value: string | number,
  ) => void;
  onWarehouseDefault: (index: number, warehouse: string) => void;
  onRemoveItem: (index: number) => void;
  onToggleUpdateStock: () => void;
}

// ─── Credit Note column headers ───────────────────────────────────────────────

const CreditNoteHeaders: React.FC = () => (
  <tr className="border-b border-theme">
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[25px]">
      #
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] min-w-[150px]">
      Item
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[80px]">
      Qty
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[80px]">
      Rate
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[120px]">
      Batch No.
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] min-w-[160px]">
      Warehouse
    </th>
    <th className="px-2 py-1 text-right text-muted font-medium text-[11px] w-[80px]">
      Amount
    </th>
    <th className="w-8" />
  </tr>
);


const EMPTY_ITEM: CreditNoteItem = {
  item_code: "",
  item_name: "",
  qty: 0,
  rate: 0,
  batch_no: "",
  warehouse: "",
};

const PLACEHOLDER_COUNT = 1; 

// ─── Component ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

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
  const [page, setPage] = useState(0);

  // Reset page when invoice changes
  useEffect(() => {
    setPage(0);
  }, [form.return_against]);

  const noInvoice = !form.return_against;
  const showPlaceholders = noInvoice || invoiceLoading;

  const displayItems: CreditNoteItem[] = showPlaceholders
    ? Array.from({ length: PLACEHOLDER_COUNT }, () => ({ ...EMPTY_ITEM }))
    : form.items;

  const itemCount = displayItems.length;
  const paginatedItems = displayItems.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  // ── ItemTable shim ─────────────────────────────────────────────────────────

  const ui = { page, setPage, itemCount };

  const actions = {
    addItem: () => {},         
    duplicateItem: () => {},   
    removeItem: onRemoveItem,
    handleItemChange: (
      index: number,
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value } = e.target;
      onItemChange(index, name as keyof CreditNoteItem, value);
    },
    updateItemDirectly: undefined,
  };

  const formData = { items: displayItems };

  // ── renderRow ──────────────────────────────────────────────────────────────

  const renderRow = (
    it: CreditNoteItem,
    absoluteIndex: number,
    helpers: {
      handleCopyRow: (i: number) => void;
      handleRemoveRow: (i: number) => void;
    },
  ) => {
    const isPlaceholder = showPlaceholders;
    const isPulsing = invoiceLoading;
    const amount = Math.abs(it.qty) * it.rate;

    const inputCls = `w-full py-1 px-2 border border-theme rounded text-[11px] bg-card text-main
      focus:outline-none focus:ring-1 focus:ring-primary no-spinner
      ${isPulsing ? "animate-pulse opacity-60" : ""}
      ${isPlaceholder ? "cursor-default" : ""}`;

    return (
      <tr
        key={`row-${absoluteIndex}`}
        className={`border-b border-theme ${!isPlaceholder ? "hover:bg-primary/5" : ""} transition-colors`}
      >
        {/* # */}
        <td className="px-2 py-1 text-center text-[10px] text-muted">
          {absoluteIndex + 1}
        </td>

        {/* Item name + code */}
        <td className="px-2 py-1">
          {isPlaceholder ? (
            // Mimic the two-line item display with shimmer bars
            <>
              <div
                className={`h-3.5 w-28 bg-app rounded ${isPulsing ? "animate-pulse bg-primary/10" : ""}`}
              />
              <div
                className={`h-2.5 w-20 bg-app rounded mt-1 ${isPulsing ? "animate-pulse bg-primary/10" : ""}`}
              />
            </>
          ) : (
            <>
              <div className="text-[11px] font-medium text-main leading-tight">
                {it.item_name || it.item_code}
              </div>
              <div className="text-[10px] text-muted font-mono">
                {it.item_code}
              </div>
            </>
          )}
        </td>

        {/* Qty */}
        <td className="px-1 py-1">
          <input
            type="number"
            name="qty"
            value={isPlaceholder ? "" : Math.abs(it.qty)}
            disabled={isPlaceholder}
            className={inputCls}
            onChange={(e) => {
              if (isPlaceholder) return;
              const val = Number(e.target.value);
              onItemChange(absoluteIndex, "qty", val > 0 ? -val : val);
            }}
          />
        </td>

        {/* Rate */}
        <td className="px-1 py-1">
          <input
            type="number"
            name="rate"
            value={isPlaceholder ? "" : it.rate}
            disabled={isPlaceholder}
            className={inputCls}
            onChange={(e) => {
              if (isPlaceholder) return;
              onItemChange(absoluteIndex, "rate", Number(e.target.value));
            }}
          />
        </td>

        {/* Batch No */}
        <td className="px-1 py-1">
          <input
            type="text"
            name="batch_no"
            value={isPlaceholder ? "" : it.batch_no}
            placeholder="Auto / N/A"
            disabled={isPlaceholder}
            className={inputCls}
            onChange={(e) => {
              if (isPlaceholder) return;
              onItemChange(absoluteIndex, "batch_no", e.target.value);
            }}
          />
        </td>

        {/* Warehouse */}
        <td className="px-1 py-1">
          {isPlaceholder ? (
            // Mimic WarehouseSelect appearance
            <div
              className={`flex items-center justify-between w-full py-1 px-2 border border-theme rounded text-[11px] bg-card text-muted
                ${isPulsing ? "animate-pulse opacity-60" : ""}`}
            >
              <span className="text-muted/30 text-[11px] select-none">
                &nbsp;
              </span>
              <svg
                className="w-3 h-3 text-muted/30 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ) : (
            <WarehouseSelect
              compact
              value={it.warehouse || ""}
              onChange={(
                e: React.ChangeEvent<HTMLSelectElement> | string,
              ) => {
                const val =
                  typeof e === "string"
                    ? e
                    : (e as React.ChangeEvent<HTMLSelectElement>).target
                        ?.value ?? e;
                onItemChange(absoluteIndex, "warehouse", val as string);
              }}
              onDefaultLoad={(firstWarehouse: string) => {
                onWarehouseDefault(absoluteIndex, firstWarehouse);
              }}
            />
          )}
        </td>

        {/* Amount */}
        <td className="px-2 py-1 text-right text-[11px] font-medium text-main whitespace-nowrap">
          {isPlaceholder ? (
            <span className="text-muted">—</span>
          ) : (
            amount.toFixed(2)
          )}
        </td>

        {/* Delete */}
        <td className="px-1 py-1">
          {!isPlaceholder && (
            <button
              type="button"
              onClick={() => helpers.handleRemoveRow(absoluteIndex)}
              className="p-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition"
              title="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </td>
      </tr>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

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

      {/* ── Main grid: ItemTable + sidebar ── */}
      <div className="grid grid-cols-[1fr_220px] gap-4 items-start">

        <ItemTable
          title="Return Items"
          paginatedItems={paginatedItems}
          formData={formData}
          ui={ui}
          actions={actions}
          symbol=""
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          columnHeaders={<CreditNoteHeaders />}
          renderRow={renderRow}
        />

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-4 sticky top-0">

          {/* Customer card */}
          <div className="bg-card rounded-lg p-3 shadow-sm">
            <h3 className="text-[12px] font-semibold text-main mb-2">
              Customer
            </h3>
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
            <h3 className="text-[12px] font-semibold text-main mb-2">
              Summary
            </h3>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Items</span>
                <span className="text-main font-medium">
                  {form.items.length}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Total Qty</span>
                <span className="text-main font-medium">
                  {form.items.reduce((s, it) => s + Math.abs(it.qty), 0)}
                </span>
              </div>
              <div className="mt-1.5 p-2 bg-primary rounded-lg flex justify-between items-center">
                <span className="text-white text-[11px] font-semibold">
                  Credit Total
                </span>
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