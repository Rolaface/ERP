import React, { useEffect, useState } from "react";
import { AlertCircle, PackageCheck, Trash2, User } from "lucide-react";
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
  onInvoiceSelect: (opt?: InvoiceOption) => Promise<void>;
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
    <col style={{ width: "36px" }} />  {/* # */}
    <col style={{ width: "30%" }} />   {/* Item */}
    <col style={{ width: "10%" }} />   {/* Qty */}
    <col style={{ width: "12%" }} />   {/* Orig. Rate */}
    <col style={{ width: "14%" }} />   {/* Adj. Rate */}
    <col style={{ width: "16%" }} />   {/* Warehouse */}
    <col style={{ width: "18%" }} />   {/* Adj. Total & Diff */}
    <col style={{ width: "36px" }} />  {/* Actions */}
  </colgroup>
);

const SalesDebitNoteHeaders: React.FC = () => (
  <tr className="border-b border-theme bg-app/50">
    <th className="px-2 py-2 text-center text-muted font-semibold text-xs">#</th>
    <th className="px-2 py-2 text-left text-muted font-semibold text-xs">Item</th>
    <th className="px-2 py-2 text-center text-muted font-semibold text-xs">Qty</th>
    <th className="px-2 py-2 text-right text-muted font-semibold text-xs">Orig. Rate</th>
    <th className="px-2 py-2 text-left text-muted font-semibold text-xs">Adj. Rate</th>
    <th className="px-2 py-2 text-left text-muted font-semibold text-xs hidden md:table-cell">Warehouse</th>
    <th className="px-2 py-2 text-right text-muted font-semibold text-xs">Adjusted Total</th>
    <th className="px-2 py-2" />
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
  const isNoItems = !noInvoice && !invoiceLoading && form.items.length === 0;

  const displayItems: SalesDebitNoteItem[] = showPlaceholders
    ? [{ ...EMPTY_ITEM }]
    : isNoItems
    ? [{ ...EMPTY_ITEM, item_code: "__EMPTY_ADJUSTED__" }]
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
    if (it.item_code === "__EMPTY_ADJUSTED__") {
      return (
        <tr key="empty-adjusted-row" className="border-b border-theme bg-card/60">
          <td colSpan={8} className="py-14 px-6 text-center">
            <div className="flex flex-col items-center justify-center gap-3 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                <PackageCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-main">
                  All items on this invoice have already been adjusted
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  Invoice <strong className="font-mono text-main font-semibold bg-app px-1.5 py-0.5 rounded border border-theme">{form.return_against}</strong> has <span className="font-semibold text-danger">0 remaining quantity</span> available for debit note adjustment.
                </p>
                <p className="text-xs text-muted/80 leading-relaxed">
                  All items from this invoice were already fully returned or adjusted in previous transactions. Please select another invoice with available balance.
                </p>
              </div>
            </div>
          </td>
        </tr>
      );
    }

    const isPlaceholder = showPlaceholders;
    const isPulsing = invoiceLoading;
    const qty = Math.abs(it.qty || 0);
    const origRate = it.original_rate ?? it.rate;
    const origTotal = qty * origRate;
    const adjTotal = qty * it.rate;
    const diff = adjTotal - origTotal;

    return (
      <tr
        key={`row-${absoluteIndex}`}
        className="border-b border-theme bg-card hover:bg-app/40 transition-colors"
      >
        {/* # */}
        <td className="px-2 py-2 text-center text-xs text-muted font-medium">
          {absoluteIndex + 1}
        </td>

        {/* Item */}
        <td className="px-2 py-2 overflow-hidden">
          {isPlaceholder ? (
            <div className="flex flex-col gap-1.5">
              <div className={`h-3.5 w-32 bg-app rounded ${isPulsing ? "animate-pulse bg-primary/10" : ""}`} />
              <div className={`h-3 w-20 bg-app rounded ${isPulsing ? "animate-pulse bg-primary/10" : ""}`} />
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-medium text-main leading-snug truncate" title={it.item_name || it.item_code}>
                {it.item_name || it.item_code}
              </span>
              <span className="text-[11px] font-mono text-muted truncate">
                {it.item_code}
              </span>
              {it.max_qty === 0 && (
                <span className="text-[10px] font-medium text-danger bg-danger/10 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                  0 available (Fully adjusted)
                </span>
              )}
            </div>
          )}
        </td>

        {/* Qty */}
        <td className="px-2 py-2 overflow-hidden">
          <NumericInput
            name="qty"
            value={it.qty == null ? null : Math.abs(it.qty)}
            disabled={isPlaceholder}
            max={it.max_qty}
            className={isPulsing ? "animate-pulse opacity-60 w-full" : "w-full text-center"}
            onChange={(value) =>
              onItemChange(
                absoluteIndex,
                "qty",
                value === null ? null : Math.abs(value),
              )
            }
          />
        </td>

        {/* Orig. Rate */}
        <td className="px-2 py-2 overflow-hidden text-right">
          <span className="text-xs text-muted font-mono font-medium whitespace-nowrap">
            {isPlaceholder ? "—" : origRate.toFixed(2)}
          </span>
        </td>

        {/* Adjusted Rate */}
        <td className="px-2 py-2 overflow-hidden">
          <NumericInput
            name="rate"
            value={it.rate}
            disabled={isPlaceholder}
            decimalScale={4}
            className={isPulsing ? "animate-pulse opacity-60 w-full" : "w-full"}
            onChange={(value) => onItemChange(absoluteIndex, "rate", value)}
          />
        </td>

        {/* Warehouse */}
        <td className="px-2 py-2 hidden md:table-cell overflow-hidden">
          <WarehouseSelect
            compact
            disabled={isPlaceholder}
            value={it.warehouse || ""}
            onChange={(e) => onItemChange(absoluteIndex, "warehouse", e.target.value)}
            onDefaultLoad={(wh) => onWarehouseDefault(absoluteIndex, wh)}
          />
        </td>

        {/* Adj. Total & Difference */}
        <td className="px-2 py-2 overflow-hidden text-right">
          {isPlaceholder ? (
            <span className="text-xs text-muted font-mono">—</span>
          ) : (
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs font-semibold text-main tabular-nums whitespace-nowrap">
                {adjTotal.toFixed(2)}
              </span>
              {diff !== 0 && (
                <span
                  className={`text-[10px] font-medium font-mono px-1.5 py-0.2 rounded whitespace-nowrap ${
                    diff > 0
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                      : "text-amber-700 bg-amber-50 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40"
                  }`}
                  title={`Original total: ${origTotal.toFixed(2)}`}
                >
                  {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </td>

        {/* Delete */}
        <td className="px-2 py-2 overflow-hidden text-center">
          {!isPlaceholder && (
            <button
              type="button"
              onClick={() => helpers.handleRemoveRow(absoluteIndex)}
              className="p-1 rounded-md bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
              title="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </td>
      </tr>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Top controls card ── */}
      <div className="bg-card border border-theme rounded-xl p-3.5 shadow-2xs">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-full sm:w-[280px]">
            <SearchSelect2
              label="Invoice Number"
              value={form.return_against}
              onChange={(value: string, option: any) => {
                if (!value) {
                  onInvoiceSelect(undefined);
                  return;
                }
                onInvoiceSelect(option?.meta);
              }}
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

          <div className="w-full sm:w-[240px]">
            <SearchSelect2
              label="Debit Note Reason"
              value={form.reason}
              allowCustomInput={true}
              onChange={(value: string, option: any) => {
                if (!value) {
                  onReasonChange("", "");
                  return;
                }

                const matched =
                  reasonOptions.find(
                    (r) =>
                      r.reason.toLowerCase() === value.toLowerCase() ||
                      r.code === value,
                  ) ||
                  option?.meta ||
                  option;

                const reasonName =
                  matched?.reason || option?.label || value;
                const reasonCode =
                  matched?.code || option?.meta?.code || "";

                onReasonChange(reasonName, reasonCode);
              }}
              fetchOptions={async (q) => {
                const list =
                  reasonOptions.length > 0
                    ? reasonOptions
                    : await fetchReasonOptions(q);
                const filtered = q
                  ? list.filter((r) =>
                      r.reason.toLowerCase().includes(q.toLowerCase()),
                    )
                  : list;
                return filtered.map((r) => ({
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
              <label className="text-xs font-medium text-main">
                Description <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="description"
                placeholder="Brief reason…"
                value={form.description || ""}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className="h-8 border border-theme rounded-md px-2.5 bg-card text-xs text-main outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Main grid: table + sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_240px] gap-4 items-start">

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
        <div className="flex flex-row xl:flex-col gap-3.5 xl:sticky xl:top-0 h-fit">

          {/* Customer card */}
          <div className="bg-card border border-theme rounded-xl p-3.5 flex-1 xl:flex-none w-full shadow-2xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
              Customer
            </h3>
            {form.customer ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <User size={14} />
                  </div>
                  <span className="text-xs text-main font-semibold break-words">
                    {form.customer.name}
                  </span>
                </div>
                <span className="text-[11px] font-mono bg-app border border-theme px-2 py-0.5 rounded-md text-muted w-fit mt-1">
                  {form.customer.id}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted italic">
                Auto-filled on invoice selection
              </p>
            )}
          </div>

          {/* Summary card */}
          <div className="bg-card border border-theme rounded-xl p-3.5 flex-1 xl:flex-none w-full shadow-2xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 pb-2 border-b border-theme">
              Summary
            </h3>
            <div className="flex flex-col gap-2">
              {form.original_invoice_total != null && form.original_invoice_total > 0 && (
                <div className="flex justify-between text-xs items-center">
                  <span className="text-muted">Original Total</span>
                  <span className="font-medium text-main tabular-nums">
                    {form.original_invoice_total.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted">Adjusted Items</span>
                <span className="font-medium text-main tabular-nums">
                  {form.items.length}
                </span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted">Total Qty</span>
                <span className="font-medium text-main tabular-nums">
                  {form.items.reduce((s, it) => s + Math.abs(it.qty), 0)}
                </span>
              </div>

              <div className="border-t border-theme my-1" />

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 flex justify-between items-center">
                <span className="text-xs font-bold text-primary">Adjusted Total</span>
                <span className="text-sm font-bold text-primary tabular-nums">
                  {grandTotal.toFixed(2)}
                </span>
              </div>

              {form.original_invoice_total != null && form.original_invoice_total > 0 && (
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-muted font-medium">Net Adjustment:</span>
                  <span
                    className={`font-semibold font-mono tabular-nums px-1.5 py-0.5 rounded text-xs ${
                      grandTotal - form.original_invoice_total > 0
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                        : grandTotal - form.original_invoice_total < 0
                        ? "text-amber-700 bg-amber-50 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40"
                        : "text-main"
                    }`}
                  >
                    {grandTotal - form.original_invoice_total > 0 ? "+" : ""}
                    {(grandTotal - form.original_invoice_total).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};