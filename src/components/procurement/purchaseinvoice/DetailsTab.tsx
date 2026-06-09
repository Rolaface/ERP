import React, { useState, useEffect } from "react";
import { Trash2, Copy, User, Mail, Phone } from "lucide-react";
import type {
  ItemRow,
  PurchaseInvoiceFormData,
} from "../../../types/Supply/purchaseInvoice";
import SupplierSelect from "../../selects/procurement/SupplierSelect";
import POItemSelect from "../../selects/procurement/POItemSelect";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";

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
import { getAllModeOfPayment } from "../../../api/BankAccountApi";

interface DetailsTabProps {
  form: PurchaseInvoiceFormData;
  items: ItemRow[];
  onItemSelect: (item: any, idx: number) => void;
  onFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
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

// ─── PI-specific column headers ───────────────────────────────────────────────

const PIColumnHeaders: React.FC<{ items: ItemRow[] }> = ({ items }) => (
  <tr className="border-b border-theme">
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[25px]">
      #
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] min-w-[150px]">
      Item Name
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[60px]">
      Pkg (U×S)
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[90px]">
      Batch No{" "}
      {items?.some((it) => it.requiresBatch) && (
        <span className="text-danger">*</span>
      )}
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[70px]">
      Qty
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[110px]">
      Mfg Date{" "}
      {items.some((i) => i.requiresBatch) && (
        <span className="text-danger">*</span>
      )}
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[110px]">
      Expiry Date{" "}
      {items.some((i) => i.requiresBatch) && (
        <span className="text-danger">*</span>
      )}
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[65px] whitespace-nowrap">
      Rate <span className="text-danger">*</span>
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[120px]">
      Warehouse
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[50px]">
      Dis (%)
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[50px]">
      Tax(%)
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[55px] whitespace-nowrap">
      Tax Name
    </th>
    <th className="px-2 py-1 text-right text-muted font-medium text-[10px] w-[65px]">
      Amount
    </th>
    <th className="px-2 py-1 text-center text-muted font-medium text-[10px] w-[50px]">
      -
    </th>
  </tr>
);

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

  const handleModeFetchOptions = async (q: string) => {
    const res = await getAllModeOfPayment(1, 10, q || "", 1);
    const list = res?.data?.modeOfPayments || res?.data || [];
    return list.map((item: any) => ({
      label: item.name || item.modeOfPayment,
      value: item.name || item.modeOfPayment,
      meta: item,
    }));
  };

  const handleModeChange = (_: string, option: any) => {
    onFormChange({
      target: {
        name: "paymentType",
        value: option?.label || option?.value || "",
      },
    } as any);
  };

  const handleTopWarehouseChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    onFormChange(e);
    if (onBulkItemChange) {
      onBulkItemChange("warehouse", e.target.value);
    }
  };

  useEffect(() => {
    const newPage = Math.floor((items.length - 1) / ITEMS_PER_PAGE);
    if (newPage !== page) setPage(newPage);
  }, [items.length]);

  const paginatedItems = items.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  // ── Bridge to ItemTable's action/ui interface ──────────────────────────────

  const tableActions: ItemTableActions = {
    handleItemChange: (idx, e) => onItemChange(e as any, idx),
    removeItem: onRemoveItem,
    addItem: onAddItem,
    duplicateItem: onDuplicateItem,
  };

  const tableUI: ItemTableUI = {
    page,
    setPage,
    itemCount: items.length,
  };

  // ── PI row renderer ────────────────────────────────────────────────────────

  const renderPIRow = (
    it: ItemRow,
    i: number,
    helpers: {
      handleCopyRow: (i: number) => void;
      handleRemoveRow: (i: number) => void;
    },
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

    return (
      <tr key={i} className="border-b border-theme bg-card hover:bg-primary/5 transition-colors">

        {/* # */}
        <td className="px-2 py-1.5 text-[10px] text-muted align-middle">{i + 1}</td>

        {/* ITEM */}
        <td className="px-2 py-1.5 min-w-[150px] align-top">
          <Tooltip content={it.itemName ? `Item: ${it.itemName}` : "Select an item"}>
            <div className="w-full">
              <POItemSelect
                value={it.itemName}
                selectedId={it.itemCode}
                onChange={(item: any) => onItemSelect(item.id, i)}
              />
            </div>
          </Tooltip>
        </td>

        {/* PACKING */}
        <td className="px-2 py-1.5 align-top">
          <Tooltip content={`Packing: ${it.packingUnit || ""}×${it.packingSize || ""}`}>
            <input
              type="text"
              name="packing"
              value={
                it.packingUnit && it.packingSize
                  ? `${it.packingUnit}×${it.packingSize}`
                  : ""
              }
              disabled
              className="w-[52px] h-[24px] text-[10px] text-center bg-card text-main border border-theme rounded-sm"
            />
          </Tooltip>
        </td>

        {/* BATCH */}
        <td className="px-2 py-1.5 align-top">
          <Tooltip content={it.batchNo ? `Batch: ${it.batchNo}` : "Enter batch number"}>
            <input
              name="batchNo"
              value={it.batchNo || ""}
              onChange={(e) => onItemChange(e, i)}
              required={it.requiresBatch}
              className="w-[82px] py-1 px-1.5 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Tooltip>
        </td>

        {/* QTY */}
        <td className="px-2 py-1.5 align-top">
          <Tooltip content={it.quantity ? `Quantity: ${it.quantity}` : "Enter quantity"}>
            <NumericInput
              name="quantity"
              placeholder="1"
              value={it.quantity ?? ""}
              onChange={(value) =>
                onItemChange({ target: { name: "quantity", value } } as any, i)
              }
              className="w-[60px]"
            />
          </Tooltip>
        </td>

        {/* MFG DATE */}
        <td className="px-2 py-1.5 align-top">
          <div className="w-[105px]">
            <DatePickerInput
              name="mfgDate"
              value={it.mfgDate || ""}
              onChange={(name, value) =>
                onItemChange({ target: { name, value } } as any, i)
              }
            />
          </div>
        </td>

        {/* EXPIRY DATE */}
        <td className="px-2 py-1.5 align-top">
          <div className="w-[105px]">
            <DatePickerInput
              name="expDate"
              value={it.expDate || ""}
              onChange={(name, value) =>
                onItemChange({ target: { name, value } } as any, i)
              }
            />
          </div>
        </td>

        {/* RATE */}
        <td className="px-2 py-1.5 align-top">
          <Tooltip content={it.rate ? `Rate: ${symbol} ${it.rate}` : "Enter rate"}>
            <NumericInput
              name="rate"
              placeholder="0"
              value={it.rate ?? ""}
              onChange={(value) =>
                onItemChange({ target: { name: "rate", value } } as any, i)
              }
              className="w-[55px]"
            />
          </Tooltip>
        </td>

        {/* WAREHOUSE */}
        <td className="px-2 py-1.5 align-top">
          <Tooltip content={it.warehouse ? `Warehouse: ${it.warehouse}` : "Select a warehouse"}>
            <WarehouseSelect
              compact
              value={it.warehouse || ""}
              onChange={(e: any) =>
                onItemChange(
                  { target: { name: "warehouse", value: e.target?.value ?? e } } as any,
                  i,
                )
              }
              disabled={!form.updateStock}
            />
          </Tooltip>
        </td>

        {/* DISCOUNT */}
        <td className="px-2 py-1.5 align-top">
          <Tooltip content={it.discount ? `Discount: ${it.discount}%` : "Enter discount"}>
            <NumericInput
              name="discount"
              placeholder="0"
              value={it.discount ?? 0}
              onChange={(value) =>
                onItemChange({ target: { name: "discount", value } } as any, i)
              }
              className="w-[40px]"
            />
          </Tooltip>
        </td>

        {/* TAX */}
        <td className="px-2 py-1.5 align-top">
          <Tooltip content={`Tax Rate: ${it.vatRate || "N/A"}`}>
            <NumericInput
              name="vatRate"
              placeholder="0"
              value={it.vatRate ?? ""}
              onChange={(value) =>
                onItemChange({ target: { name: "vatRate", value } } as any, i)
              }
              className="w-[40px]"
              disabled
            />
          </Tooltip>
        </td>

        {/* TAX NAME */}
        <td className="px-2 py-1.5 align-top">
          <Tooltip
            content={
              it.taxTypes?.length
                ? `Tax Types: ${it.taxTypes.join(", ")}`
                : "No Tax Types"
            }
          >
            <input
              name="vatCd"
              value={it.vatCd || ""}
              onChange={(e) => onItemChange(e, i)}
              className="w-[46px] py-1 px-1.5 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              disabled
            />
          </Tooltip>
        </td>

        {/* AMOUNT */}
        <td className="px-2 py-1.5 text-right align-middle">
          <span className="text-[10px] font-medium text-main">
            {symbol} {amount.toFixed(2)}
          </span>
        </td>

        {/* ACTIONS */}
        <td className="px-2 py-1.5 text-center align-middle">
          <div className="flex items-center justify-center gap-1">
            <Tooltip content="Duplicate row below">
              <button
                type="button"
                onClick={() => helpers.handleCopyRow(i)}
                className="p-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <button
              type="button"
              onClick={() => helpers.handleRemoveRow(i)}
              className="p-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
   <div className="flex flex-col gap-3 h-full bg-app text-main">

      {/* ── Top fields ── */}
      <div className="bg-app">
        <div className="flex flex-wrap gap-x-3 gap-y-3 items-end">

          <div className="w-[250px]">
            <Tooltip
              content={form.supplier ? `Supplier: ${form.supplier}` : "Select a supplier"}
            >
              <SupplierSelect
                value={form.supplier || ""}
                selectedId={form.supplierId}
                onChange={(s) => {
                  console.log("UI SELECT:", s);
                  onSupplierChange(s);
                }}
              />
            </Tooltip>
          </div>

          {/* PO Number Logic: Checkbox + Conditional Field */}
          <div className="w-[160px] flex items-end gap-2">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 accent-primary mb-[6px]"
              checked={usePO}
              onChange={(e) => onTogglePO(e.target.checked)}
            />
            <div className="flex-1">
              {usePO ? (
                <Tooltip
                  content={form.poNumber ? `PO Number: ${form.poNumber}` : "Select a PO"}
                >
                  <ModalSelect
                    label="Select PO"
                    name="poNumber"
                    value={form.poNumber}
                    placeholder="Select PO"
                    options={(poList || []).map((po) => ({
                      label: po.poId,
                      value: po.poId,
                    }))}
                    onChange={(e) => {
                      const poId = e.target.value;
                      const selected = poList.find((p) => p.poId === poId);
                      if (selected) onPOSelect(selected);
                    }}
                  />
                </Tooltip>
              ) : (
                <Tooltip
                  content={
                    form.poNumber ? `PO Number: ${form.poNumber}` : "Enter PO number manually"
                  }
                >
                  <ModalInput
                    label=""
                    name="poNumber"
                    placeholder="PO No."
                    value={form.poNumber}
                    onChange={onFormChange}
                  />
                </Tooltip>
              )}
            </div>
          </div>

          <div className="w-[135px] ml-2">
            <span className="block h-5" />
            <Tooltip
              content={
                form.supplierInvoiceNumber
                  ? `Supplier Invoice No: ${form.supplierInvoiceNumber}`
                  : "Enter supplier invoice number"
              }
            >
              <ModalInput
                label="Supplier Invoice No"
                name="supplierInvoiceNumber"
                value={form.supplierInvoiceNumber}
                onChange={onFormChange}
                required
              />
            </Tooltip>
          </div>

          <div className="w-[140px] ml-2">
            <Tooltip
              content={
                form.supplierInvoiceDate
                  ? `Supplier Invoice Date: ${form.supplierInvoiceDate}`
                  : "Enter supplier invoice date"
              }
            >
              <DatePickerInput
                label="Supplier Invoice Date"
                name="supplierInvoiceDate"
                value={form.supplierInvoiceDate || ""}
                onChange={(name, value) =>
                  onFormChange({ target: { name, value } } as any)
                }
              />
            </Tooltip>
          </div>

          <div className="w-[128px] ml-2">
            <Tooltip content={form.date ? `Date: ${form.date}` : "Enter date"}>
              <DatePickerInput
                label="Date"
                name="date"
                value={form.date}
                required
                onChange={(name, value) =>
                  onFormChange({ target: { name, value } } as any)
                }
              />
            </Tooltip>
          </div>

          <div className="w-[128px] ml-2">
            <Tooltip content={form.dueDate ? `Due Date: ${form.dueDate}` : "Enter due date"}>
              <DatePickerInput
                label="Due Date"
                name="dueDate"
                value={form.dueDate}
                required
                disabled
                onChange={(name, value) =>
                  onFormChange({ target: { name, value } } as any)
                }
              />
            </Tooltip>
          </div>

          <div className="w-[100px] ml-3">
            <Tooltip
              content={
                form.costCenter ? `Cost Center: ${form.costCenter}` : "Select a cost center"
              }
            >
              <CostCenterSelect
                value={form.costCenter}
                onChange={(val) =>
                  onFormChange({
                    target: { name: "costCenter", value: val },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
            </Tooltip>
          </div>

          <div className="w-[100px] ml-3">
            <Tooltip
              content={form.project ? `Project: ${form.project}` : "Select a project"}
            >
              <ProjectSelect
                value={form.project}
                onChange={(val) =>
                  onFormChange({
                    target: { name: "project", value: val },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
            </Tooltip>
          </div>

          <div className="w-[110px] ml-2">
            <Tooltip
              content={
                form.paymentType
                  ? `Mode of Payment: ${form.paymentType}`
                  : "Select a mode of payment"
              }
            >
              <SearchSelect2
                label="Mode of Payment"
                value={form.paymentType ?? ""}
                onChange={handleModeChange}
                fetchOptions={handleModeFetchOptions}
                required
              />
            </Tooltip>
          </div>

          <div className="w-[110px]">
            <Tooltip
              content={form.warehouse ? `Warehouse: ${form.warehouse}` : "Select a warehouse"}
            >
              <WarehouseSelect
                name="warehouse"
                value={form.warehouse || ""}
                onChange={handleTopWarehouseChange}
                required={form.updateStock}
                disabled={!form.updateStock}
              />
            </Tooltip>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Tooltip
              content={form.updateStock ? "Update Stock: Yes" : "Update Stock: No"}
            >
              <input
                type="checkbox"
                name="updateStock"
                checked={form.updateStock ?? false}
                onChange={onFormChange}
                className="w-3.5 h-3.5 accent-primary"
              />
            </Tooltip>
            <span className="text-xs text-main">Update Stock</span>
          </div>

        </div>
      </div>

      {/* ── Main Body ── */}
      <div className="grid grid-cols-[1fr_190px] gap-2">

        <ItemTable
          title="Order Items"
          paginatedItems={paginatedItems}
          formData={{ items }}
          ui={tableUI}
          actions={tableActions}
          symbol={symbol}
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          columnHeaders={<PIColumnHeaders items={items} />}
          renderRow={renderPIRow}
        />

        {/* RIGHT: Sidebar */}
        <div className="flex flex-col gap-2">

          <div className="bg-card rounded-lg p-2 w-full">
            <h3 className="text-[12px] font-semibold text-main mb-2">Supplier Details</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs text-main">
                <User size={16} className="text-muted shrink-0" />
                <span>{form.supplier || "Supplier Name"}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted">
                <Mail size={14} className="text-muted shrink-0" />
                <span>{form.supplierEmail || "supplier@example.com"}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted">
                <Phone size={14} className="text-muted shrink-0" />
                <span>{form.supplierPhone || "-"}</span>
              </div>
              {form.taxCategory && (
                <div className="mt-1">
                  <h3 className="text-[11px] font-semibold text-main mb-1">Order Information</h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Tax Category</span>
                      <span className="font-medium text-main">{form.taxCategory}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Currency</span>
                      <span className="font-medium text-main">{form.currency || "-"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

         <div className="bg-card rounded-lg p-3 w-full">
            <h3 className="text-[13px] font-semibold text-main mb-2">Summary</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Total Items</span>
                <span className="font-medium text-main">{items.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Total Quantity</span>
                <span className="font-medium text-main">{form.totalQuantity}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium text-main">
                  {symbol} {form.subTotal?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Total Tax</span>
                <span className="font-medium text-main">
                  {symbol} {form.totalTax?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="border-t border-theme my-1" />
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-main">Grand Total</span>
                <span className="text-main">
                  {symbol} {form.grandTotal?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="border-t border-theme my-1" />
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-main">Advance amount</span>
                <span className="text-main">
                  {symbol} {form.advanceAmount?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};