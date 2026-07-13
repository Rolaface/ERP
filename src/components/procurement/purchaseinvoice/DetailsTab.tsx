import React, { useState, useEffect } from "react";
import { Trash2, Copy, User, Mail, Phone } from "lucide-react";
import type {
  ItemRow,
  PurchaseInvoiceFormData,
} from "../../../types/Supply/purchaseInvoice";
import SupplierSelect from "../../selects/procurement/SupplierSelect";
import POItemSelect from "../../selects/procurement/POItemSelect";

import {
  ModalInput,
  ModalSelect,
  NumericInput,
} from "../../ui/modal/modalComponent";
import WarehouseSelect from "../../selects/WarehouseSelect";
import DatePickerInput from "../../calendar/DatePickerInput";
import CostCenterSelect from "../../selects/CostCenterSelect";
import ProjectSelect from "../../selects/ProjectSelect";
import Tooltip from "../../Tooltip";
import ItemTable from "../../common/ItemTable";
import type { ItemTableActions, ItemTableUI } from "../../common/ItemTable";
import ModeOfPaymentSelect from "../../selects/defaults/Modeofpaymentselect";

interface DetailsTabProps {
  form: PurchaseInvoiceFormData;
  items: ItemRow[];
  onItemSelect: (item: any, idx: number) => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSupplierChange: (s: any) => void;
  onItemChange: (e: React.ChangeEvent<HTMLInputElement>, idx: number) => void;
  onAddItem: () => void;
  onRemoveItem: (idx: number) => void;
  onDuplicateItem: (idx: number) => void;
  getCurrencySymbol: () => string;
  poLoading: boolean;
  isEditMode?: boolean;
  poList: any[];
  onPOSelect: (po: any) => void;
  usePO: boolean;
  onTogglePO: (checked: boolean) => void;
  onBulkItemChange?: (field: keyof ItemRow, value: string) => void;
 
}

const ITEMS_PER_PAGE = 5;

// ─── Colgroup — drives fixed layout widths ────────────────────────────────────
const PIColGroup: React.FC<{ hasRequiresBatch: boolean }> = ({ hasRequiresBatch }) => (
  <colgroup>
    <col style={{ width: "24px" }} />          {/* # */}
    <col style={{ width: "15%" }} />           {/* Item Name */}
    <col style={{ width: "52px" }} />          {/* Pkg */}
    <col style={{ width: "82px" }} />          {/* Batch No */}
    <col style={{ width: "56px" }} />          {/* Qty */}
    <col style={{ width: "96px" }} />          {/* Mfg Date */}
    <col style={{ width: "96px" }} />          {/* Expiry Date */}
    <col style={{ width: "60px" }} />          {/* Rate */}
    <col style={{ width: "12%" }} />           {/* Warehouse */}
    <col style={{ width: "44px" }} />          {/* Dis% */}
    <col style={{ width: "44px" }} />          {/* Tax% */}
    <col style={{ width: "90px" }} />          {/* Tax Name */}
    <col style={{ width: "64px" }} />          {/* Amount */}
    <col style={{ width: "44px" }} />          {/* Actions */}
  </colgroup>
);

// ─── Column headers ───────────────────────────────────────────────────────────
const PIColumnHeaders: React.FC<{ items: ItemRow[] }> = ({ items }) => {
  const requiresBatch = items?.some((it) => it.requiresBatch);
  return (
    <tr className="border-b border-theme">
      <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">#</th>
      <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">Item Name</th>
      <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">Pkg</th>
      <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">
        Batch No {requiresBatch && <span className="text-danger">*</span>}
      </th>
      <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">Qty</th>
      <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">
        Mfg Date {requiresBatch && <span className="text-danger">*</span>}
      </th>
      <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">
        Exp Date {requiresBatch && <span className="text-danger">*</span>}
      </th>
      <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">
        Rate <span className="text-danger">*</span>
      </th>
      <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">Warehouse</th>
      <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">Dis%</th>
      <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">Tax%</th>
      <th className="px-1 py-1 text-left text-muted font-medium text-[10px]">Tax Name</th>
      <th className="px-1 py-1 text-right text-muted font-medium text-[10px]">Amount</th>
      <th className="px-1 py-1" />
    </tr>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
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
  poList,
  onPOSelect,
  usePO,
  onTogglePO,
  isEditMode,
  onBulkItemChange,

}: DetailsTabProps) => {
  const symbol = getCurrencySymbol();
  const [page, setPage] = useState(0);



  const handleTopWarehouseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onFormChange(e);
    if (onBulkItemChange) onBulkItemChange("warehouse", e.target.value);
  };

  useEffect(() => {
    const newPage = Math.floor((items.length - 1) / ITEMS_PER_PAGE);
    if (newPage !== page) setPage(newPage);
  }, [items.length]);

  const paginatedItems = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const tableActions: ItemTableActions = {
    handleItemChange: (idx, e) => onItemChange(e as any, idx),
    removeItem: onRemoveItem,
    addItem: onAddItem,
    duplicateItem: onDuplicateItem,
  };

  const tableUI: ItemTableUI = { page, setPage, itemCount: items.length };

  // ── PI row renderer ──────────────────────────────────────────────────────
  const renderPIRow = (
    it: ItemRow,
    i: number,
    helpers: { handleCopyRow: (i: number) => void; handleRemoveRow: (i: number) => void },
  ) => {
    const qty = Number(it.quantity ?? 0);
    const rate = Number(it.rate ?? 0);
    const discount = Number(it.discount ?? 0);
    const vatRate = Number(it.vatRate ?? 0);
    const lineAmount = qty * rate;
    const discountAmount = lineAmount * (discount / 100);
    const netAmount = lineAmount - discountAmount;
    const taxAmount = netAmount * (vatRate / 100);
    const amount = netAmount + taxAmount;

    // Running column counter — same coordinate pattern used by ItemTable's
    // own default row renderer, so the container's spreadsheet-nav hook
    // (wired in ItemTable.tsx) can walk this custom row too.
    let col = 0;
    const c = () => col++;

    return (
      <tr key={i} className="border-b border-theme bg-card hover:bg-primary/5 transition-colors">

        {/* # */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 text-[10px] text-muted overflow-hidden">{i + 1}</td>

        {/* Item Name */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <POItemSelect
            value={it.itemName}
            selectedId={it.itemCode}
            onChange={(item: any) => onItemSelect(item.id, i)}
          />
        </td>

        {/* Packing */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <input
            type="text"
            name="packing"
            value={it.packingUnit && it.packingSize ? `${it.packingUnit}×${it.packingSize}` : ""}
            disabled
            className="w-full h-[24px] text-[10px] text-center bg-card text-main border border-theme rounded-sm"
          />
        </td>

        {/* Batch No */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <input
            name="batchNo"
            value={it.batchNo || ""}
            onChange={(e) => onItemChange(e, i)}
            required={it.requiresBatch}
            className="w-full py-1 px-1 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </td>

        {/* Qty */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <NumericInput
            name="quantity"
            placeholder="1"
            value={it.quantity ?? ""}
            onChange={(value) => onItemChange({ target: { name: "quantity", value } } as any, i)}
            className="w-full"
          />
        </td>

        {/* Mfg Date */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <div className="w-full">
            <DatePickerInput
              name="mfgDate"
              value={it.mfgDate || ""}
              onChange={(name, value) => onItemChange({ target: { name, value } } as any, i)}
            />
          </div>
        </td>

        {/* Expiry Date */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <div className="w-full">
            <DatePickerInput
              name="expDate"
              value={it.expDate || ""}
              onChange={(name, value) => onItemChange({ target: { name, value } } as any, i)}
            />
          </div>
        </td>

        {/* Rate */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <NumericInput
            name="rate"
            placeholder="0"
            value={it.rate ?? ""}
            onChange={(value) => onItemChange({ target: { name: "rate", value } } as any, i)}
            className="w-full"
          />
        </td>

        {/* Warehouse */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <div className="w-full">
            <WarehouseSelect
              compact
              value={it.warehouse || ""}
              onChange={(e: any) =>
                onItemChange({ target: { name: "warehouse", value: e.target?.value ?? e } } as any, i)
              }
              disabled={!form.updateStock}
            />
          </div>
        </td>

        {/* Discount */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <NumericInput
            name="discount"
            placeholder="0"
            value={it.discount ?? 0}
            onChange={(value) => onItemChange({ target: { name: "discount", value } } as any, i)}
            className="w-full"
          />
        </td>

        {/* Tax% */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <NumericInput
            name="vatRate"
            placeholder="0"
            value={it.vatRate ?? ""}
            onChange={(value) => onItemChange({ target: { name: "vatRate", value } } as any, i)}
            className="w-full"
            disabled
          />
        </td>

        {/* Tax Name */}
        <td data-row={i} data-col={c()} className="px-1 py-1.5 overflow-hidden">
          <input
            name="vatCd"
            value={it.vatCd || ""}
            onChange={(e) => onItemChange(e, i)}
            className="w-full py-1 px-1 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
            disabled
          />
        </td>

        {/* Amount */}
        <td className="px-1 py-1.5 overflow-hidden">
  <span className="text-[10px] font-medium text-main whitespace-nowrap block text-right">
    {symbol} {amount.toFixed(2)}
  </span>
</td>

        {/* Actions */}
        <td className="px-1 py-1.5 overflow-hidden">
          <div className="flex items-center gap-0.5">
            <Tooltip content="Duplicate row below">
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
    <div className="flex flex-col gap-3 bg-app text-main p-3">

      {/* ── Top fields ── */}
      <div className="flex flex-wrap gap-x-3 gap-y-2 items-end">

        <div className="w-[200px]">
          <SupplierSelect
            value={form.supplier || ""}
            selectedId={form.supplierId}
            onChange={onSupplierChange}
          />
        </div>

        {/* PO checkbox + field */}
        <div className="w-[155px] flex items-end gap-2">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 accent-primary mb-[6px]"
            checked={usePO}
            onChange={(e) => onTogglePO(e.target.checked)}
          />
          <div className="flex-1">
            {usePO ? (
              <ModalSelect
                label="Select PO"
                name="poNumber"
                value={form.poNumber}
                placeholder="Select PO"
                options={(poList || []).map((po) => ({ label: po.poId, value: po.poId }))}
                onChange={(e) => {
                  const selected = poList.find((p) => p.poId === e.target.value);
                  if (selected) onPOSelect(selected);
                }}
              />
            ) : (
              <ModalInput
                label=""
                name="poNumber"
                placeholder="PO No."
                value={form.poNumber}
                onChange={onFormChange}
              />
            )}
          </div>
        </div>

        <div className="w-[128px] ml-2">
  <ModalInput
    label="Supplier Invoice No"
    name="supplierInvoiceNumber"
    value={form.supplierInvoiceNumber}
    onChange={onFormChange}
    required
  />
</div>
        <div className="w-[128px]">
          <DatePickerInput
            label="Supplier Invoice Date"
            name="supplierInvoiceDate"
            value={form.supplierInvoiceDate || ""}
            onChange={(name, value) => onFormChange({ target: { name, value } } as any)}
          />
        </div>

        <div className="w-[110px]">
          <DatePickerInput
            label="Date"
            name="date"
            value={form.date}
            required
            onChange={(name, value) => onFormChange({ target: { name, value } } as any)}
          />
        </div>

        <div className="w-[110px]">
          <DatePickerInput
            label="Due Date"
            name="dueDate"
            value={form.dueDate}
            required
            disabled
            onChange={(name, value) => onFormChange({ target: { name, value } } as any)}
          />
        </div>

        <div className="w-[100px]">
          <CostCenterSelect
            value={form.costCenter}
            onChange={(val) =>
              onFormChange({ target: { name: "costCenter", value: val } } as React.ChangeEvent<HTMLInputElement>)
            }
          />
        </div>

        <div className="w-[100px]">
          <ProjectSelect
            value={form.project}
            onChange={(val) =>
              onFormChange({ target: { name: "project", value: val } } as React.ChangeEvent<HTMLInputElement>)
            }
          />
        </div>

 {/* <div className="w-[110px]">
  <ModeOfPaymentSelect
    value={form.paymentType ?? ""}
    onChange={(val) =>
      onFormChange({
        target: { name: "paymentType", value: val },
      } as any)
    }
    required
  />
</div> */}
<div className="w-[110px]">
  <ModeOfPaymentSelect
    value={form.paymentType ?? ""}
    onChange={(val) => {
      onFormChange({
        target: { name: "paymentType", value: val },
      } as any);
      
  
    }}
    required
  />
</div>
        <div className="w-[110px]">
          <WarehouseSelect
            name="warehouse"
            value={form.warehouse || ""}
            onChange={handleTopWarehouseChange}
            required={form.updateStock}
            disabled={!form.updateStock}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="updateStock"
            checked={form.updateStock ?? false}
            onChange={onFormChange}
            className="w-3.5 h-3.5 accent-primary"
          />
          <span className="text-xs text-main">Update Stock</span>
        </div>

      </div>

      {/* ── Main body: table + sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_190px] gap-2 min-w-0 items-start">

        {/* Table */}
        <div className="min-w-0 overflow-x-auto">
          <ItemTable
            title="Order Items"
            paginatedItems={paginatedItems}
            formData={{ items }}
            ui={tableUI}
            actions={tableActions}
            symbol={symbol}
            ITEMS_PER_PAGE={ITEMS_PER_PAGE}
            colGroup={<PIColGroup hasRequiresBatch={items.some((i) => i.requiresBatch)} />}
            columnHeaders={<PIColumnHeaders items={items} />}
            renderRow={renderPIRow}
          />
        </div>

        {/* Sidebar */}
        <div className="flex flex-row lg:flex-col gap-2 lg:w-[190px] lg:sticky lg:top-0">

          {/* Supplier Details */}
          <div className="bg-card rounded-lg p-2 flex-1 lg:flex-none w-full">
            <h3 className="text-[12px] font-semibold text-main mb-2">Supplier Details</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs text-main">
                <User size={14} className="text-muted shrink-0" />
                <span className="truncate">{form.supplier || "Supplier Name"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted">
                <Mail size={12} className="shrink-0" />
                <span className="truncate">{form.supplierEmail || "supplier@example.com"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted">
                <Phone size={12} className="shrink-0" />
                <span className="truncate">{form.supplierPhone || "-"}</span>
              </div>
              {form.taxCategory && (
                <div className="mt-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted">Tax Category</span>
                    <span className="font-medium text-main">{form.taxCategory}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted">Currency</span>
                    <span className="font-medium text-main">{form.currency || "-"}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {/* Summary */}
<div className="bg-card rounded-lg p-2 flex-1 lg:flex-none w-full">
  <h3 className="text-[13px] font-semibold text-main mb-2">Summary</h3>
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between text-[11px]">
      <span className="text-muted">Total Items</span>
      <span className="font-medium text-main">{items.length}</span>
    </div>
    <div className="flex justify-between text-[11px]">
      <span className="text-muted">Total Quantity</span>
      <span className="font-medium text-main">{form.totalQuantity}</span>
    </div>
    <div className="flex justify-between text-[11px]">
      <span className="text-muted">Total Amount</span>
      <span className="font-medium text-main whitespace-nowrap">
        {symbol} {form.totalAmount?.toFixed(2) ?? "0.00"}
      </span>
    </div>
    <div className="flex justify-between text-[11px]">
      <span className="text-muted">Discount</span>
      <span className="font-medium text-main whitespace-nowrap">
        {symbol} {form.totalDiscount?.toFixed(2) ?? "0.00"}
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
    <div className="border-t border-theme my-1" />
    <div className="flex justify-between text-xs font-semibold">
      <span className="text-main">Advance</span>
      <span className="text-main whitespace-nowrap">
        {symbol} {form.advanceAmount?.toFixed(2) ?? "0.00"}
      </span>
    </div>
  </div>
</div>

        </div>
      </div>
    </div>
  );
};