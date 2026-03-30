import React, { useState, useEffect } from "react";
import { Plus, Trash2, User, Mail, Phone } from "lucide-react";
import type {
  ItemRow,
  PurchaseInvoiceFormData,
} from "../../../types/Supply/purchaseInvoice";
import SupplierSelect from "../../selects/procurement/SupplierSelect";
import POItemSelect from "../../selects/procurement/POItemSelect";
import { ModalInput, ModalSelect } from "../../ui/modal/modalComponent";
import WarehouseSelect from "../../selects/WarehouseSelect";
import DatePickerInput from "../../calendar/DatePickerInput";
import CostCenterSelect from "../../selects/CostCenterSelect";
import ProjectSelect from "../../selects/ProjectSelect";
import  Tooltip from "../../Tooltip";

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
  getCurrencySymbol: () => string;
  poLoading: boolean;
  poList: any[];
  onPOSelect: (po: any) => void;
  usePO: boolean;
  onTogglePO: (checked: boolean) => void;
  onBulkItemChange?: (field: keyof ItemRow, value: string) => void;
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
  poList,
  onPOSelect,
  usePO,
  onTogglePO,
  onBulkItemChange,
}: DetailsTabProps) => {
  const symbol = getCurrencySymbol();

  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(0);
  const handleTopWarehouseChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    onFormChange(e);
    if (onBulkItemChange) {
      onBulkItemChange("warehouse", e.target.value);
    }
  };

  // UI state to toggle between PO selection and manual input

  useEffect(() => {
    const newPage = Math.floor((items.length - 1) / ITEMS_PER_PAGE);
    if (newPage !== page) setPage(newPage);
  }, [items.length]);

  const paginatedItems = items.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  return (
    <div className="flex flex-col gap-4 h-full bg-app text-main">
      {/* ── Top fields ── */}
      <div className="bg-app">
        <div className="flex flex-wrap gap-x-3 gap-y-3 items-end">
          <div className="w-[250px]">
            <Tooltip content={form.supplier ? `Supplier: ${form.supplier}` : 'Select a supplier'}>
            <SupplierSelect
              selectedId={form.supplierId}
              onChange={onSupplierChange}
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
                <Tooltip content={form.poNumber ? `PO Number: ${form.poNumber}` : 'Select a PO'}>
                <ModalSelect
                  label=""
                  name="poNumber"
                  value={form.poNumber}
                  placeholder="Select PO"
                  options={(poList || [])
                    .filter((po) => po.status === "Approved")
                    .map((po) => ({
                      label: po.poId,
                      value: po.poId,
                    }))}
                  onChange={(e) => {
                    const selected = poList.find(
                      (p) => p.poId === e.target.value,
                    );
                    if (selected) onPOSelect(selected);
                  }}
                />
                </Tooltip>
              ) : (
                <Tooltip content={form.poNumber ? `PO Number: ${form.poNumber}` : 'Enter PO number manually'}>
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
            <span className="block h-5"></span> {/* Spacer for alignment */}
            <Tooltip content={form.supplierInvoiceNumber ? `Supplier Invoice No: ${form.supplierInvoiceNumber}` : 'Enter supplier invoice number'}>
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
            <Tooltip content={form.supplierInvoiceDate ? `Supplier Invoice Date: ${form.supplierInvoiceDate}` : 'Enter supplier invoice date'}>
            <DatePickerInput
              label="Supplier Invoice Date"
              name="supplierInvoiceDate"
              value={form.supplierInvoiceDate || ""}
              onChange={(name, value) =>
                onFormChange({
                  target: { name, value },
                } as any)
              }
            />
            </Tooltip>
          </div>
          <div className="w-[128px] ml-2">
            <Tooltip content={form.date ? `Date: ${form.date}` : 'Enter date'}>
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
            </Tooltip>
          </div>


          <div className="w-[130px] ml-4">
            <Tooltip content={form.status ? `Status: ${form.status}` : 'Select a status'}>
            <ModalSelect
              label="Status"
              name="status"
              value={form.status}
              disabled
              onChange={onFormChange}
              options={[
                { value: "Draft", label: "Draft" },
                { value: "Return", label: "Return" },
                { value: "Submitted", label: "Submitted" },
                { value: "Paid", label: "Paid" },
                { value: "Cancelled", label: "Cancelled" },
                { value: "Internal Transfer", label: "Internal Transfer" },
                { value: "Debit Note Issued", label: "Debit Note Issued" },
                { value: "Party Paid", label: "Party Paid" },
              ]}
            />
            </Tooltip>
          </div>

          <div className="w-[100px] ml-3">
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

          <div className="w-[100px] ml-3">
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

          <div className="w-[110px] ml-3">
            <Tooltip content={form.transactionProgress ? `Transaction Progress: ${form.transactionProgress}` : 'Select transaction progress'}>
            <ModalSelect
              label="Transaction Progress"
              name="transactionProgress"
              value={form.transactionProgress}
              onChange={onFormChange}
              required
              options={[
                { value: "APPROVED", label: "Approved" },
                { value: "REFUNDED", label: "Refunded" },
                { value: "TRANSFERRED", label: "Transferred" },
                { value: "REJECTED", label: "Rejected" },
              ]}
            />
            </Tooltip>
          </div>

          <div className="w-[110px] ml-2">
            <Tooltip content={form.paymentType ? `Payment Type: ${form.paymentType}` : 'Select payment type'}>

            <ModalSelect
              label="Payment Type"
              name="paymentType"
              value={form.paymentType}
              required
              onChange={onFormChange}
              options={[
                { value: "CASH", label: "CASH" },
                { value: "CREDIT", label: "CREDIT" },
                { value: "Bank transfer", label: "Bank transfer" },
                { value: "CASH/CREDIT", label: "CASH/CREDIT" },
                { value: "BANK CHECK", label: "BANK CHECK" },
                { value: "MOBILE MONEY", label: "Mobile Money" },
                { value: "DEBIT & CREDIT CARD", label: "Card" },
                { value: "OTHER", label: "Other" },
              ]}
            />
            </Tooltip>
          </div>
          <div className="w-[110px]">
              <Tooltip content={form.warehouse ? `Warehouse: ${form.warehouse}` : 'Select a warehouse'}>
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
            <Tooltip content={form.updateStock ? 'Update Stock: Yes' : 'Update Stock: No'}>
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
      <div className="grid grid-cols-[4fr_1fr] gap-4">
        {/* LEFT: Table */}
        <div className="bg-card rounded-lg p-2 shadow-sm flex-1">
          <div className="flex items-center gap-1 mb-2">
            <h3 className="text-sm font-semibold text-main">Order Items</h3>
          </div>

          <table className="w-full border-collapse text-[10px] table-fixed">
            <thead>
              <tr className="border-b border-theme">
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[25px]">
                  #
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[130px]">
                  Item
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[76px]">
                  Description
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[110px]">
                  Packing
                  <span className="ml-1 text-[9px] font-normal text-muted/60">
                    (unit × size)
                  </span>
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[90px]">
                  Batch No{" "}
                  {items.some((it) => it.requiresBatch) && (
                    <span className="text-danger">*</span>
                  )}
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[80px]">
                  Qty
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[130px]">
                  Mfg Date
                </th>

                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[130px]">
                  Expiry Date
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[65px] whitespace-nowrap">
                  Unit Price <span className="text-danger">*</span>
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[100px]">
                  Warehouse
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[60px]">
                  Dis (%)
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[60px]">
                  Tax
                </th>
                <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[63px] whitespace-nowrap">
                  Tax Code <span className="text-danger">*</span>
                </th>
                <th className="px-2 py-1  text-muted font-medium text-[11px] w-[80px] text-right">
                  Amount
                </th>

                <th className="w-[30px]" />
              </tr>
            </thead>

            <tbody>
              {paginatedItems.map((it, idx) => {
                const i = page * ITEMS_PER_PAGE + idx;
                const qty = Number(it.quantity || 0);
                const rate = Number(it.rate || 0);
                const discount = Number(it.discount || 0);
                const vatRate = Number(it.vatRate || 0);

                const lineAmount = qty * rate;
                const discountAmount = lineAmount * (discount / 100);
                const netAmount = lineAmount - discountAmount;
                const taxAmount = netAmount * (vatRate / 100);

                const amount = netAmount + taxAmount;

                return (
                  <tr
                    key={i}
                    className="border-b border-theme bg-card row-hover"
                  >
                    <td className="px-2 py-1 text-[10px]">{i + 1}</td>

                    {/* ITEM */}
                    <td className="px-2 py-1">
                      <div className="w-[125px]">
                          <Tooltip content={it.itemName ? `Item: ${it.itemName}` : 'Select an item'}>
                        <POItemSelect
                          value={it.itemName}
                          selectedId={it.itemCode}
                          onChange={(item: any) => onItemSelect(item.id, i)}
                        />
                        </Tooltip>
                      </div>
                    </td>

                    {/* DESCRIPTION */}
                    <td className="px-2 py-1">
                      <Tooltip content={it.description || 'Enter item description'}>
                      <input
                        name="description"
                        value={it.description || ""}
                        onChange={(e) => onItemChange(e, i)}
                        className="w-[70px] py-1 px-2 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      </Tooltip>
                    </td>

                    {/* PACKING */}
                    <td className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          name="packingUnit"
                          value={it.packingUnit || ""}
                          onChange={(e) => onItemChange(e, i)}
                          className="w-[39px] py-1 px-1 border border-theme rounded text-[11px] bg-card text-main text-center no-spinner"
                        />

                        <span className="text-muted text-[10px] font-bold">
                          ×
                        </span>

                        <input
                          type="number"
                          name="packingSize"
                          value={it.packingSize || ""}
                          onChange={(e) => onItemChange(e, i)}
                          className="w-[39px] py-1 px-1 border border-theme rounded text-[11px] bg-card text-main text-center no-spinner"
                        />
                      </div>
                    </td>

                    {/* BATCH */}
                    <td className="px-2 py-1">
                      <input
                        name="batchNo"
                        value={it.batchNo || ""}
                        onChange={(e) => onItemChange(e, i)}
                        required={it.requiresBatch}
                        className="w-[85px] py-1 px-2 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>

                    {/* QTY */}
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        name="quantity"
                        value={it.quantity}
                        onChange={(e) => onItemChange(e, i)}
                        className="w-[75px]  py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                      />
                    </td>

                    {/* MFG DATE */}
                    <td className="px-2 py-1">
                      <div style={{ width: "125px" }}>
                        <DatePickerInput
                          name="mfgDate"
                          value={it.mfgDate || ""}
                          onChange={(name, value) =>
                            onItemChange(
                              {
                                target: { name, value },
                              } as any,
                              i,
                            )
                          }
                        />
                      </div>
                    </td>

                    {/* EXPIRY DATE */}
                    <td className="px-2 py-1">
                      <div style={{ width: "125px" }}>
                        <DatePickerInput
                          name="expDate"
                          value={it.expDate || ""}
                          onChange={(name, value) =>
                            onItemChange(
                              {
                                target: { name, value },
                              } as any,
                              i,
                            )
                          }
                        />
                      </div>
                    </td>

                    {/* RATE */}
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        name="rate"
                        value={it.rate}
                        onChange={(e) => onItemChange(e, i)}
                        className="w-[56px]  py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                      />
                    </td>
                    {/* WAREHOUSE */}
                    <td className="px-2 py-1">
                      <WarehouseSelect
                        compact
                        value={it.warehouse || ""}
                        onChange={(e: any) =>
                          onItemChange(
                            {
                              target: {
                                name: "warehouse",
                                value: e.target?.value ?? e,
                              },
                            } as any,
                            i,
                          )
                        }
                        disabled={!form.updateStock}
                      />
                    </td>

                    {/* DISCOUNT */}
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        name="discount"
                        value={it.discount || 0}
                        onChange={(e) => onItemChange(e, i)}
                        className="w-[55px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                      />
                    </td>

                    {/* TAX */}
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        name="vatRate"
                        value={it.vatRate}
                        onChange={(e) => onItemChange(e, i)}
                        className="w-[55px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                      />
                    </td>

                    {/* TAX CODE */}
                    <td className="px-2 py-1">
                      <input
                        name="vatCd"
                        value={it.vatCd || ""}
                        onChange={(e) => onItemChange(e, i)}
                        className="w-[50px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>

                    {/* AMOUNT */}
                    <td className="px-1 py-1.5 text-right">
                      <span className="text-[10px] font-medium text-main">
                        {symbol} {amount.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(i)}
                        className="p-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

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

        {/* RIGHT: Sidebar */}
        <div className="flex flex-col gap-2">
          <div className="bg-card rounded-lg p-2 w-[220px]">
            <h3 className="text-[12px] font-semibold text-main mb-2">
              Supplier Details
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <User size={16} className="text-muted shrink-0" />
                <span className="text-xs text-main">
                  {form.supplier || "Supplier Name"}
                </span>
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
