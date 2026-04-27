import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../ui/modal/formComponent";
import { ModalInput, ModalSelect } from "../../ui/modal/modalComponent";
import type { SupplierRow, ItemRow } from "../../../types/Supply/rfq";
import DatePickerInput from "../../calendar/DatePickerInput";

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
  onSupplierChange: (
    idx: number,
    field: keyof SupplierRow,
    value: any
  ) => void;
  onAddSupplier: () => void;
  onRemoveSupplier: (idx: number) => void;
  onItemChange: (
    idx: number,
    field: keyof ItemRow,
    value: any
  ) => void;
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
    const newPage = Math.floor((suppliers.length - 1) / ITEMS_PER_PAGE);
    if (newPage !== supPage) setSupPage(newPage);
  }, [suppliers.length]);

  useEffect(() => {
    const newPage = Math.floor((items.length - 1) / ITEMS_PER_PAGE);
    if (newPage !== itemPage) setItemPage(newPage);
  }, [items.length]);

  const paginatedSuppliers = suppliers.slice(
    supPage * ITEMS_PER_PAGE,
    (supPage + 1) * ITEMS_PER_PAGE
  );

  const paginatedItems = items.slice(
    itemPage * ITEMS_PER_PAGE,
    (itemPage + 1) * ITEMS_PER_PAGE
  );

  return (
     <div className="flex flex-col gap-4 max-h-screen overflow-auto p-4 bg-app text-main">

      {/* ---------- HEADER ---------- */}
     <div className="bg-app">
        <div className="flex flex-wrap gap-x-2 gap-y-3 items-end mb-3">
        <div className="w-[120px]">
        <DatePickerInput
          name="Request Date"
          value={requestDate}
           onChange={(name, value) =>
                onRequestDateChange({ target: { name, value } } as any)
              }
        />
        </div>
          <div className="w-[120px]">
        <DatePickerInput
          name="Quote Deadline"
          value={quoteDeadline}
           onChange={(name, value) =>
                onQuoteDeadlineChange({ target: { name, value } } as any)
              }
        />
        </div>
          <div className="w-[120px]">
        <ModalSelect
          label="Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={[
            { value: "Draft", label: "Draft" },
          ]}
        />
        </div>
      </div>
      </div>

      {/* ---------- BODY ---------- */}
      <div className="grid grid-cols-[4fr_1fr] gap-4">

        {/* ===== LEFT ===== */}
        <div className="flex flex-col gap-4">

          {/* SUPPLIERS TABLE */}
          <div className="bg-card rounded-lg p-2 shadow-sm">
            <h3 className="text-sm font-semibold mb-2">Suppliers</h3>

            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-theme text-muted">
                  <th className="px-2 py-1 text-left">#</th>
                  <th className="px-2 py-1 text-left">Supplier</th>
                  <th className="px-2 py-1 text-left">Contact</th>
                  <th className="px-2 py-1 text-left">Email</th>
                  <th className="px-2 py-1 text-center">Send</th>
                  <th className="px-2 py-1 text-center">-</th>
                </tr>
              </thead>

              <tbody>
                {paginatedSuppliers.map((sup, idx) => {
                  const i = supPage * ITEMS_PER_PAGE + idx;
                  return (
                    <tr key={i} className="border-b border-theme row-hover">
                      <td className="px-2 py-1">{i + 1}</td>

                      <td className="px-2 py-1">
                        <ModalInput
                          label=""
                          value={sup.supplier}
                          onChange={(e) =>
                            onSupplierChange(i, "supplier", e.target.value)
                          }
                        />
                      </td>

                      <td className="px-2 py-1">
                        <ModalInput
                          label=""
                          value={sup.contact}
                          onChange={(e) =>
                            onSupplierChange(i, "contact", e.target.value)
                          }
                        />
                      </td>

                      <td className="px-2 py-1">
                        <ModalInput
                          label=""
                          value={sup.email}
                          onChange={(e) =>
                            onSupplierChange(i, "email", e.target.value)
                          }
                        />
                      </td>

                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={sup.sendEmail}
                          onChange={(e) =>
                            onSupplierChange(i, "sendEmail", e.target.checked)
                          }
                        />
                      </td>

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

            {/* Suppliers Footer: Add + Pagination */}
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
                    {Math.min((supPage + 1) * ITEMS_PER_PAGE, suppliers.length)}{" "}
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
                      disabled={(supPage + 1) * ITEMS_PER_PAGE >= suppliers.length}
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
          <div className="bg-card rounded-lg p-2 shadow-sm">
            <h3 className="text-sm font-semibold mb-2">Items</h3>

            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-theme text-muted">
                  <th className="px-2 py-1 text-left">#</th>
                  <th className="px-2 py-1 text-left">Item Code</th>
                  <th className="px-2 py-1 text-left">Date</th>
                  <th className="px-2 py-1 text-left">Qty</th>
                  <th className="px-2 py-1 text-left">UOM</th>
                  <th className="px-2 py-1 text-left">Warehouse</th>
                  <th className="px-2 py-1 text-center">-</th>
                </tr>
              </thead>

              <tbody>
                {paginatedItems.map((it, idx) => {
                  const i = itemPage * ITEMS_PER_PAGE + idx;
                  return (
                    <tr key={i} className="border-b border-theme row-hover">
                      <td className="px-2 py-1">{i + 1}</td>

                      <td className="px-2 py-1">
                        <ModalInput
                          label=""
                          value={it.itemCode}
                          onChange={(e) =>
                            onItemChange(i, "itemCode", e.target.value)
                          }
                        />
                      </td>

                      <td className="px-2 py-1">
                        <ModalInput
                          label=""
                          type="date"
                          value={it.requiredDate}
                          onChange={(e) =>
                            onItemChange(i, "requiredDate", e.target.value)
                          }
                        />
                      </td>

                      <td className="px-2 py-1">
                        <ModalInput
                          label=""
                          type="number"
                          value={it.quantity}
                          onChange={(e) =>
                            onItemChange(i, "quantity", Number(e.target.value))
                          }
                        />
                      </td>

                      <td className="px-2 py-1">
                        <ModalInput
                          label=""
                          value={it.uom}
                          onChange={(e) =>
                            onItemChange(i, "uom", e.target.value)
                          }
                        />
                      </td>

                      <td className="px-2 py-1">
                        <ModalInput
                          label=""
                          value={it.warehouse}
                          onChange={(e) =>
                            onItemChange(i, "warehouse", e.target.value)
                          }
                        />
                      </td>

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

            {/* Items Footer: Add + Pagination */}
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
                      disabled={(itemPage + 1) * ITEMS_PER_PAGE >= items.length}
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
            <p className="text-xs text-muted">
              Total Items: {items.length}
            </p>
            <p className="text-xs text-muted">
              Total Qty: {items.reduce((s, it) => s + it.quantity, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};