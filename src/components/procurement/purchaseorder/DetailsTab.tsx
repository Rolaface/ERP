import React, { useState, useEffect } from "react";
import { Trash2, Copy, User, Mail } from "lucide-react";
import type {
  ItemRow,
  PurchaseOrderFormData,
} from "../../../types/Supply/purchaseOrder";
import SupplierSelect from "../../selects/procurement/SupplierSelect";
import POItemSelect from "../../selects/procurement/POItemSelect";
import { NumericInput } from "../../ui/modal/modalComponent";
import WarehouseSelect from "../../selects/WarehouseSelect";
import DatePickerInput from "../../calendar/DatePickerInput";
import CostCenterSelect from "../../selects/CostCenterSelect";
import ProjectSelect from "../../selects/ProjectSelect";
import Tooltip from "../../Tooltip";
import ItemTable from "../../common/ItemTable";
import type { ItemTableActions, ItemTableUI } from "../../common/ItemTable";

const ITEMS_PER_PAGE = 5;

interface DetailsTabProps {
  form: PurchaseOrderFormData;
  items: ItemRow[];
  onItemSelect: (item: any, idx: number) => void;
  onFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onSupplierChange: (s: any) => void;
  onItemChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    idx: number,
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (idx: number) => void;
  onDuplicateItem: (idx: number) => void;
  getCurrencySymbol: () => string;
  onBulkItemChange?: (field: keyof ItemRow, value: string) => void;
  fromPO?: boolean;
  setFromPO?: React.Dispatch<React.SetStateAction<boolean>>;
}

// ─── Columns ─────────────────────────────────────────────────────────────────
// # | Item | Pkg | Req.By | Warehouse | Qty | UOM | Rate | Tax% | Tax | Amount | Actions
// Percentages so they scale with container; hidden cols excluded from budget.

const POColGroup: React.FC = () => (
  <colgroup>
    <col style={{ width: "24px" }} /> {/* # */}
    <col style={{ width: "18%" }} /> {/* Item Name */}
    <col style={{ width: "44px" }} /> {/* Pkg */}
    <col style={{ width: "9%" }} /> {/* Req. By */}
    <col style={{ width: "12%" }} /> {/* Warehouse */}
    <col style={{ width: "5%" }} /> {/* Qty */}
    <col style={{ width: "5%" }} /> {/* UOM */}
    <col style={{ width: "7%" }} /> {/* Rate */}
    <col style={{ width: "5%" }} /> {/* Tax% */}
    <col style={{ width: "16%" }} /> {/* Tax NAME */}
    <col style={{ width: "8%" }} /> {/* Amount */}
    <col style={{ width: "40px" }} /> {/* Actions */}
  </colgroup>
);

const POColumnHeaders: React.FC = () => (
  <tr className="border-b border-theme">
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">
      #
    </th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">
      Item Name
    </th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px] hidden md:table-cell">
      Pkg
    </th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px] hidden md:table-cell">
      Req. By
    </th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px] hidden md:table-cell">
      Warehouse <span className="text-danger">*</span>
    </th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">
      Qty
    </th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px] hidden lg:table-cell">
      UOM
    </th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">
      Rate <span className="text-danger">*</span>
    </th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px] hidden md:table-cell">
      Tax%
    </th>
    <th className="px-1 py-1 text-left text-muted font-medium text-[10px] hidden md:table-cell">
      Tax Name
    </th>
    <th className="px-1 py-1 text-right text-muted font-medium text-[10px]">
      Amount
    </th>
    <th className="px-1 py-1" />
  </tr>
);

// ─── Component ───────────────────────────────────────────────────────────────

export const DetailsTab = ({
  form,
  items,
  onFormChange,
  onSupplierChange,
  onItemChange,
  onItemSelect,
  onAddItem,
  onRemoveItem,
  onDuplicateItem,
  getCurrencySymbol,
  onBulkItemChange,
}: DetailsTabProps) => {
  const symbol = getCurrencySymbol();

  const [page, setPage] = useState(0);
  useEffect(() => {
    const newPage = Math.floor((items.length - 1) / ITEMS_PER_PAGE);
    if (newPage !== page) setPage(newPage);
  }, [items.length]);

  const paginatedItems = items.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  const handleTopRequiredByChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    onFormChange(e);
    onBulkItemChange?.("requiredBy", (e.target as HTMLInputElement).value);
  };

  const handleTopWarehouseChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    onFormChange(e);
    onBulkItemChange?.("warehouse", e.target.value);
  };

  const tableActions: ItemTableActions = {
    handleItemChange: (idx, e) => onItemChange(e, idx),
    removeItem: onRemoveItem,
    addItem: onAddItem,
    duplicateItem: onDuplicateItem,
  };

  const tableUI: ItemTableUI = {
    page,
    setPage: (p) => setPage(p),
    itemCount: items.length,
  };

  const renderPORow = (
    it: ItemRow,
    i: number,
    helpers: {
      handleCopyRow: (i: number) => void;
      handleRemoveRow: (i: number) => void;
    },
  ) => {
    const amount = (it.quantity ?? 0) * (it.rate ?? 0);

    // Running column counter — same coordinate pattern used by ItemTable's
    // own default row renderer, so the container's spreadsheet-nav hook
    // (wired in ItemTable.tsx) can walk this custom row too.
    let col = 0;
    const c = () => col++;

    return (
      <tr
        key={i}
        className="border-b border-theme bg-card hover:bg-primary/5 transition-colors"
      >
        {/* # */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 text-[10px] text-muted">
          {i + 1}
        </td>

        {/* Item Name */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <POItemSelect
            value={it.itemName}
            selectedId={it.itemCode}
            onChange={(item: any) => onItemSelect(item.id, i)}
          />
        </td>

        {/* Packing */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 hidden md:table-cell overflow-hidden">
          <input
            type="text"
            value={
              it.itemCode
                ? `${it.packingUnit || ""}x${it.packingSize || ""}`
                : ""
            }
            onChange={(e) => {
              const value = e.target.value;
              const [unit, size] = value.split("x");
              onItemChange(
                { target: { name: "packingUnit", value: unit || "" } } as any,
                i,
              );
              onItemChange(
                { target: { name: "packingSize", value: size || "" } } as any,
                i,
              );
            }}
            className="w-full h-[24px] text-[10px] text-center bg-card text-main border border-theme rounded-sm"
          />
        </td>

        {/* Required By */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 hidden md:table-cell overflow-hidden">
          <DatePickerInput
            name="requiredBy"
            value={it.requiredBy || ""}
            onChange={(name, value) =>
              onItemChange({ target: { name, value } } as any, i)
            }
          />
        </td>

        {/* Warehouse */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 hidden md:table-cell overflow-hidden">
          <WarehouseSelect
            compact
            value={it.warehouse || ""}
            onChange={(e) => onItemChange(e, i)}
          />
        </td>

        {/* Qty */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <NumericInput
            name="quantity"
            placeholder="1"
            value={it.quantity ?? ""}
            onChange={(value) =>
              onItemChange({ target: { name: "quantity", value } } as any, i)
            }
            className="w-full"
          />
        </td>

        {/* UOM */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 hidden lg:table-cell overflow-hidden">
          <input
            name="uom"
            value={it.uom}
            disabled
            onChange={(e) => onItemChange(e, i)}
            className="w-full py-1 px-1 border border-theme rounded text-[10px] bg-card text-main"
          />
        </td>

        {/* Rate */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <NumericInput
            name="rate"
            placeholder="0"
            value={it.rate ?? ""}
            decimalScale={4}
            onChange={(value) =>
              onItemChange({ target: { name: "rate", value } } as any, i)
            }
            className="w-full"
          />
        </td>

        {/* Tax% */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 hidden md:table-cell overflow-hidden">
          <NumericInput
            name="vatRate"
            placeholder="0"
            value={it.vatRate ?? ""}
            onChange={(value) =>
              onItemChange({ target: { name: "vatRate", value } } as any, i)
            }
            className="w-full"
            disabled
          />
        </td>

        {/* Tax — vatCd, same 12% width as Invoice Tax Name */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 hidden md:table-cell overflow-hidden">
          <Tooltip content={it.vatCd || "No Tax"}>
            <input
              name="vatCd"
              value={it.vatCd || ""}
              onChange={(e) => onItemChange(e, i)}
              disabled
              className="w-full py-1 px-1.5 border border-theme rounded text-[10px] bg-card text-main truncate"
            />
          </Tooltip>
        </td>

        {/* Amount */}
        <td className="px-1 py-1.5 overflow-hidden">
          <span
            className="text-[10px] font-medium text-main whitespace-nowrap block truncate text-right"
            title={`${symbol} ${amount.toFixed(2)}`}
          >
            {symbol} {amount.toFixed(2)}
          </span>
        </td>

        {/* Actions */}
        <td className="px-1 py-1.5 overflow-hidden">
          <div className="flex items-center gap-0.5">
            <Tooltip content="Duplicate row">
              <button
                type="button"
                onClick={() => helpers.handleCopyRow(i)}
                className="p-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition"
              >
                <Copy className="w-3 h-3" />
              </button>
            </Tooltip>
            <button
              type="button"
              onClick={() => helpers.handleRemoveRow(i)}
              className="p-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col gap-3 bg-app text-main p-3 min-h-0">
      {/* ── Top fields ── */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="w-full sm:w-[180px]">
          <SupplierSelect
            className="w-full"
            selectedId={form.supplierId}
            value={form.supplier}
            onChange={onSupplierChange}
          />
        </div>
        <div className="w-[110px]">
          <DatePickerInput
            label="Date"
            name="date"
            value={form.date}
            required
            onChange={(name, value) =>
              onFormChange({ target: { name, value } } as any)
            }
          />
        </div>
        <div className="w-[110px]">
          <CostCenterSelect
            value={form.costCenter}
            onChange={(val) =>
              onFormChange({
                target: { name: "costCenter", value: val },
              } as React.ChangeEvent<HTMLInputElement>)
            }
          />
        </div>
        <div className="w-[110px]">
          <ProjectSelect
            value={form.project}
            onChange={(val) =>
              onFormChange({
                target: { name: "project", value: val },
              } as React.ChangeEvent<HTMLInputElement>)
            }
          />
        </div>
        <div className="w-[110px]">
          <DatePickerInput
            label="Required By"
            name="requiredBy"
            value={form.requiredBy}
            onChange={(name, value) =>
              handleTopRequiredByChange({ target: { name, value } } as any)
            }
          />
        </div>
        <div className="w-[140px]">
          <WarehouseSelect
            value={form.warehouse || ""}
            onChange={handleTopWarehouseChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_190px] gap-2 min-w-0 items-start">
        <div className="min-w-0 overflow-x-auto">
          <ItemTable
            title="Order Items"
            paginatedItems={paginatedItems}
            formData={{ items }}
            ui={tableUI}
            actions={tableActions}
            symbol={symbol}
            ITEMS_PER_PAGE={ITEMS_PER_PAGE}
            colGroup={<POColGroup />}
            columnHeaders={<POColumnHeaders />}
            renderRow={renderPORow}
          />
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-row lg:flex-col gap-2 lg:w-[190px] lg:sticky lg:top-0">
          {/* Supplier Details */}
          <div className="bg-card rounded-lg p-2 flex-1 lg:flex-none w-full">
            <h3 className="text-[12px] font-semibold text-main mb-2">
              Supplier Details
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs text-main">
                <User size={14} className="text-muted shrink-0" />
                <span className="truncate">
                  {form.supplier || "Supplier Name"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted">
                <Mail size={12} className="shrink-0" />
                <span className="truncate">
                  {form.supplierEmail || "supplier@example.com"}
                </span>
              </div>
              {form.taxCategory && (
                <div className="mt-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted">Tax Category</span>
                    <span className="font-medium text-main">
                      {form.taxCategory}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted">Currency</span>
                    <span className="font-medium text-main">
                      {form.currency || "-"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-card rounded-lg p-2 flex-1 lg:flex-none w-full">
            <h3 className="text-[13px] font-semibold text-main mb-2">
              Summary
            </h3>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Total Items</span>
                <span className="font-medium text-main">{items.length}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Total Quantity</span>
                <span className="font-medium text-main">
                  {form.totalQuantity ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium text-main whitespace-nowrap">
                  {symbol} {form.subTotal?.toFixed(2) ?? "0.00"}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Total Tax</span>
                <span className="font-medium text-main whitespace-nowrap">
                  {symbol} {form.totalTax?.toFixed(2) ?? "0.00"}
                </span>
              </div>
              <div className="border-t border-theme my-1" />
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-main">Grand Total</span>
                <span className="text-main whitespace-nowrap">
                  {symbol} {form.grandTotal?.toFixed(2) ?? "0.00"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};