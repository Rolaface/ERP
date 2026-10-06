import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import { pageBtnCls } from "./Styles";

const PAGE_WINDOW = 2;

interface Props<T> {
  table: Table<T>;
  disabled?: boolean;
}

export function TablePagination<T>({ table, disabled }: Props<T>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const page = pageIndex + 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] bg-card px-3 py-2 text-xs text-muted">
      <span className="text-[11px]">
        {total > 0 ? (
          <>
            Showing{" "}
            <span className="font-semibold text-main">
              {pageIndex * pageSize + 1}–{Math.min(page * pageSize, total)}
            </span>{" "}
            of <span className="font-semibold text-main">{total}</span>
          </>
        ) : (
          "No entries"
        )}
      </span>

      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || disabled}
            className={pageBtnCls}
          >
            <ChevronLeft size={13} />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= PAGE_WINDOW)
            .map((p) => (
              <button
                key={p}
                onClick={() => table.setPageIndex(p - 1)}
                disabled={disabled}
                className={`rounded-md border px-2 py-0.5 text-[11px] transition-all ${
                  p === page
                    ? "border-primary bg-primary font-bold text-white"
                    : "border-[var(--border)] bg-card text-main hover:bg-row-hover"
                }`}
              >
                {p}
              </button>
            ))}
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || disabled}
            className={pageBtnCls}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

export default TablePagination;