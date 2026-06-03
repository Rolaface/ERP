import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
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
import { deleteProformaInvoiceById, getAllQuotation, getProformaInvoiceById, updateProformaInvoiceStatus } from "../../api/proformaInvoiceApi";
import { ProformaInvoice, ProformaInvoiceStatus, ProformaInvoiceSummary } from "../../types/proformaInvoice";
import { getPdf } from "../../api/PDF/pdfUtilApi";
import { parseFrappeError } from "../hr/tabs/leave-config/hooks/parseFrappeError";
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
   refreshKey: number;
}
type QuotationStatus = "Draft" | "Approved" | "Paid" | "Overdue";
const QUOTATION_MODULE = "Sales Invoice";
const STATUS_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  Draft: ["Approved"],
  Approved: ["Paid", "Overdue"],
  Paid: [],
  Overdue: ["Paid"],

};
const QuotationsTable: React.FC<QuotationTableProps> = ({ onAddQuotation, refreshKey }) => {
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
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfBlob, setDrawerPdfBlob] = useState<Blob | null>(null);

  const [quotation, setQuotation] = useState<ProformaInvoiceSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);

  // ── Fetch company once 
  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) setCompany(res.data);
      })
      .catch(() => console.error("Failed to load company data"));
  }, []);


 // ── Fetch Quotations ────────────────────────────────────────────────────────
  const fetchQuotations = async () => {
    try {
      setLoading(true);

      const res = await getAllQuotation(
        page,
        pageSize,
        SORT_FIELD_MAP[sortBy] || sortBy, 
        sortOrder,
        searchTerm, 
      );

      if (!res || res.status_code !== 200) return;

      const mapped: QuotationSummary[] = res.data.map((inv: any) => ({
        quotationNumber: inv.name || inv.proformaId || inv.id,
        customerName: inv.customerName,
        currency: inv.currency,
        validTill: inv.validTill,
        grandTotal: Number(inv.baseGrandTotal || inv.total || 0),
        status: inv.status as QuotationStatus,
        transactionDate: inv.postingDate ? new Date(inv.postingDate).toLocaleDateString() : "",
      }));

      // FIX: Set the correct state array (quotations, not quotation)
      setQuotations(mapped);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || mapped.length);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [page, pageSize, refreshKey, sortBy, sortOrder, searchTerm]);


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
  // const handleRowStatusChange = async (
  //   quotationNumber: string,
  //   newStatus: QuotationStatus
  // ) => {
  //   try {
  //     showLoading("Updating quotation status...");

  //     const res = await updateProformaInvoiceStatus(quotationNumber, newStatus);

  //     if (!res || res.status_code !== 200) {
  //       closeSwal();
  //       showApiError(res?.message || "Failed to update status");
  //       return;
  //     }

  //     closeSwal();

  //     setQuotations((prev) =>
  //       prev.map((q: any) =>
  //         q.quotationNumber === quotationNumber
  //           ? { ...q, status: newStatus }
  //           : q
  //       )
  //     );

  //     showSuccess(`Quotation marked as ${newStatus}`);
  //   } catch (err) {
  //     closeSwal();
  //     showApiError(err);
  //   }
  // };
  const handleRowStatusChange = async (
    quotationNumber: string,
    newStatus: QuotationStatus
  ) => {
    try {
      showLoading("Updating quotation status...");

      const res = await updateProformaInvoiceStatus(quotationNumber, newStatus);

      // FIX: Handle both wrapped and unwrapped backend responses safely
      const statusCode = res?.message?.status_code || res?.status_code;

      if (statusCode !== 200) {
        closeSwal();
        // FIX: Safely extract the message text
        showApiError(res?.message?.message || res?.message || "Failed to update status");
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

  // const handleEdit = async (quotationNumber: string, e?: React.MouseEvent) => {
  //   e?.stopPropagation();

  //   try {
  //     showLoading("Loading quotation...");

  //     const res = await getProformaInvoiceById(quotationNumber);

  //     if (!res || res.status_code !== 200) {
  //       closeSwal();
  //       showApiError("Failed to load quotation");
  //       return;
  //     }

  //     closeSwal();

  //     openQuotationEdit(quotationNumber, res.data);

  //   } catch (err) {
  //     closeSwal();
  //     showApiError(err);
  //   }
  // };
  const handleEdit = async (quotationId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
  
      try {
        showLoading("Loading proforma invoice...");
  
        const res = await getProformaInvoiceById(quotationId);
        console.log("Proforma invoice details response:", res);
        console.log("Proforma Id", quotationId);
        const statusCode = res?.message?.status_code || res?.status_code;
        const data = res?.message?.data || res?.data;
  
        if (statusCode !== 200 || !data) {
          closeSwal();
          showApiError("Failed to load proforma invoice");
          return;
        }
  
        closeSwal();
        openQuotationEdit(quotationId, data);
  
      } catch (err) {
        closeSwal();
        showApiError(err);
      }
    };

const handleDrawerPdf = async (quotationId: string) => {
      setDrawerPdfLoading(true);
      setDrawerPdfUrl(null);
  
      try {
        const blob = await getPdf(quotationId, "Proforma Invoice");
        console.log("PDF blob response for drawer:", blob);
        console.log("Proforma Id", quotationId);
        setDrawerPdfBlob(blob);
        const blobUrl = URL.createObjectURL(blob);
        setDrawerPdfUrl(blobUrl);
      } catch (err) {
        showApiError(err);
      } finally {
        setDrawerPdfLoading(false);
      }
    };
  
    // ── PDF preview modal (table row action — kept, do not remove)
    const handlePreviewQuotationPDF = async (
      inv: ProformaInvoiceSummary,
      e?: React.MouseEvent,
    ) => {
      e?.stopPropagation();
      try {
        showLoading("Preparing invoice preview...");
        const blob = await getPdf(inv.proformaId, "Proforma Invoice");
        console.log("PDF blob response for drawer handlePreviewPDF:", blob);
        console.log("Proforma Id handlePreviewPDF", inv.proformaId);
        const blobUrl = URL.createObjectURL(blob);
        closeSwal();
        setPdfUrl(blobUrl);
        setSelectedQuotation(null); 
        setPdfOpen(true);
      } catch (err: any) {
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

      const res = await deleteProformaInvoiceById(quotationNumber);

      // FIX: Safely unwrap the status code just like in handleRowStatusChange
      const statusCode = res?.message?.status_code || res?.status_code;

      if (statusCode !== 200) {
        closeSwal();
        // FIX: Safely extract the message text. Removed the uncalled parseFrappeError function.
        showApiError(res?.message?.message || res?.message || "Failed to delete quotation");
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
      const res = await getAllQuotation(  current,
          100,
          SORT_FIELD_MAP[sortBy] || sortBy, // ← same mapping for export
          sortOrder,
          searchTerm,
      );

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

 const handleView = async (quotationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDetailDrawerOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await getProformaInvoiceById(quotationId);
      console.log("Proforma invoice details response for drawer view:", res);
      console.log("Quotation Id ", quotationId);
      
      const statusCode = res?.message?.status_code || res?.status_code;
      const data = res?.message?.data || res?.data;
      
      if (statusCode === 200 && data) {
        // FIX: Update setDetailData instead of setDetailDrawerOpen
        setDetailData(data);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownload = async (quotationNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Preparing download...");
      if (!company) { closeSwal(); return; }

      const res = await getProformaInvoiceById(quotationNumber);
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
      loading={loading || initialLoad}
        columns={columns}
        data={quotations}
        tableId="sales-quotations"
        rowKey={(row) => row.quotationNumber}
        isFetching={isFetching}
        defaultVisibleCount={7}
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
        onClose={() => {
          setDetailDrawerOpen(false);
          setDetailData(null);
          setDrawerPdfUrl(null);
        }}
        pdfUrl={drawerPdfUrl}
        pdfLoading={drawerPdfLoading}
        onViewPdf={() => detailData?.id && handleDrawerPdf(detailData.id)}
        onDownload={() =>
          detailData &&
          company &&
          generateQuotationPDF(detailData, company, "save")
        }
        onClosePdf={() => {
          if (drawerPdfUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(drawerPdfUrl);
          }
          setDrawerPdfUrl(null);
        }}
      />
    </div>
  );
};

export default QuotationsTable;
