import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchPendingPurchaseInvoiceImports } from "../../api/procurement/Importedpurchaseinvoice.api";
import type {
  ImportPurchaseInvoiceItem,
  ImportPurchaseInvoiceItemApiRaw,
  ImportPurchaseInvoiceItemsTotals,
  RemarksMap,
} from "../../types/procument/imported_purchase/processImportPurchaseInvoiceModal.types";

function mapRawItem(raw: ImportPurchaseInvoiceItemApiRaw): ImportPurchaseInvoiceItem {
  return {
    id: `${raw.spplrTpin}-${raw.spplrInvcNo}-${raw.itemSeq}`,
    invoiceNo: raw.spplrInvcNo,
    supplierTpin: raw.spplrTpin,
    supplierName: raw.spplrNm,
    supplierBranchId: raw.spplrBhfId,
    receiptTypeCd: raw.rcptTyCd,
    paymentTypeCd: raw.pmtTyCd,
    confirmedAt: raw.cfmDt,
    salesDate: raw.salesDt,
    stockReleaseDate: raw.stockRlsDt,
    itemSeq: raw.itemSeq,
    itemCd: raw.itemCd,
    itemClassCd: raw.itemClsCd,
    itemName: raw.itemNm,
    barcode: raw.bcd,
    packageUnitCd: raw.pkgUnitCd,
    packageCount: raw.pkg,
    qtyUnitCd: raw.qtyUnitCd,
    qty: raw.qty,
    unitPrice: raw.prc,
    supplyAmount: raw.splyAmt,
    discountRate: raw.dcRt,
    discountAmount: raw.dcAmt,
    vatCategoryCd: raw.vatCatCd,
    taxableAmount: raw.taxblAmt,
    vatAmount: raw.vatAmt,
    itemTotalAmount: raw.totAmt,
    invoiceTotalAmount: raw.invTotAmt,
    invoiceTaxAmount: raw.invTotTaxAmt,
    invoiceItemCount: raw.invTotItemCnt,
    remark: raw.invRemark,
    mappedInvoiceCode: null,
  };
}

export function useProcessImportPurchaseInvoiceModal(isOpen: boolean) {
  const [items, setItems] = useState<ImportPurchaseInvoiceItem[]>([]);
  const [remarks, setRemarks] = useState<RemarksMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await fetchPendingPurchaseInvoiceImports();
      setItems(raw.map(mapRawItem));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load purchase invoice imports"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, loadItems]);

  const totals: ImportPurchaseInvoiceItemsTotals = useMemo(
    () => ({
      totalItems: items.length,
      totalPackages: items.reduce((sum, i) => sum + i.packageCount, 0),
      totalAmount: items.reduce((sum, i) => sum + i.itemTotalAmount, 0),
    }),
    [items]
  );

  const handleRemarkChange = useCallback((itemId: string, value: string) => {
    setRemarks((prev) => ({ ...prev, [itemId]: value }));
  }, []);

  return {
    items,
    totals,
    remarks,
    handleRemarkChange,
    isLoading,
    error,
    refresh: loadItems,
  };
}