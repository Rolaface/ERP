import React, { useState, useRef, useEffect } from "react";
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

const SkeletonRow: React.FC<{ columnsCount: number }> = ({ columnsCount }) => (
  <tr className="bg-transparent">
    {Array.from({ length: columnsCount }).map((_, idx) => (
      <td key={idx} className="border-b border-[var(--border)]/20 px-3 py-1.5 sm:px-4">
        <div className="h-4 animate-pulse rounded bg-gray-300" />
      </td>
    ))}
  </tr>
);

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
  const visibleColumns = columns.filter((col) => visibleKeys.includes(col.key));
  const columnWidth = visibleColumns.length > 0 ? `${100 / visibleColumns.length}%` : "auto";

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

  return (
    <div
      className="app-surface relative z-10 flex h-full min-h-0 w-full flex-col overflow-hidden"
      style={{
        maxHeight: "min(100%, var(--app-table-height))",
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
            <div className="flex shrink-0 items-center gap-4">{extraFilters}</div>
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
        <div className="shrink-0 border-b border-[var(--border)] bg-card">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              {visibleColumns.map((column) => (
                <col key={column.key} style={{ width: columnWidth }} />
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
                      onClick={isSortable ? () => handleColumnSort(column.key) : undefined}
                      className={[
                        "bg-card px-3 py-1.5 text-xs font-semibold text-muted whitespace-nowrap sm:px-4",
                        getAlignment(column.align),
                        isSortable ? "cursor-pointer select-none transition-colors hover:text-primary" : "",
                        isActive ? "text-primary" : "",
                      ].join(" ")}
                    >
                      <span className="inline-flex max-w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                        {column.header}
                        {isSortable && (
                          <span className="inline-flex opacity-60">
                            {isAsc ? (
                              <FaSortUp size={10} className="text-primary opacity-100" />
                            ) : isDesc ? (
                              <FaSortDown size={10} className="text-primary opacity-100" />
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

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              {visibleColumns.map((column) => (
                <col key={column.key} style={{ width: columnWidth }} />
              ))}
            </colgroup>
            <tbody className="relative z-10">
              {loading ? (
                Array.from({ length: pageSize }).map((_, idx) => (
                  <SkeletonRow key={idx} columnsCount={visibleColumns.length} />
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-16 text-center">
                    <p className="text-sm font-medium text-muted opacity-60">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => {
                  const expandedContent = expandedRowRender?.(item);
                  const isExpanded = !!expandedContent;

                  return (
                    <React.Fragment key={rowKey ? rowKey(item) : JSON.stringify(item)}>
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

                          const content = column.render ? (
                            column.render(item)
                          ) : (
                            <span className="block truncate opacity-90">
                              {fallbackText}
                            </span>
                          );

                          return (
                            <td
                              key={column.key}
                              className={`border-b border-[var(--border)]/20 px-3 py-1.5 text-sm font-medium text-main sm:px-4 ${getAlignment(column.align)}`}
                            >
                              <div className="min-w-0 overflow-hidden">
                                {column.tooltip ? (
                                  <Tooltip content={column.tooltip(item)}>
                                    <div className="min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                      {content}
                                    </div>
                                  </Tooltip>
                                ) : column.render ? (
                                  <div className="min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                    {content}
                                  </div>
                                ) : (
                                  <Tooltip content={fallbackText}>
                                    <div className="min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                      {content}
                                    </div>
                                  </Tooltip>
                                )}
                              </div>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center justify-between gap-2 border-t border-[var(--border)] bg-card px-3 py-1.5 text-xs sm:flex-row sm:px-4">
        <div className="text-xs font-medium text-muted">Total: {totalItems}</div>

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
}

export default Table;
