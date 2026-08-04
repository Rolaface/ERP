import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchPendingImportDeclarations,
  submitImportDecisions,
} from "../../api/Inventory/Processimportmodal.api";
import type {
  DecisionsMap,
  ImportItem,
  ImportItemApiRaw,
  ImportItemsTotals,
  MappedItemsMap,
  RemarksMap,
  WarehouseMap,
} from "../../types/inventory/Processimportmodal.types";

function mapRawItem(raw: ImportItemApiRaw): ImportItem {
  return {
    id: `${raw.dclNo}-${raw.itemSeq}`,
    dclNo: raw.dclNo,
    dclDe: raw.dclDe,
    itemSeq: raw.itemSeq,
    itemNm: raw.itemNm,
    hsCd: raw.hsCd,
    taskCd: raw.taskCd,
    statusCd: raw.imptItemsttsCd,
    orgnNatCd: raw.orgnNatCd,
    exptNatCd: raw.exptNatCd,
    qty: raw.qty,
    qtyUnitCd: raw.qtyUnitCd,
    totWt: raw.totWt,
    netWt: raw.netWt,
    pkg: raw.pkg,
    pkgUnitCd: raw.pkgUnitCd,
    agntNm: raw.agntNm,
    supplierNm: raw.spplrNm,
    amount: raw.invcFcurAmt,
    currencyCd: raw.invcFcurCd,
    exchangeRate: raw.invcFcurExcrt,
    dclRefNum: raw.dclRefNum,
    mappedItemCode: null,
  };
}

export function useProcessImportModal(isOpen: boolean) {
  const [items, setItems] = useState<ImportItem[]>([]);
  const [decisions, setDecisions] = useState<DecisionsMap>({});
  const [remarks, setRemarks] = useState<RemarksMap>({});
  const [mappedItems, setMappedItems] = useState<MappedItemsMap>({});
  const [warehouses, setWarehouses] = useState<WarehouseMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchPendingImportDeclarations();
      setItems(response.data.map(mapRawItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load import declarations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, loadItems]);

  const totals: ImportItemsTotals = useMemo(
    () => ({
      totalItems: items.length,
      totalWeight: items.reduce((sum, i) => sum + i.totWt, 0),
      totalPackages: items.reduce((sum, i) => sum + i.pkg, 0),
    }),
    [items]
  );

  const handleDecision = useCallback((itemId: string, type: "approve" | "reject") => {
    setDecisions((prev) => ({
      ...prev,
      // clicking the same decision again clears it back to pending
      [itemId]: prev[itemId] === type ? null : type,
    }));
  }, []);

  const handleRemarkChange = useCallback((itemId: string, value: string) => {
    setRemarks((prev) => ({ ...prev, [itemId]: value }));
  }, []);

  const handleMappedItemChange = useCallback(
  (itemId: string, item: { itemCode: string; itemClassCode: string }) => {
    setMappedItems((prev) => ({
      ...prev,
      [itemId]: item,
    }));
  },
  []
);

  const handleWarehouseChange = useCallback(
    (itemId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
      setWarehouses((prev) => ({ ...prev, [itemId]: e.target.value }));
    },
    []
  );

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

    // Every item with a decision (approve/reject) needs its own warehouse now —
    // there's no single modal-level warehouse to fall back on anymore.
    const decidedItems = items.filter(
      (item) => decisions[item.id] === "approve" || decisions[item.id] === "reject"
    );
    if (decidedItems.length === 0) return;

    const missingWarehouse = decidedItems.find((item) => !warehouses[item.id]);
    if (missingWarehouse) {
      setError(`Please select a warehouse for "${missingWarehouse.itemNm}"`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitImportDecisions(items, decisions, remarks, mappedItems, warehouses);
      await loadItems();
      setDecisions({});
      setRemarks({});
      setMappedItems({});
      setWarehouses({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit decisions");
    } finally {
      setIsSubmitting(false);
    }
  }, [items, decisions, remarks, mappedItems, warehouses, loadItems]);

  return {
    items,
    totals,
    decisions,
    remarks,
    mappedItems,
    warehouses,
    handleWarehouseChange,
    handleDecision,
    handleRemarkChange,
    handleMappedItemChange,
    approveAllRemaining,
    counts,
    isLoading,
    isSubmitting,
    error,
    refresh: loadItems,
    submit,
  };
}