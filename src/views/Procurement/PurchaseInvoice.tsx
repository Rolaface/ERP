import React, { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import PurchaseInvoiceView from "../../views/Procurement/PurchaseInvoiceView";
import Table from "../../components/ui/Table/Table";
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
import { REFRESH_KEYS, useDataRefreshStore } from "../../store/dataRefreshStore";
import { fireManagedSwal } from "../../utils/swalManager";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Purchaseinvoice {
  pId: string;
  supplier: string;
  podate: string;
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

// ── Status color map (matches Customer badge pattern)
const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-yellow-100 text-yellow-700",
  Submitted: "bg-blue-100 text-blue-700",
  Approved: "bg-green-100 text-green-700",
  Paid: "bg-green-100 text-green-700",
  Unpaid: "bg-red-100 text-red-600",
  "Party Paid": "bg-purple-100 text-purple-700",
  Return: "bg-orange-100 text-orange-700",
  Cancelled: "bg-gray-100 text-gray-500",
  "Debit Note Issued": "bg-pink-100 text-pink-700",
  "Internal Transfer": "bg-cyan-100 text-cyan-700",
};

// ─── Component ────────────────────────────────────────────────────────────────

const PurchaseinvoicesTable: React.FC<PurchaseinvoicesTableProps> = ({ onAdd }) => {
  const { openPICreate, openPIEdit } = useOutletContext<OutletContextType>();
  const { can } = usePermission();
  const mountedRef = useRef(true);

  const subscribeToRefresh = useDataRefreshStore((s) => s.subscribeToRefresh);

  // ── Data state — split loading so page changes don't flash skeleton
  const [orders, setOrders] = useState<Purchaseinvoice[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // ── Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<PurchaseInvoiceFilters>({});

  // ── Company
  const [company, setCompany] = useState<any | null>(null);

  // ── Selected invoice (for view/edit/PDF)
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // ── Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<PurchaseInvoiceDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);

  // ── PDF preview modal
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // ── Debounced search → filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm || undefined }));
      setPage(1);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Load company once
  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => { if (res?.status_code === 200) setCompany(res.data); })
      .catch((err) => showApiError(err));
  }, []);

  // ── Fetch invoices — memoized with useCallback
  // IMPORTANT: defined before handleMakePayment so onSuccess can close over it
  const fetchInvoice = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);

    try {
      const res = await getPurchaseInvoices(page, pageSize, filters);

      if (!mountedRef.current) return;

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
      }));

      setOrders(mappedInvoice);
    } catch (err) {
      showApiError(err);
      setOrders([]);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, filters]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchInvoice();
    return () => { mountedRef.current = false; };
  }, []);

  // Refetch on dependency change (skip initial)
  useEffect(() => {
    if (isInitialLoad) return;
    fetchInvoice();
  }, [page, pageSize, filters]);

  // Auto-refresh on external events
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.PURCHASE_INVOICE_LIST, fetchInvoice);
    return unsubscribe;
  }, [subscribeToRefresh, fetchInvoice]);

  // ── Helpers
  const formatDate = (date: string | Date) => {
    if (!date) return "—";
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    if (typeof date === "string") {
      const [year, month, day] = date.split("T")[0].split("-").map(Number);
      return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
    }
    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  // ── Action handlers
  const handleAddClick = () => { setSelectedInvoice(null); openPICreate(); };

  const handleEdit = (invoice: Purchaseinvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (invoice.status !== "Draft") { showApiError("Only Draft purchase invoices can be edited"); return; }
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

      if (res.status < 200 || res.status >= 300) { closeSwal(); showApiError("Delete failed"); return; }

      closeSwal();
      showSuccess("Purchase Invoice deleted successfully");
      await fetchInvoice();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleViewClick = async (pId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const res = await getPurchaseInvoiceById(pId);
      if (res?.status === "success") setDrawerData(res.data as PurchaseInvoiceDetail);
      else showApiError(res);
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleDrawerPdf = async (pId: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);
    try {
      if (!company) { showApiError("Company data not loaded"); return; }
      const res = await getPurchaseInvoiceById(pId);
      if (!res || res.status !== "success") { showApiError(res); return; }
      const blobUrl = await generatePurchaseInvoicePDF(res.data, company, "bloburl");
      setDrawerPdfUrl(blobUrl);
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerPdfLoading(false);
    }
  };

  const handleOpenPDF = async (invoice: Purchaseinvoice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Generating PDF...");
      if (!company) { closeSwal(); showApiError("Company data not loaded"); return; }

      const res = await getPurchaseInvoiceById(invoice.pId);
      if (!res || res.status !== "success") { closeSwal(); showApiError(res?.message || "Failed to load invoice"); return; }

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

  // Defined AFTER fetchInvoice so onSuccess can call it directly
  const handleMakePayment = useCallback(async (pId: string) => {
    try {
      showLoading("Opening payment...");
      const res = await getPurchaseInvoiceById(pId);
      closeSwal();

      if (!res || res.status !== "success") { showApiError("Failed to load invoice"); return; }

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
          onSuccess: (result) => {
            fetchInvoice();
            useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.PURCHASE_INVOICE_LIST);
            const paymentId =
              typeof result === "string" ? result : (result as any)?.paymentId ?? (result as any)?.id ?? "";
            showSuccess(paymentId ? `Payment ${paymentId} created` : "Payment created successfully");
          },
        },
      );
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  }, [fetchInvoice]);

  const handleStatusChange = async (pId: string, newStatus: PIStatus) => {
    try {
      showLoading("Updating status...");
      const res = await updatePurchaseinvoiceStatus(pId, newStatus);
      closeSwal();
      if (!res || res.status_code !== 200) { showApiError(res || "Failed to update Purchase Invoice status"); return; }
      await fetchInvoice();
      showSuccess("Purchase Invoice updated");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  // ── Export
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
      if (!dataToExport.length) { closeSwal(); showApiError("No purchase invoices to export"); return; }

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

  // ── Columns — styled to match CustomerManagement
  const columns: Column<Purchaseinvoice>[] = [
    {
      key: "pId",
      header: "PI ID",
      align: "left",
      render: (o) => (
        <span className="font-medium whitespace-nowrap">{o.pId ?? "—"}</span>
      ),
      tooltip: (o) => o.pId,
    },
    {
      key: "supplier",
      header: "Supplier",
      align: "left",
      render: (o) => (
        <span className="font-medium block">{o.supplier ?? "—"}</span>
      ),
      tooltip: (o) => o.supplier,
    },
    {
      key: "podate",
      header: "PI Date",
      align: "left",
      render: (o) => (
        <span className="text-muted whitespace-nowrap">
          {o.podate ? formatDate(o.podate) : "—"}
        </span>
      ),
    },
    {
      key: "deliveryDate",
      header: "Delivery Date",
      align: "left",
      render: (o) => (
        <span className="text-muted whitespace-nowrap">
          {o.deliveryDate ? formatDate(o.deliveryDate) : "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "center",
      render: (o) => (
        <code className="text-xs px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
          {Number(o.amount || 0).toFixed(2)}
        </code>
      ),
    },
    {
      key: "grandTotalWithTax",
      header: "Grand Total",
      align: "center",
      render: (o) => (
        <code className="text-xs px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
          {Number(o.grandTotalWithTax || 0).toFixed(2)}
        </code>
      ),
    },
    {
      key: "outstanding_amount",
      header: "Outstanding",
      align: "center",
      render: (o) => (
        <code className="text-xs px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
          {Number(o.outstanding_amount || 0).toFixed(2)}
        </code>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (o) => {
        const displayStatus = o.status === "Submitted" ? "Approved" : o.status;
        return (
          <span
            className={`inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
              STATUS_COLORS[displayStatus] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {displayStatus}
          </span>
        );
      },
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
            {...(can(PI_MODULE, "delete")
              ? { onDelete: (e) => handleDelete(o, e as any) }
              : {})}
            customActions={[
              { label: "View PDF", onClick: () => handleOpenPDF(o) },
              ...(can(PAYMENT_MODULE, "create") && Number(o.outstanding_amount || 0) > 0
                ? [{ label: "Make Payment", onClick: () => handleMakePayment(o.pId) }]
                : []),
              ...(can(PI_MODULE, "write")
                ? (STATUS_TRANSITIONS[o.status as PIStatus] ?? []).map((status) => ({
                    label:
                      status === "Submitted" ? "Approve"
                      : status === "Cancelled" ? "Cancel"
                      : status,
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

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={orders}
        tableId="purchase-invoices"
        rowKey={(r) => r.pId}
        loading={isInitialLoad}
        isFetching={isFetching}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
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
        pageSizeOptions={[10, 25, 50, 100]}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        extraFilters={
          <>
            <FilterSelect
              value={filters.status}
              options={invoiceStatusOptions}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value || undefined }));
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

      <PurchaseInvoiceDetailModal
        open={drawerOpen}
        data={drawerData}
        loading={drawerLoading}
        onClose={() => { setDrawerOpen(false); setDrawerData(null); setDrawerPdfUrl(null); }}
        pdfUrl={drawerPdfUrl}
        pdfLoading={drawerPdfLoading}
        onViewPdf={() => drawerData && handleDrawerPdf(drawerData.piId)}
        onDownload={() => drawerData && company && generatePurchaseInvoicePDF(drawerData, company, "save")}
        onClosePdf={() => {
          if (drawerPdfUrl?.startsWith("blob:")) URL.revokeObjectURL(drawerPdfUrl);
          setDrawerPdfUrl(null);
        }}
      />

      <PdfPreviewModal
        open={pdfOpen}
        title="Purchase Invoice Preview"
        pdfUrl={pdfUrl}
        onClose={() => {
          if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
          setPdfOpen(false);
        }}
        onDownload={() => { if (selectedInvoice && company) generatePurchaseInvoicePDF(selectedInvoice, company, "save"); }}
      />

      {viewModalOpen && selectedInvoice && (
        <PurchaseInvoiceView
          piData={selectedInvoice}
          onClose={() => setViewModalOpen(false)}
          onEdit={() => { setViewModalOpen(false); openPIEdit(selectedInvoice.pId); }}
        />
      )}
    </div>
  );
};

export default PurchaseinvoicesTable;