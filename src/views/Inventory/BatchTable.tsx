import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { flexRender } from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreVertical,
  Eye,
  ClipboardEdit,
  BookOpen,
  Trash2,
  Package2,
  X,
  AlertTriangle,
  Layers,
} from "lucide-react";
import BatchTableFilters from "./../../utils/Batchtablefilters";
import {
  useBatchDetailsTable,
  BATCH_STATUS_CONFIG,
  formatDate,
  formatNumber,
  formatCurrencyValue,
  type Batch,
  type BatchRow,
} from "./../../hooks/TablesHooks/Usebatchdetailstable";

// ─── Section theme (distinct from parent items table) ──────────────────────

const BATCH_SECTION_THEME = {
  accent: "#2563eb",
  accentSoft: "rgba(37,99,235,0.08)",
  wrapperBg: "#fdf7ef",
  headerBg: "#fdf1e2",
  totalRowBg: "#fbeadb",
  totalLabel: "#c97d2e",
};

// Total-row numbers shouldn't force trailing zeros (26,89,991.1 not 26,89,991.10)
const formatTotalNumber = (n?: number) =>
  Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// ─── Status badge (still used in the detail modal) ─────────────────────────

const StatusBadge: React.FC<{ status: BatchRow["status"] }> = ({ status }) => {
  const c = BATCH_STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: c.dot }}
      />
      {c.label}
    </span>
  );
};

// ─── Row action menu (portal) ───────────────────────────────────────────────

const RowActionMenu: React.FC<{
  batch: BatchRow;
  // onView: () => void;
  onEdit?: (b: BatchRow) => void;
  onDelete?: (b: BatchRow) => void;
  onLedger?: (b: BatchRow) => void;
}> = ({ batch, onEdit, onDelete, onLedger }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const top =
      window.innerHeight - r.bottom < 200 ? r.top - 200 : r.bottom + 4;
    setPos({ top, left: r.right - 180 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest(".batch-row-menu")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = [
    // { icon: Eye, label: "View Details", color: "#2563eb", action: onView },
    onEdit && {
      icon: ClipboardEdit,
      label: "Stock Correction",
      color: "#c97d2e",
      action: () => onEdit(batch),
    },
    onLedger && {
      icon: BookOpen,
      label: "View Stock Correction",
      color: "#0891b2",
      action: () => onLedger(batch),
    },
    onDelete && {
      icon: Trash2,
      label: "Delete Batch",
      color: "#ef4444",
      danger: true,
      action: () => onDelete(batch),
    },
  ].filter(Boolean) as {
    icon: React.ElementType;
    label: string;
    color: string;
    danger?: boolean;
    action: () => void;
  }[];

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className="w-7 h-7 rounded-md border flex items-center justify-center transition-all"
        style={{
          borderColor: open ? "rgba(201,125,46,0.35)" : "rgba(0,0,0,0.1)",
          background: open ? "rgba(201,125,46,0.09)" : "transparent",
          color: "#999",
        }}
      >
        <MoreVertical size={13} />
      </button>
      {open &&
        ReactDOM.createPortal(
          <div
            className="batch-row-menu"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              zIndex: 99999,
              minWidth: 180,
              background: "var(--card,#fff)",
              border: "1px solid var(--border,#e8e0d5)",
              borderRadius: 10,
              boxShadow: "0 8px 28px rgba(0,0,0,0.16)",
              padding: "4px 0",
            }}
          >
            {items.map((item, i) => (
              <React.Fragment key={item.label}>
                {item.danger && i > 0 && (
                  <div
                    style={{
                      height: 1,
                      background: "rgba(0,0,0,0.06)",
                      margin: "3px 0",
                    }}
                  />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    item.action();
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-[11px] font-semibold text-left transition-colors"
                  style={{ color: item.color }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = item.danger
                      ? "rgba(239,68,68,0.06)"
                      : "rgba(201,125,46,0.06)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <item.icon
                    size={12}
                    strokeWidth={2}
                    style={{ color: item.color }}
                  />
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};

// ─── Detail modal ───────────────────────────────────────────────────────────

const BatchDetailModal: React.FC<{
  batch: BatchRow | null;
  onClose: () => void;
}> = ({ batch, onClose }) => {
  useEffect(() => {
    if (!batch) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [batch, onClose]);

  if (!batch) return null;
  const c = BATCH_STATUS_CONFIG[batch.status];

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] last:border-b-0">
      <span className="text-[11px] text-muted font-medium">{label}</span>
      <span className="text-xs font-semibold text-main">{value}</span>
    </div>
  );

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-[420px] max-h-[86vh] bg-card rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 bg-app border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers size={16} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-main">
                  Batch Details
                </span>
                <StatusBadge status={batch.status} />
              </div>
              <p className="text-[11px] text-muted font-mono mt-0.5">
                {batch.itemName ? `${batch.itemName} · ` : ""}
                {batch.batch_no || "—"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-muted hover:text-main transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <p className="px-4 pt-2 pb-1 text-[9px] font-black uppercase tracking-widest text-muted/70">
            Identification
          </p>
          <div className="mx-3 bg-app rounded-xl border border-[var(--border)] overflow-hidden">
            <Row label="Batch No" value={batch.batch_no || "—"} />
            {batch.itemCode && <Row label="Item Code" value={batch.itemCode} />}
            {batch.itemName && <Row label="Item Name" value={batch.itemName} />}
          </div>

          <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-muted/70">
            Dates
          </p>
          <div className="mx-3 bg-app rounded-xl border border-[var(--border)] overflow-hidden">
            <Row
              label="Mfg Date"
              value={formatDate(batch.manufacturing_date)}
            />
            <Row label="Expiry Date" value={formatDate(batch.expiry_date)} />
          </div>

          <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-muted/70">
            Stock Movement
          </p>
          <div className="mx-3 bg-app rounded-xl border border-[var(--border)] overflow-hidden">
            <Row label="Balance Qty" value={formatNumber(batch.bal_qty)} />
            <Row label="In Qty" value={`+${formatNumber(batch.in_qty, 4)}`} />
            <Row label="Out Qty" value={`-${formatNumber(batch.out_qty, 4)}`} />
          </div>

          <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-muted/70">
            Valuation
          </p>
          <div className="mx-3 mb-2 bg-app rounded-xl border border-[var(--border)] overflow-hidden">
            <Row
              label="Buy Value"
              value={formatCurrencyValue(batch.buy_currency, batch.buy_value)}
            />
            <Row
              label="Sell Value"
              value={formatCurrencyValue(batch.sell_currency, batch.sell_value)}
            />
          </div>
        </div>

        <div className="px-4 py-3 bg-app border-t border-[var(--border)] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-bold shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ─── KPI strip ──────────────────────────────────────────────────────────────

const KpiStrip: React.FC<{
  kpis: ReturnType<typeof useBatchDetailsTable>["kpis"];
}> = ({ kpis }) => {
  const buyEntries = Object.entries(kpis.buyTotals);
  const sellEntries = Object.entries(kpis.sellTotals);

  const items = [
    {
      label: "Batches",
      value: String(kpis.totalBatches),
      color: "text-primary",
    },
    {
      label: "Total Qty",
      value: formatNumber(kpis.totalQty),
      color: "text-main",
    },
    {
      label: "Buy Value",
      value: buyEntries.length
        ? formatCurrencyValue(buyEntries[0][0], buyEntries[0][1])
        : "—",
      color: "text-blue-500",
    },
    {
      label: "Sell Value",
      value: sellEntries.length
        ? formatCurrencyValue(sellEntries[0][0], sellEntries[0][1])
        : "—",
      color: "text-emerald-600",
    },
    {
      label: "Near Expiry",
      value: String(kpis.nearExpiryCount),
      color: "text-orange-500",
    },
    {
      label: "Expired",
      value: String(kpis.expiredCount),
      color: "text-red-500",
    },
    {
      label: "Out of Stock",
      value: String(kpis.outOfStockCount),
      color: "text-gray-500",
    },
  ];

  return (
    <div className="bg-card border border-[var(--border)] rounded-lg px-3 py-2.5 flex flex-wrap gap-x-6 gap-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5 min-w-[70px]">
          <span className="text-[9px] leading-tight text-muted">
            {item.label}
          </span>
          <span
            className={`text-[12px] font-extrabold tabular-nums leading-tight ${item.color}`}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────

export interface BatchDetailsTableProps {
  batches: Batch[];
  itemCode?: string;
  itemName?: string;
  showItemColumns?: boolean;
  isLoading?: boolean;
  onEdit?: (batch: BatchRow) => void;
  onDelete?: (batch: BatchRow) => void;
  onLedger?: (batch: BatchRow) => void;
}

// Column ids that should wrap instead of forcing horizontal overflow.
// Adjust these to match your actual column ids/accessorKeys if they differ.
const WRAP_COLUMN_IDS = ["itemName", "description"];

const BatchDetailsTable: React.FC<BatchDetailsTableProps> = (props) => {
  const {
    table,
    kpis,
    isLoading,
    isEmpty,
    isFilteredEmpty,
    searchTerm,
    onSearchChange,
    hideZeroStock,
    onHideZeroStockChange,
    clearFilters,
    isExporting,
    handleExportExcel,
    viewBatch,
    setViewBatch,
    onEdit,
    onDelete,
    onLedger,
  } = useBatchDetailsTable(props);

  const totalRows = table.getFilteredRowModel().rows.length;
  const totalBuyValue = Object.values(kpis.buyTotals).reduce(
    (sum, v) => sum + v,
    0,
  );
  const totalSellValue = Object.values(kpis.sellTotals).reduce(
    (sum, v) => sum + v,
    0,
  );
  const totalInQty = table
    .getFilteredRowModel()
    .rows.reduce((sum, r) => sum + Number(r.original.in_qty || 0), 0);
  const totalOutQty = table
    .getFilteredRowModel()
    .rows.reduce((sum, r) => sum + Number(r.original.out_qty || 0), 0);

  return (
    <div
      className="w-full flex flex-col gap-2.5 py-3"
      style={{
        background: BATCH_SECTION_THEME.wrapperBg,
        borderLeft: `3px solid ${BATCH_SECTION_THEME.accent}`,
      }}
    >
      {/* Section header bar — visually separates this block from the parent items table */}
      <div className="flex items-center gap-2 px-4">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: BATCH_SECTION_THEME.accentSoft }}
        >
          <Layers size={13} style={{ color: BATCH_SECTION_THEME.accent }} />
        </div>
        <span
          className="text-[11px] font-black uppercase tracking-widest"
          style={{ color: BATCH_SECTION_THEME.accent }}
        >
          Batch Details
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            background: BATCH_SECTION_THEME.accentSoft,
            color: BATCH_SECTION_THEME.accent,
          }}
        >
          {totalRows} {totalRows === 1 ? "batch" : "batches"}
        </span>
      </div>

      {/* <KpiStrip kpis={kpis} /> */}

      <div className="px-4">
        <BatchTableFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          hideZeroStock={hideZeroStock}
          onHideZeroStockChange={onHideZeroStockChange}
          onExport={handleExportExcel}
          isExporting={isExporting}
          exportDisabled={isEmpty}
        />
      </div>

      <div className="mx-4 bg-card border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto relative custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead
              className="border-b border-[var(--border)]"
              style={{ background: BATCH_SECTION_THEME.headerBg }}
            >
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
                        className={`px-3.5 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted whitespace-nowrap ${alignCls} ${
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
                              <ChevronUp size={10} />
                            ) : sortDir === "desc" ? (
                              <ChevronDown size={10} />
                            ) : (
                              <ChevronsUpDown
                                size={10}
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    {table.getAllLeafColumns().map((col) => (
                      <td key={col.id} className="px-3.5 py-3">
                        <div className="h-3 w-full max-w-[90px] bg-[var(--border)] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isEmpty ? (
                <tr>
                  <td
                    colSpan={table.getAllLeafColumns().length}
                    className="py-14 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted">
                      <Package2 size={22} className="opacity-30" />
                      <span className="text-xs">No batch data available.</span>
                    </div>
                  </td>
                </tr>
              ) : isFilteredEmpty ? (
                <tr>
                  <td
                    colSpan={table.getAllLeafColumns().length}
                    className="py-14 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted">
                      <AlertTriangle size={20} className="opacity-30" />
                      <span className="text-xs">
                        No batches match your filters.
                      </span>
                      <button
                        onClick={clearFilters}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getSortedRowModel().rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="hover:bg-row-hover transition-colors"
                    style={{
                      borderBottom: "1px solid rgba(128,128,128,0.1)",
                      background:
                        idx % 2 === 1
                          ? BATCH_SECTION_THEME.wrapperBg
                          : "var(--card, #fff)",
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const align = (cell.column.columnDef.meta as any)?.align;
                      const alignCls =
                        align === "right"
                          ? "text-right"
                          : align === "center"
                            ? "text-center"
                            : "text-left";

                      if (cell.column.id === "actions") {
                        return (
                          <td
                            key={cell.id}
                            className={`px-3.5 py-2 ${alignCls}`}
                          >
                            <div className="flex items-center justify-center">
                              <RowActionMenu
                                batch={row.original}
                                // onView={() => setViewBatch(row.original)}
                                onEdit={onEdit}
                                // onDelete={onDelete}
                                onLedger={onLedger}
                              />
                            </div>
                          </td>
                        );
                      }

                      const isWrapCol = WRAP_COLUMN_IDS.includes(
                        cell.column.id,
                      );

                      return (
                        <td
                          key={cell.id}
                          className={`px-3.5 py-2 text-xs ${alignCls} ${
                            isWrapCol
                              ? "whitespace-normal break-words max-w-[320px]"
                              : "whitespace-nowrap"
                          }`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
            {!isEmpty && !isFilteredEmpty && (
              <tfoot>
                <tr
                  style={{
                    background: BATCH_SECTION_THEME.totalRowBg,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  {table.getAllLeafColumns().map((col) => {
                    const align = (col.columnDef.meta as any)?.align;
                    const alignCls =
                      align === "right"
                        ? "text-right"
                        : align === "center"
                          ? "text-center"
                          : "text-left";

                    let content: React.ReactNode = null;
                    if (col.id === "batch_no") {
                      content = (
                        <span
                          className="text-[11px] font-black uppercase tracking-wider"
                          style={{ color: BATCH_SECTION_THEME.totalLabel }}
                        >
                          Total
                        </span>
                      );
                    } else if (col.id === "bal_qty") {
                      content = (
                        <span className="text-xs font-extrabold text-main">
                          {formatTotalNumber(kpis.totalQty)}
                        </span>
                      );
                    } else if (col.id === "in_qty") {
                      content = (
                        <span
                          className="text-xs font-extrabold"
                          style={{ color: "#059669" }}
                        >
                          +{formatNumber(totalInQty, 4)}
                        </span>
                      );
                    } else if (col.id === "out_qty") {
                      content = (
                        <span
                          className="text-xs font-extrabold"
                          style={{ color: "#dc2626" }}
                        >
                          -{formatNumber(totalOutQty, 4)}
                        </span>
                      );
                    } else if (col.id === "buy_value") {
                      content = (
                        <span className="text-xs font-extrabold text-main">
                          {formatTotalNumber(totalBuyValue)}
                        </span>
                      );
                    } else if (col.id === "sell_value") {
                      content = (
                        <span
                          className="text-xs font-extrabold"
                          style={{ color: BATCH_SECTION_THEME.accent }}
                        >
                          {formatTotalNumber(totalSellValue)}
                        </span>
                      );
                    }

                    return (
                      <td
                        key={col.id}
                        className={`px-3.5 py-2.5 text-xs ${alignCls}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {!isEmpty && (
          <div className="border-t border-[var(--border)] bg-card px-3 py-2 flex items-center justify-between gap-2 text-xs text-muted">
            <span className="text-[11px]">
              {totalRows > 0 ? (
                <>
                  <span className="font-semibold text-main">{totalRows}</span>{" "}
                  {totalRows === 1 ? "batch" : "batches"} total
                </>
              ) : (
                "No entries"
              )}
            </span>
          </div>
        )}
      </div>

      <BatchDetailModal batch={viewBatch} onClose={() => setViewBatch(null)} />
    </div>
  );
};

export default BatchDetailsTable;