import { useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, FileText } from "lucide-react";
import Table from "../../components/ui/Table/Table";
import type { Supplier } from "../../types/Supply/supplier";

/*  TYPES  */

interface LedgerEntry {
  date: string;
  type: string;
  ref: string;
  debit: number; // Purchase
  credit: number; // Payment
  balance: number;
  note?: string;
}

interface Props {
  supplier: Supplier;
}

/*  COMPONENT  */

const SupplierStatement = ({ supplier }: Props) => {
  /* UI STATE ONLY */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);

  /* EMPTY DATA (NO DUMMY, NO BACKEND) */
  const ledger: LedgerEntry[] = [];

  const summary = {
    totalPurchases: 0,
    totalPaid: 0,
    outstanding: 0,
  };

  const aging = {
    current: 0,
    "1_30": 0,
    "31_60": 0,
    "61_90": 0,
    "90_plus": 0,
  };

  /*  TABLE COLUMNS  */

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (row: LedgerEntry) => (
        <span className="text-[10px] font-black text-muted uppercase tracking-widest">
          {new Date(row.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
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
                ? "bg-warning text-warning"
                : row.credit > 0
                  ? "bg-success text-success"
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
        row.debit ? (
          <span className="text-xs font-bold text-warning">
            ₹{row.debit.toLocaleString()}
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
        row.credit ? (
          <span className="text-xs font-bold text-success">
            ₹{row.credit.toLocaleString()}
          </span>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right" as const,
      render: (row: LedgerEntry) => (
        <span className="text-sm font-black text-primary">
          ₹{row.balance.toLocaleString()}
        </span>
      ),
    },
    {
      key: "note",
      header: "Notes",
      render: (row: LedgerEntry) =>
        row.note ? (
          <span className="text-xs text-muted italic">{row.note}</span>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
  ];

  /*  TOTALS  */

  const totalDebit = useMemo(
    () => ledger.reduce((s, r) => s + r.debit, 0),
    [ledger],
  );

  const totalCredit = useMemo(
    () => ledger.reduce((s, r) => s + r.credit, 0),
    [ledger],
  );

  /*  UI  */

  return (
    <div className="max-w-[1400px] mx-auto ">
      {/* KPI + AGING */}
      <div className="flex gap-4 items-stretch">
        {/* KPI */}
        <div className="grid grid-cols-3 gap-2 ">
          <SummaryCard
            label="Total Purchases"
            value={totalDebit}
            className="text-primary"
          />
          <SummaryCard
            label="Total Paid"
            value={totalCredit}
            className="text-primary"
          />
          <SummaryCard
            label="Outstanding"
            value={summary.outstanding}
            className="text-primary"
          />
        </div>

        {/* AGING */}
        <div className="flex-[2] bg-card border border-theme rounded-2xl px-3 py-2">
          <div className="grid grid-cols-5 gap-2">
            <AgingCell compact label="Current" value={aging.current} active />
            <AgingCell compact label="1–30" value={aging["1_30"]} />
            <AgingCell compact label="31–60" value={aging["31_60"]} />
            <AgingCell compact label="61–90" value={aging["61_90"]} />
            <AgingCell compact label="90+" value={aging["90_plus"]} />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-card border border-theme rounded-2xl overflow-hidden mt-4">
        <Table
          columns={columns}
          data={ledger}
          showToolbar={false}
          currentPage={page}
          totalPages={1}
          totalItems={0}
          pageSize={pageSize}
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

/*  SUB COMPONENTS  */

const AgingCell = ({
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
    className={`rounded-xl text-center ${
      compact ? "px-2 py-2" : "px-4 py-4"
    } ${active ? "bg-primary/10" : "bg-transparent"}`}
  >
    <p
      className={`uppercase tracking-widest font-black ${
        compact ? "text-[9px]" : "text-[10px]"
      } ${active ? "text-primary" : "text-muted"}`}
    >
      {label}
    </p>
    <p
      className={`font-black ${
        compact ? "text-sm" : "text-base"
      } ${active ? "text-primary" : "text-main"}`}
    >
      ₹{value.toLocaleString()}
    </p>
  </div>
);

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
    <p
      className={`text-[9px] font-black uppercase tracking-widest ${className}`}
    >
      {label}
    </p>
    <p className={`text-lg font-black ${className}`}>
      ₹{value.toLocaleString()}
    </p>
  </div>
);

export default SupplierStatement;
