import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import { getStockLedger } from "../../api/stockApi";

export interface StockLedgerRow {
  date: string;
  item_code: string;
  item_name: string;
  warehouse: string;
  in_qty: number;
  out_qty: number;
  qty_after_transaction: number;
  incoming_rate: number;
  valuation_rate: number;
  in_out_rate?: number;
  stock_value: number;
  stock_value_difference: number;
  voucher_type: string;
  voucher_no: string;
  batch_no?: string | null;
  serial_no?: string | null;
  [key: string]: any;
}

export interface StockLedgerColumn {
  label: string;
  fieldname: string;
  fieldtype?: string;
  hidden?: boolean | number;
  width?: number;
}

interface StockLedgerResponse {
  result: StockLedgerRow[];
  columns: StockLedgerColumn[];
}

export const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export const today = () => new Date().toISOString().split("T")[0];
export const startOfYear = () => `${new Date().getFullYear()}-01-01`;

export type ValuationFieldType = "Currency" | "Float";

export interface StockLedgerFiltersState {
  dateRange: { from_date?: string; to_date?: string };
  warehouse: string;
  item: string;
  itemGroup: string;
  batch: string;
  brand: string;
  voucherNo: string;
  project: string;
  includeUom: string;
  valuationFieldType: ValuationFieldType;
  includeSerialBatchBundle: boolean;
}

type AppliedFilters = {
  fromDate: string;
  toDate: string;
  warehouse: string;
  item: string;
  itemGroup: string;
  batch: string;
  brand: string;
  voucherNo: string;
  project: string;
  includeUom: string;
  valuationFieldType: ValuationFieldType;
  includeSerialBatchBundle: boolean;
};

interface UseStockLedgerArgs {
  itemCode?: string;
  batchNo?: string;
}

const PAGE_SIZE = 20;

export function useStockLedger({ itemCode, batchNo }: UseStockLedgerArgs) {
  // ── Filter form state ────────────────────────────────────────────────
  const [filters, setFilters] = useState<StockLedgerFiltersState>({
    dateRange: { from_date: startOfYear(), to_date: today() },
    warehouse: "",
    item: itemCode ?? "",
    itemGroup: "",
    batch: batchNo ?? "",
    brand: "",
    voucherNo: "",
    project: "",
    includeUom: "",
    valuationFieldType: "Currency",
    includeSerialBatchBundle: true,
  });

  const updateFilter = useCallback(
    <K extends keyof StockLedgerFiltersState>(
      key: K,
      value: StockLedgerFiltersState[K],
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const [ledgerData, setLedgerData] = useState<StockLedgerResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  // True only until the very first fetch completes. Kept separate from
  // `loading` so the table can show a full-height spinner on first load,
  // but a lightweight overlay (existing rows still visible) on every
  // subsequent "Apply" refetch — avoids the table blanking/flashing empty
  // each time the user re-applies filters.
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = PAGE_SIZE;

  const fetchLedger = useCallback(async (f: AppliedFilters) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await getStockLedger({
        from_date: f.fromDate,
        to_date: f.toDate,
        item_code: f.item ? [f.item] : [],
        batch_no: f.batch || undefined,
        warehouse: f.warehouse ? [f.warehouse] : [],
        valuation_field_type: f.valuationFieldType,
        include_serial_batch_bundle: f.includeSerialBatchBundle ? 1 : 0,
      });
      setLedgerData(resp?.message ?? null);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch stock ledger.");
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  // Re-fetch (and reset the form) whenever the caller hands us a new
  // item/batch to focus on — e.g. drilling in from a different screen.
  useEffect(() => {
    const initial: AppliedFilters = {
      fromDate: startOfYear(),
      toDate: today(),
      warehouse: "",
      item: itemCode ?? "",
      itemGroup: "",
      batch: batchNo ?? "",
      brand: "",
      voucherNo: "",
      project: "",
      includeUom: "",
      valuationFieldType: "Currency",
      includeSerialBatchBundle: true,
    };
    setFilters((prev) => ({
      ...prev,
      dateRange: { from_date: initial.fromDate, to_date: initial.toDate },
      item: initial.item,
      batch: initial.batch,
    }));
    fetchLedger(initial);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCode, batchNo]);

  const handleApply = useCallback(() => {
    const f: AppliedFilters = {
      fromDate: filters.dateRange.from_date ?? startOfYear(),
      toDate: filters.dateRange.to_date ?? today(),
      warehouse: filters.warehouse,
      item: filters.item,
      itemGroup: filters.itemGroup,
      batch: filters.batch,
      brand: filters.brand,
      voucherNo: filters.voucherNo,
      project: filters.project,
      includeUom: filters.includeUom,
      valuationFieldType: filters.valuationFieldType,
      includeSerialBatchBundle: filters.includeSerialBatchBundle,
    };
    setPage(1);
    fetchLedger(f);
  }, [filters, fetchLedger]);

  const rows = ledgerData?.result ?? [];

  // Stable-reference paged slice — without this useMemo, `data` passed to
  // useReactTable gets a brand-new array every render, which makes
  // TanStack Table recompute internal state -> re-render -> new array
  // again -> infinite loop.
  const pagedRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );

  const kpiValues = useMemo(() => {
    const totalIn = rows.reduce((s, r) => s + Number(r.in_qty || 0), 0);
    const totalOut = rows.reduce((s, r) => s + Number(r.out_qty || 0), 0);
    const closingQty = rows.length
      ? Number(rows[rows.length - 1].qty_after_transaction || 0)
      : 0;
    const closingValue = rows.length
      ? Number(rows[rows.length - 1].stock_value || 0)
      : 0;
    const netValueChange = rows.reduce(
      (s, r) => s + Number(r.stock_value_difference || 0),
      0,
    );
    return { totalIn, totalOut, closingQty, closingValue, netValueChange };
  }, [rows]);

  const columns = useMemo<ColumnDef<StockLedgerRow>[]>(() => {
    if (!ledgerData?.columns) return [];
    return ledgerData.columns
      .filter((c) => !c.hidden)
      .map((col): ColumnDef<StockLedgerRow> => {
        const isCurrency = col.fieldtype === "Currency";
        const isFloat = col.fieldtype === "Float";
        const isDate = col.fieldtype === "Datetime" || col.fieldtype === "Date";
        const isAmount = isCurrency || isFloat;

        return {
          id: col.fieldname,
          accessorKey: col.fieldname,
          header: col.label,
          size: col.width ?? (isAmount ? 120 : 150),
          meta: { align: isAmount ? "right" : "left" },
          cell: ({ getValue }) => {
            const val = getValue();

            if (isCurrency) {
              const n = Number(val ?? 0);
              if (n === 0) return <span className="text-muted text-xs">—</span>;
              return (
                <span className="text-xs font-medium tabular-nums text-main">
                  {fmt(n)}
                </span>
              );
            }

            if (isFloat) {
              const n = Number(val ?? 0);
              if (n === 0) return <span className="text-muted text-xs">—</span>;
              const isQtyField =
                col.fieldname === "in_qty" || col.fieldname === "out_qty";
              return (
                <span
                  className={`text-xs font-medium tabular-nums ${
                    isQtyField
                      ? n > 0
                        ? "text-emerald-600"
                        : "text-red-500"
                      : "text-main"
                  }`}
                >
                  {fmt(n)}
                </span>
              );
            }

            if (isDate && val) {
              return (
                <span className="text-xs text-main tabular-nums">
                  {new Date(String(val)).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              );
            }

            if (col.fieldname === "voucher_no" && val)
              return (
                <span className="text-xs font-semibold text-primary">
                  {String(val)}
                </span>
              );

            if (!val && val !== 0)
              return <span className="text-muted text-xs">—</span>;

            return <span className="text-xs text-main">{String(val)}</span>;
          },
        };
      });
  }, [ledgerData?.columns]);

  const table = useReactTable({
    data: pagedRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  return {
    filters,
    updateFilter,
    handleApply,
    loading,
    isInitialLoad,
    error,
    rows,
    kpiValues,
    columns,
    table,
    leafColumns: table.getAllLeafColumns(),
    page,
    setPage,
    pageSize,
    totalPages,
  };
}
