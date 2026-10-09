import React, { useEffect, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Loader2 } from "lucide-react";
import TablePagination from "../../../../components/ui/Tankstack/Tablepagination";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "left" | "center" | "right";
    cellClassName?: string;
    stickyLeft?: number;
  }
}

const alignClass = (a?: "left" | "center" | "right") =>
  a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";

function ColumnPicker({
  columns,
}: {
  columns: ReturnType<ReturnType<typeof useReactTable<any>>["getAllLeafColumns"]>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const hideable = columns.filter((c) => c.getCanHide());
  if (!hideable.length) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Choose columns"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-card text-muted transition-colors hover:border-primary/40 hover:text-main"
      >
        <Columns3 size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-lg border border-[var(--border)] bg-card py-1 shadow-xl">
          {hideable.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-main transition-colors hover:bg-row-hover"
            >
              <input
                type="checkbox"
                checked={c.getIsVisible()}
                onChange={c.getToggleVisibilityHandler()}
                className="cursor-pointer rounded border-[var(--border)] text-primary"
              />
              {typeof c.columnDef.header === "string" ? c.columnDef.header : c.id}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export interface TaskTreeTableProps<T> {
  tableId: string;
  columns: ColumnDef<T, any>[];
  data: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  fetching?: boolean;
  emptyMessage?: React.ReactNode;

  sortBy?: string;
  sortOrder?: string;
  onSortChange?: (key: string, order: "asc" | "desc") => void;

  toolbar?: React.ReactNode;
  rowClassName?: (row: T) => string;
  onRowDoubleClick?: (row: T) => void;

  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
  onPageChange: (p: number) => void;
  onPageSizeChange?: (n: number) => void;
}

export function TaskTreeTable<T>({
  tableId,
  columns,
  data,
  getRowId,
  loading = false,
  fetching = false,
  emptyMessage = "No tasks found.",
  sortBy,
  sortOrder,
  onSortChange,
  toolbar,
  rowClassName,
  onRowDoubleClick,
  page,
  totalPages,
  pageSize,
  totalItems,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: TaskTreeTableProps<T>) {
  const storageKey = `${tableId}:columns`;
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      try {
        return JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      } catch {
        return {};
      }
    },
  );

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(columnVisibility));
    } catch {
      return;
    }
  }, [columnVisibility, storageKey]);

  const sorting: SortingState = sortBy
    ? [{ id: sortBy, desc: sortOrder === "desc" }]
    : [];

  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    state: { sorting, columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const toggleSort = (id: string) => {
    if (!onSortChange) return;
    if (sortBy !== id) return onSortChange(id, "asc");
    onSortChange(id, sortOrder === "asc" ? "desc" : "asc");
  };

  const rows = table.getRowModel().rows;
  const colCount = table.getVisibleLeafColumns().length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        {toolbar}
        <ColumnPicker columns={table.getAllLeafColumns()} />
      </div>

       <div className="custom-scrollbar relative min-h-0 flex-1 overflow-auto">
        <table className="w-full table-fixed border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 z-20">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const col = header.column;
                  const meta = col.columnDef.meta;
                  const sorted = col.getIsSorted();
                  const canSort =
                    col.columnDef.enableSorting !== false && !!onSortChange;
                  const content = header.isPlaceholder
                    ? null
                    : flexRender(col.columnDef.header, header.getContext());
                  const pinned = meta?.stickyLeft !== undefined;
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : undefined
                      }
                      className={`whitespace-nowrap border-b border-[var(--border)] bg-app px-3 py-2 text-[11px] font-semibold text-muted ${alignClass(meta?.align)} ${
                        pinned ? "md:sticky md:z-30" : ""
                      }`}
                      style={{
                        width: header.getSize(),
                        minWidth: col.columnDef.minSize,
                        left: pinned ? meta?.stickyLeft : undefined,
                      }}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.id)}
                          className={`inline-flex items-center gap-1 transition-colors hover:text-main ${
                            sorted ? "text-main" : ""
                          }`}
                        >
                          {content}
                          {sorted === "asc" ? (
                            <ArrowUp size={11} />
                          ) : sorted === "desc" ? (
                            <ArrowDown size={11} />
                          ) : (
                            <ArrowUpDown size={11} className="opacity-50" />
                          )}
                        </button>
                      ) : (
                        content
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} style={{ height: 320 }}>
                  <div className="flex h-full items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-muted" />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="py-16 text-center text-xs text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onDoubleClick={
                    onRowDoubleClick
                      ? () => onRowDoubleClick(row.original)
                      : undefined
                  }
                  className={`bg-card transition-colors hover:bg-row-hover ${
                    rowClassName ? rowClassName(row.original) : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta;
                    const pinned = meta?.stickyLeft !== undefined;
                    return (
                      <td
                        key={cell.id}
                        className={`align-middle ${
                          meta?.cellClassName ?? "px-3 py-1.5"
                        } ${alignClass(meta?.align)} ${
                          pinned ? "bg-inherit md:sticky md:z-10" : ""
                        }`}
                        style={{
                          borderBottom: "1px solid rgba(128,128,128,0.12)",
                          left: pinned ? meta?.stickyLeft : undefined,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {fetching && !loading && rows.length > 0 && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
            <Loader2 size={20} className="animate-spin text-primary" />
          </div>
        )}
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={pageSizeOptions}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        disabled={fetching}
      />
    </div>
  );
}

export default TaskTreeTable;