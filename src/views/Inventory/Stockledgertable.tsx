import React from "react";
import type { Table } from "@tanstack/react-table";
import type { StockLedgerRow } from "../../hooks/stock/useStockLedger";
import DataTable from "../../components/ui/Tankstack/Datatable";
import TablePagination from "../../components/ui/Tankstack/Tablepagination";

interface StockLedgerTableProps {
  table: Table<StockLedgerRow>;
  columnsCount: number;
  rows: StockLedgerRow[];
  loading: boolean;
  isInitialLoad: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const StockLedgerTable: React.FC<StockLedgerTableProps> = ({
  table,
  columnsCount,
  rows,
  loading,
  isInitialLoad,
  page,
  pageSize,
  totalPages,
  onPageChange,
}) => {
  if (columnsCount === 0) return null;

  return (
    <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
        <DataTable
          table={table}
          loading={isInitialLoad}
          refreshing={loading && !isInitialLoad}
          emptyMessage="No stock ledger entries found for the selected filters."
          skeletonRows={Math.min(pageSize, 10)}
        />
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={rows.length}
        onPageChange={onPageChange}
        disabled={loading}
      />
    </div>
  );
};

export default StockLedgerTable;