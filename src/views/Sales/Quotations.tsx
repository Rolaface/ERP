import React, { useEffect, useState } from "react";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import { getAllQuotations, getQuotationById } from "../../api/quotationApi";
import type { QuotationSummary } from "../../types/quotation";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
} from "../../components/ui/Table/ActionButton";
import InvoiceDetailsModal, {
  type InvoiceDetails,
} from "./InvoiceDetailsModal";
import type { Column } from "../../components/ui/Table/type";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const SORT_FIELD_MAP: Record<string, string> = {
  quotationNumber: "id",
  customerName: "customerName",
  transactionDate: "transactionDate",
  validTill: "validTill",
  grandTotal: "grandTotal",
};

interface QuotationTableProps {
  onAddQuotation?: () => void;
  onExportQuotation?: () => void;
}

const QuotationsTable: React.FC<QuotationTableProps> = ({ onAddQuotation }) => {
  const [quotations, setQuotations] = useState<QuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // ── Pagination state (server) ────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search state (server) ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");

  // ── Sort state (server) — always store column key, not backend field ─────
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── Filter state (server) ────────────────────────────────────────────────
  const [fromDate] = useState("");
  const [toDate] = useState("");

  // ── Modal state ──────────────────────────────────────────────────────────
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  // ── Reset page when search changes ──────────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);

      const res = await getAllQuotations(page, pageSize, {
        search: searchTerm,
        fromDate,
        toDate,
        sortBy: SORT_FIELD_MAP[sortBy] || sortBy,
        sortOrder,
      });

      if (!res || res.status_code !== 200) {
        setQuotations([]);
        return;
      }

      const raw = Array.isArray(res.data?.quotations)
        ? res.data.quotations
        : [];

      setQuotations(
        raw.map((q: any) => ({
          quotationNumber: q.id || "",
          customerName: q.customerName || "N/A",
          industryBases: q.industryBases || "N/A",
          transactionDate: q.transactionDate || "",
          validTill: q.validTill || "",
          grandTotal: Number(q.grandTotal ?? 0),
          currency: q.currency || "ZMW",
        })),
      );

      setTotalPages(res.data?.pagination?.totalPages || 1);
      setTotalItems(res.data?.pagination?.total || raw.length);
    } catch (err) {
      console.error("Error fetching quotations:", err);
      setQuotations([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [page, pageSize, searchTerm, fromDate, toDate, sortBy, sortOrder]);

  // ── Sort handler — store column key in state, map to backend at call site ─
  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey); // ← always the column key e.g. "quotationNumber"
    setSortOrder(order);
    setPage(1);
  };

  const handleOpenReceipt = (receiptUrl: string) => {
    const normalizedUrl = receiptUrl.startsWith("http://")
      ? receiptUrl.replace(/^http:\/\//i, "https://")
      : receiptUrl;

    const urlWithoutPort = (() => {
      try {
        const u = new URL(normalizedUrl);
        u.port = "";
        return u.toString();
      } catch {
        return normalizedUrl.replace(
          /^(https?:\/\/[^/]+):\d+(\/.*)?$/i,
          "$1$2",
        );
      }
    })();

    const a = document.createElement("a");
    a.href = urlWithoutPort;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const fetchAllForExport = async (): Promise<QuotationSummary[]> => {
    let allData: QuotationSummary[] = [];
    let current = 1;
    let total = 1;

    do {
      const res = await getAllQuotations(current, 100, {
        search: searchTerm,
        fromDate,
        toDate,
        sortBy: SORT_FIELD_MAP[sortBy] || sortBy, // ← same mapping
        sortOrder,
      });

      if (res?.status_code === 200) {
        const raw = res.data?.quotations || [];
        allData = [
          ...allData,
          ...raw.map((q: any) => ({
            quotationNumber: q.id || "",
            customerName: q.customerName || "N/A",
            industryBases: q.industryBases || "N/A",
            transactionDate: q.transactionDate || "",
            validTill: q.validTill || "",
            grandTotal: Number(q.grandTotal ?? 0),
            currency: q.currency || "ZMW",
          })),
        ];
        total = res.data?.pagination?.totalPages || 1;
      }

      current++;
    } while (current <= total);

    return allData;
  };

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting Quotations...");
      const data = await fetchAllForExport();

      if (!data.length) {
        closeSwal();
        showApiError("No quotations to export");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        data.map((q) => ({
          "Quotation No": q.quotationNumber,
          Customer: q.customerName,
          Industry: q.industryBases,
          Date: q.transactionDate,
          "Valid Till": q.validTill,
          Amount: q.grandTotal,
          Currency: q.currency,
        })),
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Quotations");

      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "All_Quotations.xlsx",
      );

      closeSwal();
      showSuccess("Export completed successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleView = (quotationNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDetailsId(quotationNumber);
    setDetailsOpen(true);
  };

  const mapQuotationToInvoiceDetails = (raw: any): InvoiceDetails => {
    const items = Array.isArray(raw?.items)
      ? raw.items.map((it: any) => ({
          itemCode: it?.itemCode,
          itemName: it?.itemName,
          quantity: Number(it?.quantity ?? 0),
          description: it?.description,
          discount: Number(it?.discount ?? 0),
          price: Number(it?.price ?? 0),
          vatCode: it?.vatCode,
          vatTaxableAmount: it?.vatTaxableAmount ?? it?.itemTotal,
        }))
      : [];

    return {
      invoiceNumber: raw?.id ?? raw?.quotationNumber,
      invoiceType: raw?.invoiceType ?? "Quotation",
      customerName: raw?.customerName ?? raw?.customerId,
      customerTpin: raw?.customerTpin,
      currencyCode: raw?.currencyCode,
      exchangeRt: raw?.exchangeRt,
      dateOfInvoice: raw?.transactionDate,
      dueDate: raw?.validUntil ?? raw?.validTill,
      Receipt: raw?.Receipt ?? raw?.receipt,
      ReceiptNo: raw?.ReceiptNo ?? raw?.receiptNo,
      TotalAmount: raw?.TotalAmount ?? raw?.grandTotal ?? raw?.totalAmount,
      discountPercentage: raw?.discountPercentage,
      discountAmount: raw?.discountAmount,
      lpoNumber: raw?.lpoNumber,
      destnCountryCd: raw?.destnCountryCd,
      billingAddress: raw?.billingAddress,
      shippingAddress: raw?.shippingAddress,
      paymentInformation: raw?.paymentInformation,
      items,
      terms: raw?.terms,
    };
  };

  const columns: Column<QuotationSummary>[] = [
    {
      key: "quotationNumber",
      header: "Quotation No",
      align: "left",
      sortable: true,
      render: (q) => (
        <span className="font-semibold text-main">{q.quotationNumber}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      align: "left",
      sortable: true,
    },
    { key: "industryBases", header: "Industry", align: "left" },
    {
      key: "transactionDate",
      header: "Date",
      align: "left",
      sortable: true,
    },
    { key: "validTill", header: "Valid Till", align: "left", sortable: true },
    {
      key: "grandTotal",
      header: "Amount",
      align: "right",
      sortable: true,
      render: (q) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {q.currency} {q.grandTotal.toLocaleString()}
        </code>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (q) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e) => handleView(q.quotationNumber, e)}
            iconOnly
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="p-8">
      <Table
        columns={columns}
        data={quotations}
        rowKey={(row) => row.quotationNumber}
        loading={loading || initialLoad}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableColumnSelector
        enableAdd
        addLabel="Add Quotation"
        onAdd={onAddQuotation}
        enableExport
        onExport={handleExportExcel}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      <InvoiceDetailsModal
        open={detailsOpen}
        invoiceId={detailsId}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsId(null);
        }}
        fetchDetails={getQuotationById}
        onOpenReceiptPdf={handleOpenReceipt}
        mapDetails={mapQuotationToInvoiceDetails}
      />
    </div>
  );
};

export default QuotationsTable;
