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
import XLSX from "xlsx-js-style";
import StockCorrectionModal from "./stockcorrectionmodal";
import BulkUploadModal from "../../components/inventory/stock/BulkUploadModal";
import ViewStockModal from "../../components/inventory/ViewStockModal";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";

// ─── Excel export config ────────────────────────────────────────────────────

const HEADERS = ["ITEM NAME & SKU", "BATCH ID", "EXPIRY DATE", "STATUS", "QUANTITY", "VALUE"];
const COL_COUNT = HEADERS.length;

const LOW_STOCK_THRESHOLD = 500;   // tune as needed
const NEAR_EXPIRY_DAYS = 90;       // tune as needed

type BatchStatus = "Available" | "Low Stock" | "Near Expiry" | "Out of Stock";

const getBatchStatus = (batch: any): BatchStatus => {
  const balQty = Number(batch?.bal_qty ?? 0);
  if (balQty <= 0) return "Out of Stock";

  if (batch?.expiry_date) {
    const daysToExpiry =
      (new Date(batch.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysToExpiry <= NEAR_EXPIRY_DAYS) return "Near Expiry";
  }

  if (balQty < LOW_STOCK_THRESHOLD) return "Low Stock";
  return "Available";
};

const STATUS_STYLE: Record<BatchStatus, { fill: string; font: string }> = {
  "Available": { fill: "D1E7DD", font: "0F5132" },
  "Low Stock": { fill: "FFF3CD", font: "856404" },
  "Near Expiry": { fill: "F8D7DA", font: "842029" },
  "Out of Stock": { fill: "E2E3E5", font: "41464B" },
};

const fmtDate = (d: string | null) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtNum = (n: number) =>
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const thinBorder = { style: "thin", color: { rgb: "D9D9D9" } };
const cellBorder = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

const headerCellStyle = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  fill: { fgColor: { rgb: "1F2937" } },
  alignment: { vertical: "center", horizontal: "left" },
  border: cellBorder,
};

const groupCellStyle = {
  font: { bold: true, italic: true, color: { rgb: "2F5597" }, sz: 11 },
  fill: { fgColor: { rgb: "EAF1FB" } },
  alignment: { vertical: "center", horizontal: "left", indent: 1 },
  border: cellBorder,
};

const baseCellStyle = {
  font: { sz: 10, color: { rgb: "2A2A2A" } },
  alignment: { vertical: "center" },
  border: cellBorder,
};

const numCellStyle = (align: "left" | "right" = "right") => ({
  ...baseCellStyle,
  alignment: { vertical: "center", horizontal: align },
});

const statusCellStyle = (status: BatchStatus) => ({
  font: { bold: true, sz: 9, color: { rgb: STATUS_STYLE[status].font } },
  fill: { fgColor: { rgb: STATUS_STYLE[status].fill } },
  alignment: { vertical: "center", horizontal: "center" },
  border: cellBorder,
});

const grandTotalLabelStyle = {
  font: { bold: true, sz: 11, color: { rgb: "1F2937" } },
  fill: { fgColor: { rgb: "F1F3F6" } },
  alignment: { vertical: "center", horizontal: "center" },
  border: cellBorder,
};

const grandTotalQtyStyle = {
  ...grandTotalLabelStyle,
  font: { bold: true, sz: 11, color: { rgb: "1F2937" } },
  alignment: { vertical: "center", horizontal: "right" },
};

const grandTotalValueStyle = {
  ...grandTotalLabelStyle,
  font: { bold: true, sz: 11, color: { rgb: "2F5597" } },
  alignment: { vertical: "center", horizontal: "right" },
};

const buildBatchWiseWorkbook = (rawItems: any[]) => {
  const aoa: any[][] = [HEADERS];
  const merges: XLSX.Range[] = [];
  const cellStyles: Record<string, any> = {};

  const setStyle = (r: number, c: number, style: any) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    cellStyles[addr] = style;
  };

  // header row styles
  HEADERS.forEach((_, c) => setStyle(0, c, headerCellStyle));

  let rowIdx = 1;
  let grandQty = 0;
 
  const currencyTotals: Record<string, number> = {};

  rawItems.forEach((item) => {
    // Skip service items — they have no physical batches/stock
    if (item.is_service_item === 1 || !item.batches || item.batches.length === 0) {
      return;
    }

    
    aoa.push([`  ${item.item_name || "-"}  (SKU: ${item.item_code || "-"})`, "", "", "", "", ""]);
    merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: COL_COUNT - 1 } });
    for (let c = 0; c < COL_COUNT; c++) setStyle(rowIdx, c, groupCellStyle);
    rowIdx++;

    item.batches.forEach((batch: any) => {
      const balQty = Number(batch?.bal_qty ?? 0);
      const balVal = Number(batch?.bal_val ?? 0);
     
      const currency = item.buy_currency || batch?.buy_currency || "—";
      const status = getBatchStatus(batch);

      aoa.push([
        item.item_code || "-",
        batch?.batch_no || "-",
        fmtDate(batch?.expiry_date),
        status,
        fmtNum(balQty),
        `${currency} ${fmtNum(balVal)}`.trim(),
      ]);

      setStyle(rowIdx, 0, { ...baseCellStyle, alignment: { vertical: "center", indent: 1 } });
      setStyle(rowIdx, 1, baseCellStyle);
      setStyle(rowIdx, 2, numCellStyle("left"));
      setStyle(rowIdx, 3, statusCellStyle(status));
      setStyle(rowIdx, 4, numCellStyle());
      setStyle(rowIdx, 5, numCellStyle());

      grandQty += balQty;
      currencyTotals[currency] = (currencyTotals[currency] || 0) + balVal;
      rowIdx++;
    });
  });

  // ── Grand Total — Quantity (single row, currency-agnostic)
  aoa.push(["GRAND TOTAL QTY", "", "", "", fmtNum(grandQty), ""]);
  merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 3 } });
  setStyle(rowIdx, 0, grandTotalLabelStyle);
  setStyle(rowIdx, 1, grandTotalLabelStyle);
  setStyle(rowIdx, 2, grandTotalLabelStyle);
  setStyle(rowIdx, 3, grandTotalLabelStyle);
  setStyle(rowIdx, 4, grandTotalQtyStyle);
  setStyle(rowIdx, 5, { ...grandTotalLabelStyle, alignment: { vertical: "center", horizontal: "right" } });
  rowIdx++;

  // ── Grand Total — Value, one row PER currency (never mixed)
  Object.entries(currencyTotals).forEach(([currency, total]) => {
    aoa.push([`GRAND TOTAL VALUE (${currency})`, "", "", "", "", fmtNum(total)]);
    merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 4 } });
    for (let c = 0; c <= 4; c++) setStyle(rowIdx, c, grandTotalLabelStyle);
    setStyle(rowIdx, 5, grandTotalValueStyle);
    rowIdx++;
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet["!merges"] = merges;
  worksheet["!cols"] = [
    { wch: 42 }, // Item Name & SKU
    { wch: 16 }, // Batch ID
    { wch: 16 }, // Expiry Date
    { wch: 16 }, // Status
    { wch: 14 }, // Quantity
    { wch: 22 }, // Value
  ];
  worksheet["!rows"] = aoa.map((_, i) => ({ hpx: i === 0 ? 24 : 20 }));

  Object.entries(cellStyles).forEach(([addr, style]) => {
    if (worksheet[addr]) worksheet[addr].s = style;
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Wise Stock");
  return workbook;
};

// ─── Component ────────────────────────────────────────────────────────────────

const Items: React.FC = () => {
  const mountedRef = useRef(true);

  const [items, setItems] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStockData, setViewStockData] = useState<any>(null);
  const [showStockCorrection, setShowStockCorrection] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const fetchItems = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);

    try {
      const res = await getStockReport(page, pageSize, searchTerm, undefined, 1);
      if (!mountedRef.current) return;

      const list = res?.message?.data || [];

      const mapped = list.map((item: any) => ({
        id: item.item_code || "",
        itemCode: item.item_code || "",
        itemName: item.item_name || "",
        description: item.description ?? "-",
        packingUnit: item.packingUnit || "-",
        packingSize: item.packingSize || "-",
        piecesPerBox: item.piecesPerBox || "-",
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

  useEffect(() => {
    mountedRef.current = true;
    fetchItems();
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    fetchItems();
  }, [page, pageSize, searchTerm]);

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

  // ── Fetch entire filtered dataset (all pages) for export
  const fetchAllForExport = async () => {
    const exportPageSize = 200;
    let currentPage = 1;
    let all: any[] = [];
    let pagesTotal = 1;

    do {
      const res = await getStockReport(currentPage, exportPageSize, searchTerm, undefined, 1);
      const list = res?.message?.data || [];
      all = all.concat(list);
      pagesTotal = res?.message?.pagination?.total_pages ?? 1;
      currentPage++;
    } while (currentPage <= pagesTotal);

    return all;
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      showLoading("Preparing batch-wise stock report...");

      const rawItems = await fetchAllForExport();

      if (!rawItems.length) {
        closeSwal();
        showApiError("No data available to export");
        return;
      }

      const workbook = buildBatchWiseWorkbook(rawItems);
      const fileName = `Batch-Wise-Stock-Report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      closeSwal();
      showSuccess(`Batch-wise stock report exported (${rawItems.length} items)`);
    } catch (err) {
      console.error(err);
      closeSwal();
      showApiError("Failed to export stock report");
    } finally {
      setIsExporting(false);
    }
  };

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
      align: "center",
      render: (row) => (
        <span className="whitespace-nowrap">
          {`${row.packingUnit ?? "—"} × ${row.packingSize ?? "—"}`}
        </span>
      ),
    },
    {
      key: "piecesPerBox",
      header: "Pieces/Box",
      align: "center",
      render: (row) => (
        <span className="whitespace-nowrap">{row.piecesPerBox ?? "—"}</span>
      ),
    },
    {
      key: "totalQty",
      header: "Qty",
      align: "center",
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
        enableExport={true}
        onExport={handleExportExcel}
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
              style={{ border: "1.5px solid var(--primary,#c97d2e)", color: "var(--primary,#c97d2e)", boxShadow: "transparent" }}
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
        pageSizeOptions={[20, 50, 100, 200]}
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
  onClose={() => setShowStockCorrection(false)}
  selectedBatch={selectedBatch}
  onSubmit={async (payload) => { /* call your save API here, then fetchItems() */ }}
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