import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import XLSX from "xlsx-js-style";
import { ChevronRight, ChevronDown } from "lucide-react";

import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import { getStockReport, deleteStockEntry } from "../../api/stockApi";
import { fireManagedSwal } from "../../utils/swalManager";
import { openStockCorrectionModal } from "../../store/modalStore";
import type { Batch, BatchRow } from "../TablesHooks/Usebatchdetailstable";

// ─── Domain types ───────────────────────────────────────────────────────────

export interface StockItemRow {
  id: string;
  itemCode: string;
  itemName: string;
  description: string;
  packingUnit: string;
  packingSize: string;
  piecesPerBox: number | string;
  boxAvailable: number;
  totalQty: number;
  totalBuyValue: number;
  totalSellValue: number;
  buyCurrency?: string;
  sellCurrency?: string;
  isServiceItem?: boolean;
  batches: Batch[];
}

// ─── Excel export (batch-wise, across all items) ───────────────────────────

const LOW_STOCK_THRESHOLD = 500;
const NEAR_EXPIRY_DAYS = 90;

type ExportBatchStatus = "Available" | "Low Stock" | "Near Expiry" | "Out of Stock";

const getExportBatchStatus = (batch: any): ExportBatchStatus => {
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

const EXPORT_HEADERS = [
  "ITEM CODE",
  "ITEM NAME",
  "BATCH ID",
  "EXPIRY DATE",
  "STATUS",
  "QUANTITY",
  "CURRENCY",
  "VALUE",
];

const STATUS_STYLE: Record<ExportBatchStatus, { fill: string; font: string }> = {
  Available: { fill: "D1E7DD", font: "0F5132" },
  "Low Stock": { fill: "FFF3CD", font: "856404" },
  "Near Expiry": { fill: "F8D7DA", font: "842029" },
  "Out of Stock": { fill: "E2E3E5", font: "41464B" },
};

const thinBorder = { style: "thin", color: { rgb: "D9D9D9" } };
const cellBorder = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

const headerCellStyle = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  fill: { fgColor: { rgb: "1F2937" } },
  alignment: { vertical: "center", horizontal: "left" },
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

const statusCellStyle = (status: ExportBatchStatus) => ({
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
  alignment: { vertical: "center", horizontal: "right" },
};

const grandTotalValueStyle = {
  ...grandTotalLabelStyle,
  font: { bold: true, sz: 11, color: { rgb: "2F5597" } },
  alignment: { vertical: "center", horizontal: "right" },
};

/** Builds the batch-wise workbook. When `hideZeroStock` is true, zero-qty batches
 * (and items left with none remaining) are excluded — mirrors what's on screen. */
const buildBatchWiseWorkbook = (rawItems: any[], hideZeroStock: boolean) => {
  const aoa: any[][] = [EXPORT_HEADERS];
  const merges: XLSX.Range[] = [];
  const cellStyles: Record<string, any> = {};
  const setStyle = (r: number, c: number, style: any) => {
    cellStyles[XLSX.utils.encode_cell({ r, c })] = style;
  };
  EXPORT_HEADERS.forEach((_, c) => setStyle(0, c, headerCellStyle));

  let rowIdx = 1;
  let grandQty = 0;
  const currencyTotals: Record<string, number> = {};

  rawItems.forEach((item) => {
    if (item.is_service_item === 1 || !item.batches || item.batches.length === 0) return;

    item.batches.forEach((batch: any) => {
      const balQty = Number(batch?.bal_qty ?? 0);
      if (hideZeroStock && balQty <= 0) return;

      const balVal = Number(batch?.bal_val ?? 0);
      const currency = item.buy_currency || batch?.buy_currency || "—";
      const status = getExportBatchStatus(batch);

      aoa.push([
        item.item_code || "-",
        item.item_name || "-",
        batch?.batch_no || "-",
        batch?.expiry_date ? new Date(batch.expiry_date) : "",
        status,
        balQty,
        currency,
        balVal,
      ]);

      setStyle(rowIdx, 0, baseCellStyle);
      setStyle(rowIdx, 1, baseCellStyle);
      setStyle(rowIdx, 2, baseCellStyle);
      setStyle(rowIdx, 3, numCellStyle("left"));
      setStyle(rowIdx, 4, statusCellStyle(status));
      setStyle(rowIdx, 5, numCellStyle());
      setStyle(rowIdx, 6, { ...baseCellStyle, alignment: { horizontal: "center", vertical: "center" } });
      setStyle(rowIdx, 7, numCellStyle());

      grandQty += balQty;
      currencyTotals[currency] = (currencyTotals[currency] || 0) + balVal;
      rowIdx++;
    });
  });

  aoa.push(["GRAND TOTAL QTY", "", "", "", "", grandQty, "", ""]);
  merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 3 } });
  for (let c = 0; c <= 7; c++) setStyle(rowIdx, c, c === 5 ? grandTotalQtyStyle : grandTotalLabelStyle);
  rowIdx++;

  Object.entries(currencyTotals).forEach(([currency, total]) => {
    aoa.push([`GRAND TOTAL VALUE (${currency})`, "", "", "", "", "", "", total]);
    merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 6 } });
    for (let c = 0; c <= 6; c++) setStyle(rowIdx, c, grandTotalLabelStyle);
    setStyle(rowIdx, 7, grandTotalValueStyle);
    rowIdx++;
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const range = XLSX.utils.decode_range(worksheet["!ref"]!);
  for (let row = 1; row <= range.e.r; row++) {
    const ref = XLSX.utils.encode_cell({ r: row, c: 3 });
    const cell = worksheet[ref];
    if (cell && cell.v instanceof Date) {
      cell.t = "d";
      cell.z = "dd mmm yyyy";
    }
  }
  worksheet["!merges"] = merges;
  worksheet["!cols"] = [
    { wch: 20 }, { wch: 35 }, { wch: 18 }, { wch: 16 },
    { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 18 },
  ];
  worksheet["!rows"] = aoa.map((_, i) => ({ hpx: i === 0 ? 24 : 20 }));
  Object.entries(cellStyles).forEach(([addr, style]) => {
    if (worksheet[addr]) worksheet[addr].s = style;
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Wise Stock");
  return workbook;
};

// ─── Hook ───────────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<StockItemRow>();

export function useItemsStockTable() {
  const mountedRef = useRef(true);

  const [items, setItems] = useState<StockItemRow[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [hideZeroStock, setHideZeroStock] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStockData, setViewStockData] = useState<any>(null);

  const fetchItems = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);
    try {
      const res = await getStockReport(page, pageSize, searchTerm, undefined, 1);
      if (!mountedRef.current) return;

      const list = res?.message?.data || [];
      const mapped: StockItemRow[] = list.map((item: any) => ({
        id: item.item_code || "",
        itemCode: item.item_code || "",
        itemName: item.item_name || "",
        description: item.description ?? "-",
        packingUnit: item.packingUnit || "-",
        packingSize: item.packingSize || "-",
        piecesPerBox: item.piecesPerBox || "-",
        boxAvailable:
          item.piecesPerBox && item.piecesPerBox > 0
            ? Math.floor((item.total_bal_qty ?? 0) / item.piecesPerBox)
            : 0,
        totalQty: item.total_bal_qty ?? 0,
        totalBuyValue: Number(item.total_bal_val ?? 0),
        totalSellValue: Number(item.total_sell_value ?? 0),
        buyCurrency: item.buy_currency,
        sellCurrency: item.sell_currency,
        isServiceItem: item.is_service_item === 1,
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
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchTerm]);

  // ── Hide-zero-stock filter (client side, over the currently loaded page) ──
  // Removes items with no remaining quantity, and strips zero-qty batches
  // out of the batches passed down to the nested batch table.
  const visibleItems = useMemo<StockItemRow[]>(() => {
    if (!hideZeroStock) return items;
    return items
      .filter((item) => Number(item.totalQty || 0) > 0)
      .map((item) => ({
        ...item,
        batches: item.batches.filter((b: any) => Number(b?.bal_qty ?? 0) > 0),
      }));
  }, [items, hideZeroStock]);

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleStockCorrection = useCallback(
    (batch: any) => {
      openStockCorrectionModal({ selectedBatch: batch }, false, {
        onSuccess: async () => {
          await fetchItems();
        },
      });
    },
    [fetchItems],
  );

  const handleDelete = useCallback(async (item: { id: string; [key: string]: any }) => {
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
  }, []);

  const handleBatchDelete = useCallback(
    (batch: BatchRow) => handleDelete({ ...batch, id: batch.batch_no || "" }),
    [handleDelete],
  );

  const handleBatchLedger = useCallback((batch: any) => {
    openStockCorrectionModal({ selectedBatch: batch }, false, { isViewMode: true });
  }, []);

  const openNewStockCorrection = useCallback(() => {
    openStockCorrectionModal({ selectedBatch: null }, false, {
      onSuccess: async () => {
        await fetchItems();
      },
    });
  }, [fetchItems]);

  const handleBulkSaved = useCallback(async () => {
    setShowBulkModal(false);
    try {
      await fetchItems();
      closeSwal();
      showSuccess("Bulk stock corrections applied");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  }, [fetchItems]);

  const fetchAllForExport = useCallback(async () => {
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
  }, [searchTerm]);

  const handleExportExcel = useCallback(async () => {
    try {
      setIsExporting(true);
      showLoading("Preparing batch-wise stock report...");

      const rawItems = await fetchAllForExport();
      if (!rawItems.length) {
        closeSwal();
        showApiError("No data available to export");
        return;
      }

      const workbook = buildBatchWiseWorkbook(rawItems, hideZeroStock);
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
  }, [fetchAllForExport, hideZeroStock]);

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<StockItemRow, any>[]>(
    () => [
      columnHelper.display({
        id: "expand",
        header: "",
        size: 36,
        cell: ({ row }) => (
          <span className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 transition-all duration-200">
            {expandedRows[row.original.id] ? (
              <ChevronDown size={16} strokeWidth={2.5} className="text-primary" />
            ) : (
              <ChevronRight size={16} strokeWidth={2.5} />
            )}
          </span>
        ),
        enableSorting: false,
        enableHiding: false,
        meta: { align: "center" },
      }),
      columnHelper.accessor("itemCode", {
        header: "Item Code",
        cell: (info) => (
          <span className="font-medium whitespace-nowrap">{info.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("itemName", {
        header: "Item Name",
        cell: (info) => <span className="font-medium block">{info.getValue() ?? "—"}</span>,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        enableSorting: false,
        cell: (info) => <span className="font-medium">{info.getValue() ?? "—"}</span>,
      }),
      columnHelper.display({
        id: "packing",
        header: "Packing Unit",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {`${row.original.packingUnit ?? "—"} × ${row.original.packingSize ?? "—"}`}
          </span>
        ),
        meta: { align: "center" },
      }),
      columnHelper.accessor("piecesPerBox", {
        header: "Pieces/Box",
        cell: (info) => (
          <code className="text-s px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
            {info.getValue() ?? "—"}
          </code>
        ),
        meta: { align: "center" },
      }),
      columnHelper.accessor("totalQty", {
        header: "Qty",
        cell: (info) => (
          <code className="text-s px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
            {info.getValue()}
          </code>
        ),
        meta: { align: "center" },
      }),
      columnHelper.accessor("boxAvailable", {
        header: "Box Available",
        cell: (info) => (
          <code className="text-s px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
            {info.getValue() ?? "—"}
          </code>
        ),
        meta: { align: "center" },
      }),
      columnHelper.accessor("totalBuyValue", {
        header: "Total Buy Value",
        cell: (info) => (
          <code className="text-s px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
            {info.row.original.buyCurrency} {info.getValue().toLocaleString("en-IN")}
          </code>
        ),
        meta: { align: "right" },
      }),
      columnHelper.accessor("totalSellValue", {
        header: "Total Sell Value",
        cell: (info) => (
          <code className="text-s px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
            {info.row.original.sellCurrency} {info.getValue().toLocaleString("en-IN")}
          </code>
        ),
        meta: { align: "right" },
      }),
    ],
    [expandedRows],
  );

  const table = useReactTable({
    data: visibleItems,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return {
    table,
    isInitialLoad,
    isFetching,
    isExporting,
    items,
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
    fetchItems,
  };
}