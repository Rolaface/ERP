// ─── CustomerStatement.tsx ────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Eye,
  Download,
  Mail,
  X,
  ExternalLink,
  Loader2,
  Check,
  Scale
} from "lucide-react";
import ModalTable from "../../components/ui/Table/ModalTableInside";
import { getCustomerStatement, getCustomerStatementPdf } from "../../api/statementApi";
import { showApiError } from "../../utils/alert";
import { DateRangeFilter } from "../../components/ui/modal/DateRangeFilter";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import type {
  LedgerEntry,
  StatementData,
  CustomerStatementProps,
  StatCellProps,
  AgingCellProps,
} from "./Customerstatement.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const VOUCHER_OPTIONS = [
  { value: "Sales Invoice",    label: "Sales Invoice" },
  { value: "Purchase Invoice", label: "Purchase Invoice" },
  { value: "Payment Entry",    label: "Payment Entry" },
  { value: "Receipt",          label: "Receipt" },
  { value: "Credit Note",      label: "Credit Note" },
  { value: "Journal Entry",    label: "Journal Entry" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => (n || 0).toLocaleString("en-IN");

const fmtDateRange = (from?: string, to?: string) => {
  if (!from && !to) return "All dates";
  const d = (s: string) =>
    new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  if (from && to) return `${d(from)} – ${d(to)}`;
  return from ? `From ${d(from)}` : `Up to ${d(to!)}`;
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── StatCell ─────────────────────────────────────────────────────────────────

const StatCell = ({ label, icon, value, valueClass, highlight = false }: StatCellProps) => (
  <div className={`flex flex-col justify-center gap-1.5 px-4 sm:px-6 py-4 min-w-[120px] sm:min-w-[148px] flex-shrink-0 ${highlight ? "bg-danger/5" : ""}`}>
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted whitespace-nowrap">{label}</span>
    </div>
    <span className={`text-lg sm:text-[22px] font-black leading-none tabular-nums ${valueClass}`}>
      {fmt(value)}
    </span>
  </div>
);

// ─── AgingCell ────────────────────────────────────────────────────────────────

const AgingCell = ({ label, value, active = false, warn = false }: AgingCellProps) => {
  const isHot = warn && value > 0;
  return (
    <div className={`flex-1 flex flex-col items-center justify-center py-3 px-1 sm:px-2 ${active ? "bg-primary/8" : isHot ? "bg-danger/5" : ""}`}>
      <span className={`text-[9px] font-black uppercase tracking-widest mb-1.5 whitespace-nowrap ${active ? "text-primary" : isHot ? "text-danger" : "text-muted"}`}>
        {label}
      </span>
      <span className={`text-[12px] sm:text-[13px] font-black tabular-nums ${active ? "text-primary" : isHot ? "text-danger" : "text-main"}`}>
        {fmt(value)}
      </span>
    </div>
  );
};

// ─── PDF: Share Modal ─────────────────────────────────────────────────────────

interface ShareModalProps {
  customerName: string;
  dateRange:    string;
  blob:         Blob;
  defaultEmail?: string;
  onClose:      () => void;
}

const ShareModal = ({ customerName, dateRange, blob, defaultEmail = "", onClose }: ShareModalProps) => {
  const [email, setEmail] = useState(defaultEmail);
  const [note,  setNote]  = useState("");
  const [sent,  setSent]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSend = () => {
    // Swap this for your real email API call
    const subject = encodeURIComponent(`Customer Statement – ${customerName} (${dateRange})`);
    const body    = encodeURIComponent(`Hi,\n\nPlease find the statement for ${customerName} (${dateRange}) attached.\n\n${note ? `Note: ${note}\n\n` : ""}Regards`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_self");
    setSent(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 10001 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-card rounded-2xl shadow-2xl border border-theme overflow-hidden w-[94vw] max-w-[460px]"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-main leading-tight">Share Statement</p>
              <p className="text-[10px] text-muted truncate">{customerName} · {dateRange}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-muted transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Recipient Email</label>
            <input ref={inputRef} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full rounded-xl border border-theme bg-card px-3 py-2 text-sm font-medium text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
              Note <span className="font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="Add a short message…"
              className="w-full rounded-xl border border-theme bg-card px-3 py-2 text-sm font-medium text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-theme bg-row-hover/40 px-3 py-2.5">
            <FileText className="w-3.5 h-3.5 text-muted shrink-0" />
            <span className="text-[11px] text-muted truncate flex-1">
              Statement_{customerName.replace(/\s+/g, "_")}.pdf
            </span>
            <span className="text-[10px] text-muted shrink-0">{(blob.size / 1024).toFixed(0)} KB</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-theme bg-app/50">
          <button onClick={onClose}
            className="px-3.5 py-1.5 text-[12px] font-semibold rounded-xl border border-theme text-main hover:bg-row-hover transition-colors">
            Cancel
          </button>
          <button onClick={handleSend} disabled={!valid || sent}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold rounded-xl transition-all ${
              sent           ? "bg-success/10 text-success border border-success/30" :
              valid          ? "bg-primary text-white hover:opacity-90" :
                               "bg-primary/20 text-primary/40 cursor-not-allowed"}`}>
            {sent ? <><Check className="w-3.5 h-3.5" />Sent!</> : <><Mail className="w-3.5 h-3.5" />Send Email</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── PDF: Viewer Modal ────────────────────────────────────────────────────────

interface PdfViewerModalProps {
  blobUrl:       string;
  blob:          Blob;
  filename:      string;
  customerName:  string;
  dateRange:     string;
  defaultEmail?: string;
  onClose:       () => void;
}

const PdfViewerModal = ({ blobUrl, blob, filename, customerName, dateRange, defaultEmail, onClose }: PdfViewerModalProps) => {
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && !showShare && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, showShare]);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: "min(960px, 96vw)", height: "min(92vh, 920px)", zIndex: 10000 }}
          onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-theme bg-app shrink-0 gap-2 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-main leading-tight truncate">{customerName}</p>
                <p className="text-[10px] text-muted">Statement · {dateRange}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button onClick={() => setShowShare(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-theme hover:bg-primary/8 hover:border-primary/30 text-main transition-colors">
                <Mail className="w-3.5 h-3.5" /><span className="hidden sm:inline">Share</span>
              </button>
              <button onClick={() => triggerDownload(blob, filename)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-theme hover:bg-primary/8 hover:border-primary/30 text-main transition-colors">
                <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">Download</span>
              </button>
              <a href={blobUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-theme hover:bg-primary/8 hover:border-primary/30 text-main transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /><span className="hidden sm:inline">Open</span>
              </a>
              <button onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF iframe */}
          <div className="flex-1 bg-gray-100 overflow-hidden">
            <iframe src={blobUrl} className="w-full h-full border-0" title="Customer Statement PDF" />
          </div>
        </div>
      </div>

      {showShare && (
        <ShareModal customerName={customerName} dateRange={dateRange} blob={blob}
          defaultEmail={defaultEmail} onClose={() => setShowShare(false)} />
      )}
    </>
  );
};

// ─── PDF: Dropdown Menu ───────────────────────────────────────────────────────

type PdfAction = "preview" | "download" | "share";

interface PdfDropdownProps {
  onSelect: (a: PdfAction) => void;
  onClose:  () => void;
}

const PdfDropdown = ({ onSelect, onClose }: PdfDropdownProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const items: { action: PdfAction; icon: React.ReactNode; label: string; sub: string }[] = [
    { action: "preview",  icon: <Eye      className="w-3.5 h-3.5" />, label: "Preview",        sub: "View in-app" },
    { action: "download", icon: <Download className="w-3.5 h-3.5" />, label: "Download",       sub: "Save as PDF" },
    // { action: "share",    icon: <Mail     className="w-3.5 h-3.5" />, label: "Share via Email", sub: "Send to customer" },
  ];

  return (
    <div ref={ref}
      className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-theme rounded-xl shadow-xl overflow-hidden"
      style={{ zIndex: 9000 }}>
      {items.map(({ action, icon, label, sub }, idx) => (
        <button key={action} onClick={() => { onSelect(action); onClose(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-row-hover transition-colors group ${idx < items.length - 1 ? "border-b border-theme/50" : ""}`}>
          <span className="text-muted group-hover:text-primary transition-colors">{icon}</span>
          <div>
            <p className="text-[12px] font-semibold text-main leading-tight">{label}</p>
            <p className="text-[10px] text-muted">{sub}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

// ─── PDF: Button (orchestrator) ───────────────────────────────────────────────

interface PdfButtonProps {
  customerId:    string;
  customerName:  string;
  fromDate?:     string;
  toDate?:       string;
  voucherType?:  string;
  defaultEmail?: string;
}

const PdfButton = ({ customerId, customerName, fromDate, toDate, voucherType, defaultEmail }: PdfButtonProps) => {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [viewer,  setViewer]  = useState<{ blobUrl: string; blob: Blob } | null>(null);
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);

  const cachedRef = useRef<Blob | null>(null);
  const dateRange = fmtDateRange(fromDate, toDate);
  const filename  = `Statement_${customerName.replace(/\s+/g, "_")}_${dateRange.replace(/[\s–]/g, "")}.pdf`;

  // Invalidate cache when filters change
  useEffect(() => { cachedRef.current = null; }, [customerId, fromDate, toDate, voucherType]);

  const fetchBlob = async (): Promise<Blob | null> => {
    if (cachedRef.current) return cachedRef.current;
    try {
      setLoading(true);
      setError(null);
      // Replace with your actual API call: getCustomerStatementPdf(customerId, { from_date: fromDate, to_date: toDate, voucher_type: voucherType })
      const blob = await getCustomerStatementPdf(customerId, { from_date: fromDate, to_date: toDate, voucher_type: voucherType });
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
    const blob = await fetchBlob();
    if (!blob) return;
    if (action === "preview")  { setViewer({ blobUrl: URL.createObjectURL(blob), blob }); }
    if (action === "download") { triggerDownload(blob, filename); }
    if (action === "share")    { setShareBlob(blob); }
  };

  const closeViewer = () => {
    if (viewer) URL.revokeObjectURL(viewer.blobUrl);
    setViewer(null);
  };

  return (
    <>
      <div className="relative inline-flex">
        <button onClick={() => setOpen((v) => !v)} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-theme hover:bg-primary/8 hover:border-primary/30 text-main transition-colors disabled:opacity-60">
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            : <FileText className="w-3.5 h-3.5 text-primary" />}
          <span>{loading ? "Generating…" : "PDF"}</span>
          <ChevronDown className={`w-3 h-3 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && <PdfDropdown onSelect={handleSelect} onClose={() => setOpen(false)} />}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-danger text-white text-[12px] font-semibold px-4 py-2.5 rounded-xl shadow-lg" style={{ zIndex: 11000 }}>
          {error}
          <button onClick={() => setError(null)} className="ml-1 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {viewer && (
        <PdfViewerModal blobUrl={viewer.blobUrl} blob={viewer.blob} filename={filename}
          customerName={customerName} dateRange={dateRange} defaultEmail={defaultEmail} onClose={closeViewer} />
      )}

      {shareBlob && !viewer && (
        <ShareModal customerName={customerName} dateRange={dateRange} blob={shareBlob}
          defaultEmail={defaultEmail} onClose={() => setShareBlob(null)} />
      )}
    </>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const CustomerStatement = ({ customerId }: CustomerStatementProps) => {
  const [data,       setData]       = useState<StatementData | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Pagination
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(4);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [fromDate,    setFromDate]    = useState<string | undefined>();
  const [toDate,      setToDate]      = useState<string | undefined>();
  const [voucherType, setVoucherType] = useState("");

  // ─── Fetch ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!customerId) return;
    const fetchStatement = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await getCustomerStatement(customerId, page, pageSize, {
          from_date: fromDate, to_date: toDate, voucher_type: voucherType || undefined,
        });
        if (resp?.message?.status_code === 200) {
          setData(resp.message.data);
          setTotalPages(resp.message.data.pagination?.total_pages ?? 1);
          setTotalItems(resp.message.data.pagination?.total ?? 0);
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
  }, [customerId, page, pageSize, fromDate, toDate, voucherType]);

  useEffect(() => { setPage(1); }, [customerId, fromDate, toDate, voucherType]);

  // ─── Table columns ───────────────────────────────────────────────────────

  const statementColumns = [
    {
      key: "date",
      header: "Date",
      render: (row: LedgerEntry) => (
        <span className="text-[10px] font-black text-muted uppercase tracking-widest">
          {new Date(row.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "type",
      header: "Transaction",
      render: (row: LedgerEntry) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${row.debit > 0 ? "bg-warning/10 text-warning" : row.credit > 0 ? "bg-success/10 text-success" : "bg-row-hover text-muted"}`}>
            {row.debit > 0 ? <ArrowUpRight size={14} /> : row.credit > 0 ? <ArrowDownLeft size={14} /> : <FileText size={14} />}
          </div>
          <div>
            <p className="text-xs font-bold text-main">{row.type}</p>
            <p className="text-[9px] font-mono text-muted uppercase">{row.ref}</p>
          </div>
        </div>
      ),
    },
    {
      key: "debit", header: "Debit", align: "right" as const,
      render: (row: LedgerEntry) =>
        row.debit > 0
          ? <span className="text-xs font-bold text-warning">{fmt(row.debit)}</span>
          : <span className="text-muted text-xs">—</span>,
    },
    {
      key: "credit", header: "Credit", align: "right" as const,
      render: (row: LedgerEntry) =>
        row.credit > 0
          ? <span className="text-xs font-bold text-success">{fmt(row.credit)}</span>
          : <span className="text-muted text-xs">—</span>,
    },
    {
      key: "balance", header: "Balance", align: "right" as const,
      render: (row: LedgerEntry) => {
        const neg = row.balance < 0;
        return (
          <span className={`text-sm font-black tabular-nums ${row.balance === 0 ? "text-muted" : neg ? "text-danger" : "text-primary"}`}>
            {neg ? "−" : ""}{fmt(row.balance)}
          </span>
        );
      },
    },
    {
      key: "note", header: "Notes",
      render: (row: LedgerEntry) =>
        row.note && row.note !== "No Remarks"
          ? <span className="text-xs text-muted italic">{row.note}</span>
          : <span className="text-muted text-xs">—</span>,
    },
  ];

  // ─── Derived ─────────────────────────────────────────────────────────────

  const totalDebit      = data?.summary.totalDebit      ?? 0;
  const totalCredit     = data?.summary.totalCredit     ?? 0;
  const netOutstanding  = data?.summary.netOutstanding  ?? 0;
  console.log("🚀 ~ CustomerStatement ~ netOutstanding:", netOutstanding)

  // ─── Guards ───────────────────────────────────────────────────────────────

  if (loading)
    return (
      <div className="p-8 bg-card border border-theme rounded-2xl animate-shimmer">
        <p className="text-muted text-sm">Loading customer statement…</p>
      </div>
    );

  if (error)
    return (
      <div className="p-8 bg-card border border-theme rounded-2xl">
        <p className="text-danger text-sm">{error}</p>
      </div>
    );

  if (!data) return null;

  // ─── UI ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 p-4 sm:p-6">

      {/* Summary + Aging */}
      <div className="bg-card border border-theme rounded-2xl flex items-stretch overflow-x-auto divide-x divide-theme">
        <StatCell label="Total Debit"      icon={<TrendingUp   size={12} className="text-warning" />} value={totalDebit}     valueClass="text-warning" />
        <StatCell label="Total Credit"     icon={<TrendingDown size={12} className="text-success" />} value={totalCredit}    valueClass="text-success" />
        <StatCell label="Net Outstanding"
          icon={<Scale size={12} className={netOutstanding > 0 ? "text-danger" : "text-muted"} />}
          value={netOutstanding}
          valueClass={netOutstanding > 0 ? "text-danger" : "text-muted"}
          highlight={netOutstanding > 0} />

        <div className="flex flex-1 items-stretch min-w-0">
          <div className="flex items-center justify-center px-3 bg-row-hover/50 border-r border-theme shrink-0">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted select-none"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
              Aging
            </span>
          </div>
          <div className="flex flex-1 divide-x divide-theme">
            <AgingCell label="Current" value={data.aging.current}       active />
            <AgingCell label="1 – 30"  value={data.aging["1_30"]}  />
            <AgingCell label="31 – 60" value={data.aging["31_60"]} />
            <AgingCell label="61 – 90" value={data.aging["61_90"]} />
            <AgingCell label="90 +"    value={data.aging["90_plus"]}    warn />
          </div>
        </div>
      </div>

      {/* Ledger table */}
      <div className="bg-card border border-theme rounded-2xl overflow-visible">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-theme flex-wrap">

          {/* Left: title + count */}
          <div className="flex items-center gap-2">
            <FileText size={13} className="text-primary" />
            <span className="text-[11px] font-black uppercase tracking-widest text-main">Ledger Entries</span>
            <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">{totalItems}</span>
          </div>

          {/* Right: filters + PDF */}
          <div className="flex items-center gap-2 flex-wrap">
            <FilterSelect value={voucherType} options={VOUCHER_OPTIONS}
              onChange={(e) => { setVoucherType(e.target.value); setPage(1); }} />

            <DateRangeFilter from={fromDate} to={toDate}
              onChange={({ from_date, to_date }) => { setFromDate(from_date); setToDate(to_date); setPage(1); }} />

            <PdfButton
              customerId={customerId}
              customerName={data.customerName ?? customerId}
              fromDate={fromDate}
              toDate={toDate}
              voucherType={voucherType}
              defaultEmail={data.customerEmail}
            />
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
          enableExport
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          pageSizeOptions={[4, 10, 25]}
        />
      </div>
    </div>
  );
};

export default CustomerStatement;