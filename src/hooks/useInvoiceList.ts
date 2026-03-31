import React, { useCallback, useEffect, useRef, useState } from "react";

import { getInvoiceAdapter, isSupportedPartyType } from "../adapters/invoice.adapter.registry";
import type {
  AllocationMap,
  AllocationResult,
  NormalizedInvoice,
  NormalizedPagination,
} from "../types/paymententryrecord.types";

const PAGE_SIZE = 10;

export function runFifoAllocation(invoices: NormalizedInvoice[], budget: number): AllocationMap {
  if (budget <= 0) return {};
  const result: AllocationMap = {};
  let remaining = budget;
  for (const inv of invoices) {
    if (remaining <= 0) break;
    const allocate = Math.min(inv.outstanding, remaining);
    if (allocate > 0) {
      result[inv.invoiceNumber] = allocate;
      remaining -= allocate;
    }
  }
  return result;
}

function buildAllocationResult(map: AllocationMap): AllocationResult {
  const selectedInvoices = Object.entries(map)
    .filter(([, amount]) => amount > 0)
    .map(([invoiceNumber, amount]) => ({ invoiceNumber, amount }));
  return {
    selectedInvoices,
    allocatedAmount: selectedInvoices.reduce((sum, i) => sum + i.amount, 0),
    allocations: map,
  };
}

export interface UseInvoiceListReturn {
  invoices: NormalizedInvoice[];
  pagination: NormalizedPagination | null;
  loading: boolean;
  fetchError: string | null;
  currentPage: number;
  isSupported: boolean;
  allocated: AllocationMap;
  inputValues: Record<string, string>;
  setInputValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  totalAllocated: number;
  remainingToAllocate: number;
  editingRow: string | null;
  setCurrentPage: (page: number) => void;
  setEditingRow: (id: string | null) => void;
  handleInputChange: (invoiceNumber: string, raw: string) => void;
  handleInputBlur: (invoiceNumber: string, outstandingMax: number) => void;
  retryFetch: () => void;
}

export function useInvoiceList(
  partyType: string,
  partyName: string | undefined,
  paymentAmount: number,
  fifoTrigger: number | undefined,
  onFormChange: (data: AllocationResult) => void,
  referenceInvoice?: string,
   initialAllocated?: Record<string, number>  

  
): UseInvoiceListReturn {
  const adapter     = getInvoiceAdapter(partyType);
  const isSupported = isSupportedPartyType(partyType);

  const [invoices, setInvoices]       = useState<NormalizedInvoice[]>([]);
  const [pagination, setPagination]   = useState<NormalizedPagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]         = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [editingRow, setEditingRow]   = useState<string | null>(null);
const [allocated, setAllocated] = useState<AllocationMap>(initialAllocated ?? {});
const [inputValues, setInputValues] = useState<Record<string, string>>(
  Object.fromEntries(
    Object.entries(initialAllocated ?? {}).map(([k, v]) => [k, String(v)])
  )
);

  const paymentAmountRef      = useRef(paymentAmount);
  paymentAmountRef.current    = paymentAmount;

  const onFormChangeRef       = useRef(onFormChange);
  onFormChangeRef.current     = onFormChange;

  const referenceInvoiceRef   = useRef(referenceInvoice);
  referenceInvoiceRef.current = referenceInvoice;

  const lastFifoTrigger = useRef<number>(0);

  // ── Fetch page — no cache, no frontend filtering, backend handles everything
  const fetchPage = useCallback(
    async (page: number) => {
      if (!adapter) return;

      setLoading(true);
      setFetchError(null);

      try {
        const ref = referenceInvoiceRef.current;

        if (ref) {
          // Specific invoice context — fetch all for FIFO and filter by ref
          const allData = await adapter.fetchAllForFifo(partyName);
          const match   = allData.filter((inv) => inv.invoiceNumber === ref);
          setInvoices(match);
          setPagination({
            page: 1,
            totalPages: 1,
            total: match.length,
            hasNext: false,
            hasPrev: false,
          });
        } else {
          // Normal flow — backend handles pagination entirely
          const result = await adapter.fetchPage({ page, pageSize: PAGE_SIZE, partyName });
          setInvoices(result.data);
          setPagination(result.pagination);
          console.log(result);

        }
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    },
    [adapter, partyName] // eslint-disable-line react-hooks/exhaustive-deps
    
  );

  const fetchPageRef   = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  // ── Effect 1: party / referenceInvoice change → reset + fetch ─────────────
  useEffect(() => {
    const fifoAlreadyPending =
      fifoTrigger !== undefined && fifoTrigger !== lastFifoTrigger.current;

    setCurrentPage(1);
    setInvoices([]);
    setPagination(null);
    setFetchError(null);

  if (!fifoAlreadyPending) {
  const seedAllocated = initialAllocated && Object.keys(initialAllocated).length > 0
    ? initialAllocated
    : {};
  setAllocated(seedAllocated);
  setInputValues(
    Object.fromEntries(Object.entries(seedAllocated).map(([k, v]) => [k, String(v)]))
  );
}

    if (isSupported && partyType) fetchPageRef.current(1);
  }, [partyType, partyName, referenceInvoice]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 2: page navigation — just call backend with new page number ─────
 useEffect(() => {
  if (isSupported && partyType) fetchPageRef.current(currentPage);
}, [currentPage]); 

  const publishAllocation = useCallback((map: AllocationMap) => {
    onFormChangeRef.current(buildAllocationResult(map));
  }, []);

  // ── Effect 3: FIFO ─────────────────────────────────────────────────────────
  useEffect(() => {
    const trigger = fifoTrigger;
    if (!trigger || trigger === lastFifoTrigger.current || !adapter) return;
    lastFifoTrigger.current = trigger;

    const budget = paymentAmountRef.current;
    if (budget <= 0) return;

    let cancelled = false;

    const runFifo = async () => {
      try {
        const allData     = await adapter.fetchAllForFifo(partyName);
        const ref         = referenceInvoiceRef.current;
        const allInvoices = ref
          ? allData.filter((inv) => inv.invoiceNumber === ref)
          : allData;

        if (cancelled) return;

        const newAllocated                        = runFifoAllocation(allInvoices, budget);
        const newInputValues: Record<string, string> = {};
        for (const [num, amount] of Object.entries(newAllocated)) {
          newInputValues[num] = String(amount);
        }

        setAllocated(newAllocated);
        setInputValues(newInputValues);
        publishAllocation(newAllocated);

        // Refresh page 1 from backend after FIFO
        setCurrentPage(1);
        fetchPageRef.current(1);
      } catch {
        // silent
      }
    };

    runFifo();
    return () => { cancelled = true; };
  }, [fifoTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manual allocation ──────────────────────────────────────────────────────
  const handleInputChange = useCallback((invoiceNumber: string, raw: string) => {
    if (!/^\d*\.?\d*$/.test(raw)) return;
    setInputValues((prev) => ({ ...prev, [invoiceNumber]: raw }));
  }, []);

  const handleInputBlur = useCallback(
    (invoiceNumber: string, outstandingMax: number) => {
      setAllocated((prev) => {
        const raw             = inputValues[invoiceNumber] ?? "";
        const value           = parseFloat(raw) || 0;
        const othersTotal     = Object.entries(prev)
          .filter(([k]) => k !== invoiceNumber)
          .reduce((sum, [, v]) => sum + v, 0);
        const remainingBudget = paymentAmountRef.current - othersTotal;
        const safeValue       = Math.max(0, Math.min(value, outstandingMax, Math.max(0, remainingBudget)));

        setInputValues((iv) => ({
          ...iv,
          [invoiceNumber]: safeValue > 0 ? String(safeValue) : "",
        }));

        const next = { ...prev, [invoiceNumber]: safeValue };
        if (safeValue === 0) delete next[invoiceNumber];
        publishAllocation(next);
        return next;
      });
      setEditingRow(null);
    },
    [inputValues, publishAllocation]
  );

  const totalAllocated = Object.values(allocated).reduce((a, b) => a + b, 0);

  return {
    invoices,
    pagination,
    loading,
    fetchError,
    currentPage,
    isSupported,
    allocated,
    inputValues,
    setInputValues,
    totalAllocated,
    remainingToAllocate: paymentAmount - totalAllocated,
    editingRow,
    setCurrentPage,
    setEditingRow,
    handleInputChange,
    handleInputBlur,
    retryFetch: () => fetchPage(currentPage),
  };
}