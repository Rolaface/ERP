import React from "react";
import type { InvoiceGroup } from "../../../types/procument/imported_purchase/Importedpurchaseinvoice.types ";
import { formatAmount } from "../../../utils/day-time formatter/Format";
import { useCompanyDefaultsStore } from "../../../store/Companydefaultsstore";
import { useCurrencySymbols } from "../../../hooks/Usecurrencysymbols";
import ItemSelect, {
  type SelectedStockItem,
} from "../../../components/selects/itemGenriSelect";
import WarehouseSelect from "../../../components/selects/WarehouseSelect";
import type {
  MappedItemsMap,
  WarehousesMap,
} from "../../../hooks/procument/useProcessImportPurchaseInvoiceModal";

interface Props {
  group: InvoiceGroup;
  mappedItems: MappedItemsMap;
  warehouses: WarehousesMap;
  onMappedItemChange: (itemId: string, selected: SelectedStockItem) => void;
  onWarehouseChange: (itemId: string, warehouseId: string) => void;
}

const InvoiceExpandedRow: React.FC<Props> = ({
  group,
  mappedItems,
  warehouses,
  onMappedItemChange,
  onWarehouseChange,
}) => {
  const currency = useCompanyDefaultsStore(
    (state) => state.defaults?.default_currency ?? "ZMW",
  );
  const { getNumberFormat } = useCurrencySymbols(currency ? [currency] : []);
  const pattern = getNumberFormat(currency);

  return (
    <div className="bg-app border-y-2 border-primary/20 px-5 py-4 space-y-4">
      <div className="rounded-lg border border-theme bg-card overflow-hidden">
        <div className="px-4 py-2 border-b border-theme text-[10px] font-semibold uppercase tracking-wider text-muted bg-app/60">
          Items ({group.items.length})
        </div>
        <div className="max-h-64 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-theme text-[10px] text-muted font-semibold uppercase tracking-wider bg-app">
                <th className="px-3 py-2 w-10 text-center">#</th>
                <th className="px-3 py-2 min-w-[140px]">Item</th>
                <th className="px-3 py-2">Class</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-center">UOM</th>
                <th className="px-3 py-2 text-right">Unit Price</th>
                <th className="px-3 py-2 text-right min-w-[100px]">
                  Total (Tax)
                </th>
                <th className="px-3 py-2">Discount</th>
                <th className="px-3 py-2">Tax Cat</th>
                <th className="px-3 py-2">Package</th>
                <th className="px-3 py-2">Barcode</th>
                <th className="px-3 py-2 min-w-[220px]">
                  Map to Existing Item
                </th>
                <th className="px-3 py-2 min-w-[160px]">Warehouse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme text-[12px]">
              {group.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-app/40 transition-colors">
                  <td className="px-3 py-2 text-center text-muted text-[11px]">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-main">{item.itemName}</div>
                    <div className="text-[10px] text-primary">
                      {item.itemCd}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-muted">
                    {item.itemClassCd}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-main text-right">
                    {formatAmount(item.qty, pattern)}
                  </td>
                  <td className="px-3 py-2 text-center text-[11px] text-muted">
                    {item.qtyUnitCd}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-main text-right">
                    {formatAmount(item.unitPrice, pattern)}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-right">
                    <div className="font-medium text-main">
                      {currency} {formatAmount(item.itemTotalAmount, pattern)}
                    </div>
                    <div className="text-[10px] text-muted">
                      Tax {formatAmount(item.vatAmount, pattern)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-main">
                    {item.discountRate > 0 || item.discountAmount > 0
                      ? `${item.discountRate}% (${currency} ${formatAmount(item.discountAmount, pattern)})`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-main">
                    {item.vatCategoryCd || "—"}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-main">
                    {item.packageCount} {item.packageUnitCd}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-main">
                    {item.barcode || "—"}
                  </td>
                  <td
                    className="px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ItemSelect
                      value={mappedItems[item.id]?.itemCode ?? ""}
                      selectedId={mappedItems[item.id]?.itemCode ?? ""}
                      onChange={(selected) =>
                        onMappedItemChange(item.id, selected)
                      }
                      placeholder="Map item.."
                      className="w-full"
                    />
                  </td>
                  <td
                    className="px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <WarehouseSelect
                      compact
                      value={warehouses[item.id] ?? ""}
                      onChange={(e) =>
                        onWarehouseChange(item.id, e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceExpandedRow;
