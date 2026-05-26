import React, { useState, useEffect } from "react";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import type { Column } from "../../components/ui/Table/type";
import {
  getTrialBalance,
  type TrialBalanceFilters,
} from "../../api/Accounting/AccountApi";
import { getCompanyCurrentFiscalYear } from "../../api/utils/frappeUtilsApi";
import DatePickerInput from "../../components/calendar/DatePickerInput";
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
  currency?: string;
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
    message: string;
    data: {
      company: string;
      total_accounts: number;

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
const nf = (value: number, currency?: string) => {
  if (!value) return "—";

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return `${currency ?? ""} ${formatted}`.trim();
};

function expandIcon(
  node: TBAccount,
  isExpanded: boolean,
  hasChildren: boolean
) {
  if (node.account === "__total__") return null;

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
  const [fiscalYear, setFiscalYear] = useState<string>("");
const [fiscalYearStartDate, setFiscalYearStartDate] = useState<string>("");
const [fiscalYearEndDate, setFiscalYearEndDate] = useState<string>("");

  const tableData: TBAccount[] = React.useMemo(() => {
    if (!data) return [];

    const totalRow: TBAccount = {
      account: "__total__",
      account_name: "TOTAL",
      indent: 0,
      currency: data.accounts?.[0]?.currency ?? "",

      opening_debit: data.totals.opening_debit,
      opening_credit: data.totals.opening_credit,
      debit: data.totals.debit,
      credit: data.totals.credit,
      closing_debit: data.totals.closing_debit,
      closing_credit: data.totals.closing_credit,

      has_value: true,
      children: [],
    };

    return [...data.accounts, totalRow];
  }, [data]);

  /*  Filters  */

  const currentYear = new Date().getFullYear();
  useEffect(() => {
  const loadFiscalYear = async () => {
    try {
      const res = await getCompanyCurrentFiscalYear();
      setFiscalYear(res.data?.fiscal_year || "");
      setFiscalYearStartDate(res.data?.start_date || "");
      setFiscalYearEndDate(res.data?.end_date || "");
    } catch (err) {
      console.error("Failed to fetch fiscal year", err);
    }
  };

  loadFiscalYear();
}, []);

  const [filters, setFilters] = useState<TrialBalanceFilters>({
    from_date: "",
    to_date: "",
    fiscal_year: "",
    show_zero_values: false,
    with_period_closing_entry: 0,
    show_closing_entries: 0,
  });

  useEffect(() => {
  if (!fiscalYear || !fiscalYearStartDate || !fiscalYearEndDate) return;

  setFilters((f) => ({
    ...f,
    fiscal_year: fiscalYear,
    from_date: fiscalYearStartDate,
    to_date: fiscalYearEndDate,
  }));
}, [fiscalYear, fiscalYearStartDate, fiscalYearEndDate]);

  // useEffect(() => {
  //   const year = filters.fiscal_year;

  //   if (!/^\d{4}$/.test(year)) return;

  //   const newFrom = `01-01-${year}`;
  //   const newTo = `31-12-${year}`;

  //   setFilters((f) => {
  //     if (f.from_date === newFrom && f.to_date === newTo) return f;

  //     return {
  //       ...f,
  //       from_date: newFrom,
  //       to_date: newTo,
  //     };
  //   });
  // }, [filters.fiscal_year]);

  useEffect(() => {
    if (!filters.fiscal_year) return;

    const timer = setTimeout(() => {
      fetchTB(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  /*  Fetch API  */

  const fetchTB = async (currentFilters: TrialBalanceFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      if (!currentFilters.fiscal_year) {
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
          onClick={() => fetchTB()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }


  /*  COLUMNS  */

  const toApiDate = (date: string) => {
  if (!date) return "";
  return date;
};

  const fromApiDate = (date: string) => {
  if (!date) return "";
  return date;
};

  const columns: Column<TBAccount>[] = [
    {
      key: "account_name",
      header: "Account",
      render: (row) => {
        const isTotal = row.account === "__total__";

        return (
          <div
            className={`max-w-[320px] whitespace-normal break-words ${isTotal
                ? "font-bold text-primary"
                : row.indent === 0
                  ? "font-semibold"
                  : ""
              }`}
          >
            {row.account_name}
          </div>
        );
      },
    },
    {
      key: "opening_debit",
      header: "Opening Debit",
      align: "right",
      render: (row) => (
        <span className="tabular-nums text-right">
          {nf(row.opening_debit, row.currency)}
        </span>
      )
    },
    {
      key: "opening_credit",
      header: "Opening Credit",
      align: "right",
      render: (row) => (
        <span className="tabular-nums text-right">
          {nf(row.opening_credit, row.currency)}
        </span>
      )
    },
    {
      key: "debit",
      header: "Debit",
      align: "right",
      render: (row) => (
        <span className="tabular-nums text-right">
          {nf(row.debit, row.currency)}
        </span>
      )
    },
    {
      key: "credit",
      header: "Credit",
      align: "right",
      render: (row) => (
        <span className="tabular-nums text-right">
          {nf(row.credit, row.currency)}
        </span>
      )
    },
    {
      key: "closing_debit",
      header: "Closing Debit",
      align: "right",
      render: (row) => (
        <span className="tabular-nums text-right">
          {nf(row.closing_debit, row.currency)}
        </span>
      )
    },
    {
      key: "closing_credit",
      header: "Closing Credit",
      align: "right",
      render: (row) => (
        <span className="tabular-nums text-right">
          {nf(row.closing_credit, row.currency)}
        </span>
      )
    },
  ];

  /*  FILTER UI  */

  const filtersUI = (
    <div className="flex items-center gap-3 flex-wrap text-xs">

      {/* From Date */}
      <div className="w-[140px]">
        <DatePickerInput
          name="from_date"
          value={fromApiDate(filters.from_date)}
          onChange={(name, value) => {
            setFilters((f) => ({
              ...f,
              from_date: toApiDate(value),
            }));
          }}
        />
      </div>

      {/* To Date */}
      <div className="w-[140px]">
        <DatePickerInput
          name="to_date"
          value={fromApiDate(filters.to_date)}
          onChange={(name, value) => {
            setFilters((f) => ({
              ...f,
              to_date: toApiDate(value),
            }));
          }}
        />
      </div>
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



  /*  TABLE  */



  return (
    <div className="flex flex-col gap-2">
      <ExpandableTreeTable<TBAccount>
        columns={columns}
        data={tableData}
        childrenKey="children"
        nodeKey={(node) => node.account}
        showToolbar
        showSearch={false}
        extraFilters={filtersUI}
        defaultExpandDepth={0}
        expandIconRender={expandIcon}
        loading={loading}
        emptyMessage="No trial balance data."
      />


    </div>
  );
};

export default TrialBalance;