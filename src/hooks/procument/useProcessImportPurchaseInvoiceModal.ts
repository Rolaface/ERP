import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchPendingPurchaseInvoiceImports,
  submitPurchaseInvoiceImportDecisions,
} from "../../api/procurement/Importedpurchaseinvoice.api";
import type {
  DecisionsMap,
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
    itemSeq: raw.itemSeq,
    itemCd: raw.itemCd,
    itemClassCd: raw.itemClsCd,
    itemName: raw.itemNm,
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
  const [decisions, setDecisions] = useState<DecisionsMap>({});
  const [remarks, setRemarks] = useState<RemarksMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleDecision = useCallback(
    (itemId: string, type: "approve" | "reject") => {
      setDecisions((prev) => ({
        ...prev,
        [itemId]: prev[itemId] === type ? null : type,
      }));
    },
    []
  );

  const handleRemarkChange = useCallback((itemId: string, value: string) => {
    setRemarks((prev) => ({ ...prev, [itemId]: value }));
  }, []);

  const approveAllRemaining = useCallback(() => {
    setDecisions((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        if (!next[item.id]) next[item.id] = "approve";
      });
      return next;
    });
  }, [items]);

  const counts = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    items.forEach((item) => {
      const d = decisions[item.id];
      if (d === "approve") approved += 1;
      else if (d === "reject") rejected += 1;
    });
    return { approved, rejected, pending: items.length - approved - rejected };
  }, [items, decisions]);

  const submit = useCallback(async () => {
    if (items.length === 0) return;

    const decidedItems = items.filter(
      (item) =>
        decisions[item.id] === "approve" || decisions[item.id] === "reject"
    );
    if (decidedItems.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await submitPurchaseInvoiceImportDecisions(items, decisions, remarks);
      await loadItems();
      setDecisions({});
      setRemarks({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit decisions");
    } finally {
      setIsSubmitting(false);
    }
  }, [items, decisions, remarks, loadItems]);

  return {
    items,
    totals,
    decisions,
    remarks,
    handleDecision,
    handleRemarkChange,
    approveAllRemaining,
    counts,
    isLoading,
    isSubmitting,
    error,
    refresh: loadItems,
    submit,
  };
}