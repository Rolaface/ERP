import React, { useState, useMemo, memo } from "react";
import type { Column } from "./type";
import ColumnSelector from "./ColumnSelector";
import Pagination from "../../Pagination";
import Tooltip from "../../Tooltip";
import { FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { useColumnStore } from "../../../store/useColumnStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SortState {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface ModalTableProps<T> {
  columns: Column<T>[];
  data: T[];
  tableId?: string;
  rowKey?: (row: T) => string;
  loading?: boolean;
  isFetching?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;

  // Toolbar
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
  defaultVisibleKeys?: string[];

  // Sorting
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sort: SortState) => void;

  // Pagination
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalItems?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  bodyMaxHeight?: number | string;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

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
          className="border-b border-[var(--border)]/20 px-3 py-[7px]"
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

// ─── ModalTable Inner ─────────────────────────────────────────────────────────

const ModalTableInner = <T extends Record<string, any>>({
  columns = [],
  data = [],
  tableId,
  rowKey,
  loading = false,
  isFetching = false,
  emptyMessage = "No records found",
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
  defaultVisibleKeys,

  sortBy,
  sortOrder: sortOrderProp,
  onSortChange,

  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
  bodyMaxHeight = 300,
}: ModalTableProps<T>) => {
  const allKeys = useMemo(() => columns.map((col) => col.key), [columns]);
  const { getVisibleKeys, setVisibleKeys: saveVisibleKeys } = useColumnStore();


const [visibleKeys, setVisibleKeys] = useState<string[]>(() => {
  if (tableId) {
    const persisted = useColumnStore.getState().columnPrefs[tableId];
    if (persisted && persisted.length > 0) {
      const filtered = persisted.filter((k) => allKeys.includes(k));
     
      if (allKeys.includes("actions") && !filtered.includes("actions")) {
        filtered.push("actions");
      }
      return filtered;
    }
  }
 
  const nonActionKeys = allKeys.filter((k) => k !== "actions");
  if (defaultVisibleKeys?.length) {
    const filtered = defaultVisibleKeys.filter((k) => allKeys.includes(k));
    if (allKeys.includes("actions") && !filtered.includes("actions")) {
      filtered.push("actions");
    }
    return filtered;
  }
  const first5 = nonActionKeys.slice(0, 5);
  return allKeys.includes("actions") ? [...first5, "actions"] : allKeys.slice(0, 6);
});

  const handleApplyColumns = (keys: string[]) => {
    setVisibleKeys(keys);
    if (tableId) saveVisibleKeys(tableId, keys);
  };

  const visibleColumns = useMemo(
    () => columns.filter((col) => visibleKeys.includes(col.key)),
    [columns, visibleKeys],
  );

  // ── Sorting ──────────────────────────────────────────────────────────────
  const handleColumnSort = (colKey: string) => {
    if (!onSortChange) return;
    const isSameColumn = sortBy === colKey;
    const newOrder: "asc" | "desc" =
      isSameColumn && sortOrderProp === "asc" ? "desc" : "asc";
    onSortChange({ sortBy: colKey, sortOrder: newOrder });
  };

  // ── Alignment helper ─────────────────────────────────────────────────────
  const getAlignment = (align?: "left" | "center" | "right"): string => {
    switch (align) {
      case "center": return "text-center";
      case "right":  return "text-right";
      default:       return "text-left";
    }
  };

  const getColumnWidth = (col: Column<T>) =>
    col.minWidth ?? col.width ?? col.maxWidth ?? "120px";

  const getColumnWidthPx = (value: string) => {
    const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
    if (pxMatch) return Number(pxMatch[1]);

    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : 120;
  };

  const tableMinWidth = useMemo(
    () =>
      Math.max(
        visibleColumns.reduce(
          (total, col) => total + getColumnWidthPx(getColumnWidth(col)),
          0,
        ),
        320,
      ),
    [visibleColumns],
  );

  // ── Shared colgroup ──────────────────────────────────────────────────────
  const Colgroup = () => (
    <colgroup>
      {visibleColumns.map((col) => (
        <col
          key={col.key}
          style={{
            width: getColumnWidth(col),
          }}
        />
      ))}
    </colgroup>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-lg border border-[var(--border)] bg-card overflow-hidden flex flex-col">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      {showToolbar && (
        <div className="flex shrink-0 flex-col gap-2 border-b border-[var(--border)] bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="group relative w-full max-w-xs">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted transition-colors group-focus-within:text-primary" />
            <input
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder={toolbarPlaceholder}
              className="w-full rounded-xl border border-[var(--border)] bg-card py-1.5 pl-9 pr-3 text-sm font-medium text-main outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Extra filters */}
          {extraFilters && (
            <div className="flex shrink-0 items-center gap-3">{extraFilters}</div>
          )}

          {/* Right-side actions */}
          <div className="flex shrink-0 items-center gap-2">
            {enableColumnSelector && (
              <ColumnSelector
                columns={columns}
                visibleKeys={visibleKeys}
                allKeys={allKeys}
                onApply={handleApplyColumns}
              />
            )}
            {enableAdd && (
              <button
                onClick={onAdd}
                className="whitespace-nowrap rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {addLabel}
              </button>
            )}
            {enableExport && (
              <button
                onClick={onExport}
                className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-main transition-colors hover:bg-row-hover"
              >
                Export
              </button>
            )}
          </div>
        </div>
      )}

      <div className="min-w-0 overflow-x-auto">
        <div style={{ minWidth: `${tableMinWidth}px` }}>
      {/* ── Sticky Header ────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b-2 border-[var(--border)] bg-card w-full">
        <table className="w-full table-fixed border-separate border-spacing-0">
          <Colgroup />
          <thead>
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
                      "bg-[var(--border)]/10 px-3 py-2 text-xs font-bold text-muted uppercase tracking-wide whitespace-nowrap",
                      getAlignment(column.align),
                      isSortable ? "cursor-pointer select-none transition-colors hover:text-primary" : "",
                      isActive ? "text-primary" : "",
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap leading-none">
                      {column.header}
                      {isSortable && (
                        <span className="inline-flex opacity-60">
                          {isAsc  ? <FaSortUp   size={10} className="text-primary opacity-100" /> :
                           isDesc ? <FaSortDown size={10} className="text-primary opacity-100" /> :
                                    <FaSort size={10} />}
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

      {/* ── Scrollable Body — keeps ModalTable's compact max-h ───────────── */}
      <div
        className="custom-scrollbar overflow-y-auto"
        style={{
          maxHeight:
            typeof bodyMaxHeight === "number"
              ? `${bodyMaxHeight}px`
              : bodyMaxHeight,
        }}
      >
        <table className="w-full table-fixed border-separate border-spacing-0">
          <Colgroup />
          <tbody className="relative z-10">
            {loading ? (
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, idx) => (
                <SkeletonRow key={idx} columnsCount={visibleColumns.length} rowIdx={idx} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="p-0">
                  <div className="flex items-center justify-center h-[120px] w-full">
                    <p className="text-sm font-medium text-muted opacity-60">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {/* Subtle fetching overlay */}
                {isFetching && data.length > 0 && (
                  <tr className="absolute top-0 left-0 right-0 z-20 h-full bg-white/30">
                    <td colSpan={visibleColumns.length}>
                      <div className="flex items-center justify-center py-1">
                        <div className="h-1 w-16 rounded-full bg-primary/30 animate-pulse" />
                      </div>
                    </td>
                  </tr>
                )}
                {data.map((item, idx) => {
                  const itemKey = rowKey ? rowKey(item) : `row-${idx}`;
                  return (
                    <tr
                      key={itemKey}
                      onClick={() => onRowClick?.(item)}
                      className={[
                        "group transition-colors duration-150",
                        onRowClick ? "cursor-pointer" : "",
                        idx % 2 === 0 ? "bg-transparent" : "bg-row-hover/10",
                        "hover:bg-row-hover",
                      ].join(" ")}
                    >
                      {visibleColumns.map((column) => {
                        const rawValue    = item[column.key];
                        const fallbackText =
                          rawValue === null || rawValue === undefined
                            ? "-"
                            : String(rawValue);

                        const needsTruncation =
                          column.truncate === true || column.maxWidth !== undefined;
                        const cellStyle = column.maxWidth
                          ? { maxWidth: column.maxWidth }
                          : {};

                        const getCellContent = () =>
                          column.render ? (
                            column.render(item)
                          ) : (
                            <span className="block truncate opacity-90">
                              {fallbackText}
                            </span>
                          );

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

                        const tdClass = `border-b border-[var(--border)]/20 px-3 py-1.5 text-sm font-medium text-main ${getAlignment(column.align)}`;

                        if (tooltipText) {
                          return (
                            <td key={column.key} style={cellStyle} className={tdClass}>
                              <Tooltip content={tooltipText}>{cellContent}</Tooltip>
                            </td>
                          );
                        }

                        return (
                          <td key={column.key} style={cellStyle} className={tdClass}>
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
        </table>
      </div>

        </div>
      </div>

      {/* ── Footer: total + page-size + pagination ────────────────────────── */}
      <div className="flex shrink-0 flex-col items-center justify-between gap-1 border-t border-[var(--border)] bg-card px-3 py-1 text-xs sm:flex-row sm:px-3">
        <div className="text-xs font-medium text-muted">Total: {totalItems}</div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-muted">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-card px-2 py-1 text-xs text-main outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
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
};

const ModalTable = memo(ModalTableInner) as typeof ModalTableInner;
export default ModalTable;
