import React, { useState, useMemo, memo } from "react";
import type { Column } from "./type";
import ColumnSelector from "./ColumnSelector";
import Pagination from "../../Pagination";
import Tooltip from "../../Tooltip";
import { FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { useColumnStore } from "../../../store/useColumnStore";


interface SortState {
  sortBy:    string;
  sortOrder: "asc" | "desc";
}

interface ModalTableProps<T> {
  columns:       Column<T>[];
  data:          T[];
  tableId?:      string;
  rowKey?:       (row: T) => string;
  loading?:      boolean;
  isFetching?:   boolean;
  emptyMessage?: string;
  onRowClick?:   (item: T) => void;

  // Toolbar
  showToolbar?:          boolean;
  extraFilters?:         React.ReactNode;
  toolbarPlaceholder?:   string;
  searchValue?:          string;
  onSearch?:             (q: string) => void;
  enableAdd?:            boolean;
  addLabel?:             string;
  onAdd?:                () => void;
  enableExport?:         boolean;
  exportLabel?:          string;
  onExport?:             () => void;
  enableColumnSelector?: boolean;
  defaultVisibleKeys?:   string[];

  // Sorting
  sortBy?:       string;
  sortOrder?:    "asc" | "desc";
  onSortChange?: (sort: SortState) => void;

  // Pagination
  currentPage?:      number;
  totalPages?:       number;
  pageSize?:         number;
  totalItems?:       number;
  pageSizeOptions?:  number[];
  onPageChange?:     (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  // bodyMaxHeight removed — table now fills available space via flex-1
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
        <td key={idx} className="border-b border-[var(--border)]/20 px-3 py-[9px]">
          <div
            className={`h-3 rounded-full relative overflow-hidden ${widths[(rowIdx + idx) % widths.length]}`}
            style={{ backgroundColor: "rgba(0,0,0,0.07)" }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:     "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
                animation:      "shimmer 1.5s ease-in-out infinite",
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
  columns  = [],
  data     = [],
  tableId,
  rowKey,
  loading      = false,
  isFetching   = false,
  emptyMessage = "No records found",
  onRowClick,

  showToolbar          = false,
  extraFilters,
  toolbarPlaceholder   = "Search...",
  searchValue          = "",
  onSearch,
  enableAdd            = false,
  addLabel             = "+ Add",
  onAdd,
  enableExport         = false,
  exportLabel          = "Export",
  onExport,
  enableColumnSelector = false,
  defaultVisibleKeys,

  sortBy,
  sortOrder: sortOrderProp,
  onSortChange,

  currentPage     = 1,
  totalPages      = 1,
  pageSize        = 10,
  totalItems      = 0,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
}: ModalTableProps<T>) => {

  const allKeys = useMemo(() => columns.map((c) => c.key), [columns]);
  const { setVisibleKeys: saveVisibleKeys } = useColumnStore();

  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => {
    if (tableId) {
      const persisted = useColumnStore.getState().columnPrefs[tableId];
      if (persisted?.length) {
        const filtered = persisted.filter((k) => allKeys.includes(k));
        if (allKeys.includes("actions") && !filtered.includes("actions"))
          filtered.push("actions");
        return filtered;
      }
    }
    if (defaultVisibleKeys?.length) {
      const filtered = defaultVisibleKeys.filter((k) => allKeys.includes(k));
      if (allKeys.includes("actions") && !filtered.includes("actions"))
        filtered.push("actions");
      return filtered;
    }
    return allKeys;
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
    const newOrder: "asc" | "desc" =
      sortBy === colKey && sortOrderProp === "asc" ? "desc" : "asc";
    onSortChange({ sortBy: colKey, sortOrder: newOrder });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getAlignment = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right")  return "text-right";
    return "text-left";
  };

  // ── Colgroup ──────────────────────────────────────────────────────────────
  const colgroup = useMemo(() => (
    <colgroup>
      {visibleColumns.map((col) => (
        <col key={col.key} style={{ width: col.width ?? col.minWidth ?? "auto" }} />
      ))}
    </colgroup>
  ), [visibleColumns]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    // outer: fill whatever height the parent gives, then split into 3 rows (toolbar / body / footer)
    <div className="w-full h-full rounded-lg border border-[var(--border)] bg-card overflow-hidden flex flex-col">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      {showToolbar && (
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-[var(--border)] bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="group relative w-full sm:w-auto sm:max-w-xs">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted transition-colors group-focus-within:text-primary" />
            <input
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder={toolbarPlaceholder}
              className="w-full rounded-xl border border-[var(--border)] bg-card py-1.5 pl-9 pr-3 text-sm font-medium text-main outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {extraFilters && (
            <div className="flex shrink-0 items-center gap-3">{extraFilters}</div>
          )}

          <div className="flex shrink-0 items-center gap-2 ml-auto">
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
                className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-main transition-colors hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-900/20"
              >
                {exportLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Scrollable table region — flex-1 so it fills all remaining height ── */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <table className="w-full table-auto border-separate border-spacing-0">
          {colgroup}

          {/* Sticky header */}
          <thead className="sticky top-0 z-10">
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
                      "border-b-2 border-[var(--border)] bg-card",
                      "px-3 py-2 text-xs font-bold text-muted uppercase tracking-wide whitespace-nowrap",
                      getAlignment(column.align),
                      isSortable ? "cursor-pointer select-none transition-colors hover:text-primary" : "",
                      isActive   ? "text-primary" : "",
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

          {/* Body */}
          <tbody className="relative z-0">
            {loading ? (
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, idx) => (
                <SkeletonRow key={idx} columnsCount={visibleColumns.length} rowIdx={idx} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="p-0">
                  <div className="flex items-center justify-center h-[120px] w-full">
                    <p className="text-sm font-medium text-muted opacity-60">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {isFetching && data.length > 0 && (
                  <tr>
                    <td colSpan={visibleColumns.length} className="p-0">
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
                        const rawValue     = item[column.key];
                        const fallbackText =
                          rawValue === null || rawValue === undefined
                            ? "-"
                            : String(rawValue);

                        const needsTruncation =
                          column.truncate === true || column.maxWidth !== undefined;

                        const getCellContent = () =>
                          column.render ? (
                            column.render(item)
                          ) : (
                            <span className="block truncate opacity-90">{fallbackText}</span>
                          );

                        const cellContent = (
                          <div
                            style={needsTruncation ? { maxWidth: column.maxWidth || "200px" } : undefined}
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
                          : needsTruncation ? fallbackText : undefined;

                        const tdClass = [
                          "border-b border-[var(--border)]/20 px-3 py-2",
                          "text-sm font-medium text-main",
                          getAlignment(column.align),
                        ].join(" ");

                        return (
                          <td
                            key={column.key}
                            style={column.maxWidth ? { maxWidth: column.maxWidth } : undefined}
                            className={tdClass}
                          >
                            {tooltipText ? (
                              <Tooltip content={tooltipText}>{cellContent}</Tooltip>
                            ) : (
                              cellContent
                            )}
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

      {/* ── Footer — minimal height so the table body gets maximum vertical room ── */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] bg-card px-3 py-0.5 text-[10px] leading-tight min-h-0">
        <div className="text-[10px] font-medium text-muted">Total: {totalItems}</div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1">
            <label className="text-[10px] font-medium text-muted">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="cursor-pointer rounded-md border border-[var(--border)] bg-card px-1 py-0 text-[10px] leading-tight text-main outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
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