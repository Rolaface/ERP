import React, { useState, useEffect } from "react";
import { Trash2, Copy, User, Mail, Phone } from "lucide-react";
import type {
  ItemRow,
  PurchaseOrderFormData,
} from "../../../types/Supply/purchaseOrder";
import SupplierSelect from "../../selects/procurement/SupplierSelect";
import POItemSelect from "../../selects/procurement/POItemSelect";
import { ModalInput, ModalSelect } from "../../ui/modal/modalComponent";
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
  onDuplicateItem: (idx: number) => void; // ← new, wired from hook
  getCurrencySymbol: () => string;
  onBulkItemChange?: (field: keyof ItemRow, value: string) => void;

  fromPO?: boolean;
  setFromPO?: React.Dispatch<React.SetStateAction<boolean>>;
}

// ─── PO-specific column headers ───────────────────────────────────────────────

const POColumnHeaders: React.FC = () => (
  <tr className="border-b border-theme">
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[25px]">
      #
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[150px]">
      Item Name
    </th>
    {/* <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[180px]">
      Description
    </th> */}
    <th className="px-2 py-1 text-center text-muted font-medium text-[11px] w-[120px]">
      Packing(unit × size)
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[150px]">
      Required By
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[110px]">
      Warehouse <span className="text-danger">*</span>
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[90px]">
      Qty
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[70px]">
      UOM
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[70px] whitespace-nowrap">
      Rate <span className="text-danger">*</span>
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[60px]">
      Tax(%)
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[65px] whitespace-nowrap">
      Tax Name <span className="text-danger">*</span>
    </th>
    <th className="px-2 py-1 text-right text-muted font-medium text-[11px] w-[70px]">
      Amount
    </th>
    <th className="px-2 py-1 text-center text-muted font-medium text-[11px] w-[50px]">
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
  onBulkItemChange,
  fromPO,
  setFromPO,
}: DetailsTabProps) => {
  const symbol = getCurrencySymbol();

  const [page, setPage] = useState(0);

  // Keep page in range when items shrink
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(items.length / ITEMS_PER_PAGE) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [items.length]);

  const paginatedItems = items.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  // ── Bulk-change helpers ────────────────────────────────────────────────────

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

  // ── Bridge to ItemTable's action/ui interface ──────────────────────────────

  const tableActions: ItemTableActions = {
    // ItemTable calls handleItemChange(absoluteIndex, event)
    handleItemChange: (idx, e) => onItemChange(e, idx),
    removeItem: onRemoveItem,
    addItem: onAddItem,
    duplicateItem: onDuplicateItem,
    // updateItemDirectly not needed for PO rows
  };

  const tableUI: ItemTableUI = {
    page,
    setPage,
    itemCount: items.length,
  };

  // ── PO row renderer ────────────────────────────────────────────────────────

  const renderPORow = (
    it: ItemRow,
    i: number,
    helpers: {
      handleCopyRow: (i: number) => void;
      handleRemoveRow: (i: number) => void;
    },
  ) => {
    const amount = it.quantity * it.rate;
    return (
      <tr key={i} className="border-b border-theme bg-card row-hover">
        <td className="px-2 py-1 text-[10px]">{i + 1}</td>

        {/* Item Name */}
        <td className="px-2 py-1">
          <div className="w-[153px]">
            <Tooltip
              content={it.itemName ? `Item: ${it.itemName}` : "Select an item"}
            >
              <POItemSelect
                value={it.itemName}
                selectedId={it.itemCode}
                onChange={(item: any) => onItemSelect(item.id, i)}
              />
            </Tooltip>
          </div>
        </td>


        {/* Description */}
        {/* <td className="px-2 py-1">
          <Tooltip
            content={
              it.description
                ? `Description: ${it.description}`
                : "Enter description"
            }
          >
            <input
              name="description"
              value={it.description || ""}
              onChange={(e) => onItemChange(e, i)}
              className="w-[90px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Tooltip>
        </td> */}

        {/* Packing */}
        <td className="px-2 py-1">
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={`Packing Unit: ${it.packingUnit || " "}`}>
              <input
                type="number"
                name="packingUnit"
                value={it.packingUnit || ""}
                onChange={(e) => onItemChange(e, i)}
                className="w-[39px] py-1 px-1 border border-theme rounded text-[11px] bg-card text-main text-center no-spinner"
              />
            </Tooltip>
            <span className="text-muted text-[10px] font-bold">×</span>
            <Tooltip content={`Packing Size: ${it.packingSize || " "}`}>
              <input
                type="number"
                name="packingSize"
                value={it.packingSize || ""}
                onChange={(e) => onItemChange(e, i)}
                className="w-[39px] py-1 px-1 border border-theme rounded text-[11px] bg-card text-main text-center no-spinner"
              />
            </Tooltip>
          </div>
        </td>

        {/* Required By */}
        <td className="px-2 py-1">
          <div className="w-[125px]">
            <Tooltip
              content={
                it.requiredBy
                  ? `Required By: ${it.requiredBy}`
                  : "Select a date"
              }
            >
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
        <td className="px-2 py-1">
          <Tooltip
            content={
              it.warehouse ? `Warehouse: ${it.warehouse}` : "Select a warehouse"
            }
          >
            <WarehouseSelect
              compact
              value={it.warehouse || ""}
              onChange={(e) => onItemChange(e, i)}
            />
          </Tooltip>
        </td>

        {/* Qty */}
        <td className="px-2 py-1">
          <Tooltip
            content={
              it.quantity ? `Quantity: ${it.quantity}` : "Enter quantity"
            }
          >
            <input
              type="number"
              name="quantity"
              value={it.quantity}
              onChange={(e) => onItemChange(e, i)}
              className="w-[80px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
            />
          </Tooltip>
        </td>

        {/* UOM */}
        <td className="px-2 py-1">
          <Tooltip content={it.uom ? `UOM: ${it.uom}` : "Unit of measure"}>
            <input
              name="uom"
              value={it.uom}
              disabled
              onChange={(e) => onItemChange(e, i)}
              className="w-[60px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main"
            />
          </Tooltip>
        </td>

        {/* Rate */}
        <td className="px-2 py-1">
          <Tooltip
            content={it.rate ? `Rate: ${symbol} ${it.rate}` : "Enter rate"}
          >
            <input
              type="number"
              name="rate"
              value={it.rate}
              onChange={(e) => onItemChange(e, i)}
              className="w-[55px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
            />
          </Tooltip>
        </td>

        {/* VAT Rate */}
        <td className="px-2 py-1">
          <Tooltip content={`VAT Rate: ${it.vatRate || "N/A"}`}>
            <input
              type="number"
              name="vatRate"
              value={it.vatRate}
              onChange={(e) => onItemChange(e, i)}
              className="w-[54px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
            />
          </Tooltip>
        </td>

        {/* VAT Code */}
        <td className="px-2 py-1">
          <Tooltip content={`VAT Code: ${it.vatCd || "N/A"}`}>
            <input
              name="vatCd"
              value={it.vatCd || ""}
              onChange={(e) => onItemChange(e, i)}
              className="w-[46px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Tooltip>
        </td>

        {/* Amount */}
        <td className="px-2 py-1 text-right">
          <span className="text-[10px] font-medium text-main">
            {symbol} {amount.toFixed(2)}
          </span>
        </td>

        {/* Actions — copy + delete */}
        <td className="px-2 py-1 text-center">
          <div className="flex items-center justify-center gap-1">
            <Tooltip content="Duplicate row below">
              <button
                type="button"
                onClick={() => helpers.handleCopyRow(i)}
                className="p-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            </Tooltip>
            <button
              type="button"
              onClick={() => helpers.handleRemoveRow(i)}
              className="p-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col gap-4 max-h-screen overflow-auto p-4 bg-app text-main">
      {/* ── Top fields ────────────────────────────────────────────────────── */}
      <div className="bg-app">
        <div className="flex flex-wrap gap-x-2 gap-y-3 items-end mb-3">
          <div className="w-[240px]">
            <Tooltip
              content={
                form.supplier
                  ? `Supplier: ${form.supplier}`
                  : "Select a supplier"
              }
            >
              <SupplierSelect
                className="w-full"
                selectedId={form.supplierId}
                value={form.supplier}
                onChange={onSupplierChange}
              />
            </Tooltip>
          </div>

          <div className="w-[142px]">
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

          <div className="w-[135px]">
            <ModalSelect
              label="Status"
              name="status"
              value={form.status}
              disabled={!fromPO}
              onChange={onFormChange}
              options={[
                { value: "Draft", label: "Draft" },
                { value: "On Hold", label: "On Hold" },
                { value: "To Receive and Bill", label: "To Receive and Bill" },
                { value: "To Receive", label: "To Receive" },
                { value: "To Bill", label: "To Bill" },
                { value: "Completed", label: "Completed" },
                { value: "Cancelled", label: "Cancelled" },
                { value: "Closed", label: "Closed" },
              ]}
            />
          </div>

          <div className="w-[135px]">
            <Tooltip
              content={
                form.costCenter
                  ? `Cost Center: ${form.costCenter}`
                  : "Select a cost center"
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

          <div className="w-[130px]">
            <Tooltip
              content={
                form.project ? `Project: ${form.project}` : "Select a project"
              }
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

          <div className="w-[135px]">
            <DatePickerInput
              label="Required By"
              name="requiredBy"
              value={form.requiredBy}
              onChange={(name, value) =>
                handleTopRequiredByChange({ target: { name, value } } as any)
              }
            />
          </div>

          <div className="w-[135px]">
            <Tooltip
              content={
                form.warehouse
                  ? `Warehouse: ${form.warehouse}`
                  : "Select a warehouse"
              }
            >
              <WarehouseSelect
                value={form.warehouse || ""}
                onChange={handleTopWarehouseChange}
                required
              />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ── Main body ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[4fr_1fr] gap-4">
        {/* Generic ItemTable with PO-specific columns */}
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

        {/* ── Right panel: supplier details + summary ──────────────────── */}
        <div className="flex flex-col gap-2">
          <div className="bg-card rounded-lg p-2 w-[220px]">
            <h3 className="text-[12px] font-semibold text-main mb-2">
              Supplier Details
            </h3>
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
                  <h3 className="text-[11px] font-semibold text-main mb-1">
                    Order Information
                  </h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Tax Category</span>
                      <span className="font-medium text-main">
                        {form.taxCategory}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Currency</span>
                      <span className="font-medium text-main">
                        {form.currency || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg p-3 w-[220px]">
            <h3 className="text-[13px] font-semibold text-main mb-2">
              Summary
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Total Items</span>
                <span className="font-medium text-main">{items.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Total Quantity</span>
                <span className="font-medium text-main">
                  {form.totalQuantity}
                </span>
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
