import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
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
  onMakePayment?: (entry: LedgerEntry) => void;
  onViewEntry?: (entry: LedgerEntry) => void;
}

const fmt = (n: number) =>
  Math.abs(n || 0).toLocaleString("en-IN");

const formatDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const SupplierStatement = ({ statement }: Props) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);

  const ledger = statement?.ledger ?? [];

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

  const totalDebit = useMemo(
    () => ledger.reduce((sum, row) => sum + (row.debit || 0), 0),
    [ledger]
  );

  const totalCredit = useMemo(
    () => ledger.reduce((sum, row) => sum + (row.credit || 0), 0),
    [ledger]
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
            <p className="text-[9px] font-mono text-muted uppercase">{row.ref}</p>
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
          <span className="text-xs font-bold text-warning">{fmt(row.debit)}</span>
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
          <span className="text-xs font-bold text-success">{fmt(row.credit)}</span>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right" as const,
      render: (row: LedgerEntry) => {
        const isNegative = row.balance < 0;
        return (
          <span
            className={`text-sm font-black ${
              row.balance === 0
                ? "text-muted"
                : isNegative
                ? "text-danger"
                : "text-primary"
            }`}
          >
            {isNegative ? "−" : ""}
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
    <div className="max-w-[1400px] mx-auto space-y-5 p-6">

      {/* ── SUMMARY + AGING: single connected strip ── */}
      <div className="bg-card border border-theme rounded-2xl flex items-stretch overflow-hidden divide-x divide-theme">

        {/* KPI 1 */}
        <StatCell
          label="Total Purchases"
          icon={<TrendingUp size={12} className="text-warning" />}
          value={summary.totalPurchases}
          valueClass="text-warning"
        />

        {/* KPI 2 */}
        <StatCell
          label="Total Paid"
          icon={<TrendingDown size={12} className="text-success" />}
          value={summary.totalPaid}
          valueClass="text-success"
        />

        {/* KPI 3 */}
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

        {/* ── Aging section ── */}
        <div className="flex flex-1 items-stretch min-w-0">
          {/* Rotated "AGING" label */}
          <div className="flex items-center justify-center px-3 bg-row-hover/50 border-r border-theme flex-shrink-0">
            <span
              className="text-[8px] font-black uppercase tracking-[0.2em] text-muted select-none"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Aging
            </span>
          </div>

          {/* 5 aging buckets */}
          <div className="flex flex-1 divide-x divide-theme">
            <AgingCell label="Current"  value={aging.current}       active />
            <AgingCell label="1 – 30"   value={aging["1_30"]}               />
            <AgingCell label="31 – 60"  value={aging["31_60"]}              />
            <AgingCell label="61 – 90"  value={aging["61_90"]}              />
            <AgingCell label="90 +"     value={aging["90_plus"]}     warn   />
          </div>
        </div>
      </div>

      {/* ── LEDGER TABLE ── */}
      <div className="bg-card border border-theme rounded-2xl overflow-hidden min-h-[320px]">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-theme">
          <div className="flex items-center gap-2">
            <FileText size={13} className="text-primary" />
            <span className="text-[11px] font-black uppercase tracking-widest text-main">
              Ledger Entries
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
              {ledger.length}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="font-bold text-muted uppercase tracking-widest text-[9px]">
              Total Debits
            </span>
            <span className="font-black text-warning tabular-nums">{fmt(totalDebit)}</span>
            <div className="w-px h-3 bg-border" />
            <span className="font-bold text-muted uppercase tracking-widest text-[9px]">
              Total Credits
            </span>
            <span className="font-black text-success tabular-nums">{fmt(totalCredit)}</span>
          </div>
        </div>

        <ModalTable
          columns={columns}
          data={ledger}
          showToolbar={false}
          currentPage={page}
          totalPages={Math.ceil(ledger.length / pageSize) || 1}
          totalItems={ledger.length}
          pageSize={Math.min(pageSize, ledger.length) || pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          pageSizeOptions={[4, 10, 25]}
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
    className={`flex flex-col justify-center gap-1.5 px-6 py-4 min-w-[148px] flex-shrink-0 ${
      highlight ? "bg-danger/5" : ""
    }`}
  >
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted whitespace-nowrap">
        {label}
      </span>
    </div>
    <span className={`text-[22px] font-black leading-none tabular-nums ${valueClass}`}>
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
      className={`flex-1 flex flex-col items-center justify-center py-3 px-2 ${
        active ? "bg-primary/8" : isHot ? "bg-danger/5" : ""
      }`}
    >
      <span
        className={`text-[9px] font-black uppercase tracking-widest mb-1.5 whitespace-nowrap ${
          active ? "text-primary" : isHot ? "text-danger" : "text-muted"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-[13px] font-black tabular-nums ${
          active ? "text-primary" : isHot ? "text-danger" : "text-main"
        }`}
      >
        {fmt(value)}
      </span>
    </div>
  );
};

export default SupplierStatement;