import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import  ModalTable from "../../components/ui/Table/ModalTableInside";
import { getCustomerStatement } from "../../api/statementApi";
import { showApiError } from "../../utils/alert";

/*  TYPES  */

interface LedgerEntry {
  date: string;
  type: string;
  ref: string;
  debit: number;
  credit: number;
  balance: number;
  note: string;
}

interface StatementData {
  openingBalance: number;
  summary: {
    totalInvoiced: number;
    totalCollected: number;
    netOutstanding: number;
    totalDebit: number;
    totalCredit: number;
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

interface CustomerStatementProps {
  customerId: string;
}

const fmt = (n: number) => Math.abs(n || 0).toLocaleString("en-IN");

/*  COMPONENT  */

const CustomerStatement = ({ customerId }: CustomerStatementProps) => {
  const [data, setData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /*  API  */
  useEffect(() => {
    if (!customerId) return;

    const fetchStatement = async () => {
      try {
        setLoading(true);
        setError(null);

        const resp = await getCustomerStatement(customerId, page, pageSize);

        if (resp?.message?.status_code == 200) {
          setData(resp.message.data);
          setTotalPages(resp.message.data.pagination?.total_pages || 1);
          setTotalItems(resp.message.data.pagination?.total || 0);
        } else {
          setError("Failed to load customer statement");
        }
      } catch (err) {
        showApiError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatement();
  }, [customerId, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [customerId]);

  /*  TABLE COLUMNS  */

  const statementColumns = [
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
            className={`text-sm font-black tabular-nums ${
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

  /*  TOTALS — server-side grand totals, not paginated ledger rows  */
  const totalDebit = data?.summary.totalDebit ?? 0;
  const totalCredit = data?.summary.totalCredit ?? 0;
  const netOutstanding = data?.summary.netOutstanding ?? 0;

  /*  STATES  */

  if (loading) {
    return (
      <div className="p-8 bg-card border border-theme rounded-2xl animate-shimmer">
        <p className="text-muted text-sm">Loading customer statement…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-card border border-theme rounded-2xl">
        <p className="text-danger text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  /*  UI  */

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 p-6">

      {/* ── SUMMARY + AGING: single connected strip ── */}
      <div className="bg-card border border-theme rounded-2xl flex items-stretch overflow-hidden divide-x divide-theme">

        {/* KPI 1 */}
        <StatCell
          label="Total Debit"
          icon={<TrendingUp size={12} className="text-warning" />}
          value={totalDebit}
          valueClass="text-warning"
        />

        {/* KPI 2 */}
        <StatCell
          label="Total Credit"
          icon={<TrendingDown size={12} className="text-success" />}
          value={totalCredit}
          valueClass="text-success"
        />

        {/* KPI 3 */}
        <StatCell
          label="Net Outstanding"
          icon={
            <Minus
              size={12}
              className={netOutstanding > 0 ? "text-danger" : "text-muted"}
            />
          }
          value={netOutstanding}
          valueClass={netOutstanding > 0 ? "text-danger" : "text-muted"}
          highlight={netOutstanding > 0}
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
            <AgingCell label="Current"  value={data.aging.current}       active />
            <AgingCell label="1 – 30"   value={data.aging["1_30"]}               />
            <AgingCell label="31 – 60"  value={data.aging["31_60"]}              />
            <AgingCell label="61 – 90"  value={data.aging["61_90"]}              />
            <AgingCell label="90 +"     value={data.aging["90_plus"]}     warn   />
          </div>
        </div>
      </div>

      {/* ── LEDGER TABLE ── */}
      <div className="bg-card border border-theme rounded-2xl overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-theme">
          <div className="flex items-center gap-2">
            <FileText size={13} className="text-primary" />
            <span className="text-[11px] font-black uppercase tracking-widest text-main">
              Ledger Entries
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
              {totalItems}
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
          columns={statementColumns}
          data={data.ledger}
          showToolbar={false}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
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

/*  SUB-COMPONENTS  */

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

export default CustomerStatement;


