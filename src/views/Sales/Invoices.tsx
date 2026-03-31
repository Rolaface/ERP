import React, { useEffect, useState } from "react";
import {
  getAllSalesInvoices,
  updateInvoiceStatus,
  getSalesInvoiceById,
  deleteSalesInvoiceById,
  editSalesInvoice,
} from "../../api/salesApi";
import type { InvoiceSummary, Invoice } from "../../types/invoice";
import { generateInvoicePDF } from "../../components/template/invoice/InvoiceTemplate1";
import PdfPreviewModal from "./PdfPreviewModal";
import InvoiceDetailModal, { type InvoiceDetail } from "./InvoiceDetailsModal";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { getCompanyById } from "../../api/companySetupApi";
import type { Company } from "../../types/company";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import type { InvoiceStatus } from "../../types/invoice";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import InvoiceModal from "../../components/sales/InvoiceModal";
import PaymentEntryModal from "../PaymentEntry/PaymentEntryModal";

const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  Draft: ["Rejected", "Approved"],
  Rejected: ["Draft", "Approved"],
  Paid: [],
  Cancelled: ["Draft"],
  Approved: ["Paid", "Cancelled"],
};

const CRITICAL_STATUSES: InvoiceStatus[] = ["Paid"];

interface InvoiceTableProps {
  onAddInvoice?: () => void;
  onExportInvoice?: () => void;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ onAddInvoice }) => {
  // ── Data
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);

  // ── PDF preview (kept — do not remove)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // ── Drawer (same pattern as ProformaInvoicesTable)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<InvoiceDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);

  // ── Pagination (server)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceSummary | null>(
    null,
  );

  // ── Search (server)
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState("invoiceNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // ── Fetch company once
  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) setCompany(res.data);
      })
      .catch(() => console.error("Failed to load company data"));
  }, []);

  // ── Fetch invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await getAllSalesInvoices(
        page,
        pageSize,
        sortBy,
        sortOrder,
        searchTerm,
      );
      if (!res || res.status_code !== 200) return;

      const mapped: InvoiceSummary[] = res.data.map((inv: any) => ({
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId,
        customerName: inv.customerName,
        currency: inv.currency,
        exchangeRate: inv.exchangeRate,
        dueDate: inv.dueDate,
        dateOfInvoice: new Date(inv.dateOfInvoice),
        total: Number(inv.totalAmount),
        outstandingAmount: inv.outstandingAmount ?? 0,
        totalTax: inv.totalTax,
        invoiceStatus: inv.invoiceStatus,
        invoiceTypeParent: inv.invoiceTypeParent,
        invoiceType: inv.invoiceType,
      }));

      setInvoices(mapped);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || mapped.length);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, pageSize, sortBy, sortOrder, searchTerm]);

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
  const handleTakePayment = async (invoiceNumber: string) => {
    try {
      console.log("Take payment for:", invoiceNumber);

      // open payment modal or redirect
      // example
      // setPaymentInvoice(invoiceNumber);
      // setPaymentModalOpen(true);

      showSuccess(`Opening payment for invoice ${invoiceNumber}`);
    } catch (err) {
      showApiError(err);
    }
  };

  const handleReceivePayment = (inv: InvoiceSummary) => {
    setPaymentInvoice(inv);
    setPaymentOpen(true);
  };

  const fetchAllInvoicesForExport = async (): Promise<InvoiceSummary[]> => {
    try {
      let allData: InvoiceSummary[] = [];
      let current = 1;
      let total = 1;

      do {
        const res = await getAllSalesInvoices(
          current,
          100,
          sortBy,
          sortOrder,
          searchTerm,
        );

        if (res?.status_code === 200) {
          const mapped: InvoiceSummary[] = res.data.map((inv: any) => ({
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName,
            receiptNumber: inv.receiptNumber,
            currency: inv.currency,
            exchangeRate: inv.exchangeRate,
            dueDate: inv.dueDate,
            dateOfInvoice: new Date(inv.dateOfInvoice),
            total: Number(inv.totalAmount),
            totalTax: inv.totalTax,
            invoiceStatus: inv.invoiceStatus,
            invoiceTypeParent: inv.invoiceTypeParent,
            invoiceType: inv.invoiceType,
          }));

          allData = [...allData, ...mapped];
          total = res.pagination?.total_pages || 1;
        }

        current++;
      } while (current <= total);

      return allData;
    } catch (error) {
      showApiError(error);
      return [];
    }
  };

  const handleEdit = async (invoiceNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      showLoading("Loading invoice...");

      const res = await getSalesInvoiceById(invoiceNumber);

      if (!res || res.status_code !== 200) {
        closeSwal();
        showApiError("Failed to load invoice");
        return;
      }

      closeSwal();

      setEditInvoice(res.data);
      setEditOpen(true);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting Sales Invoices...");

      const dataToExport = await fetchAllInvoicesForExport();

      if (!dataToExport.length) {
        closeSwal();
        showApiError("No invoices to export");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        dataToExport.map((inv) => ({
          "Invoice No": inv.invoiceNumber,
          Type: inv.invoiceType,
          Customer: inv.customerName,
          Date: inv.dateOfInvoice.toLocaleDateString(),
          "Due Date": inv.dueDate
            ? new Date(inv.dueDate).toLocaleDateString()
            : "",
          Amount: inv.total,
          OutStanding: inv.outstandingAmount,
          Currency: inv.currency,
          Status: inv.invoiceStatus,
        })),
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Invoices");

      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "Sales_Invoices.xlsx",
      );

      closeSwal();
      showSuccess("Invoices exported successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Drawer: open + fetch (same as proforma handleView)
  const handleView = async (invoiceNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const res = await getSalesInvoiceById(invoiceNumber);
      if (res?.status_code === 200) setDrawerData(res.data as InvoiceDetail);
    } finally {
      setDrawerLoading(false);
    }
  };

  // ── Drawer: generate PDF inside drawer (same as proforma handleDrawerPdf)
  const handleDrawerPdf = async (invoiceNumber: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);
    try {
      if (!company) return;
      const res = await getSalesInvoiceById(invoiceNumber);
      if (!res || res.status_code !== 200) return;
      const blobUrl = await generateInvoicePDF(
        res.data as Invoice,
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

  // ── PDF preview modal (table row action — kept, do not remove)
  const handlePreviewPDF = async (
    inv: InvoiceSummary,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    try {
      showLoading("Preparing invoice preview...");

      if (!company) {
        closeSwal();
        showApiError("Company data not loaded");
        return;
      }

      const invoiceRes = await getSalesInvoiceById(inv.invoiceNumber);
      if (!invoiceRes || invoiceRes.status_code !== 200) {
        closeSwal();
        showApiError("Failed to load invoice");
        return;
      }

      const blobUrl = await generateInvoicePDF(
        invoiceRes.data,
        company,
        "bloburl",
      );
      closeSwal();
      setPdfUrl(blobUrl);
      setSelectedInvoice(invoiceRes.data);
      setPdfOpen(true);
    } catch (err: any) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleDownload = async (inv: InvoiceSummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Preparing invoice download...");

      if (!company) {
        closeSwal();
        showApiError("Company data not loaded");
        return;
      }

      const invoiceRes = await getSalesInvoiceById(inv.invoiceNumber);
      if (!invoiceRes || invoiceRes.status_code !== 200) {
        closeSwal();
        showApiError("Failed to load invoice");
        return;
      }

      await generateInvoicePDF(invoiceRes.data as Invoice, company, "save");
      closeSwal();
      showSuccess("Invoice downloaded successfully!");
    } catch (err: any) {
      closeSwal();
      showApiError(err);
    }
  };

  // ── PDF preview modal close (kept — do not remove)
  const handleClosePdf = () => {
    if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setSelectedInvoice(null);
    setPdfOpen(false);
  };

  const handleRowStatusChange = async (
    invoiceNumber: string,
    status: InvoiceStatus,
  ) => {
    if (CRITICAL_STATUSES.includes(status)) {
      const result = await Swal.fire({
        icon: "warning",
        title: "Confirm Status Change",
        text: `Mark invoice ${invoiceNumber} as ${status}?`,
        showCancelButton: true,
        confirmButtonColor: "#22c55e",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;
    }

    try {
      showLoading("Updating invoice status...");

    const res = await updateInvoiceStatus(invoiceNumber, status);

closeSwal();

if (!res || res.status_code !== 200) {
  showApiError(res?.message || "Failed to update invoice status");
  return;
}

// ✅ use backend response (NOT input param)
const updatedStatus = res.data?.status;

setInvoices((prev) =>
  prev.map((inv) =>
    inv.invoiceNumber === invoiceNumber
      ? { ...inv, invoiceStatus: updatedStatus }
      : inv,
  ),
);

showSuccess(`Invoice marked as ${updatedStatus}`);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };
  const handleDelete = async (invoiceNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete invoice ${invoiceNumber}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting invoice...");

      const res = await deleteSalesInvoiceById(invoiceNumber);

      if (!res || res.status_code !== 200) {
        closeSwal();
        showApiError(res?.message || "Failed to delete invoice");
        return;
      }

      closeSwal();
      setInvoices((prev) =>
        prev.filter((inv) => inv.invoiceNumber !== invoiceNumber),
      );
      showSuccess("Invoice deleted successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const columns: Column<InvoiceSummary>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice No",
      align: "left",
      sortable: true,
      render: (inv) => (
        <span className="font-semibold text-main">{inv.invoiceNumber}</span>
      ),
      tooltip: (inv) => `Invoice Number: ${inv.invoiceNumber}`,
    },
    {
      key: "invoiceType",
      header: "Type",
      align: "left",
      render: (inv) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {inv.invoiceType}
        </code>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      align: "left",
      sortable: true,
      render: (inv) => (
        <span className="text-sm text-main">{inv.customerName}</span>
      ),
      tooltip: (inv) => `Customer: ${inv.customerName}`,
    },
    {
      key: "dateOfInvoice",
      header: "Date",
      align: "left",
      render: (inv) => (
        <span className="text-xs text-muted">
          {inv.dateOfInvoice.toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      align: "left",
      sortable: true,
      render: (inv) => (
        <span className="text-xs text-muted">
          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Amount",
      align: "right",
      sortable: true,
      render: (inv) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main font-semibold whitespace-nowrap">
          {inv.total.toLocaleString()} {inv.currency}
        </code>
      ),
      tooltip: (inv) => `Total Amount: ${inv.total.toLocaleString()} ${inv.currency}`,
    },
    {
      key: "outstandingAmount",
      header: "OutStanding",
      align: "right",
      sortable: true,
      render: (inv) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main font-semibold whitespace-nowrap">
          {(inv.outstandingAmount ?? 0).toLocaleString()} {inv.currency}
        </code>
      ),
      tooltip: (inv) => `Outstanding Amount: ${(inv.outstandingAmount ?? 0).toLocaleString()} ${inv.currency}`,
    },

    {
      key: "invoiceStatus",
      header: "Status",
      align: "left",
      render: (inv) => <StatusBadge status={inv.invoiceStatus} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (inv) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e) => handleView(inv.invoiceNumber, e)}
            iconOnly
          />
          <ActionButton
            type="edit"
            onClick={(e) => handleEdit(inv.invoiceNumber, e)}
            iconOnly
            disabled={inv.invoiceStatus !== "Draft"}
            title={
              inv.invoiceStatus !== "Draft"
                ? "Only Draft invoices can be edited"
                : "Edit Invoice"
            }
          />
          <ActionMenu
            showDownload
            onDownload={(e) => handleDownload(inv, e)}
            onDelete={(e) => handleDelete(inv.invoiceNumber, e)}
            customActions={[
...(inv.invoiceStatus !== "Draft" &&
   inv.invoiceStatus !== "Cancelled" &&
   inv.outstandingAmount > 0
  ? [
      {
        label: "Receive Payment",
        onClick: () => handleReceivePayment(inv),
      },
    ]
  : []),
              {
                label: "View PDF",
                onClick: () => handlePreviewPDF(inv),
              },
              ...(STATUS_TRANSITIONS[inv.invoiceStatus] ?? []).map(
                (status) => ({
                  label: `Mark as ${status}`,
                  danger: status === "Paid",
                  onClick: () =>
                    handleRowStatusChange(inv.invoiceNumber, status),
                }),
              ),
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="p-8">
      <Table
        columns={columns}
        data={invoices}
        rowKey={(row) => row.invoiceNumber}
        loading={loading || initialLoad}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Invoice"
        onAdd={onAddInvoice}
        enableColumnSelector
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

      {/* ── Drawer modal ── */}
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
          generateInvoicePDF(drawerData as unknown as Invoice, company, "save")
        }
        onClosePdf={() => {
          if (drawerPdfUrl?.startsWith("blob:"))
            URL.revokeObjectURL(drawerPdfUrl);
          setDrawerPdfUrl(null);
        }}
      />

      {/* ── PDF Preview modal — kept, used by handleClosePdf ── */}
      <PdfPreviewModal
        open={pdfOpen}
        title="Invoice Preview"
        pdfUrl={pdfUrl}
        onClose={handleClosePdf}
        onDownload={() =>
          selectedInvoice &&
          company &&
          generateInvoicePDF(selectedInvoice, company, "save")
        }
      />
      <PaymentEntryModal
        isOpen={paymentOpen}
        onClose={() => {
          setPaymentOpen(false);
          setPaymentInvoice(null);
        }}
        defaultValues={
          paymentInvoice
            ? {
                paymentType: "Receive",
                partyType: "Customer",
                partyName: paymentInvoice.customerName,
                partyId: paymentInvoice.customerId,
                amount: paymentInvoice.outstandingAmount,
                referenceName: paymentInvoice.invoiceNumber,
                referenceType: "Sales Invoice",
              }
            : undefined
        }
      />

      <InvoiceModal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditInvoice(null);
        }}
        mode="edit"
        initialData={editInvoice}
        onSubmit={async (data) => {
          try {
            if (!editInvoice?.invoiceNumber) {
              showApiError("Invalid invoice selected");
              return;
            }

            showLoading("Updating invoice...");

            const res = await editSalesInvoice(editInvoice.invoiceNumber, data);

            closeSwal();

            if (!res || res.status_code !== 200) {
              showApiError(res?.message || "Failed to update invoice");
              return;
            }

            showSuccess("Invoice updated successfully");

            setEditOpen(false);
            setEditInvoice(null);

            fetchInvoices();
          } catch (err) {
            closeSwal();
            showApiError(err);
          }
        }}
      />
    </div>
  );
};

export default InvoiceTable;
