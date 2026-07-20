import React, { useEffect, useState } from "react";
import { Trash2, User } from "lucide-react";
import type {
  SalesDebitNoteFormState,
  SalesDebitNoteItem,
  InvoiceOption,
} from "../../hooks/useSalesDebitNoteForm";
import WarehouseSelect from "../../components/selects/WarehouseSelect";
import ItemTable from "../../components/common/ItemTable";
import { NumericInput } from "../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../components/ui/modal/SearchSelect2";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SalesDebitNoteDetailsTabProps {
  form: SalesDebitNoteFormState;
  invoiceLoading: boolean;
  grandTotal: number;
  fetchInvoiceOptions: (q: string) => Promise<InvoiceOption[]>;
  onInvoiceSelect: (opt: InvoiceOption) => Promise<void>;
  onItemChange: (
    index: number,
    field: keyof SalesDebitNoteItem,
    value: string | number | null,
  ) => void;
  onWarehouseDefault: (index: number, warehouse: string) => void;
  onRemoveItem: (index: number) => void;
  reasonOptions: { code: string; reason: string }[];      
  reasonsLoading: boolean;             
  onReasonChange: (reason: string, code: string) => void;  
  fetchReasonOptions: (q: string) => Promise<{ code: string; reason: string }[]>;
  onDescriptionChange: (description: string) => void;
}

// ─── Column headers ───────────────────────────────────────────────────────────

const SalesDebitNoteColGroup: React.FC = () => (
  <colgroup>
    <col style={{ width: "24px" }} />   {/* # */}
    <col style={{ width: "22%" }} />    {/* Item */}
    <col style={{ width: "7%" }} />     {/* Qty */}
    <col style={{ width: "8%" }} />     {/* Rate */}
    <col style={{ width: "12%" }} />    {/* Batch No */}
    <col style={{ width: "18%" }} />    {/* Warehouse */}
    <col style={{ width: "8%" }} />     {/* Amount */}
    <col style={{ width: "36px" }} />   {/* Actions */}
  </colgroup>
);

const SalesDebitNoteHeaders: React.FC = () => (
  <tr className="border-b border-theme">
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">#</th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">Item</th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">Qty</th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">Adj. Rate</th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px] hidden md:table-cell">Batch No</th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px] hidden md:table-cell">Warehouse</th>
    <th className="px-1 py-1 text-right text-muted font-medium text-[10px]">Amount</th>
    <th className="px-1 py-1" />
  </tr>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_ITEM: SalesDebitNoteItem = {
  item_code: "",
  item_name: "",
  qty: 0,
  rate: 0,
  batch_no: "",
  warehouse: "",
  max_qty: 0, 
  conversion_factor: 1, 
};

const ITEMS_PER_PAGE = 10;

// ─── Component ────────────────────────────────────────────────────────────────

export const SalesDebitNoteDetailsTab: React.FC<SalesDebitNoteDetailsTabProps> = ({
  form,
  invoiceLoading,
  grandTotal,
  fetchInvoiceOptions,
  onInvoiceSelect,
  onItemChange,
  onWarehouseDefault,
  onRemoveItem,
  reasonOptions,     
  reasonsLoading,
  fetchReasonOptions,
  onReasonChange, 
  onDescriptionChange
}) => {
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [form.return_against]);

  const noInvoice = !form.return_against;
  const showPlaceholders = noInvoice || invoiceLoading;

  const displayItems: SalesDebitNoteItem[] = showPlaceholders
    ? [{ ...EMPTY_ITEM }]
    : form.items;

  const itemCount = displayItems.length;
  const paginatedItems = displayItems.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  // ── ItemTable shim ────────────────────────────────────────────────────────

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
      onItemChange(index, name as keyof SalesDebitNoteItem, value);
    },
    updateItemDirectly: undefined,
  };

  const formData = { items: displayItems };

  // ── renderRow ─────────────────────────────────────────────────────────────

  const renderRow = (
    it: SalesDebitNoteItem,
    absoluteIndex: number,
    helpers: {
      handleCopyRow: (i: number) => void;
      handleRemoveRow: (i: number) => void;
    },
  ) => {
    const isPlaceholder = showPlaceholders;
    const isPulsing = invoiceLoading;
    const amount = Math.abs(it.qty) * it.rate;

    const inputCls = `w-full py-1 px-1.5 border border-theme rounded text-[10px] bg-card text-main
      focus:outline-none focus:ring-1 focus:ring-primary no-spinner
      ${isPulsing ? "animate-pulse opacity-60" : ""}`;

    return (
      <tr
        key={`row-${absoluteIndex}`}
        className="border-b border-theme bg-card hover:bg-primary/5 transition-colors"
      >
        {/* # */}
        <td className="px-1 py-1.5 text-[10px] text-muted">{absoluteIndex + 1}</td>

        {/* Item */}
        <td className="px-1 py-1.5 overflow-hidden">
          {isPlaceholder ? (
            <div className="flex flex-col gap-1">
              <div className={`h-3 w-28 bg-app rounded ${isPulsing ? "animate-pulse bg-primary/10" : ""}`} />
              <div className={`h-2.5 w-20 bg-app rounded ${isPulsing ? "animate-pulse bg-primary/10" : ""}`} />
            </div>
          ) : (
            <>
              <div className="text-[10px] font-medium text-main leading-tight truncate">
                {it.item_name || it.item_code}
              </div>
              <div className="text-[9px] text-muted font-mono truncate">{it.item_code}</div>
            </>
          )}
        </td>

        {/* Qty - Retained from original invoice */}
        <td className="px-1 py-1.5 overflow-hidden">
          <NumericInput
            name="qty"
            value={it.qty == null ? null : Math.abs(it.qty)}
            disabled={isPlaceholder}
            max={it.max_qty}
            className={isPulsing ? "animate-pulse opacity-60 w-full" : "w-full"}
            onChange={(value) =>
              onItemChange(
                absoluteIndex,
                "qty",
                value === null ? null : Math.abs(value),
              )
            }
          />
        </td>

        {/* Adjusted Rate */}
        <td className="px-1 py-1.5 overflow-hidden">
          <NumericInput
            name="rate"
            value={it.rate}
            disabled={isPlaceholder}
            decimalScale={4}
            className={isPulsing ? "animate-pulse opacity-60 w-full" : "w-full"}
            onChange={(value) => onItemChange(absoluteIndex, "rate", value)}
          />
        </td>

        {/* Batch No */}
        <td className="px-1 py-1.5 hidden md:table-cell overflow-hidden">
          <input
            type="text"
            name="batch_no"
            value={it.batch_no || ""}
            placeholder="Auto"
            disabled={isPlaceholder}
            className={inputCls}
            onChange={(e) => onItemChange(absoluteIndex, "batch_no", e.target.value)}
          />
        </td>

        {/* Warehouse */}
        <td className="px-1 py-1.5 hidden md:table-cell overflow-hidden">
          <WarehouseSelect
            compact
            disabled={isPlaceholder}
            value={it.warehouse || ""}
            onChange={(e) => onItemChange(absoluteIndex, "warehouse", e.target.value)}
          />
        </td>

        {/* Amount */}
        <td className="px-1 py-1.5 overflow-hidden">
          <span
            className="text-[10px] font-medium text-main whitespace-nowrap block truncate text-right"
            title={amount.toFixed(2)}
          >
            {isPlaceholder ? "—" : amount.toFixed(2)}
          </span>
        </td>

        {/* Delete */}
        <td className="px-1 py-1.5 overflow-hidden">
          {!isPlaceholder && (
            <button
              type="button"
              onClick={() => helpers.handleRemoveRow(absoluteIndex)}
              className="p-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition"
              title="Remove item"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </td>
      </tr>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 p-3">

      {/* ── Top controls ── */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-full sm:w-[280px]">
          <SearchSelect2
            label="Invoice Number"
            value={form.return_against}
            onChange={(_: string, option: any) => onInvoiceSelect(option?.meta)}
            fetchOptions={async (q) => {
              const results = await fetchInvoiceOptions(q);
              return results.map((opt) => ({
                label: opt.label,
                value: opt.value,
                meta: opt,
              }));
            }}
            placeholder="Search invoice…"
            required
            loading={invoiceLoading}
          />
        </div>

        <div className="flex flex-col gap-1 w-full sm:w-[220px]">
          <SearchSelect2
            label="Debit Note Reason"
            value={form.reason}
            onChange={(_: string, option: any) => {
              const opt = option?.meta;
              if (opt) onReasonChange(opt.reason, opt.code);
            }}
            fetchOptions={async (q) => {
              const results = await fetchReasonOptions(q);
              return results.map((r) => ({
                label: r.reason,
                value: r.reason,
                meta: r,
              }));
            }}
            placeholder="Search reason…"
            required
            loading={reasonsLoading}
          />
        </div>

        {form.code === "07" && (  
          <div className="flex flex-col gap-1 w-full sm:w-[260px]">
            <label className="text-[11px] font-medium text-muted">
              Description <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="description"
              placeholder="Brief reason…"
              value={form.description || ""}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="h-[30px] border border-theme rounded px-2 bg-card text-[11px] text-main outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* ── Main grid: table + sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px] gap-4 items-start">

        {/* Table */}
        <div className="min-w-0">
          <ItemTable
            title="Adjust Items"
            paginatedItems={paginatedItems}
            formData={formData}
            ui={ui}
            actions={actions}
            symbol=""
            ITEMS_PER_PAGE={ITEMS_PER_PAGE}
            colGroup={<SalesDebitNoteColGroup />}
            columnHeaders={<SalesDebitNoteHeaders />}
            renderRow={renderRow}
          />
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-row xl:flex-col gap-4 xl:sticky xl:top-0 h-fit">

          {/* Customer card */}
          <div className="bg-card rounded-lg p-2 flex-1 xl:flex-none w-full">
            <h3 className="text-[12px] font-semibold text-main mb-2">Customer</h3>
            {form.customer ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <User size={14} className="text-muted shrink-0" />
                  <span className="text-xs text-main font-medium break-words">
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
          <div className="bg-card rounded-lg p-2 flex-1 xl:flex-none w-full">
            <h3 className="text-[13px] font-semibold text-main mb-2">Summary</h3>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Total Items</span>
                <span className="font-medium text-main tabular-nums">
                  {form.items.length}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Total Qty</span>
                <span className="font-medium text-main tabular-nums">
                  {form.items.reduce((s, it) => s + Math.abs(it.qty), 0)}
                </span>
              </div>
              <div className="border-t border-theme my-1" />
              <div className="flex justify-between items-center bg-primary rounded-lg px-2 py-1.5">
                <span className="text-xs font-semibold text-white">Debit Total</span>
                <span className="text-xs font-bold text-white tabular-nums">
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