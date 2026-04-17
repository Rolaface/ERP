import React from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { showValidationError } from "../../utils/alert";
import StockItemSelect from "../selects/StockItemSelect";
import WarehouseSelect from "../selects/WarehouseSelect";
import DatePickerInput from "../calendar/DatePickerInput";
import {SelectedStockItem} from "../../types/Stock/stock";
import Tooltip from "../Tooltip";

// ─── Shared action/ui shapes (exported so callers can type against them) ──────

export interface ItemTableActions {
  handleItemChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  updateItemDirectly?: (index: number, updates: any) => void;
  removeItem: (index: number) => void;
  addItem: () => void;
  duplicateItem: (absoluteIndex: number) => void;
}

export interface ItemTableUI {
  page: number;
  setPage: (page: number) => void;
  itemCount: number;
}

interface ItemTableProps {
  // ── data ──
  paginatedItems: any[];
  formData: { items: any[] };
  ui: ItemTableUI;
  actions: ItemTableActions;
  symbol: string;
  ITEMS_PER_PAGE: number;
  taxCategory?: string;

  // ── customisation ──
  title?: string;

  /**
   * Provide BOTH to use a custom layout instead of the built-in invoice columns.
   *
   * columnHeaders  – the full <tr> of <th> cells
   * renderRow(item, absoluteIndex, helpers) – returns a single <tr>
   *
   * `helpers` exposes handleCopyRow / handleRemoveRow so the custom row
   * can render the copy+delete action buttons in exactly the right column.
   */
  columnHeaders?: React.ReactNode;
  renderRow?: (
    item: any,
    absoluteIndex: number,
    helpers: {
      handleCopyRow: (i: number) => void;
      handleRemoveRow: (i: number) => void;
    },
  ) => React.ReactNode;
}

// ─── Default (Invoice) column headers ────────────────────────────────────────

const InvoiceHeaders: React.FC = () => (
  <tr className="border-b border-theme">
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[25px] whitespace-nowrap">
      #
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[130px] whitespace-nowrap">
      Item
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[140px] whitespace-nowrap">
      Description
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[130px] whitespace-nowrap">
      Packing{" "}
      <span className="ml-1 text-[9px] text-muted/60 font-normal">
        (unit × size)
      </span>
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[130px] whitespace-nowrap">
      Box
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[250px] whitespace-nowrap">
      Batch No
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[50px] whitespace-nowrap">
      Qty
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] whitespace-nowrap">
      Mfg Date
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[50px] whitespace-nowrap">
      Expiry Date
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[100px] whitespace-nowrap">
      Warehouse
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[40px] whitespace-nowrap">
      Unit Price <span className="text-danger">*</span>
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[60px] whitespace-nowrap">
      Dis(%)
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[70px] whitespace-nowrap">
      Tax(%)
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[60px] whitespace-nowrap">
     Tax Name
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[60px] whitespace-nowrap">
      Amount
    </th>
    <th />
  </tr>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ItemTable: React.FC<ItemTableProps> = ({
  paginatedItems,
  formData,
  ui,
  actions,
  symbol,
  ITEMS_PER_PAGE,
  taxCategory,
  title = "Items",
  columnHeaders,
  renderRow,
}) => {
  // shared helpers passed into custom renderRow
  const handleCopyRow = (absoluteIndex: number) => {
    actions.duplicateItem(absoluteIndex);
    const insertPage = Math.floor((absoluteIndex + 1) / ITEMS_PER_PAGE);
    if (insertPage !== ui.page) ui.setPage(insertPage);
  };

  const handleRemoveRow = (absoluteIndex: number) => {
    actions.removeItem(absoluteIndex);
  };

  // ── built-in invoice row ──────────────────────────────────────────────────
  const renderInvoiceRow = (it: any, i: number) => {
    const discountAmount =
      it.quantity * it.price * (Number(it.discount || 0) / 100);
    const amount = it.quantity * it.price - discountAmount;

    return (
      <tr key={i} className="border-b border-theme bg-card row-hover">
        <td className="px-2 py-1 text-center text-[10px]">{i + 1}</td>

        {/* Item */}
        <td className="px-0.5 py-1 min-w-[135px]">
          <StockItemSelect
            value={it.itemCode}
            batchNo={it.batchNo}
            itemName={it.itemName}
            taxCategory={taxCategory}
onChange={(item: SelectedStockItem) => {
  actions.updateItemDirectly?.(i, {

    itemCode: item.itemCode,
    itemName: item.itemName,
    description: item.description,

   
    packingSize: item.packingSize,
    packingUnit: item.packingUnit,

   
    batchNo: item.batchNo,
    mfgDate: item.mfgDate,
    expDate: item.expiryDate,

   
    availableQty: item.qty,
    quantity: 1, // default

    
    price:
      item.price ??
      item.sellingPrice ??
      item.purchasePrice ??
      0,

    // warehouse
    warehouse: item.warehouse,

 
    vatRate: item.vatRate,
    vatCode: item.vatCode,
  });
}}
            onClear={() =>
              actions.updateItemDirectly?.(i, {
                itemCode: "",
                description: "",
                batchNo: "",
                mfgDate: "",
                expDate: "",
                packingUnit: "",
                packingSize: "",
                price: 0,
                vatRate: undefined,
                vatCode: "",
              })
            }
          />
        </td>

        {/* Description */}
        <td className="px-0.5 py-1">
          <Tooltip content={it.description || "No description"}>
            <input
              className="w-full py-1 px-2 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              name="description"
              value={it.description}
              onChange={(e) => actions.handleItemChange(i, e)}
            />
          </Tooltip>
        </td>

        {/* Packing */}
        <td className="px-0.5 py-1">
          <div className="flex items-center gap-1">
            <Tooltip content={`Unit: ${it.packingUnit}`}>
              <input
                type="number"
                name="packingUnit"
                value={it.packingUnit || ""}
                disabled
                onChange={(e) => actions.handleItemChange(i, e)}
                className="w-[38px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main text-center no-spinner"
              />
            </Tooltip>
            <span className="text-[10px] text-muted font-semibold">×</span>
            <Tooltip content={`Size: ${it.packingSize}`}>
              <input
                type="number"
                name="packingSize"
                value={it.packingSize || ""}
                disabled
                onChange={(e) => actions.handleItemChange(i, e)}
                className="w-[38px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main text-center no-spinner"
              />
            </Tooltip>
          </div>
        </td>

        {/* Box */}
        <td className="px-0.5 py-1">
          <div className="flex items-center gap-1">
            <Tooltip content={`Box Start: ${it.boxStart}`}>
              <input
                name="boxStart"
                value={it.boxStart || ""}
                placeholder="Start"
                onChange={(e) => actions.handleItemChange(i, e)}
                className="w-[38px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main"
              />
            </Tooltip>
            <span className="text-[10px] text-muted">-</span>
            <Tooltip content={`Box End: ${it.boxEnd}`}>
              <input
                name="boxEnd"
                value={it.boxEnd || ""}
                placeholder="End"
                onChange={(e) => actions.handleItemChange(i, e)}
                className="w-[38px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main"
              />
            </Tooltip>
          </div>
        </td>

        {/* Batch No */}
        <td className="px-0.5 py-1 min-w-[100px]">
          <Tooltip content={`Batch No: ${it.batchNo}`}>
            <input
              type="text"
              name="batchNo"
              value={it.batchNo}
              disabled
              onChange={(e) => actions.handleItemChange(i, e)}
              className="w-full py-1 px-2 border border-theme rounded text-[10px] bg-card text-main"
            />
          </Tooltip>
        </td>

        {/* Qty */}
        <td className="px-0.5 py-1">
          <Tooltip content={`Quantity: ${it.quantity ?? 0}`}>
            <input
              type="number"
              name="quantity"
              value={it.quantity ?? ""}
              className="w-[75px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
              onChange={(e) => {
                const qty = Number(e.target.value);
                const available = it.availableQty ?? it.qty ?? 0;
                const usedQty = formData.items
                  .filter((x, xIdx) => x.batchNo === it.batchNo && xIdx !== i)
                  .reduce((sum, x) => sum + Number(x.quantity || 0), 0);
                if (qty > available - usedQty) {
                  showValidationError(
                    `Only ${available - usedQty} items remaining in batch ${it.batchNo}`,
                  );
                  return;
                }
                actions.handleItemChange(i, e);
              }}
            />
          </Tooltip>
        </td>

        {/* Mfg Date */}
        <td className="px-0.5 py-1">
          <div style={{ width: "130px" }}>
            <DatePickerInput
              label=""
              name="mfgDate"
              value={it.mfgDate}
              disabled
              onChange={(name, value) =>
                actions.handleItemChange(i, { target: { name, value } } as any)
              }
            />
          </div>
        </td>

        {/* Expiry Date */}
        <td className="px-0.5 py-1">
          <div style={{ width: "130px" }}>
            <DatePickerInput
              label=""
              name="expDate"
              value={it.expDate}
              disabled
              onChange={(name, value) =>
                actions.handleItemChange(i, { target: { name, value } } as any)
              }
            />
          </div>
        </td>

        {/* Warehouse */}
        <td className="px-0.5 py-1">
          <Tooltip content={it.warehouse || "No warehouse selected"}>
            <WarehouseSelect
              compact
              value={it.warehouse || ""}
              onChange={(e) =>
                actions.handleItemChange(i, {
                  target: { name: "warehouse", value: e.target?.value ?? e },
                } as any)
              }
            />
          </Tooltip>
        </td>

        {/* Price */}
        <td className="px-0.5 py-1">
          <Tooltip
            content={`Price: ${symbol} ${Number(it.price || 0).toFixed(2)}`}
          >
            <input
              type="number"
              name="price"
              value={it.price ?? ""}
              className="w-[50px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
              onChange={(e) => actions.handleItemChange(i, e)}
            />
          </Tooltip>
        </td>

        {/* Discount */}
        <td className="px-0.5 py-1">
          <input
            type="number"
            name="discount"
            value={it.discount ?? ""}
            className="w-[55px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
            onChange={(e) => actions.handleItemChange(i, e)}
          />
        </td>

        {/* VAT Rate */}
        <td className="px-0.5 py-1">
          <input
            type="number"
            name="vatRate"
            value={it.vatRate ?? ""}
            className="w-[55px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
            onChange={(e) => actions.handleItemChange(i, e)}
          />
        </td>

        {/* VAT Code */}
        <td className="px-0.5 py-1">
          <Tooltip content={it.vatCode || "No tax code"}>
            <input
              type="text"
              name="vatCode"
              value={it.vatCode}
              className="w-[45px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              onChange={(e) => actions.handleItemChange(i, e)}
            />
          </Tooltip>
        </td>

        {/* Amount */}
        <td className="px-0.5 py-1">
          <Tooltip content={`Amount: ${symbol} ${amount.toFixed(2)}`}>
            <span className="w-[110px] text-[10px] font-medium text-main">
              {symbol} {amount.toFixed(2)}
            </span>
          </Tooltip>
        </td>

        {/* Row actions */}
        <td className="px-0.5 py-1">
          <div className="flex items-center gap-1">
            <Tooltip content="Duplicate row below">
              <button
                type="button"
                onClick={() => handleCopyRow(i)}
                className="p-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            </Tooltip>
            <button
              type="button"
              onClick={() => handleRemoveRow(i)}
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
    <div className="bg-card rounded-lg p-1 shadow-sm">
      {title && (
        <div className="flex items-center gap-1 mb-1">
          <h3 className="text-sm font-semibold text-main">{title}</h3>
        </div>
      )}

      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[10px] leading-tight">
          <thead>{columnHeaders ?? <InvoiceHeaders />}</thead>
          <tbody>
            {paginatedItems.map((it, idx) => {
              const i = ui.page * ITEMS_PER_PAGE + idx;
              return renderRow ? (
                <React.Fragment key={i}>
                  {renderRow(it, i, { handleCopyRow, handleRemoveRow })}
                </React.Fragment>
              ) : (
                renderInvoiceRow(it, i)
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-3">
        <button
          type="button"
          onClick={actions.addItem}
          className="px-4 py-1.5 bg-primary hover:bg-[var(--primary-600)] text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>

        {(ui.itemCount > ITEMS_PER_PAGE || ui.page > 0) && (
          <div className="flex items-center gap-3 py-1 px-2 bg-app rounded">
            <div className="text-[11px] text-muted whitespace-nowrap">
              Showing {ui.page * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min((ui.page + 1) * ITEMS_PER_PAGE, ui.itemCount)} of{" "}
              {ui.itemCount} items
            </div>
            <div className="flex gap-1.5 items-center">
              <button
                type="button"
                onClick={() => ui.setPage(Math.max(0, ui.page - 1))}
                disabled={ui.page === 0}
                className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px]"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => ui.setPage(ui.page + 1)}
                disabled={(ui.page + 1) * ITEMS_PER_PAGE >= ui.itemCount}
                className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemTable;
