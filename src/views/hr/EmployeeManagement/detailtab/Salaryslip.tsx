import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  Download,
  Loader2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import type { SalarySlip } from "./salarytypes";
import {
  formatCurrency,
  formatDate,
  getSlipPeriodLabel,
} from "./salarysliphelper";
import {
  getSalarySlipPdf,
  downloadSalarySlipPdf,
  getSalarySlipsByEmployeeOnly,
} from "../../../../api/payroll/payrollEntryApi";
import ModalTable from "../../../../components/ui/Table/ModalTableInside";
import type { Column } from "../../../../components/ui/Table/type";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  { label: "All Months", value: "" },
  { label: "January", value: "0" },
  { label: "February", value: "1" },
  { label: "March", value: "2" },
  { label: "April", value: "3" },
  { label: "May", value: "4" },
  { label: "June", value: "5" },
  { label: "July", value: "6" },
  { label: "August", value: "7" },
  { label: "September", value: "8" },
  { label: "October", value: "9" },
  { label: "November", value: "10" },
  { label: "December", value: "11" },
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
  { label: "All Status", value: "" },
  { label: "Submitted", value: "Submitted" },
  { label: "Draft", value: "Draft" },
  { label: "Cancelled", value: "Cancelled" },
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
    Draft: "bg-amber-50 text-amber-700 border-amber-200",
    Cancelled: "bg-red-50 text-red-600 border-red-200",
  };
  const dots: Record<string, string> = {
    Submitted: "bg-emerald-500",
    Draft: "bg-amber-400",
    Cancelled: "bg-red-500",
  };
  const cls = styles[status] ?? "bg-gray-50 text-gray-500 border-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cls}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dots[status] ?? "bg-gray-400"}`}
      />
      {status || "—"}
    </span>
  );
};

// ─── PDF Viewer Modal ─────────────────────────────────────────────────────────

interface PdfViewerProps {
  blobUrl: string;
  title: string;
  onClose: () => void;
  onDownload: () => void;
}

const PdfViewerModal: React.FC<PdfViewerProps> = ({
  blobUrl,
  title,
  onClose,
  onDownload,
}) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    // Backdrop
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden"
        style={{
          width: "min(900px, 95vw)",
          height: "min(92vh, 900px)",
          zIndex: 10000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme bg-app shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-main leading-tight">
                {title}
              </p>
              <p className="text-[10px] text-muted">Salary Slip</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-theme hover:bg-primary/8 hover:border-primary/30 text-main transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF iframe */}
        <div className="flex-1 bg-gray-100 overflow-hidden">
          <iframe
            src={blobUrl}
            className="w-full h-full border-0"
            title="Salary Slip PDF"
          />
        </div>
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SalarySlipTableProps {
  slips?: SalarySlip[];
  employeeId?: string;
  loading?: boolean;
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
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (!employeeId) return;
    setFetchLoading(true);
    getSalarySlipsByEmployeeOnly(employeeId)
      .then(({ data, total }) => {
        setFetchedSlips(data);
        setTotalItems(total);
      })
      .catch((e) => console.error(e))
      .finally(() => setFetchLoading(false));
  }, [employeeId]);

  const allSlips = slipsProp ?? fetchedSlips;
  const loading = loadingProp || fetchLoading;

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const isFiltered = !!(search || yearFilter || monthFilter || statusFilter);

  const filtered = React.useMemo(() => {
    let list = [...allSlips];
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.employee_name?.toLowerCase().includes(q) ||
          getSlipPeriodLabel(s)?.toLowerCase().includes(q),
      );
    if (yearFilter)
      list = list.filter((s) => {
        const y = getSlipYear(s);
        return y !== null && String(y) === yearFilter;
      });
    if (monthFilter)
      list = list.filter((s) => {
        const m = getSlipMonth(s);
        return m !== null && String(m) === monthFilter;
      });
    if (statusFilter) list = list.filter((s) => s.status === statusFilter);
    return list;
  }, [allSlips, search, yearFilter, monthFilter, statusFilter]);

  const totalPages = slipsProp
    ? Math.ceil(filtered.length / PAGE_SIZE)
    : Math.ceil(totalItems / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = (fn: () => void) => {
    fn();
    setPage(1);
  };

  // ── PDF Viewer state ─────────────────────────────────────────────────────
  const [pdfViewer, setPdfViewer] = useState<{
    blobUrl: string;
    title: string;
    blob: Blob;
    slip: SalarySlip;
  } | null>(null);

  // cleanup blob url on close
  const closePdfViewer = () => {
    if (pdfViewer) URL.revokeObjectURL(pdfViewer.blobUrl);
    setPdfViewer(null);
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleView = async (slip: SalarySlip) => {
    try {
      setViewingId(slip.name);
      const blob = await getSalarySlipPdf(slip.name);
      const blobUrl = URL.createObjectURL(blob);
      setPdfViewer({
        blobUrl,
        blob,
        slip,
        title: getSlipPeriodLabel(slip) || slip.name,
      });
    } catch (e) {
      console.error("View failed", e);
    } finally {
      setViewingId(null);
    }
  };

  const handleDownload = async (slip: SalarySlip) => {
    try {
      setDownloadingId(slip.name);
      const blob = await getSalarySlipPdf(slip.name);
      downloadSalarySlipPdf(
        blob,
        `${getSlipPeriodLabel(slip) || slip.name}.pdf`,
      );
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadFromViewer = () => {
    if (!pdfViewer) return;
    downloadSalarySlipPdf(
      pdfViewer.blob,
      `${getSlipPeriodLabel(pdfViewer.slip) || pdfViewer.slip.name}.pdf`,
    );
  };

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns: Column<SalarySlip>[] = [
    {
      key: "period",
      header: "Period",
      width: "20%",
      render: (slip) => (
        <div className="flex flex-col">
          <span className="text-[12px] font-semibold text-main">
            {getSlipPeriodLabel(slip)}
          </span>
          <span className="text-[10px] text-muted font-mono truncate max-w-[220px]">
            {slip.name}
          </span>
          {slip.posting_date && (
            <span className="text-[10px] text-muted">
              Posted: {formatDate(slip.posting_date)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "gross_pay",
      header: "Gross Pay",
      align: "right",
      width: "15%",
      render: (slip) => (
        <span className="text-[12px] font-semibold text-main">
          {slip.gross_pay
            ? formatCurrency(Math.abs(slip.gross_pay), slip.currency)
            : "—"}
        </span>
      ),
    },
   {
  key: "total_deduction",
  header: "Deduction",
  align: "right",
  width: "15%",
  render: (slip) => (
    <span>
      {formatCurrency(
        slip.total_deduction || 0,
        slip.currency,
      )}
    </span>
  ),
},
{
  key: "total_income_tax",
  header: "Income Tax",
  align: "right",
  render: (slip) => (
    <span>
      {formatCurrency(
        slip.total_income_tax || 0,
        slip.currency,
      )}
    </span>
  ),
},
    {
      key: "net_pay",
      header: "Net Pay",
      align: "right",
      width: "15%",
      render: (slip) => (
        <span className="text-[12px] font-semibold text-emerald-600">
          {slip.net_pay
            ? formatCurrency(Math.abs(slip.net_pay), slip.currency)
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      width: "15%",
      render: (slip) => <StatusPill status={slip.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      width: "15%",
      render: (slip) => {
        const isViewing = viewingId === slip.name;
        const isDownloading = downloadingId === slip.name;
        const busy = isViewing || isDownloading;
        return (
          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleView(slip);
              }}
              disabled={busy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-primary text-white hover:bg-primary/85 transition-colors disabled:opacity-60"
            >
              {isViewing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ExternalLink className="w-3 h-3" />
              )}
              View
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(slip);
              }}
              disabled={busy}
              title="Download PDF"
              className="p-1.5 rounded-lg border border-theme hover:bg-primary/8 hover:border-primary/30 transition-colors disabled:opacity-50 group/dl"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <Download className="w-3.5 h-3.5 text-muted group-hover/dl:text-primary transition-colors" />
              )}
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
        {YEARS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={monthFilter}
        onChange={(e) => resetPage(() => setMonthFilter(e.target.value))}
        className="text-[11px] bg-card border border-theme rounded-lg px-2 py-1.5 text-main focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
      >
        {MONTHS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={statusFilter}
        onChange={(e) => resetPage(() => setStatusFilter(e.target.value))}
        className="text-[11px] bg-card border border-theme rounded-lg px-2 py-1.5 text-main focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
      >
        {STATUSES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {isFiltered && (
        <button
          onClick={() =>
            resetPage(() => {
              setSearch("");
              setYearFilter("");
              setMonthFilter("");
              setStatusFilter("");
            })
          }
          className="text-[11px] font-medium text-muted hover:text-danger transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <ModalTable<SalarySlip>
        tableId="employee-salary-slips"
        columns={columns}
        data={paginated}
        rowKey={(s) => s.name}
        loading={loading}
        emptyMessage={
          isFiltered ? "No matching salary slips" : "No salary slips yet"
        }
        showToolbar
        toolbarPlaceholder="Search by name or period…"
        searchValue={search}
        onSearch={(q) => resetPage(() => setSearch(q))}
        extraFilters={filtersNode}
        currentPage={page}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        totalItems={slipsProp ? filtered.length : totalItems}
        onPageChange={setPage}
      />

      {/* PDF Viewer Portal */}
      {pdfViewer && (
        <PdfViewerModal
          blobUrl={pdfViewer.blobUrl}
          title={pdfViewer.title}
          onClose={closePdfViewer}
          onDownload={handleDownloadFromViewer}
        />
      )}
    </>
  );
};
