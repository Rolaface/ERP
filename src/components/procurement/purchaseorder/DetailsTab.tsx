import React, { useState, useEffect } from "react";
import { Trash2, Copy, User, Mail, Phone } from "lucide-react";
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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

// ─── PO column headers ────────────────────────────────────────────────────────

const POColumnHeaders: React.FC = () => (
  <tr className="border-b border-theme">
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[25px]">#</th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] min-w-[150px]">Item Name</th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[60px]">Pkg(UxS)</th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[110px]">Required By</th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[120px]">
      Warehouse <span className="text-danger">*</span>
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[70px]">Qty</th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[55px]">UOM</th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[65px] whitespace-nowrap">
      Rate <span className="text-danger">*</span>
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[50px]">Tax(%)</th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[10px] w-[55px] whitespace-nowrap">Tax Name</th>
    <th className="px-2 py-1 text-right text-muted font-medium text-[10px] w-[65px]">Amount</th>
    <th className="px-2 py-1 text-center text-muted font-medium text-[10px] w-[50px]">-</th>
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
  onBulkItemChange,
  fromPO,
  setFromPO,
}: DetailsTabProps) => {
  const symbol = getCurrencySymbol();

  const [page, setPage] = useState(0);
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(items.length / ITEMS_PER_PAGE) - 1);
    if (page > maxPage) setPage(maxPage);
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

  const handleTopWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
    setPage,
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
    return (
      <tr key={i} className="border-b border-theme bg-card hover:bg-primary/5 transition-colors">

        {/* # */}
        <td className="px-2 py-1.5 text-[10px] text-muted">{i + 1}</td>

        {/* Item Name — truncates in row, full name shown in dropdown */}
        <td className="px-2 py-1.5 min-w-[150px]">
          <Tooltip content={it.itemName ? `Item: ${it.itemName}` : "Select an item"}>
            <POItemSelect
              value={it.itemName}
              selectedId={it.itemCode}
              onChange={(item: any) => onItemSelect(item.id, i)}
            />
          </Tooltip>
        </td>

        {/* Packing */}
        <td className="px-2 py-1.5">
          <Tooltip content={`Packing: ${it.packingUnit || ""} × ${it.packingSize || ""}`}>
            <input
              type="text"
              value={it.itemCode ? `${it.packingUnit || ""}x${it.packingSize || ""}` : ""}
              onChange={(e) => {
                const value = e.target.value;
                const [unit, size] = value.split("x");
                onItemChange({ target: { name: "packingUnit", value: unit || "" } } as any, i);
                onItemChange({ target: { name: "packingSize", value: size || "" } } as any, i);
              }}
              className="w-[52px] h-[24px] text-[10px] text-center bg-card text-main border border-theme rounded-sm"
            />
          </Tooltip>
        </td>

        {/* Required By */}
        <td className="px-2 py-1.5">
          <div className="w-[105px]">
            <Tooltip content={it.requiredBy ? `Required By: ${it.requiredBy}` : "Select a date"}>
              <DatePickerInput
                name="requiredBy"
                value={it.requiredBy || ""}
                onChange={(name, value) =>
                  onItemChange({ target: { name, value } } as any, i)
                }
              />
            </Tooltip>
          </div>
        </td>

        {/* Warehouse */}
        <td className="px-2 py-1.5">
          <Tooltip content={it.warehouse ? `Warehouse: ${it.warehouse}` : "Select a warehouse"}>
            <WarehouseSelect
              compact
              value={it.warehouse || ""}
              onChange={(e) => onItemChange(e, i)}
            />
          </Tooltip>
        </td>

        {/* Qty */}
        <td className="px-2 py-1.5">
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

        {/* UOM */}
        <td className="px-2 py-1.5">
          <Tooltip content={it.uom ? `UOM: ${it.uom}` : "Unit of measure"}>
            <input
              name="uom"
              value={it.uom}
              disabled
              onChange={(e) => onItemChange(e, i)}
              className="w-[50px] py-1 px-1.5 border border-theme rounded text-[10px] bg-card text-main"
            />
          </Tooltip>
        </td>

        {/* Rate */}
        <td className="px-2 py-1.5">
          <Tooltip content={it.rate ? `Rate: ${symbol} ${it.rate}` : "Enter rate"}>
            <NumericInput
              name="rate"
              placeholder="0"
              value={it.rate ?? ""}
              decimalScale={4}
              onChange={(value) =>
                onItemChange({ target: { name: "rate", value } } as any, i)
              }
              className="w-[55px]"
            />
          </Tooltip>
        </td>

        {/* VAT Rate */}
        <td className="px-2 py-1.5">
          <Tooltip content={`VAT Rate: ${it.vatRate || "N/A"}`}>
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

        {/* VAT Code */}
        <td className="px-2 py-1.5">
          <Tooltip content={it.taxTypes?.length ? `Tax Types: ${it.taxTypes.join(", ")}` : "No Tax Types"}>
            <input
              name="vatCd"
              value={it.vatCd || ""}
              onChange={(e) => onItemChange(e, i)}
              disabled
              className="w-[46px] py-1 px-1.5 border border-theme rounded text-[10px] bg-card text-main"
            />
          </Tooltip>
        </td>

        {/* Amount */}
        <td className="px-2 py-1.5 text-right">
          <span className="text-[10px] font-medium text-main">
            {symbol} {amount.toFixed(2)}
          </span>
        </td>

        {/* Actions */}
        <td className="px-2 py-1.5 text-center">
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
    <div className="flex flex-col gap-4 max-h-screen overflow-auto p-4 bg-app text-main">

      {/* ── Top fields ── */}
      <div className="bg-app">
        <div className="flex gap-x-2 items-end mb-3 overflow-x-auto pb-1">

          <div className="w-[200px] shrink-0">
            <Tooltip content={form.supplier ? `Supplier: ${form.supplier}` : "Select a supplier"}>
              <SupplierSelect
                className="w-full"
                selectedId={form.supplierId}
                value={form.supplier}
                onChange={onSupplierChange}
              />
            </Tooltip>
          </div>

          <div className="w-[125px] shrink-0">
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

          <div className="w-[120px] shrink-0">
            <Tooltip content={form.costCenter ? `Cost Center: ${form.costCenter}` : "Select a cost center"}>
              <CostCenterSelect
                value={form.costCenter}
                onChange={(val) =>
                  onFormChange({ target: { name: "costCenter", value: val } } as React.ChangeEvent<HTMLInputElement>)
                }
              />
            </Tooltip>
          </div>

          <div className="w-[115px] shrink-0">
            <Tooltip content={form.project ? `Project: ${form.project}` : "Select a project"}>
              <ProjectSelect
                value={form.project}
                onChange={(val) =>
                  onFormChange({ target: { name: "project", value: val } } as React.ChangeEvent<HTMLInputElement>)
                }
              />
            </Tooltip>
          </div>

          <div className="w-[120px] shrink-0">
            <DatePickerInput
              label="Required By"
              name="requiredBy"
              value={form.requiredBy}
              onChange={(name, value) =>
                handleTopRequiredByChange({ target: { name, value } } as any)
              }
            />
          </div>

          <div className="w-[150px] shrink-0">
            <Tooltip content={form.warehouse ? `Warehouse: ${form.warehouse}` : "Select a warehouse"}>
              <WarehouseSelect
                value={form.warehouse || ""}
                onChange={handleTopWarehouseChange}
                required
              />
            </Tooltip>
          </div>

        </div>
      </div>

      {/* ── Main body ── */}
      <div className="grid grid-cols-[4fr_1fr] gap-4">
        <ItemTable
          title="Order Items"
          paginatedItems={paginatedItems}
          formData={{ items }}
          ui={tableUI}
          actions={tableActions}
          symbol={symbol}
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          columnHeaders={<POColumnHeaders />}
          renderRow={renderPORow}
        />

        {/* ── Right panel ── */}
        <div className="flex flex-col gap-2">
          <div className="bg-card rounded-lg p-2 w-[220px]">
            <h3 className="text-[12px] font-semibold text-main mb-2">Supplier Details</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs text-main">
                <User size={16} className="text-muted" />
                <span>{form.supplier || "Supplier Name"}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted">
                <Mail size={14} className="text-muted" />
                <span>{form.supplierEmail || "supplier@example.com"}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted">
                <Phone size={14} className="text-muted" />
                <span>{form.supplierPhone || "-"}</span>
              </div>
              {form.taxCategory && (
                <div className="bg-card rounded-lg mt-1">
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

          <div className="bg-card rounded-lg p-3 w-[220px]">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};