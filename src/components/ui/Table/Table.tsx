import React, { useState } from "react";
import type { Column } from "./type";
import ColumnSelector from "./ColumnSelector";
import Pagination from "../../Pagination";
import { FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SortState {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface TableProps<T> {
  // Core data
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;

  serverSide?: boolean;

  // Row interaction
  onRowClick?: (item: T) => void;

  // Toolbar
  showToolbar?: boolean;
  extraFilters?: React.ReactNode;
  toolbarPlaceholder?: string;

  // Search — controlled by parent (backend)
  searchValue?: string;
  onSearch?: (q: string) => void;

  // Add button
  enableAdd?: boolean;
  addLabel?: string;
  onAdd?: () => void;

  // Export button
  enableExport?: boolean;
  onExport?: () => void;

  // Column visibility selector (UI-only, stays local)
  enableColumnSelector?: boolean;

  // Server-side sort — controlled by parent (backend)
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sort: SortState) => void;

  // Server-side pagination — controlled by parent (backend)
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalItems?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

// ---------------------------------------------------------------------------
// Skeleton Row
// ---------------------------------------------------------------------------

const SkeletonRow: React.FC<{ columnsCount: number }> = ({ columnsCount }) => (
  <tr className="bg-transparent">
    {Array.from({ length: columnsCount }).map((_, idx) => (
      <td
        key={idx}
        className="px-4 sm:px-5 py-3.5 border-b border-[var(--border)]/30"
      >
        <div className="h-4 bg-[var(--border)]/30 animate-pulse rounded" />
      </td>
    ))}
  </tr>
);

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

function Table<T extends Record<string, any>>({
  // Core
  columns,
  data,
  rowKey,
  loading = false,
  emptyMessage = "No records found.",

  // Row
  onRowClick,

  // Toolbar
  showToolbar = false,
  extraFilters,
  toolbarPlaceholder = "Search...",

  // Search
  searchValue = "",
  onSearch,

  // Add
  enableAdd = false,
  addLabel = "+ Add",
  onAdd,

  // Export
  enableExport = false,
  onExport,

  // Column selector
  enableColumnSelector = false,

  // Sort (server)
  sortBy,
  sortOrder: sortOrderProp,
  onSortChange,

  // Pagination (server)
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: TableProps<T>) {
  // Column visibility is the only local UI state that remains
  const allKeys = columns.map((col) => col.key);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(allKeys);

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  // ---------------------------------------------------------------------------
  // Sort handler — delegates entirely to parent
  // ---------------------------------------------------------------------------

  const handleColumnSort = (colKey: string) => {
    if (!onSortChange) return;
    const isSameColumn = sortBy === colKey;
    const newOrder: "asc" | "desc" =
      isSameColumn && sortOrderProp === "asc" ? "desc" : "asc";
    onSortChange({ sortBy: colKey, sortOrder: newOrder });
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const getAlignment = (align?: "left" | "center" | "right"): string => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  const visibleColumns = columns.filter((col) => visibleKeys.includes(col.key));

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="bg-card rounded-2xl border border-[var(--border)]/70 flex flex-col shadow-sm relative z-10 w-full overflow-hidden">
      {/* ── Toolbar ── */}
      {showToolbar && (
        <div className="px-5 py-4 border-b border-[var(--border)]/60 bg-card flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shrink-0">
          {/* Search — value and handler always come from parent */}
          <div className="relative w-64 max-w-full group">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-xs group-focus-within:text-primary transition-colors" />
            <input
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder={toolbarPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-[var(--border)]/70 rounded-xl text-xs font-semibold text-main placeholder:text-muted/70 focus:ring-2 focus:ring-primary/15 focus:border-primary outline-none transition-all"
            />
          </div>

          {/* Extra filters slot */}
          {extraFilters && (
            <div className="flex items-center gap-4 shrink-0">
              {extraFilters}
            </div>
          )}

          {/* Right-side buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {enableColumnSelector && (
              <ColumnSelector
                columns={columns}
                visibleKeys={visibleKeys}
                toggleColumn={toggleColumn}
                setVisibleKeys={setVisibleKeys}
                allKeys={allKeys}
              />
            )}

            {enableAdd && (
              <button
                onClick={onAdd}
                className="bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all whitespace-nowrap"
              >
                {addLabel}
              </button>
            )}

            {enableExport && (
              <button
                onClick={onExport}
                className="bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
              >
                Export
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="w-full overflow-x-auto custom-scrollbar">
        <div className="max-h-[520px] overflow-y-auto min-w-full md:min-w-[800px] relative">
          <table className="w-full min-w-full border-separate border-spacing-0">
            {/* Header */}
            <thead className="sticky top-0 z-30">
              <tr>
                {visibleColumns.map((column) => {
                  const isSortable = !!column.sortable && !!onSortChange;
                  const isActive = sortBy === column.key;
                  const isAsc = isActive && sortOrderProp === "asc";
                  const isDesc = isActive && sortOrderProp === "desc";

                  return (
                    <th
                      key={column.key}
                      onClick={
                        isSortable
                          ? () => handleColumnSort(column.key)
                          : undefined
                      }
                      className={[
                        "px-4 sm:px-5 py-3.5 sm:py-4",
                        "text-[10px] font-extrabold uppercase tracking-[0.12em]",
                        "text-muted/80 border-b border-[var(--border)]/60 bg-card/95 backdrop-blur whitespace-nowrap",
                        getAlignment(column.align),
                        isSortable
                          ? "cursor-pointer select-none hover:text-primary transition-colors"
                          : "",
                        isActive ? "text-primary" : "",
                      ].join(" ")}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {column.header}
                        {isSortable && (
                          <span className="inline-flex opacity-60">
                            {isAsc ? (
                              <FaSortUp
                                size={10}
                                className="text-primary opacity-100"
                              />
                            ) : isDesc ? (
                              <FaSortDown
                                size={10}
                                className="text-primary opacity-100"
                              />
                            ) : (
                              <FaSort size={10} />
                            )}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="relative z-10">
              {loading ? (
                Array.from({ length: pageSize }).map((_, idx) => (
                  <SkeletonRow key={idx} columnsCount={visibleColumns.length} />
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
                    className="px-6 py-24 text-center"
                  >
                    <p className="text-xs font-bold text-muted uppercase tracking-widest opacity-40">
                      {emptyMessage}
                    </p>
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={rowKey ? rowKey(item) : JSON.stringify(item)}
                    onClick={() => onRowClick?.(item)}
                    className={[
                      "group",
                      onRowClick ? "cursor-pointer" : "",
                      idx % 2 === 0 ? "bg-transparent" : "bg-row-hover/5",
                      "hover:bg-row-hover/20",
                    ].join(" ")}
                  >
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 sm:px-5 py-3.5 text-xs font-semibold text-main border-b border-[var(--border)]/30 ${getAlignment(column.align)}`}
                      >
                        {column.render ? (
                          column.render(item)
                        ) : (
                          <span className="opacity-90">{item[column.key]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer / Pagination ── */}
      <div className="px-5 py-3 border-t border-[var(--border)]/60 bg-card flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="text-[9px] font-extrabold uppercase text-muted tracking-[0.2em] opacity-60">
          Total: {totalItems}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-[9px] font-extrabold uppercase text-muted tracking-[0.2em] opacity-60">
              Show:
            </label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 bg-card border border-[var(--border)]/70 rounded-lg text-[10px] font-extrabold uppercase text-main focus:ring-2 focus:ring-primary/15 focus:border-primary outline-none transition-all cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange ?? (() => {})}
        />
      </div>
    </div>
  );
}

export default Table;
