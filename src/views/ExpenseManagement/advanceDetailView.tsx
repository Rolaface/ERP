import React, { useEffect, useRef, useState } from "react";
import ModalTable from "../../components/ui/Table/ModalTableInside";
import type { Column } from "../../components/ui/Table/type";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";
import {
  Wallet,
  CheckSquare,
  Clock,
  FileText,
  Download,
  Eye,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { getAdvanceStatementPdf } from "../../api/expenseClaimApi";

export interface ExpenseClaimEntry {
  name: string;
  parent: string;
  posting_date: string;
  advance_paid: number;
  allocated_amount: number;
  unclaimed_amount: number;
  return_amount: number;
  advance_account: string;
  exchange_rate: number;
  docstatus: number;
  claim_title?: string;
  description?: string;
}

export interface EmployeeAdvanceDetail {
  name: string;
  employee: string;
  employee_name: string;
  posting_date: string;
  company: string;
  department: string;
  currency: string;
  purpose: string;
  advance_amount: number;
  paid_amount: number;
  pending_amount: number;
  claimed_amount: number;
  return_amount: number;
  advance_account: string;
  mode_of_payment: string;
  repay_unclaimed_amount_from_salary: number;
  status: string;
  amended_from: string | null;
  expense_claims?: ExpenseClaimEntry[];
}

interface Props {
  data: EmployeeAdvanceDetail | null;
  loading?: boolean;
  onBack: () => void;
  dateRange: { from_date?: string; to_date?: string };
  onDateRangeChange: (range: { from_date?: string; to_date?: string }) => void;
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmt = (n?: number, currency = "INR") => {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

const initials = (name?: string) =>
  (name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: "#f3f4f6", color: "#6b7280" },
  unpaid: { bg: "#fef3c7", color: "#d97706" },
  paid: { bg: "#d1fae5", color: "#059669" },
  claimed: { bg: "#dbeafe", color: "#2563eb" },
  cancelled: { bg: "#fee2e2", color: "#dc2626" },
};

/* ── StatCell ────────────────────────────────────────────────────────────── */
interface StatCellProps {
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  valueClass?: string;
  highlight?: boolean;
}

const StatCell: React.FC<StatCellProps> = ({
  label,
  icon,
  value,
  valueClass = "",
  highlight = false,
}) => (
  <div
    className={`flex flex-col justify-center gap-1.5 px-4 sm:px-6 py-4 min-w-[120px] sm:min-w-[148px] flex-shrink-0 ${
      highlight ? "bg-danger/5" : ""
    }`}
  >
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted whitespace-nowrap">
        {label}
      </span>
    </div>
    <span
      className={`text-lg sm:text-[22px] font-black leading-none tabular-nums ${valueClass}`}
    >
      {value}
    </span>
  </div>
);

/* ── DetailCell ──────────────────────────────────────────────────────────── */
interface DetailCellProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

const DetailCell: React.FC<DetailCellProps> = ({ label, value, mono }) => (
  <div className="flex-1 flex flex-col items-center justify-center py-3 px-2 sm:px-3 min-w-[110px]">
    <span className="text-[9px] font-black uppercase tracking-widest mb-1.5 whitespace-nowrap text-muted">
      {label}
    </span>
    <span
      className={`text-[11px] font-medium text-main text-center leading-snug break-all ${
        mono ? "font-mono" : ""
      }`}
    >
      {value || "—"}
    </span>
  </div>
);

/* ── PdfViewerModal ──────────────────────────────────────────────────────── */
interface PdfViewerModalProps {
  blobUrl: string;
  blob: Blob;
  filename: string;
  title: string;
  onClose: () => void;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  blobUrl,
  blob,
  filename,
  title,
  onClose,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden"
        style={{
          width: "min(960px, 96vw)",
          height: "min(92vh, 920px)",
          zIndex: 10000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-theme bg-app shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-main leading-tight truncate">
                {title}
              </p>
              <p className="text-[10px] text-muted">
                Employee Advance Statement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => triggerDownload(blob, filename)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-theme hover:bg-primary/8 hover:border-primary/30 text-main transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
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
            title="Employee Advance Statement PDF"
          />
        </div>
      </div>
    </div>
  );
};

/* ── AdvancePdfButton ────────────────────────────────────────────────────── */
type PdfAction = "preview" | "download";

interface AdvancePdfButtonProps {
  advanceId: string;
  advanceName: string;
  fromDate?: string;
  toDate?: string;
}

const AdvancePdfButton: React.FC<AdvancePdfButtonProps> = ({
  advanceId,
  advanceName,
  fromDate,
  toDate,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{
    blobUrl: string;
    blob: Blob;
  } | null>(null);

  const cachedRef = useRef<Blob | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filename = `Advance_Statement_${advanceName.replace(/\s+/g, "_")}.pdf`;

  // Invalidate cached blob whenever filters or id change
  useEffect(() => {
    cachedRef.current = null;
  }, [advanceId, fromDate, toDate]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const fetchBlob = async (): Promise<Blob | null> => {
    if (cachedRef.current) return cachedRef.current;
    try {
      setLoading(true);
      setError(null);
      const blob = await getAdvanceStatementPdf(advanceId, {
        from_date: fromDate,
        to_date: toDate,
      });
      cachedRef.current = blob;
      return blob;
    } catch {
      setError("Failed to generate PDF. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (action: PdfAction) => {
    setOpen(false);
    const blob = await fetchBlob();
    if (!blob) return;

    if (action === "preview") {
      setViewer({ blobUrl: URL.createObjectURL(blob), blob });
    }
    if (action === "download") {
      triggerDownload(blob, filename);
    }
  };

  const closeViewer = () => {
    if (viewer) URL.revokeObjectURL(viewer.blobUrl);
    setViewer(null);
  };

  const items: {
    action: PdfAction;
    icon: React.ReactNode;
    label: string;
    sub: string;
  }[] = [
    {
      action: "preview",
      icon: <Eye className="w-3.5 h-3.5" />,
      label: "Preview",
      sub: "View in-app",
    },
    {
      action: "download",
      icon: <Download className="w-3.5 h-3.5" />,
      label: "Download",
      sub: "Save as PDF",
    },
  ];

  return (
    <>
      <div className="relative inline-flex" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-theme hover:bg-primary/8 hover:border-primary/30 text-main transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-primary" />
          )}
          <span>{loading ? "Generating…" : "PDF"}</span>
          <ChevronDown
            className={`w-3 h-3 text-muted transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-1.5 w-48 bg-card border border-theme rounded-xl shadow-xl overflow-hidden"
            style={{ zIndex: 9000 }}
          >
            {items.map(({ action, icon, label, sub }, idx) => (
              <button
                key={action}
                onClick={() => handleSelect(action)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-row-hover transition-colors group ${
                  idx < items.length - 1 ? "border-b border-theme/50" : ""
                }`}
              >
                <span className="text-muted group-hover:text-primary transition-colors">
                  {icon}
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-main leading-tight">
                    {label}
                  </p>
                  <p className="text-[10px] text-muted">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error toast */}
      {error && (
        <div
          className="fixed bottom-4 right-4 flex items-center gap-2 bg-danger text-white text-[12px] font-semibold px-4 py-2.5 rounded-xl shadow-lg"
          style={{ zIndex: 11000 }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-1 opacity-70 hover:opacity-100"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewer && (
        <PdfViewerModal
          blobUrl={viewer.blobUrl}
          blob={viewer.blob}
          filename={filename}
          title={advanceName}
          onClose={closeViewer}
        />
      )}
    </>
  );
};

/* ── EmployeeAdvanceDetailView ───────────────────────────────────────────── */
const EmployeeAdvanceDetailView: React.FC<Props> = ({
  data,
  loading,
  onBack,
  dateRange,
  onDateRangeChange,
}) => {
  const statusKey = data?.status?.toLowerCase() ?? "draft";
  const statusStyle = STATUS_COLORS[statusKey] ?? STATUS_COLORS.draft;
  const currency = data?.currency ?? "INR";
  const claims = data?.expense_claims ?? [];

  const fmtAmount = (n?: number) => fmt(n, currency);

  /* ── ModalTable columns ── */
  const claimColumns: Column<ExpenseClaimEntry>[] = [
    {
      key: "posting_date",
      header: "Date",
      render: (ec) => (
        <span className="text-[10px] font-black text-muted uppercase tracking-widest ">
          {fmtDate(ec.posting_date)}
        </span>
      ),
    },
    {
      key: "parent",
      header: "Claim ID",
      render: (ec) => (
        <span className="text-primary font-mono font-bold text-[11px] block overflow-hidden text-ellipsis ">
          {ec.parent}
        </span>
      ),
    },
    {
      key: "Claim Title",
      header: "Claim Title",
      render: (ec) => (
        <span className="text-muted text-[11px]">{ec.claim_title || "—"}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (ec) => (
        <span className="text-muted text-[11px]">{ec.description || "—"}</span>
      ),
    },
    {
      key: "allocated_amount",
      header: "Claimed",
      align: "right",
      render: (ec) => (
        <span className="text-success font-bold text-xs tabular-nums">
          {fmtAmount(ec.allocated_amount)}
        </span>
      ),
    },
    {
      key: "unclaimed_amount",
      header: "Remaining",
      align: "right",
      render: (ec) => (
        <span className="font-bold text-xs tabular-nums text-main">
          {fmtAmount(ec.unclaimed_amount)}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-4 p-4 sm:p-5 h-[calc(95vh-160px)]">
      {/* ── HEADER ── */}
      <div className="bg-card border border-theme rounded-2xl px-4 sm:px-5 py-3 flex items-center gap-3 shrink-0">
        {/* Back button */}
        <button
          onClick={onBack}
          aria-label="Go back"
          className="w-8 h-8 rounded-lg border border-theme bg-transparent cursor-pointer flex items-center justify-center text-muted hover:bg-row-hover transition-colors shrink-0"
          title="Back"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted">
            Employee Advance
          </p>
          <p className="text-[15px] font-black text-main leading-tight truncate">
            {data?.name ?? "—"}
          </p>
        </div>

        {data?.status && (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0"
            style={{
              background: statusStyle.bg,
              color: statusStyle.color,
            }}
          >
            {data.status}
          </span>
        )}
      </div>

      {/* ── STATS BAR ── */}
      <div className="bg-card border border-theme rounded-2xl flex items-stretch overflow-x-auto divide-x divide-theme shrink-0">
        <StatCell
          label="Total Advance"
          icon={<Wallet size={12} className="text-primary" />}
          value={fmtAmount(data?.advance_amount)}
          valueClass="text-primary"
        />
        <StatCell
          label="Total Claimed"
          icon={<CheckSquare size={12} className="text-success" />}
          value={fmtAmount(data?.claimed_amount)}
          valueClass="text-success"
        />
        <StatCell
          label="Unclaimed Amount"
          icon={
            <Clock
              size={12}
              className={
                (data?.pending_amount ?? 0) > 0 ? "text-danger" : "text-muted"
              }
            />
          }
          value={fmtAmount(data?.pending_amount)}
          valueClass={
            (data?.pending_amount ?? 0) > 0 ? "text-danger" : "text-muted"
          }
          highlight={(data?.pending_amount ?? 0) > 0}
        />

        {/* Details strip */}
        <div className="flex flex-1 items-stretch min-w-0">
          <div className="flex items-center justify-center px-3 bg-row-hover/50 border-r border-theme shrink-0">
            <span
              className="text-[8px] font-black uppercase tracking-[0.2em] text-muted select-none"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Details
            </span>
          </div>
          <div className="flex flex-1 divide-x divide-theme">
            <DetailCell label="Advance Date" value={fmtDate(data?.posting_date)} />
            <DetailCell label="Currency" value={data?.currency} />
            <DetailCell label="Mode of Payment" value={data?.mode_of_payment} />
            <DetailCell label="Purpose" value={data?.purpose} />
            <DetailCell
              label="Advance Account"
              value={data?.advance_account}
              mono
            />
          </div>
        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div className="bg-card border border-theme rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Loading */}
        {loading && (
          <div
            className="flex items-center justify-center h-48 gap-3 text-muted"
            role="status"
            aria-live="polite"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary animate-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span className="text-sm">Loading advance details…</span>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Employee identity row — Avatar + Name + DateRange + PDF Button */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-theme shrink-0 min-w-0 overflow-x-auto">
              {/* Left — Avatar + Name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-[13px] font-bold text-white shrink-0">
                  {initials(data.employee_name)}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-main leading-tight truncate">
                    {data.employee_name}
                  </p>
                  <p className="text-[11px] text-muted truncate">
                    {data.employee} · {data.department}
                  </p>
                </div>
              </div>

              {/* Right — Date Range + PDF Button */}
              <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                <DateRangeFilter
                  from={dateRange.from_date}
                  to={dateRange.to_date}
                  onChange={onDateRangeChange}
                />
                <AdvancePdfButton
                  advanceId={data.name}
                  advanceName={data.name}
                  fromDate={dateRange.from_date}
                  toDate={dateRange.to_date}
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
              <ModalTable<ExpenseClaimEntry>
                columns={claimColumns}
                data={claims}
                rowKey={(ec) => ec.name}
                emptyMessage="No expense claims yet"
                totalItems={claims.length}
                pageSize={claims.length || 10}
                showToolbar={false}
              />
            </div>
          </>
        )}

        {!loading && !data && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted text-center p-6">
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-2.5 opacity-50"
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[13px] font-semibold text-main">
              Advance not found
            </p>
            <p className="text-[12px] mt-1 max-w-[280px]">
              This advance could not be loaded. It may have been removed or the
              link is invalid.
            </p>
            <button
              onClick={onBack}
              className="mt-3.5 px-4 py-1.5 rounded-lg border border-theme bg-card text-main text-[12px] font-semibold cursor-pointer hover:bg-row-hover transition-colors"
            >
              Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAdvanceDetailView;