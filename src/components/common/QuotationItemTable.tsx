import React, { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { showValidationError } from "../../utils/alert";
import StockItemSelect from "../selects/StockItemSelect";
import WarehouseSelect from "../selects/WarehouseSelect";
import DatePickerInput from "../calendar/DatePickerInput";
import { SelectedStockItem } from "../../types/Stock/stock";
import Tooltip from "../Tooltip";
import { NumericInput } from "../ui/modal/modalComponent";
import { useRef } from "react";
import { getItemDetailsByBarcodeId } from "../../api/procurement/PurchaseInvoiceApi";
import { parseFrappeError } from "../../views/hr/tabs/leave-config/hooks/parseFrappeError";
import { useBarcodeScanner } from "../../api/utils/BarCodeScanner";
import { getStockReport } from "../../api/stockApi";
import POItemSelect from "../selects/procurement/POItemSelect";

export interface ItemTableActions {
  handleItemChange: (
    index: number,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  updateItemDirectly?: (index: number, updates: any) => void;
  removeItem: (index: number) => void;
  addItem: () => void;
  duplicateItem: (absoluteIndex: number) => void;
  fetchByBarcode?: (index: number, barcode: string) => Promise<void>;
   getItemMax?: (index: number) => number | undefined; 
}

export interface ItemTableUI {
  page: number;
  setPage: (page: number) => void;
  itemCount: number;
}

interface ItemTableProps {
  paginatedItems: any[];
  formData: { items: any[] };
  ui: ItemTableUI;
  onItemSelect?: (item: any, idx: number) => void;
  actions: ItemTableActions;
  symbol: string;
  ITEMS_PER_PAGE: number;
  taxCategory?: string;
  isSalesInvoice?: boolean;
  title?: string;
  isQuotation?: boolean;
  columnHeaders?: React.ReactNode;
  colGroup?: React.ReactNode;
  renderRow?: (
    item: any,
    absoluteIndex: number,
    helpers: {
      handleCopyRow: (i: number) => void;
      handleRemoveRow: (i: number) => void;
    },
  ) => React.ReactNode;
}

// ─── Column headers + colgroup (default invoice layout) ──────────────────────
//
// Visibility strategy — columns hidden by breakpoint:
//   always visible : #, Item, Batch No (sales), Qty, Expiry, Unit Price, Amount, Actions
//   hidden < md    : Pkg, Box, Warehouse, Dis(%), Tax(%), Tax Name
//   hidden < xl    : Mfg Date   ← was "hidden lg", now pushed to xl to save space
//
// Width strategy — all percentages, table-layout:fixed, minWidth:560px fallback.
// The colgroup percentages govern on normal screens; overflow-x-auto on the
// wrapper handles screens narrower than 560px.

interface InvoiceHeadersProps {
  isSalesInvoice: boolean;
  isQuotation: boolean;
}

const InvoiceColGroup: React.FC<InvoiceHeadersProps> = ({
}) => (
  <colgroup>
    {/* #          */} <col style={{ width: "28px" }} />
    {/* Item       */} <col style={{ width: "30%" }} />
    {/* Pkg (U×S)  */} <col style={{ width: "6%" }} />
    {/* UOM        */} <col style={{ width: "8%" }} />
    {/* Qty        */} <col style={{ width: "20%" }} />
    {/* Unit Price */} <col style={{ width: "7%" }} />
    {/* Tax(%)     */} <col style={{ width: "5%" }} />
    {/* Tax Name   */} <col style={{ width: "18%" }} />
    {/* Amount     */} <col style={{ width: "8%" }} />
    {/* Actions    */} <col style={{ width: "44px" }} />
  </colgroup>
);

const InvoiceHeaders: React.FC<InvoiceHeadersProps> = ({
}) => (
  <tr className="border-b border-theme">
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
      #
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
      Item
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] md:table-cell">
      Pkg
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
      Qty
    </th>
      <th className="px-2 py-1 text-left text-muted font-medium text-[11px] xl:table-cell">
        UOM
      </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
      Price <span className="text-danger">*</span>
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] md:table-cell">
      Tax%
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] md:table-cell">
      Tax
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
      Amount
    </th>
    <th />
  </tr>
);

// ─── Component ────────────────────────────────────────────────────────────────

const QuotationItemTable: React.FC<ItemTableProps> = ({
  paginatedItems,
  formData,
  ui,
  actions,
  onItemSelect,
  symbol,
  ITEMS_PER_PAGE,
  taxCategory,
  title = "Items",
  columnHeaders,
  colGroup,
  renderRow,
  isSalesInvoice = false,
  isQuotation = false,
}) => {
  useBarcodeScanner(async (barcode) => {
    try {
      const response = await getItemDetailsByBarcodeId(barcode);
      const itemData = response?.message || response?.data?.message;
      if (!itemData) return;

      let matchedWarehouse = "";
      let matchedPackingSize = "";
      let matchedPackingUnit = "";
      let matchedTaxName = "";
      try {
        const stockRes = await getStockReport(1, 1000, itemData.item_code, "");
        const stockItems = stockRes?.message?.data || [];
        const stockItem = stockItems.find(
          (it: any) => it.item_code === itemData.item_code,
        );
        if (stockItem) {
          matchedPackingSize = stockItem.packingSize || "";
          matchedPackingUnit = stockItem.packingUnit || "";
        }
        if (stockItem.taxInfo && stockItem.taxInfo.length > 0) {
          matchedTaxName = stockItem.taxInfo[0].taxName || "";
        }
        if (stockItem && stockItem.batches) {
          const matchingBatch = stockItem.batches.find(
            (b: any) => b.batch_no === itemData.batch_no,
          );
          if (matchingBatch) matchedWarehouse = matchingBatch.warehouse;
        }
      } catch (stockError) {
        console.error(
          "Could not fetch warehouse for scanned item:",
          stockError,
        );
      }

      const existingIndex = formData.items.findIndex(
        (it) =>
          it.itemCode === itemData.item_code &&
          it.batchNo === itemData.batch_no,
      );

      if (existingIndex >= 0) {
        const currentQty = Number(formData.items[existingIndex].quantity || 0);
        actions.handleItemChange(existingIndex, {
          target: { name: "quantity", value: currentQty + 1 },
        } as any);
        const existingItem = formData.items[existingIndex];
        if (!existingItem.mfgDate || !existingItem.expDate) {
          actions.updateItemDirectly?.(existingIndex, {
            ...existingItem,
            mfgDate: existingItem.mfgDate || itemData.manufacturing_date || "",
            expDate: existingItem.expDate || itemData.expiry_date || "",
          });
        }
        return;
      }

      let targetIndex = formData.items.findIndex((it) => !it.itemCode);
      if (targetIndex === -1) {
        actions.addItem();
        targetIndex = formData.items.length;
      }
      actions.updateItemDirectly?.(targetIndex, {
        itemCode: itemData.item_code,
        itemName: itemData.item_name,
        price: itemData.rate || 0,
        batchNo: itemData.batch_no || "",
        quantity: 1,
        availableQty: Number(itemData.quantity || 0),
        // availableQty above came from a live lookup just now, so this row's
        // stock cap can be enforced immediately.
        _stockLoaded: true,
        mfgDate: itemData.manufacturing_date || itemData.mfgDate || "",
        expDate: itemData.expiry_date || itemData.expiryDate || "",
        description: itemData.item_name || "",
        packingSize: matchedPackingSize,
        packingUnit: matchedPackingUnit,
        warehouse: matchedWarehouse,
        isServiceItem: false,
        vatRate: 0,
        vatCode: "",
        vatCd: matchedTaxName,
        taxTypes: [],
      });
    } catch (error) {
      showValidationError(
        parseFrappeError(error) || "Item not found for this barcode.",
      );
    }
  });
  const [itemVatCode, setItemVatCode] = useState();
  const [unitOfMeasurement, setUnitOfMeasurement] = useState();
  const handleCopyRow = (absoluteIndex: number) => {
    actions.duplicateItem(absoluteIndex);
    const insertPage = Math.floor((absoluteIndex + 1) / ITEMS_PER_PAGE);
    if (insertPage !== ui.page) ui.setPage(insertPage);
  };

  const handleRemoveRow = (absoluteIndex: number) => {
    actions.removeItem(absoluteIndex);
  };

  const renderInvoiceRow = (it: any, i: number) => {
    const discountAmount =
      it.quantity * it.price * (Number(it.discount || 0) / 100);
    const amount = it.quantity * it.price - discountAmount;

    return (
      <tr key={i} className="border-b border-theme bg-card row-hover">
        {/* # */}
        <td className="px-2 py-1 text-center text-[10px] text-muted">
          {i + 1}
        </td>
 
          <td className="px-1 py-1.5 overflow-hidden">
            <POItemSelect
              value={it.itemName}
              selectedId={it.itemCode}
              onChange={(item: any) => {
                // 1. Safely call the parent prop
                onItemSelect?.(item, i);

                // 2. Extract basic values
                const code = item?.id || "";
                const name = item?.itemName || code;
                const rate = item?.sellingPrice || 0;
                const pUnit = item?.packingUnit || "";
                const pSize = item?.packingSize || "";
                const unitOfMeasure = item?.unitOfMeasureCd || "";
                setUnitOfMeasurement(unitOfMeasure);

                let vatRate = item?.vatRate ?? 0;
                let vatCd = item?.vatCd ?? "";
                if (Array.isArray(item?.taxInfo) && item.taxInfo.length > 0) {
                  const tax = item.taxInfo[0];
                  if (
                    tax?.totalTaxRate !== undefined &&
                    tax.totalTaxRate !== null
                  ) {
                    vatRate = tax.totalTaxRate;
                  }
                  if (tax?.taxName) {
                    vatCd = tax.taxName;
                    setItemVatCode(vatCd);
                    console.log("vatCd", vatCd);
                  }
                }

                // 4. Update all fields at ONCE
                actions.updateItemDirectly?.(i, {
                  itemCode: code,
                  itemName: name,
                  price: rate,
                  quantity: 1,
                  uom: unitOfMeasure,
                  vatRate: vatRate,
                  vatCd: vatCd,
                  packingUnit: pUnit,
                  packingSize: pSize,
                  taxCode: vatCd,
                });
              }}
            />
          </td> 

        {/* Pkg (U×S) — hidden < md */}
        <td className="px-1 py-1 md:table-cell">
          <Tooltip
            content={
              it.packingUnit && it.packingSize
                ? `Packing: ${it.packingUnit} × ${it.packingSize}`
                : "No packing defined"
            }
          >
            <input
              type="text"
              name="packing"
              value={
                it.packingUnit && it.packingSize
                  ? `${it.packingUnit}×${it.packingSize}`
                  : ""
              }
              disabled
              className="w-full h-[22px] text-[10px] text-center bg-card text-main border border-theme rounded-sm"
            />
          </Tooltip>
        </td>


        {/* Qty */}
        <td className="px-0.5 py-1">
          <NumericInput
            name="quantity"
            value={it.quantity ?? ""}
            placeholder="0"
             max={actions.getItemMax?.(i)}  
            className="w-full min-w-[32px]"
            onChange={(value) =>
              actions.handleItemChange(i, {
                target: { name: "quantity", value },
              } as any)
            }
          />
        </td>

        {/* UOM — quotation only */}
           <td className="px-2 py-1 md:table-cell">
            <Tooltip content={it.uom ? `UOM: ${it.uom}` : "No UOM"}>
              <input
                type="text"
                name="uom"
                value={it.uom || ""}
                className="w-full py-1 px-1.5 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                disabled
              />
            </Tooltip>
          </td> 

        {/* Unit Price */}
        <td className="px-0.5 py-1">
          <NumericInput
            name="price"
            value={it.price ?? ""}
            placeholder="0"
            decimalScale={4}
            className="w-full min-w-[36px]"
            onChange={(value) =>
              actions.handleItemChange(i, {
                target: { name: "price", value },
              } as any)
            }
          />
        </td>

        {/* Tax(%) — hidden < md */}
        <td className="px-1 py-1 md:table-cell">
          <NumericInput
            name="vatRate"
            value={it.vatRate ?? ""}
            placeholder="0"
            className="w-full min-w-[28px]"
            onChange={(value) =>
              actions.handleItemChange(i, {
                target: { name: "vatRate", value },
              } as any)
            }
            disabled
          />
        </td>

        {/* Tax Name — hidden < md */}
        <td className="px-1 py-1 md:table-cell">
          <Tooltip
            content={
              it.taxTypes?.length
                ? `Tax Types: ${it.taxTypes.join(", ")}`
                : "No Tax Types"
            }
          >
            <input
              type="text"
              name="vatCode"
              value={it.vatCode || "" || it.vatCd}
              className="w-full py-1 px-1.5 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              disabled
              onChange={(e) => actions.handleItemChange(i, e)}
            />
          </Tooltip>
        </td>

        {/* Amount */}
        <td className="px-1 py-1">
          <span
            className="text-[10px] font-medium text-main whitespace-nowrap block truncate"
            title={`${symbol} ${amount.toFixed(2)}`}
          >
            {symbol} {amount.toFixed(2)}
          </span>
        </td>

        {/* Actions */}
        <td className="px-0.5 py-1">
          <div className="flex items-center gap-0.5">
            <Tooltip content="Duplicate row">
              <button
                type="button"
                onClick={() => handleCopyRow(i)}
                className="p-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <button
              type="button"
              onClick={() => handleRemoveRow(i)}
              className="p-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Use built-in colgroup for default invoice layout;
  // custom colGroup prop (PO table etc.) overrides it entirely.
  const resolvedColGroup = colGroup ?? (
    <InvoiceColGroup
      isSalesInvoice={isSalesInvoice}
      isQuotation={isQuotation}
    />
  );

  return (
    <div className="bg-card rounded-lg p-2 shadow-sm w-full">
      {title && (
        <h3 className="text-sm font-semibold text-main mb-2">{title}</h3>
      )}

      {/*
        table-layout:fixed + colgroup percentages = columns scale to container.
        minWidth:560px = absolute minimum before horizontal scroll kicks in.
        overflow-x-auto on the wrapper = last-resort escape hatch only.
      */}
      <div className="w-full overflow-x-auto scrollbar-thin">
        <table
          className="w-full border-collapse text-[10px] leading-tight"
          style={{ tableLayout: "fixed", minWidth: "700px" }}
        >
          {resolvedColGroup}
          <thead>
            {columnHeaders || (
              <InvoiceHeaders
                isSalesInvoice={isSalesInvoice}
                isQuotation={isQuotation}
              />
            )}
          </thead>
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

export default QuotationItemTable;