import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import PurchaseInvoiceView from "../../views/Procurement/PurchaseInvoiceView";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { openPaymentEntryModal } from "../../store/modalStore";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import { getPurchaseInvoices } from "../../api/procurement/PurchaseInvoiceApi";
import { updatePurchaseinvoiceStatus } from "../../api/procurement/PurchaseInvoiceApi";
import { deletePi } from "../../api/procurement/PurchaseInvoiceApi";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getPurchaseInvoiceById } from "../../api/procurement/PurchaseInvoiceApi";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";
import { PurchaseInvoiceFilters } from "../../api/procurement/PurchaseInvoiceApi";
import { generatePurchaseInvoicePDF } from "../../components/template/purchaseinvoicetemplete";
import { getCompanyById } from "../../api/companySetupApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import PdfPreviewModal from ".././Sales/PdfPreviewModal";
import PurchaseInvoiceDetailModal, {
  type PurchaseInvoiceDetail,
} from "../../components/procurement/purchaseinvoice/PurchaseInvoiceDetailsModal";
import { openScanPIModal } from "../../store/modalStore";
import {
  REFRESH_KEYS,
  useDataRefreshStore,
} from "../../store/dataRefreshStore";
import { fireManagedSwal } from "../../utils/swalManager";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";


interface Purchaseinvoice {
  pId: string;
  supplier: string;
  podate: string;
  currency?: string;
  amount: number;
  grandTotal: number;
  grandTotalWithTax: number;
  status: string;
  deliveryDate: string;
  registrationType: string;
  outstanding_amount: number;
}

interface PurchaseinvoicesTableProps {
  onAdd?: () => void;
}

export type PIStatus =
  | "Draft"
  | "Return"
  | "Submitted"
  | "Paid"
  | "Unpaid"
  | "Party Paid"
  | "Cancelled"
  | "Internal Transfer"
  | "Debit Note Issued";

const STATUS_TRANSITIONS: Record<PIStatus, PIStatus[]> = {
  Draft: ["Submitted", "Cancelled"],
  Submitted: ["Paid", "Unpaid", "Cancelled", "Return"],
  Unpaid: ["Paid", "Cancelled"],
  Paid: ["Debit Note Issued", "Return"],
  "Party Paid": ["Paid", "Debit Note Issued"],
  Return: ["Debit Note Issued"],
  "Debit Note Issued": [],
  "Internal Transfer": [],
  Cancelled: [],
};

const invoiceStatusOptions = [
  { label: "Draft", value: "Draft" },
  { label: "Approved", value: "Submitted" },
  { label: "Unpaid", value: "Unpaid" },
  { label: "Paid", value: "Paid" },
  { label: "Party Paid", value: "Party Paid" },
  { label: "Cancelled", value: "Cancelled" },
];

type OutletContextType = {
  openPICreate: () => void;
  openPIEdit: (pId: string | number) => void;
};

const PI_MODULE = "Purchase Invoice";
const PAYMENT_MODULE = "Payment Entry";

const PurchaseinvoicesTable: React.FC<PurchaseinvoicesTableProps> = ({
  onAdd,
}) => {
  const { openPICreate, openPIEdit } = useOutletContext<OutletContextType>();
  const [orders, setOrders] = useState<Purchaseinvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [filters, setFilters] = useState<PurchaseInvoiceFilters>({});
  const [company, setCompany] = useState<any | null>(null);
  const { can } = usePermission();
  // ── PDF preview modal
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // ── Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<PurchaseInvoiceDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm || undefined }));
      setPage(1);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) setCompany(res.data);
      })
      .catch((err) => showApiError(err));
  }, []);

  // ── Fetch invoices ──────────────────────────
  // IMPORTANT: fetchInvoice must be defined BEFORE handleMakePayment
  // so the onSuccess callback can close over the latest reference.
  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);

      const res = await getPurchaseInvoices(page, pageSize, filters);

      if (!res?.data || res.data.length === 0) {
        setOrders([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);

      const mappedInvoice = res.data.map((pi: any) => ({
        pId: pi.pId,
        supplier: pi.supplierName,
        podate: pi.poDate,
        deliveryDate: pi.deliveryDate,
        amount: pi.grandTotal,
        grandTotal: pi.grandTotal,
        status: pi.status,
        registrationType: pi.registrationType,
        grandTotalWithTax: pi.grandTotalWithTax,
        outstanding_amount: pi.outstanding_amount,
        currency: pi.currency
      }));

      setOrders(mappedInvoice);
    } catch (err) {
      showApiError(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const subscribeToRefresh = useDataRefreshStore(
    (state) => state.subscribeToRefresh,
  );

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(
      REFRESH_KEYS.PURCHASE_INVOICE_LIST,
      fetchInvoice,
    );
    return () => unsubscribe();
  }, [subscribeToRefresh, fetchInvoice]);

  // ── Make Payment ────────────────────────────
  // Defined AFTER fetchInvoice so the onSuccess callback can call it directly.
  // We also trigger via the store key as a belt-and-suspenders approach.
  const handleMakePayment = useCallback(async (pId: string) => {
    try {
      showLoading("Opening payment...");
      const res = await getPurchaseInvoiceById(pId);
      closeSwal();

      if (!res || res.status !== "success") {
        showApiError("Failed to load invoice");
        return;
      }

      const data = res.data ?? {};

      openPaymentEntryModal(
        {
          paymentType: "Pay",
          partyType: "Supplier",
          partyName: data.supplierName,
          partyId: data.supplierId ?? data.pId,
          amount: data.grandTotal,
          referenceName: data.pId,
          referenceType: "Purchase Invoice",
        },
        false,
        {
          // onSuccess is called by GlobalModalHandler's handleSubmit
          // when PaymentEntryModal calls its onSubmit prop successfully.
          onSuccess: (result) => {
            // 1. Directly call fetchInvoice (most reliable — no subscription lag)
            fetchInvoice();
            // 2. Also trigger the store key so any other subscribers update too
            useDataRefreshStore
              .getState()
              .triggerRefresh(REFRESH_KEYS.PURCHASE_INVOICE_LIST);

            const paymentId =
              typeof result === "string"
                ? result
                : (result as any)?.paymentId ?? (result as any)?.id ?? "";
            showSuccess(paymentId ? `Payment ${paymentId} created` : "Payment created successfully");
          },
        },
      );
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  }, [fetchInvoice]);

  // ── Drawer: open + fetch ────────────────────
  const handleViewClick = async (pId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const res = await getPurchaseInvoiceById(pId);
      if (res?.status === "success") {
        setDrawerData(res.data as PurchaseInvoiceDetail);
      } else {
        showApiError(res);
      }
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // ── Drawer: generate PDF ────────────────────
  const handleDrawerPdf = async (pId: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);
    try {
      if (!company) {
        showApiError("Company data not loaded");
        return;
      }
      const res = await getPurchaseInvoiceById(pId);
      if (!res || res.status !== "success") {
        showApiError(res);
        return;
      }
      const blobUrl = await generatePurchaseInvoicePDF(res.data, company, "bloburl");
      setDrawerPdfUrl(blobUrl);
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerPdfLoading(false);
    }
  };

  // ── PDF preview modal (table row "View PDF" action) ─────────
  const handleOpenPDF = async (invoice: Purchaseinvoice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Generating PDF...");

      if (!company) {
        closeSwal();
        showApiError("Company data not loaded");
        return;
      }

      const res = await getPurchaseInvoiceById(invoice.pId);
      if (!res || res.status !== "success") {
        closeSwal();
        showApiError(res?.message || "Failed to load invoice");
        return;
      }

      const blobUrl = await generatePurchaseInvoicePDF(res.data, company, "bloburl");
      closeSwal();
      setSelectedInvoice(res.data);
      setPdfUrl(blobUrl);
      setPdfOpen(true);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Modal handlers ──────────────────────────
  const handleAddClick = () => {
    setSelectedInvoice(null);
    openPICreate();
  };

  const handleEdit = (invoice: Purchaseinvoice, e: React.MouseEvent) => {
    e.stopPropagation();

    if (invoice.status !== "Draft") {
      showApiError("Only Draft purchase invoices can be edited");
      return;
    }

    setSelectedInvoice(invoice);
    openPIEdit(invoice.pId);
  };

  const handleDelete = async (invoice: Purchaseinvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirm = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete Purchase Invoice ${invoice.pId}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      showLoading("Deleting Purchase Invoice...");

      const res = await deletePi(invoice.pId);

      if (res.status < 200 || res.status >= 300) {
        closeSwal();
        showApiError("Delete failed");
        return;
      }

      closeSwal();
      showSuccess("Purchase Invoice deleted successfully");
      await fetchInvoice();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Export ──────────────────────────────────
  const fetchAllPIForExport = async () => {
    try {
      let allData: Purchaseinvoice[] = [];
      let currentPage = 1;
      let totalPagesLocal = 1;

      do {
        const res = await getPurchaseInvoices(currentPage, 100, filters);

        if (res?.status_code === 200) {
          const mapped = res.data.map((pi: any) => ({
            pId: pi.pId,
            supplier: pi.supplierName,
            podate: pi.poDate,
            deliveryDate: pi.deliveryDate,
            amount: pi.grandTotal,
            grandTotal: pi.grandTotal,
            status: pi.status,
            registrationType: pi.registrationType,
            outstanding_amount: pi.outstanding_amount,
            currency: pi.currency,
          }));
          allData = [...allData, ...mapped];
          totalPagesLocal = res.pagination?.total_pages || 1;
        }

        currentPage++;
      } while (currentPage <= totalPagesLocal);

      return allData;
    } catch (error) {
      showApiError(error);
      return [];
    }
  };

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting Purchase Invoices...");

      const dataToExport = await fetchAllPIForExport();

      if (!dataToExport.length) {
        closeSwal();
        showApiError("No purchase invoices to export");
        return;
      }

      const formattedData = dataToExport.map((pi) => ({
        "PI ID": pi.pId,
        Supplier: pi.supplier,
        "PO Date": pi.podate,
        "Delivery Date": pi.deliveryDate,
        "Registration Type": pi.registrationType,
        Amount: pi.amount,
        grandTotal: pi.grandTotal,
        Status: pi.status,
        outstanding_amount: pi.outstanding_amount,
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Invoices");

      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "All_Purchase_Invoices.xlsx",
      );

      closeSwal();
      showSuccess("Export completed successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleStatusChange = async (pId: string, newStatus: PIStatus) => {
    try {
      showLoading("Updating status...");

      const res = await updatePurchaseinvoiceStatus(pId, newStatus);

      closeSwal();

      if (!res || res.status_code !== 200) {
        showApiError(res || "Failed to update Purchase Invoice status");
        return;
      }

      await fetchInvoice();
      showSuccess(`Purchase Invoice updated`);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };
  const formatDate = (date: string | Date) => {
    if (!date) return "";

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    if (typeof date === "string") {
      const [year, month, day] = date.split("T")[0].split("-").map(Number);
      return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
    }

    // Date object — use local methods
    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };


  const columns: Column<Purchaseinvoice>[] = [
    {
      key: "pId",
      header: "PI ID",
      align: "left",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">
            {o.pId || "—"}
          </span>
        </div>
      ),
      tooltip: (o) => o.pId || "—",
    },
    {
      key: "supplier",
      header: "Supplier",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">
            {o.supplier || "—"}
          </span>
        </div>
      ),
      tooltip: (o) => o.supplier || "—",
    },
    {
      key: "podate",
      header: "PI Date",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">
            {o.podate ? formatDate(o.podate) : "—"}
          </span>
        </div>
      ),
      tooltip: (o) => o.podate || "—",
    },
    {
      key: "deliveryDate",
      header: "Delivery Date",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">
            {o.deliveryDate ? formatDate(o.deliveryDate) : "—"}
          </span>
        </div>
      ),
      tooltip: (o) => o.deliveryDate || "—",
    },
    {
      key: "currency",
      header: "Currency",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">
            {o.currency || "-"}
          </span>
        </div>
      )
    },
    {
      key: "amount",
      header: "Amount",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <code className="block whitespace-nowrap">
            {Number(o.amount || 0).toFixed(2)}
          </code>
        </div>
      ),
      tooltip: (o) => o.amount || "—",
    },
    {
      key: "grandTotalWithTax",
      header: "Grand Total",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <code className="block whitespace-nowrap">
            {Number(o.grandTotalWithTax || 0).toFixed(2)}
          </code>
        </div>
      ),
      tooltip: (o) => o.grandTotalWithTax || "—",
    },
    {
      key: "outstanding_amount",
      header: "Outstanding",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <code className="block whitespace-nowrap">
            {Number(o.outstanding_amount || 0).toFixed(2)}
          </code>
        </div>
      ),
      tooltip: (o) => o.outstanding_amount || "—",
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (o) => (
        <div className="py-1.5">
          <StatusBadge
            status={o.status === "Submitted" ? "Approved" : o.status}
          />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (o) => (
        <ActionGroup>

          <ActionButton
            type="view"
            onClick={(e) => handleViewClick(o.pId, e)}
            iconOnly
          />

          {/* Edit — needs write + Draft status */}
          <PermissionGate module={PI_MODULE} action="write">
            <ActionButton
              type="edit"
              onClick={(e) => handleEdit(o, e)}
              iconOnly
              disabled={o.status !== "Draft"}
              title={o.status !== "Draft" ? "Only Draft invoices can be edited" : "Edit Purchase Invoice"}
            />
          </PermissionGate>

          <ActionMenu
            // Delete — needs delete
            {...(can(PI_MODULE, "delete")
              ? { onDelete: (e) => handleDelete(o, e as any) }
              : {})}
            customActions={[
              { label: "View PDF", onClick: () => handleOpenPDF(o) },
              {
                label: "Scan PI",
                onClick: () => openScanPIModal(o.pId),
              },

              // Make Payment — needs Payment Entry create + outstanding > 0
              ...(can(PAYMENT_MODULE, "create") && Number(o.outstanding_amount || 0) > 0
                ? [{ label: "Make Payment", onClick: () => handleMakePayment(o.pId) }]
                : []),

              // Status transitions — needs write
              ...(can(PI_MODULE, "write")
                ? (STATUS_TRANSITIONS[o.status as PIStatus] ?? []).map((status) => ({
                  label: status === "Submitted" ? "Approve" : status === "Cancelled" ? "Cancel" : status,

                  danger: status === "Cancelled" || status === "Debit Note Issued",
                  onClick: () => handleStatusChange(o.pId, status),
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
        data={orders}
        showToolbar
        tableId="purchase-invoices"
        loading={loading}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableAdd={can(PI_MODULE, "create")}
        addLabel="Add Purchase Invoice"
        onAdd={handleAddClick}
        enableExport={can(PI_MODULE, "export")}
        onExport={handleExportExcel}
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(size) => setPageSize(size)}
        pageSizeOptions={[10, 25, 50, 100]}
        extraFilters={
          <>
            <FilterSelect
              value={filters.status}
              options={invoiceStatusOptions}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value || undefined,
                }));
                setPage(1);
              }}
            />
            <DateRangeFilter
              from={filters.from_date}
              to={filters.to_date}
              onChange={(range) => {
                setFilters((prev) => ({ ...prev, ...range }));
                setPage(1);
              }}
            />
          </>
        }
      />

      {/* ── Drawer modal ── */}
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
        onViewPdf={() => drawerData && handleDrawerPdf(drawerData.piId)}
        onDownload={() =>
          drawerData &&
          company &&
          generatePurchaseInvoicePDF(drawerData, company, "save")
        }
        onClosePdf={() => {
          if (drawerPdfUrl?.startsWith("blob:")) URL.revokeObjectURL(drawerPdfUrl);
          setDrawerPdfUrl(null);
        }}
      />

      {/* ── PDF Preview modal ── */}
      <PdfPreviewModal
        open={pdfOpen}
        title="Purchase Invoice Preview"
        pdfUrl={pdfUrl}
        onClose={() => {
          if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
          setPdfOpen(false);
        }}
        onDownload={() => {
          if (selectedInvoice && company) {
            generatePurchaseInvoicePDF(selectedInvoice, company, "save");
          }
        }}
      />

      {/* ── View modal ── */}
      {viewModalOpen && selectedInvoice && (
        <PurchaseInvoiceView
          piData={selectedInvoice}
          onClose={() => setViewModalOpen(false)}
          onEdit={() => {
            setViewModalOpen(false);
            openPIEdit(selectedInvoice.pId);
          }}
        />
      )}
    </div>
  );
};

export default PurchaseinvoicesTable;