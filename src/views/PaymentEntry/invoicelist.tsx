import React from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
} from "lucide-react";
import { useInvoiceList } from "../../hooks/useInvoiceList";
import type { AllocationResult, NormalizedPagination } from "../../types/paymententryrecord.types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoiceListProps {
  form: {
    partyType?: string;
    partyName?: string;
    amount?: number | string;
    fifoTrigger?: number;
  };
  onFormChange: (data: AllocationResult) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const InvoiceList: React.FC<InvoiceListProps> = ({ form, onFormChange }) => {
  const partyType     = form.partyType ?? "";
  const partyName     = form.partyName;
  const paymentAmount = Number(form.amount ?? 0);
  const fifoTrigger   = form.fifoTrigger;

  const {
    invoices,
    pagination,
    loading,
    fetchError,
    currentPage,
    isSupported,
    allocated,
    inputValues,
    setInputValues,   // ← FIX: yeh line missing thi — edit button crash karta tha
    totalAllocated,
    remainingToAllocate,
    editingRow,
    setCurrentPage,
    setEditingRow,
    handleInputChange,
    handleInputBlur,
    retryFetch,
  } = useInvoiceList(partyType, partyName, paymentAmount, fifoTrigger, onFormChange);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!partyType) {
    return <EmptyMessage text="Select a party type in the Details tab first." />;
  }
  if (!isSupported) {
    return (
      <EmptyMessage
        text={`Invoice allocation is not available for party type "${partyType}".`}
      />
    );
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading invoices…</span>
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
        <AlertTriangle size={15} />
        <span className="text-sm">{fetchError}</span>
        <button
          onClick={retryFetch}
          className="text-xs text-primary underline hover:opacity-80"
        >
          Retry
        </button>
      </div>
    );
  }
  if (invoices.length === 0) {
    return <EmptyMessage text="No outstanding invoices found for this party." />;
  }

  const showUnallocatedWarning =
    paymentAmount > 0 && totalAllocated > 0 && remainingToAllocate > 0.009;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">

      {showUnallocatedWarning && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-semibold">
              ₹ {remainingToAllocate.toLocaleString()}
            </span>{" "}
            unallocated. Allocate to an invoice or reduce the payment amount to{" "}
            <span className="font-semibold">
              ₹ {totalAllocated.toLocaleString()}
            </span>.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">

        {/* Table header */}
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_32px] bg-[var(--row-hover)] border-b border-[var(--border)] px-4 py-2.5">
          {(["Invoice No", "Due Date", "Total", "Paid", "Outstanding", "Allocate"] as const).map(
            (h, i) => (
              <div
                key={h}
                className={`text-[11px] font-semibold uppercase tracking-wide text-muted ${
                  i >= 2 ? "text-right" : ""
                }`}
              >
                {h}
              </div>
            )
          )}
          <div />
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--border)]">
          {invoices.map((inv) => {
            const isAllocated    = (allocated[inv.invoiceNumber] ?? 0) > 0;
            const isEditing      = editingRow === inv.invoiceNumber;
            const pencilDisabled = remainingToAllocate <= 0.009 && !isAllocated;

            return (
              <div
                key={inv.invoiceNumber}
                className={`grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_32px] px-4 py-3 items-center
                  transition-colors hover:bg-[var(--row-hover)]
                  ${isAllocated ? "bg-primary/[0.03]" : ""}`}
              >
                {/* Invoice number + status */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-main">
                    {inv.invoiceNumber}
                  </span>
                  <span className="text-[10px] text-muted">{inv.status}</span>
                </div>

                <div className="text-xs text-muted">{inv.dueDate}</div>

                <div className="text-right text-xs font-mono text-main">
                  ₹ {inv.totalAmount.toLocaleString()}
                </div>
                <div className="text-right text-xs font-mono text-emerald-600">
                  ₹ {inv.paid.toLocaleString()}
                </div>
                <div className="text-right text-xs font-mono font-semibold text-amber-600">
                  ₹ {inv.outstanding.toLocaleString()}
                </div>

                {/* Allocation cell */}
                <div className="flex justify-end">
                  {isEditing ? (
                    <input
                      autoFocus
                      type="text"
                      inputMode="decimal"
                      value={inputValues[inv.invoiceNumber] ?? ""}
                      onChange={(e) =>
                        handleInputChange(inv.invoiceNumber, e.target.value)
                      }
                      onBlur={() =>
                        handleInputBlur(inv.invoiceNumber, inv.outstanding)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          handleInputBlur(inv.invoiceNumber, inv.outstanding);
                        if (e.key === "Escape") setEditingRow(null);
                      }}
                      placeholder="0"
                      className="w-24 px-2 py-1.5 text-xs border border-primary rounded-lg bg-primary/5
                        text-primary font-semibold text-right
                        focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <span
                      className={`text-xs font-mono ${
                        isAllocated ? "text-primary font-semibold" : "text-muted"
                      }`}
                    >
                      {isAllocated
                        ? `₹ ${(allocated[inv.invoiceNumber] ?? 0).toLocaleString()}`
                        : "—"}
                    </span>
                  )}
                </div>

                {/* Edit button — setInputValues ab hook se aata hai, crash nahi */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setEditingRow(inv.invoiceNumber);
                      setInputValues((prev) => ({
                        ...prev,
                        [inv.invoiceNumber]: allocated[inv.invoiceNumber]
                          ? String(allocated[inv.invoiceNumber])
                          : "",
                      }));
                    }}
                    disabled={pencilDisabled}
                    title={pencilDisabled ? "No remaining payment to allocate" : "Edit allocation"}
                    className="w-6 h-6 flex items-center justify-center rounded
                      text-muted hover:text-primary hover:bg-primary/10
                      transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
              Total Allocated
            </span>
            <span className="text-xs font-bold text-primary font-mono">
              ₹ {totalAllocated.toLocaleString()}
            </span>
          </div>

          {pagination && (
            <PaginationBar
              pagination={pagination}
              currentPage={currentPage}
              loading={loading}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const EmptyMessage: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center justify-center py-16 text-muted">
    <span className="text-sm">{text}</span>
  </div>
);

interface PaginationBarProps {
  pagination: NormalizedPagination;
  currentPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

const PaginationBar: React.FC<PaginationBarProps> = ({
  pagination,
  currentPage,
  loading,
  onPageChange,
}) => {
  if (pagination.totalPages <= 1) return null;

  const pages = Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
    .filter(
      (p) =>
        p === 1 ||
        p === pagination.totalPages ||
        Math.abs(p - currentPage) <= 1
    )
    .reduce<(number | "…")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted">
        Page {pagination.page} of {pagination.totalPages}
        <span className="ml-1 opacity-60">({pagination.total} total)</span>
      </span>

      <div className="flex items-center gap-1">
        <NavButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!pagination.hasPrev || loading}
          label="Previous page"
        >
          <ChevronLeft size={12} />
        </NavButton>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="text-[11px] text-muted px-1">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={loading}
              className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-medium
                border transition-colors
                ${
                  currentPage === p
                    ? "bg-primary text-white border-primary"
                    : "border-[var(--border)] text-muted hover:text-main hover:bg-card"
                }`}
            >
              {p}
            </button>
          )
        )}

        <NavButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!pagination.hasNext || loading}
          label="Next page"
        >
          <ChevronRight size={12} />
        </NavButton>
      </div>
    </div>
  );
};

const NavButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, label, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="w-6 h-6 flex items-center justify-center rounded border
      border-[var(--border)] text-muted hover:text-main hover:bg-card
      transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);

export default InvoiceList;