import React from "react";
import { flexRender } from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Package2,
} from "lucide-react";

import BulkUploadModal from "../../components/inventory/stock/BulkUploadModal";
import ViewStockModal from "../../components/inventory/ViewStockModal";
import BatchDetailsTable from "../../views/Inventory/BatchTable";

import ItemsTableFilters from "../../utils/stockitemtablefilter";
import { useItemsStockTable } from "../../hooks/stock/Useitemsstocktable";

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

const Items: React.FC = () => {
  const {
    table,
    isInitialLoad,
    isFetching,
    isExporting,
    visibleItems,
    page,
    pageSize,
    totalPages,
    totalItems,
    setPage,
    setPageSize,
    searchTerm,
    setSearchTerm,
    hideZeroStock,
    setHideZeroStock,
    expandedRows,
    toggleRow,
    showBulkModal,
    setShowBulkModal,
    showViewModal,
    setShowViewModal,
    viewStockData,
    setViewStockData,
    handleStockCorrection,
    handleBatchDelete,
    handleBatchLedger,
    handleBulkSaved,
    handleExportExcel,
    openNewStockCorrection,
  } = useItemsStockTable();

  const leafColumnCount = table.getAllLeafColumns().length;

  return (
    <div className="h-full min-h-0 flex flex-col gap-2.5">
      <ItemsTableFilters
        searchTerm={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        hideZeroStock={hideZeroStock}
        onHideZeroStockChange={setHideZeroStock}
        onBulkUpload={() => setShowBulkModal(true)}
        onStockCorrection={openNewStockCorrection}
        onExport={handleExportExcel}
        isExporting={isExporting}
        exportDisabled={visibleItems.length === 0}
      />

      <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-y-auto flex-1 min-h-0 relative custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-card border-b border-[var(--border)]">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const align = (header.column.columnDef.meta as any)?.align;
                    const alignCls =
                      align === "right"
                        ? "text-right"
                        : align === "center"
                          ? "text-center"
                          : "text-left";
                    const sortable = header.column.getCanSort();
                    const sortDir = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={
                          sortable
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                        className={`px-3.5 py-3 text-[10px] font-black uppercase tracking-widest text-muted whitespace-nowrap bg-card border-b border-[var(--border)] ${alignCls} ${
                          sortable
                            ? "cursor-pointer select-none hover:text-main"
                            : ""
                        }`}
                      >
                        <span
                          className={`inline-flex items-center gap-1 ${
                            align === "right" ? "flex-row-reverse" : ""
                          }`}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sortable &&
                            (sortDir === "asc" ? (
                              <ChevronUp size={11} />
                            ) : sortDir === "desc" ? (
                              <ChevronDown size={11} />
                            ) : (
                              <ChevronsUpDown
                                size={11}
                                className="opacity-30"
                              />
                            ))}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isInitialLoad ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    {table.getAllLeafColumns().map((col) => (
                      <td key={col.id} className="px-3.5 py-3.5">
                        <div className="h-3 w-full max-w-[110px] bg-[var(--border)] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={leafColumnCount} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted">
                      <Package2 size={22} className="opacity-30" />
                      <span className="text-xs">
                        {hideZeroStock
                          ? "No items with stock on hand. Try disabling “Hide Zero Stock”."
                          : "No stock entries found."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const item = row.original;
                  const isExpanded = !!expandedRows[item.id];
                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        onClick={() => toggleRow(item.id)}
                        className="hover:bg-row-hover transition-colors cursor-pointer"
                        style={{
                          borderBottom: "1px solid rgba(128,128,128,0.1)",
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const align = (cell.column.columnDef.meta as any)
                            ?.align;
                          const alignCls =
                            align === "right"
                              ? "text-right"
                              : align === "center"
                                ? "text-center"
                                : "text-left";
                          const isDescription =
                            cell.column.id === "description";
                          return (
                            <td className="px-3.5 py-3 align-top">
                              <div className="max-w-[280px] leading-5">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={leafColumnCount} className="p-0">
                            <BatchDetailsTable
                              batches={item.batches}
                              itemCode={item.itemCode}
                              itemName={item.itemName}
                              onEdit={handleStockCorrection}
                              onDelete={handleBatchDelete}
                              onLedger={handleBatchLedger}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
          {isFetching && !isInitialLoad && (
            <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] flex items-center justify-center z-20">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-[var(--border)] bg-card px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span className="text-[11px]">
            {totalItems > 0 ? (
              <>
                Showing{" "}
                <span className="font-semibold text-main">
                  {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, totalItems)}
                </span>{" "}
                of <span className="font-semibold text-main">{totalItems}</span>
              </>
            ) : (
              "No entries"
            )}
          </span>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 px-2 text-[11px] border border-[var(--border)] bg-app rounded-md text-main focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              className="p-1 rounded-md border border-[var(--border)] bg-card text-main hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="text-[11px] font-semibold text-main tabular-nums px-1">
              {page} / {Math.max(totalPages, 1)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isFetching}
              className="p-1 rounded-md border border-[var(--border)] bg-card text-main hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      <ViewStockModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewStockData(null);
        }}
        stockData={viewStockData}
      />

      <BulkUploadModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSubmit={handleBulkSaved}
      />
    </div>
  );
};

export default Items;
