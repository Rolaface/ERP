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

// ─── Cache key ────────────────────────────────────────────────────────────────

function makeCacheKey(partyType: string, partyName: string, page: number): string {
  return `${partyType}::${partyName}::${page}`;
}

// ─── FIFO core — pure function, fully testable ────────────────────────────────

export function runFifoAllocation(
  invoices: NormalizedInvoice[],
  budget: number
): AllocationMap {
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

// ─── Build AllocationResult from map ─────────────────────────────────────────

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

// ─── Hook return type ─────────────────────────────────────────────────────────

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInvoiceList(
  partyType: string,
  partyName: string | undefined,
  paymentAmount: number,
  fifoTrigger: number | undefined,
  onFormChange: (data: AllocationResult) => void
): UseInvoiceListReturn {
  const adapter = getInvoiceAdapter(partyType);
  const isSupported = isSupportedPartyType(partyType);

  // ── State ──────────────────────────────────────────────────────────────────
  const [invoices, setInvoices]       = useState<NormalizedInvoice[]>([]);
  const [pagination, setPagination]   = useState<NormalizedPagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]         = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [editingRow, setEditingRow]   = useState<string | null>(null);
  const [allocated, setAllocated]     = useState<AllocationMap>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // ── Refs ───────────────────────────────────────────────────────────────────
  const paymentAmountRef = useRef(paymentAmount);
  paymentAmountRef.current = paymentAmount;

  const onFormChangeRef = useRef(onFormChange);
  onFormChangeRef.current = onFormChange;

  const lastFifoTrigger = useRef<number>(0);
  const pageCache = useRef<Map<string, NormalizedPage>>(new Map());

  // ── Fetch page ─────────────────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (page: number) => {
      if (!adapter) return;

      const cacheKey = makeCacheKey(partyType, partyName ?? "", page);
      const cached = pageCache.current.get(cacheKey);

      if (cached) {
        setInvoices(cached.data);
        setPagination(cached.pagination);
        return;
      }

      setLoading(true);
      setFetchError(null);

      try {
        const result = await adapter.fetchPage({
          page,
          pageSize: PAGE_SIZE,
          partyName,
        });

        pageCache.current.set(cacheKey, result);
        setInvoices(result.data);
        setPagination(result.pagination);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load invoices.";
        setFetchError(message);
      } finally {
        setLoading(false);
      }
    },
    [adapter, partyType, partyName]
  );

  // ── fetchPageRef — FIFO aur page nav stale closure se bachte hain ──────────
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  // ── Effect 1: party change → reset + page 1 fetch ─────────────────────────
  // Dono ek saath — alag effects mein double fetch hoti thi
  useEffect(() => {
    setCurrentPage(1);
    setAllocated({});
    setInputValues({});
    setInvoices([]);
    setPagination(null);
    setFetchError(null);
    pageCache.current.clear();

    if (isSupported && partyType) {
      fetchPageRef.current(1);
    }
  }, [partyType, partyName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 2: page navigation — page 1 upar handle ho gaya ───────────────
  useEffect(() => {
    if (currentPage === 1) return;
    if (isSupported && partyType) fetchPageRef.current(currentPage);
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Publish allocation to parent ───────────────────────────────────────────
  const publishAllocation = useCallback((map: AllocationMap) => {
    onFormChangeRef.current(buildAllocationResult(map));
  }, []);

  // ── Effect 3: FIFO allocation ──────────────────────────────────────────────
  useEffect(() => {
    const trigger = fifoTrigger;
    if (!trigger || trigger === lastFifoTrigger.current || !adapter) return;
    lastFifoTrigger.current = trigger;

    const budget = paymentAmountRef.current;
    if (budget <= 0) return;

    let cancelled = false;

    const runFifo = async () => {
      try {
        const allInvoices = await adapter.fetchAllForFifo(partyName);
        if (cancelled) return;

        const newAllocated = runFifoAllocation(allInvoices, budget);
        const newInputValues: Record<string, string> = {};

        for (const [num, amount] of Object.entries(newAllocated)) {
          newInputValues[num] = String(amount);
        }

        setAllocated(newAllocated);
        setInputValues(newInputValues);
        publishAllocation(newAllocated);

        pageCache.current.clear();
        setCurrentPage(1);
        fetchPageRef.current(1); // ref se — fetchPage deps mein nahi
      } catch {
        // silent — manual allocation block nahi hogi
      }
    };

    runFifo();
    return () => { cancelled = true; };
  }, [fifoTrigger]); // sirf fifoTrigger — pehle 5 deps the jo double-run karate the

  // ── Manual allocation handlers ─────────────────────────────────────────────
  const handleInputChange = useCallback(
    (invoiceNumber: string, raw: string) => {
      if (!/^\d*\.?\d*$/.test(raw)) return;
      setInputValues((prev) => ({ ...prev, [invoiceNumber]: raw }));
    },
    []
  );

  const handleInputBlur = useCallback(
    (invoiceNumber: string, outstandingMax: number) => {
      setAllocated((prev) => {
        const raw = inputValues[invoiceNumber] ?? "";
        const value = parseFloat(raw) || 0;

        const othersTotal = Object.entries(prev)
          .filter(([k]) => k !== invoiceNumber)
          .reduce((sum, [, v]) => sum + v, 0);

        const remainingBudget = paymentAmountRef.current - othersTotal;
        const safeValue = Math.max(
          0,
          Math.min(value, outstandingMax, Math.max(0, remainingBudget))
        );

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

  // ── Derived values ─────────────────────────────────────────────────────────
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