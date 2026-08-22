import React, { useCallback, useState } from "react";
import { flexRender } from "@tanstack/react-table";
import Pagination from "../../components/Pagination";
import { ChevronUp, ChevronDown, ChevronsUpDown, Package2 } from "lucide-react";

import { openImportInventoryModal } from "../../store/modalStore";
import ViewStockModal from "../../components/inventory/ViewStockModal";
import BatchDetailsTable from "../../views/Inventory/BatchTable";
import StockLedgerView from "../../views/Inventory/StockLedgerView";

import ItemsTableFilters from "../../utils/stockitemtablefilter";
import { useItemsStockTable } from "../../hooks/stock/Useitemsstocktable";
import type { BatchRow } from "../../hooks/TablesHooks/Usebatchdetailstable";

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

const Items: React.FC = () => {
  console.count("Items");

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
    expandedRows,
    toggleRow,
    showViewModal,
    setShowViewModal,
    viewStockData,
    setViewStockData,
    handleStockCorrection,
    handleBatchDelete,
    handleBulkSaved,
    handleExportExcel,
    openNewStockCorrection,
  } = useItemsStockTable();

  const [ledgerBatch, setLedgerBatch] = useState<{
    itemCode?: string;
    itemName?: string;
    batchNo?: string;
    warehouse?: string; 
  } | null>(null);

  const handleViewStockLedger = useCallback((batch: BatchRow) => {
    setLedgerBatch({
      itemCode: batch.itemCode ?? "",
      itemName: batch.itemName ?? "",
      batchNo: batch.batch_no,
      warehouse: batch.warehouse ?? "",
    });
  }, []);

  const handleLedgerBack = useCallback(() => {
    setLedgerBatch(null);
  }, []);
  const handleViewStockLedgerGeneral = useCallback(() => {
    setLedgerBatch({});
  }, []);

  const leafColumnCount = table.getAllLeafColumns().length;

  if (ledgerBatch) {
    return (
      <StockLedgerView
        itemCode={ledgerBatch.itemCode}
        itemName={ledgerBatch.itemName}
        batchNo={ledgerBatch.batchNo}
        warehouse={ledgerBatch.warehouse}  
        onBack={handleLedgerBack}
      />
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-2.5">
      <ItemsTableFilters
        searchTerm={searchTerm}
        onSearchChange={(v) => setSearchTerm(v)}
        onBulkUpload={() =>
          openImportInventoryModal(undefined, {
            onSuccess: async () => {
              await handleBulkSaved();
            },
          })
        }
        onStockCorrection={openNewStockCorrection}
        onViewStockLedger={handleViewStockLedgerGeneral}
        onExport={handleExportExcel}
        isExporting={isExporting}
        exportDisabled={visibleItems.length === 0}
      />

      <div
        className="bg-card border border-[var(--border)] rounded-xl overflow-hidden flex flex-col"
        style={{ height: "calc(95.5vh - 190px)" }}
      >
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
                      <span className="text-xs">No stock entries found.</span>
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
                          return (
                            <td
                              key={cell.id}
                              className={`px-3.5 py-3 align-top ${alignCls}`}
                            >
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
                              onLedger={handleViewStockLedger}
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

        <div className="border-t border-[var(--border)] bg-card px-3 py-2">
          <Pagination
            currentPage={page}
            totalPages={Math.max(totalPages, 1)}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
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
    </div>
  );
};

export default Items;
