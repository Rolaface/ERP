import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import { getAllQuotations, getQuotationById, updateQuotationStatus } from "../../api/quotationApi";
import { getCompanyById } from "../../api/companySetupApi";
import type { QuotationSummary } from "../../types/quotation";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { generateQuotationPDF } from "../../components/template/quotation/QuotationTemplate1";
import PdfPreviewModal from "./PdfPreviewModal";
import { deleteQuotationById } from "../../api/quotationApi";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import QuotationDetailModal, { QuotationDetail } from "./Quotationdetailmodal";
import { fireManagedSwal } from "../../utils/swalManager";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

type OutletContextType = {
  openQuotationCreate: () => void;
  openQuotationEdit: (quotationId: string, data: any) => void;
};

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
type QuotationStatus = "Draft" | "Sent" | "Paid" | "Overdue";
const QUOTATION_MODULE = "Sales Invoice";
const STATUS_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  Draft: ["Sent"],
  Sent: ["Paid", "Overdue"],
  Paid: [],
  Overdue: ["Paid"],

};
const QuotationsTable: React.FC<QuotationTableProps> = ({ onAddQuotation }) => {
  const { openQuotationEdit } = useOutletContext<OutletContextType>();
  const mountedRef = useRef(true);

  const [quotations, setQuotations] = useState<QuotationSummary[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const { can } = usePermission();

  // ── Pagination state (server) 
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search state (server) 
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState("quotationNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── Filter state (server) 
  const [status] = useState("");
  const [fromDate] = useState("");
  const [toDate] = useState("");


  // ── Reset page when search changes 
  useEffect(() => { setPage(1); }, [searchTerm]);
  //_____quotation details modal state _____
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // _____quotation details drawer state _____
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailData, setDetailData] = useState<QuotationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);

  // ── Fetch company once 
  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) setCompany(res.data);
      })
      .catch(() => console.error("Failed to load company data"));
  }, []);


  const fetchQuotations = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsFetching(true);
    try {
      const res = await getAllQuotations(page, pageSize, {
        search: searchTerm,
        status,
        fromDate,
        toDate,
        sortBy: SORT_FIELD_MAP[sortBy] || sortBy,
        sortOrder,
      });

      if (!mountedRef.current) return;

      if (!res || res.status_code !== 200) {
        setQuotations([]);
        return;
      }

      const raw = Array.isArray(res.data?.quotations) ? res.data.quotations : [];

      setQuotations(raw.map((q: any) => ({
        quotationNumber: q.id || "",
        customerName: q.customerName || "N/A",
        transactionDate: q.transactionDate || "",
        validTill: q.validTill || "",
        grandTotal: Number(q.grandTotal ?? 0),
        currency: q.currency,
        status: q.invoiceStatus || "Draft",
      })));

      setTotalPages(res.data?.pagination?.totalPages || 1);
      setTotalItems(res.data?.pagination?.total || raw.length);
    } catch (err) {
      console.error("Error fetching quotations:", err);
      if (mountedRef.current) {
        setQuotations([]);
      }
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, searchTerm, status, fromDate, toDate, sortBy, sortOrder]);

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true;
    fetchQuotations();
    return () => { mountedRef.current = false; };
  }, []);

  // Refetch on dependency changes (not initial)
  useEffect(() => {
    if (isInitialLoad) return;
    fetchQuotations();
  }, [page, pageSize, searchTerm, status, fromDate, toDate, sortBy, sortOrder]);

  // ── Sort handler — store column key in state, map to backend at call site ─
  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey);   // ← always the column key e.g. "quotationNumber"
    setSortOrder(order);
    setPage(1);
  };
  const handleRowStatusChange = async (
    quotationNumber: string,
    newStatus: QuotationStatus
  ) => {
    try {
      showLoading("Updating quotation status...");

      const res = await updateQuotationStatus(quotationNumber, newStatus);

      if (!res || res.status_code !== 200) {
        closeSwal();
        showApiError(res?.message || "Failed to update status");
        return;
      }

      closeSwal();

      setQuotations((prev) =>
        prev.map((q: any) =>
          q.quotationNumber === quotationNumber
            ? { ...q, status: newStatus }
            : q
        )
      );

      showSuccess(`Quotation marked as ${newStatus}`);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleEdit = async (quotationNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      showLoading("Loading quotation...");

      const res = await getQuotationById(quotationNumber);

      if (!res || res.status_code !== 200) {
        closeSwal();
        showApiError("Failed to load quotation");
        return;
      }

      closeSwal();

      openQuotationEdit(quotationNumber, res.data);

    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleDrawerPdf = async (quotationNumber: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);
    try {
      const res = await getQuotationById(quotationNumber);
      if (!res || res.status_code !== 200 || !company) return;
      const blobUrl = await generateQuotationPDF(res.data, company, "bloburl");
      setDrawerPdfUrl(blobUrl);
    } finally {
      setDrawerPdfLoading(false);
    }
  };
  const handlePreviewQuotationPDF = async (
    quotationNumber: string,

  ) => {


    try {
      showLoading("Preparing quotation preview...");

      if (!company) {
        closeSwal();
        showApiError("Company data not loaded");
        return;
      }

      const res = await getQuotationById(quotationNumber);
      if (!res || res.status_code !== 200) {
        closeSwal();
        showApiError("Failed to load quotation");
        return;
      }

      const blobUrl = await generateQuotationPDF(
        res.data,
        company,
        "bloburl"
      );

      closeSwal();


      setPdfUrl(blobUrl);
      setSelectedQuotation(res.data);
      setPdfOpen(true);

    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };
  const handleDelete = async (quotationNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete quotation ${quotationNumber}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting quotation...");

      const res = await deleteQuotationById(quotationNumber);

      if (!res || res.status_code !== 200) {
        closeSwal();
        showApiError(res?.message || "Failed to delete quotation");
        return;
      }

      closeSwal();

      setQuotations((prev) =>
        prev.filter((q) => q.quotationNumber !== quotationNumber)
      );

      showSuccess("Quotation deleted successfully");

    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };
  const fetchAllForExport = async (): Promise<QuotationSummary[]> => {
    let allData: QuotationSummary[] = [];
    let current = 1;
    let total = 1;

    do {
      const res = await getAllQuotations(current, 100, {
        search: searchTerm,
        status,
        fromDate,
        toDate,
        sortBy: SORT_FIELD_MAP[sortBy] || sortBy,  // ← same mapping
        sortOrder: sortOrder === "desc" ? "desc" : "asc",
      });

      if (res?.status_code === 200) {
        const raw = res.data?.quotations || [];
        allData = [
          ...allData,
          ...raw.map((q: any) => ({
            quotationNumber: q.id || "",
            customerName: q.customerName,
            transactionDate: q.transactionDate || "",
            validTill: q.validTill || "",
            grandTotal: Number(q.grandTotal ?? 0),
            currency: q.currency,
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
          Date: q.transactionDate,
          "Valid Till": q.validTill,
          Amount: q.grandTotal,
          Currency: q.currency,
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Quotations");

      saveAs(
        new Blob(
          [XLSX.write(workbook, { bookType: "xlsx", type: "array" })],
          { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        ),
        "All_Quotations.xlsx"
      );

      closeSwal();
      showSuccess("Export completed successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleView = async (quotationNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDetailDrawerOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await getQuotationById(quotationNumber);
      if (res?.status_code === 200) setDetailData(res.data);
    } finally {
      setDetailLoading(false);
    }
  };
  const handleDownload = async (quotationNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Preparing download...");
      if (!company) { closeSwal(); return; }

      const res = await getQuotationById(quotationNumber);
      if (!res || res.status_code !== 200) { closeSwal(); return; }

      await generateQuotationPDF(res.data, company, "save");
      closeSwal();
      showSuccess("Quotation downloaded");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };




  const columns: Column<QuotationSummary>[] = [
    {
      key: "quotationNumber",
      header: "Quotation No",
      align: "left",
      sortable: true,
      render: (q) => <span className="font-semibold text-main">{q.quotationNumber}</span>,
    },
    { key: "customerName", header: "Customer", align: "left", sortable: true },
    { key: "transactionDate", header: "Date", align: "left", sortable: true },
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
      key: "status",
      header: "Status",
      align: "left",
      // This uses the same component as your Invoice table
      render: (q: any) => <StatusBadge status={q.status || "Draft"} />,
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

          {/* Edit — needs write + Draft */}
          <PermissionGate module={QUOTATION_MODULE} action="write">
            <ActionButton
              type="edit"
              disabled={q.status !== "Draft"}
              onClick={(e) => handleEdit(q.quotationNumber, e)}
              iconOnly
            />
          </PermissionGate>

          <ActionMenu
            // Delete — needs delete
            {...(can(QUOTATION_MODULE, "delete")
              ? { onDelete: (e) => handleDelete(q.quotationNumber, e) }
              : {})}
            showDownload
            onDownload={(e) => handleDownload(q.quotationNumber, e)}
            customActions={[
              { label: "View PDF", onClick: () => handlePreviewQuotationPDF(q.quotationNumber) },
              // Status transitions — needs write
              ...(can(QUOTATION_MODULE, "write")
                ? (STATUS_TRANSITIONS[q.status as QuotationStatus] ?? []).map((status) => ({
                  label: `Mark as ${status}`,
                  onClick: () => handleRowStatusChange(q.quotationNumber, status),
                }))
                : []),
            ]}
          />
        </ActionGroup>
      ),
    },
  ];


  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={quotations}
        tableId="sales-quotations"
        rowKey={(row) => row.quotationNumber}
        loading={isInitialLoad}
        isFetching={isFetching}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => { setSearchTerm(q); setPage(1); }}
        enableColumnSelector
       enableAdd={can(QUOTATION_MODULE, "create")}
        addLabel="Add Quotation"
        onAdd={onAddQuotation}
         enableExport={can(QUOTATION_MODULE, "export")}
        onExport={handleExportExcel}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />


      <PdfPreviewModal
        open={pdfOpen}
        title="Quotation Preview"
        pdfUrl={pdfUrl}
        onClose={() => {
          if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
          setSelectedQuotation(null);
          setPdfOpen(false);
        }}
        onDownload={() =>
          selectedQuotation && company &&
          generateQuotationPDF(selectedQuotation, company, "save")
        }
      />
      <QuotationDetailModal
        open={detailDrawerOpen}
        data={detailData}
        loading={detailLoading}
        onClose={() => { setDetailDrawerOpen(false); setDetailData(null); setDrawerPdfUrl(null); }}
        pdfUrl={drawerPdfUrl}
        pdfLoading={drawerPdfLoading}
        onViewPdf={() => detailData && handleDrawerPdf(detailData.id)}
        onDownload={() => detailData && company && generateQuotationPDF(detailData, company, "save")}
        onClosePdf={() => { if (drawerPdfUrl?.startsWith("blob:")) URL.revokeObjectURL(drawerPdfUrl); setDrawerPdfUrl(null); }}
      />
    </div>
  );
};

export default QuotationsTable;
