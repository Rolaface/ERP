import React from "react";
import { flexRender, type Table, type Row } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

/**
 * Generic, reusable table shell built on a TanStack Table instance.
 *
 * Handles the edge cases every data table in this app needs, so callers
 * don't reimplement them each time:
 *  - initial load (no data yet)               -> centered spinner, sized like `skeletonRows`
 *  - background refetch (data already shown)  -> translucent overlay spinner, table stays visible
 *  - zero results                             -> empty state message
 *  - error                                    -> inline error row (optional, caller-controlled)
 *  - sticky header while scrolling body
 *  - per-column alignment via `columnDef.meta.align` ("left" | "center" | "right")
 *  - optional row click handling
 *
 * Pagination is intentionally NOT part of this component — pair it with
 * <TablePagination /> underneath so either can be reused independently
 * (e.g. a table that doesn't paginate, or infinite-scroll instead).
 */

type ColumnAlign = "left" | "center" | "right";

function getAlign(meta: unknown): ColumnAlign {
  const align = (meta as { align?: ColumnAlign } | undefined)?.align;
  return align ?? "left";
}

function alignClass(align: ColumnAlign) {
  return align === "right"
    ? "text-right"
    : align === "center"
      ? "text-center"
      : "text-left";
}

export interface DataTableProps<TData> {
  table: Table<TData>;
  /** True on the very first load, before any rows exist. Shows a full-height spinner. */
  loading?: boolean;
  /**
   * True when refetching data that's already on screen (e.g. after "Apply").
   * Keeps existing rows visible and dims them with an overlay spinner instead
   * of blanking the table — avoids layout jump / flicker on every refetch.
   */
  refreshing?: boolean;
  /** Shown when there are zero rows and we're not in the initial loading state. */
  emptyMessage?: React.ReactNode;
  /** Inline error banner rendered as a full-width row inside the table body. */
  error?: string | null;
  /** Roughly how many rows' worth of height to reserve for the initial-load spinner. */
  skeletonRows?: number;
  /** Height (px) per row, used to size the initial-load spinner area. Default 38. */
  rowHeightPx?: number;
  onRowClick?: (row: Row<TData>) => void;
  rowClassName?: (row: Row<TData>) => string;
  className?: string;
}

export function DataTable<TData>({
  table,
  loading = false,
  refreshing = false,
  emptyMessage = "No records found.",
  error,
  skeletonRows = 8,
  rowHeightPx = 38,
  onRowClick,
  rowClassName,
  className = "",
}: DataTableProps<TData>) {
  const leafColumns = table.getAllLeafColumns();
  const columnCount = leafColumns.length;
  const bodyRows = table.getRowModel().rows;

  // Nothing to render at all (no columns configured yet) — bail quietly
  // rather than rendering an empty <table> shell.
  if (columnCount === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <table className="w-full text-left border-collapse table-fixed">
        <colgroup>
          {leafColumns.map((col) => (
            <col key={col.id} style={{ width: col.getSize() }} />
          ))}
        </colgroup>

        <thead className="sticky top-0 z-20">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest
                    text-muted whitespace-nowrap overflow-hidden text-ellipsis
                    bg-card border-b border-[var(--border)] ${alignClass(
                      getAlign(header.column.columnDef.meta),
                    )}`}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {error ? (
            <tr>
              <td
                colSpan={columnCount}
                className="py-6 px-3 text-center text-xs text-red-500"
              >
                {error}
              </td>
            </tr>
          ) : loading ? (
            <tr>
              <td
                colSpan={columnCount}
                style={{ height: `${skeletonRows * rowHeightPx}px` }}
              >
                <div className="flex justify-center items-center h-full">
                  <Loader2 size={20} className="animate-spin text-muted" />
                </div>
              </td>
            </tr>
          ) : bodyRows.length === 0 ? (
            <tr>
              <td
                colSpan={columnCount}
                className="py-14 text-center text-xs text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            bodyRows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`h-[36px] transition-colors ${
                  onRowClick
                    ? "cursor-pointer hover:bg-row-hover"
                    : "hover:bg-row-hover"
                } ${rowClassName ? rowClassName(row) : ""}`}
                style={{ borderBottom: "1px solid rgba(128,128,128,0.12)" }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-3 py-1 overflow-hidden text-ellipsis whitespace-nowrap ${alignClass(
                      getAlign(cell.column.columnDef.meta),
                    )}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {refreshing && !loading && bodyRows.length > 0 && (
        <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] flex items-center justify-center z-20">
          <Loader2 size={20} className="animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

export default DataTable;
