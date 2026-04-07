import React, { useEffect, useMemo, useState } from "react";
import { getAllQuotations } from "../../api/quotationApi";
import { getAllProformaInvoices } from "../../api/proformaInvoiceApi";
import {
  getAllCreditNotes,
  getAllDebitNotes,
  getAllSalesInvoices,
} from "../../api/salesApi";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { showLoading, closeSwal, showSuccess, showApiError } from "../../utils/alert";

/*  TYPES  */

type ReportType =
  | "All"
  | "Quotations"
  | "Proforma Invoice"
  | "Invoices"
  | "Credit Notes"
  | "Debit Notes";

type ReportRow = {
  type: ReportType;
  documentNo: string;
  customerName: string;
  date: string;
  dueDate?: string;
  currency?: string;
  amount?: number;
  status?: string;
  receiptNo?: string;
};

/*  HELPERS  */

const dateStringForInput = (date: string) => {
  const d = new Date(date);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const parts = String(date).split(" ");
  const datePart = parts[0] ?? "";
  const [month, day, year] = datePart.split("/");
  if (!year || !month || !day) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const formatDate = (raw: string) => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return raw;
};

/*  REPORT TYPE OPTIONS  */

const REPORT_TYPE_OPTIONS: { label: string; value: ReportType | "All" }[] = [
  { label: "All Types", value: "All" },
  { label: "Quotations", value: "Quotations" },
  { label: "Proforma Invoice", value: "Proforma Invoice" },
  { label: "Invoices", value: "Invoices" },
  { label: "Credit Notes", value: "Credit Notes" },
  { label: "Debit Notes", value: "Debit Notes" },
];

export default function ReportTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [reportType, setReportType] = useState<ReportType | "All">("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ── Data fetching ── */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const fetchAll = reportType === "All";

        const [qRes, pRes, iRes, cRes, dRes] = await Promise.all([
          fetchAll || reportType === "Quotations"
            ? getAllQuotations(1, 1000, {})
            : Promise.resolve(null),
          fetchAll || reportType === "Proforma Invoice"
            ? getAllProformaInvoices(1, 1000)
            : Promise.resolve(null),
          fetchAll || reportType === "Invoices"
            ? getAllSalesInvoices(1, 1000)
            : Promise.resolve(null),
          fetchAll || reportType === "Credit Notes"
            ? getAllCreditNotes(1, 1000)
            : Promise.resolve(null),
          fetchAll || reportType === "Debit Notes"
            ? getAllDebitNotes(1, 1000)
            : Promise.resolve(null),
        ]);

        const mappedQuotations: ReportRow[] = Array.isArray(qRes?.data?.quotations)
          ? qRes.data.quotations.map((q: any) => ({
              type: "Quotations" as ReportType,
              documentNo: q?.id ?? q?.quotationNumber ?? "",
              customerName: q?.customerName ?? q?.customer?.name ?? q?.clientName ?? q?.name ?? "",
              date: q?.transactionDate ?? q?.quotationDate ?? "",
              dueDate: q?.validTill ?? q?.validUntil ?? "",
              currency: q?.currency ?? q?.currencyCode ?? "",
              amount: Number(q?.grandTotal ?? q?.totalAmount ?? 0),
              status: q?.status ?? q?.invoiceStatus,
            }))
          : [];

        const mappedProforma: ReportRow[] = Array.isArray(pRes?.data)
          ? pRes.data.map((p: any) => ({
              type: "Proforma Invoice" as ReportType,
              documentNo: p?.proformaId ?? p?.id ?? "",
              customerName: p?.customerName ?? p?.customer?.name ?? p?.clientName ?? p?.name ?? "",
              date: p?.dateofinvoice ?? p?.dateOfInvoice ?? p?.createdAt ?? "",
              dueDate: p?.dueDate ?? "",
              currency: p?.currency ?? p?.currencyCode ?? "",
              amount: Number(p?.totalAmount ?? 0),
              status: p?.status ?? p?.invoiceStatus,
              receiptNo: p?.receiptNo ?? p?.receiptNumber,
            }))
          : [];

        const mappedInvoices: ReportRow[] = Array.isArray(iRes?.data)
          ? iRes.data.map((inv: any) => ({
              type: "Invoices" as ReportType,
              documentNo: inv?.invoiceNumber ?? "",
              customerName: inv?.customerName ?? inv?.customer?.name ?? inv?.clientName ?? inv?.name ?? "",
              date: inv?.dateOfInvoice ?? "",
              dueDate: inv?.dueDate ?? "",
              currency: inv?.currency ?? inv?.currencyCode ?? "",
              amount: Number(inv?.totalAmount ?? 0),
              status: inv?.invoiceStatus ?? inv?.status,
              receiptNo: inv?.receiptNumber ?? inv?.receiptNo,
            }))
          : [];

        const mappedCreditNotes: ReportRow[] = Array.isArray(cRes?.data)
          ? cRes.data.map((cn: any) => ({
              type: "Credit Notes" as ReportType,
              documentNo: cn?.invoiceNumber ?? cn?.creditNoteNumber ?? "",
              customerName: cn?.customerName ?? cn?.customer?.name ?? cn?.clientName ?? cn?.name ?? "",
              date: cn?.dateOfInvoice ?? cn?.date ?? "",
              currency: cn?.currency ?? cn?.currencyCode ?? "",
              amount: Math.abs(Number(cn?.totalAmount ?? 0)),
              status: cn?.invoiceStatus ?? cn?.status,
              receiptNo: cn?.receiptNumber ?? cn?.receiptNo,
            }))
          : [];

        const mappedDebitNotes: ReportRow[] = Array.isArray(dRes?.data)
          ? dRes.data.map((dn: any) => ({
              type: "Debit Notes" as ReportType,
              documentNo: dn?.invoiceNumber ?? dn?.debitNoteNumber ?? "",
              customerName: dn?.customerName ?? dn?.customer?.name ?? dn?.clientName ?? dn?.name ?? "",
              date: dn?.dateOfInvoice ?? dn?.date ?? "",
              currency: dn?.currency ?? dn?.currencyCode ?? dn?.currCd ?? "",
              amount: Number(dn?.totalAmount ?? 0),
              status: dn?.invoiceStatus ?? dn?.status,
              receiptNo: dn?.receiptNumber ?? dn?.receiptNo,
            }))
          : [];

        const all = [
          ...(reportType === "All" || reportType === "Quotations" ? mappedQuotations : []),
          ...(reportType === "All" || reportType === "Proforma Invoice" ? mappedProforma : []),
          ...(reportType === "All" || reportType === "Invoices" ? mappedInvoices : []),
          ...(reportType === "All" || reportType === "Credit Notes" ? mappedCreditNotes : []),
          ...(reportType === "All" || reportType === "Debit Notes" ? mappedDebitNotes : []),
        ];

        if (!cancelled) setRows(all);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [reportType]);

  /* ── Unique statuses for filter ── */

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const s = String(r.status ?? "").trim();
      if (s) set.add(s);
    });
    return Array.from(set);
  }, [rows]);

  /* ── Client-side filtering (type, date, status, search handled by Table) ── */

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      if (term) {
        const matches =
          String(row.customerName ?? "").toLowerCase().includes(term) ||
          String(row.documentNo ?? "").toLowerCase().includes(term) ||
          String(row.type ?? "").toLowerCase().includes(term);
        if (!matches) return false;
      }

      if (statusFilter !== "All" && String(row.status ?? "") !== statusFilter)
        return false;

      const rowDate = dateStringForInput(row.date);
      if (dateFrom && rowDate && rowDate < dateFrom) return false;
      if (dateTo && rowDate && rowDate > dateTo) return false;

      return true;
    });
  }, [rows, searchTerm, statusFilter, dateFrom, dateTo]);

  /* ── Reset page on filter change ── */

  useEffect(() => { setPage(1); }, [reportType, dateFrom, dateTo, statusFilter, searchTerm, pageSize]);

  /* ── Pagination ── */

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredData.length / pageSize)),
    [filteredData.length, pageSize],
  );

  const paginatedData = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, totalPages, pageSize]);

  /* ── Export ── */

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting report...");

      if (!filteredData.length) {
        closeSwal();
        showApiError("No records to export");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        filteredData.map((row) => ({
          Type: row.type,
          "Document No": row.documentNo,
          Customer: row.customerName,
          Date: formatDate(row.date),
          "Due Date": row.dueDate ? formatDate(row.dueDate) : "",
          "Receipt No": row.receiptNo ?? "",
          Status: row.status ?? "",
          Currency: row.currency ?? "",
          Amount: row.amount ?? 0,
        })),
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `Sales_Report_${reportType.replace(/\s+/g, "_")}.xlsx`,
      );

      closeSwal();
      showSuccess("Report exported successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  /* ── Columns ── */

  const columns: Column<ReportRow>[] = [
    {
      key: "type",
      header: "Type",
      align: "left",
      render: (row) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {row.type}
        </code>
      ),
    },
    {
      key: "documentNo",
      header: "Document No",
      align: "left",
      render: (row) => (
        <span className="font-semibold text-main">{row.documentNo || "—"}</span>
      ),
      tooltip: (row) => `Document No: ${row.documentNo}`,
    },
    {
      key: "customerName",
      header: "Customer",
      align: "left",
      render: (row) => (
        <span className="text-sm text-main truncate max-w-[220px] block" title={row.customerName}>
          {row.customerName || "—"}
        </span>
      ),
      tooltip: (row) => `Customer: ${row.customerName}`,
    },
    {
      key: "date",
      header: "Date",
      align: "left",
      render: (row) => (
        <span className="text-xs text-muted">{formatDate(row.date)}</span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      align: "left",
      render: (row) => (
        <span className="text-xs text-muted">
          {row.dueDate ? formatDate(row.dueDate) : "—"}
        </span>
      ),
    },
    {
      key: "receiptNo",
      header: "Receipt No",
      align: "left",
      render: (row) => (
        <span className="text-sm text-main">{row.receiptNo || "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (row) => row.status ? <StatusBadge status={row.status} /> : <span className="text-muted">—</span>,
    },
    {
      key: "currency",
      header: "Currency",
      align: "left",
      render: (row) => (
        <span className="text-sm text-main">{row.currency || "—"}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) =>
        row.amount !== undefined && row.amount !== null ? (
          <code className="text-xs px-2 py-1 rounded bg-row-hover text-main font-semibold whitespace-nowrap">
            {row.currency ? `${row.currency} ` : ""}
            {Number(row.amount).toLocaleString()}
          </code>
        ) : (
          <span className="text-muted">—</span>
        ),
      tooltip: (row) => `Amount: ${row.currency ?? ""} ${Number(row.amount ?? 0).toLocaleString()}`,
    },
  ];

  /* ── Extra toolbar filters (type, date range, status) rendered above Table ── */

  const extraFilters = (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Report Type */}
      <select
        className="bg-card border border-theme rounded-lg text-sm text-main shadow-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition px-3 py-2 appearance-none"
        value={reportType}
        onChange={(e) => setReportType(e.target.value as ReportType | "All")}
      >
        {REPORT_TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Date From */}
      <input
        type="date"
        className="bg-card border border-theme rounded-lg text-sm text-main shadow-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition px-3 py-2 w-40"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
      />

      {/* Date To */}
      <input
        type="date"
        className="bg-card border border-theme rounded-lg text-sm text-main shadow-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition px-3 py-2 w-40"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
      />

      {/* Status */}
      <select
        className="bg-card border border-theme rounded-lg text-sm text-main shadow-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition px-3 py-2 w-40 appearance-none"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="All">All Statuses</option>
        {uniqueStatuses.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="h-full min-h-0">
      {/* Extra filters row */}
      <div className="px-0 pb-3">
        {extraFilters}
      </div>

      <Table
        columns={columns}
        data={paginatedData}
        rowKey={(row) => `${row.type}-${row.documentNo}`}
        loading={loading}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => { setSearchTerm(q); setPage(1); }}
        enableColumnSelector
        enableExport
        onExport={handleExportExcel}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredData.length}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        onPageChange={setPage}
      />
    </div>
  );
}