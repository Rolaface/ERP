import React, { useCallback, useEffect, useRef, useState } from "react";

import { getInvoiceAdapter, isSupportedPartyType } from "../adapters/invoice.adapter.registry";
import type {
  AllocationMap,
  AllocationResult,
  NormalizedInvoice,
  NormalizedPage,
  NormalizedPagination,
} from "../types/paymententryrecord.types";

const PAGE_SIZE = 10;

function makeCacheKey(partyType: string, partyName: string, page: number, ref?: string): string {
  return `${partyType}::${partyName}::${page}::${ref ?? "all"}`;
}

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
  referenceInvoice?: string
): UseInvoiceListReturn {
  const adapter     = getInvoiceAdapter(partyType);
  const isSupported = isSupportedPartyType(partyType);

  const [invoices, setInvoices]       = useState<NormalizedInvoice[]>([]);
  const [pagination, setPagination]   = useState<NormalizedPagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]         = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [editingRow, setEditingRow]   = useState<string | null>(null);
  const [allocated, setAllocated]     = useState<AllocationMap>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const paymentAmountRef   = useRef(paymentAmount);
  paymentAmountRef.current = paymentAmount;

  const onFormChangeRef    = useRef(onFormChange);
  onFormChangeRef.current  = onFormChange;

  const referenceInvoiceRef   = useRef(referenceInvoice);
  referenceInvoiceRef.current = referenceInvoice;

  const lastFifoTrigger = useRef<number>(0);
  const pageCache       = useRef<Map<string, NormalizedPage>>(new Map());

  // ── Fetch page ─────────────────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (page: number) => {
      if (!adapter) return;

      const cacheKey = makeCacheKey(partyType, partyName ?? "", page, referenceInvoiceRef.current);
      const cached   = pageCache.current.get(cacheKey);
      if (cached) {
        setInvoices(cached.data);
        setPagination(cached.pagination);
        return;
      }

      setLoading(true);
      setFetchError(null);

      try {
        const ref = referenceInvoiceRef.current;
        let filtered: NormalizedPage;

        if (ref) {
          // Specific invoice — fetch all and filter so page boundary doesn't matter
          const allData = await adapter.fetchAllForFifo(partyName);
          const match   = allData.filter((inv) => inv.invoiceNumber === ref);
          filtered = {
            data: match,
            pagination: { page: 1, totalPages: 1, total: match.length, hasNext: false, hasPrev: false },
          };
        } else {
          filtered = await adapter.fetchPage({ page, pageSize: PAGE_SIZE, partyName });
        }

        pageCache.current.set(cacheKey, filtered);
        setInvoices(filtered.data);
        setPagination(filtered.pagination);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    },
    [adapter, partyType, partyName]
  );

  const fetchPageRef   = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  // ── Effect 1: party / referenceInvoice change → reset + fetch ─────────────
  // FIX: agar fifoTrigger already pending hai (modal open pe set tha) toh
  // allocated/inputValues reset mat karo — FIFO effect unhe set karega
  // Pehle yeh wipe hota tha → FIFO result gayab ho jaata tha (first click issue)
  useEffect(() => {
    const fifoAlreadyPending =
      fifoTrigger !== undefined && fifoTrigger !== lastFifoTrigger.current;

    setCurrentPage(1);
    setInvoices([]);
    setPagination(null);
    setFetchError(null);
    pageCache.current.clear();

    if (!fifoAlreadyPending) {
      // FIFO pending nahi — safe to reset allocation state
      setAllocated({});
      setInputValues({});
    }
    // FIFO pending hai — allocation state wipe mat karo, FIFO set karega

    if (isSupported && partyType) fetchPageRef.current(1);
  }, [partyType, partyName, referenceInvoice]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 2: page navigation ──────────────────────────────────────────────
  useEffect(() => {
    if (currentPage === 1) return;
    if (isSupported && partyType) fetchPageRef.current(currentPage);
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const allData = await adapter.fetchAllForFifo(partyName);
        const ref         = referenceInvoiceRef.current;
        const allInvoices = ref
          ? allData.filter((inv) => inv.invoiceNumber === ref)
          : allData;

        if (cancelled) return;

        const newAllocated    = runFifoAllocation(allInvoices, budget);
        const newInputValues: Record<string, string> = {};
        for (const [num, amount] of Object.entries(newAllocated)) {
          newInputValues[num] = String(amount);
        }

        setAllocated(newAllocated);
        setInputValues(newInputValues);
        publishAllocation(newAllocated);

        pageCache.current.clear();
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
        const raw         = inputValues[invoiceNumber] ?? "";
        const value       = parseFloat(raw) || 0;
        const othersTotal = Object.entries(prev)
          .filter(([k]) => k !== invoiceNumber)
          .reduce((sum, [, v]) => sum + v, 0);
        const remainingBudget = paymentAmountRef.current - othersTotal;
        const safeValue = Math.max(0, Math.min(value, outstandingMax, Math.max(0, remainingBudget)));

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