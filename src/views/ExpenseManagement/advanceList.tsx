import React from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  SlidersHorizontal,
  UserCircle2,
} from "lucide-react";



export interface EmployeeAdvance {
  id: string;
  employeeName: string;
  employeeId: string;
  department?: string;
  advanceDate: string;
  allocatedAmount: number;
  unclaimedAmount: number;
  status: "Pending" | "Partially Claimed" | "Fully Claimed";
}

interface NormalizedPagination {
  page: number;
  totalPages: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface EmployeeAdvanceListProps {
  /** Optional controlled list of advances; if omitted, mock data is used */
  advances?: EmployeeAdvance[];
  pagination?: NormalizedPagination;
  loading?: boolean;
  fetchError?: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
  /** Called when user clicks "Modify Advance Allocation" */
  onModifyAllocation?: () => void;
  /** Called when an allocation amount is edited */
  onAllocationChange?: (id: string, newAllocated: number) => void;
  /** Called when internal loading state changes — parent can mirror it */
  onLoadingChange?: (loading: boolean) => void;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_ADVANCES: EmployeeAdvance[] = [
  {
    id: "ADV-001",
    employeeName: "Riya Sharma",
    employeeId: "EMP-1021",
    department: "Engineering",
    advanceDate: "2025-04-10",
    allocatedAmount: 15000,
    unclaimedAmount: 6500,
    status: "Partially Claimed",
  },
  {
    id: "ADV-002",
    employeeName: "Arjun Mehta",
    employeeId: "EMP-1034",
    department: "Marketing",
    advanceDate: "2025-03-22",
    allocatedAmount: 8000,
    unclaimedAmount: 8000,
    status: "Pending",
  },
  {
    id: "ADV-003",
    employeeName: "Priya Nair",
    employeeId: "EMP-1048",
    department: "Finance",
    advanceDate: "2025-04-01",
    allocatedAmount: 12000,
    unclaimedAmount: 0,
    status: "Fully Claimed",
  },
  {
    id: "ADV-004",
    employeeName: "Karan Joshi",
    employeeId: "EMP-1056",
    department: "HR",
    advanceDate: "2025-04-18",
    allocatedAmount: 20000,
    unclaimedAmount: 14000,
    status: "Partially Claimed",
  },
  {
    id: "ADV-005",
    employeeName: "Sneha Patel",
    employeeId: "EMP-1063",
    department: "Sales",
    advanceDate: "2025-05-02",
    allocatedAmount: 5000,
    unclaimedAmount: 5000,
    status: "Pending",
  },
  {
    id: "ADV-006",
    employeeName: "Vikram Singh",
    employeeId: "EMP-1071",
    department: "Operations",
    advanceDate: "2025-03-15",
    allocatedAmount: 18000,
    unclaimedAmount: 3000,
    status: "Partially Claimed",
  },
];


const StatusBadge: React.FC<{ status: EmployeeAdvance["status"] }> = ({ status }) => {
  const cfg = {
    "Pending":          { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"  },
    "Partially Claimed":{ bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"   },
    "Fully Claimed":    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  }[status];

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border
        ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {status}
    </span>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const EmployeeAdvanceList: React.FC<EmployeeAdvanceListProps> = ({
  advances: advancesProp,
  pagination,
  loading = false,
  fetchError,
  currentPage = 1,
  onPageChange,
  onRetry,
  onModifyAllocation,
  onAllocationChange,
  onLoadingChange,
}) => {
  const advances = advancesProp ?? MOCK_ADVANCES;


  React.useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);


  const [editingRow, setEditingRow] = React.useState<string | null>(null);
  const [inputValues, setInputValues] = React.useState<Record<string, string>>({});
  const [localAllocations, setLocalAllocations] = React.useState<Record<string, number>>({});

  const getAllocated = (id: string, base: number) => localAllocations[id] ?? base;
  const totalAllocated = advances.reduce((s, a) => s + getAllocated(a.id, a.allocatedAmount), 0);
  const totalUnclaimed = advances.reduce((s, a) => s + a.unclaimedAmount, 0);

  const handleInputBlur = (id: string, max: number) => {
    const raw = parseFloat(inputValues[id] ?? "");
    const clamped = isNaN(raw) ? 0 : Math.min(Math.max(raw, 0), max);
    setLocalAllocations((prev) => ({ ...prev, [id]: clamped }));
    setInputValues((prev) => ({ ...prev, [id]: String(clamped) }));
    setEditingRow(null);
    onAllocationChange?.(id, clamped);
  };

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
            Showing all employee advances. Edit any row to override the allocated amount.
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
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_32px] bg-[var(--row-hover)] border-b border-[var(--border)] px-4 py-2.5">
          {([ "Advance Date", "Allocated Amt", "Unclaimed Amt", "Status"] as const).map((h, i) => (
            <div
              key={h}
              className={`text-[11px] font-semibold uppercase tracking-wide text-muted
                ${i >= 2 && i <= 3 ? "text-right" : ""}`}
            >
              {h}
            </div>
          ))}
          <div />
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--border)]">
          {advances.map((adv) => {
            const allocated   = getAllocated(adv.id, adv.allocatedAmount);
            const isEditing   = editingRow === adv.id;
            const hasUnclaimed = adv.unclaimedAmount > 0;

            return (
              <div
                key={adv.id}
                className={`grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_32px] px-4 py-3 items-center
                  transition-colors hover:bg-[var(--row-hover)]
                  ${hasUnclaimed ? "bg-primary/[0.03]" : ""}`}
              >
                {/* Advance date */}
                <div className="text-xs text-muted">{adv.advanceDate}</div>

                {/* Allocated amount — editable */}
                <div className="flex justify-end">
                  {isEditing ? (
                    <input
                      autoFocus
                      type="text"
                      inputMode="decimal"
                      value={inputValues[adv.id] ?? ""}
                      onChange={(e) =>
                        setInputValues((prev) => ({ ...prev, [adv.id]: e.target.value }))
                      }
                      onBlur={() => handleInputBlur(adv.id, adv.allocatedAmount)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleInputBlur(adv.id, adv.allocatedAmount);
                        if (e.key === "Escape") setEditingRow(null);
                      }}
                      placeholder="0"
                      className="w-24 px-2 py-1.5 text-xs border border-primary rounded-lg bg-primary/5
                        text-primary font-semibold text-right focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <span className="text-xs font-mono font-semibold text-main">
                      {allocated.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Unclaimed amount */}
                <div className={`text-right text-xs font-mono font-semibold
                  ${adv.unclaimedAmount > 0 ? "text-amber-600" : "text-emerald-600"}`}
                >
                  {adv.unclaimedAmount.toLocaleString()}
                </div>

                {/* Status badge */}
                <div className="flex justify-start">
                  <StatusBadge status={adv.status} />
                </div>

                {/* Edit pencil */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setEditingRow(adv.id);
                      setInputValues((prev) => ({
                        ...prev,
                        [adv.id]: String(allocated),
                      }));
                    }}
                    title="Edit allocated amount"
                    className="w-6 h-6 flex items-center justify-center rounded
                      text-muted hover:text-primary hover:bg-primary/10
                      transition-colors"
                  >
                    <Pencil size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: totals + pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)] bg-[var(--row-hover)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">Total Allocated</span>
              <span className="text-xs font-bold text-primary font-mono">{totalAllocated.toLocaleString()}</span>
            </div>
            <div className="w-px h-3 bg-[var(--border)]" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">Total Unclaimed</span>
              <span className="text-xs font-bold text-amber-600 font-mono">{totalUnclaimed.toLocaleString()}</span>
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

// ── Pagination (identical pattern to reference) ────────────────────────────────

interface PaginationBarProps {
  pagination: NormalizedPagination;
  currentPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

const PaginationBar: React.FC<PaginationBarProps> = ({ pagination, currentPage, loading, onPageChange }) => {
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
        <NavButton onClick={() => onPageChange(currentPage - 1)} disabled={!pagination.hasPrev || loading} label="Previous page">
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
        <NavButton onClick={() => onPageChange(currentPage + 1)} disabled={!pagination.hasNext || loading} label="Next page">
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