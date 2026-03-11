import React, { useState, useEffect } from "react";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import type { Column } from "../../components/ui/Table/type";
import {
  getTrialBalance,
  type TrialBalanceFilters,
} from "../../api/Accounting/AccountApi";

import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Folder,
  FolderOpen,
  BookOpen,
} from "lucide-react";

/*  TYPES  */

export type TBAccount = {
  account: string;
  account_name: string;
  indent: number;

  opening_debit: number;
  opening_credit: number;

  debit: number;
  credit: number;

  closing_debit: number;
  closing_credit: number;

  has_value: boolean;
  children: TBAccount[];
};

type TBResponse = {
  message: {
    status_code: number;
    status: string;
    data: {
      company: string;
      totals: {
        opening_debit: number;
        opening_credit: number;
        debit: number;
        credit: number;
        closing_debit: number;
        closing_credit: number;
      };
      accounts: TBAccount[];
    };
  };
};

/*  HELPERS  */

const nf = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
  }).format(Math.round(v));

function expandIcon(
  _node: TBAccount,
  isExpanded: boolean,
  hasChildren: boolean
) {
  if (!hasChildren)
    return <BookOpen size={12} className="text-muted opacity-50" />;

  return isExpanded ? (
    <FolderOpen size={13} className="text-muted" />
  ) : (
    <Folder size={13} className="text-muted" />
  );
}

/*  COMPONENT  */

const TrialBalance: React.FC = () => {
  const [data, setData] = useState<TBResponse["message"]["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  /*  Filters  */

  const currentYear = new Date().getFullYear();

  const [filters, setFilters] = useState<TrialBalanceFilters>({
    from_date: `01-01-${currentYear}`,
    to_date: `31-12-${currentYear}`,
    fiscal_year: String(currentYear),
    show_zero_values: false,
    with_period_closing_entry: 0,
    show_closing_entries: 0,
  });

  useEffect(() => {
  const year = filters.fiscal_year;

  if (!/^\d{4}$/.test(year)) return;

  const newFrom = `01-01-${year}`;
  const newTo = `31-12-${year}`;

  setFilters((f) => {
    if (f.from_date === newFrom && f.to_date === newTo) return f;

    return {
      ...f,
      from_date: newFrom,
      to_date: newTo,
    };
  });
}, [filters.fiscal_year]);

  /*  Fetch API  */

  const fetchTB = async (currentFilters: TrialBalanceFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      if (!/^\d{4}$/.test(String(currentFilters.fiscal_year))) {
        setError("Fiscal year must be a 4 digit year.");
        setLoading(false);
        return;
      }

      const res: TBResponse = await getTrialBalance(currentFilters);

      if (res?.message?.status_code === 200) {
        setData(res.message.data);
      } else {
        setError("Failed to load trial balance.");
      }
    } catch (err: any) {
      setError(err?.message || "Error fetching trial balance.");
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  if (!/^\d{4}$/.test(String(filters.fiscal_year))) return;

  const timer = setTimeout(() => {
    fetchTB(filters);
  }, 300);

  return () => clearTimeout(timer);
}, [filters]);
  /*  COLUMNS  */

const toApiDate = (date: string) => {
  if (!date || !date.includes("-")) return "";
  const [y, m, d] = date.split("-");
  return `${d}-${m}-${y}`;
};
  const columns: Column<TBAccount>[] = [
    {
      key: "account_name",
      header: "Account",
      render: (row) => (
        <span className={row.indent === 0 ? "font-semibold" : ""}>
          {row.account_name}
        </span>
      ),
    },
    {
      key: "opening_debit",
      header: "Opening Debit",
      align: "right",
      render: (row) => (row.opening_debit ? nf(row.opening_debit) : "—"),
    },
    {
      key: "opening_credit",
      header: "Opening Credit",
      align: "right",
      render: (row) => (row.opening_credit ? nf(row.opening_credit) : "—"),
    },
    {
      key: "debit",
      header: "Debit",
      align: "right",
      render: (row) => (row.debit ? nf(row.debit) : "—"),
    },
    {
      key: "credit",
      header: "Credit",
      align: "right",
      render: (row) => (row.credit ? nf(row.credit) : "—"),
    },
    {
      key: "closing_debit",
      header: "Closing Debit",
      align: "right",
      render: (row) => (row.closing_debit ? nf(row.closing_debit) : "—"),
    },
    {
      key: "closing_credit",
      header: "Closing Credit",
      align: "right",
      render: (row) => (row.closing_credit ? nf(row.closing_credit) : "—"),
    },
  ];

  /*  FILTER UI  */

  const filtersUI = (
    <div className="flex items-center gap-3 flex-wrap text-xs">
      {/* From Date */}
      <input
        type="date"
        value={
          filters.from_date
            ? filters.from_date.split("-").reverse().join("-")
            : ""
        }
        onChange={(e) => {
          const d = toApiDate(e.target.value);
          setFilters((f) => ({ ...f, from_date: d }));
        }}
        className="px-2 py-1 border border-[var(--border)] rounded"
      />

      {/* To Date */}
      <input
        type="date"
        value={
  filters.to_date
    ? filters.to_date.split("-").reverse().join("-")
    : ""
}
        onChange={(e) => {
          const d = toApiDate(e.target.value);
          setFilters((f) => ({ ...f, to_date: d }));
        }}
        className="px-2 py-1 border border-[var(--border)] rounded"
      />

      {/* Fiscal Year */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Year"
        value={filters.fiscal_year}
        onChange={(e) => {
          const value = e.target.value;

          if (/^\d{0,4}$/.test(value)) {
            setFilters((f) => ({ ...f, fiscal_year: value }));
          }
        }}
        className="px-2 py-1 border border-[var(--border)] rounded w-20"
      />

      {/* Checkboxes */}

      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={filters.show_zero_values}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              show_zero_values: e.target.checked,
            }))
          }
        />
        Zero Values
      </label>

      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={filters.with_period_closing_entry === 1}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              with_period_closing_entry: e.target.checked ? 1 : 0,
            }))
          }
        />
        Period Closing
      </label>

      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={filters.show_closing_entries === 1}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              show_closing_entries: e.target.checked ? 1 : 0,
            }))
          }
        />
        Closing Entries
      </label>
    </div>
  );

  /*  STATES  */

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={30} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <AlertCircle size={26} className="text-danger" />
        <p className="text-danger text-sm">{error}</p>
        <button
          onClick={fetchTB}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  /*  TABLE  */

  return (
    <ExpandableTreeTable<TBAccount>
      columns={columns}
      data={data?.accounts ?? []}
      childrenKey="children"
      nodeKey={(node) => node.account}
      showToolbar
      showSearch={false}
      extraFilters={filtersUI}
      onRefresh={fetchTB}
      defaultExpandDepth={0}
      expandIconRender={expandIcon}
      loading={loading}
      emptyMessage="No trial balance data."
    />
  );
};

export default TrialBalance;