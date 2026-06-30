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
import DatePickerInput from "../../components/calendar/DatePickerInput";
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
 
  Users,
  ReceiptText,
  SlidersHorizontal,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { getAllReceivables } from "../../api/Accounting/AccountApi";
import {
  getCompanyCostCenters,
  getCustomerList,
  getCompanyRecievableAccounts,
} from "../../api/lookupApi";
import { getSalesInvoiceById } from "../../api/salesApi";
import { getCompanyById } from "../../api/companySetupApi";
import { generateInvoicePDF } from "../../components/template/invoice/InvoiceTemplate1";
import InvoiceDetailModal, {
  type InvoiceDetail,
} from "../Sales/InvoiceDetailsModal";
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
import { useCurrencySymbols } from "../../hooks/Usecurrencysymbols";
import { extractCurrencyCodesFlat } from "../../utils/Extractcurrencycodes";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
type ReceivableVoucherType =
  | "Sales Invoice"
  | "Payment Entry"
  | "Journal Entry";

type ReceivableRecord = {
  posting_date?: string;
  customer?: string;
  party?: string;
  party_type?: string;
  receivable_account?: string;
  voucher_type?: string;
  voucher_no?: string;
  due_date?: string | null;
  po_no?: string | null;
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
  total_customers: number;
  overdue_amount: number;
  average_collection_days?: number;
  ageing_summary: {
    "0_30": number;
    "31_60": number;
    "61_90": number;
    "91_120": number;
    "121_above": number;
  };
};

type Receivable = {
  id: string;
  isSummary: boolean;
  customer: string;
  voucherType: string;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  currency?: string;
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

// ── Compact KPI Strip (mirrors GLView style) ─────────────────────────────────
const KpiStrip: React.FC<{
  kpis: KPIs;
  loading: boolean;
  formatAmount: (amount: number) => string;
}> = ({
  kpis,
  loading,
  formatAmount,
}) => {
  const sections = [
    {
      icon: (
       <ReceiptText size={11} className="text-emerald-500" />
      ),
      label: "Outstanding",
      items: [
        {
          label: "Total",
          value: formatAmount(kpis.total_outstanding),
          color: "text-emerald-600",
          bold: true,
        },
        {
          label: "Overdue",
          value: formatAmount(kpis.overdue_amount),
          color: "text-red-500",
          bold: true,
        },
        {
          label: "Invoiced",
        value: formatAmount(kpis.total_invoiced),
          color: "text-blue-500",
        },
      ],
    },
    {
      icon: <Users size={11} className="text-primary" />,
      label: "Customers",
      items: [
        {
          label: "Count",
          value: String(kpis.total_customers),
          color: "text-primary",
          bold: true,
        },
        {
          label: "Paid",
          value: formatAmount(kpis.total_paid),
          color: "text-emerald-600",
        },
        {
          label: "Avg Days",
          value: String(kpis.average_collection_days ?? "—"),
          color: "text-primary",
        },
      ],
    },
    {
      icon: <ReceiptText size={11} className="text-amber-400" />,
      label: "Aging",
      items: Object.entries(kpis.ageing_summary).map(([key, val]) => {
        const label =
          key === "121_above" ? "121d+" : `${key.replace("_", "–")}d`;
        const abs = Math.abs(val as number);
        const bucket =
          key === "0_30"
            ? "text-emerald-600"
            : key === "31_60"
              ? "text-amber-500"
              : key === "61_90"
                ? "text-orange-500"
                : "text-red-600";
        return {
  label,
  value: formatAmount(abs),
  color: bucket,
};
      }),
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      {sections.map((sec) => (
        <div
          key={sec.label}
          className={`bg-card border border-[var(--border)] rounded-lg px-3 py-2.5 flex flex-col gap-2 min-w-0 ${
            sec.items.length > 3 ? "flex-[2]" : "flex-1"
          }`}
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
                <span className="text-[10px] leading-tight text-muted truncate">
                  {item.label}
                </span>
                {loading ? (
                  <div className="h-3.5 w-12 bg-[var(--border)] rounded animate-pulse mt-0.5" />
                ) : (
                  <span
                    className={`leading-tight tabular-nums block ${item.color} ${
                      "bold" in item && item.bold
                        ? "font-extrabold"
                        : "font-semibold"
                    } ${
                      String(item.value ?? "").length > 14
                        ? "text-[10px]"
                        : String(item.value ?? "").length > 10
                          ? "text-[11px]"
                          : String(item.value ?? "").length > 7
                            ? "text-[12px]"
                            : "text-[13px]"
                    }`}
                  >
                    {item.value != null && item.value !== ""
                      ? String(item.value)
                      : "—"}
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

// ── Status Badge ─────────────────────────────────────────────────────────────
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

// ── Dropdown wrapper ─────────────────────────────────────────────────────────
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
      className={`h-7 px-2.5 text-[11px] font-semibold border rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap ${
        active
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
    className={`w-full text-left px-3 py-1.5 text-xs flex justify-between items-center transition-colors ${
      active
        ? "bg-primary/10 text-primary font-semibold"
        : "text-main hover:bg-row-hover"
    }`}
  >
    {children}
    {active && <FaCheck className="text-[9px] shrink-0" />}
  </button>
);

// ── Main Component ────────────────────────────────────────────────────────────
const AccountsReceivable = () => {
  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const { currencySymbol } = useCompanyStore();
  const sym = currencySymbol || "–";

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [postingDate, setPostingDate] = useState(getTodayDate());
  const [selectedGroupBy, setSelectedGroupBy] = useState<string[]>([]);
  const [selectedVoucherType, setSelectedVoucherType] = useState<
    ReceivableVoucherType | ""
  >("");
  const [selectedCostCenter, setSelectedCostCenter] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedReceivableAccount, setSelectedReceivableAccount] =
    useState("");

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lookup data
  const [costCenterOptions, setCostCenterOptions] = useState<LookupOption[]>(
    [],
  );
  const [customerOptions, setCustomerOptions] = useState<LookupOption[]>([]);
  const [receivableAccountOptions, setReceivableAccountOptions] = useState<
    LookupOption[]
  >([]);

  // Data state
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [company, setCompany] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<InvoiceDetail | null>(null);
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

  // ── Currency symbols + per-currency number formatting for the currencies
  // present in the currently loaded page of receivables. Falls back to the
  // company's base currency (the `sym`/store value) for rows that don't
  // carry their own `currency` field.
  const currencyCodes = useMemo(
    () => extractCurrencyCodesFlat(receivables),
    [receivables],
  );
  const { formatAmount } = useCurrencySymbols(currencyCodes);
  const baseCurrency = company?.default_currency || company?.currency;

  const displayAmount = useCallback(
  (currency: string | undefined | null, amount: number) => {
    return (
      formatAmount(currency || baseCurrency, amount, {
        withSymbol: true,
      }) || fmt(amount, "")
    );
  },
  [formatAmount, baseCurrency],
);

  // ── Effects ─────────────────────────────────────────────────────────────────
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
      getCustomerList(),
      getCompanyRecievableAccounts(),
    ])
      .then(([cc, cust, acc]) => {
        setCostCenterOptions(
          cc.map((c: any) => ({ label: c.label || c.value, value: c.value })),
        );
        setCustomerOptions(
          cust.map((c: any) => ({ label: c.label || c.value, value: c.value })),
        );
        setReceivableAccountOptions(
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
    selectedCustomers,
    selectedReceivableAccount,
    selectedVoucherType,
  ]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response: any = await getAllReceivables({
        page,
        page_size: pageSize,
        search: searchTerm,
        ...(filterStatus && filterStatus !== "all"
          ? { status: filterStatus }
          : {}),
        posting_date: postingDate || undefined,
        cost_center: selectedCostCenter || undefined,
        party: selectedCustomers.length
          ? selectedCustomers.join(",")
          : undefined,
        receivable_account: selectedReceivableAccount || undefined,
        group_by: selectedGroupBy.length
          ? (selectedGroupBy.join(",") as any)
          : undefined,
        voucher_type: selectedVoucherType || undefined,
      });

      if (response?.message?.data) {
        const payload = response.message.data;
        setKpis(payload.kpis);
        const backendData = payload.rows || payload.data || [];

        const mapped: Receivable[] = backendData.map(
          (row: ReceivableRecord, index: number) => {
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
              customer:
                row.customer || row.party || (isSummary ? "" : "Unknown"),
              voucherType: row.voucher_type || "-",
              invoicedAmount: row.amounts?.invoiced ?? row.invoiced ?? 0,
              paidAmount: row.amounts?.paid ?? row.paid ?? 0,
              outstandingAmount:
                row.amounts?.outstanding ?? row.outstanding ?? 0,
              currency: row.currency,
              due: dueDisplay,
              status: row.status || status,
              days: daysLeft,
              overdue,
            };
          },
        );

        setReceivables(mapped);
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
    selectedCustomers,
    selectedReceivableAccount,
    selectedVoucherType,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<Receivable>[]>(
    () => [
      {
        id: "id",
        accessorKey: "id",
        header: "Voucher No",
        size: 160,
        cell: ({ row }) =>
          row.original.isSummary ? null : (
            <span className="font-mono text-primary text-xs font-semibold">
              {row.original.id}
            </span>
          ),
      },
      {
        id: "customer",
        accessorKey: "customer",
        header: "Customer",
        size: 180,
        cell: ({ row }) => (
          <span
            className={`text-xs ${row.original.isSummary ? "font-bold text-main" : "text-main"}`}
          >
            {row.original.customer}
          </span>
        ),
      },
      {
        id: "voucherType",
        accessorKey: "voucherType",
        header: "Type",
        size: 130,
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
        size: 120,
        meta: { align: "right" },
        cell: ({ row }) => (
          <span
            className={`text-xs tabular-nums text-blue-500 ${row.original.isSummary ? "font-bold" : "font-medium"}`}
          >
            {formatAmount(
              row.original.currency || baseCurrency,
              row.original.invoicedAmount,
              { withSymbol: true },
            )}
          </span>
        ),
      },
      {
        id: "paidAmount",
        accessorKey: "paidAmount",
        header: "Paid",
        size: 120,
        meta: { align: "right" },
        cell: ({ row }) => (
          <span
            className={`text-xs tabular-nums text-emerald-600 ${row.original.isSummary ? "font-bold" : "font-medium"}`}
          >
            {formatAmount(
              row.original.currency || baseCurrency,
              row.original.paidAmount,
              { withSymbol: true },
            )}
          </span>
        ),
      },
      {
        id: "outstandingAmount",
        accessorKey: "outstandingAmount",
        header: "Outstanding",
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <span
            className={`text-xs tabular-nums ${row.original.outstandingAmount > 0 ? "text-red-500" : "text-emerald-600"} ${row.original.isSummary ? "font-extrabold" : "font-semibold"}`}
          >
            {formatAmount(
              row.original.currency || baseCurrency,
              row.original.outstandingAmount,
              { withSymbol: true },
            )}
          </span>
        ),
      },
      {
        id: "due",
        accessorKey: "due",
        header: "Due/Posting Date",
        size: 110,
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
        size: 130,
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
        size: 100,
        cell: ({ row }) =>
          row.original.isSummary ? null : (
            <StatusBadge status={row.original.status} />
          ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 70,
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
    [formatAmount, baseCurrency],
  );

  const table = useReactTable({
    data: receivables,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleViewClick = async (row: Receivable, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (row.voucherType === "Sales Invoice") {
      setDrawerOpen(true);
      setDrawerLoading(true);
      setDrawerData(null);
      try {
        const res = await getSalesInvoiceById(row.id);
        if (
          res?.message?.status_code === 200 ||
          res?.message?.status === "success"
        )
          setDrawerData(res?.message?.data as InvoiceDetail);
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

  const handleDrawerPdf = async (invoiceNumber: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);
    try {
      if (!company) return;
      const res = await getSalesInvoiceById(invoiceNumber);
      if (!res || res.message?.status_code !== 200) return;
      const blobUrl = await generateInvoicePDF(
        res.data as any,
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
      const res: any = await getAllReceivables({
        page: 1,
        page_size: 999999,
        search: searchTerm,
        posting_date: postingDate || undefined,
        cost_center: selectedCostCenter || undefined,
        party: selectedCustomers.length
          ? selectedCustomers.join(",")
          : undefined,
        receivable_account: selectedReceivableAccount || undefined,
        group_by: selectedGroupBy.length
          ? (selectedGroupBy.join(",") as any)
          : undefined,
      });
      if (!res?.message?.data) {
        alert("No data to export.");
        return;
      }
      const allData = res.message.data.rows || res.message.data.data || [];
      if (!allData.length) {
        alert("No data to export.");
        return;
      }
      const exportData = allData.map((row: ReceivableRecord) => ({
        "Voucher No": row.voucher_no || "",
        Customer: row.customer || row.party || "",
        "Party Type": row.party_type || "",
        "Receivable Account": row.receivable_account || "",
        "Voucher Type": row.voucher_type || "",
        "Cost Center": row.cost_center || "",
        "Invoiced Amount": row.amounts?.invoiced ?? row.invoiced ?? 0,
        "Paid Amount": row.amounts?.paid ?? row.paid ?? 0,
        "Credit Note": row.amounts?.credit_note ?? row.credit_note ?? 0,
        "Outstanding Amount": row.amounts?.outstanding ?? row.outstanding ?? 0,
        "Posting Date": row.posting_date || "",
        "Due Date": row.due_date || "",
        "Age (Days)": row.age || 0,
        Currency: row.currency || sym || "-",
        "PO No": row.po_no || "",
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(exportData),
        "Receivables",
      );
      saveAs(
        new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `Accounts_Receivable_${new Date().toISOString().split("T")[0]}.xlsx`,
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
    selectedCustomers.length > 0 ||
    selectedCostCenter !== "" ||
    selectedReceivableAccount !== "" ||
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
    setSelectedCustomers([]);
    setSelectedCostCenter("");
    setSelectedReceivableAccount("");
    setPostingDate(getTodayDate());
    setActiveDropdown(null);
  };

  const voucherTypeOptions: ReceivableVoucherType[] = [
    "Sales Invoice",
    "Payment Entry",
    "Journal Entry",
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {/* ── KPI Strip ── */}
      {kpis ? (
       <KpiStrip
  kpis={kpis}
  loading={isLoading}
  formatAmount={(amount) => displayAmount(baseCurrency, amount)}
/>
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

      {/* ── Filter Bar ── */}
      <div
        ref={dropdownRef}
        className="bg-card border border-[var(--border)] rounded-lg px-3 py-2 flex flex-wrap items-center gap-2"
      >
        {/* Icon + label */}
        <div className="flex items-center gap-1.5 mr-1">
          <SlidersHorizontal size={11} className="text-muted" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted">
            Filters
          </span>
        </div>

        <div className="w-px self-stretch bg-[var(--border)]" />

        {/* Date */}
        <div className="w-[140px]">
          <DatePickerInput
            name="postingDate"
            value={postingDate}
            onChange={(_, value) => setPostingDate(value)}
          />
        </div>

        {/* Status */}
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

        {/* Voucher Type */}
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

        {/* Group By */}
        <FilterDropdown
          label={`Group By${selectedGroupBy.length ? ` (${selectedGroupBy.length})` : ""}`}
          active={selectedGroupBy.length > 0}
          isOpen={activeDropdown === "groupBy"}
          onToggle={() =>
            setActiveDropdown(activeDropdown === "groupBy" ? null : "groupBy")
          }
        >
          {["customer", "voucher"].map((opt) => (
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

        {/* Customer */}
        <FilterDropdown
          label={`Customer${selectedCustomers.length ? ` (${selectedCustomers.length})` : ""}`}
          active={selectedCustomers.length > 0}
          isOpen={activeDropdown === "customer"}
          onToggle={() =>
            setActiveDropdown(activeDropdown === "customer" ? null : "customer")
          }
          width="w-60"
        >
          {customerOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted text-center">
              No options
            </div>
          ) : (
            customerOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-row-hover cursor-pointer text-xs text-main transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedCustomers.includes(opt.value)}
                  onChange={() =>
                    handleMultiSelect(
                      opt.value,
                      selectedCustomers,
                      setSelectedCustomers,
                    )
                  }
                  className="rounded border-[var(--border)] text-primary focus:ring-primary/50 cursor-pointer"
                />
                <span className="truncate">{opt.label}</span>
              </label>
            ))
          )}
        </FilterDropdown>

        {/* Cost Center */}
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

        {/* Account */}
        <FilterDropdown
          label="Account"
          active={selectedReceivableAccount !== ""}
          isOpen={activeDropdown === "account"}
          onToggle={() =>
            setActiveDropdown(activeDropdown === "account" ? null : "account")
          }
          width="w-60"
        >
          <DropdownItem
            active={selectedReceivableAccount === ""}
            onClick={() => {
              setSelectedReceivableAccount("");
              setActiveDropdown(null);
            }}
          >
            All Accounts
          </DropdownItem>
          {receivableAccountOptions.map((opt) => (
            <DropdownItem
              key={opt.value}
              active={selectedReceivableAccount === opt.value}
              onClick={() => {
                setSelectedReceivableAccount(opt.value);
                setActiveDropdown(null);
              }}
            >
              <span className="truncate pr-2">{opt.label}</span>
            </DropdownItem>
          ))}
        </FilterDropdown>

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="h-7 px-2 flex items-center gap-1 text-[11px] text-red-500 hover:bg-red-500/10 rounded-md transition-colors font-semibold"
          >
            <X size={10} /> Clear
          </button>
        )}

        {/* Search + Export — pushed right */}
        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search voucher, customer…"
            className="h-7 px-2.5 text-[11px] border border-[var(--border)] bg-app rounded-md text-main
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-48"
          />
          <button
            onClick={handleExportExcel}
            disabled={isExporting || receivables.length === 0}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold border border-[var(--border)]
                       bg-card text-muted hover:text-main hover:border-primary/40 rounded-md transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* ── Table ── */}
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
                        className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest
                                    text-muted whitespace-nowrap bg-row-hover
                                    border-b border-[var(--border)] ${align}`}
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
              {isLoading && receivables.length === 0 ? (
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
                    No receivables found matching your filters.
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

          {/* Loading overlay */}
          {isLoading && receivables.length > 0 && (
            <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] flex items-center justify-center z-20">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        <div
          className="border-t border-[var(--border)] bg-card px-3 py-2
                        flex flex-wrap items-center justify-between gap-2 text-xs text-muted"
        >
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
                className="p-1 rounded-md border border-[var(--border)] bg-card text-main
                           hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                    className={`px-2 py-0.5 text-[11px] rounded-md border transition-all ${
                      p === page
                        ? "bg-primary text-white border-primary font-bold"
                        : "border-[var(--border)] bg-card text-main hover:bg-row-hover"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages || isLoading}
                className="p-1 rounded-md border border-[var(--border)] bg-card text-main
                           hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <InvoiceDetailModal
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
        onViewPdf={() =>
          drawerData && handleDrawerPdf(drawerData.invoiceNumber)
        }
        onDownload={() =>
          drawerData &&
          company &&
          generateInvoicePDF(drawerData as any, company, "save")
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

export default AccountsReceivable;