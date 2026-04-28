import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../ui/modal/formComponent";
import { ModalSelect } from "../../ui/modal/modalComponent";
import type { SupplierRow, ItemRow } from "../../../types/Supply/rfq";
import DatePickerInput from "../../calendar/DatePickerInput";
import SupplierSelect from "../../selects/procurement/SupplierSelect";
import RfqItemSelect from "../../selects/procurement/RfqItemSelect";
import WarehouseSelect from "../../selects/WarehouseSelect";
import { getSupplierById } from "../../../api/procurement/supplierApi";

interface DetailsTabProps {
  rfqNumber: string;
  requestDate: string;
  quoteDeadline: string;
  status: string;
  suppliers: SupplierRow[];
  items: ItemRow[];
  onRfqNumberChange: (v: string) => void;
  onRequestDateChange: (v: string) => void;
  onQuoteDeadlineChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onSupplierChange: (idx: number, field: keyof SupplierRow, value: any) => void;
  onAddSupplier: () => void;
  onRemoveSupplier: (idx: number) => void;
  onItemChange: (idx: number, field: keyof ItemRow, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (idx: number) => void;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({
  rfqNumber,
  requestDate,
  quoteDeadline,
  status,
  suppliers,
  items,
  onRfqNumberChange,
  onRequestDateChange,
  onQuoteDeadlineChange,
  onStatusChange,
  onSupplierChange,
  onAddSupplier,
  onRemoveSupplier,
  onItemChange,
  onAddItem,
  onRemoveItem,
}) => {
  const ITEMS_PER_PAGE = 4;

  const [supPage, setSupPage] = useState(0);
  const [itemPage, setItemPage] = useState(0);

  useEffect(() => {
    const newPage = Math.max(
      0,
      Math.floor((suppliers.length - 1) / ITEMS_PER_PAGE),
    );
    if (newPage !== supPage) setSupPage(newPage);
  }, [suppliers.length]);

  useEffect(() => {
    const newPage = Math.max(
      0,
      Math.floor((items.length - 1) / ITEMS_PER_PAGE),
    );
    if (newPage !== itemPage) setItemPage(newPage);
  }, [items.length]);

  const paginatedSuppliers = suppliers.slice(
    supPage * ITEMS_PER_PAGE,
    (supPage + 1) * ITEMS_PER_PAGE,
  );

  const paginatedItems = items.slice(
    itemPage * ITEMS_PER_PAGE,
    (itemPage + 1) * ITEMS_PER_PAGE,
  );

  return (
    <div className="flex flex-col gap-4 overflow-visible p-4 relative bg-app text-main">
      {/* ── HEADER ── */}
      <div className="bg-app">
        <div className="flex flex-wrap gap-x-2 gap-y-3 items-end mb-3">

          {/* Request Date */}
          <div className="w-[140px]">
            <DatePickerInput
              label="Request Date"
              name="requestDate"
              value={requestDate}
              onChange={(name, value) => onRequestDateChange(value)}
            />
          </div>

          {/* Quote Deadline */}
          <div className="w-[140px]">
            <DatePickerInput
              label="Quote Deadline"
              name="quoteDeadline"
              value={quoteDeadline}
              onChange={(name, value) => onQuoteDeadlineChange(value)}
            />
          </div>

          {/* Status */}
          <div className="w-[120px]">
            <ModalSelect
              label="Status"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              options={[{ value: "Draft", label: "Draft" }]}
              disabled
            />
          </div>

        </div>
      </div>

      {/* ── BODY ── */}
      <div className="grid grid-cols-[4fr_1fr] gap-4">

        {/* ===== LEFT ===== */}
        <div className="flex flex-col gap-4">

          {/* SUPPLIERS TABLE */}
          <div className="bg-card rounded-lg p-2 shadow-sm">
            <h3 className="text-sm font-semibold mb-2">Suppliers</h3>

            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-theme text-muted">
                  <th className="px-2 py-1 text-left w-[25px]">#</th>
                  <th className="px-2 py-1 text-left w-[180px]">Supplier <span className="text-danger">*</span></th>
                  <th className="px-2 py-1 text-left">Contact</th>
                  <th className="px-2 py-1 text-left">Email</th>
                  <th className="px-2 py-1 text-center w-[50px]">Send</th>
                  <th className="px-2 py-1 text-center w-[40px]">-</th>
                </tr>
              </thead>

              <tbody>
                {paginatedSuppliers.map((sup, idx) => {
                  const i = supPage * ITEMS_PER_PAGE + idx;
                  return (
                    <tr key={i} className="border-b border-theme row-hover">
                      <td className="px-2 py-1 text-[10px]">{i + 1}</td>


                      <td className="px-2 py-1">
                        <div className="w-[180px]">
                          <SupplierSelect
                            label=""
                            value={sup.supplierName}
                            selectedId={sup.supplier}
                            required
                            onChange={async (selected: any) => {
                              onSupplierChange(i, "supplier", selected.id ?? "");
                              onSupplierChange(i, "supplierName", selected.name ?? "");

                              try {
                                const res = await getSupplierById(selected.id);
                                const detail = res?.message?.data ?? res?.data ?? res;
                                const primaryContact =
                                  detail?.contacts?.find((c: any) => c.isPrimary) ||
                                  detail?.contacts?.[0];
                                onSupplierChange(i, "contact", primaryContact?.id ?? "");
                                onSupplierChange(i, "email", primaryContact?.email ?? "");
                              } catch {
                              }
                            }}

                          />
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-2 py-1">
                        <input
                          readOnly
                          value={sup.contact}
                          placeholder="Auto-filled"
                          className="w-full py-1 px-2 border border-theme rounded text-[11px] bg-card text-main opacity-70"
                        />
                      </td>

                      {/* Email — read-only, auto-filled */}
                      <td className="px-2 py-1">
                        <input
                          readOnly
                          value={sup.email}
                          placeholder="Auto-filled"
                          className="w-full py-1 px-2 border border-theme rounded text-[11px] bg-card text-main opacity-70"
                        />
                      </td>

                      {/* Send Email checkbox */}
                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={sup.sendEmail}
                          onChange={(e) =>
                            onSupplierChange(i, "sendEmail", e.target.checked)
                          }
                        />
                      </td>

                      {/* Remove */}
                      <td className="px-2 py-1 text-center">
                        <Button
                          variant="ghost"
                          onClick={() => onRemoveSupplier(i)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Suppliers Footer */}
            <div className="mt-3 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={onAddSupplier}
                className="px-4 py-1.5 bg-primary text-white rounded text-xs flex items-center gap-1"
              >
                <Plus size={14} /> Add Supplier
              </button>

              {(suppliers.length > ITEMS_PER_PAGE || supPage > 0) && (
                <div className="flex items-center gap-3 py-1 px-2 bg-app rounded">
                  <span className="text-[11px] text-muted whitespace-nowrap">
                    {supPage * ITEMS_PER_PAGE + 1}–
                    {Math.min(
                      (supPage + 1) * ITEMS_PER_PAGE,
                      suppliers.length,
                    )}{" "}
                    of {suppliers.length}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSupPage(Math.max(0, supPage - 1))}
                      disabled={supPage === 0}
                      className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px] disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupPage(supPage + 1)}
                      disabled={
                        (supPage + 1) * ITEMS_PER_PAGE >= suppliers.length
                      }
                      className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div className="bg-card rounded-lg p-2 shadow-sm overflow-visible relative">
            <h3 className="text-sm font-semibold mb-2">Items</h3>

            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-theme text-muted">
                  <th className="px-2 py-1 text-left w-[25px]">#</th>
                  <th className="px-2 py-1 text-left w-[180px]">Item <span className="text-danger">*</span></th>
                  <th className="px-2 py-1 text-left w-[130px]">Required By <span className="text-danger">*</span></th>
                  <th className="px-2 py-1 text-left w-[80px]">Qty</th>
                  <th className="px-2 py-1 text-left w-[80px]">UOM</th>
                  <th className="px-2 py-1 text-left w-[130px]">Warehouse <span className="text-danger">*</span></th>
                  <th className="px-2 py-1 text-center w-[40px]">-</th>
                </tr>
              </thead>

              <tbody>
                {paginatedItems.map((it, idx) => {
                  const i = itemPage * ITEMS_PER_PAGE + idx;
                  return (
                    <tr key={i} className="border-b border-theme row-hover">
                      <td className="px-2 py-1 text-[10px]">{i + 1}</td>


                      <td className="px-2 py-1">
                        <div className="w-[180px]">
                          <RfqItemSelect
                            value={it.itemName}
                            required
                            selectedId={it.itemCode}
                            onChange={(detail: any) => {
                              onItemChange(i, "itemCode", detail.id ?? "");
                              onItemChange(
                                i,
                                "itemName",
                                detail.itemName ?? "",
                              );
                              onItemChange(
                                i,
                                "description",
                                detail.description ?? "",
                              );
                              onItemChange(
                                i,
                                "uom",
                                detail.unitOfMeasureCd ?? "",
                              );
                            }}
                          />
                        </div>
                      </td>

                      {/* Required Date */}
                      <td className="px-2 py-1">
                        <div className="w-[120px]">
                          <DatePickerInput
                            name="requiredDate"
                            value={it.requiredDate}
                            onChange={(name, value) =>
                              onItemChange(i, "requiredDate", value)
                            }
                            required
                          />
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          value={it.quantity}
                          min={1}
                          onChange={(e) =>
                            onItemChange(i, "quantity", Number(e.target.value))
                          }
                          className="w-[70px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                        />
                      </td>

                      {/* UOM — read-only, auto-filled from item select */}
                      <td className="px-2 py-1">
                        <input
                          readOnly
                          value={it.uom}
                          placeholder="Auto"
                          className="w-[70px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main opacity-70"
                        />
                      </td>

                      {/* Warehouse  */}
                      <td className="px-2 py-1">
                        <WarehouseSelect
                          compact
                          value={it.warehouse}
                          onChange={(e) =>
                            onItemChange(i, "warehouse", e.target.value)
                          }
                          onDefaultLoad={(firstWarehouse) =>
                            onItemChange(i, "warehouse", firstWarehouse)
                          }
                          required
                        />
                      </td>

                      {/* Remove */}
                      <td className="px-2 py-1 text-center">
                        <Button
                          variant="ghost"
                          onClick={() => onRemoveItem(i)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Items Footer */}
            <div className="mt-3 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={onAddItem}
                className="px-4 py-1.5 bg-primary text-white rounded text-xs flex items-center gap-1"
              >
                <Plus size={14} /> Add Item
              </button>

              {(items.length > ITEMS_PER_PAGE || itemPage > 0) && (
                <div className="flex items-center gap-3 py-1 px-2 bg-app rounded">
                  <span className="text-[11px] text-muted whitespace-nowrap">
                    {itemPage * ITEMS_PER_PAGE + 1}–
                    {Math.min((itemPage + 1) * ITEMS_PER_PAGE, items.length)}{" "}
                    of {items.length}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setItemPage(Math.max(0, itemPage - 1))}
                      disabled={itemPage === 0}
                      className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px] disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemPage(itemPage + 1)}
                      disabled={
                        (itemPage + 1) * ITEMS_PER_PAGE >= items.length
                      }
                      className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== RIGHT SIDEBAR ===== */}
        <div className="flex flex-col gap-3 w-[220px]">
          <div className="bg-card rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2">Supplier Summary</h3>
            <p className="text-xs text-muted">
              Total Suppliers: {suppliers.length}
            </p>
            <p className="text-xs text-muted">
              Emails to Send: {suppliers.filter((s) => s.sendEmail).length}
            </p>
          </div>

          <div className="bg-card rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2">Items Summary</h3>
            <p className="text-xs text-muted">Total Items: {items.length}</p>
            <p className="text-xs text-muted">
              Total Qty:{" "}
              {items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};