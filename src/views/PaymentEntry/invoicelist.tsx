import React from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  SlidersHorizontal,
  SquarePen,
} from "lucide-react";
import { useInvoiceList } from "../../hooks/useInvoiceList";
import type {
  AllocationResult,
  NormalizedPagination,
} from "../../types/paymententryrecord.types";

interface InvoiceListProps {
  form: {
    partyType?: string;
    partyName?: string;
    partyId?: string;
    amount?: number | string;
    referenceInvoice?: string;
    allocations?: Record<string, number>;
  };
  onFormChange: (data: AllocationResult) => void;
  onModifyAllocation?: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  form,
  onFormChange,
  onModifyAllocation,
  onLoadingChange,
}) => {
  const partyType = form.partyType ?? "";
  const partyId = form.partyId;
  const paymentAmount = Number(form.amount ?? 0);
  const referenceInvoice = form.referenceInvoice;
  const initialAllocations = form.allocations ?? {};

  const {
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
    remainingToAllocate,
    editingRow,
    setCurrentPage,
    setEditingRow,
    handleInputChange,
    handleInputBlur,
    retryFetch,
  } = useInvoiceList(
    partyType,
    partyId,
    paymentAmount,
    onFormChange,
    referenceInvoice,
    initialAllocations,
  );

  React.useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  if (!partyType)
    return (
      <EmptyMessage text="Select a party type in the Details tab first." />
    );
  if (!isSupported)
    return (
      <EmptyMessage
        text={`Invoice allocation is not available for party type "${partyType}".`}
      />
    );
  if (loading)
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted">
        <Loader2 size={15} className="animate-spin" />
        <span className="text-sm">Loading invoices…</span>
      </div>
    );
  if (fetchError)
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
  if (invoices.length === 0)
    return (
      <EmptyMessage text="No outstanding invoices found for this party." />
    );

  const showUnallocatedWarning =
    paymentAmount > 0 && totalAllocated > 0 && remainingToAllocate > 0.009;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-main">Invoice Allocation</p>
          <p className="text-[11px] text-muted">
            Auto-allocated oldest-first (FIFO). Click any amount to override.
          </p>
        </div>
        {onModifyAllocation && (
          <button
            onClick={onModifyAllocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)]
              text-xs font-medium text-main hover:bg-[var(--row-hover)] transition-colors"
          >
            <SlidersHorizontal size={12} />
            Modify Allocation
          </button>
        )}
      </div>

      {/* Unallocated warning */}
      {showUnallocatedWarning && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-semibold">
              {remainingToAllocate.toLocaleString()}
            </span>{" "}
            remaining unallocated. Assign it to an invoice or reduce the payment
            amount to{" "}
            <span className="font-semibold">
              {totalAllocated.toLocaleString()}
            </span>
            .
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {/* Header row — 6 columns, no action col */}
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1.2fr] bg-[var(--row-hover)] border-b border-[var(--border)] px-4 py-2.5 select-none">
          {(
            [
              "Invoice",
              "Due Date",
              "Total",
              "Paid",
              "Outstanding",
              "Allocate",
            ] as const
          ).map((h, i) => (
            <div
              key={h}
              className={`text-[10px] font-semibold uppercase tracking-widest text-muted ${i >= 2 ? "text-right" : ""}`}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Data rows */}
        <div className="divide-y divide-[var(--border)]">
          {invoices.map((inv) => {
            const allocatedAmt = allocated[inv.invoiceNumber] ?? 0;
            const isAllocated = allocatedAmt > 0;
            const isEditing = editingRow === inv.invoiceNumber;
            // Disable edit only when budget is exhausted and this row has nothing allocated
            const canEdit = !(remainingToAllocate <= 0.009 && !isAllocated);

            const startEditing = () => {
              if (!canEdit) return;
              setEditingRow(inv.invoiceNumber);
              setInputValues((prev) => ({
                ...prev,
                [inv.invoiceNumber]: allocatedAmt ? String(allocatedAmt) : "",
              }));
            };

            return (
              <div
                key={inv.invoiceNumber}
                className={`grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1.2fr] px-4 py-3 items-center transition-colors
                  ${
                    isEditing
                      ? "bg-primary/[0.04]"
                      : isAllocated
                        ? "bg-primary/[0.02] hover:bg-primary/[0.04]"
                        : "hover:bg-[var(--row-hover)]"
                  }`}
              >
                {/* Invoice + status */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs font-medium text-main truncate">
                    {inv.invoiceNumber}
                  </span>
                  <StatusBadge status={inv.status} />
                </div>

                {/* Due date */}
                <div className="text-xs text-muted tabular-nums">
                  {inv.dueDate}
                </div>

                {/* Total */}
                <div className="text-right text-xs font-mono text-main tabular-nums">
                  {inv.totalAmount.toLocaleString()}
                </div>

                {/* Paid */}
                <div className="text-right text-xs font-mono text-emerald-600 tabular-nums">
                  {inv.paid.toLocaleString()}
                </div>

                {/* Outstanding */}
                <div className="text-right text-xs font-mono font-semibold text-amber-600 tabular-nums">
                  {inv.outstanding.toLocaleString()}
                </div>

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
                      className="w-24 px-2 py-1.5 text-xs border border-primary rounded-md bg-card
                        text-primary font-semibold text-right focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  ) : (
                    // Click value to edit — subtle pencil icon fades in on hover
                    <button
                      onClick={startEditing}
                      disabled={!canEdit}
                      title={canEdit ? "Click to edit" : "No remaining amount"}
                      className={`group flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors min-w-[80px] justify-end
                        ${canEdit ? "hover:bg-primary/10" : "opacity-35 cursor-not-allowed"}`}
                    >
                      <span
                        className={`text-xs font-mono tabular-nums ${isAllocated ? "text-primary font-semibold" : "text-muted/50"}`}
                      >
                        {isAllocated ? allocatedAmt.toLocaleString() : "—"}
                      </span>
                      {canEdit && (
                        <SquarePen
                          size={10}
                          className="opacity-0 group-hover:opacity-40 text-primary transition-opacity shrink-0"
                        />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer — total allocated + pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)] bg-[var(--row-hover)]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              Total Allocated
            </span>
            <span className="text-xs font-bold text-primary font-mono tabular-nums">
              {totalAllocated.toLocaleString()}
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

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  Unpaid: "bg-red-50 text-red-600 border-red-200",
  Overdue: "bg-orange-50 text-orange-600 border-orange-200",
  "Partly Paid": "bg-blue-50 text-blue-600 border-blue-200",
  Paid: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-block w-fit px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide border
    ${STATUS_STYLES[status] ?? "bg-[var(--row-hover)] text-muted border-[var(--border)]"}`}
  >
    {status}
  </span>
);

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyMessage: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center justify-center py-16 text-muted">
    <span className="text-sm">{text}</span>
  </div>
);

// ── Pagination ────────────────────────────────────────────────────────────────
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
        Math.abs(p - currentPage) <= 1,
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
        <span className="ml-1 opacity-50">({pagination.total} total)</span>
      </span>
      <div className="flex items-center gap-1">
        <NavButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!pagination.hasPrev || loading}
          label="Previous page"
        >
          <ChevronLeft size={11} />
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
              className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-medium border transition-colors
                ${currentPage === p ? "bg-primary text-white border-primary" : "border-[var(--border)] text-muted hover:text-main hover:bg-card"}`}
            >
              {p}
            </button>
          ),
        )}
        <NavButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!pagination.hasNext || loading}
          label="Next page"
        >
          <ChevronRight size={11} />
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
