import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  FaDownload,
  FaEye,
  FaClock,
  FaExclamationTriangle,
  FaCheck,
} from "react-icons/fa";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DollarSign,
  AlertTriangle,
  Users,
  ReceiptText,
  SlidersHorizontal,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { getAllPayables } from "../../api/Accounting/AccountApi";
import {
  getCompanyCostCenters,
  getSupplierList,
  getCompanyPayableAccounts,
} from "../../api/lookupApi";
import { getPurchaseInvoiceById } from "../../api/procurement/PurchaseInvoiceApi";
import { getCompanyById } from "../../api/companySetupApi";
import { generatePurchaseInvoicePDF } from "../../components/template/purchaseinvoicetemplete";
import PurchaseInvoiceDetailModal, {
  type PurchaseInvoiceDetail,
} from "../../components/procurement/purchaseinvoice/PurchaseInvoiceDetailsModal";
import { getPaymentById } from "../../api/CustomerPayment";
import PaymentEntryDetailModal, {
  type PaymentEntryDetail,
} from "../../components/PaymentEntryDetailModal";
import JournalEntryDetailModal, {
  type JournalEntryDetail,
} from "../../components/JournalEntryDetailModal";
import { getJournalEntryById } from "../../api/Accounting/JournalEntryApi";
import { showApiError } from "../../utils/alert";
import { useCompanyStore } from "../../store/companyStore";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

type PayableVoucherType =
  | "Purchase Invoice"
  | "Payment Entry"
  | "Journal Entry"
  | "Expense Claim";

type PayableRecord = {
  posting_date?: string;
  supplier?: string;
  party?: string;
  supplier_name?: string;
  party_type?: string;
  payable_account?: string;
  voucher_type?: string;
  voucher_no?: string;
  due_date?: string | null;
  bill_no?: string | null;
  bill_date?: string | null;
  cost_center?: string | null;
  currency?: string;
  status?: string;
  invoiced?: number;
  paid?: number;
  credit_note?: number;
  outstanding?: number;
  amounts?: {
    invoiced: number;
    paid: number;
    credit_note: number;
    outstanding: number;
  };
  age?: number;
};

type KPIs = {
  total_outstanding: number;
  total_invoiced: number;
  total_paid: number;
  total_suppliers: number;
  average_payment_days: number;
  overdue_amount: number;
  ageing_summary: {
    "0_30": number;
    "31_60": number;
    "61_90": number;
    "91_120": number;
    "121_above": number;
  };
};

type Payable = {
  id: string;
  isSummary: boolean;
  billNo: string;
  vendor: string;
  voucherType: string;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  due: string;
  status: string;
  days: number;
  overdue: boolean;
};

type LookupOption = { label: string; value: string };

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (n: number, sym: string) =>
  `${sym} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const formatDate = (date?: string | Date | null): string => {
  if (!date) return "";
  try {
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else {
      let s = String(date).trim();
      if (s.includes(" ")) s = s.replace(" ", "T");
      d = new Date(s);
    }
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(d)
      .replace(/ /g, "-")
      .toUpperCase();
  } catch {
    return "";
  }
};

// ── KPI Strip ─────────────────────────────────────────────────────────────────
const KpiStrip: React.FC<{ kpis: KPIs; sym: string; loading: boolean }> = ({
  kpis,
  sym,
  loading,
}) => {
  const sections = [
    {
      icon: <DollarSign size={11} className="text-emerald-400" />,
      label: "Outstanding",
      items: [
        {
          label: "Total",
          value: fmt(kpis.total_outstanding, sym),
          color: "text-emerald-600",
          bold: true,
        },
        {
          label: "Overdue",
          value: fmt(kpis.overdue_amount, sym),
          color: "text-red-500",
          bold: true,
        },
        {
          label: "Invoiced",
          value: fmt(kpis.total_invoiced, sym),
          color: "text-blue-500",
        },
      ],
    },
    {
      icon: <Users size={11} className="text-primary" />,
      label: "Suppliers",
      items: [
        {
          label: "Count",
          value: String(kpis.total_suppliers),
          color: "text-primary",
          bold: true,
        },
        {
          label: "Paid",
          value: fmt(kpis.total_paid, sym),
          color: "text-emerald-600",
        },
        {
          label: "Payment Days",
          value: kpis.average_payment_days,
          color: "text-primary"
        },
      ],
    },
    {
      icon: <ReceiptText size={11} className="text-amber-400" />,
      label: "Aging",
      items: Object.entries(kpis.ageing_summary).map(([key, val]) => {
        const label = key === "121_above"
          ? "121d+"
          : `${key.replace("_", "–")}d`;
        const abs = Math.abs(val as number);
        const bucket = key === "0_30"
          ? "text-emerald-600"
          : key === "31_60"
            ? "text-amber-500"
            : key === "61_90"
              ? "text-orange-500"
              : "text-red-600";
        return { label, value: fmt(abs, sym), color: bucket };
      }),
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      {sections.map((sec) => (
        <div
          key={sec.label}
          className="bg-card border border-[var(--border)] rounded-lg px-3 py-2.5 flex flex-col gap-2 flex-1 min-w-0"
        >
          <div className="flex items-center gap-1.5">
            {sec.icon}
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">
              {sec.label}
            </span>
          </div>
          <div
            className="grid gap-1 divide-x divide-[var(--border)]"
            style={{
              gridTemplateColumns:
                sec.items.length > 3
                  ? "repeat(5, minmax(0, 1fr))"
                  : "repeat(3, minmax(0, 1fr))",
            }}
          >
            {sec.items.map((item, i) => (
              <div
                key={i}
                className="flex flex-col gap-0.5 px-1 first:pl-0 last:pr-0"
              >
                <span className="text-[9px] leading-tight text-muted">
                  {item.label}
                </span>
                {loading ? (
                  <div className="h-3.5 w-12 bg-[var(--border)] rounded animate-pulse mt-0.5" />
                ) : (
                  <span
                    className={`leading-tight tabular-nums  block ${item.color} ${"bold" in item && item.bold ? "font-extrabold" : "font-semibold"} ${String(item.value ?? "").length > 14
                      ? "text-[8px]"
                      : String(item.value ?? "").length > 10
                        ? "text-[9px]"
                        : String(item.value ?? "").length > 7
                          ? "text-[10px]"
                          : "text-[11px]"
                      }`}
                  >
                    {item.value != null && item.value !== "" ? String(item.value) : "—"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status.toLowerCase();
  const cls =
    s === "paid"
      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20"
      : s === "overdue"
        ? "bg-red-500/15 text-red-600 border-red-500/20"
        : s === "pending"
          ? "bg-amber-500/15 text-amber-600 border-amber-500/20"
          : "bg-primary/15 text-primary border-primary/20";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${cls}`}
    >
      {status}
    </span>
  );
};

// ── Filter Dropdown ───────────────────────────────────────────────────────────
const FilterDropdown: React.FC<{
  label: string;
  active: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  width?: string;
}> = ({ label, active, isOpen, onToggle, children, width = "w-48" }) => (
  <div className="relative">
    <button
      onClick={onToggle}
      className={`h-7 px-2.5 text-[11px] font-semibold border rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap ${active
        ? "border-primary bg-primary/10 text-primary"
        : "border-[var(--border)] bg-card text-muted hover:text-main hover:border-primary/40"
        }`}
    >
      {label}
    </button>
    {isOpen && (
      <div
        className={`absolute top-full left-0 mt-1.5 bg-card border border-[var(--border)] rounded-lg z-30 ${width} shadow-xl py-1 max-h-56 overflow-y-auto`}
      >
        {children}
      </div>
    )}
  </div>
);

const DropdownItem: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-1.5 text-xs flex justify-between items-center transition-colors ${active
      ? "bg-primary/10 text-primary font-semibold"
      : "text-main hover:bg-row-hover"
      }`}
  >
    {children}
    {active && <FaCheck className="text-[9px] shrink-0" />}
  </button>
);

// ── Main Component ────────────────────────────────────────────────────────────
const AccountsPayable = () => {
  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const { currencySymbol } = useCompanyStore();
  const sym = currencySymbol || "–";

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [postingDate, setPostingDate] = useState(getTodayDate());
  const [selectedGroupBy, setSelectedGroupBy] = useState<string[]>([]);
  const [selectedVoucherType, setSelectedVoucherType] = useState<
    PayableVoucherType | ""
  >("");
  const [selectedCostCenter, setSelectedCostCenter] = useState("");
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedPayableAccount, setSelectedPayableAccount] = useState("");

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [costCenterOptions, setCostCenterOptions] = useState<LookupOption[]>(
    [],
  );
  const [supplierOptions, setSupplierOptions] = useState<LookupOption[]>([]);
  const [payableAccountOptions, setPayableAccountOptions] = useState<
    LookupOption[]
  >([]);

  const [payables, setPayables] = useState<Payable[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [company, setCompany] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<PurchaseInvoiceDetail | null>(
    null,
  );
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [paymentDrawerData, setPaymentDrawerData] =
    useState<PaymentEntryDetail | null>(null);
  const [paymentDrawerLoading, setPaymentDrawerLoading] = useState(false);
  const [journalDrawerOpen, setJournalDrawerOpen] = useState(false);
  const [journalDrawerData, setJournalDrawerData] =
    useState<JournalEntryDetail | null>(null);
  const [journalDrawerLoading, setJournalDrawerLoading] = useState(false);

  useEffect(() => {
    getCompanyById(COMPANY_ID).then((res) => {
      if (res?.status_code === 200) setCompany(res.data);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    Promise.all([
      getCompanyCostCenters(),
      getSupplierList(),
      getCompanyPayableAccounts(),
    ])
      .then(([cc, supp, acc]) => {
        setCostCenterOptions(
          cc.map((c: any) => ({ label: c.label || c.value, value: c.value })),
        );
        setSupplierOptions(
          supp.map((s: any) => ({ label: s.label || s.value, value: s.value })),
        );
        setPayableAccountOptions(
          acc.map((a: any) => ({ label: a.label || a.value, value: a.value })),
        );
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    filterStatus,
    postingDate,
    selectedGroupBy,
    selectedCostCenter,
    selectedSuppliers,
    selectedPayableAccount,
    selectedVoucherType,
  ]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response: any = await getAllPayables({
        page,
        page_size: pageSize,
        search: searchTerm,
        ...(filterStatus && filterStatus !== "all"
          ? { status: filterStatus }
          : {}),
        posting_date: postingDate || undefined,
        cost_center: selectedCostCenter || undefined,
        party: selectedSuppliers.length
          ? selectedSuppliers.join(",")
          : undefined,
        payable_account: selectedPayableAccount || undefined,
        group_by: selectedGroupBy.length
          ? (selectedGroupBy.join(",") as any)
          : undefined,
        voucher_type: selectedVoucherType || undefined,
      });

      if (response?.message?.data) {
        const payload = response.message.data;
        setKpis(payload.kpis);
        const backendData = payload.rows || payload.data || [];

        const mapped: Payable[] = backendData.map(
          (row: PayableRecord, index: number) => {
            const isSummary = !row.voucher_no;
            const today = new Date();
            let daysLeft = 0;
            let dueDisplay = "-";
            let status = "";
            let overdue = false;

            if (!isSummary) {
              if (row.due_date) {
                const safeDateStr = row.due_date.includes(" ")
                  ? row.due_date.replace(" ", "T")
                  : row.due_date;
                const dueDateObj = new Date(safeDateStr);
                if (!isNaN(dueDateObj.getTime())) {
                  daysLeft = Math.ceil(
                    (dueDateObj.getTime() - today.getTime()) /
                    (1000 * 3600 * 24),
                  );
                }
                dueDisplay = formatDate(row.due_date);
              } else if (row.posting_date) {
                daysLeft = -(row.age || 0);
                dueDisplay = formatDate(row.posting_date);
              } else {
                daysLeft = -(row.age || 0);
                dueDisplay = "—";
              }
              status = "Pending";
              if ((row.amounts?.outstanding ?? row.outstanding ?? 0) <= 0)
                status = "Paid";
              else if (daysLeft < 0) {
                status = "Overdue";
                overdue = true;
              }
            }

            return {
              id:
                row.voucher_no ||
                `summary-${index}-${Math.random().toString(36).substring(7)}`,
              isSummary,
              billNo: row.bill_no || "-",
              vendor:
                row.supplier ||
                row.party ||
                row.supplier_name ||
                (isSummary ? "" : "Unknown"),
              voucherType: row.voucher_type || "-",
              invoicedAmount: row.amounts?.invoiced ?? row.invoiced ?? 0,
              paidAmount: row.amounts?.paid ?? row.paid ?? 0,
              outstandingAmount:
                row.amounts?.outstanding ?? row.outstanding ?? 0,
              due: dueDisplay,
              status: row.status || status,
              days: daysLeft,
              overdue,
            };
          },
        );

        setPayables(mapped);
        setTotalPages(payload.pagination?.total_pages || 1);
        setTotalItems(payload.pagination?.total_items || mapped.length);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    pageSize,
    searchTerm,
    filterStatus,
    postingDate,
    selectedGroupBy,
    selectedCostCenter,
    selectedSuppliers,
    selectedPayableAccount,
    selectedVoucherType,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = useMemo<ColumnDef<Payable>[]>(
    () => [
      {
        id: "id",
        accessorKey: "id",
        header: "Voucher No",
        cell: ({ row }) =>
          row.original.isSummary ? null : (
            <span className="font-mono text-primary text-xs font-semibold">
              {row.original.id}
            </span>
          ),
      },
      {
        id: "billNo",
        accessorKey: "billNo",
        header: "Bill No",
        cell: ({ row }) =>
          row.original.isSummary ? null : (
            <span className="text-[10px] text-muted font-medium">
              {row.original.billNo}
            </span>
          ),
      },
      {
        id: "vendor",
        accessorKey: "vendor",
        header: "Party",
        cell: ({ row }) => (
          <span
            className={`text-xs ${row.original.isSummary ? "font-bold text-main" : "text-main"}`}
          >
            {row.original.vendor}
          </span>
        ),
      },
      {
        id: "voucherType",
        accessorKey: "voucherType",
        header: "Type",
        cell: ({ row }) =>
          row.original.isSummary ? null : (
            <span className="text-[10px] text-muted font-medium">
              {row.original.voucherType}
            </span>
          ),
      },
      {
        id: "invoicedAmount",
        accessorKey: "invoicedAmount",
        header: "Total",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span
            className={`text-xs tabular-nums text-blue-500 ${row.original.isSummary ? "font-bold" : "font-medium"}`}
          >
            {fmt(row.original.invoicedAmount, sym)}
          </span>
        ),
      },
      {
        id: "paidAmount",
        accessorKey: "paidAmount",
        header: "Paid",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span
            className={`text-xs tabular-nums text-emerald-600 ${row.original.isSummary ? "font-bold" : "font-medium"}`}
          >
            {fmt(row.original.paidAmount, sym)}
          </span>
        ),
      },
      {
        id: "outstandingAmount",
        accessorKey: "outstandingAmount",
        header: "Outstanding",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span
            className={`text-xs tabular-nums ${row.original.outstandingAmount > 0 ? "text-red-500" : "text-emerald-600"} ${row.original.isSummary ? "font-extrabold" : "font-semibold"}`}
          >
            {fmt(row.original.outstandingAmount, sym)}
          </span>
        ),
      },
      {
        id: "due",
        accessorKey: "due",
        header: "Due/Posting Date",
        cell: ({ row }) =>
          row.original.isSummary ? null : (
            <span className="text-[11px] text-muted tabular-nums">
              {formatDate(row.original.due)}
            </span>
          ),
      },

      {
        id: "days",
        accessorKey: "days",
        header: "Aging",
        cell: ({ row }) =>
          row.original.isSummary ? null : (
            <div className="flex items-center gap-1">
              {row.original.overdue ? (
                <FaExclamationTriangle className="text-red-500 text-[9px]" />
              ) : (
                <FaClock className="text-muted text-[9px]" />
              )}
              <span
                className={`text-[10px] font-medium ${row.original.overdue ? "text-red-500" : "text-muted"}`}
              >
                {Math.abs(row.original.days)}d{" "}
                {row.original.overdue ? "overdue" : "left"}
              </span>
            </div>
          ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.isSummary ? null : (
            <StatusBadge status={row.original.status} />
          ),
      },
      {
        id: "actions",
        header: "Actions",
        meta: { align: "center" },
        cell: ({ row }) =>
          row.original.isSummary ? null : (
            <div className="flex justify-center">
              <button
                onClick={(e) => handleViewClick(row.original, e)}
                className="p-1.5 rounded-md text-muted hover:text-primary hover:bg-primary/10 transition-all"
              >
                <FaEye className="text-xs" />
              </button>
            </div>
          ),
      },
    ],
    [sym],
  );

  const table = useReactTable({
    data: payables,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const handleViewClick = async (row: Payable, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (row.voucherType === "Purchase Invoice") {
      setDrawerOpen(true);
      setDrawerLoading(true);
      setDrawerData(null);
      try {
        const res = await getPurchaseInvoiceById(row.id);
        if (res?.status === "success")
          setDrawerData(res.data as PurchaseInvoiceDetail);
      } catch (err) {
        showApiError(err);
      } finally {
        setDrawerLoading(false);
      }
    } else if (row.voucherType === "Payment Entry") {
      setPaymentDrawerOpen(true);
      setPaymentDrawerLoading(true);
      setPaymentDrawerData(null);
      try {
        const res = (await getPaymentById(row.id))?.message;
        if (res?.status_code === 200 || res?.status === "success")
          setPaymentDrawerData(res.data as PaymentEntryDetail);
      } catch (err) {
        showApiError(err);
      } finally {
        setPaymentDrawerLoading(false);
      }
    } else if (row.voucherType === "Journal Entry") {
      setJournalDrawerOpen(true);
      setJournalDrawerLoading(true);
      setJournalDrawerData(null);
      try {
        const res = await getJournalEntryById(row.id);
        const journalData = res?.message?.data || res?.data;
        if (journalData)
          setJournalDrawerData(journalData as JournalEntryDetail);
      } catch (err) {
        showApiError(err);
      } finally {
        setJournalDrawerLoading(false);
      }
    }
  };

  const handleDrawerPdf = async (pId: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);
    try {
      if (!company) return;
      const res = await getPurchaseInvoiceById(pId);
      if (!res || res.status !== "success") return;
      const blobUrl = await generatePurchaseInvoicePDF(
        res.data,
        company,
        "bloburl",
      );
      setDrawerPdfUrl(blobUrl);
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerPdfLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const res: any = await getAllPayables({
        page: 1,
        page_size: 999999,
        search: searchTerm,
        posting_date: postingDate || undefined,
        cost_center: selectedCostCenter || undefined,
        party: selectedSuppliers.length
          ? selectedSuppliers.join(",")
          : undefined,
        payable_account: selectedPayableAccount || undefined,
        group_by: selectedGroupBy.length
          ? (selectedGroupBy.join(",") as any)
          : undefined,
      });
      if (!res?.message?.data) {
        alert("No data to export.");
        return;
      }
      const allData = (
        res.message.data.rows ||
        res.message.data.data ||
        []
      ).filter((r: PayableRecord) => r.voucher_no);
      if (!allData.length) {
        alert("No data to export.");
        return;
      }
      const exportData = allData.map((row: PayableRecord) => ({
        "Voucher No": row.voucher_no || "",
        "Bill No": row.bill_no || "",
        Supplier: row.supplier || row.party || row.supplier_name || "",
        "Voucher Type": row.voucher_type || "",
        "Cost Center": row.cost_center || "",
        "Invoiced Amount": row.amounts?.invoiced ?? row.invoiced ?? 0,
        "Paid Amount": row.amounts?.paid ?? row.paid ?? 0,
        "Outstanding Amount": row.amounts?.outstanding ?? row.outstanding ?? 0,
        "Posting Date": row.posting_date || "",
        "Due Date": row.due_date || "",
        "Age (Days)": row.age || 0,
        Currency: row.currency || sym || "-",
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(exportData),
        "Payables",
      );
      saveAs(
        new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `Accounts_Payable_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (err) {
      console.error(err);
      alert("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleMultiSelect = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setSelected(
      selected.includes(value)
        ? selected.filter((i) => i !== value)
        : [...selected, value],
    );
  };

  const hasActiveFilters =
    selectedSuppliers.length > 0 ||
    selectedCostCenter !== "" ||
    selectedPayableAccount !== "" ||
    selectedVoucherType !== "" ||
    selectedGroupBy.length > 0 ||
    filterStatus !== "all" ||
    searchTerm !== "" ||
    postingDate !== getTodayDate();

  const clearAll = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setSelectedVoucherType("");
    setSelectedGroupBy([]);
    setSelectedSuppliers([]);
    setSelectedCostCenter("");
    setSelectedPayableAccount("");
    setPostingDate(getTodayDate());
    setActiveDropdown(null);
  };

  const voucherTypeOptions: PayableVoucherType[] = [
    "Purchase Invoice",
    "Payment Entry",
    "Journal Entry",
    "Expense Claim",
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* KPI Strip */}
      {kpis ? (
        <KpiStrip kpis={kpis} sym={sym} loading={isLoading} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-2">


          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-[var(--border)] rounded-lg px-3 py-2.5 h-16 animate-pulse flex-1"
            />
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div
        ref={dropdownRef}
        className="bg-card border border-[var(--border)] rounded-lg px-3 py-2 flex flex-wrap items-center gap-2"
      >
        <div className="flex items-center gap-1.5 mr-1">
          <SlidersHorizontal size={11} className="text-muted" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted">
            Filters
          </span>
        </div>
        <div className="w-px self-stretch bg-[var(--border)]" />

        <input
          type="date"
          value={postingDate}
          onChange={(e) => setPostingDate(e.target.value)}
          className="h-7 px-2 text-[11px] border border-[var(--border)] bg-app rounded-md text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
        />

        <FilterDropdown
          label={filterStatus === "all" ? "Status" : filterStatus}
          active={filterStatus !== "all"}
          isOpen={activeDropdown === "status"}
          onToggle={() =>
            setActiveDropdown(activeDropdown === "status" ? null : "status")
          }
        >
          {["all", "pending", "overdue", "paid"].map((s) => (
            <DropdownItem
              key={s}
              active={filterStatus === s}
              onClick={() => {
                setFilterStatus(s);
                setActiveDropdown(null);
              }}
            >
              <span className="capitalize">
                {s === "all" ? "All Statuses" : s}
              </span>
            </DropdownItem>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label={selectedVoucherType || "Voucher Type"}
          active={selectedVoucherType !== ""}
          isOpen={activeDropdown === "voucherType"}
          onToggle={() =>
            setActiveDropdown(
              activeDropdown === "voucherType" ? null : "voucherType",
            )
          }
          width="w-52"
        >
          <DropdownItem
            active={selectedVoucherType === ""}
            onClick={() => {
              setSelectedVoucherType("");
              setActiveDropdown(null);
            }}
          >
            All Types
          </DropdownItem>
          {voucherTypeOptions.map((opt) => (
            <DropdownItem
              key={opt}
              active={selectedVoucherType === opt}
              onClick={() => {
                setSelectedVoucherType(opt);
                setActiveDropdown(null);
              }}
            >
              {opt}
            </DropdownItem>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label={`Group By${selectedGroupBy.length ? ` (${selectedGroupBy.length})` : ""}`}
          active={selectedGroupBy.length > 0}
          isOpen={activeDropdown === "groupBy"}
          onToggle={() =>
            setActiveDropdown(activeDropdown === "groupBy" ? null : "groupBy")
          }
        >
          {["supplier", "voucher"].map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-row-hover cursor-pointer text-xs text-main transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedGroupBy.includes(opt)}
                onChange={() =>
                  handleMultiSelect(opt, selectedGroupBy, setSelectedGroupBy)
                }
                className="rounded border-[var(--border)] text-primary focus:ring-primary/50 cursor-pointer"
              />
              <span className="capitalize">{opt}</span>
            </label>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label={`Supplier${selectedSuppliers.length ? ` (${selectedSuppliers.length})` : ""}`}
          active={selectedSuppliers.length > 0}
          isOpen={activeDropdown === "supplier"}
          onToggle={() =>
            setActiveDropdown(activeDropdown === "supplier" ? null : "supplier")
          }
          width="w-60"
        >
          {supplierOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted text-center">
              No options
            </div>
          ) : (
            supplierOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-row-hover cursor-pointer text-xs text-main transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSuppliers.includes(opt.value)}
                  onChange={() =>
                    handleMultiSelect(
                      opt.value,
                      selectedSuppliers,
                      setSelectedSuppliers,
                    )
                  }
                  className="rounded border-[var(--border)] text-primary focus:ring-primary/50 cursor-pointer"
                />
                <span className="truncate">{opt.label}</span>
              </label>
            ))
          )}
        </FilterDropdown>

        <FilterDropdown
          label="Cost Center"
          active={selectedCostCenter !== ""}
          isOpen={activeDropdown === "costCenter"}
          onToggle={() =>
            setActiveDropdown(
              activeDropdown === "costCenter" ? null : "costCenter",
            )
          }
          width="w-60"
        >
          <DropdownItem
            active={selectedCostCenter === ""}
            onClick={() => {
              setSelectedCostCenter("");
              setActiveDropdown(null);
            }}
          >
            All Cost Centers
          </DropdownItem>
          {costCenterOptions.map((opt) => (
            <DropdownItem
              key={opt.value}
              active={selectedCostCenter === opt.value}
              onClick={() => {
                setSelectedCostCenter(opt.value);
                setActiveDropdown(null);
              }}
            >
              <span className="truncate pr-2">{opt.label}</span>
            </DropdownItem>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label="Account"
          active={selectedPayableAccount !== ""}
          isOpen={activeDropdown === "account"}
          onToggle={() =>
            setActiveDropdown(activeDropdown === "account" ? null : "account")
          }
          width="w-60"
        >
          <DropdownItem
            active={selectedPayableAccount === ""}
            onClick={() => {
              setSelectedPayableAccount("");
              setActiveDropdown(null);
            }}
          >
            All Accounts
          </DropdownItem>
          {payableAccountOptions.map((opt) => (
            <DropdownItem
              key={opt.value}
              active={selectedPayableAccount === opt.value}
              onClick={() => {
                setSelectedPayableAccount(opt.value);
                setActiveDropdown(null);
              }}
            >
              <span className="truncate pr-2">{opt.label}</span>
            </DropdownItem>
          ))}
        </FilterDropdown>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="h-7 px-2 flex items-center gap-1 text-[11px] text-red-500 hover:bg-red-500/10 rounded-md transition-colors font-semibold"
          >
            <X size={10} /> Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search voucher, supplier…"
            className="h-7 px-2.5 text-[11px] border border-[var(--border)] bg-app rounded-md text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-48"
          />
          <button
            onClick={handleExportExcel}
            disabled={isExporting || payables.length === 0}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold border border-[var(--border)] bg-card text-muted hover:text-main hover:border-primary/40 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <RefreshCw size={10} className="animate-spin" />
            ) : (
              <FaDownload className="text-[9px]" />
            )}
            {isExporting ? "Exporting…" : "Export"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 relative">
          <table
            className="text-left border-collapse w-full"
            style={{ tableLayout: "auto" }}
          >
            <thead className="sticky top-0 z-10 border-b border-[var(--border)]">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const align =
                      (header.column.columnDef.meta as any)?.align === "right"
                        ? "text-right"
                        : "text-left";
                    return (
                      <th
                        key={header.id}
                        className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted whitespace-nowrap bg-row-hover border-b border-[var(--border)] ${align}`}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading && payables.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{ height: `${Math.min(pageSize, 10) * 40}px` }}
                  >
                    <div className="flex justify-center items-center h-full">
                      <Loader2 size={20} className="animate-spin text-muted" />
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-16 text-center text-xs text-muted"
                  >
                    No payables found matching your filters.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-row-hover transition-colors h-[38px] ${row.original.isSummary ? "bg-row-hover/50" : ""}`}
                    style={{ borderBottom: "1px solid rgba(128,128,128,0.12)" }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const align =
                        (cell.column.columnDef.meta as any)?.align === "right"
                          ? "text-right"
                          : "text-left";
                      return (
                        <td
                          key={cell.id}
                          className={`px-3 py-1 whitespace-nowrap ${align}`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {isLoading && payables.length > 0 && (
            <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] flex items-center justify-center z-20">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-[var(--border)] bg-card px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span className="text-[11px]">
            {totalItems > 0 ? (
              <>
                Showing{" "}
                <span className="font-semibold text-main">
                  {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, totalItems)}
                </span>{" "}
                of <span className="font-semibold text-main">{totalItems}</span>
              </>
            ) : (
              "No entries"
            )}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1 || isLoading}
                className="p-1 rounded-md border border-[var(--border)] bg-card text-main hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    disabled={isLoading}
                    className={`px-2 py-0.5 text-[11px] rounded-md border transition-all ${p === page ? "bg-primary text-white border-primary font-bold" : "border-[var(--border)] bg-card text-main hover:bg-row-hover"}`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages || isLoading}
                className="p-1 rounded-md border border-[var(--border)] bg-card text-main hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PurchaseInvoiceDetailModal
        open={drawerOpen}
        data={drawerData}
        loading={drawerLoading}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerData(null);
          setDrawerPdfUrl(null);
        }}
        pdfUrl={drawerPdfUrl}
        pdfLoading={drawerPdfLoading}
        onViewPdf={() => drawerData && handleDrawerPdf(drawerData.pId)}
        onDownload={() =>
          drawerData &&
          company &&
          generatePurchaseInvoicePDF(drawerData, company, "save")
        }
        onClosePdf={() => {
          if (drawerPdfUrl?.startsWith("blob:"))
            URL.revokeObjectURL(drawerPdfUrl);
          setDrawerPdfUrl(null);
        }}
      />
      <PaymentEntryDetailModal
        open={paymentDrawerOpen}
        data={paymentDrawerData}
        loading={paymentDrawerLoading}
        onClose={() => {
          setPaymentDrawerOpen(false);
          setPaymentDrawerData(null);
        }}
      />
      <JournalEntryDetailModal
        open={journalDrawerOpen}
        data={journalDrawerData}
        loading={journalDrawerLoading}
        onClose={() => {
          setJournalDrawerOpen(false);
          setJournalDrawerData(null);
        }}
      />
    </div>
  );
};

export default AccountsPayable;
