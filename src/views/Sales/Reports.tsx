import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaFileCsv, FaSearch } from "react-icons/fa";

import { getAllQuotations } from "../../api/quotationApi";
import { getAllProformaInvoices } from "../../api/proformaInvoiceApi";
import {
  getAllCreditNotes,
  getAllDebitNotes,
  getAllSalesInvoices,
} from "../../api/salesApi";

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
  receiptNo?: string;
};

const SkeletonRow: React.FC<{ columnsCount: number }> = ({ columnsCount }) => (
  <tr className="bg-transparent">
    {Array.from({ length: columnsCount }).map((_, idx) => (
      <td key={idx} className="px-4 py-3">
        <div className="h-4 bg-gray-300 animate-pulse rounded" />
      </td>
    ))}
  </tr>
);

/*  CSV EXPORT  */

function exportToCsv(rows: ReportRow[], filename: string) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]).join(",") + "\n";
  const body = rows
    .map((row) =>
      Object.values(row)
        .map((s) => `"${String(s).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [reportType, setReportType] = useState<ReportType>("All");
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
  });
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const normalized = (s: unknown) => {
    if (s === null || s === undefined) return "";
    if (typeof s === "string") return s.toLowerCase();
    if (typeof s === "number" || typeof s === "boolean") {
      return String(s).toLowerCase();
    }
    return "";
  };

  const dateStringForInput = (date: string) => {
    const d = new Date(date);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    const parts = String(date).split(" ");
    const datePart = parts[0] ?? "";
    const [month, day, year] = datePart.split("/");
    if (!year || !month || !day) return "";
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        if (reportType === "All") {
          const [qRes, pRes, iRes, cRes, dRes] = await Promise.all([
            getAllQuotations(1, 1000, {}),
            getAllProformaInvoices(1, 1000),
            getAllSalesInvoices(1, 1000),
            getAllCreditNotes(1, 1000),
            getAllDebitNotes(1, 1000),
          ]);

          const quotationsData = Array.isArray(qRes?.data?.quotations)
            ? qRes.data.quotations
            : [];

          const mappedQuotations: ReportRow[] = quotationsData.map(
            (q: any) => ({
              type: "Quotations",
              documentNo: q?.id ?? q?.quotationNumber ?? "",
              customerName:
                q?.customerName ??
                q?.customer?.name ??
                q?.clientName ??
                q?.name ??
                "",
              date: q?.transactionDate ?? q?.quotationDate ?? "",
              dueDate: q?.validTill ?? q?.validUntil ?? "",
              currency: q?.currency ?? q?.currencyCode ?? "",
              amount: Number(q?.grandTotal ?? q?.totalAmount ?? 0),
            }),
          );

          const mappedProforma: ReportRow[] = Array.isArray(pRes?.data)
            ? pRes.data.map((p: any) => ({
                type: "Proforma Invoice",
                documentNo: p?.proformaId ?? p?.id ?? "",
                customerName:
                  p?.customerName ??
                  p?.customer?.name ??
                  p?.clientName ??
                  p?.name ??
                  "",
                date:
                  p?.dateofinvoice ?? p?.dateOfInvoice ?? p?.createdAt ?? "",
                dueDate: p?.dueDate ?? "",
                currency: p?.currency ?? p?.currencyCode ?? "",
                amount: Number(p?.totalAmount ?? 0),
                receiptNo: p?.receiptNo ?? p?.receiptNumber,
              }))
            : [];

          const mappedInvoices: ReportRow[] = Array.isArray(iRes?.data)
            ? iRes.data.map((inv: any) => ({
                type: "Invoices",
                documentNo: inv?.invoiceNumber ?? "",
                customerName:
                  inv?.customerName ??
                  inv?.customer?.name ??
                  inv?.clientName ??
                  inv?.name ??
                  "",
                date: inv?.dateOfInvoice ?? "",
                dueDate: inv?.dueDate ?? "",
                currency: inv?.currency ?? inv?.currencyCode ?? "",
                amount: Number(inv?.totalAmount ?? 0),
                receiptNo: inv?.receiptNumber ?? inv?.receiptNo,
              }))
            : [];

          const mappedCreditNotes: ReportRow[] = Array.isArray(cRes?.data)
            ? cRes.data.map((cn: any) => ({
                type: "Credit Notes",
                documentNo: cn?.invoiceNumber ?? cn?.creditNoteNumber ?? "",
                customerName:
                  cn?.customerName ??
                  cn?.customer?.name ??
                  cn?.clientName ??
                  cn?.name ??
                  "",
                date: cn?.dateOfInvoice ?? cn?.date ?? "",
                currency: cn?.currency ?? cn?.currencyCode ?? "",
                amount: Math.abs(Number(cn?.totalAmount ?? 0)),
                receiptNo: cn?.receiptNumber ?? cn?.receiptNo,
              }))
            : [];

          const mappedDebitNotes: ReportRow[] = Array.isArray(dRes?.data)
            ? dRes.data.map((dn: any) => ({
                type: "Debit Notes",
                documentNo: dn?.invoiceNumber ?? dn?.debitNoteNumber ?? "",
                customerName:
                  dn?.customerName ??
                  dn?.customer?.name ??
                  dn?.clientName ??
                  dn?.name ??
                  "",
                date: dn?.dateOfInvoice ?? dn?.date ?? "",
                currency: dn?.currency ?? dn?.currencyCode ?? dn?.currCd ?? "",
                amount: Number(dn?.totalAmount ?? 0),
                receiptNo: dn?.receiptNumber ?? dn?.receiptNo,
              }))
            : [];

          const all = [
            ...mappedQuotations,
            ...mappedProforma,
            ...mappedInvoices,
            ...mappedCreditNotes,
            ...mappedDebitNotes,
          ];

          if (!cancelled) setRows(all);
          return;
        }

        if (reportType === "Quotations") {
          const res = await getAllQuotations(1, 1000, {});
          const quotationsData = Array.isArray(res?.data?.quotations)
            ? res.data.quotations
            : [];

          const mapped: ReportRow[] = quotationsData.map((q: any) => ({
            type: "Quotations",
            documentNo: q?.id ?? q?.quotationNumber ?? "",
            customerName:
              q?.customerName ??
              q?.customer?.name ??
              q?.clientName ??
              q?.name ??
              "",
            date: q?.transactionDate ?? q?.quotationDate ?? "",
            dueDate: q?.validTill ?? q?.validUntil ?? "",
            currency: q?.currency ?? q?.currencyCode ?? "",
            amount: Number(q?.grandTotal ?? q?.totalAmount ?? 0),
          }));

          if (!cancelled) setRows(mapped);
          return;
        }

        if (reportType === "Proforma Invoice") {
          const res = await getAllProformaInvoices(1, 1000);
          const mapped: ReportRow[] = Array.isArray(res?.data)
            ? res.data.map((p: any) => ({
                type: "Proforma Invoice",
                documentNo: p?.proformaId ?? p?.id ?? "",
                customerName:
                  p?.customerName ??
                  p?.customer?.name ??
                  p?.clientName ??
                  p?.name ??
                  "",
                date:
                  p?.dateofinvoice ?? p?.dateOfInvoice ?? p?.createdAt ?? "",
                dueDate: p?.dueDate ?? "",
                currency: p?.currency ?? p?.currencyCode ?? "",
                amount: Number(p?.totalAmount ?? 0),
                receiptNo: p?.receiptNo ?? p?.receiptNumber,
              }))
            : [];

          if (!cancelled) setRows(mapped);
          return;
        }

        if (reportType === "Invoices") {
          const res = await getAllSalesInvoices(1, 1000);
          const mapped: ReportRow[] = Array.isArray(res?.data)
            ? res.data.map((inv: any) => ({
                type: "Invoices",
                documentNo: inv?.invoiceNumber ?? "",
                customerName:
                  inv?.customerName ??
                  inv?.customer?.name ??
                  inv?.clientName ??
                  inv?.name ??
                  "",
                date: inv?.dateOfInvoice ?? "",
                dueDate: inv?.dueDate ?? "",
                currency: inv?.currency ?? inv?.currencyCode ?? "",
                amount: Number(inv?.totalAmount ?? 0),
                receiptNo: inv?.receiptNumber ?? inv?.receiptNo,
              }))
            : [];

          if (!cancelled) setRows(mapped);
          return;
        }

        if (reportType === "Credit Notes") {
          const res = await getAllCreditNotes(1, 1000);
          const mapped: ReportRow[] = Array.isArray(res?.data)
            ? res.data.map((cn: any) => ({
                type: "Credit Notes",
                documentNo: cn?.invoiceNumber ?? cn?.creditNoteNumber ?? "",
                customerName:
                  cn?.customerName ??
                  cn?.customer?.name ??
                  cn?.clientName ??
                  cn?.name ??
                  "",
                date: cn?.dateOfInvoice ?? cn?.date ?? "",
                currency: cn?.currency ?? cn?.currencyCode ?? "",
                amount: Math.abs(Number(cn?.totalAmount ?? 0)),
                receiptNo: cn?.receiptNumber ?? cn?.receiptNo,
              }))
            : [];

          if (!cancelled) setRows(mapped);
          return;
        }

        if (reportType === "Debit Notes") {
          const res = await getAllDebitNotes(1, 1000);
          const mapped: ReportRow[] = Array.isArray(res?.data)
            ? res.data.map((dn: any) => ({
                type: "Debit Notes",
                documentNo: dn?.invoiceNumber ?? dn?.debitNoteNumber ?? "",
                customerName:
                  dn?.customerName ??
                  dn?.customer?.name ??
                  dn?.clientName ??
                  dn?.name ??
                  "",
                date: dn?.dateOfInvoice ?? dn?.date ?? "",
                currency: dn?.currency ?? dn?.currencyCode ?? dn?.currCd ?? "",
                amount: Number(dn?.totalAmount ?? 0),
                receiptNo: dn?.receiptNumber ?? dn?.receiptNo,
              }))
            : [];

          if (!cancelled) setRows(mapped);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [reportType]);

  const filteredData = useMemo(() => {
    return rows.filter((row) => {
      const term = searchTerm.trim().toLowerCase();
      if (term) {
        const matches =
          normalized(row.customerName).includes(term) ||
          normalized(row.documentNo).includes(term) ||
          normalized(row.type).includes(term);

        if (!matches) return false;
      }

      const rowDate = dateStringForInput(row.date);
      if (filters.dateFrom && rowDate && rowDate < filters.dateFrom)
        return false;
      if (filters.dateTo && rowDate && rowDate > filters.dateTo) return false;

      return true;
    });
  }, [rows, searchTerm, filters, normalized]);

  useEffect(() => {
    setPage(1);
  }, [reportType, filters.dateFrom, filters.dateTo, searchTerm, pageSize]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (exportRef.current?.contains(target)) return;
      setExportOpen(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredData.length / pageSize)),
    [filteredData.length, pageSize],
  );

  const paginatedData = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, totalPages]);

  const formatDate = (raw: string) => {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
    return raw || "—";
  };

  return (
    <div className="mx-auto mt-8 mb-12 p-6 bg-card rounded-2xl border border-theme">
      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-4">
        <div className="flex flex-wrap gap-3 items-center w-full">
          <div className="relative sm:max-w-xs w-full">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm" />
            <input
              className="w-full pl-11 pr-4 py-2.5 bg-card border border-theme rounded-full text-sm text-main placeholder:text-muted/70 shadow-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="bg-card border border-theme rounded-full text-sm text-main shadow-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition px-4 py-2.5 pr-10 appearance-none"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
          >
            <option value="All">All Types</option>
            <option value="Quotations">Quotations</option>
            <option value="Proforma Invoice">Proforma Invoice</option>
            <option value="Invoices">Invoices</option>
            <option value="Credit Notes">Credit Notes</option>
            <option value="Debit Notes">Debit Notes</option>
          </select>

          <input
            type="date"
            className="bg-card border border-theme rounded-full text-sm text-main shadow-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition px-4 py-2.5 sm:w-44"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dateFrom: e.target.value }))
            }
          />

          <input
            type="date"
            className="bg-card border border-theme rounded-full text-sm text-main shadow-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition px-4 py-2.5 sm:w-44"
            value={filters.dateTo}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dateTo: e.target.value }))
            }
          />
        </div>

        <div className="flex items-center justify-end">
          <div ref={exportRef} className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-theme bg-primary text-white hover:opacity-95 transition inline-flex items-center gap-2 disabled:opacity-60"
              disabled={!filteredData.length}
            >
              Export
              <FaChevronDown className="w-3.5 h-3.5" />
            </button>

            {exportOpen && !!filteredData.length && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-theme rounded-xl shadow-lg overflow-hidden z-20">
                <button
                  type="button"
                  onClick={() => {
                    exportToCsv(
                      filteredData,
                      `${reportType.replace(/\s+/g, "_")}_report_all.csv`,
                    );
                    setExportOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm text-main hover:bg-row-hover transition flex items-center gap-2"
                >
                  <FaFileCsv className="w-4 h-4" />
                  Export All (Filtered)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportToCsv(
                      paginatedData,
                      `${reportType.replace(/\s+/g, "_")}_report_page_${page}.csv`,
                    );
                    setExportOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm text-main hover:bg-row-hover transition flex items-center gap-2"
                >
                  <FaFileCsv className="w-4 h-4" />
                  Export Current Page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="border border-theme rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-app border-b border-theme sticky top-0 z-10">
              <tr>
                {[
                  "Type",
                  "Document No",
                  "Customer",
                  "Date",
                  "Due Date",
                  "Receipt No",
                  "Currency",
                  "Amount",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted whitespace-nowrap ${
                      h === "Amount" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, idx) => (
                  <SkeletonRow key={idx} columnsCount={8} />
                ))
              ) : paginatedData.length ? (
                paginatedData.map((row, i) => (
                  <tr
                    key={`${row.type}-${row.documentNo}-${i}`}
                    className={`${i % 2 === 0 ? "bg-card" : "bg-app/30"} hover:bg-row-hover transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm text-main whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-row-hover text-main">
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-main whitespace-nowrap">
                      {row.documentNo || "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-main max-w-[260px] truncate"
                      title={row.customerName || ""}
                    >
                      {row.customerName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-main whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-main whitespace-nowrap">
                      {row.dueDate ? formatDate(row.dueDate) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-main whitespace-nowrap">
                      {row.receiptNo || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-main whitespace-nowrap">
                      {row.currency || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-main text-right whitespace-nowrap">
                      {row.amount !== undefined && row.amount !== null ? (
                        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main font-semibold">
                          {row.currency ? `${row.currency} ` : ""}
                          {Number(row.amount).toLocaleString()}
                        </code>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-muted text-sm"
                  >
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-theme bg-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="font-semibold uppercase tracking-wide">
                Show:
              </span>
              <select
                className="filter-input-refined appearance-none w-20 py-1.5 px-2 text-xs"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[10, 25, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-muted">
              {(() => {
                const safePage = Math.min(Math.max(1, page), totalPages);
                const start = filteredData.length
                  ? (safePage - 1) * pageSize + 1
                  : 0;
                const end = Math.min(safePage * pageSize, filteredData.length);
                return `Showing ${start}-${end} of ${filteredData.length}`;
              })()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-theme text-sm text-main bg-card hover:bg-row-hover disabled:opacity-50 disabled:hover:bg-card transition"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>

            <div className="text-sm font-semibold text-main">
              Page {Math.min(Math.max(1, page), totalPages)} / {totalPages}
            </div>

            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-theme text-sm text-main bg-card hover:bg-row-hover disabled:opacity-50 disabled:hover:bg-card transition"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
