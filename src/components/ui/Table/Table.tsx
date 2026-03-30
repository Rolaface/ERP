import React, { useState, useRef, useEffect } from "react";
import type { Column } from "./type";
import ColumnSelector from "./ColumnSelector";
import Pagination from "../../Pagination";
import Tooltip from "../../Tooltip";
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

// ---------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------- 

interface SortState {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;

  // ✅ Expandable rows
  expandedRowRender?: (row: T) => React.ReactNode;

  onRowClick?: (item: T) => void;

  showToolbar?: boolean;
  extraFilters?: React.ReactNode;
  toolbarPlaceholder?: string;

  searchValue?: string;
  onSearch?: (q: string) => void;

  enableAdd?: boolean;
  addLabel?: string;
  onAdd?: () => void;

  enableExport?: boolean;
  onExport?: () => void;

  enableColumnSelector?: boolean;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sort: SortState) => void;

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
      <td key={idx} className="px-3 sm:px-5 py-3.5 border-b border-[var(--border)]/20">
        <div className="h-4 bg-gray-300 animate-pulse rounded" />
      </td>
    ))}
  </tr>
);

// ---------------------------------------------------------------------------
// Animated expand wrapper — smooth height transition
// ---------------------------------------------------------------------------

const ExpandedPanel: React.FC<{ children: React.ReactNode; open: boolean }> = ({ children, open }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      setHeight(open ? ref.current.scrollHeight : 0);
    }
  }, [open, children]);

  return (
    <div
      style={{
        height: `${height}px`,
        overflow: "hidden",
        transition: "height 220ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div ref={ref}>
        {children}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

function Table<T extends Record<string, any>>({
  columns = [],
  data = [],
  rowKey,
  loading = false,
  emptyMessage = "No records found.",

  expandedRowRender,
  onRowClick,

  showToolbar = false,
  extraFilters,
  toolbarPlaceholder = "Search...",

  searchValue = "",
  onSearch,

  enableAdd = false,
  addLabel = "+ Add",
  onAdd,

  enableExport = false,
  onExport,

  enableColumnSelector = false,

  sortBy,
  sortOrder: sortOrderProp,
  onSortChange,

  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: TableProps<T>) {

  const allKeys = columns.map((col) => col.key);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(allKeys);

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleColumnSort = (colKey: string) => {
    if (!onSortChange) return;
    const isSameColumn = sortBy === colKey;
    const newOrder: "asc" | "desc" =
      isSameColumn && sortOrderProp === "asc" ? "desc" : "asc";
    onSortChange({ sortBy: colKey, sortOrder: newOrder });
  };

  const getAlignment = (align?: "left" | "center" | "right"): string => {
    switch (align) {
      case "center": return "text-center";
      case "right":  return "text-right";
      default:       return "text-left";
    }
  };

  const visibleColumns = columns.filter((col) => visibleKeys.includes(col.key));

  return (
    <div className="bg-card rounded-2xl border border-[var(--border)] flex flex-col shadow-sm transition-all relative z-10 w-full">

      {/* ── Toolbar ── */}
      {showToolbar && (
        <div className="px-5 py-4 border-b border-[var(--border)] bg-card flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shrink-0">
          <div className="relative w-52 group">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs group-focus-within:text-primary transition-colors" />
            <input
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder={toolbarPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-card border border-[var(--border)] rounded-xl text-xs font-medium text-main focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
            />
          </div>

          {extraFilters && (
            <div className="flex items-center gap-4 shrink-0">{extraFilters}</div>
          )}

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
      <div
        className="w-full overflow-x-auto custom-scrollbar"
        style={{ minHeight: "200px", overflowY: "auto", maxHeight: "60vh" }}
      >
        <div className="pb-4">
          <table className="w-full min-w-full md:min-w-[800px] border-separate border-spacing-0">

            {/* Header */}
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr>
                {visibleColumns.map((column) => {
                  const isSortable = !!column.sortable && !!onSortChange;
                  const isActive   = sortBy === column.key;
                  const isAsc      = isActive && sortOrderProp === "asc";
                  const isDesc     = isActive && sortOrderProp === "desc";

                  return (
                    <th
                      key={column.key}
                      onClick={isSortable ? () => handleColumnSort(column.key) : undefined}
                      className={[
                        "px-3 sm:px-5 py-3.5 sm:py-4",
                        "text-[10px] font-black uppercase tracking-[0.08em] sm:tracking-[0.12em]",
                        "text-muted border-b border-[var(--border)] bg-card whitespace-nowrap",
                        getAlignment(column.align),
                        isSortable ? "cursor-pointer select-none hover:text-primary transition-colors" : "",
                        isActive ? "text-primary" : "",
                      ].join(" ")}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {column.header}
                        {isSortable && (
                          <span className="inline-flex opacity-60">
                            {isAsc  ? <FaSortUp   size={10} className="text-primary opacity-100" /> :
                             isDesc ? <FaSortDown size={10} className="text-primary opacity-100" /> :
                                      <FaSort     size={10} />}
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
                  <td colSpan={visibleColumns.length} className="px-6 py-24 text-center">
                    <p className="text-xs font-bold text-muted uppercase tracking-widest opacity-40">
                      {emptyMessage}
                    </p>
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => {
                  const expandedContent = expandedRowRender?.(item);
                  const isExpanded = !!expandedContent;

                  return (
                    <React.Fragment key={rowKey ? rowKey(item) : JSON.stringify(item)}>

                      {/* ── Data row — full row is clickable ── */}
                      <tr
                        onClick={() => onRowClick?.(item)}
                        className={[
                          "group transition-colors duration-150",
                          // ✅ Always show pointer so user knows row is clickable
                          onRowClick ? "cursor-pointer" : "",
                          idx % 2 === 0 ? "bg-transparent" : "bg-row-hover/10",
                          "hover:bg-row-hover",
                          // ✅ Highlight the expanded row so it stays visually "active"
                          isExpanded ? "bg-row-hover/20" : "",
                        ].join(" ")}
                      >
                        {visibleColumns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-3 sm:px-5 py-3.5 text-xs font-medium text-main border-b border-[var(--border)]/20 ${getAlignment(column.align)}`}
                          >
                            {column.tooltip ? (
                              <Tooltip content={column.tooltip(item)}>
                                {column.render
                                  ? column.render(item)
                                  : <span className="opacity-90">{item[column.key]}</span>
                                }
                              </Tooltip>
                            ) : (
                              column.render
                                ? column.render(item)
                                : <span className="opacity-90">{item[column.key]}</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* ── Animated expanded row ── */}
                      <tr>
                        <td
                          colSpan={visibleColumns.length}
                          className="p-0"
                          style={{
                            borderBottom: isExpanded
                              ? "2px solid rgba(201,125,46,0.25)"
                              : "1px solid rgba(0,0,0,0.04)",
                          }}
                        >
                          <ExpandedPanel open={isExpanded}>
                            {expandedRowRender?.(item)}
                          </ExpandedPanel>
                        </td>
                      </tr>

                    </React.Fragment>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* ── Footer / Pagination ── */}
      <div className="px-5 py-3 border-t border-[var(--border)] bg-card flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="text-[9px] font-black uppercase text-muted tracking-[0.2em] opacity-50">
          Total: {totalItems}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-[9px] font-black uppercase text-muted tracking-[0.2em] opacity-50">
              Show:
            </label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 bg-card border border-[var(--border)] rounded-lg text-[10px] font-black uppercase text-main focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size}</option>
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