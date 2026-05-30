import React, {
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";

export interface EmployeeAdvance {
  id: string;
  employeeName: string;
  employeeId: string;
  department?: string;
  advanceDate: string;
  allocatedAmount: number;
  unclaimedAmount: number;
  purpose: string;
}

interface NormalizedPagination {
  page: number;
  totalPages: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface EmployeeAdvanceListProps {
  advances?: EmployeeAdvance[];
  pagination?: NormalizedPagination;
  loading?: boolean;
  fetchError?: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
  onModifyAllocation?: () => void;
  onAllocationChange?: (id: string, newAllocated: number) => void;
  onLoadingChange?: (loading: boolean) => void;
  allocations?: Record<string, number>;
  /** The total expense amount entered on the Expense tab */
  expenseAmount?: number;
}

const EmployeeAdvanceList: React.FC<EmployeeAdvanceListProps> = ({
  advances = [],
  pagination,
  loading = false,
  fetchError,
  currentPage = 1,
  onPageChange,
  onRetry,
  onModifyAllocation,
  onAllocationChange,
  onLoadingChange,
  allocations: allocationsProp,
  expenseAmount = 0,
}) => {
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // Which rows are checked (opted-in to allocation)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Local allocations — only populated for checked rows
  const [localAllocations, setLocalAllocations] = useState<Record<string, number>>(
    allocationsProp ?? {}
  );

  // When the parent clears allocations (e.g. employee change), clear checked state too
  useEffect(() => {
    if (!allocationsProp) return;

    // If parent zeroed everything out, clear checked set as well
    const allZero = Object.values(allocationsProp).every((v) => v === 0);
    if (allZero) {
      setCheckedIds(new Set());
    }

    setLocalAllocations(allocationsProp);
  }, [allocationsProp]);

  /**
   * Greedy allocator: given the set of checked advance IDs and the current
   * expense amount, distribute the expense amount across checked advances
   * (oldest-first) up to each advance's unclaimed amount.
   */
  const computeAllocations = useCallback(
    (checked: Set<string>, amount: number): Record<string, number> => {
      const result: Record<string, number> = {};
      let remaining = amount;

      // Fill zeroes for unchecked rows
      advances.forEach((adv) => {
        result[adv.id] = 0;
      });

      // Sort checked advances oldest-first
      const checkedAdvances = advances
        .filter((adv) => checked.has(adv.id))
        .sort((a, b) => (a.advanceDate ?? "").localeCompare(b.advanceDate ?? ""));

      for (const adv of checkedAdvances) {
        if (remaining <= 0) break;
        const available = adv.unclaimedAmount ?? 0;
        const allocated = Math.min(available, remaining);
        result[adv.id] = allocated;
        remaining -= allocated;
      }

      return result;
    },
    [advances]
  );

  const handleCheckboxToggle = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Re-compute allocations with updated checked set
      // Parent is notified via the localAllocations useEffect below
      const newAllocations = computeAllocations(next, expenseAmount);
      setLocalAllocations(newAllocations);
      return next;
    });
  };

  // Propagate allocation changes to parent whenever localAllocations changes
  const prevAllocationsRef = React.useRef<Record<string, number>>({});
  useEffect(() => {
    const prev = prevAllocationsRef.current;
    Object.entries(localAllocations).forEach(([id, amt]) => {
      if (prev[id] !== amt) {
        onAllocationChange?.(id, amt);
      }
    });
    prevAllocationsRef.current = { ...localAllocations };
  }, [localAllocations, onAllocationChange]);

  // Re-compute allocations when expenseAmount changes (for already-checked rows)
  useEffect(() => {
    if (checkedIds.size === 0) return;
    const newAllocations = computeAllocations(checkedIds, expenseAmount);
    setLocalAllocations(newAllocations);
  }, [expenseAmount]); // intentionally omit checkedIds / computeAllocations to avoid loop

  const getAllocated = useCallback(
    (id: string) => localAllocations[id] ?? 0,
    [localAllocations]
  );

  const totalAllocated = advances.reduce((s, a) => s + getAllocated(a.id), 0);
  const totalUnclaimed = advances.reduce((s, a) => s + a.unclaimedAmount, 0);

  // ── Loading / error / empty states ────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading advances…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
        <AlertTriangle size={15} />
        <span className="text-sm">{fetchError}</span>
        {onRetry && (
          <button onClick={onRetry} className="text-xs text-primary underline hover:opacity-80">
            Retry
          </button>
        )}
      </div>
    );
  }

  if (advances.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted">
        <span className="text-sm">No employee advances found.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-main">Employee Advance Allocation</p>
          <p className="text-[11px] text-muted">
            Check an advance row to allocate against the expense amount.
          </p>
        </div>
        {onModifyAllocation && (
          <button
            onClick={onModifyAllocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)]
              text-xs font-medium text-main hover:bg-[var(--row-hover)] transition-colors"
          >
            <SlidersHorizontal size={12} />
            Modify Advance Allocation
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">

        {/* Header */}
        <div className="grid grid-cols-[32px_1.2fr_1fr_1fr_1fr] bg-[var(--row-hover)] border-b border-[var(--border)] px-4 py-2.5">
          {/* empty col for checkbox */}
          <div />
          {[
            { label: "Advance Date", align: "text-left" },
            { label: "Allocated Amt", align: "text-center" },
            { label: "Unclaimed Amt", align: "text-center" },
            { label: "Purpose", align: "text-right" },
          ].map(({ label, align }) => (
            <div
              key={label}
              className={`text-[11px] font-semibold uppercase tracking-wide text-muted ${align}`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--border)]">
          {advances.map((adv) => {
            const allocated = getAllocated(adv.id);
            const isChecked = checkedIds.has(adv.id);
            const hasUnclaimed = adv.unclaimedAmount > 0;

            return (
              <div
                key={adv.id}
                className={`grid grid-cols-[32px_1.2fr_1fr_1fr_1fr] px-4 py-3 items-center
                  transition-colors hover:bg-[var(--row-hover)]
                  ${isChecked ? "bg-primary/[0.04]" : hasUnclaimed ? "" : ""}`}
              >
                {/* Checkbox */}
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    disabled={adv.unclaimedAmount <= 0}
                    onClick={() => handleCheckboxToggle(adv.id)}
                    style={{
                      width: "15px",
                      height: "15px",
                      borderRadius: "3px",
                      border: `1.5px solid ${
                        adv.unclaimedAmount <= 0
                          ? "var(--border-color, #d1d5db)"
                          : isChecked
                          ? "var(--color-primary, #4f46e5)"
                          : "var(--border-color, #d1d5db)"
                      }`,
                      background: isChecked
                        ? "var(--color-primary, #4f46e5)"
                        : "transparent",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: adv.unclaimedAmount <= 0 ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      opacity: adv.unclaimedAmount <= 0 ? 0.4 : 1,
                    }}
                  >
                    {isChecked && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path
                          d="M1 3L3 5.5L7 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="text-xs text-muted text-left">{adv.advanceDate}</div>

                <div
                  className={`text-xs font-mono font-semibold text-center ${
                    allocated > 0 ? "text-primary" : "text-muted"
                  }`}
                >
                  {allocated.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>

                <div
                  className={`text-center text-xs font-mono font-semibold ${
                    adv.unclaimedAmount > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {adv.unclaimedAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>

                <div
                  className="text-xs text-muted text-right truncate"
                  title={adv.purpose}
                >
                  {adv.purpose || "—"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: totals */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)] bg-[var(--row-hover)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                Total Allocated
              </span>
              <span className="text-xs font-bold text-primary font-mono">
                {totalAllocated.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="w-px h-3 bg-[var(--border)]" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                Total Unclaimed
              </span>
              <span className="text-xs font-bold text-amber-600 font-mono">
                {totalUnclaimed.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {pagination && (
            <PaginationBar
              pagination={pagination}
              currentPage={currentPage}
              loading={loading}
              onPageChange={onPageChange ?? (() => {})}
            />
          )}
        </div>
      </div>
    </div>
  );
};

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
    .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 1)
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
            <span key={`ellipsis-${i}`} className="text-[11px] text-muted px-1">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={loading}
              className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-medium border transition-colors
                ${currentPage === p
                  ? "bg-primary text-white border-primary"
                  : "border-[var(--border)] text-muted hover:text-main hover:bg-card"}`}
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

export default EmployeeAdvanceList;