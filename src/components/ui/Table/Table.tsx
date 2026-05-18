import React, { useState, useRef, useEffect, useMemo, memo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type Row,
} from "@tanstack/react-table";
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

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  tableId?: string;
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

// ─── Expanded Panel ───────────────────────────────────────────────────────────

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

// ─── Ghost Row (Excel-style filler) ──────────────────────────────────────────
// Fills empty space below real rows so the table always looks full

const ROW_HEIGHT = 37; // px — must match real row height

const GhostRow: React.FC<{ columnsCount: number; idx: number }> = ({
  columnsCount,
  idx,
}) => (
  <tr
    className={idx % 2 === 0 ? "bg-transparent" : "bg-row-hover/10"}
    style={{ height: `${ROW_HEIGHT}px` }}
  >
    {Array.from({ length: columnsCount }).map((_, colIdx) => (
      <td
        key={colIdx}
        className="border-b border-[var(--border)]/10 px-3 sm:px-4"
      />
    ))}
  </tr>
);

// ─── Fetching Overlay ─────────────────────────────────────────────────────────
// Fixed: was an absolute <tr> which is invalid HTML. Now a proper overlay div.

const FetchingBar: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 flex justify-center py-1 bg-white/30">
      <div className="h-1 w-20 rounded-full bg-primary/30 animate-pulse" />
    </div>
  );
};

// ─── Main Table ───────────────────────────────────────────────────────────────

const TableInner = <T extends Record<string, any>>({
  columns: columnDefs = [],
  data = [],
  rowKey,
  loading = false,
  isFetching = false,
  emptyMessage = "No records found.",
  tableId,
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
  // ── Column store for persistence ───────────────────────────────────────────
  const allKeys = useMemo(() => columnDefs.map((col) => col.key), [columnDefs]);
  const { getVisibleKeys, setVisibleKeys: saveVisibleKeys } = useColumnStore();

  const [visibleKeys, setVisibleKeys] = useState<string[]>(() =>
    tableId ? getVisibleKeys(tableId, allKeys) : allKeys,
  );

  const handleApplyColumns = (keys: string[]) => {
    setVisibleKeys(keys);
    if (tableId) saveVisibleKeys(tableId, keys);
    // Sync with TanStack visibility state
    const newVisibility: VisibilityState = {};
    allKeys.forEach((k) => {
      newVisibility[k] = keys.includes(k);
    });
    setColumnVisibility(newVisibility);
  };

  // ── TanStack column visibility ─────────────────────────────────────────────
  const initialVisibility = useMemo(() => {
    const v: VisibilityState = {};
    allKeys.forEach((k) => {
      v[k] = visibleKeys.includes(k);
    });
    return v;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(initialVisibility);

  // ── TanStack sorting (controlled externally) ───────────────────────────────
  const sorting: SortingState = useMemo(
    () =>
      sortBy && sortOrderProp
        ? [{ id: sortBy, desc: sortOrderProp === "desc" }]
        : [],
    [sortBy, sortOrderProp],
  );

  // ── Convert your Column<T> → TanStack ColumnDef<T> ────────────────────────
  const tanstackColumns = useMemo<ColumnDef<T>[]>(
    () =>
      columnDefs.map((col) => ({
        id: col.key,
        accessorKey: col.key,
        header: col.header as string,
        enableSorting: !!col.sortable,
        size: col.width ? parseInt(col.width) : undefined,
        minSize: col.minWidth ? parseInt(col.minWidth) : 100,
        maxSize: col.maxWidth ? parseInt(col.maxWidth) : undefined,
        cell: ({ row }) => {
          const item = row.original;
          const rawValue = item[col.key];
          const fallbackText =
            rawValue === null || rawValue === undefined
              ? "-"
              : String(rawValue);

          if (col.render) {
            return col.render(item);
          }
          return (
            <span className="block truncate opacity-90">{fallbackText}</span>
          );
        },
      })),
    [columnDefs],
  );

  // ── TanStack table instance ────────────────────────────────────────────────
  const table = useReactTable({
    data,
    columns: tanstackColumns,
    state: {
      sorting,
      columnVisibility,
    },
    // Sorting is server-side; disable client sorting
    manualSorting: true,
    onSortingChange: (updater) => {
      if (!onSortChange) return;
      const next = typeof updater === "function" ? updater(sorting) : updater;
      if (next.length === 0) return;
      const { id, desc } = next[0];
      onSortChange({ sortBy: id, sortOrder: desc ? "desc" : "asc" });
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: rowKey ? (row, idx) => rowKey(row) : (_, idx) => String(idx),
  });

  const visibleColumns = table.getVisibleLeafColumns();
  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  // ── Alignment helper ───────────────────────────────────────────────────────
  const getAlignment = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  // ── Column meta lookup (for tooltip, align, truncate, maxWidth) ────────────
  const colMeta = useMemo(() => {
    const map: Record<string, Column<T>> = {};
    columnDefs.forEach((c) => (map[c.key] = c));
    return map;
  }, [columnDefs]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="app-surface relative z-10 flex w-full flex-col overflow-hidden"
      style={{
        height: "clamp(420px, calc(100vh - 230px), 900px)",
      }}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      {showToolbar && (
        <div className="flex shrink-0 flex-col gap-2 border-b border-[var(--border)] bg-card px-3 py-2 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="group relative w-full max-w-[18rem]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted transition-colors group-focus-within:text-primary" />
            <input
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder={toolbarPlaceholder}
              className="h-8 w-full rounded-lg border border-[var(--border)] bg-card pl-9 pr-3 text-xs font-medium text-main outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {extraFilters && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {extraFilters}
            </div>
          )}

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {enableColumnSelector && (
              <ColumnSelector
                columns={columnDefs}
                visibleKeys={visibleKeys}
                allKeys={allKeys}
                onApply={handleApplyColumns}
              />
            )}
            {enableAdd && (
              <button
                onClick={onAdd}
                className="h-8 whitespace-nowrap rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                {addLabel}
              </button>
            )}
            {enableExport && (
              <button
                onClick={onExport}
                className="h-8 rounded-lg border border-[var(--border)] px-3 text-xs font-semibold text-main transition-colors hover:bg-row-hover"
              >
                Export
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Table area ──────────────────────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1 flex flex-col overflow-hidden">
        {/* Fetching bar — fixed: no longer an absolute <tr> */}
        <FetchingBar show={isFetching && data.length > 0} />

        {/* ── SINGLE TABLE ─────────────────────────────────────────────────── */}
        <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[600px] border-collapse h-full">
            {/* colgroup shared by both thead and tbody */}
            <colgroup>
              {visibleColumns.map((col) => {
                const meta = colMeta[col.id];
                return (
                  <col
                    key={col.id}
                    style={{
                      width:
                        meta?.width ??
                        (meta?.maxWidth ? meta.maxWidth : "auto"),
                      minWidth:
                        meta?.minWidth ??
                        (meta?.maxWidth ? meta.maxWidth : "80px"),
                    }}
                  />
                );
              })}
            </colgroup>

            {/* ── thead ────────────────────────────────────────────────────── */}
            <thead className="sticky top-0 z-30 bg-card">
              {headerGroups.map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const meta = colMeta[header.id];
                    const isSortable =
                      header.column.getCanSort() && !!onSortChange;
                    const sorted = header.column.getIsSorted();

                    return (
                      <th
                        key={header.id}
                        onClick={
                          isSortable
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                        className={[
                          "bg-card border-b border-[var(--border)] px-3 py-2",
                          "text-[11px] font-bold text-muted uppercase tracking-wide whitespace-nowrap sm:px-4",
                          getAlignment(meta?.align),
                          isSortable
                            ? "cursor-pointer select-none transition-colors hover:text-primary"
                            : "",
                          sorted ? "text-primary" : "",
                        ].join(" ")}
                      >
                        <span className="inline-flex max-w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {isSortable && (
                            <span className="inline-flex opacity-60">
                              {sorted === "asc" ? (
                                <FaSortUp
                                  size={10}
                                  className="text-primary opacity-100"
                                />
                              ) : sorted === "desc" ? (
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
              ))}
            </thead>

            {/* ── tbody ────────────────────────────────────────────────────── */}
            <tbody className="h-full">
              {loading ? (
                Array.from({ length: pageSize }).map((_, idx) => (
                  <SkeletonRow
                    key={idx}
                    columnsCount={visibleColumns.length}
                    rowIdx={idx}
                  />
                ))
              ) : rows.length === 0 ? (
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
                rows.map((row, idx) => {
                  const item = row.original;
                  const expandedContent = expandedRowRender?.(item);
                  const isExpanded = !!expandedContent;

                  return (
                    <React.Fragment key={row.id}>
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
                        {row.getVisibleCells().map((cell) => {
                          const meta = colMeta[cell.column.id];
                          const rawValue = item[cell.column.id];
                          const fallbackText =
                            rawValue === null || rawValue === undefined
                              ? "-"
                              : String(rawValue);

                          const needsTruncation =
                            meta?.truncate === true ||
                            meta?.maxWidth !== undefined;
                          const cellStyle = meta?.maxWidth
                            ? { maxWidth: meta.maxWidth }
                            : {};

                          const cellContent = (
                            <div
                              style={
                                needsTruncation
                                  ? { maxWidth: meta?.maxWidth ?? "200px" }
                                  : undefined
                              }
                              className={
                                needsTruncation
                                  ? "min-w-0 w-full overflow-hidden text-ellipsis whitespace-nowrap"
                                  : "min-w-0"
                              }
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </div>
                          );

                          const tooltipText = meta?.tooltip
                            ? meta.tooltip(item)
                            : needsTruncation
                              ? fallbackText
                              : undefined;

                          return (
                            <td
                              key={cell.id}
                              style={cellStyle}
                              className={`border-b border-[var(--border)]/20 px-3 py-1 text-sm font-medium text-main sm:px-4 ${getAlignment(meta?.align)}`}
                            >
                              {tooltipText ? (
                                <Tooltip content={tooltipText}>
                                  {cellContent}
                                </Tooltip>
                              ) : (
                                cellContent
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Expanded row */}
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

              {/* ── Ghost rows — fill empty space below data (Excel-style) ── */}
              {!loading &&
                rows.length > 0 &&
                rows.length < pageSize &&
                Array.from({ length: pageSize - rows.length }).map((_, idx) => (
                  <GhostRow
                    key={`ghost-${idx}`}
                    columnsCount={visibleColumns.length}
                    idx={rows.length + idx}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] bg-card px-3 py-1 text-xs sm:px-4">
        <div className="text-xs font-medium text-muted">
          Total: {totalItems}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 cursor-pointer rounded-md border border-[var(--border)] bg-card px-2 text-xs text-main outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
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

const Table = memo(TableInner) as typeof TableInner;
export default Table;
