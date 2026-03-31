import { useCallback, useEffect, useRef, useState } from "react";
import { getInvoiceAdapter, isSupportedPartyType } from "../adapters/invoice.adapter.registry";
import type {
  AllocationMap,
  AllocationResult,
  NormalizedInvoice,
  NormalizedPagination,
} from "../types/paymententryrecord.types";

const PAGE_SIZE = 10;

// ─── Greedy allocation in API order (no frontend sorting — API returns FIFO) ──
function runGreedyAllocation(invoices: NormalizedInvoice[], budget: number): AllocationMap {
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
  onFormChange: (data: AllocationResult) => void,
  referenceInvoice?: string,
  initialAllocated?: Record<string, number>,
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

  // ── Refs — avoid stale closures ───────────────────────────────────────────
  const paymentAmountRef    = useRef(paymentAmount);
  paymentAmountRef.current  = paymentAmount;

  const onFormChangeRef     = useRef(onFormChange);
  onFormChangeRef.current   = onFormChange;

  const referenceInvoiceRef = useRef(referenceInvoice);
  referenceInvoiceRef.current = referenceInvoice;

  // Track the amount that was used for the last auto-allocation.
  // If paymentAmount differs on next tab visit → re-run allocation.
  const lastAutoAllocatedAmountRef = useRef<number | null>(
    initialAllocated && Object.keys(initialAllocated).length > 0
      ? paymentAmount   // treat initial as already allocated
      : null
  );

  const publishAllocation = useCallback((map: AllocationMap) => {
    onFormChangeRef.current(buildAllocationResult(map));
  }, []);

  // ── Fetch a single page (display only — no allocation side-effect) ─────────
  const fetchPage = useCallback(async (page: number) => {
    if (!adapter) return;
    setLoading(true);
    setFetchError(null);
    try {
      const ref = referenceInvoiceRef.current;
      if (ref) {
        const allData = await adapter.fetchAllForFifo(partyName);
        const match   = allData.filter((inv) => inv.invoiceNumber === ref);
        setInvoices(match);
        setPagination({ page: 1, totalPages: 1, total: match.length, hasNext: false, hasPrev: false });
      } else {
        const result = await adapter.fetchPage({ page, pageSize: PAGE_SIZE, partyName });
        setInvoices(result.data);
        setPagination(result.pagination);
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }, [adapter, partyName]);

  const fetchPageRef   = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  // ── Auto-FIFO allocation — fetch all → allocate greedily in API order ─────
  // Called on mount and whenever paymentAmount changes since last run.
  const runAutoAllocation = useCallback(async () => {
    if (!adapter) return;
    const budget = paymentAmountRef.current;
    if (budget <= 0) return;

    let cancelled = false;
    try {
      const ref         = referenceInvoiceRef.current;
      const allData     = await adapter.fetchAllForFifo(partyName);
      const allInvoices = ref
        ? allData.filter((inv) => inv.invoiceNumber === ref)
        : allData;

      if (cancelled) return;

      // API already returns invoices in FIFO order — allocate as-is
      const newAllocated = runGreedyAllocation(allInvoices, budget);

      const newInputValues: Record<string, string> = {};
      for (const [num, amount] of Object.entries(newAllocated)) {
        newInputValues[num] = String(amount);
      }

      setAllocated(newAllocated);
      setInputValues(newInputValues);
      publishAllocation(newAllocated);
      lastAutoAllocatedAmountRef.current = budget;

      // Refresh the visible page after allocation
      setCurrentPage(1);
      fetchPageRef.current(1);
    } catch {
      // silent — page fetch will show its own error
    }
    return () => { cancelled = true; };
  }, [adapter, partyName, publishAllocation]);

  // ── Effect 1: On mount — party / referenceInvoice change ─────────────────
  // Reset state, then decide: run auto-allocation or just fetch page.
  useEffect(() => {
    setCurrentPage(1);
    setInvoices([]);
    setPagination(null);
    setFetchError(null);

    if (!isSupported || !partyType) return;

    const budget = paymentAmountRef.current;
    const needsAllocation =
      budget > 0 &&
      lastAutoAllocatedAmountRef.current !== budget;

    if (needsAllocation) {
      // Reset allocation state before re-running
      setAllocated({});
      setInputValues({});
      runAutoAllocation();
    } else {
      // Allocation already correct for this amount — just fetch display page
      fetchPageRef.current(1);
    }
  }, [partyType, partyName, referenceInvoice]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 2: Page navigation ─────────────────────────────────────────────
  useEffect(() => {
    if (isSupported && partyType) fetchPageRef.current(currentPage);
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 3: paymentAmount changed → mark for re-allocation ─────────────
  // We don't run immediately (component may be hidden). Mark stale so that
  // the next time Effect 1 fires (tab revisit / party change) it re-runs.
  // But if component IS mounted and amount changes, re-run right away.
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    // Amount changed while this component is mounted — re-run allocation
    if (isSupported && partyType) {
      lastAutoAllocatedAmountRef.current = null; // mark stale
      setAllocated({});
      setInputValues({});
      runAutoAllocation();
    }
  }, [paymentAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manual allocation ─────────────────────────────────────────────────────
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