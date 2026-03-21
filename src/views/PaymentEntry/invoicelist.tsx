import React, { useCallback, useEffect, useRef, useState } from "react";
import { getAllSalesInvoices } from "../../api/salesApi";
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Pencil } from "lucide-react";

interface Props {
  form: any;
  onFormChange: (data: any) => void;
}

interface InvoiceRow {
  invoiceNumber: string;
  customerName: string;
  dueDate: string;
  dueDateRaw: string; // for FIFO sort
  amount: number;
  outstanding: number;
}

const PAGE_SIZE = 10;

const InvoiceList: React.FC<Props> = ({ form, onFormChange }) => {
  const [allData, setAllData] = useState<InvoiceRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);

  const [allocated, setAllocated] = useState<Record<string, number>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const paymentAmountRef = useRef<number>(0);
  paymentAmountRef.current = Number(form?.amount || 0);

  const partyNameRef = useRef<string | undefined>(undefined);
  partyNameRef.current = form?.partyName ?? undefined;

  // Track last fifoTrigger to detect new triggers
  const lastFifoTrigger = useRef<number>(0);

  const totalPages = Math.max(1, Math.ceil(allData.length / PAGE_SIZE));
  const pageData = allData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paymentAmount = paymentAmountRef.current;

  const fetchInvoices = useCallback(async () => {
    let cancelled = false;
    try {
      setLoading(true);
      setFetchError(null);
      const res = await getAllSalesInvoices(1, 1000, "", "asc", undefined, partyNameRef.current);
      if (cancelled) return;

      const mapped: InvoiceRow[] = (res?.data ?? [])
        .map((inv: any) => ({
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—",
          dueDateRaw: inv.dueDate ?? "9999-12-31",
          amount: Number(inv.totalAmount || 0),
          outstanding: Number(inv.OutStandingAmount ?? inv.outstandingAmount ?? 0),
        }))
        .filter((i: InvoiceRow) => i.outstanding > 0)
        .sort((a: InvoiceRow, b: InvoiceRow) => a.dueDateRaw.localeCompare(b.dueDateRaw)); // FIFO by due date

      setAllData(mapped);
      setCurrentPage(1);
    } catch {
      if (!cancelled) setFetchError("Failed to load invoices. Please try again.");
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // ✅ FIFO auto-allocation — triggered when form.fifoTrigger changes
  useEffect(() => {
    const trigger = form?.fifoTrigger;
    if (!trigger || trigger === lastFifoTrigger.current) return;
    if (allData.length === 0) return;

    lastFifoTrigger.current = trigger;

    let budget = paymentAmountRef.current;
    if (budget <= 0) return;

    const newAllocated: Record<string, number> = {};
    const newInputValues: Record<string, string> = {};

    // Allocate in FIFO order (already sorted by dueDate)
    for (const inv of allData) {
      if (budget <= 0) break;
      const allocate = Math.min(inv.outstanding, budget);
      if (allocate > 0) {
        newAllocated[inv.invoiceNumber] = allocate;
        newInputValues[inv.invoiceNumber] = String(allocate);
        budget -= allocate;
      }
    }

    setAllocated(newAllocated);
    setInputValues(newInputValues);

    const selectedInvoices = allData.filter((d) => newAllocated[d.invoiceNumber] > 0);
    const totalAllocated = selectedInvoices.reduce((sum, i) => sum + (newAllocated[i.invoiceNumber] || 0), 0);
    onFormChange({ selectedInvoices, allocatedAmount: totalAllocated, allocations: newAllocated });

    // Jump to page 1 to show first allocated invoices
    setCurrentPage(1);
  }, [form?.fifoTrigger, allData]);

  // ── manual allocation handlers ─────────────────────────────────────────
  const handleInputChange = (invoiceNumber: string, raw: string) => {
    if (!/^\d*\.?\d*$/.test(raw)) return;
    setInputValues((prev) => ({ ...prev, [invoiceNumber]: raw }));
  };

  const handleInputBlur = (invoiceNumber: string, outstandingMax: number) => {
    const raw = inputValues[invoiceNumber] ?? "";
    const value = parseFloat(raw) || 0;

    const totalAllocatedOthers = Object.entries(allocated)
      .filter(([k]) => k !== invoiceNumber)
      .reduce((sum, [, v]) => sum + v, 0);

    const remainingPayment = paymentAmountRef.current - totalAllocatedOthers;
    const maxAllowable = Math.min(outstandingMax, Math.max(0, remainingPayment));
    const safeValue = Math.max(0, Math.min(value, maxAllowable));

    setInputValues((prev) => ({ ...prev, [invoiceNumber]: safeValue > 0 ? String(safeValue) : "" }));

    const updated = { ...allocated, [invoiceNumber]: safeValue };
    setAllocated(updated);
    setEditingRow(null);

    const selectedInvoices = allData.filter((d) => updated[d.invoiceNumber] > 0);
    const totalAllocated = selectedInvoices.reduce((sum, i) => sum + (updated[i.invoiceNumber] || 0), 0);
    onFormChange({ selectedInvoices, allocatedAmount: totalAllocated, allocations: updated });
  };

  const totalAllocated = Object.values(allocated).reduce((a, b) => a + b, 0);
  const remainingToAllocate = paymentAmount - totalAllocated;
  const showRemainingWarning = paymentAmount > 0 && totalAllocated > 0 && remainingToAllocate > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading invoices...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
        <AlertTriangle size={15} />
        <span className="text-sm">{fetchError}</span>
        <button onClick={fetchInvoices} className="text-xs text-primary underline">Retry</button>
      </div>
    );
  }

  if (allData.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted">
        <span className="text-sm">No outstanding invoices found.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">

      {showRemainingWarning && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-semibold">₹ {remainingToAllocate.toLocaleString()}</span> is still unallocated.
            Allocate it to an invoice, or reduce the payment amount to{" "}
            <span className="font-semibold">₹ {totalAllocated.toLocaleString()}</span> in the Details tab.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">

        {/* Header */}
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_32px] bg-[var(--row-hover)] border-b border-[var(--border)] px-4 py-2.5">
          {(["Invoice No", "Due Date", "Total Due", "Paid", "Outstanding", "Allocate"] as const).map((h, i) => (
            <div key={h} className={`text-[11px] font-semibold uppercase tracking-wide text-muted ${i >= 2 ? "text-right" : ""}`}>
              {h}
            </div>
          ))}
          <div /> {/* edit col */}
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--border)]">
          {pageData.map((r) => {
            const paid = r.amount - r.outstanding;
            const isAllocated = (allocated[r.invoiceNumber] ?? 0) > 0;
            const isEditing = editingRow === r.invoiceNumber;
            const noBalance = remainingToAllocate <= 0 && !isAllocated;

            return (
              <div
                key={r.invoiceNumber}
                className={`grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_32px] px-4 py-3 items-center
                  transition-colors hover:bg-[var(--row-hover)]
                  ${isAllocated ? "bg-primary/[0.03]" : ""}`}
              >
                <div className="text-xs font-medium text-main">{r.invoiceNumber}</div>
                <div className="text-xs text-muted">{r.dueDate}</div>
                <div className="text-right text-xs font-mono text-main">₹ {r.amount.toLocaleString()}</div>
                <div className="text-right text-xs font-mono text-emerald-600">₹ {paid.toLocaleString()}</div>
                <div className="text-right text-xs font-mono font-semibold text-amber-600">₹ {r.outstanding.toLocaleString()}</div>

                {/* Allocate cell — shows value or input when editing */}
                <div className="flex justify-end">
                  {isEditing ? (
                    <input
                      autoFocus
                      type="text"
                      inputMode="decimal"
                      value={inputValues[r.invoiceNumber] ?? ""}
                      onChange={(e) => handleInputChange(r.invoiceNumber, e.target.value)}
                      onBlur={() => handleInputBlur(r.invoiceNumber, r.outstanding)}
                      placeholder="0"
                      className="w-24 px-2 py-1.5 text-xs border border-primary rounded-lg bg-primary/5 text-primary font-semibold text-right focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <span className={`text-xs font-mono ${isAllocated ? "text-primary font-semibold" : "text-muted"}`}>
                      {isAllocated ? `₹ ${(allocated[r.invoiceNumber] || 0).toLocaleString()}` : "—"}
                    </span>
                  )}
                </div>

                {/* Edit button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setEditingRow(r.invoiceNumber);
                      setInputValues((prev) => ({
                        ...prev,
                        [r.invoiceNumber]: allocated[r.invoiceNumber] ? String(allocated[r.invoiceNumber]) : "",
                      }));
                    }}
                    disabled={noBalance && !isAllocated}
                    className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Pencil size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)] bg-[var(--row-hover)]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">Total Allocated</span>
            <span className="text-xs font-bold text-primary font-mono">₹ {totalAllocated.toLocaleString()}</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted">
                Page {currentPage} of {totalPages}
                <span className="ml-1 text-muted/60">({allData.length} total)</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="w-6 h-6 flex items-center justify-center rounded border border-[var(--border)] text-muted hover:text-main hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={12} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`el-${i}`} className="text-[11px] text-muted px-1">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-medium border transition-colors
                          ${currentPage === p ? "bg-primary text-white border-primary" : "border-[var(--border)] text-muted hover:text-main hover:bg-card"}`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                  className="w-6 h-6 flex items-center justify-center rounded border border-[var(--border)] text-muted hover:text-main hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;