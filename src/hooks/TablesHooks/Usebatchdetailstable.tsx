import { useCallback, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import XLSX from "xlsx-js-style";

// ─── Domain types ───────────────────────────────────────────────────────────

export interface Batch {
  batch_no?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  warehouse?: string;

  bal_qty?: number;
  in_qty?: number;
  out_qty?: number;
  buy_value?: number;
  sell_value?: number;
  buy_currency?: string;
  sell_currency?: string;
  buy_price_latest?: number;
  buy_price_avg?: number;
  sell_price_latest?: number;
  sell_price_avg?: number;
}
export type BatchStatus =
  | "Available"
  | "Low Stock"
  | "Near Expiry"
  | "Expired"
  | "Out of Stock";

export interface BatchRow extends Batch {
  id: string;
  srNo: number;
  itemCode?: string;
  itemName?: string;
  status: BatchStatus;
}

export interface BatchKpis {
  totalBatches: number;
  totalQty: number;
  buyTotals: Record<string, number>;
  sellTotals: Record<string, number>;
  expiredCount: number;
  nearExpiryCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

// ─── Config (tune as needed) ────────────────────────────────────────────────

export const LOW_STOCK_THRESHOLD = 500;
export const NEAR_EXPIRY_DAYS = 90;

export const BATCH_STATUS_CONFIG: Record<
  BatchStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  Available: {
    label: "Available",
    bg: "rgba(16,185,129,0.1)",
    text: "#059669",
    border: "rgba(16,185,129,0.25)",
    dot: "#10b981",
  },
  "Low Stock": {
    label: "Low Stock",
    bg: "rgba(245,158,11,0.1)",
    text: "#b45309",
    border: "rgba(245,158,11,0.25)",
    dot: "#f59e0b",
  },
  "Near Expiry": {
    label: "Near Expiry",
    bg: "rgba(249,115,22,0.1)",
    text: "#c2410c",
    border: "rgba(249,115,22,0.25)",
    dot: "#f97316",
  },
  Expired: {
    label: "Expired",
    bg: "rgba(239,68,68,0.1)",
    text: "#dc2626",
    border: "rgba(239,68,68,0.25)",
    dot: "#ef4444",
  },
  "Out of Stock": {
    label: "Out of Stock",
    bg: "rgba(107,114,128,0.1)",
    text: "#4b5563",
    border: "rgba(107,114,128,0.25)",
    dot: "#6b7280",
  },
};

// ─── Status derivation (priority: out of stock > expired > near expiry > low stock) ──

export const getBatchStatus = (batch: Batch): BatchStatus => {
  const balQty = Number(batch?.bal_qty ?? 0);
  if (balQty <= 0) return "Out of Stock";

  if (batch?.expiry_date) {
    const daysToExpiry =
      (new Date(batch.expiry_date).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24);
    if (daysToExpiry < 0) return "Expired";
    if (daysToExpiry <= NEAR_EXPIRY_DAYS) return "Near Expiry";
  }

  if (balQty < LOW_STOCK_THRESHOLD) return "Low Stock";
  return "Available";
};

// ─── Expiry urgency (independent of stock status) ──────────────────────────
// Used to color the Expiry Date cell directly instead of a separate Status column.

export type ExpiryUrgency = "expired" | "near" | "normal";

export const getExpiryUrgency = (expiryDate?: string | null): ExpiryUrgency => {
  if (!expiryDate) return "normal";
  const dt = new Date(expiryDate);
  if (isNaN(dt.getTime())) return "normal";
  const daysToExpiry = (dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysToExpiry < 0) return "expired";
  if (daysToExpiry <= NEAR_EXPIRY_DAYS) return "near";
  return "normal";
};

const EXPIRY_URGENCY_STYLE: Record<
  ExpiryUrgency,
  { bg: string; text: string; border: string; dot: string } | null
> = {
  expired: BATCH_STATUS_CONFIG["Expired"],
  near: BATCH_STATUS_CONFIG["Near Expiry"],
  normal: null,
};

// ─── Formatters ─────────────────────────────────────────────────────────────

export const formatDate = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatNumber = (n?: number | string, digits = 0) =>
  Number(n ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });

export const formatCurrencyValue = (currency?: string, value?: number) =>
  `${currency || "—"} ${formatNumber(value, 2)}`;

// ─── Excel export ───────────────────────────────────────────────────────────

const thinBorder = { style: "thin", color: { rgb: "D9D9D9" } };
const cellBorder = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
};

const headerStyle = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  fill: { fgColor: { rgb: "1F2937" } },
  alignment: { vertical: "center", horizontal: "left" },
  border: cellBorder,
};

const baseStyle = {
  font: { sz: 10, color: { rgb: "2A2A2A" } },
  alignment: { vertical: "center" },
  border: cellBorder,
};

const numStyle = (align: "left" | "right" | "center" = "right") => ({
  ...baseStyle,
  alignment: { vertical: "center", horizontal: align },
});

const statusStyle = (status: BatchStatus) => {
  const c = BATCH_STATUS_CONFIG[status];
  return {
    font: { bold: true, sz: 9, color: { rgb: c.text.replace("#", "") } },
    fill: { fgColor: { rgb: c.dot.replace("#", "") } },
    alignment: { vertical: "center", horizontal: "center" },
    border: cellBorder,
  };
};

const totalRowStyle = {
  font: { bold: true, sz: 11, color: { rgb: "1F2937" } },
  fill: { fgColor: { rgb: "F1F3F6" } },
  alignment: { vertical: "center", horizontal: "left" },
  border: cellBorder,
};

export const exportBatchesToExcel = (
  rows: BatchRow[],
  showItemColumns: boolean,
  fileLabel: string,
) => {
  const headers = [
    ...(showItemColumns ? ["ITEM CODE", "ITEM NAME"] : []),
    "BATCH NO",
    "WAREHOUSE",

    "MFG DATE",
    "EXPIRY DATE",
    "STATUS",
    "BAL QTY",
    "IN QTY",
    "OUT QTY",
    "BUY VALUE",
    "SELL VALUE",
    "BUY PRICE (LATEST)",
    "SELL PRICE (LATEST)",
  ];

  const aoa: any[][] = [headers];
  const cellStyles: Record<string, any> = {};
  const setStyle = (r: number, c: number, style: any) => {
    cellStyles[XLSX.utils.encode_cell({ r, c })] = style;
  };
  headers.forEach((_, c) => setStyle(0, c, headerStyle));

  let rowIdx = 1;
  let grandQty = 0;
  const buyTotals: Record<string, number> = {};
  const sellTotals: Record<string, number> = {};

  rows.forEach((b) => {
    const base = showItemColumns ? [b.itemCode || "-", b.itemName || "-"] : [];
    aoa.push([
      ...base,
      b.batch_no || "-",
      b.warehouse || "-",
      b.manufacturing_date ? new Date(b.manufacturing_date) : "",
      b.expiry_date ? new Date(b.expiry_date) : "",
      b.status,
      Number(b.bal_qty || 0),
      Number(b.in_qty || 0),
      Number(b.out_qty || 0),
      Number(b.buy_value || 0),
      Number(b.sell_value || 0),
      Number(b.buy_price_latest || 0),
      Number(b.sell_price_latest || 0),
    ]);

    let c = 0;
    if (showItemColumns) {
      setStyle(rowIdx, c++, baseStyle);
      setStyle(rowIdx, c++, baseStyle);
      setStyle(rowIdx, c++, baseStyle);
    }
    setStyle(rowIdx, c++, baseStyle);

    setStyle(rowIdx, c++, numStyle("left"));
    setStyle(rowIdx, c++, numStyle("left"));
    setStyle(rowIdx, c++, statusStyle(b.status));
    setStyle(rowIdx, c++, numStyle());
    setStyle(rowIdx, c++, numStyle());
    setStyle(rowIdx, c++, numStyle());
    setStyle(rowIdx, c++, numStyle());
    setStyle(rowIdx, c++, numStyle());
    setStyle(rowIdx, c++, numStyle());
    setStyle(rowIdx, c++, numStyle());

    grandQty += Number(b.bal_qty || 0);
    const buyCcy = b.buy_currency || "—";
    const sellCcy = b.sell_currency || "—";
    buyTotals[buyCcy] = (buyTotals[buyCcy] || 0) + Number(b.buy_value || 0);
    sellTotals[sellCcy] =
      (sellTotals[sellCcy] || 0) + Number(b.sell_value || 0);
    rowIdx++;
  });

  const qtyColIdx = headers.indexOf("BAL QTY");
  aoa.push(
    headers.map((_, i) =>
      i === 0 ? "GRAND TOTAL" : i === qtyColIdx ? grandQty : "",
    ),
  );
  headers.forEach((_, c) => setStyle(rowIdx, c, totalRowStyle));
  rowIdx++;

  Object.entries(buyTotals).forEach(([ccy, total]) => {
    aoa.push(
      headers.map((h) =>
        h === "BUY VALUE"
          ? total
          : h === "BATCH NO"
            ? `Total Buy (${ccy})`
            : "",
      ),
    );
    headers.forEach((_, c) => setStyle(rowIdx, c, totalRowStyle));
    rowIdx++;
  });

  Object.entries(sellTotals).forEach(([ccy, total]) => {
    aoa.push(
      headers.map((h) =>
        h === "SELL VALUE"
          ? total
          : h === "BATCH NO"
            ? `Total Sell (${ccy})`
            : "",
      ),
    );
    headers.forEach((_, c) => setStyle(rowIdx, c, totalRowStyle));
    rowIdx++;
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const dateCols = [
    headers.indexOf("MFG DATE"),
    headers.indexOf("EXPIRY DATE"),
  ];
  const range = XLSX.utils.decode_range(worksheet["!ref"]!);
  for (let row = 1; row <= range.e.r; row++) {
    dateCols.forEach((col) => {
      const ref = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[ref];
      if (cell && cell.v instanceof Date) {
        cell.t = "d";
        cell.z = "dd mmm yyyy";
      }
    });
  }

  worksheet["!cols"] = headers.map((h) =>
    h === "ITEM NAME"
      ? { wch: 32 }
      : h.includes("VALUE")
        ? { wch: 16 }
        : { wch: 16 },
  );
  worksheet["!rows"] = aoa.map((_, i) => ({ hpx: i === 0 ? 24 : 20 }));

  Object.entries(cellStyles).forEach(([addr, style]) => {
    if (worksheet[addr]) worksheet[addr].s = style;
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Details");
  XLSX.writeFile(
    workbook,
    `Batch-Details-${fileLabel}-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
};

// ─── Hook ───────────────────────────────────────────────────────────────────

export interface UseBatchDetailsTableProps {
  batches: Batch[];
  itemCode?: string;
  itemName?: string;
  /** Show Item Code / Item Name columns — useful when rendering batches across multiple items. */
  showItemColumns?: boolean;
  isLoading?: boolean;
  onEdit?: (batch: BatchRow) => void;
  onDelete?: (batch: BatchRow) => void;
  onLedger?: (batch: BatchRow) => void;
}

const columnHelper = createColumnHelper<BatchRow>();

export function useBatchDetailsTable({
  batches,
  itemCode,
  itemName,
  showItemColumns = false,
  isLoading = false,
  onEdit,
  onDelete,
  onLedger,
}: UseBatchDetailsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [hideZeroStock, setHideZeroStock] = useState(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [viewBatch, setViewBatch] = useState<BatchRow | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Enrich raw batches with computed, stable, sortable fields.
  const enrichedBatches = useMemo<BatchRow[]>(
    () =>
      (batches || []).map((b, idx) => ({
        ...b,
        id: `${itemCode ?? "item"}-${b.batch_no ?? idx}-${idx}`,
        srNo: idx + 1,
        itemCode,
        itemName,
        status: getBatchStatus(b),
      })),
    [batches, itemCode, itemName],
  );

  const kpis = useMemo<BatchKpis>(() => {
    const result: BatchKpis = {
      totalBatches: enrichedBatches.length,
      totalQty: 0,
      buyTotals: {},
      sellTotals: {},
      expiredCount: 0,
      nearExpiryCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };
    enrichedBatches.forEach((b) => {
      result.totalQty += Number(b.bal_qty || 0);
      const buyCcy = b.buy_currency || "—";
      const sellCcy = b.sell_currency || "—";
      result.buyTotals[buyCcy] =
        (result.buyTotals[buyCcy] || 0) + Number(b.buy_value || 0);
      result.sellTotals[sellCcy] =
        (result.sellTotals[sellCcy] || 0) + Number(b.sell_value || 0);
      if (b.status === "Expired") result.expiredCount++;
      if (b.status === "Near Expiry") result.nearExpiryCount++;
      if (b.status === "Low Stock") result.lowStockCount++;
      if (b.status === "Out of Stock") result.outOfStockCount++;
    });
    return result;
  }, [enrichedBatches]);

  const filteredData = useMemo(
    () =>
      hideZeroStock
        ? enrichedBatches.filter((b) => Number(b.bal_qty || 0) !== 0)
        : enrichedBatches,
    [enrichedBatches, hideZeroStock],
  );

  const columns = useMemo<ColumnDef<BatchRow, any>[]>(() => {
    const cols: ColumnDef<BatchRow, any>[] = [
      columnHelper.accessor("srNo", {
        header: "#",
        cell: (info) => (
          <span className="text-[10px] font-semibold tabular-nums opacity-40">
            {String(info.getValue()).padStart(2, "0")}
          </span>
        ),
        enableSorting: false,
        meta: { align: "center" },
      }),
    ];

    if (showItemColumns) {
      cols.push(
        columnHelper.accessor("itemCode", {
          header: "Item Code",
          cell: (info) => info.getValue() || "—",
        }),
        columnHelper.accessor("itemName", {
          header: "Item Name",
          cell: (info) => info.getValue() || "—",
        }),
      );
    }

    cols.push(
      columnHelper.accessor("batch_no", {
        header: "Batch No",
        cell: (info) => info.getValue() || "—",
      }),
      columnHelper.accessor("warehouse", {
        header: "Warehouse",
        cell: (info) => (
          <span className="text-xs">{info.getValue() || "—"}</span>
        ),
      }),

      columnHelper.accessor("manufacturing_date", {
        header: "Mfg Date",
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor("expiry_date", {
        header: "Expiry Date",
        cell: (info) => {
          const urgency = getExpiryUrgency(info.getValue());
          const style = EXPIRY_URGENCY_STYLE[urgency];
          const label = formatDate(info.getValue());
          if (!style) return label;
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black"
              style={{
                background: style.bg,
                color: style.text,
                border: `1px solid ${style.border}`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: style.dot }}
              />
              {label}
            </span>
          );
        },
      }),
      columnHelper.accessor("bal_qty", {
        header: "Bal Qty",
        cell: (info) => formatNumber(info.getValue()),
        meta: { align: "right" },
      }),
      columnHelper.accessor("in_qty", {
        header: "In Qty",
        cell: (info) => formatNumber(info.getValue(), 4),
        meta: { align: "right" },
      }),
      columnHelper.accessor("out_qty", {
        header: "Out Qty",
        cell: (info) => formatNumber(info.getValue(), 4),
        meta: { align: "right" },
      }),
      columnHelper.accessor("buy_price_latest", {
        header: "Buy Price (Latest)",
        cell: (info) =>
          formatCurrencyValue(info.row.original.buy_currency, info.getValue()),
        meta: { align: "right" },
      }),
      columnHelper.accessor("buy_price_avg", {
  header: "Buy Price (Avg)",
  cell: (info) =>
    formatCurrencyValue(
      info.row.original.buy_currency,
      info.getValue()
    ),
  meta: { align: "right" },
}),
      columnHelper.accessor("buy_value", {
        header: "Buy Value",
        cell: (info) =>
          formatCurrencyValue(info.row.original.buy_currency, info.getValue()),
        meta: { align: "right" },
      }),

      columnHelper.accessor("sell_price_latest", {
        header: "Sell Price (Latest)",
        cell: (info) =>
          formatCurrencyValue(info.row.original.sell_currency, info.getValue()),
        meta: { align: "right" },
      }),
      columnHelper.accessor("sell_price_avg", {
  header: "Sell Price (Avg)",
  cell: (info) =>
    formatCurrencyValue(
      info.row.original.sell_currency,
      info.getValue()
    ),
  meta: { align: "right" },
}),
      columnHelper.accessor("sell_value", {
        header: "Sell Value",
        cell: (info) =>
          formatCurrencyValue(info.row.original.sell_currency, info.getValue()),
        meta: { align: "right" },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        meta: { align: "center" },
      }),
    );

    return cols;
  }, [showItemColumns]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue) => {
      const needle = String(filterValue).toLowerCase();
      const b = row.original;
      return [b.batch_no, b.itemCode, b.itemName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const hasActiveFilters = hideZeroStock || globalFilter !== "";

  const clearFilters = useCallback(() => {
    setHideZeroStock(false);
    setGlobalFilter("");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleHideZeroStockChange = useCallback((value: boolean) => {
    setHideZeroStock(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setGlobalFilter(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleExportExcel = useCallback(async () => {
    if (!filteredData.length) return;
    try {
      setIsExporting(true);
      exportBatchesToExcel(
        filteredData,
        showItemColumns,
        itemCode || itemName || "Report",
      );
    } finally {
      setIsExporting(false);
    }
  }, [filteredData, showItemColumns, itemCode, itemName]);

  return {
    table,
    kpis,
    isLoading,
    isEmpty: enrichedBatches.length === 0,
    isFilteredEmpty: filteredData.length === 0,
    searchTerm: globalFilter,
    onSearchChange: handleSearchChange,
    hideZeroStock,
    onHideZeroStockChange: handleHideZeroStockChange,
    hasActiveFilters,
    clearFilters,
    isExporting,
    handleExportExcel,
    viewBatch,
    setViewBatch,
    onEdit,
    onDelete,
    onLedger,
  };
}
