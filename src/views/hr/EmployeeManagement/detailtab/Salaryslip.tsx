import React, { useState, useEffect } from "react";
import { ExternalLink, Download, Loader2 } from "lucide-react";
import type { SalarySlip } from "./salarytypes";
import { formatCurrency, formatDate, getSlipPeriodLabel } from "./salarysliphelper";
import {
  getSalarySlipPdf,
  viewSalarySlipPdf,
  downloadSalarySlipPdf,
  getSalarySlipsByEmployeeOnly,
} from "../../../../api/payroll/payrollEntryApi";
import ModalTable from "../../../../components/ui/Table/ModalTableInside";
import type { Column } from "../../../../components/ui/Table/type";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  { label: "All Months", value: "" },
  { label: "January",   value: "0"  }, { label: "February",  value: "1"  },
  { label: "March",     value: "2"  }, { label: "April",     value: "3"  },
  { label: "May",       value: "4"  }, { label: "June",      value: "5"  },
  { label: "July",      value: "6"  }, { label: "August",    value: "7"  },
  { label: "September", value: "8"  }, { label: "October",   value: "9"  },
  { label: "November",  value: "10" }, { label: "December",  value: "11" },
];

const currentYear = new Date().getFullYear();
const YEARS = [
  { label: "All Years", value: "" },
  ...Array.from({ length: 6 }, (_, i) => ({
    label: String(currentYear - i),
    value: String(currentYear - i),
  })),
];

const STATUSES = [
  { label: "All Status", value: ""          },
  { label: "Submitted",  value: "Submitted" },
  { label: "Draft",      value: "Draft"     },
  { label: "Cancelled",  value: "Cancelled" },
];

const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSlipMonth(slip: SalarySlip): number | null {
  const d = slip.posting_date || slip.start_date;
  return d ? new Date(d).getMonth() : null;
}
function getSlipYear(slip: SalarySlip): number | null {
  const d = slip.posting_date || slip.start_date;
  return d ? new Date(d).getFullYear() : null;
}

// ─── Status Pill ──────────────────────────────────────────────────────────────

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    Submitted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Draft:     "bg-amber-50 text-amber-700 border-amber-200",
    Cancelled: "bg-red-50 text-red-600 border-red-200",
  };
  const dots: Record<string, string> = {
    Submitted: "bg-emerald-500",
    Draft:     "bg-amber-400",
    Cancelled: "bg-red-500",
  };
  const cls = styles[status] ?? "bg-gray-50 text-gray-500 border-gray-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] ?? "bg-gray-400"}`} />
      {status || "—"}
    </span>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SalarySlipTableProps {
  slips?:     SalarySlip[];
  employeeId?: string;
  loading?:   boolean;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export const SalarySlipTable: React.FC<SalarySlipTableProps> = ({
  slips: slipsProp,
  employeeId,
  loading: loadingProp = false,
}) => {
  // ── Fetch ────────────────────────────────────────────────────────────────
  const [fetchedSlips, setFetchedSlips] = useState<SalarySlip[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    if (!employeeId) return;
    setFetchLoading(true);
    getSalarySlipsByEmployeeOnly(employeeId)
      .then((d) => setFetchedSlips(d as SalarySlip[]))
      .catch((e) => console.error(e))
      .finally(() => setFetchLoading(false));
  }, [employeeId]);

  const allSlips = slipsProp ?? fetchedSlips;
  const loading  = loadingProp || fetchLoading;

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState("");
  const [yearFilter,   setYearFilter]   = useState("");
  const [monthFilter,  setMonthFilter]  = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);

  const isFiltered = !!(search || yearFilter || monthFilter || statusFilter);

  const filtered = React.useMemo(() => {
    let list = [...allSlips];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.employee_name?.toLowerCase().includes(q) ||
      getSlipPeriodLabel(s)?.toLowerCase().includes(q),
    );
    if (yearFilter)   list = list.filter((s) => { const y = getSlipYear(s);  return y !== null && String(y) === yearFilter;  });
    if (monthFilter)  list = list.filter((s) => { const m = getSlipMonth(s); return m !== null && String(m) === monthFilter; });
    if (statusFilter) list = list.filter((s) => s.status === statusFilter);
    return list;
  }, [allSlips, search, yearFilter, monthFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = (fn: () => void) => { fn(); setPage(1); };

  // ── Actions ──────────────────────────────────────────────────────────────
  const [viewingId,     setViewingId]     = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleView = async (slip: SalarySlip) => {
    try {
      setViewingId(slip.name);
      viewSalarySlipPdf(await getSalarySlipPdf(slip.name));
    } catch (e) { console.error(e); }
    finally { setViewingId(null); }
  };

  const handleDownload = async (slip: SalarySlip) => {
    try {
      setDownloadingId(slip.name);
      downloadSalarySlipPdf(await getSalarySlipPdf(slip.name), `${getSlipPeriodLabel(slip) || slip.name}.pdf`);
    } catch (e) { console.error(e); }
    finally { setDownloadingId(null); }
  };

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns: Column<SalarySlip>[] = [
    {
      key:    "period",
      header: "Period",
      width:  "40%",
      render: (slip) => (
        <div className="flex flex-col">
          <span className="text-[12px] font-semibold text-main">{getSlipPeriodLabel(slip)}</span>
          <span className="text-[10px] text-muted font-mono truncate max-w-[220px]">{slip.name}</span>
          {slip.posting_date && (
            <span className="text-[10px] text-muted">Posted: {formatDate(slip.posting_date)}</span>
          )}
        </div>
      ),
    },
    {
      key:    "gross_pay",
      header: "Gross Pay",
      align:  "right",
      width:  "15%",
      render: (slip) => (
        <span className="text-[12px] font-semibold text-main">
          {slip.gross_pay ? formatCurrency(Math.abs(slip.gross_pay), slip.currency) : "—"}
        </span>
      ),
    },
    {
      key:    "net_pay",
      header: "Net Pay",
      align:  "right",
      width:  "15%",
      render: (slip) => (
        <span className="text-[12px] font-semibold text-emerald-600">
          {slip.net_pay ? formatCurrency(Math.abs(slip.net_pay), slip.currency) : "—"}
        </span>
      ),
    },
    {
      key:    "status",
      header: "Status",
      align:  "center",
      width:  "15%",
      render: (slip) => <StatusPill status={slip.status} />,
    },
    {
      key:    "actions",
      header: "Actions",
      align:  "right",
      width:  "15%",
      render: (slip) => {
        const isViewing     = viewingId    === slip.name;
        const isDownloading = downloadingId === slip.name;
        const busy          = isViewing || isDownloading;
        return (
          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); handleView(slip); }}
              disabled={busy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-primary text-white hover:bg-primary/85 transition-colors disabled:opacity-60"
            >
              {isViewing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
              View
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(slip); }}
              disabled={busy}
              title="Download PDF"
              className="p-1.5 rounded-lg border border-theme hover:bg-primary/8 hover:border-primary/30 transition-colors disabled:opacity-50 group/dl"
            >
              {isDownloading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                : <Download className="w-3.5 h-3.5 text-muted group-hover/dl:text-primary transition-colors" />}
            </button>
          </div>
        );
      },
    },
  ];

  // ── Filters UI ────────────────────────────────────────────────────────────
  const filtersNode = (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={yearFilter}
        onChange={(e) => resetPage(() => setYearFilter(e.target.value))}
        className="text-[11px] bg-card border border-theme rounded-lg px-2 py-1.5 text-main focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
      >
        {YEARS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select
        value={monthFilter}
        onChange={(e) => resetPage(() => setMonthFilter(e.target.value))}
        className="text-[11px] bg-card border border-theme rounded-lg px-2 py-1.5 text-main focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
      >
        {MONTHS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select
        value={statusFilter}
        onChange={(e) => resetPage(() => setStatusFilter(e.target.value))}
        className="text-[11px] bg-card border border-theme rounded-lg px-2 py-1.5 text-main focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
      >
        {STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {isFiltered && (
        <button
          onClick={() => resetPage(() => { setSearch(""); setYearFilter(""); setMonthFilter(""); setStatusFilter(""); })}
          className="text-[11px] font-medium text-muted hover:text-danger transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ModalTable<SalarySlip>
      tableId="employee-salary-slips"
      columns={columns}
      data={paginated}
      rowKey={(s) => s.name}
      loading={loading}
      emptyMessage={isFiltered ? "No matching salary slips" : "No salary slips yet"}

      showToolbar
      toolbarPlaceholder="Search by name or period…"
      searchValue={search}
      onSearch={(q) => resetPage(() => setSearch(q))}
      extraFilters={filtersNode}

      currentPage={page}
      totalPages={totalPages}
      pageSize={PAGE_SIZE}
      totalItems={filtered.length}
      onPageChange={setPage}
    />
  );
};