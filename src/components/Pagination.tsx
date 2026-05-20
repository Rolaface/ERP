import React from "react";

interface Props {
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

function makeRange(current: number, total: number, delta = 1) {
  const range: (number | string)[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("...");
  if (total > 1) range.push(total);
  return range;
}

export default function Pagination({
  currentPage,
  totalPages,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: Props) {
  if (totalPages <= 1) return null;

  const range = makeRange(currentPage, totalPages, 1);

  const goto = (p: number) => {
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    if (p === currentPage) return;
    onPageChange(p);
  };

  return (
    <div className="flex flex-col items-center justify-between gap-1.5 text-xs sm:flex-row">
      {/* Left Summary */}
      <div className="text-xs text-muted">
        Showing{" "}
        <span className="font-medium text-main">
          {(currentPage - 1) * pageSize + 1}
        </span>{" "}
        –{" "}
        <span className="font-medium text-main">
          {Math.min(currentPage * pageSize, totalItems)}
        </span>{" "}
        of <span className="font-medium text-main">{totalItems}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => goto(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`h-7 rounded-md border border-theme bg-app px-2 text-xs text-main transition-all hover:bg-row-hover ${
            currentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          ‹ Prev
        </button>

        {/* Page Numbers */}
        <nav className="flex items-center gap-1">
          {range.map((r, i) =>
            typeof r === "string" ? (
              <span key={`dots-${i}`} className="px-1.5 py-1 text-xs text-muted">
                {r}
              </span>
            ) : (
              <button
                key={`page-${r}-${i}`}
                onClick={() => goto(r)}
                className={`flex h-7 min-w-7 items-center justify-center rounded-md border border-theme px-2 text-xs transition-all ${r === currentPage
                    ? "bg-primary text-white shadow"
                    : "bg-app text-main hover:bg-row-hover"
                  }`}
              >
                {r}
              </button>
            )
          )}

        </nav>

        {/* Next */}
        <button
          onClick={() => goto(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`h-7 rounded-md border border-theme bg-app px-2 text-xs text-main transition-all hover:bg-row-hover ${
            currentPage >= totalPages ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Next ›
        </button>

        {/* Page Size */}
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="ml-1 h-7 rounded border border-theme bg-app px-2 text-xs text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
