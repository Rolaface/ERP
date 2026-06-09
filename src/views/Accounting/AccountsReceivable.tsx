import React, { useState, useEffect, useRef } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import {
  FaFilter,
  FaDownload,
  FaEye,
  FaClock,
  FaExclamationTriangle,
  FaCheck,
} from "react-icons/fa";
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
  due: string;
  status: string;
  days: number;
  overdue: boolean;
  actions?: string;
};

type LookupOption = {
  label: string;
  value: string;
};

const AccountsReceivable = () => {
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const { currencySymbol } = useCompanyStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [postingDate, setPostingDate] = useState(getTodayDate());

  const [selectedGroupBy, setSelectedGroupBy] = useState<string[]>([]);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [costCenterOptions, setCostCenterOptions] = useState<LookupOption[]>(
    [],
  );
  const [customerOptions, setCustomerOptions] = useState<LookupOption[]>([]);
  const [receivableAccountOptions, setReceivableAccountOptions] = useState<
    LookupOption[]
  >([]);

  const [selectedVoucherType, setSelectedVoucherType] = useState<
    ReceivableVoucherType | ""
  >("");
  const voucherTypeOptions: ReceivableVoucherType[] = [
    "Sales Invoice",
    "Payment Entry",
    "Journal Entry",
  ];
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedReceivableAccount, setSelectedReceivableAccount] =
    useState<string>("");

  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) setCompany(res.data);
      })
      .catch(() => console.error("Failed to load company"));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [cc, cust, acc] = await Promise.all([
          getCompanyCostCenters(),
          getCustomerList(),
          getCompanyRecievableAccounts(),
        ]);
        setCostCenterOptions(
          cc.map((c: any) => ({ label: c.label || c.value, value: c.value })),
        );
        setCustomerOptions(
          cust.map((c: any) => ({ label: c.label || c.value, value: c.value })),
        );
        setReceivableAccountOptions(
          acc.map((a: any) => ({ label: a.label || a.value, value: a.value })),
        );
      } catch (error) {
        console.error(error);
      }
    };
    fetchLookups();
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

  const fetchData = async () => {
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
        const backendKpis = payload.kpis;
        const backendData = payload.rows || payload.data || [];

        setKpis(backendKpis);

        const mappedReceivables: Receivable[] = backendData.map(
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
                  const timeDiff = dueDateObj.getTime() - today.getTime();
                  daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
                }
                
                dueDisplay = formatDate(row.due_date);
                
              } else if (row.posting_date) {
                daysLeft = -(row.age || 0);
                dueDisplay = formatDate(row.posting_date);
                
              } else if ((row as any).report_date) {
                daysLeft = -(row.age || 0);
                dueDisplay = formatDate((row as any).report_date);
                
              } else {
                daysLeft = -(row.age || 0);
                dueDisplay = "—";
              }

              status = "Pending";
              if ((row.amounts?.outstanding ?? row.outstanding ?? 0) <= 0) {
                status = "Paid";
              } else if (daysLeft < 0) {
                status = "Overdue";
                overdue = true;
              }
            }

            const uniqueId =
              row.voucher_no ||
              `summary-${index}-${Math.random().toString(36).substring(7)}`;

            return {
              id: uniqueId,
              isSummary,
              customer:
                row.customer ||
                row.party ||
                (isSummary ? "" : "Unknown Customer"),
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

        setReceivables(mappedReceivables);
        setTotalPages(payload.pagination?.total_pages || 1);
        setTotalItems(
          payload.pagination?.total_items || mappedReceivables.length,
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    page,
    pageSize,
    searchTerm,
    filterStatus,
    postingDate,
    selectedGroupBy,
    sortBy,
    sortOrder,
    selectedCostCenter,
    selectedCustomers,
    selectedReceivableAccount,
    selectedVoucherType,
  ]);

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
        ) {
          setDrawerData(res?.message?.data as InvoiceDetail);
        }
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
        if (res?.status_code === 200 || res?.status === "success") {
          setPaymentDrawerData(res.data as PaymentEntryDetail);
        }
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

        if (journalData) {
          setJournalDrawerData(journalData as JournalEntryDetail);
        }
      } catch (err) {
        showApiError(err);
      } finally {
        setJournalDrawerLoading(false);
      }
    } else {
      console.log(`View detail is not supported for ${row.voucherType}.`);
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
        alert("No receivables data found to export.");
        setIsExporting(false);
        return;
      }

      const payload = res.message.data;
      const allData = payload.rows || payload.data || [];

      if (!allData.length) {
        alert("No receivables data found to export.");
        setIsExporting(false);
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
        Currency: row.currency || currencySymbol || "-",
        "PO No": row.po_no || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Receivables");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        data,
        `Accounts_Receivable_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (error) {
      console.error(error);
      alert("Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey);
    setSortOrder(order);
    setPage(1);
  };

  const handleMultiSelect = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((item) => item !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const stats = [
    {
      label: "Total Outstanding",
      value: `${currencySymbol || "-"} ${(kpis?.total_outstanding || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      label: "Overdue Amount",
      value: `${currencySymbol || "-"} ${(kpis?.overdue_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      label: "Total Customers",
      value: ` ${kpis?.total_customers || 0}`,
    },
    {
      label: "Total Amount",
      value: `${currencySymbol || "-"} ${(kpis?.total_invoiced || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
  ];

  const filteredReceivables = receivables.filter((rec) => {
    if (rec.isSummary) return true;
    const customerName = rec.customer || "";
    const recId = rec.id || "";

    const matchesSearch =
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || rec.status.toLowerCase() === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const ageingLabels = [
    { label: "0-30 Days", key: "0_30" },
    { label: "31-60 Days", key: "31_60" },
    { label: "61-90 Days", key: "61_90" },
    { label: "91-120 Days", key: "91_120" },
    { label: "121+ Days", key: "121_above" },
  ];
  const formatDate = (date?: string | Date | null): string => {
  if (!date) return "";

  try {
    let d: Date;

    if (date instanceof Date) {
      d = date;
    } else {
      let safeDateStr = String(date).trim();
      if (safeDateStr.includes(" ")) {
        safeDateStr = safeDateStr.replace(" ", "T");
      }
      d = new Date(safeDateStr);
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
      
  } catch (error) {
    return "";
  }
};

  const columns: Column<Receivable>[] = [
    {
      key: "id",
      header: "Voucher No",
      render: (row) =>
        row.isSummary ? null : (
          <span className="font-mono text-primary text-xs font-semibold">
            {row.id}
          </span>
        ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <span className={row.isSummary ? "font-bold text-main" : ""}>
          {row.customer}
        </span>
      ),
    },
    {
      key: "voucherType",
      header: "Type",
      render: (row) =>
        row.isSummary ? null : (
          <span className="text-xs">{row.voucherType}</span>
        ),
    },
    {
      key: "invoicedAmount",
      header: "Total",
      render: (row) => (
        <span className={row.isSummary ? "font-bold text-main" : ""}>
          {currencySymbol || "-"}{" "}
          {row.invoicedAmount.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
        </span>
      ),
    },
    {
      key: "paidAmount",
      header: "Paid",
      render: (row) => (
        <span className={row.isSummary ? "font-bold text-main" : ""}>
          {currencySymbol || "-"}{" "}
          {row.paidAmount.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
        </span>
      ),
    },
    {
      key: "outstandingAmount",
      header: "Outstanding",
      render: (row) => (
        <span
          className={`text-main ${row.isSummary ? "font-bold" : "font-semibold"}`}
        >
          {currencySymbol || "-"}{" "}
          {row.outstandingAmount.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
        </span>
      ),
    },
    {
      key: "due",
      header: "Due/Posted Date",
      render: (row) =>
        row.isSummary ? null : <span>{formatDate(row.due)}</span>,
    },
    {
      key: "days",
      header: "Aging",
      render: (row) =>
        row.isSummary ? null : (
          <div className="flex items-center gap-1">
            {row.overdue ? (
              <FaExclamationTriangle className="text-danger text-xs" />
            ) : (
              <FaClock className="text-muted text-xs" />
            )}
            <span
              className={`text-xs font-medium ${
                row.overdue ? "text-danger" : "text-muted"
              }`}
            >
              {Math.abs(row.days)} days {row.overdue ? "overdue" : "left"}
            </span>
          </div>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        if (row.isSummary) return null;
        const s = row.status.toLowerCase();
        return (
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold ${
              s === "paid"
                ? "bg-success text-success"
                : s === "overdue"
                  ? "bg-danger text-white"
                  : s === "pending"
                    ? "bg-warning text-warning"
                    : "bg-primary text-white"
            }`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) =>
        row.isSummary ? null : (
          <div className="flex justify-center gap-2">
            <button
              onClick={(e) => handleViewClick(row, e)}
              className="text-primary hover:opacity-80 transition-opacity"
            >
              <FaEye />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-6 bg-app p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-card rounded-lg border border-theme p-4 shadow-sm"
          >
            <p className="text-xs text-muted">{s.label}</p>
            {isLoading ? (
              <div className="h-7 w-24 bg-theme rounded mt-1 animate-pulse"></div>
            ) : (
              <p className="text-xl font-bold text-main mt-1">{s.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-lg border border-theme p-4 flex flex-wrap gap-4 justify-between items-center shadow-sm">
        <div
          ref={dropdownRef}
          className="flex flex-wrap gap-3 items-center w-full lg:w-auto"
        >
          <div className="relative">
            <input
              type="date"
              value={postingDate}
              onChange={(e) => setPostingDate(e.target.value)}
              className="px-3 py-2 border border-theme bg-app rounded-lg text-main text-sm h-[38px] w-full sm:w-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              title="Posting Date"
            />
          </div>

          <div className="relative">
            <button
              onClick={() =>
                setActiveDropdown(activeDropdown === "status" ? null : "status")
              }
              className={`px-4 py-2 border rounded-lg text-sm h-[38px] flex items-center gap-2 capitalize transition-all ${
                filterStatus !== "all"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-theme bg-app text-main hover:bg-theme/50"
              }`}
            >
              <FaFilter className="text-xs" /> {filterStatus}
            </button>
            {activeDropdown === "status" && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-theme rounded-lg z-20 w-40 shadow-xl overflow-hidden py-1">
                {["all", "pending", "overdue", "paid"].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setFilterStatus(s);
                      setActiveDropdown(null);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm capitalize transition-colors ${
                      filterStatus === s
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-main hover:bg-app"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() =>
                setActiveDropdown(
                  activeDropdown === "voucherType" ? null : "voucherType",
                )
              }
              className={`px-4 py-2 border rounded-lg text-sm h-[38px] flex items-center gap-2 transition-all ${
                selectedVoucherType !== ""
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-theme bg-app text-main hover:bg-theme/50"
              }`}
            >
              Voucher Type
            </button>

            {activeDropdown === "voucherType" && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-theme rounded-lg z-20 w-56 shadow-xl py-1">
                <button
                  onClick={() => {
                    setSelectedVoucherType("");
                    setActiveDropdown(null);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    selectedVoucherType === ""
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-main hover:bg-app"
                  }`}
                >
                  All Types
                </button>

                {voucherTypeOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedVoucherType(opt);
                      setActiveDropdown(null);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      selectedVoucherType === opt
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-main hover:bg-app"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() =>
                setActiveDropdown(
                  activeDropdown === "groupBy" ? null : "groupBy",
                )
              }
              className={`px-4 py-2 border rounded-lg text-sm h-[38px] flex items-center gap-2 capitalize transition-all ${
                selectedGroupBy.length > 0
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-theme bg-app text-main hover:bg-theme/50"
              }`}
            >
              Group By{" "}
              {selectedGroupBy.length > 0 && `(${selectedGroupBy.length})`}
            </button>
            {activeDropdown === "groupBy" && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-theme rounded-lg z-20 w-48 shadow-xl py-1">
                {["customer", "voucher"].map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-app cursor-pointer text-sm text-main transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupBy.includes(opt)}
                      onChange={() =>
                        handleMultiSelect(
                          opt,
                          selectedGroupBy,
                          setSelectedGroupBy,
                        )
                      }
                      className="rounded border-theme bg-app text-primary focus:ring-primary/50 cursor-pointer"
                    />
                    <span className="capitalize">{opt}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() =>
                setActiveDropdown(
                  activeDropdown === "customer" ? null : "customer",
                )
              }
              className={`px-4 py-2 border rounded-lg text-sm h-[38px] flex items-center gap-2 transition-all ${
                selectedCustomers.length > 0
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-theme bg-app text-main hover:bg-theme/50"
              }`}
            >
              Customer{" "}
              {selectedCustomers.length > 0 && `(${selectedCustomers.length})`}
            </button>
            {activeDropdown === "customer" && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-theme rounded-lg z-20 w-64 shadow-xl max-h-64 overflow-y-auto py-1">
                {customerOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-app cursor-pointer text-sm text-main transition-colors"
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
                      className="rounded border-theme bg-app text-primary focus:ring-primary/50 cursor-pointer"
                    />
                    <span className="truncate">{opt.label}</span>
                  </label>
                ))}
                {customerOptions.length === 0 && (
                  <div className="px-4 py-3 text-sm text-muted text-center">
                    No options available
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() =>
                setActiveDropdown(
                  activeDropdown === "costCenter" ? null : "costCenter",
                )
              }
              className={`px-4 py-2 border rounded-lg text-sm h-[38px] flex items-center gap-2 transition-all ${
                selectedCostCenter !== ""
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-theme bg-app text-main hover:bg-theme/50"
              }`}
            >
              Cost Center
            </button>
            {activeDropdown === "costCenter" && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-theme rounded-lg z-20 w-64 shadow-xl max-h-64 overflow-y-auto py-1">
                <button
                  onClick={() => {
                    setSelectedCostCenter("");
                    setActiveDropdown(null);
                  }}
                  className={` w-full text-left px-4 py-2 text-sm transition-colors flex justify-between items-center ${
                    selectedCostCenter === ""
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-main hover:bg-app"
                  }`}
                >
                  All Cost Centers
                  {selectedCostCenter === "" && (
                    <FaCheck className="text-[10px]" />
                  )}
                </button>
                {costCenterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelectedCostCenter(opt.value);
                      setActiveDropdown(null);
                    }}
                    className={` w-full text-left px-4 py-2 text-sm transition-colors flex justify-between items-center ${
                      selectedCostCenter === opt.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-main hover:bg-app"
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {selectedCostCenter === opt.value && (
                      <FaCheck className="text-[10px] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() =>
                setActiveDropdown(
                  activeDropdown === "account" ? null : "account",
                )
              }
              className={`px-4 py-2 border rounded-lg text-sm h-[38px] flex items-center gap-2 transition-all ${
                selectedReceivableAccount !== ""
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-theme bg-app text-main hover:bg-theme/50"
              }`}
            >
              Account
            </button>
            {activeDropdown === "account" && (
              <div className="absolute top-full right-0 mt-2 bg-card border border-theme rounded-lg z-20 w-64 shadow-xl max-h-64 overflow-y-auto py-1">
                <button
                  onClick={() => {
                    setSelectedReceivableAccount("");
                    setActiveDropdown(null);
                  }}
                  className={` w-full text-left px-4 py-2 text-sm transition-colors flex justify-between items-center ${
                    selectedReceivableAccount === ""
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-main hover:bg-app"
                  }`}
                >
                  All Accounts
                  {selectedReceivableAccount === "" && (
                    <FaCheck className="text-[10px]" />
                  )}
                </button>
                {receivableAccountOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelectedReceivableAccount(opt.value);
                      setActiveDropdown(null);
                    }}
                    className={` w-full text-left px-4 py-2 text-sm transition-colors flex justify-between items-center ${
                      selectedReceivableAccount === opt.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-main hover:bg-app"
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {selectedReceivableAccount === opt.value && (
                      <FaCheck className="text-[10px] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(selectedCustomers.length > 0 ||
            selectedCostCenter !== "" ||
            selectedReceivableAccount !== "" ||
            selectedVoucherType !== "" ||
            selectedGroupBy.length > 0 ||
            filterStatus !== "all" ||
            searchTerm !== "" ||
            postingDate !== getTodayDate()) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setSelectedVoucherType("");
                setSelectedGroupBy([]);
                setSelectedCustomers([]);
                setSelectedCostCenter("");
                setSelectedReceivableAccount("");
                setPostingDate(getTodayDate());
                setActiveDropdown(null);
              }}
              className="px-3 py-2 text-xs text-danger hover:bg-danger/10 rounded-lg transition-colors h-[38px] font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={handleExportExcel}
            disabled={isExporting || receivables.length === 0}
            className="px-4 py-2 bg-app border border-theme rounded-lg flex gap-2 items-center text-main text-sm hover:bg-theme/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-[38px]"
          >
            <FaDownload className="text-xs" />{" "}
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      <Table<Receivable>
        columns={columns}
        data={filteredReceivables}
        loading={isLoading}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        showToolbar={true}
        tableId="accounts-receivable"
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        toolbarPlaceholder="Search receivables..."
        enableColumnSelector
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => setPageSize(size)}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        emptyMessage="No receivables found matching your current filters."
      />

      <div className="bg-card rounded-lg border border-theme p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-main mb-4">
          Aging Report Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {ageingLabels.map((item) => (
            <div
              key={item.label}
              className="text-center p-5 bg-app rounded-lg border border-theme"
            >
              <p className="text-xs text-muted mb-2 font-medium">
                {item.label}
              </p>
              {isLoading ? (
                <div className="h-8 w-20 bg-theme rounded mx-auto mt-1 animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-main">
                  {kpis?.ageing_summary[
                    item.key as keyof typeof kpis.ageing_summary
                  ]
                    ? kpis.ageing_summary[
                        item.key as keyof typeof kpis.ageing_summary
                      ].toLocaleString(undefined, { maximumFractionDigits: 0 })
                    : "0"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

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
