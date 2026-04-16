import React, { useState, useRef, useEffect, useMemo, memo } from "react";
import type { Column } from "./type";
import ColumnSelector from "./ColumnSelector";
import Pagination from "../../Pagination";
import Tooltip from "../../Tooltip";
import { FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

interface SortState {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T) => string;
  loading?: boolean;
  isFetching?: boolean;
  emptyMessage?: string;
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

const SkeletonRow: React.FC<{ columnsCount: number; rowIdx: number }> = ({
  columnsCount,
  rowIdx,
}) => {
  const widths = ["w-3/4", "w-1/2", "w-5/6", "w-2/3", "w-4/5"];
  return (
    <tr>
      {Array.from({ length: columnsCount }).map((_, idx) => (
        <td
          key={idx}
          className="border-b border-[var(--border)]/20 px-3 py-[9px] sm:px-4"
        >
          <div
            className={`h-3 rounded-full relative overflow-hidden ${widths[(rowIdx + idx) % widths.length]}`}
            style={{ backgroundColor: "rgba(0,0,0,0.07)" }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
                animation: "shimmer 1.5s ease-in-out infinite",
                animationDelay: `${rowIdx * 60}ms`,
              }}
            />
          </div>
        </td>
      ))}
    </tr>
  );
};

const ExpandedPanel: React.FC<{ children: React.ReactNode; open: boolean }> = ({
  children,
  open,
}) => {
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
      <div ref={ref}>{children}</div>
    </div>
  );
};

const TableInner = <T extends Record<string, any>>({
  columns = [],
  data = [],
  rowKey,
  loading = false,
  isFetching = false,
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
}: TableProps<T>) => {
  const allKeys = useMemo(() => columns.map((col) => col.key), [columns]);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => 
    // Initialize only on mount to avoid resetting on every render
    allKeys
  );
  const visibleColumns = useMemo(() => 
    columns.filter((col) => visibleKeys.includes(col.key)),
    [columns, visibleKeys]
  );

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleColumnSort = (colKey: string) => {
    if (!onSortChange) return;
    const isSameColumn = sortBy === colKey;
    const newOrder: "asc" | "desc" =
      isSameColumn && sortOrderProp === "asc" ? "desc" : "asc";
    onSortChange({ sortBy: colKey, sortOrder: newOrder });
  };

  const getAlignment = useMemo(() => (align?: "left" | "center" | "right"): string => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  }, []);

  return (
    <div
      className="app-surface relative z-10 flex w-full flex-col overflow-hidden"
      style={{
        height: "calc(95.5vh - 130px)",
      }}
    >
      {showToolbar && (
        <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--border)] bg-card px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="group relative w-full max-w-xs">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted transition-colors group-focus-within:text-primary" />
            <input
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder={toolbarPlaceholder}
              className="w-full rounded-xl border border-[var(--border)] bg-card py-2.5 pl-10 pr-4 text-sm font-medium text-main outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {extraFilters && (
            <div className="flex shrink-0 items-center gap-4">
              {extraFilters}
            </div>
          )}

          <div className="flex shrink-0 items-center gap-3">
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
                className="whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {addLabel}
              </button>
            )}
            {enableExport && (
              <button
                onClick={onExport}
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-main transition-colors hover:bg-row-hover"
              >
                Export
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b-2 border-[var(--border)] bg-card w-full overflow-x-auto">
          <table className="min-w-[900px] w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              {visibleColumns.map((column) => (
                <col
                  key={column.key}
                  style={{
                    width:
                      column.width ||
                      (column.maxWidth ? column.maxWidth : "auto"),
                    minWidth:
                      column.minWidth ||
                      (column.maxWidth ? column.maxWidth : "100px"),
                  }}
                />
              ))}
            </colgroup>
            <thead>
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
                        "bg-[var(--border)]/10 px-3 py-2.5 text-xs font-bold text-muted uppercase tracking-wide whitespace-nowrap sm:px-4",
                        getAlignment(column.align),
                        isSortable
                          ? "cursor-pointer select-none transition-colors hover:text-primary"
                          : "",
                        isActive ? "text-primary" : "",
                      ].join(" ")}
                    >
                      <span className="inline-flex max-w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
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
          </table>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-auto">
          <table className="min-w-[900px] w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              {visibleColumns.map((column) => (
                <col
                  key={column.key}
                  style={{
                    width:
                      column.width ||
                      (column.maxWidth ? column.maxWidth : "auto"),
                    minWidth:
                      column.minWidth ||
                      (column.maxWidth ? column.maxWidth : "100px"),
                  }}
                />
              ))}
            </colgroup>
            <tbody className="relative z-10">
              {loading ? (
                Array.from({ length: pageSize }).map((_, idx) => (
                  <SkeletonRow
                    key={idx}
                    columnsCount={visibleColumns.length}
                    rowIdx={idx}
                  />
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="p-0">
                    <div className="flex items-center justify-center h-[300px] w-full">
                      <p className="text-sm font-medium text-muted opacity-60">
                        {emptyMessage}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>{/* Subtle fetching indicator - show only when isFetching and data exists */}
                {isFetching && data.length > 0 && (
                  <tr className="absolute top-0 left-0 right-0 z-20 h-full bg-white/30">
                    <td colSpan={visibleColumns.length}>
                      <div className="flex items-center justify-center py-1">
                        <div className="h-1 w-20 rounded-full bg-primary/30 animate-pulse" />
                      </div>
                    </td>
                  </tr>
                )}
                {data.map((item, idx) => {
                  const expandedContent = expandedRowRender?.(item);
                  const isExpanded = !!expandedContent;
                  // Use rowKey if provided, otherwise use index - never JSON.stringify (expensive!)
                  const itemKey = rowKey ? rowKey(item) : `row-${idx}`;

                  return (
                    <React.Fragment
                      key={itemKey}
                    >
                      <tr
                        onClick={() => onRowClick?.(item)}
                        className={[
                          "group transition-colors duration-150",
                          onRowClick ? "cursor-pointer" : "",
                          idx % 2 === 0 ? "bg-transparent" : "bg-row-hover/10",
                          "hover:bg-row-hover",
                          isExpanded ? "bg-row-hover/20" : "",
                        ].join(" ")}
                      >
                        {visibleColumns.map((column) => {
                          const rawValue = item[column.key];
                          const fallbackText =
                            rawValue === null || rawValue === undefined
                              ? "-"
                              : String(rawValue);

                          const needsTruncation =
                            column.truncate === true ||
                            column.maxWidth !== undefined;
                          const cellStyle = column.maxWidth
                            ? { maxWidth: column.maxWidth }
                            : {};

                          const getCellContent = () => {
                            if (column.render) {
                              return column.render(item);
                            }
                            return (
                              <span className="block truncate opacity-90">
                                {fallbackText}
                              </span>
                            );
                          };

                          const cellContent = (
                            <div
                              style={
                                needsTruncation
                                  ? { maxWidth: column.maxWidth || "200px" }
                                  : undefined
                              }
                              className={
                                needsTruncation
                                  ? "min-w-0 w-full overflow-hidden text-ellipsis whitespace-nowrap"
                                  : "min-w-0"
                              }
                            >
                              {getCellContent()}
                            </div>
                          );

                          const tooltipText = column.tooltip
                            ? column.tooltip(item)
                            : needsTruncation
                              ? fallbackText
                              : undefined;

                          if (tooltipText) {
                            return (
                              <td
                                key={column.key}
                                style={cellStyle}
                                className={`border-b border-[var(--border)]/20 px-3 py-1.5 text-sm font-medium text-main sm:px-4 ${getAlignment(column.align)}`}
                              >
                                <Tooltip content={tooltipText}>
                                  {cellContent}
                                </Tooltip>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={column.key}
                              style={cellStyle}
                              className={`border-b border-[var(--border)]/20 px-3 py-1.5 text-sm font-medium text-main sm:px-4 ${getAlignment(column.align)}`}
                            >
                              {cellContent}
                            </td>
                          );
                        })}
                      </tr>

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
                })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center justify-between gap-2 border-t border-[var(--border)] bg-card px-3 py-1.5 text-xs sm:flex-row sm:px-4">
        <div className="text-xs font-medium text-muted">
          Total: {totalItems}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-card px-3 py-1.5 text-xs text-main outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
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
};

// Memoized table - prevents re-render when props haven't changed
const Table = memo(TableInner) as typeof TableInner;
export default Table;
