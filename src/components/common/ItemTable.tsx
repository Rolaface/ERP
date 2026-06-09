import React from "react";
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
  actions: ItemTableActions;
  symbol: string;
  ITEMS_PER_PAGE: number;
  taxCategory?: string;
  isSalesInvoice?:boolean;
  title?: string;
  isQuotation?: boolean;

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

interface InvoiceHeadersProps {
  isSalesInvoice: boolean;
}

const InvoiceHeaders: React.FC<InvoiceHeadersProps> = ({
  isSalesInvoice,
}) => (
  <tr className="border-b border-theme">
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[25px] whitespace-nowrap">
      #
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[130px] whitespace-nowrap">
      Item
    </th>
    {/* <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[140px] whitespace-nowrap">
      Description
    </th> */}
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[10px] whitespace-nowrap">
      Pkg (U×S)
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[70px] whitespace-nowrap">
      Box
    </th>
    {isSalesInvoice && (
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[250px] whitespace-nowrap">
      Batch No
    </th>
    )}
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
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[50px] whitespace-nowrap">
      Dis(%)
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[60px] whitespace-nowrap">
      Tax(%)
    </th>
    <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[60px] whitespace-nowrap">
      Tax Name
    </th>
    {/* <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[90px] whitespace-nowrap">
      Barcode
    </th> */}
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
        console.log("Fetched stock items for barcode scan:", stockItems);

        const stockItem = stockItems.find(
          (it: any) => it.item_code === itemData.item_code
        );
        if (stockItem) {
          // Extract Packing details
          matchedPackingSize = stockItem.packingSize || "";
          matchedPackingUnit = stockItem.packingUnit || "";
          console.log("Matched packing details from stock report:", 
            matchedPackingUnit,
            matchedPackingSize,
          );
        }
          
          if (stockItem.taxInfo && stockItem.taxInfo.length > 0) {
            matchedTaxName = stockItem.taxInfo[0].taxName || "";
            console.log("Matched tax name from stock report:", matchedTaxName);
          }

        if (stockItem && stockItem.batches) {
          const matchingBatch = stockItem.batches.find(
            (b: any) => b.batch_no === itemData.batch_no
          );
          if (matchingBatch) {
            matchedWarehouse = matchingBatch.warehouse;
            console.log("Matched warehouse from stock report:", matchedWarehouse);
          }
        }
      } catch (stockError) {
        console.error("Could not fetch warehouse for scanned item:", stockError);
      }

      const existingIndex = formData.items.findIndex(
        (it) => it.itemCode === itemData.item_code && it.batchNo === itemData.batch_no
      );

      // if (existingIndex >= 0) {
      //   const currentQty = Number(formData.items[existingIndex].quantity || 0);
      //   actions.handleItemChange(existingIndex, {
      //     target: { name: "quantity", value: currentQty + 1 }
      //   } as any);
      //   return;
      // }
      if (existingIndex >= 0) {
  const currentQty = Number(formData.items[existingIndex].quantity || 0);
  
  // 1. Update the quantity
  actions.handleItemChange(existingIndex, {
    target: { name: "quantity", value: currentQty + 1 }
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

      // 4. If new, find an empty row or add one
      let targetIndex = formData.items.findIndex((it) => !it.itemCode);
      
      if (targetIndex === -1) {
        actions.addItem(); 
        targetIndex = formData.items.length; 
      }

      // 5. Update the row with data from BOTH APIs
      actions.updateItemDirectly?.(targetIndex, {
        itemCode: itemData.item_code,
        itemName: itemData.item_name,
        price: itemData.rate || 0,
        batchNo: itemData.batch_no || "",
        
        quantity: 1, 
        availableQty: Number(itemData.quantity || 0), 

        // Inside StockItemSelect onChange
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
      showValidationError(parseFrappeError(error) || "Item not found for this barcode.");
    }
});

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
            isQuotation={isQuotation}
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
                quantity: 0,

              price: item.price ?? 0,

                // warehouse
                warehouse: item.warehouse,
                isServiceItem: item.isServiceItem,

                vatRate: item.vatRate,
                vatCode: item.vatCode,
                taxTypes: (item.taxInfo || [])
                  .flatMap((tax: any) => tax.taxRates || [])
                  .map((r: any) => r.tax_type)
                  .filter((t: string) => t && t.trim() !== ""),
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
        {/* <td className="px-0.5 py-1">
          <Tooltip content={it.description || "No description"}>
            <input
              className="w-full py-1 px-2 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              name="description"
              value={it.description}
              onChange={(e) => actions.handleItemChange(i, e)}
            />
          </Tooltip>
        </td> */}

        {/* Packing */}
        <td className="px-1 py-1">
          <div className="flex items-center justify-center ">
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
                className="w-[50px] h-[22px] text-[10px] text-center bg-card text-main border border-theme rounded-sm"
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
                className="w-[35px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main"
              />
            </Tooltip>
            <span className="text-[10px] text-muted">-</span>
            <Tooltip content={`Box End: ${it.boxEnd}`}>
              <input
                name="boxEnd"
                value={it.boxEnd || ""}
                placeholder="End"
                onChange={(e) => actions.handleItemChange(i, e)}
                className="w-[35px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main"
              />
            </Tooltip>
          </div>
        </td>

        {/* Batch No */}
        {isSalesInvoice && (
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
        )}

        {/* Qty */}
        <td className="px-0.5 py-1">
          <Tooltip content={`Quantity: ${it.quantity ?? 0}`}>
            <NumericInput
              name="quantity"
              value={it.quantity ?? ""}
              placeholder="0"
              className="w-[75px]"
           onChange={(value) => {
  actions.handleItemChange(i, {
    target: {
      name: "quantity",
      value,
    },
  } as any);
}}
            />
          </Tooltip>
        </td>

        {/* Mfg Date */}
        <td className="px-0.5 py-1">
          <div style={{ width: "98px" }}>
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
          <div style={{ width: "98px" }}>
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
        <td className="px-2 py-1">
          <Tooltip
            content={`Price: ${symbol} ${Number(it.price || 0).toFixed(2)}`}
          >
            <NumericInput
              name="price"
              value={it.price ?? ""}
              placeholder="0"
              decimalScale={4}
              className="w-[50px]"
              onChange={(value) =>
                actions.handleItemChange(i, {
                  target: {
                    name: "price",
                    value,
                  },
                } as any)
              }
            />
          </Tooltip>
        </td>

        {/* Discount */}
        <td className="px-1 py-1">
          <NumericInput
            name="discount"
            value={it.discount ?? ""}
            placeholder="0"
            className="w-[38px]"
            onChange={(value) =>
              actions.handleItemChange(i, {
                target: {
                  name: "discount",
                  value,
                },
              } as any)
            }
          />
        </td>

        {/* VAT Rate */}
        <td className="px-1 py-1">
          <NumericInput
            name="vatRate"
            value={it.vatRate ?? ""}
            placeholder="0"
            className="w-[38px]"
            onChange={(value) =>
              actions.handleItemChange(i, {
                target: {
                  name: "vatRate",
                  value,
                },
              } as any)
            }
          />
        </td>

        {/* VAT Code */}
        <td className="px-2 py-1">
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
              value={it.vatCode}
              className="w-[45px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              onChange={(e) => actions.handleItemChange(i, e)}
            />
          </Tooltip>
        </td>
        {/* Barcode Scanner Input */}
        {/* <td className="px-2 py-1">
          <Tooltip content="Scan Barcode (Auto-fetches on Enter)">
            <input
              type="text"
              name="barcode"
              value={it.barcode || ""}
              placeholder="Scan..."
              className="w-[80px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              onChange={(e) => {
                // Log the value as the scanner types it
                console.log(`Row ${i} Barcode Input:`, e.target.value); 
                actions.handleItemChange(i, e);
              }}
             onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  console.log(`Scanner hit ENTER. Final Barcode for row ${i}:`, it.barcode);

                  if (it.barcode) {
                    fetchByBarcode(i, it.barcode);
                  }
                }
              }}
            />
          </Tooltip>
        </td> */}

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
          <thead>
  {columnHeaders || (
    <InvoiceHeaders isSalesInvoice={isSalesInvoice} />
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

export default ItemTable;
