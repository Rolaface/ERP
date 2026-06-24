import { useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
} from "lucide-react";

import ModalTable from "../../components/ui/Table/ModalTableInside";
import type { Supplier } from "../../types/Supply/supplier";

interface SupplierStatementResponse {
  openingBalance: number;
  summary: {
    totalBilled: number;
    totalPaid: number;
    netOutstanding: number;
  };
  aging: {
    current: number;
    "1_30": number;
    "31_60": number;
    "61_90": number;
    "90_plus": number;
  };
  ledger: LedgerEntry[];
  // ← server pagination block mapped from API response.data.pagination
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

interface LedgerEntry {
  date: string;
  type: string;
  ref: string;
  debit: number;
  credit: number;
  balance: number;
  note?: string;
}

interface Props {
  supplier: Supplier;
  statement: SupplierStatementResponse;
  // ── These MUST come from the parent (SupplierDetailView) ──
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onMakePayment?: (entry: LedgerEntry) => void;
  onViewEntry?: (entry: LedgerEntry) => void;
}

const fmt = (n: number) => Math.abs(n || 0).toLocaleString("en-IN");

const formatDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const exportToCsv = (rows: LedgerEntry[], filename: string) => {
  const headers = [
    "Date",
    "Type",
    "Ref",
    "Debit",
    "Credit",
    "Balance",
    "Notes",
  ];
  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.date,
        `"${r.type}"`,
        `"${r.ref}"`,
        r.debit || 0,
        r.credit || 0,
        r.balance,
        `"${r.note ?? ""}"`,
      ].join(","),
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// NOTE: no internal page/pageSize useState — all pagination is controlled by parent
const SupplierStatement = ({
  statement,
  supplier,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) => {
  // `ledger` is the current page slice returned by the server
  const ledger = statement?.ledger ?? [];

  // Always use server metadata for totals — never ledger.length
  const serverPagination = statement?.pagination;
  const totalItems = serverPagination?.total ?? ledger.length;
  const totalPages =
    serverPagination?.total_pages ?? (Math.ceil(totalItems / pageSize) || 1);

  const summary = {
    totalPurchases: statement?.summary?.totalBilled ?? 0,
    totalPaid: statement?.summary?.totalPaid ?? 0,
    outstanding: statement?.summary?.netOutstanding ?? 0,
  };

  const aging = statement?.aging ?? {
    current: 0,
    "1_30": 0,
    "31_60": 0,
    "61_90": 0,
    "90_plus": 0,
  };

  // Page-level debit/credit totals (only current page rows available)
  const totalDebit = useMemo(
    () => ledger.reduce((s, r) => s + (r.debit || 0), 0),
    [ledger],
  );
  const totalCredit = useMemo(
    () => ledger.reduce((s, r) => s + (r.credit || 0), 0),
    [ledger],
  );

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (row: LedgerEntry) => (
        <span className="text-[10px] font-black text-muted uppercase tracking-widest">
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      key: "type",
      header: "Transaction",
      render: (row: LedgerEntry) => (
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${
              row.debit > 0
                ? "bg-warning/10 text-warning"
                : row.credit > 0
                  ? "bg-success/10 text-success"
                  : "bg-row-hover text-muted"
            }`}
          >
            {row.debit > 0 ? (
              <ArrowUpRight size={14} />
            ) : row.credit > 0 ? (
              <ArrowDownLeft size={14} />
            ) : (
              <FileText size={14} />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-main">{row.type}</p>
            <p className="text-[9px] font-mono text-muted uppercase">
              {row.ref}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "debit",
      header: "Debit",
      align: "right" as const,
      render: (row: LedgerEntry) =>
        row.debit > 0 ? (
          <span className="text-xs font-bold text-warning">
            {fmt(row.debit)}
          </span>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
    {
      key: "credit",
      header: "Credit",
      align: "right" as const,
      render: (row: LedgerEntry) =>
        row.credit > 0 ? (
          <span className="text-xs font-bold text-success">
            {fmt(row.credit)}
          </span>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right" as const,
      render: (row: LedgerEntry) => {
        const isNeg = row.balance < 0;
        return (
          <span
            className={`text-sm font-black tabular-nums ${
              row.balance === 0
                ? "text-muted"
                : isNeg
                  ? "text-danger"
                  : "text-primary"
            }`}
          >
            {isNeg ? "−" : ""}
            {fmt(row.balance)}
          </span>
        );
      },
    },
    {
      key: "note",
      header: "Notes",
      render: (row: LedgerEntry) =>
        row.note && row.note !== "No Remarks" ? (
          <span className="text-xs text-muted italic">{row.note}</span>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-4 p-4 sm:p-5 h-[calc(95vh-160px)]">
      {/* ── SUMMARY + AGING ── */}
      <div className="bg-card border border-theme rounded-2xl flex items-stretch overflow-x-auto divide-x divide-theme shrink-0">
        <StatCell
          label="Total Purchases"
          icon={<TrendingUp size={12} className="text-warning" />}
          value={summary.totalPurchases}
          valueClass="text-warning"
        />
        <StatCell
          label="Total Paid"
          icon={<TrendingDown size={12} className="text-success" />}
          value={summary.totalPaid}
          valueClass="text-success"
        />
        <StatCell
          label="Outstanding"
          icon={
            <Minus
              size={12}
              className={summary.outstanding > 0 ? "text-danger" : "text-muted"}
            />
          }
          value={summary.outstanding}
          valueClass={summary.outstanding > 0 ? "text-danger" : "text-muted"}
          highlight={summary.outstanding > 0}
        />
        <div className="flex flex-1 items-stretch min-w-0">
          <div className="flex items-center justify-center px-2 border-r border-theme shrink-0">
            <span
              className="text-[8px] font-black uppercase tracking-[0.2em] text-muted select-none"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              Aging
            </span>
          </div>
          <div className="flex flex-1 divide-x divide-theme">
            <AgingCell label="Current" value={aging.current} active />
            <AgingCell label="1 – 30" value={aging["1_30"]} />
            <AgingCell label="31 – 60" value={aging["31_60"]} />
            <AgingCell label="61 – 90" value={aging["61_90"]} />
            <AgingCell label="90 +" value={aging["90_plus"]} warn />
          </div>
        </div>
      </div>

      {/* ── LEDGER TABLE ── */}
      <div className="bg-card border border-theme rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-theme flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={13} className="text-primary" />
            <span className="text-[11px] font-black uppercase tracking-widest text-main">
              Ledger Entries
            </span>
            {/* Show server total, not ledger.length */}
            <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
              {totalItems}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="font-bold text-muted uppercase tracking-widest text-[9px]">
              Page Debits
            </span>
            <span className="font-black text-warning tabular-nums">
              {fmt(totalDebit)}
            </span>
            <div className="w-px h-3 bg-border" />
            <span className="font-bold text-muted uppercase tracking-widest text-[9px]">
              Page Credits
            </span>
            <span className="font-black text-success tabular-nums">
              {fmt(totalCredit)}
            </span>
            <div className="w-px h-3 bg-border" />
            <button
              onClick={() =>
                exportToCsv(
                  ledger,
                  `Supplier_Statement_${(supplier as any)?.name ?? (supplier as any)?.supplierName ?? "export"}.csv`,
                )
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-theme hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-900/20 text-main transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* ModalTable — pagination fully driven by server metadata */}
        <ModalTable
          columns={columns}
          data={ledger}
          showToolbar={false}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={(size) => {
            onPageSizeChange(size);
            onPageChange(1);
          }}
          pageSizeOptions={[20, 50, 100,200]}
        />
      </div>
    </div>
  );
};

/* ── SUB-COMPONENTS ── */

const StatCell = ({
  label,
  icon,
  value,
  valueClass,
  highlight = false,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  valueClass: string;
  highlight?: boolean;
}) => (
  <div
    className={`flex flex-col justify-center gap-0.5 px-3 py-2 min-w-[90px] sm:min-w-[110px] flex-shrink-0 ${highlight ? "bg-danger/5" : ""}`}
  >
    <div className="flex items-center gap-1">
      {icon}
      <span className="text-[7.5px] font-black uppercase tracking-[0.1em] text-muted whitespace-nowrap leading-none">
        {label}
      </span>
    </div>
    <span
      className={`text-[13px] font-black leading-tight tabular-nums ${valueClass}`}
    >
      {fmt(value)}
    </span>
  </div>
);

const AgingCell = ({
  label,
  value,
  active = false,
  warn = false,
}: {
  label: string;
  value: number;
  active?: boolean;
  warn?: boolean;
}) => {
  const isHot = warn && value > 0;
  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 sm:px-2 ${active ? "bg-primary/8" : isHot ? "bg-danger/5" : ""}`}
    >
      <span
        className={`text-[6.5px] font-black uppercase tracking-widest mb-0.5 whitespace-nowrap ${active ? "text-primary" : isHot ? "text-danger" : "text-muted"}`}
      >
        {label}
      </span>
      <span
        className={`text-[11px] font-black tabular-nums leading-tight ${active ? "text-primary" : isHot ? "text-danger" : "text-main"}`}
      >
        {fmt(value)}
      </span>
    </div>
  );
};

export default SupplierStatement;
