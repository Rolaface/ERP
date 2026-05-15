import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
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

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const SupplierStatement = ({
  statement,
}: Props) => {
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
            <p className="text-xs font-bold text-main">
              {row.type}
            </p>

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
            {isNegative ? "-" : ""}
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
          <span className="text-xs text-muted italic">
            {row.note}
          </span>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 p-6">
      {/* SUMMARY + AGING */}
      <div className="flex gap-4 items-stretch">
        <div className="grid grid-cols-3 gap-4 flex-[3]">
          <SummaryCard
            label="Total Purchases"
            value={summary.totalPurchases}
            className="text-warning"
          />

          <SummaryCard
            label="Total Paid"
            value={summary.totalPaid}
            className="text-success"
          />

          <SummaryCard
            label="Outstanding"
            value={summary.outstanding}
            className={
              summary.outstanding > 0
                ? "text-danger"
                : "text-primary"
            }
          />
        </div>

        <div className="flex-[2] bg-card border border-theme rounded-2xl px-3 py-2">
          <div className="grid grid-cols-5 gap-2">
            <AgingCard
              compact
              label="Current"
              value={aging.current}
              active
            />

            <AgingCard
              compact
              label="1–30"
              value={aging["1_30"]}
            />

            <AgingCard
              compact
              label="31–60"
              value={aging["31_60"]}
            />

            <AgingCard
              compact
              label="61–90"
              value={aging["61_90"]}
            />

            <AgingCard
              compact
              label="90+"
              value={aging["90_plus"]}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-card border border-theme rounded-2xl overflow-hidden min-h-[320px]">
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

const SummaryCard = ({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) => (
  <div className="bg-card border border-theme rounded-xl p-4">
    <p className="text-[9px] font-black uppercase tracking-widest text-muted">
      {label}
    </p>

    <p className={`text-2xl font-black mt-2 ${className}`}>
      {fmt(value)}
    </p>
  </div>
);

const AgingCard = ({
  label,
  value,
  active = false,
  compact = false,
}: {
  label: string;
  value: number;
  active?: boolean;
  compact?: boolean;
}) => (
  <div
    className={`rounded-xl text-center transition-all ${
      compact ? "px-2 py-2" : "px-4 py-4"
    } ${
      active
        ? "bg-primary/10"
        : "bg-transparent"
    }`}
  >
    <p
      className={`uppercase tracking-widest font-black ${
        compact ? "text-[9px]" : "text-[10px]"
      } ${
        active ? "text-primary" : "text-muted"
      }`}
    >
      {label}
    </p>

    <p
      className={`font-black ${
        compact ? "text-sm" : "text-base"
      } ${
        active ? "text-primary" : "text-main"
      }`}
    >
      {fmt(value)}
    </p>
  </div>
);

export default SupplierStatement;