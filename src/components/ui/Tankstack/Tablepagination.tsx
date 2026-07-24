import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  /** Omit to hide the page-size dropdown entirely. */
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Disables all controls — pass `loading` from the caller. */
  disabled?: boolean;
  /** How many page numbers to show around the current page before collapsing into "...". Default 1. */
  siblingCount?: number;
  className?: string;
}

/**
 * Single generic pagination footer for the whole app — combines:
 *  - "Showing X–Y of Z" summary
 *  - Prev/Next buttons
 *  - Ellipsis-collapsed page-number range (1 … 4 5 [6] 7 8 … 42) so it stays
 *    usable even with hundreds of pages
 *  - Optional page-size dropdown
 *  - Disabled state while a fetch is in flight
 *
 * Data-source agnostic: works for a client-paginated array (Items page)
 * or a server-paginated response (Stock Ledger) — just pass page/totalPages/
 * totalItems from wherever they come from.
 */
function buildPageRange(current: number, total: number, siblingCount: number) {
  const range: (number | "...")[] = [];
  const left = Math.max(2, current - siblingCount);
  const right = Math.min(total - 1, current + siblingCount);

  range.push(1);
  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("...");
  if (total > 1) range.push(total);
  return range;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  totalPages,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  disabled = false,
  siblingCount = 1,
  className = "",
}) => {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const goto = (p: number) => {
    const clamped = Math.min(Math.max(p, 1), totalPages);
    if (clamped === page) return;
    onPageChange(clamped);
  };

  const range = buildPageRange(page, totalPages, siblingCount);
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div
      className={`flex flex-col items-center justify-between gap-1.5 border-t border-theme bg-app px-3 py-2 text-xs sm:flex-row ${className}`}
    >
      {/* Summary */}
      <div className="text-xs text-muted">
        {totalItems > 0 ? (
          <>
            Showing <span className="font-medium text-main">{from}</span>–
            <span className="font-medium text-main">{to}</span> of{" "}
            <span className="font-medium text-main">{totalItems}</span>
          </>
        ) : (
          "No entries"
        )}
      </div>

      {/* Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => goto(page - 1)}
            disabled={disabled || page <= 1}
            className="flex h-7 items-center gap-0.5 rounded-md border border-theme bg-app px-2 text-xs text-main
                       transition-all hover:bg-row-hover disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft size={13} /> Prev
          </button>

          <nav className="flex items-center gap-1">
            {range.map((r, i) =>
              r === "..." ? (
                <span
                  key={`dots-${i}`}
                  className="px-1.5 py-1 text-xs text-muted"
                >
                  …
                </span>
              ) : (
                <button
                  key={`page-${r}`}
                  onClick={() => goto(r)}
                  disabled={disabled}
                  className={`flex h-7 min-w-7 items-center justify-center rounded-md border border-theme px-2 text-xs transition-all disabled:cursor-not-allowed ${
                    r === page
                      ? "bg-primary text-white border-primary shadow font-bold"
                      : "bg-app text-main hover:bg-row-hover"
                  }`}
                >
                  {r}
                </button>
              ),
            )}
          </nav>

          <button
            onClick={() => goto(page + 1)}
            disabled={disabled || page >= totalPages}
            className="flex h-7 items-center gap-0.5 rounded-md border border-theme bg-app px-2 text-xs text-main
                       transition-all hover:bg-row-hover disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            Next <ChevronRight size={13} />
          </button>

          {onPageSizeChange && (
            <select
              value={pageSize}
              disabled={disabled}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="ml-1 h-7 rounded border border-theme bg-app px-2 text-xs text-main
                         focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
};

export default TablePagination;
