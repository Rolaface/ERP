import React, { useState, useEffect } from "react";
import { Plus, Trash2, User, Mail, Phone, ToolCase } from "lucide-react";
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
  getCurrencySymbol: () => string;
  onBulkItemChange?: (field: keyof ItemRow, value: string) => void;

  fromPO?: boolean;
  setFromPO?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DetailsTab = ({
  form,
  items,
  onFormChange,
  onSupplierChange,
  onItemChange,
  onItemSelect,
  onAddItem,
  onRemoveItem,
  getCurrencySymbol,
  onBulkItemChange,
  fromPO,
  setFromPO,
}: DetailsTabProps) => {
  const symbol = getCurrencySymbol();

  const ITEMS_PER_PAGE = 5;
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
    if (onBulkItemChange) {
      onBulkItemChange("requiredBy", (e.target as HTMLInputElement).value);
    }
  };

  const handleTopWarehouseChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    onFormChange(e);

    if (onBulkItemChange) {
      onBulkItemChange("warehouse", e.target.value);
    }
  };
  return (
    <div className="flex flex-col gap-4 max-h-screen overflow-auto p-4 bg-app text-main">
      {/* TOP FIELDS */}
      <div className="bg-app">
        <div className="flex flex-wrap gap-x-2 gap-y-3 items-end mb-3">
          <div className="w-[240px]">
            <Tooltip content = {form.supplier ? `Supplier: ${form.supplier}` : 'Select a supplier'}>
            <SupplierSelect
              className="w-full"
              selectedId={form.supplierId}
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
                onFormChange({
                  target: { name, value },
                } as any)
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
            <Tooltip content={form.costCenter ? `Cost Center: ${form.costCenter}` : 'Select a cost center'}>
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

          {/* Project */}
          <div className="w-[130px]">
            <Tooltip content={form.project ? `Project: ${form.project}` : 'Select a project'}>
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
                handleTopRequiredByChange({
                  target: { name, value },
                } as any)
              }
            />
          </div>

          {/* Warehouse */}
          <div className="w-[135px]">
            <Tooltip content={form.warehouse ? `Warehouse: ${form.warehouse}` : 'Select a warehouse'}>
            <WarehouseSelect
              value={form.warehouse || ""}
              onChange={handleTopWarehouseChange}
              required
            />
            </Tooltip>
          </div>


          <div className="w-[135px]">
           <Tooltip content={form.referenceNumber ? `Reference Code: ${form.referenceNumber}` : 'Enter a reference code'}>
            <ModalInput
              label="Reference Code"
              name="referenceNumber"
              value={form.referenceNumber}
              onChange={onFormChange}
            />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="grid grid-cols-[4fr_1fr] gap-4">
        {/* LEFT: Order Items Table */}
        <div className="bg-card rounded-lg p-2 shadow-sm flex-1">
          <div className="flex items-center gap-1 mb-2">
            <h3 className="text-sm font-semibold text-main">Order Items</h3>
          </div>

          <div>
            <table className="w-full border-collapse text-[10px] table-fixed">
              <thead>
                <tr className="border-b border-theme">
                  <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[25px]">
                    #
                  </th>
                  <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[150px]">
                    Item Name
                  </th>
                  <th className="px-2 py-1 text-center text-muted font-medium text-[11px] w-[120px]">
                    Packing
                    <span className="ml-1 text-[9px] text-muted/60 font-normal">
                      (unit × size)
                    </span>
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
                    Tax Code <span className="text-danger">*</span>
                  </th>
                  <th className="px-2 py-1 text-right text-muted font-medium text-[11px] w-[70px]">
                    Amount
                  </th>
                  <th className="px-2 py-1 text-center text-muted font-medium text-[11px] w-[35px]">
                    -
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedItems.map((it, idx) => {
                  const i = page * ITEMS_PER_PAGE + idx;
                  const amount = it.quantity * it.rate;

                  return (
                    <tr
                      key={i}
                      className="border-b border-theme bg-card row-hover"
                    >
                      <td className="px-2 py-1 text-[10px]">{i + 1}</td>

                      <td className="px-2 py-1">
                        <div className="w-[153px]">
                          <Tooltip content={it.itemName ? `Item: ${it.itemName}` : 'Select an item'}>
                          <POItemSelect
                            value={it.itemName}
                            selectedId={it.itemCode}
                            onChange={(item: any) => onItemSelect(item.id, i)}
                          />
                          </Tooltip>
                        </div>
                      </td>

                      <td className="px-2 py-1">
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip content={`Packing Unit: ${it.packingUnit || 'N/A'}, Packing Size: ${it.packingSize || 'N/A'}`}>
                          <input
                            type="number"
                            name="packingUnit"
                            value={it.packingUnit || ""}
                            onChange={(e) => onItemChange(e, i)}
                            className="w-[39px] py-1 px-1 border border-theme rounded text-[11px] bg-card text-main text-center no-spinner"
                          />
                          </Tooltip>
                          <span className="text-muted text-[10px] font-bold">
                            ×
                          </span>
                          <Tooltip content={`Packing Size: ${it.packingSize || 'N/A'}`}>
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

                      <td className="px-2 py-1">
                        <div className="w-[125px]">
                          <Tooltip content={it.requiredBy ? `Required By: ${it.requiredBy}` : 'Select a required by date'}>
                          <DatePickerInput
                            name="requiredBy"
                            value={it.requiredBy || ""}
                            onChange={(name, value) =>
                              onItemChange(
                                {
                                  target: { name, value },
                                } as any,
                                i,
                              )
                            }
                          />
                          </Tooltip>
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <Tooltip content={it.warehouse ? `Warehouse: ${it.warehouse}` : 'Select a warehouse'}>
                        <WarehouseSelect
                          compact
                          value={it.warehouse || ""}
                          onChange={(e) => onItemChange(e, i)}
                        />
                        </Tooltip>
                      </td>

                      <td className="px-2 py-1">
                        <Tooltip content={it.quantity ? `Quantity: ${it.quantity}` : 'Enter quantity'}>
                        <input
                          type="number"
                          className="w-[80px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                          name="quantity"
                          value={it.quantity}
                          onChange={(e) => onItemChange(e, i)}
                        />
                        </Tooltip>
                      </td>

                      <td className="px-2 py-1">
                        <Tooltip content={it.uom ? `Unit of Measure: ${it.uom}` : 'Enter unit of measure'}>

                        <input
                          className="w-[60px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                          name="uom"
                          value={it.uom}
                          onChange={(e) => onItemChange(e, i)}
                          disabled
                        />
                        </Tooltip>
                      </td>

                      <td className="px-2 py-1">
                        <Tooltip content={it.rate ? `Rate: ${symbol} ${it.rate}` : 'Enter rate'}>

                        <input
                          type="number"
                          className="w-[55px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                          name="rate"
                          value={it.rate}
                          onChange={(e) => onItemChange(e, i)}
                        />
                        </Tooltip>
                      </td>

                      <td className="px-2 py-1">
                        <Tooltip content={`VAT Rate: ${it.vatRate || 'N/A'}`}>

                        <input
                          type="number"
                          className="w-[54px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                          name="vatRate"
                          value={it.vatRate}
                          onChange={(e) => onItemChange(e, i)}
                        />
                        </Tooltip>
                      </td>

                      <td className="px-2 py-1">
                        <Tooltip content={`VAT Code: ${it.vatCd || 'N/A'}`}>

                        <input
                          className="w-[46px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                          name="vatCd"
                          value={it.vatCd || ""}
                          onChange={(e) => onItemChange(e, i)}
                        />
                        </Tooltip>
                      </td>

                      <td className="px-2 py-1 text-right">
                        <span className="text-[10px] font-medium text-main">
                          {symbol} {amount.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-2 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(i)}
                          className="p-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition text-[10px]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex justify-between items-center gap-3">
            <button
              type="button"
              onClick={onAddItem}
              className="px-4 py-1.5 bg-primary hover:bg-[var(--primary-600)] text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} />
              Add Item
            </button>

            {(items.length > 5 || page > 0) && (
              <div className="flex items-center gap-3 py-1 px-2 bg-app rounded">
                <div className="text-[11px] text-muted whitespace-nowrap">
                  Showing {page * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min((page + 1) * ITEMS_PER_PAGE, items.length)} of{" "}
                  {items.length} items
                </div>
                <div className="flex gap-1.5 items-center">
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px]"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(page + 1)}
                    disabled={(page + 1) * ITEMS_PER_PAGE >= items.length}
                    className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px]"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Supplier Details + Summary */}
        <div className="flex flex-col gap-2">
          <div className="bg-card rounded-lg p-2 w-[220px]">
            <h3 className="text-[12px] font-semibold text-main mb-2">
              Supplier Details
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs text-main">
                <span className="flex items-center gap-2">
                  <User size={16} className="text-muted" />
                  <span className="text-xs text-main">
                    {form.supplier || "Supplier Name"}
                  </span>
                </span>
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
              <div className="border-t border-theme my-1"></div>
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
