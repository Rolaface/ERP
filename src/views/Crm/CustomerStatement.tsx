import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, FileText } from "lucide-react";
import Table from "../../components/ui/Table/Table";
import { getCustomerStatement } from "../../api/statementApi";

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

/*  COMPONENT  */

const CustomerStatement = ({ customerId }: CustomerStatementProps) => {
  const [data, setData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [searchQuery, setSearchQuery] = useState("");
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

        if (resp?.status === "success") {
          setData(resp.data);
          setTotalPages(resp.data.pagination?.total_pages || 1);
          setTotalItems(resp.data.pagination?.total || 0);
        } else {
          setError("Failed to load customer statement");
        }
      } catch {
        setError("Unable to fetch customer statement");
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
        row.note && row.note !== "No Remarks" ? (
          <span className="text-xs text-muted italic">{row.note}</span>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
  ];

  /*  TOTALS  */

  const totalDebit = useMemo(
    () => data?.ledger.reduce((s, r) => s + r.debit, 0) || 0,
    [data],
  );

  const totalCredit = useMemo(
    () => data?.ledger.reduce((s, r) => s + r.credit, 0) || 0,
    [data],
  );

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
      {/* TOP ROW: KPI (left) + Aging (right) */}
      <div className="flex gap-4 items-stretch">
        {/* KPI CARDS — LEFT */}
        <div className="grid grid-cols-3 gap-4 flex-[3]">
          <SummaryCard
            label="Total Debit"
            value={totalDebit}
            className="text-primary"
          />
          <SummaryCard
            label="Total Credit"
            value={totalCredit}
            className="text-primary"
          />
          <SummaryCard
            label="Net Outstanding"
            value={data.summary.netOutstanding}
            className="text-primary"
          />
        </div>

        {/* AGING — RIGHT (COMPACT) */}
        <div className="flex-[2] bg-card border border-theme rounded-2xl px-3 py-2">
          <div className="grid grid-cols-5 gap-2">
            <AgingCell
              compact
              label="Current"
              value={data.aging.current}
              active
            />
            <AgingCell compact label="1–30" value={data.aging["1_30"]} />
            <AgingCell compact label="31–60" value={data.aging["31_60"]} />
            <AgingCell compact label="61–90" value={data.aging["61_90"]} />
            <AgingCell compact label="90+" value={data.aging["90_plus"]} />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-card border border-theme rounded-2xl overflow-hidden">
        <Table
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
    className={`rounded-xl text-center transition-all ${
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

export default CustomerStatement;
