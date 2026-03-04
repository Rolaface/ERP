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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Left Summary */}
      <div className="text-sm text-muted">
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
      <div className="flex items-center gap-2">
        {/* Prev */}
        <button
          onClick={() => goto(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-3 py-1 rounded-md border border-theme text-sm bg-app text-main hover:bg-row-hover transition-all ${
            currentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          ‹ Prev
        </button>

        {/* Page Numbers */}
        <nav className="flex items-center gap-2">
          {range.map((r, i) =>
            typeof r === "string" ? (
              <span key={`dots-${i}`} className="px-3 py-1 text-sm text-muted">
                {r}
              </span>
            ) : (
              <button
                key={`page-${r}-${i}`}
                onClick={() => goto(r)}
                className={`min-w-[36px] h-8 flex items-center justify-center px-2 rounded-md text-sm border border-theme transition-all ${
                  r === currentPage
                    ? "bg-primary text-white shadow"
                    : "bg-app text-main hover:bg-row-hover"
                }`}
              >
                {r}
              </button>
            ),
          )}
        </nav>

        {/* Next */}
        <button
          onClick={() => goto(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-3 py-1 rounded-md border border-theme text-sm bg-app text-main hover:bg-row-hover transition-all ${
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
            className="ml-3 border border-theme bg-app text-main rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
