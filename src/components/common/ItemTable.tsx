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
import { useSpreadsheetNavigation } from "../../hooks/common/useSpreadsheetNavigation";
import { useCompanyStore } from "../../store/companyStore";

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
  invoiceType?: "Product" | "Service" | "RVAT";
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

// interface InvoiceHeadersProps {
//   isSalesInvoice: boolean;
//   isQuotation: boolean;
//   invoiceType?: "Product" | "Service";
// }

//Rollback don't remove it
// const InvoiceColGroup: React.FC<InvoiceHeadersProps> = ({
//   isSalesInvoice,
//   isQuotation,
// }) => (
// <colgroup>
//   {/* #          */} <col style={{ width: "28px" }} />
//   {/* Item       */} <col style={{ width: isQuotation ? "30%" : "18%" }} />
//   {/* Pkg (U×S)  */} <col style={{ width: "5%" }} />
//   {/* Box        */} {!isQuotation && <col style={{ width: "6%" }} />}
//   {/* Batch No   */} {isSalesInvoice && <col style={{ width: "9%" }} />}
//   {/* UOM        */} {isQuotation && <col style={{ width: "10%" }} />}
//   {/* Qty        */} <col style={{ width: "5%" }} />
//   {/* Mfg Date   */} {!isQuotation && <col style={{ width: "10%" }} />}
//   {/* Expiry     */} {!isQuotation && <col style={{ width: "10%" }} />}
//   {/* Warehouse  */} {!isQuotation && <col style={{ width: "12%" }} />}
//   {/* Unit Price */} <col style={{ width: "7%" }} />
//   {/* Dis(%)     */} {!isQuotation && <col style={{ width: "5%" }} />}
//   {/* Tax(%)     */} <col style={{ width: "4%" }} />
//   {/* Tax Name   */} <col style={{ width: "12%" }} />
//   {/* Amount     */} <col style={{ width: "7%" }} />
//   {/* Actions    */} <col style={{ width: "44px" }} />
// </colgroup>
// );

interface InvoiceHeadersProps {
  isSalesInvoice: boolean;
  isQuotation: boolean;
  invoiceType?: "Product" | "Service" | "RVAT";
}

const ProductInvoiceColGroup: React.FC<InvoiceHeadersProps> = ({
  isSalesInvoice,
  isQuotation,
}) => (
  <colgroup>
    {/* #          */} <col style={{ width: "28px" }} />
    {/* Item       */} <col style={{ width: isQuotation ? "30%" : "18%" }} />
    {/* Pkg (U×S)  */} <col style={{ width: "5%" }} />
    {/* Box        */} {!isQuotation && <col style={{ width: "6%" }} />}
    {/* Batch No   */} {isSalesInvoice && <col style={{ width: "9%" }} />}
    {/* Qty        */} <col style={{ width: "7%" }} />
    {/* UOM */} <col style={{ width: "8%" }} />
    {/* Mfg Date   */} {!isQuotation && <col style={{ width: "10%" }} />}
    {/* Expiry     */} {!isQuotation && <col style={{ width: "10%" }} />}
    {/* Warehouse  */} {!isQuotation && <col style={{ width: "12%" }} />}
    {/* Unit Price */} <col style={{ width: "7%" }} />
    {/* Dis(%)     */} {!isQuotation && <col style={{ width: "5%" }} />}
    {/* Tax(%)     */} <col style={{ width: "4%" }} />
    {/* Tax Name   */} <col style={{ width: "12%" }} />
    {/* Amount     */} <col style={{ width: "7%" }} />
    {/* Actions    */} <col style={{ width: "44px" }} />
  </colgroup>
);

const ServiceInvoiceColGroup: React.FC = () => (
  <colgroup>
    <col style={{ width: "28px" }} /> {/* # */}
    <col style={{ width: "20%" }} /> {/* Item */}
    <col style={{ width: "18%" }} /> {/* Description */}
    <col style={{ width: "7%" }} /> {/* Qty */}
    <col style={{ width: "8%" }} /> {/* UOM */}
    <col style={{ width: "6%" }} /> {/* Price */}
    <col style={{ width: "5%" }} /> {/* Discount */}
    <col style={{ width: "5%" }} /> {/* Tax% */}
    <col style={{ width: "12%" }} /> {/* Tax Name */}
    <col style={{ width: "10%" }} /> {/* Amount */}
    <col style={{ width: "44px" }} /> {/* Actions */}
  </colgroup>
);

const InvoiceColGroup: React.FC<InvoiceHeadersProps> = (props) => {
  // const isService = props.isSalesInvoice && props.invoiceType === "Service";
  const isService =
    props.invoiceType === "Service" || props.invoiceType === "RVAT";

  if (isService) {
    return <ServiceInvoiceColGroup />;
  }

  return <ProductInvoiceColGroup {...props} />;
};

const InvoiceHeaders: React.FC<InvoiceHeadersProps> = ({
  isSalesInvoice,
  isQuotation,
  invoiceType = "Product",
}) => {
  // const isService = isSalesInvoice && invoiceType === "Service";
  const isService = invoiceType === "Service" || invoiceType === "RVAT";
  return (
    <tr className="border-b border-theme">
      <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
        #
      </th>
      <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
        Item
      </th>
      {isService && (
        <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
          Description
        </th>
      )}

      {/* Hide Labels if Service */}
      {!isService && (
        <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
          Pkg
        </th>
      )}
      {!isQuotation && !isService && (
        <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
          Box
        </th>
      )}
      {isSalesInvoice && !isService && (
        <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
          Batch
        </th>
      )}

      <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
        Qty
      </th>

      <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
        UOM
      </th>

      {/* Hide Labels if Service */}
      {!isQuotation && !isService && (
        <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
          Mfg
        </th>
      )}
      {!isQuotation && !isService && (
        <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
          Expiry
        </th>
      )}
      {!isQuotation && !isService && (
        <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
          Warehouse
        </th>
      )}

      <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
        Price <span className="text-danger">*</span>
      </th>
      {!isQuotation && (
        <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
          Dis%
        </th>
      )}
      <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
        Tax%
      </th>
      <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
        Tax Name
      </th>
      <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
        Amount
      </th>
      <th />
    </tr>
  );
};

//Rollback don't remove it
// const InvoiceHeaders: React.FC<InvoiceHeadersProps> = ({
//   isSalesInvoice,
//   isQuotation,
// }) => (
//   <tr className="border-b border-theme">
//     <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">#</th>
//     <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">Item</th>
//     <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">Pkg</th>
//     {!isQuotation && (
//       <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">Box</th>
//     )}
//     {isSalesInvoice && (
//       <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">Batch</th>
//     )}
//     {isQuotation && (
//       <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">UOM</th>
//     )}
//     <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">Qty</th>
//     {!isQuotation && (
//       <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">Mfg</th>
//     )}
//     {!isQuotation && (
//       <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">Expiry</th>
//     )}
//     {!isQuotation && (
//       <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">Warehouse</th>
//     )}
//     <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">
//       Price <span className="text-danger">*</span>
//     </th>
//     {!isQuotation && (
//       <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">Dis%</th>
//     )}
//     <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">Tax%</th>
//     <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">Tax Name</th>
//     <th className="px-2 py-1 text-left text-muted font-medium text-[11px]">Amount</th>
//     <th />
//   </tr>
// );

// ─── Component ────────────────────────────────────────────────────────────────

const ItemTable: React.FC<ItemTableProps> = ({
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
  invoiceType = "Product",
  isSalesInvoice = false,
  isQuotation = false,
}) => {
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const onGridKeyDown = useSpreadsheetNavigation(tableWrapperRef);
  const isZraEnabled = useCompanyStore((s) => s.isZraEnabled);

  useBarcodeScanner(async (barcode) => {
    try {
      const response = await getItemDetailsByBarcodeId(barcode);
      const itemData = response?.message || response?.data?.message;
      if (!itemData) return;

      let matchedWarehouse = "";
      let matchedPackingSize = "";
      let matchedPackingUnit = "";
      let matchedTaxName = "";
      let resolvedPrice = itemData.rate || 0;
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

        const useRrpPrice =
          isZraEnabled && Number(stockItem?.is_mtv_item) === 1;
        if (useRrpPrice) {
          resolvedPrice = Number(stockItem?.rrp_rate ?? 0);
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
        price: resolvedPrice,
        batchNo: itemData.batch_no || "",
        quantity: 1,
        availableQty: Number(itemData.quantity || 0),
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

  // const isService = isSalesInvoice && invoiceType === "Service";
  const isService = invoiceType === "Service" || invoiceType === "RVAT";

  const handleCopyRow = (absoluteIndex: number) => {
    actions.duplicateItem(absoluteIndex);
    const insertPage = Math.floor((absoluteIndex + 1) / ITEMS_PER_PAGE);
    if (insertPage !== ui.page) ui.setPage(insertPage);
  };

  const handleRemoveRow = (absoluteIndex: number) => {
    actions.removeItem(absoluteIndex);
  };


  const renderInvoiceRow = (it: any, i: number) => {
    const qty = Number(it.quantity || 0);
    const price = Number(it.price || 0);
    const discountPct = Number(it.discount || 0);
    const vatRate = Number(it.vatRate || 0);

    const lineGross = qty * price;
    let discountAmount = lineGross * (discountPct / 100);
    let amount = lineGross - discountAmount;

    if (isZraEnabled && Number(it.is_mtv_item) === 1) {
      const rrpRate = Number(it.rrp_rate || 0);
      const lineTax = amount * (vatRate / 100);
      const inclusiveAmount = amount + lineTax;
      if (rrpRate > 0 && inclusiveAmount < rrpRate * qty) {
        const rrpGross = rrpRate * qty;
        discountAmount = rrpGross * (discountPct / 100);
        amount = lineGross - discountAmount; // actual gross, RRP-based discount only
      }
    }

    let col = 0;
    const c = () => col++;
    return (
      <tr key={i} className="border-b border-theme bg-card row-hover">
        {/* # */}
        <td
          data-row={i}
          data-col={c()}
          className="px-2 py-1 text-center text-[10px] text-muted"
        >
          {i + 1}
        </td>

        {/* Item */}
        {!isQuotation && (
          <td data-row={i} data-col={c()} className="px-0.5 py-1">
            <StockItemSelect
              value={it.itemCode}
              batchNo={it.batchNo}
              itemName={it.itemName}
              taxCategory={taxCategory}
              isQuotation={isQuotation}
              invoiceType={invoiceType}
              onChange={(item: SelectedStockItem) => {
                actions.updateItemDirectly?.(i, {
                  itemCode: item.itemCode,
                  itemName: item.itemName,
                  description: item.description,
                  uom: item.stockUom,
                  packingSize: item.packingSize,
                  packingUnit: item.packingUnit,
                  piecesPerBox: item.piecesPerBox,
                  batchNo: item.batchNo,
                  mfgDate: item.mfgDate,

                  expDate: item.expiryDate,
                  availableQty: item.qty,
                  quantity: 0,
                  price: item.price ?? 0,
                  is_mtv_item: item.is_mtv_item,
                 rrp_rate: item.rrp_rate,
                  warehouse: item.warehouse,
                  isServiceItem: item.isServiceItem,
                  vatRate: item.vatRate,
                  vatCode: item.vatCode,
                  _stockLoaded: true,
                  taxTypes: (item.taxInfo || [])
                    .flatMap((tax: any) => tax.taxRates || [])
                    .map((r: any) => r.tax_type)
                    .filter((t: string) => t && t.trim() !== ""),

                    taxTitles: (item.taxInfo || [])
      .map((tax: any) => tax.taxTitle)
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
                  piecesPerBox: "",
                  price: 0,
                  vatRate: undefined,
                  vatCode: "",
                })
              }
            />
          </td>
        )}
        {/* Description — Service only */}
        {isService && (
          <td data-row={i} data-col={c()} className="px-0.5 py-1">
            <input
              type="text"
              name="description"
              value={it.description || ""}
              placeholder="Enter description"
              onChange={(e) => actions.handleItemChange(i, e)}
              className="w-full py-1 px-1.5 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </td>
        )}

        {/* Pkg (U×S) */}
        {!isService && (
          <td data-row={i} data-col={c()} className="px-1 py-1">
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
        )}

        {/* Box */}
        {!isService && (
          <td data-row={i} data-col={c()} className="px-0.5 py-1">
            <div className="flex items-center gap-0.5">
              <input
                name="boxStart"
                value={it.boxStart || ""}
                placeholder="S"
                onChange={(e) => actions.handleItemChange(i, e)}
                className="w-full py-1 px-1 border border-theme rounded text-[10px] bg-card text-main"
              />
              <span className="text-[9px] text-muted shrink-0">-</span>
              <input
                name="boxEnd"
                value={it.boxEnd || ""}
                placeholder="E"
                onChange={(e) => actions.handleItemChange(i, e)}
                className="w-full py-1 px-1 border border-theme rounded text-[10px] bg-card text-main"
              />
            </div>
          </td>
        )}

        {/* Batch No */}
        {isSalesInvoice && !isService && (
          <td data-row={i} data-col={c()} className="px-0.5 py-1">
            <Tooltip content={`Batch No: ${it.batchNo || "—"}`}>
              <input
                type="text"
                name="batchNo"
                value={it.batchNo || ""}
                disabled
                className="w-full py-1 px-1.5 border border-theme rounded text-[10px] bg-card text-main"
              />
            </Tooltip>
          </td>
        )}

        {/* Qty */}
        <td data-row={i} data-col={c()} className="px-0.5 py-1">
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

        <td data-row={i} data-col={c()} className="px-2 py-1">
          <Tooltip content={it.uom ? `UOM: ${it.uom}` : "No UOM"}>
            <input
              type="text"
              name="uom"
              value={it.uom || ""}
              disabled
              className="w-full py-1 px-1.5 border border-theme rounded text-[10px] bg-card text-main"
            />
          </Tooltip>
        </td>

        {/* Mfg Date — full date visible, no truncation */}
        {!isService && (
          <td data-row={i} data-col={c()} className="px-0.5 py-1">
            <Tooltip content={it.mfgDate || "No Mfg Date"}>
              <DatePickerInput
                label=""
                name="mfgDate"
                value={it.mfgDate}
                disabled
                onChange={(name, value) =>
                  actions.handleItemChange(i, {
                    target: { name, value },
                  } as any)
                }
              />
            </Tooltip>
          </td>
        )}

        {/* Expiry Date — full date visible, no truncation */}
        {!isService && (
          <td data-row={i} data-col={c()} className="px-0.5 py-1">
            <Tooltip content={it.expDate || "No Expiry Date"}>
              <DatePickerInput
                label=""
                name="expDate"
                value={it.expDate}
                disabled
                onChange={(name, value) =>
                  actions.handleItemChange(i, {
                    target: { name, value },
                  } as any)
                }
              />
            </Tooltip>
          </td>
        )}

        {/* Warehouse */}
        {!isService && (
          <td data-row={i} data-col={c()} className="px-0.5 py-1">
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
        )}

        {/* Unit Price */}
        <td data-row={i} data-col={c()} className="px-0.5 py-1">
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

        {/* Dis(%) */}
        {!isQuotation && (
          <td data-row={i} data-col={c()} className="px-1 py-1">
            <NumericInput
              name="discount"
              value={it.discount ?? ""}
              placeholder="0"
              className="w-full min-w-[28px]"
              onChange={(value) =>
                actions.handleItemChange(i, {
                  target: { name: "discount", value },
                } as any)
              }
            />
          </td>
        )}

        {/* Tax(%) */}
        <td data-row={i} data-col={c()} className="px-1 py-1">
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

  
       {/* Tax Name */}
<td data-row={i} data-col={c()} className="px-1 py-1">
  <Tooltip
    content={
      it.taxTitles?.length
        ? `Tax Types: ${it.taxTitles.join(", ")}`
        : "No Tax Types"
    }
  >
    <input
      type="text"
      name="taxTitles"
      value={it.taxTitles || ""}
      className="w-full py-1 px-1.5 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
      disabled
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

  const resolvedColGroup = colGroup ?? (
    <InvoiceColGroup
      isSalesInvoice={isSalesInvoice}
      isQuotation={isQuotation}
      invoiceType={invoiceType}
    />
  );

  return (
    <div className="bg-card rounded-lg p-2 shadow-sm w-full">
      {title && (
        <h3 className="text-sm font-semibold text-main mb-2">{title}</h3>
      )}

      <div
        ref={tableWrapperRef}
        onKeyDown={onGridKeyDown}
        className="w-full overflow-x-auto scrollbar-thin"
      >
        <table
          className="w-full border-collapse text-[10px] leading-tight"
          style={{
            tableLayout: "fixed",
            minWidth: isService ? "520px" : "980px",
          }}
        >
          {resolvedColGroup}
          <thead>
            {columnHeaders || (
              <InvoiceHeaders
                isSalesInvoice={isSalesInvoice}
                isQuotation={isQuotation}
                invoiceType={invoiceType}
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

export default ItemTable;
