import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import BatchTable from "./BatchTable";
import {
  getStockReport,
  getStockById,
  deleteStockEntry,
} from "../../api/stockApi";
import { fireManagedSwal } from "../../utils/swalManager";
import { ChevronRight, ChevronDown, Upload } from "lucide-react";
import StockCorrectionModal from "../../components/inventory/stock/Stockcorrectionmodal";
import BulkUploadModal from "../../components/inventory/stock/BulkUploadModal";
import ViewStockModal from "../../components/inventory/ViewStockModal";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";


// ─── Component ────────────────────────────────────────────────────────────────

const Items: React.FC = () => {
  const mountedRef = useRef(true);

  // ── Data state — split loading so page changes don't flash skeleton
  const [items, setItems] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // ── Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Filters
  const [searchTerm, setSearchTerm] = useState("");

  // ── Expanded rows
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // ── Modals
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStockData, setViewStockData] = useState<any>(null);
  const [showStockCorrection, setShowStockCorrection] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  // ── Fetch — memoized with useCallback
  const fetchItems = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);

    try {
      const res = await getStockReport(page, pageSize, searchTerm,undefined, 1);
      if (!mountedRef.current) return;

      const list = res?.message?.data || [];

      const mapped = list.map((item: any) => ({
        id: item.item_code || "",
        itemCode: item.item_code || "",
        itemName: item.item_name || "",
        description: item.description ?? "-",
        packingUnit: item.packingUnit || "-",
        packingSize: item.packingSize || "-",
        totalQty: item.total_bal_qty ?? 0,
        totalBuyValue: Number(item.total_buy_value ?? 0),
        totalSellValue: Number(item.total_sell_value ?? 0),
        buyCurrency: item.buy_currency,
        sellCurrency: item.sell_currency,
        batches: item.batches || [],
      }));

      setItems(mapped);
      setTotalItems(res?.message?.pagination?.total_records ?? 0);
      setTotalPages(res?.message?.pagination?.total_pages ?? 1);
    } catch (err) {
      console.error(err);
      showApiError("Failed to load stock entries");
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, searchTerm]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchItems();
    return () => { mountedRef.current = false; };
  }, []);

  // Refetch on dependency change (skip initial)
  useEffect(() => {
    if (isInitialLoad) return;
    fetchItems();
  }, [page, pageSize, searchTerm]);

  // ── Handlers
  const toggleRow = (id: string) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleStockCorrection = (batch: any) => {
    setSelectedBatch(batch);
    setShowStockCorrection(true);
  };

  const handleBatchDelete = (batch: any) => {
    handleDelete({ id: batch.batch_no, ...batch });
  };

  const handleBatchLedger = (batch: any) => {
    console.log("Open ledger for batch:", batch.batch_no);
  };

  const handleDelete = async (item: { id: string; [key: string]: any }) => {
    const confirm = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete Stock Entry ${item.id}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      showLoading("Deleting Stock Entry...");
      const res = await deleteStockEntry({ stock_entry_id: item.id });

      if (res?.status_code !== 200 || res?.status !== "success") {
        closeSwal();
        showApiError(res?.message || "Delete failed");
        return;
      }

      closeSwal();
      showSuccess("Stock entry deleted successfully");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (error: any) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleBulkSaved = async () => {
    setShowBulkModal(false);
    try {
      await fetchItems();
      closeSwal();
      showSuccess("Bulk stock corrections applied");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  // ── Columns — styled to match CustomerManagement
  const columns: Column<any>[] = [
    {
      key: "expand",
      header: "",
      align: "center",
      render: (row) => (
        <span className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 transition-all duration-200">
          {expandedRows[row.id]
            ? <ChevronDown size={16} strokeWidth={2.5} className="text-primary" />
            : <ChevronRight size={16} strokeWidth={2.5} />}
        </span>
      ),
    },
    {
      key: "itemCode",
      header: "Item Code",
      render: (row) => (
        <span className="font-medium whitespace-nowrap">{row.itemCode ?? "—"}</span>
      ),
    },
    {
      key: "itemName",
      header: "Item Name",
      render: (row) => (
        <span className="font-medium block">{row.itemName ?? "—"}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="font-medium">{row.description ?? "—"}</span>
      ),
    },
    {
      key: "packingUnit",
      header: "Packing Unit",
      render: (row) => (
        <span className="whitespace-nowrap">
          {`${row.packingUnit ?? "—"} × ${row.packingSize ?? "—"}`}
        </span>
      ),
    },
    {
      key: "totalQty",
      header: "Qty",
      align: "right",
      render: (row) => (
        <code className="text-xs px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
          {row.totalQty}
        </code>
      ),
    },
    {
      key: "totalBuyValue",
      header: "Total Buy Value",
      align: "right",
      render: (row) => (
        <code className="text-xs px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
          {row.buyCurrency} {row.totalBuyValue.toLocaleString("en-IN")}
        </code>
      ),
    },
    {
      key: "totalSellValue",
      header: "Total Sell Value",
      align: "right",
      render: (row) => (
        <code className="text-xs px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
          {row.sellCurrency} {row.totalSellValue.toLocaleString("en-IN")}
        </code>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={items}
        tableId="inventory-stocks"
        rowKey={(r) => r.id}
        loading={isInitialLoad}
        isFetching={isFetching}
        onRowClick={(row) => toggleRow(row.id)}
        expandedRowRender={(row) =>
          expandedRows[row.id] ? (
            <BatchTable
              batches={row.batches || []}
              itemCode={row.itemCode}
              itemName={row.itemName}
              onEdit={handleStockCorrection}
              onDelete={handleBatchDelete}
              onLedger={handleBatchLedger}
            />
          ) : null
        }
        enableColumnSelector
        showToolbar
        searchValue={searchTerm}
        onSearch={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        extraFilters={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
              style={{ border: "1.5px solid var(--primary,#c97d2e)", color: "var(--primary,#c97d2e)", background: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,125,46,0.06)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Upload size={12} /> Bulk Upload
            </button>

            <button
              onClick={() => { setSelectedBatch(null); setShowStockCorrection(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
              style={{  border: "1.5px solid var(--primary,#c97d2e)", color: "var(--primary,#c97d2e)", boxShadow: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              Stock Correction
            </button>
          </div>
        }
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
      />

      <ViewStockModal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewStockData(null); }}
        stockData={viewStockData}
      />

      <StockCorrectionModal
        isOpen={showStockCorrection}
        onClose={() => { setShowStockCorrection(false); setSelectedBatch(null); }}
        onSuccess={() => { setShowStockCorrection(false); setSelectedBatch(null); fetchItems(); }}
        batch={selectedBatch}
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